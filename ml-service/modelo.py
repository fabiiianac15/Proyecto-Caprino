"""
Entrenamiento e inferencia del modelo de compatibilidad de cruces.

Usa RandomForestClassifier entrenado sobre datos sintéticos (dominio zootécnico).
Cuando se disponga de datos reales, se reentrenan combinando sintéticos + reales.
"""

import os
import json
import logging
import datetime
import numpy as np
import joblib
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

from data_generator import generar_dataset, FEATURE_NAMES, FEATURE_LABELS_ES

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "modelo_guardado")
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

MODEL_VERSION = "ml-compat-v1"
CONFIDENCE_THRESHOLD = 0.60


# ---------------------------------------------------------------------------
# Entrenamiento
# ---------------------------------------------------------------------------

def train(X_real: np.ndarray | None = None, y_real: np.ndarray | None = None) -> dict:
    """
    Entrena el modelo y lo guarda en disco.
    Si se proveen X_real / y_real, se combinan con los datos sintéticos.
    """
    X_synth, y_synth = generar_dataset(n=800, seed=42)

    if X_real is not None and len(X_real) > 0:
        X = np.vstack([X_synth, X_real])
        y = np.concatenate([y_synth, y_real])
        n_real = len(X_real)
    else:
        X, y = X_synth, y_synth
        n_real = 0

    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
    )
    clf.fit(X, y)

    cv_auc = cross_val_score(clf, X, y, cv=5, scoring="roc_auc")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)

    metrics = {
        "modelVersion": MODEL_VERSION,
        "datasetVersion": f"ds-{datetime.date.today()}",
        "auc_cv_mean": round(float(cv_auc.mean()), 4),
        "auc_cv_std": round(float(cv_auc.std()), 4),
        "n_total_samples": int(len(y)),
        "n_real_samples": int(n_real),
        "n_synthetic_samples": int(len(y_synth)),
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


def load_or_train() -> RandomForestClassifier:
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    train()
    return joblib.load(MODEL_PATH)


def get_metrics() -> dict:
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            return json.load(f)
    return {}


# ---------------------------------------------------------------------------
# Explicabilidad por instancia (SHAP)
# ---------------------------------------------------------------------------
# TreeExplainer es exacto y rápido para RandomForest. Se cachea por modelo para
# no reconstruirlo en cada predicción (importante para el ranking en lote).

_explainer = None
_explainer_for = None  # id() del clf al que pertenece el explainer cacheado


def _get_explainer(clf: RandomForestClassifier):
    global _explainer, _explainer_for
    if _explainer is None or _explainer_for != id(clf):
        _explainer = shap.TreeExplainer(clf)
        _explainer_for = id(clf)
    return _explainer


def _shap_values_exito(clf: RandomForestClassifier, X: np.ndarray) -> np.ndarray:
    """
    Devuelve una matriz [n_muestras, n_features] con la contribución SHAP de
    cada feature a la probabilidad de ÉXITO (clase 1), en espacio de probabilidad.
    """
    sv = np.array(_get_explainer(clf).shap_values(X))
    # Según versión, sv puede venir como [n, f, n_clases] o [n_clases, n, f]
    if sv.ndim == 3 and sv.shape[-1] == 2:
        return sv[:, :, 1]
    if sv.ndim == 3 and sv.shape[0] == 2:
        return sv[1]
    return sv  # modelo de salida única


def _shap_factores(clf: RandomForestClassifier, features: list) -> list:
    """
    Top factores que explican ESTE cruce concreto, con su contribución (con signo)
    al score. `contribucion` está en puntos de score (≈ % sobre 100).
    """
    X = np.array([features], dtype=float)
    contribs = _shap_values_exito(clf, X)[0]   # un valor por feature

    factores = []
    for i, name in enumerate(FEATURE_NAMES):
        contrib = float(contribs[i])
        if abs(contrib) < 0.005:               # descartar aportes insignificantes
            continue
        val = features[i]
        factores.append({
            "feature": name,
            "label": FEATURE_LABELS_ES.get(name, name),
            "valor": round(val, 2) if isinstance(val, float) else int(val),
            "contribucion": round(contrib, 4),                  # con signo, espacio prob.
            "puntos": int(round(contrib * 100)),                # en puntos de score (±)
            "impacto": "positivo" if contrib > 0 else "negativo",
        })

    factores.sort(key=lambda x: abs(x["contribucion"]), reverse=True)
    return factores[:5]


def predict(clf: RandomForestClassifier, features: list) -> dict:
    """
    Devuelve el score de compatibilidad y la explicación.

    `features` debe tener exactamente len(FEATURE_NAMES) valores,
    en el mismo orden que FEATURE_NAMES.
    """
    X = np.array([features], dtype=float)
    proba = clf.predict_proba(X)[0]

    # proba[1] = probabilidad de éxito (parto exitoso)
    prob_exito = float(proba[1])
    confidence = float(max(proba))
    score = int(round(prob_exito * 100))

    if confidence < CONFIDENCE_THRESHOLD:
        clasificacion = "Insuficiente información"
        mensaje = (
            "El modelo no tiene suficiente certeza para evaluar este cruce. "
            "Se recomienda registrar más datos históricos de esta pareja o razas similares."
        )
    elif score >= 72:
        clasificacion = "Recomendado"
        mensaje = "Buena compatibilidad genética. El cruce presenta factores favorables para un parto exitoso."
    elif score >= 50:
        clasificacion = "Precaución"
        mensaje = "Compatibilidad moderada. Se aconseja evaluación veterinaria adicional antes de proceder."
    else:
        clasificacion = "No recomendado"
        mensaje = "Alta probabilidad de complicaciones. Se desaconseja este cruce."

    return {
        "scoreCompatibilidad": score,
        "probExito": round(prob_exito, 4),
        "confidence": round(confidence, 4),
        "clasificacion": clasificacion,
        "predicciones": {
            "probPartoExitoso": round(prob_exito, 3),
        },
        "explicacion": {
            "topFactores": _shap_factores(clf, features),
            "mensaje": mensaje,
        },
        "metadata": {
            "modelVersion": MODEL_VERSION,
            "explainer": "shap-treeexplainer",
            **get_metrics(),
        },
    }


def _clasificar(score: int, confidence: float) -> tuple[str, str]:
    """Misma lógica de etiquetado que predict(), reutilizable en lote."""
    if confidence < CONFIDENCE_THRESHOLD:
        return "Insuficiente información", (
            "El modelo no tiene suficiente certeza para evaluar este cruce."
        )
    if score >= 72:
        return "Recomendado", "Buena compatibilidad genética."
    if score >= 50:
        return "Precaución", "Compatibilidad moderada; conviene evaluación adicional."
    return "No recomendado", "Alta probabilidad de complicaciones."


def predict_batch(clf: RandomForestClassifier, filas: list[list[float]]) -> list[dict]:
    """
    Inferencia en lote para el ranking de candidatos. Una sola llamada a
    predict_proba para todas las filas. NO calcula SHAP (se omite por velocidad;
    la explicación detallada se obtiene con predict() sobre el par elegido).
    """
    if not filas:
        return []
    X = np.array(filas, dtype=float)
    probas = clf.predict_proba(X)
    resultados = []
    for fila in probas:
        prob_exito = float(fila[1])
        confidence = float(max(fila))
        score = int(round(prob_exito * 100))
        clasificacion, _ = _clasificar(score, confidence)
        resultados.append({
            "scoreCompatibilidad": score,
            "probExito": round(prob_exito, 4),
            "confidence": round(confidence, 4),
            "clasificacion": clasificacion,
        })
    return resultados
