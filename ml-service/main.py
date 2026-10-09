"""
Microservicio ML — Compatibilidad de cruces caprinos
FastAPI + scikit-learn  ·  Puerto 8001 por defecto
"""

from __future__ import annotations

import datetime
import logging
from collections import OrderedDict
from contextlib import asynccontextmanager
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import modelo as ml
import ia_generativa as ia
import evaluador as evalmod
from rebano import FEATURE_NAMES, Rebano, dataset_real

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
    version="3.0.0",
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

class CruceInput(BaseModel):
    """Evaluación de un cruce. `rebano` es la instantánea completa del rebaño
    (ver rebano.Rebano) que arma el backend en pocas consultas."""
    rebano: dict
    macho: int
    hembra: int


class RankingInput(BaseModel):
    rebano: dict
    animal: int
    limite: int = 10
    solo_misma_raza: bool = False
    max_consanguinidad: float | None = None
    solo_disponibles: bool = False


class EntrenarInput(BaseModel):
    rebano: dict


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


@app.get("/ml/ia-health")
async def ia_health() -> dict[str, Any]:
    """Estado de la capa de IA generativa (Ollama)."""
    estado = await ia.ollama_disponible()
    return {"status": "ok", "ia": estado}


# ---------------------------------------------------------------------------
# Evaluación con la instantánea del rebaño (v3)
# ---------------------------------------------------------------------------
# El BLUP y el parentesco se calculan una vez por instantánea; se guardan las
# últimas para que la evaluación y su análisis de IA no repitan el cálculo.
_CACHE: "OrderedDict[str, evalmod.Contexto]" = OrderedDict()
_CACHE_MAX = 4


def _contexto(snap: dict) -> evalmod.Contexto:
    if _clf is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible aún")
    clave = Rebano.huella(snap)
    if clave in _CACHE:
        _CACHE.move_to_end(clave)
        return _CACHE[clave]
    ctx = evalmod.Contexto(Rebano(snap), _clf)
    _CACHE[clave] = ctx
    while len(_CACHE) > _CACHE_MAX:
        _CACHE.popitem(last=False)
    return ctx


def _validar_par(ctx: evalmod.Contexto, macho: int, hembra: int) -> None:
    for a, sexo in ((macho, "macho"), (hembra, "hembra")):
        info = ctx.r.info(a)
        if not info:
            raise HTTPException(status_code=404, detail=f"Animal {a} no está en el rebaño")
        if info.get("sexo") != sexo:
            raise HTTPException(status_code=400, detail=f"El animal {info.get('codigo') or a} no es {sexo}")
    if macho == hembra:
        raise HTTPException(status_code=400, detail="El macho y la hembra no pueden ser el mismo animal")


@app.post("/ml/cruce")
def evaluar_cruce(body: CruceInput) -> dict[str, Any]:
    """Evaluación completa de un cruce (dimensiones, predicciones, árbol de la cría)."""
    ctx = _contexto(body.rebano)
    _validar_par(ctx, body.macho, body.hembra)
    return evalmod.evaluar(ctx, body.macho, body.hembra, detalle=True)


@app.post("/ml/ranking")
def ranking(body: RankingInput) -> dict[str, Any]:
    """Mejores parejas para un animal entre los activos del sexo opuesto."""
    ctx = _contexto(body.rebano)
    if not ctx.r.info(body.animal):
        raise HTTPException(status_code=404, detail="Animal no encontrado en el rebaño")
    return evalmod.ranking(ctx, body.animal, max(1, min(body.limite, 100)), body.solo_misma_raza,
                           body.max_consanguinidad, body.solo_disponibles)


@app.get("/ml/modelo")
def estado_modelo() -> dict[str, Any]:
    return {"modelo_cargado": _clf is not None, "metricas": ml.get_metrics()}


@app.post("/ml/entrenar")
def entrenar(body: EntrenarInput) -> dict[str, Any]:
    """Reentrena con el historial real de servicios de la granja."""
    global _clf
    X, y, _ = dataset_real(Rebano(body.rebano))
    logger.info("Reentrenando con %d servicios reales…", len(y))
    metrics = ml.train(np.array(X, dtype=float) if X else None, np.array(y, dtype=int) if y else None)
    _clf = ml.load_or_train()
    _CACHE.clear()
    return {"status": "reentrenado", "metricas": metrics}


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
