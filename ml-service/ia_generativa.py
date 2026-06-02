"""
Capa de IA generativa local (Ollama) para el módulo de Genealogía.

Responsabilidad: INTERPRETAR los resultados del modelo de Machine Learning y
redactar un análisis profesional en lenguaje natural. NO calcula ni predice nada:
todos los números provienen del modelo ML y del contexto genealógico calculado
en el backend. La IA solo reescribe esos hechos.

Arquitectura: BD → FastAPI → Modelo ML → (este módulo) IA generativa → usuario.

Diseño anti-alucinación:
  1. Los números llegan pre-calculados dentro del prompt; el modelo solo parafrasea.
  2. System prompt restrictivo ("usa únicamente los DATOS").
  3. Longitud acotada (num_predict) para no divagar.
  4. Validación posterior: ningún número del texto puede estar fuera del conjunto
     permitido (`validar_sin_invencion`).
  5. Fallback determinista si Ollama no responde o la validación falla.
"""

from __future__ import annotations

import os
import re
import json
import random
import logging
from typing import AsyncIterator

import httpx

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b-instruct")
# Timeout generoso: en CPU un análisis de ~250 palabras puede tardar 20-40 s.
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "120"))


SYSTEM_PROMPT = """Eres un asesor zootécnico experto en reproducción y mejoramiento \
genético caprino. Tu única tarea es INTERPRETAR los resultados de un modelo \
predictivo y redactarlos en lenguaje natural para un ganadero. NO recalculas ni \
predices nada.

Reglas estrictas e innegociables:
- Usa EXCLUSIVAMENTE la información del bloque DATOS. Está terminantemente \
PROHIBIDO inventar cifras, porcentajes, nombres, razas o hechos que no aparezcan \
literalmente en DATOS.
- No contradigas la clasificación ni el score entregados por el modelo.
- Si un dato no aparece en DATOS, escribe "no se registró información sobre ello"; \
nunca lo supongas ni lo estimes.
- Redacta de forma profesional, clara y cercana, dirigida a quien toma decisiones \
en la finca. Explica los tecnicismos en pocas palabras.
- Varía la redacción en cada análisis; no uses plantillas ni frases hechas \
repetidas.
- Responde en español."""


# ===========================================================================
# IA fundamentada en la EVALUACIÓN MULTIDIMENSIONAL (motor evaluador.py)
# ===========================================================================

SYSTEM_PROMPT_EVAL = """Eres un médico veterinario y asesor zootécnico experto en \
reproducción, genética, sanidad y producción caprina. Asistes a veterinarios y \
dueños de granja a tomar decisiones de cruce, selección y mejoramiento genético.

QUÉ RECIBES:
Un informe de EVALUACIÓN ya calculado por el sistema a partir de los DATOS REALES \
registrados de cada cabra (producción de leche, historial sanitario, historial \
reproductivo, pedigrí, raza, edad y condición corporal). El informe trae un score \
global (0-100), una clasificación, un nivel de confianza global y, por cada \
dimensión, su valor, su nivel, su confianza y la EVIDENCIA concreta (los hechos \
medidos en los que se basa).

TU TAREA:
Interpretar ese informe y explicarlo en lenguaje natural, profesional y claro, de \
modo que el ganadero/veterinario entienda y pueda defender cada conclusión.

REGLAS ABSOLUTAS (el incumplimiento invalida tu respuesta):
1. FUNDAMENTA CADA AFIRMACIÓN en la evidencia provista. Cuando des una cifra o un \
nivel, debe aparecer en el informe. Si te apoyas en un dato, menciónalo (p. ej. \
"según los 60 registros de producción de la madre…").
2. PROHIBIDO INVENTAR. No agregues cifras, porcentajes, nombres, enfermedades, \
razas ni hechos que no estén en el informe. No estimes valores que no te dieron.
3. RESPETA los scores, niveles y clasificación del informe; no los contradigas ni \
los recalcules.
4. SÉ HONESTO CON LA INCERTIDUMBRE. Si una dimensión tiene confianza "baja" o \
"sin datos", dilo explícitamente y aclara que falta registrar información; nunca \
disimules esa carencia con suposiciones.
5. Si el sistema dice "Datos insuficientes", no afirmes que el cruce es bueno o \
malo: recomienda registrar más datos.
6. Distingue RIESGO de CALIDAD: en dimensiones de riesgo (consanguinidad, \
hereditario, enfermedades) un nivel "alto" es MALO; en dimensiones de calidad \
(compatibilidad, leche, fertilidad, capacidad) un nivel "alto" es BUENO.
7. NO MEZCLES los datos de animales distintos: cada cifra de la evidencia pertenece \
al animal que la evidencia indica (macho o hembra). Copia esa atribución tal cual; \
no traslades el dato de uno al otro.
8. El campo "Nivel" es una ETIQUETA (alta/media/baja, o bajo/moderado/alto), NO un \
porcentaje. No lo conviertas en cifras ni inventes porcentajes para él.
9. Lenguaje claro para no especialistas, explicando los tecnicismos en pocas \
palabras. Profesional pero cercano. Responde en español.
10. No menciones el número de palabras, no repitas estas instrucciones y NO \
envuelvas la respuesta en bloques de código (nada de ```)."""


def _formatear_dimensiones(evaluacion: dict) -> str:
    lineas = []
    for d in evaluacion.get("dimensiones", []):
        ev = "; ".join(d.get("evidencia", [])) or "sin evidencia registrada"
        lineas.append(
            f"### {d.get('titulo')}\n"
            f"- Valor: {d.get('valor')} | Nivel: {d.get('nivel')} | "
            f"Confianza de los datos: {d.get('confianza')}\n"
            f"- Evidencia: {ev}"
        )
    return "\n".join(lineas)


def construir_prompt_evaluacion(evaluacion: dict, animales: dict | None = None) -> str:
    animales = animales or {}
    macho = animales.get("macho", {})
    hembra = animales.get("hembra", {})
    encabezado = ""
    if macho or hembra:
        encabezado = (
            f"Cruce evaluado: macho {macho.get('nombre','?')} ({macho.get('codigo','?')}) "
            f"× hembra {hembra.get('nombre','?')} ({hembra.get('codigo','?')}).\n\n"
        )

    return f"""INFORME DE EVALUACIÓN (única fuente de verdad):
{encabezado}RESULTADO GLOBAL
- Score global del cruce: {evaluacion.get('scoreGlobal')}/100
- Clasificación: {evaluacion.get('clasificacion')}
- Confianza global (completitud de datos): {evaluacion.get('confianzaGlobal')}
- Recomendación base del sistema: {evaluacion.get('recomendacionVeterinaria')}

DIMENSIONES EVALUADAS
{_formatear_dimensiones(evaluacion)}

Redacta el análisis con estas secciones y estos títulos en Markdown (usa '##'):

## Resumen y recomendación
## Genética y consanguinidad
## Producción y fertilidad esperadas
## Sanidad y riesgos
## Confianza de esta evaluación

En "Resumen y recomendación" da el veredicto global citando el score y la \
clasificación. En cada sección siguiente interpreta las dimensiones \
correspondientes APOYÁNDOTE en su evidencia (menciona los datos concretos). En \
"Confianza de esta evaluación" explica qué dimensiones tienen poca o ninguna \
información y qué debería registrarse para mejorar el análisis. Sé concreto y \
útil para la decisión."""


def _numeros_de_evidencia(evaluacion: dict) -> set[int]:
    """Todos los enteros que aparecen en la evidencia y scores del informe."""
    permitidos: set[int] = {100, int(evaluacion.get("scoreGlobal", 0))}
    textos = []
    for d in evaluacion.get("dimensiones", []):
        permitidos.add(int(d.get("score", 0)))
        textos.append(str(d.get("valor", "")))
        textos.extend(d.get("evidencia", []))
    blob = " ".join(textos)
    for m in re.findall(r"\d+", blob.replace(",", "")):   # quita separadores de miles
        try:
            permitidos.add(int(m))
        except ValueError:
            pass
    return permitidos


def validar_evaluacion(texto: str, evaluacion: dict) -> bool:
    permitidos = _numeros_de_evidencia(evaluacion)
    for m in re.finditer(r"(?<![A-Za-z0-9/\-])\d+(?![A-Za-z0-9/\-])", texto.replace(",", "")):
        n = int(m.group())
        if n <= 12:
            continue
        if n not in permitidos:
            logger.warning("Validación evaluación: número no fundamentado: %s", n)
            return False
    return True


def _fallback_evaluacion(evaluacion: dict) -> str:
    out = [
        f"## Resumen y recomendación\n",
        f"Score global del cruce: **{evaluacion.get('scoreGlobal')}/100** "
        f"(**{evaluacion.get('clasificacion')}**, confianza {evaluacion.get('confianzaGlobal')}). "
        f"{evaluacion.get('recomendacionVeterinaria')}\n",
    ]
    for d in evaluacion.get("dimensiones", []):
        out.append(f"- **{d.get('titulo')}**: {d.get('valor')} (nivel {d.get('nivel')}). "
                   + " ".join(d.get("evidencia", [])))
    out.append("\n_El asistente de IA no está disponible; se muestra el informe del sistema._")
    return "\n".join(out)


async def generar_evaluacion_stream(
    evaluacion: dict,
    animales: dict | None = None,
) -> AsyncIterator[str]:
    """Narra el informe de evaluación en streaming, fundamentado en su evidencia."""
    prompt = construir_prompt_evaluacion(evaluacion, animales)
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_EVAL},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
        "options": {
            "temperature": 0.4,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
            "num_predict": 1300,
            "num_ctx": 8192,
            "seed": random.randint(1, 1_000_000),
        },
    }

    acumulado: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
                if resp.status_code != 200:
                    await resp.aread()
                    yield _fallback_evaluacion(evaluacion)
                    return
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        acumulado.append(token)
                        yield token
                    if chunk.get("done"):
                        break
    except Exception as exc:  # noqa: BLE001
        logger.error("Error al contactar Ollama (evaluación): %s", exc)
        if not acumulado:
            yield _fallback_evaluacion(evaluacion)
        return

    texto = "".join(acumulado)
    if texto and not validar_evaluacion(texto, evaluacion):
        yield (
            "\n\n> ⚠️ _Algunas cifras no pudieron verificarse contra el informe. "
            "Considera el panel de dimensiones como la fuente autoritativa._"
        )


# ---------------------------------------------------------------------------
# Construcción del prompt
# ---------------------------------------------------------------------------

def _formatear_factores(ml_result: dict) -> str:
    factores = ml_result.get("explicacion", {}).get("topFactores", [])
    if not factores:
        return "- (sin factores destacados)"
    lineas = []
    for f in factores:
        etiqueta = f.get("label") or f.get("feature", "factor")
        # SHAP: si viene 'puntos', indicamos cuánto movió el score (con signo)
        if "puntos" in f and f["puntos"] is not None:
            pts = int(f["puntos"])
            verbo = "subió" if pts > 0 else "bajó"
            efecto = f"{verbo} el score en aproximadamente {abs(pts)} puntos"
        else:
            efecto = f"impacto {f.get('impacto', 'neutro')}"
        lineas.append(
            f"- {etiqueta} (valor registrado {f.get('valor')}): {efecto}"
        )
    return "\n".join(lineas)


def _formatear_contexto(ctx: dict) -> str:
    if not ctx:
        return "- No se aportó contexto genealógico adicional."
    lineas = []
    if (coi := ctx.get("coi_descendencia_aprox")) is not None:
        lineas.append(
            f"- Coeficiente de consanguinidad aproximado de la posible cría: "
            f"{round(coi * 100, 2)}% (calculado a partir del pedigrí)"
        )
    if (anc := ctx.get("ancestros_comunes")):
        nombres = ", ".join(anc) if isinstance(anc, list) else str(anc)
        lineas.append(f"- Ancestros compartidos por ambas líneas: {nombres}")
    elif ctx.get("ancestros_comunes_count") == 0:
        lineas.append("- No comparten ancestros conocidos en las 2 generaciones registradas.")
    if (rm := ctx.get("raza_macho")) and (rh := ctx.get("raza_hembra")):
        misma = "la misma raza" if rm == rh else "razas distintas"
        lineas.append(f"- Razas: macho {rm}, hembra {rh} ({misma}).")
    if (em := ctx.get("edad_macho_meses")) is not None and (eh := ctx.get("edad_hembra_meses")) is not None:
        lineas.append(f"- Edades: macho {em} meses, hembra {eh} meses.")
    if (gm := ctx.get("generaciones_macho")) is not None and (gh := ctx.get("generaciones_hembra")) is not None:
        lineas.append(f"- Profundidad de pedigrí conocida: macho {gm} generación(es), hembra {gh}.")
    return "\n".join(lineas) if lineas else "- No se aportó contexto genealógico adicional."


def construir_prompt(ml_result: dict, contexto: dict) -> str:
    score = ml_result.get("scoreCompatibilidad", 0)
    clasificacion = ml_result.get("clasificacion", "Sin clasificar")
    prob = ml_result.get("probExito", 0)
    confidence = ml_result.get("confidence", 0)
    es_insuficiente = clasificacion == "Insuficiente información"

    cierre = (
        "El modelo NO tiene certeza suficiente para este cruce. Explica con claridad "
        "que la recomendación es registrar más datos históricos antes de decidir, sin "
        "afirmar si el cruce es bueno o malo."
        if es_insuficiente else
        "Cierra con una recomendación práctica y honesta alineada con la clasificación del modelo."
    )

    return f"""DATOS DEL ANÁLISIS (única fuente de verdad):
- Score de compatibilidad: {score}/100
- Clasificación del modelo: {clasificacion}
- Probabilidad estimada de parto exitoso: {round(prob * 100)}%
- Confianza del modelo en esta predicción: {round(confidence * 100)}%

Factores más influyentes según el modelo:
{_formatear_factores(ml_result)}

Contexto genealógico:
{_formatear_contexto(contexto)}

Redacta un análisis con EXACTAMENTE estas secciones y estos títulos en Markdown:

## Interpretación de la compatibilidad
## Potencial productivo esperado de la descendencia
## Riesgos de consanguinidad y antecedentes familiares
## Ventajas y desventajas del apareamiento
## Recomendación final

Indicaciones: sé conciso y directo, no menciones el número de palabras ni repitas \
estas instrucciones, no agregues secciones extra y NO envuelvas la respuesta en \
bloques de código (nada de ```). {cierre}"""


def construir_prompt_ranking(animal_base: dict, ranking: list[dict]) -> str:
    base = (
        f"{animal_base.get('nombre') or 's/ nombre'} "
        f"({animal_base.get('codigo') or 's/ código'}), "
        f"{animal_base.get('sexo', '')}, raza {animal_base.get('raza') or 'desconocida'}"
    )
    lineas = []
    for i, r in enumerate(ranking, 1):
        c = r.get("candidato", {})
        coi = r.get("coi")
        coi_txt = f", consanguinidad de la cría ≈ {round((coi or 0) * 100, 1)}%" if coi is not None else ""
        lineas.append(
            f"{i}. {c.get('nombre') or 's/ nombre'} ({c.get('codigo') or 's/ código'}), "
            f"raza {c.get('raza') or 'desconocida'}: score {r.get('score')}/100, "
            f"clasificación «{r.get('clasificacion')}»{coi_txt}"
        )
    candidatos = "\n".join(lineas)

    return f"""DATOS DEL RANKING (única fuente de verdad):
Animal a aparear: {base}

Candidatos evaluados por el modelo, ordenados de mayor a menor compatibilidad:
{candidatos}

HECHOS QUE DEBES RESPETAR SIN EXCEPCIÓN:
- La lista YA está ordenada de MEJOR a PEOR. El candidato nº 1 es el de MAYOR \
compatibilidad; el último es el de MENOR. Un score más alto siempre es mejor.
- La "mejor opción" es SIEMPRE el candidato nº 1. Los "candidatos a evitar" son los \
de score más bajo o clasificación «No recomendado». Nunca afirmes lo contrario.

Redacta un resumen comparativo para apoyar la decisión de monta, con EXACTAMENTE estas \
secciones y estos títulos en Markdown (usa '##', no '###'):

## Mejor opción
## Por qué destaca
## Candidatos a evitar
## Consideraciones para decidir

Indicaciones: nombra a los animales por su nombre/código tal como aparecen, no \
inventes scores ni porcentajes distintos a los listados, prioriza menor consanguinidad \
cuando los scores sean parecidos, no menciones el número de palabras ni repitas estas \
instrucciones y NO envuelvas la respuesta en bloques de código (nada de ```)."""


def _validar_ranking(texto: str, ranking: list[dict]) -> bool:
    permitidos: set[int] = {100}
    for r in ranking:
        try:
            permitidos.add(int(r.get("score", -1)))
        except (TypeError, ValueError):
            pass
        coi = r.get("coi")
        if coi is not None:
            import math
            permitidos.add(round(coi * 100))
            permitidos.add(math.floor(coi * 100))
    for match in re.finditer(r"(?<![A-Za-z0-9/\-])\d+(?![A-Za-z0-9/\-])", texto):
        n = int(match.group())
        if n <= 12:
            continue
        if n not in permitidos:
            logger.warning("Validación ranking: número no permitido: %s", n)
            return False
    return True


async def generar_ranking_stream(
    animal_base: dict,
    ranking: list[dict],
) -> AsyncIterator[str]:
    """Resumen comparativo del ranking, en streaming (mismas garantías que el individual)."""
    prompt = construir_prompt_ranking(animal_base, ranking)
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
        "options": {
            "temperature": 0.5,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
            "num_predict": 600,
            "num_ctx": 4096,
            "seed": random.randint(1, 1_000_000),
        },
    }

    acumulado: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
                if resp.status_code != 200:
                    await resp.aread()
                    yield "_El asistente de IA no está disponible en este momento._"
                    return
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        acumulado.append(token)
                        yield token
                    if chunk.get("done"):
                        break
    except Exception as exc:  # noqa: BLE001
        logger.error("Error al contactar Ollama (ranking): %s", exc)
        if not acumulado:
            yield "_El asistente de IA no está disponible en este momento._"
        return

    texto = "".join(acumulado)
    if texto and not _validar_ranking(texto, ranking):
        yield (
            "\n\n> ⚠️ _Algunas cifras no pudieron verificarse. Considera la tabla de "
            "ranking como la fuente autoritativa._"
        )


# ---------------------------------------------------------------------------
# Validación anti-alucinación
# ---------------------------------------------------------------------------

def _numeros_permitidos(ml_result: dict, contexto: dict) -> set[int]:
    permitidos: set[int] = {
        100,  # escala del score ("67/100") y de los porcentajes
        int(ml_result.get("scoreCompatibilidad", 0)),
        round(ml_result.get("probExito", 0) * 100),
        round(ml_result.get("confidence", 0) * 100),
    }
    for f in ml_result.get("explicacion", {}).get("topFactores", []):
        try:
            permitidos.add(int(round(float(f.get("valor", 0)))))
        except (TypeError, ValueError):
            pass
        if f.get("puntos") is not None:          # magnitud SHAP (puntos de score)
            permitidos.add(abs(int(f["puntos"])))
    if (coi := contexto.get("coi_descendencia_aprox")) is not None:
        import math
        permitidos.add(round(coi * 100))
        permitidos.add(math.floor(coi * 100))   # COI con decimales: "12.5%" → 12
    for k in ("edad_macho_meses", "edad_hembra_meses", "generaciones_macho",
              "generaciones_hembra", "ancestros_comunes_count"):
        if (v := contexto.get(k)) is not None:
            try:
                permitidos.add(int(round(float(v))))
            except (TypeError, ValueError):
                pass
    return permitidos


def validar_sin_invencion(texto: str, ml_result: dict, contexto: dict) -> bool:
    """
    True si el texto no contiene cifras "inventadas".

    - Tolera números pequeños (<= 12): unidades comunes (meses, generaciones…).
    - Ignora dígitos que forman parte de códigos alfanuméricos (p. ej. "GT-014").
    - Elimina primero los textos permitidos (nombres de ancestros, razas) porque
      pueden contener dígitos legítimos.
    """
    permitidos = _numeros_permitidos(ml_result, contexto)

    limpio = texto
    for nombre in contexto.get("ancestros_comunes", []) or []:
        limpio = limpio.replace(str(nombre), " ")
    for raza in (contexto.get("raza_macho"), contexto.get("raza_hembra")):
        if raza:
            limpio = limpio.replace(str(raza), " ")

    # \d no precedido ni seguido por letra/guion/barra → descarta códigos como "GT-014".
    for match in re.finditer(r"(?<![A-Za-z0-9/\-])\d+(?![A-Za-z0-9/\-])", limpio):
        n = int(match.group())
        if n <= 12:
            continue
        if n not in permitidos:
            logger.warning("Validación IA: número no permitido en la narrativa: %s", n)
            return False
    return True


# ---------------------------------------------------------------------------
# Fallback determinista (sin IA)
# ---------------------------------------------------------------------------

def fallback_texto(ml_result: dict) -> str:
    """Narrativa mínima basada en plantilla, usada si Ollama no está disponible."""
    clasificacion = ml_result.get("clasificacion", "Sin clasificar")
    score = ml_result.get("scoreCompatibilidad", 0)
    mensaje = ml_result.get("explicacion", {}).get("mensaje", "")
    return (
        f"## Interpretación de la compatibilidad\n\n"
        f"El modelo asignó a este cruce un score de **{score}/100** "
        f"con la clasificación **«{clasificacion}»**. {mensaje}\n\n"
        f"_El asistente de IA no está disponible en este momento; "
        f"se muestra el resumen del modelo. Vuelve a intentarlo más tarde "
        f"para obtener el análisis ampliado._"
    )


# ---------------------------------------------------------------------------
# Disponibilidad de Ollama
# ---------------------------------------------------------------------------

async def ollama_disponible() -> dict:
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            if r.status_code != 200:
                return {"disponible": False, "modelo": OLLAMA_MODEL}
            modelos = [m.get("name", "") for m in r.json().get("models", [])]
            cargado = any(OLLAMA_MODEL.split(":")[0] in m for m in modelos)
            return {"disponible": True, "modelo": OLLAMA_MODEL, "modelo_descargado": cargado}
    except Exception as exc:  # noqa: BLE001
        logger.info("Ollama no disponible: %s", exc)
        return {"disponible": False, "modelo": OLLAMA_MODEL}


# ---------------------------------------------------------------------------
# Generación en streaming
# ---------------------------------------------------------------------------

async def generar_analisis_stream(
    ml_result: dict,
    contexto: dict | None = None,
) -> AsyncIterator[str]:
    """
    Generador asíncrono que produce el análisis token a token.

    - Si Ollama falla o no responde, emite el fallback determinista.
    - Acumula el texto y, al terminar, valida que no haya cifras inventadas;
      si las hay, añade una nota de advertencia (los datos autoritativos ya se
      muestran por separado en el panel del modelo).
    """
    contexto = contexto or {}
    prompt = construir_prompt(ml_result, contexto)

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
        "options": {
            "temperature": 0.55,      # natural pero no inventivo
            "top_p": 0.9,
            "repeat_penalty": 1.1,
            "num_predict": 700,
            "num_ctx": 4096,
            "seed": random.randint(1, 1_000_000),  # variedad entre ejecuciones
        },
    }

    acumulado: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
                if resp.status_code != 200:
                    await resp.aread()
                    logger.error("Ollama respondió %s", resp.status_code)
                    yield fallback_texto(ml_result)
                    return
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        acumulado.append(token)
                        yield token
                    if chunk.get("done"):
                        break
    except Exception as exc:  # noqa: BLE001
        logger.error("Error al contactar Ollama: %s", exc)
        if not acumulado:
            yield fallback_texto(ml_result)
        return

    texto = "".join(acumulado)
    if texto and not validar_sin_invencion(texto, ml_result, contexto):
        yield (
            "\n\n> ⚠️ _Algunas cifras de este texto no pudieron verificarse contra "
            "los datos del modelo. Considera el panel de resultados como la fuente "
            "autoritativa._"
        )
