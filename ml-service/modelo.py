"""
Modelo predictivo: probabilidad de que un servicio termine en parto exitoso.

Entrenamiento = conocimiento previo zootécnico (datos sintéticos) + historial
REAL de la granja. El peso de lo sintético baja a medida que hay más servicios
reales registrados, así que con suficiente historia el modelo aprende de la
propia granja (y su precisión real se mide y se informa, sin inventarla).

Precisión: se valida SOLO contra servicios reales con validación cruzada
estratificada (el modelo de cada pliegue nunca ve el servicio que predice).
Se reportan AUC (capacidad de ordenar buenos y malos cruces), Brier (error de
las probabilidades; menor es mejor) y la mejora frente a usar la tasa media
del rebaño.
"""

from __future__ import annotations

import datetime
import json
import logging
import os

import joblib
import numpy as np
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, brier_score_loss, roc_auc_score
from sklearn.model_selection import StratifiedKFold

from data_generator import generar_dataset
from rebano import FEATURE_LABELS_ES, FEATURE_NAMES, DESCONOCIDO

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "modelo_guardado")
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

MODEL_VERSION = "ml-cruces-v2"
N_SINTETICOS = 2000
# Con este número de servicios reales lo sintético pesa lo mínimo
REALES_PARA_DOMINAR = 300
PESO_SINTETICO_MIN = 0.05
MIN_REALES_PARA_VALIDAR = 30


def peso_sintetico(n_real: int) -> float:
    """Peso de cada muestra sintética frente a una real (que pesa 1)."""
    return max(PESO_SINTETICO_MIN, 1.0 - n_real / REALES_PARA_DOMINAR)


def _nuevo_clf() -> RandomForestClassifier:
    # Sin class_weight para que las probabilidades queden bien calibradas.
    return RandomForestClassifier(
        n_estimators=300, max_depth=10, min_samples_leaf=8,
        max_features="sqrt", random_state=42, n_jobs=-1,
    )


class ModeloCruces:
    """Bosque aleatorio + recalibración a la tasa real de la granja.

    El conocimiento previo asume la tasa típica caprina; cada granja tiene la
    suya. Con servicios reales se aprende un desplazamiento en escala logit para
    que la probabilidad media coincida con la de la granja (corrección de prior).
    Con pocos datos el ajuste se encoge hacia 0 para no sobrerreaccionar.
    """

    def __init__(self, clf: RandomForestClassifier, ajuste_logit: float = 0.0,
                 tasa_base: float | None = None, confianza: float = 1.0):
        self.clf = clf
        self.ajuste_logit = ajuste_logit
        # Red de seguridad: p_final = base + λ·(p − base). λ se aprende con
        # validación cruzada; si el modelo no supera a la tasa media de la granja,
        # λ → 0 y la predicción se acerca a esa tasa en vez de meter ruido.
        self.tasa_base = tasa_base
        self.confianza = confianza
        self.n_features_in_ = clf.n_features_in_

    def predict_proba_exito(self, X: np.ndarray) -> np.ndarray:
        p = np.clip(self.clf.predict_proba(X)[:, 1], 1e-4, 1 - 1e-4)
        ajuste = getattr(self, "ajuste_logit", 0.0)
        if ajuste:
            z = np.log(p / (1 - p)) + ajuste
            p = 1 / (1 + np.exp(-z))
        base, lam = getattr(self, "tasa_base", None), getattr(self, "confianza", 1.0)
        if base is not None and lam < 1.0:
            p = base + lam * (p - base)
        return p


def _lambda_optimo(y: np.ndarray, p: np.ndarray, base: float) -> float:
    """λ que minimiza el error cuadrático de base + λ·(p − base)."""
    d = p - base
    den = float((d * d).sum())
    if den <= 1e-9:
        return 0.0
    return float(np.clip(((y - base) * d).sum() / den, 0.0, 1.0))


def _logit(p):
    p = float(np.clip(p, 1e-4, 1 - 1e-4))
    return float(np.log(p / (1 - p)))


def _ajustar(X_s, y_s, X_r, y_r) -> ModeloCruces:
    n_real = len(y_r)
    X = np.vstack([X_s, X_r]) if n_real else X_s
    y = np.concatenate([y_s, y_r]) if n_real else y_s
    w = np.concatenate([np.full(len(y_s), peso_sintetico(n_real)), np.ones(n_real)]) if n_real \
        else np.ones(len(y_s))
    clf = _nuevo_clf()
    clf.fit(X, y, sample_weight=w)
    ajuste = 0.0
    if n_real >= 10:
        # Probabilidades fuera de bolsa (OOB-like) aproximadas con el propio bosque:
        # se comparan la media predicha y la tasa real de la granja.
        pred = np.clip(clf.predict_proba(X_r)[:, 1], 1e-4, 1 - 1e-4)
        tasa_real = (y_r.sum() + 5 * pred.mean()) / (n_real + 5)      # encogida
        ajuste = _logit(tasa_real) - _logit(pred.mean())
        ajuste *= n_real / (n_real + 20)                                # confianza en el ajuste
    return ModeloCruces(clf, ajuste)


def _validar_con_reales(X_s, y_s, X_r, y_r) -> tuple[dict | None, float]:
    """Validación cruzada sobre los servicios reales (honesta).
    Devuelve las métricas y el λ de confianza para el modelo final."""
    n = len(y_r)
    if n < MIN_REALES_PARA_VALIDAR or min(np.bincount(y_r, minlength=2)) < 5:
        return None, 1.0
    k = min(5, int(min(np.bincount(y_r))))
    folds = list(StratifiedKFold(n_splits=k, shuffle=True, random_state=42).split(X_r, y_r))
    crudo = np.zeros(n)
    for tr, te in folds:
        crudo[te] = _ajustar(X_s, y_s, X_r[tr], y_r[tr]).predict_proba_exito(X_r[te])
    # λ y tasa base de cada pliegue se estiman SIN ver ese pliegue
    pred = np.zeros(n)
    base = np.zeros(n)
    for tr, te in folds:
        b = float(y_r[tr].mean())
        lam = _lambda_optimo(y_r[tr], crudo[tr], b)
        pred[te] = b + lam * (crudo[te] - b)
        base[te] = b
    lam_final = _lambda_optimo(y_r, crudo, float(y_r.mean()))
    brier = brier_score_loss(y_r, pred)
    brier_base = brier_score_loss(y_r, base)
    return {
        "auc": round(float(roc_auc_score(y_r, pred)), 3),
        "brier": round(float(brier), 4),
        "brier_tasa_media": round(float(brier_base), 4),
        "mejora_vs_tasa_media": round(float(1 - brier / brier_base), 3) if brier_base > 0 else None,
        "exactitud": round(float(accuracy_score(y_r, pred >= 0.5)), 3),
        "pliegues": k,
        "confianza_modelo": round(lam_final, 2),
    }, lam_final


def train(X_real: np.ndarray | None = None, y_real: np.ndarray | None = None) -> dict:
    X_s, y_s = generar_dataset(n=N_SINTETICOS, seed=42)
    X_r = np.asarray(X_real, dtype=float).reshape(-1, len(FEATURE_NAMES)) if X_real is not None and len(X_real) \
        else np.empty((0, len(FEATURE_NAMES)))
    y_r = np.asarray(y_real, dtype=int) if y_real is not None and len(y_real) else np.empty(0, dtype=int)

    validacion, lam = _validar_con_reales(X_s, y_s, X_r, y_r)
    modelo = _ajustar(X_s, y_s, X_r, y_r)
    if validacion is not None:
        modelo.tasa_base = float(y_r.mean())
        modelo.confianza = lam
    modelo.clf.n_jobs = 1      # inferencia de una fila: sin sobrecarga de procesos

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(modelo, MODEL_PATH)

    n_real = int(len(y_r))
    metrics = {
        "modelVersion": MODEL_VERSION,
        "features": FEATURE_NAMES,
        "n_reales": n_real,
        "n_reales_exitosos": int(y_r.sum()) if n_real else 0,
        "n_sinteticos": int(len(y_s)),
        "peso_sintetico": round(peso_sintetico(n_real), 3),
        "tasa_real_granja": round(float(y_r.mean()), 3) if n_real else None,
        "ajuste_calibracion": round(modelo.ajuste_logit, 3),
        "validacion_real": validacion,
        "fuente": ("granja" if n_real >= REALES_PARA_DOMINAR
                   else "mixta" if n_real > 0 else "conocimiento_previo"),
        "entrenado": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    global _explainer
    _explainer = None
    return metrics


def get_metrics() -> dict:
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_or_train() -> ModeloCruces:
    """Carga el modelo; lo (re)entrena si no existe o es de otra versión."""
    if os.path.exists(MODEL_PATH) and get_metrics().get("modelVersion") == MODEL_VERSION:
        modelo = joblib.load(MODEL_PATH)
        if isinstance(modelo, ModeloCruces) and modelo.n_features_in_ == len(FEATURE_NAMES):
            return modelo
    logger.info("Entrenando modelo %s con el conocimiento previo…", MODEL_VERSION)
    train()
    return joblib.load(MODEL_PATH)


# ---------------------------------------------------------------------------
# Explicación por instancia (SHAP)
# ---------------------------------------------------------------------------

_explainer = None


def _shap_exito(clf, X: np.ndarray) -> np.ndarray:
    global _explainer
    if _explainer is None or getattr(_explainer, "_clf_id", None) != id(clf):
        _explainer = shap.TreeExplainer(clf)
        _explainer._clf_id = id(clf)
    sv = np.array(_explainer.shap_values(X, check_additivity=False))
    if sv.ndim == 3 and sv.shape[-1] == 2:
        return sv[:, :, 1]
    if sv.ndim == 3 and sv.shape[0] == 2:
        return sv[1]
    return sv


def _valor_legible(nombre: str, v: float):
    if v == DESCONOCIDO:
        return "sin dato"
    if nombre == "coi_cria":
        return f"{round(v * 100, 2)} %"
    if nombre in ("tasa_exito_hembra", "tasa_exito_macho"):
        return f"{round(v * 100)} %"
    if nombre == "tipo_servicio":
        return {0: "monta natural", 1: "inseminación", 2: "transferencia"}.get(int(v), v)
    if nombre == "misma_raza":
        return "sí" if v else "no"
    if nombre.startswith("mes_"):
        return None
    return round(v, 1) if v % 1 else int(v)


def predecir(modelo: ModeloCruces, features: dict, explicar: bool = True) -> dict:
    x = np.array([[float(features[n]) for n in FEATURE_NAMES]])
    prob = float(modelo.predict_proba_exito(x)[0])
    clf = modelo.clf
    out = {"probabilidad": round(prob, 4), "factores": []}
    if explicar:
        contrib = _shap_exito(clf, x)[0]
        agregados: dict[str, float] = {}
        for i, n in enumerate(FEATURE_NAMES):
            clave = "mes" if n.startswith("mes_") else n
            agregados[clave] = agregados.get(clave, 0.0) + float(contrib[i])
        factores = []
        for clave, c in agregados.items():
            if abs(c) < 0.004:
                continue
            nombre = "mes_cos" if clave == "mes" else clave
            # Un dato faltante no es un factor del cruce: mostrarlo confunde
            if clave != "mes" and float(features[nombre]) == DESCONOCIDO:
                continue
            factores.append({
                "feature": clave,
                "label": FEATURE_LABELS_ES.get(nombre, clave),
                "valor": _valor_legible(nombre, float(features[nombre])) if clave != "mes" else None,
                "puntos": round(c * 100, 1),
                "impacto": "positivo" if c > 0 else "negativo",
            })
        factores.sort(key=lambda f: -abs(f["puntos"]))
        out["factores"] = factores[:6]
    return out


def predecir_lote(modelo: ModeloCruces, filas: list[list[float]]) -> list[float]:
    if not filas:
        return []
    return [float(p) for p in modelo.predict_proba_exito(np.array(filas, dtype=float))]
