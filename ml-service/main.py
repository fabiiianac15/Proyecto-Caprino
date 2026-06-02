"""
Microservicio ML — Compatibilidad de cruces caprinos
FastAPI + scikit-learn  ·  Puerto 8001 por defecto
"""

from __future__ import annotations

import datetime
import logging
from contextlib import asynccontextmanager
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

import modelo as ml
import ia_generativa as ia
import evaluador as evalmod
from data_generator import FEATURE_NAMES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Estado global del modelo
# ---------------------------------------------------------------------------
_clf = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _clf
    logger.info("Cargando o entrenando modelo ML…")
    _clf = ml.load_or_train()
    logger.info("Modelo listo.")
    yield


app = FastAPI(
    title="ML Compatibilidad Caprina",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas de entrada / salida
# ---------------------------------------------------------------------------

class CompatibilidadInput(BaseModel):
    """
    Todos los valores deben enviarse como números.
    Los booleanos se codifican como 0 o 1.
    """
    ancestros_comunes_count: float
    relacion_directa: float
    mismos_padres_completos: float
    mismo_padre: float
    misma_madre: float
    edad_macho_meses: float
    edad_hembra_meses: float
    misma_raza: float
    eventos_salud_macho_12m: float
    eventos_salud_hembra_12m: float
    partos_exitosos_hembra: float
    total_partos_hembra: float
    num_crias_promedio: float
    generaciones_conocidas_macho: float
    generaciones_conocidas_hembra: float

    def to_feature_list(self) -> list[float]:
        return [getattr(self, name) for name in FEATURE_NAMES]


class BatchInput(BaseModel):
    """
    Lote de cruces para el ranking de candidatos.
    `items`: lista de cruces, cada uno con las 15 features (mismo esquema que
    CompatibilidadInput). Devuelve un score por cada item, en el mismo orden.
    """
    items: list[CompatibilidadInput]


class EvaluarInput(BaseModel):
    """
    Entrada del motor de evaluación multidimensional.

    - datos: registros crudos recolectados por el backend desde Oracle
      (producción, salud, reproducción, pedigrí, raza…). Ver evaluador._DATOS_EJEMPLO.
    - ml_features: las 15 features para el RandomForest (probabilidad de parto
      exitoso). Opcional: si no llega, esa dimensión usa solo el historial.
    """
    datos: dict
    ml_features: list[float] | None = None


class EvaluarBatchInput(BaseModel):
    """Lote de cruces para el ranking (cada item con datos + ml_features)."""
    items: list[EvaluarInput]


class AnalisisIaInput(BaseModel):
    """
    Entrada para la narrativa generada por IA, fundamentada en la evaluación.

    - evaluacion: el informe que devuelve POST /ml/evaluar.
    - animales: {macho:{nombre,codigo}, hembra:{...}} para encabezar el texto.
    """
    evaluacion: dict
    animales: dict = {}


class AnalisisRankingInput(BaseModel):
    """Entrada para el resumen comparativo del ranking de candidatos."""
    animal_base: dict
    ranking: list[dict]


class TrainInput(BaseModel):
    """
    Datos reales para reentrenamiento.
    X: lista de muestras, cada una con 15 features en el orden de FEATURE_NAMES.
    y: etiquetas binarias (1=éxito, 0=fallo).
    """
    X: list[list[float]]
    y: list[int]

    @field_validator("y")
    @classmethod
    def check_binary(cls, v: list[int]) -> list[int]:
        if any(val not in (0, 1) for val in v):
            raise ValueError("y solo puede contener 0 o 1")
        return v

    @field_validator("X")
    @classmethod
    def check_features(cls, v: list[list[float]]) -> list[list[float]]:
        expected = len(FEATURE_NAMES)
        for row in v:
            if len(row) != expected:
                raise ValueError(
                    f"Cada fila de X debe tener {expected} features; "
                    f"se recibieron {len(row)}"
                )
        return v


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/ml/health")
def health() -> dict[str, Any]:
    metrics = ml.get_metrics()
    return {
        "status": "ok",
        "model_loaded": _clf is not None,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "metrics": metrics,
        "feature_names": FEATURE_NAMES,
    }


@app.post("/ml/compatibilidad")
def compatibilidad(body: CompatibilidadInput) -> dict[str, Any]:
    if _clf is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible aún")

    features = body.to_feature_list()
    result = ml.predict(_clf, features)
    return result


@app.post("/ml/compatibilidad-batch")
def compatibilidad_batch(body: BatchInput) -> dict[str, Any]:
    """Inferencia en lote para el ranking de candidatos (sin SHAP, por velocidad)."""
    if _clf is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible aún")
    filas = [item.to_feature_list() for item in body.items]
    resultados = ml.predict_batch(_clf, filas)
    return {"resultados": resultados, "total": len(resultados)}


@app.get("/ml/ia-health")
async def ia_health() -> dict[str, Any]:
    """Estado de la capa de IA generativa (Ollama)."""
    estado = await ia.ollama_disponible()
    return {"status": "ok", "ia": estado}


def _ml_prob_conf(features: list[float] | None) -> tuple[float | None, float | None]:
    """Probabilidad de parto exitoso y confianza del RandomForest (o None)."""
    if not features or _clf is None:
        return None, None
    proba = _clf.predict_proba(np.array([features], dtype=float))[0]
    return float(proba[1]), float(max(proba))


@app.post("/ml/evaluar")
def evaluar(body: EvaluarInput) -> dict[str, Any]:
    """Evaluación multidimensional fundamentada en los datos reales del cruce."""
    prob, conf = _ml_prob_conf(body.ml_features)
    return evalmod.evaluar(body.datos, ml_prob=prob, ml_conf=conf)


@app.post("/ml/evaluar-batch")
def evaluar_batch(body: EvaluarBatchInput) -> dict[str, Any]:
    """Evaluación en lote para el ranking. Devuelve el resumen de cada cruce."""
    resumenes = []
    for it in body.items:
        prob, conf = _ml_prob_conf(it.ml_features)
        ev = evalmod.evaluar(it.datos, ml_prob=prob, ml_conf=conf)
        # Niveles clave para mostrar en la fila del ranking, sin todo el detalle.
        niveles = {d["id"]: d["nivel"] for d in ev["dimensiones"]}
        resumenes.append({
            "scoreGlobal": ev["scoreGlobal"],
            "clasificacion": ev["clasificacion"],
            "confianzaGlobal": ev["confianzaGlobal"],
            "nivelConsanguinidad": niveles.get("consanguinidad"),
            "nivelFertilidad": niveles.get("fertilidad"),
            "nivelPartoExitoso": niveles.get("parto_exitoso"),
        })
    return {"resultados": resumenes, "total": len(resumenes)}


@app.post("/ml/analisis-ia")
async def analisis_ia(body: AnalisisIaInput):
    """
    Narra el informe de evaluación en streaming (text/plain), fundamentado en su
    evidencia. No recalcula nada: interpreta el informe de /ml/evaluar.
    """
    if not isinstance(body.evaluacion, dict) or "dimensiones" not in body.evaluacion:
        raise HTTPException(status_code=400, detail="evaluacion inválida o incompleta")

    async def gen():
        async for token in ia.generar_evaluacion_stream(body.evaluacion, body.animales):
            yield token

    return StreamingResponse(
        gen(),
        media_type="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@app.post("/ml/analisis-ranking")
async def analisis_ranking(body: AnalisisRankingInput):
    """Resumen comparativo del ranking en streaming (text/plain)."""
    if not body.ranking:
        raise HTTPException(status_code=400, detail="ranking vacío")

    async def gen():
        async for token in ia.generar_ranking_stream(body.animal_base, body.ranking):
            yield token

    return StreamingResponse(
        gen(),
        media_type="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@app.post("/ml/train")
def retrain(body: TrainInput) -> dict[str, Any]:
    """
    Reentrenar el modelo incorporando datos reales.
    Solo accessible para administradores (proteger en producción con JWT).
    """
    global _clf

    X_real = np.array(body.X, dtype=float)
    y_real = np.array(body.y, dtype=int)

    if len(X_real) != len(y_real):
        raise HTTPException(status_code=400, detail="X e y deben tener la misma longitud")

    logger.info(f"Reentrenando con {len(y_real)} muestras reales…")
    metrics = ml.train(X_real=X_real, y_real=y_real)
    _clf = ml.load_or_train()

    return {"status": "reentrenado", "metrics": metrics}
