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
from pydantic import BaseModel, field_validator

import modelo as ml
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
