"""
Entrenamiento e inferencia del modelo de compatibilidad de cruces.

Usa RandomForestClassifier entrenado sobre datos sintéticos (dominio zootécnico).
Cuando se disponga de datos reales, se reentrenan combinando sintéticos + reales.
"""

import os
import json
import datetime
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

from data_generator import generar_dataset, FEATURE_NAMES, FEATURE_LABELS_ES

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
# Inferencia
# ---------------------------------------------------------------------------

def _determinar_impacto(feature: str, valor: float) -> str:
    if feature == "relacion_directa":
        return "negativo" if valor else "neutro"
    if feature in ("mismos_padres_completos", "mismo_padre", "misma_madre"):
        return "negativo" if valor else "neutro"
    if feature == "ancestros_comunes_count":
        return "negativo" if valor > 0 else "positivo"
    if feature == "edad_macho_meses":
        return "positivo" if 12 <= valor <= 72 else "negativo"
    if feature == "edad_hembra_meses":
        return "positivo" if 10 <= valor <= 60 else "negativo"
    if feature in ("eventos_salud_macho_12m", "eventos_salud_hembra_12m"):
        if valor > 4:
            return "negativo"
        return "positivo" if valor == 0 else "neutro"
    if feature == "partos_exitosos_hembra":
        return "positivo" if valor > 0 else "neutro"
    if feature == "num_crias_promedio":
        return "positivo" if valor > 1.3 else "neutro"
    return "neutro"


def _top_factores(clf: RandomForestClassifier, features: list) -> list:
    importances = clf.feature_importances_
    factores = []
    for i, name in enumerate(FEATURE_NAMES):
        imp = float(importances[i])
        if imp < 0.025:
            continue
        val = features[i]
        factores.append({
            "feature": name,
            "label": FEATURE_LABELS_ES.get(name, name),
            "impacto": _determinar_impacto(name, val),
            "valor": round(val, 2) if isinstance(val, float) else int(val),
            "importancia": round(imp, 3),
        })

    factores.sort(key=lambda x: x["importancia"], reverse=True)
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
            "topFactores": _top_factores(clf, features),
            "mensaje": mensaje,
        },
        "metadata": {
            "modelVersion": MODEL_VERSION,
            **get_metrics(),
        },
    }
