"""
Motor de evaluación multidimensional de cruces caprinos.

Filosofía: CADA número que sale del sistema se fundamenta en datos reales
registrados de las cabras. Nada se inventa. Si no hay datos para una dimensión,
su confianza baja (no se rellena con suposiciones).

Entrada: un diccionario `datos` con registros crudos recolectados por el backend
desde Oracle (producción, salud, reproducción, pedigrí, raza…). Ver el esquema
esperado en `_DATOS_EJEMPLO` al final del archivo.

Salida: una evaluación estructurada con N dimensiones, cada una con:
  - valor      → cifra/etiqueta legible
  - score      → 0-100 de FAVORABILIDAD para el cruce (mayor = mejor)
  - nivel      → etiqueta cualitativa
  - confianza  → alta | media | baja  (según cuántos datos reales la respaldan)
  - evidencia  → lista de hechos verificables (la "defensa" de cada dato)

El score global es el promedio de las dimensiones PONDERADO por su confianza:
las dimensiones sin datos pesan poco, de modo que el resultado es honesto.
"""

from __future__ import annotations

from typing import Any

# Pesos relativos de cada dimensión en el score global (sobre cruce favorable).
PESOS = {
    "parto_exitoso":          0.22,
    "consanguinidad":         0.18,
    "fertilidad":             0.15,
    "compatibilidad_genetica":0.12,
    "calidad_leche":          0.11,
    "riesgo_enfermedades":    0.10,
    "riesgo_hereditario":     0.07,
    "capacidad_reproductiva": 0.05,
}

_CONF_FACTOR = {"alta": 1.0, "media": 0.65, "baja": 0.30, "sin_datos": 0.0}


def _conf_por_registros(n: int, alta: int, media: int) -> str:
    if n <= 0:
        return "sin_datos"
    if n >= alta:
        return "alta"
    if n >= media:
        return "media"
    return "baja"


def _clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> int:
    return int(round(max(lo, min(hi, x))))


def _g(d: dict | None, *path, default=None):
    """Acceso anidado seguro: _g(datos, 'hembra', 'edad_meses')."""
    cur = d or {}
    for k in path:
        if not isinstance(cur, dict) or k not in cur or cur[k] is None:
            return default
        cur = cur[k]
    return cur


# ---------------------------------------------------------------------------
# Dimensiones (cada una se fundamenta SOLO en lo que llega en `datos`)
# ---------------------------------------------------------------------------

def _dim_consanguinidad(datos: dict) -> dict:
    cons = datos.get("consanguinidad", {}) or {}
    coi = float(cons.get("coi_aprox") or 0.0)
    comunes = cons.get("ancestros_comunes") or []
    pedigri_conocido = bool(_g(datos, "macho", "generaciones") or 0) or bool(_g(datos, "hembra", "generaciones") or 0)

    score = _clamp(100 - coi * 400)               # 0%→100, 12.5%→50, 25%→0
    if coi < 0.0625:
        nivel = "bajo"
    elif coi < 0.125:
        nivel = "moderado"
    else:
        nivel = "alto"

    evidencia = [f"Coeficiente de consanguinidad estimado de la cría: {round(coi * 100, 2)}%."]
    if cons.get("relacion_directa"):
        evidencia.append("Existe relación directa progenitor-descendiente entre ambos animales.")
    if cons.get("mismos_padres"):
        evidencia.append("Son hermanos completos (mismo padre y misma madre).")
    elif cons.get("mismo_padre") and cons.get("misma_madre"):
        evidencia.append("Comparten padre y madre.")
    elif cons.get("mismo_padre"):
        evidencia.append("Comparten el mismo padre (medios hermanos).")
    elif cons.get("misma_madre"):
        evidencia.append("Comparten la misma madre (medios hermanos).")
    if comunes:
        evidencia.append("Ancestros en común: " + ", ".join(map(str, comunes)) + ".")
    elif not cons.get("relacion_directa"):
        evidencia.append("No se detectaron ancestros comunes en las generaciones registradas.")

    confianza = "alta" if pedigri_conocido else "baja"
    if confianza == "baja":
        evidencia.append("Pedigrí poco profundo: el COI podría estar subestimado.")

    return {
        "id": "consanguinidad", "titulo": "Riesgo de consanguinidad",
        "valor": f"{round(coi * 100, 2)}%", "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


def _dim_riesgo_hereditario(datos: dict) -> dict:
    cons = datos.get("consanguinidad", {}) or {}
    coi = float(cons.get("coi_aprox") or 0.0)
    diag_macho = _g(datos, "salud_macho", "diagnosticos") or []
    diag_hembra = _g(datos, "salud_hembra", "diagnosticos") or []
    diags = list(diag_macho) + list(diag_hembra)

    # El COI amplifica la expresión de recesivos; los diagnósticos previos suman riesgo.
    riesgo = coi * 200 + len(diags) * 12
    score = _clamp(100 - riesgo)
    nivel = "bajo" if score >= 70 else "moderado" if score >= 45 else "alto"

    evidencia = []
    if diags:
        evidencia.append("Diagnósticos registrados en los progenitores: " + ", ".join(sorted(set(diags))) + ".")
    else:
        evidencia.append("No hay diagnósticos de enfermedad registrados en macho ni hembra.")
    if coi > 0:
        evidencia.append(
            f"La consanguinidad ({round(coi * 100, 2)}%) aumenta la probabilidad de "
            f"expresión de caracteres recesivos."
        )
    confianza = "media"  # no solemos tener el historial sanitario de toda la línea
    evidencia.append("Evaluado sobre el historial sanitario disponible de ambos animales.")

    return {
        "id": "riesgo_hereditario", "titulo": "Riesgo hereditario",
        "valor": nivel.capitalize(), "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


def _dim_compatibilidad_genetica(datos: dict) -> dict:
    cons = datos.get("consanguinidad", {}) or {}
    coi = float(cons.get("coi_aprox") or 0.0)
    raza_m = _g(datos, "macho", "raza_nombre")
    raza_h = _g(datos, "hembra", "raza_nombre")
    apt_m = _g(datos, "macho", "aptitud")
    apt_h = _g(datos, "hembra", "aptitud")
    misma_raza = bool(raza_m and raza_h and raza_m == raza_h)

    # Base por afinidad de razas, penalizada por consanguinidad.
    if misma_raza:
        base = 88
    elif apt_m and apt_h and apt_m == apt_h:
        base = 74   # razas distintas pero misma aptitud (p. ej. ambas lecheras)
    else:
        base = 58
    score = _clamp(base - coi * 200)
    nivel = "alta" if score >= 75 else "media" if score >= 55 else "baja"

    evidencia = []
    if raza_m and raza_h:
        evidencia.append(
            f"Razas: macho {raza_m}, hembra {raza_h}"
            + (" (misma raza)." if misma_raza else ".")
        )
    if apt_m and apt_h:
        evidencia.append(f"Aptitud productiva: macho {apt_m}, hembra {apt_h}.")
    if coi > 0:
        evidencia.append(f"Ajustada a la baja por consanguinidad ({round(coi * 100, 2)}%).")
    confianza = "alta" if (raza_m and raza_h) else "baja"

    return {
        "id": "compatibilidad_genetica", "titulo": "Compatibilidad genética",
        "valor": nivel.capitalize(), "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


def _dim_parto_exitoso(datos: dict, ml_prob: float | None, ml_conf: float | None) -> dict:
    repro = datos.get("reproduccion_hembra", {}) or {}
    total = int(repro.get("total_partos") or 0)
    exitosos = int(repro.get("exitosos") or 0)
    tasa_hist = (exitosos / total) if total > 0 else None

    # Combina el modelo ML (si llega) con la tasa histórica real de la hembra.
    componentes = []
    if ml_prob is not None:
        componentes.append(ml_prob)
    if tasa_hist is not None:
        componentes.append(tasa_hist)
    prob = sum(componentes) / len(componentes) if componentes else (ml_prob or 0.5)
    score = _clamp(prob * 100)
    nivel = "alta" if score >= 70 else "moderada" if score >= 50 else "baja"

    evidencia = []
    if ml_prob is not None:
        evidencia.append(f"Modelo predictivo: {round(ml_prob * 100)}% de probabilidad de parto exitoso.")
    if tasa_hist is not None:
        evidencia.append(
            f"Historial real de la hembra: {exitosos} de {total} partos exitosos "
            f"({round(tasa_hist * 100)}%)."
        )
        abortos = int(repro.get("abortos") or 0)
        mortinatos = int(repro.get("mortinatos") or 0)
        if abortos or mortinatos:
            evidencia.append(f"Antecedentes: {abortos} aborto(s), {mortinatos} mortinato(s).")
    else:
        evidencia.append("La hembra no tiene partos previos registrados; se usa solo la estimación del modelo.")

    if total >= 3:
        confianza = "alta"
    elif total >= 1 or ml_conf is not None:
        confianza = "media"
    else:
        confianza = "baja"

    return {
        "id": "parto_exitoso", "titulo": "Probabilidad de parto exitoso",
        "valor": f"{score}%", "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


def _dim_calidad_leche(datos: dict) -> dict:
    prod = datos.get("produccion_hembra", {}) or {}
    n = int(prod.get("n_registros") or 0)
    litros = prod.get("litros_promedio")
    grasa = prod.get("grasa_prom")
    proteina = prod.get("proteina_prom")
    cs = prod.get("celulas_somaticas_prom")
    raza_litros = _g(datos, "hembra", "raza_leche_dia")  # potencial de la raza

    evidencia = []
    if litros is not None and n > 0:
        # Producción real de la madre frente al potencial de la raza.
        ref = float(raza_litros) if raza_litros else 2.5
        score = _clamp((float(litros) / ref) * 70 + 15)   # ~ref → 85
        evidencia.append(f"Producción media de la madre: {round(float(litros), 2)} L/día sobre {n} registros.")
        if raza_litros:
            evidencia.append(f"Potencial medio de la raza: {round(float(raza_litros), 2)} L/día.")
        if grasa is not None:
            evidencia.append(f"Grasa media {round(float(grasa), 2)}%, proteína {round(float(proteina or 0), 2)}%.")
        if cs:
            calidad_cs = "buena (ubre sana)" if cs < 500000 else "a vigilar (posible mastitis subclínica)"
            evidencia.append(f"Células somáticas medias {int(cs):,}/ml: {calidad_cs}.")
            if cs >= 500000:
                score = _clamp(score - 12)
        confianza = _conf_por_registros(n, alta=30, media=5)
    elif raza_litros:
        score = _clamp((float(raza_litros) / 2.5) * 60 + 10)
        evidencia.append(
            f"La madre no tiene producción registrada; se estima por el potencial de "
            f"su raza ({round(float(raza_litros), 2)} L/día)."
        )
        confianza = "baja"
    else:
        score = 50
        evidencia.append("Sin datos de producción de leche ni potencial de raza disponibles.")
        confianza = "sin_datos"

    nivel = "alta" if score >= 72 else "media" if score >= 50 else "baja"
    return {
        "id": "calidad_leche", "titulo": "Calidad de leche esperada",
        "valor": (f"{round(float(litros), 2)} L/día" if (litros and n > 0) else nivel.capitalize()),
        "score": score, "nivel": nivel, "confianza": confianza, "evidencia": evidencia,
    }


def _dim_fertilidad(datos: dict) -> dict:
    rh = datos.get("reproduccion_hembra", {}) or {}
    rm = datos.get("reproduccion_macho", {}) or {}
    nm = _g(datos, "macho", "nombre") or "el macho"
    nh = _g(datos, "hembra", "nombre") or "la hembra"
    total = int(rh.get("total_partos") or 0)
    exitosos = int(rh.get("exitosos") or 0)
    crias = rh.get("crias_promedio")
    serv_m = int(rm.get("servicios") or 0)
    serv_ok = int(rm.get("exitosos") or 0)

    componentes, evidencia = [], []
    if total > 0:
        tasa = exitosos / total
        componentes.append(tasa * 100)
        evidencia.append(f"Hembra {nh}: {exitosos}/{total} partos exitosos ({round(tasa * 100)}%).")
        if crias:
            prolif = min(float(crias) / 2.0, 1.0) * 100   # 2 crías/parto = excelente
            componentes.append(prolif)
            evidencia.append(f"Prolificidad media de la hembra {nh}: {round(float(crias), 2)} crías/parto.")
    if serv_m > 0:
        tasa_m = serv_ok / serv_m
        componentes.append(tasa_m * 100)
        evidencia.append(f"Macho {nm}: {serv_ok}/{serv_m} servicios con parto exitoso ({round(tasa_m * 100)}%).")

    if componentes:
        score = _clamp(sum(componentes) / len(componentes))
        confianza = "alta" if (total >= 3 or serv_m >= 3) else "media"
    else:
        score = 55
        evidencia.append("Sin historial reproductivo registrado para estimar fertilidad con precisión.")
        confianza = "baja"

    nivel = "alta" if score >= 70 else "media" if score >= 50 else "baja"
    return {
        "id": "fertilidad", "titulo": "Fertilidad esperada",
        "valor": nivel.capitalize(), "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


def _dim_riesgo_enfermedades(datos: dict) -> dict:
    sm = datos.get("salud_macho", {}) or {}
    sh = datos.get("salud_hembra", {}) or {}
    ev_m = int(sm.get("eventos_12m") or 0)
    ev_h = int(sh.get("eventos_12m") or 0)
    diag_m = int(sm.get("n_diagnosticos") or 0)
    diag_h = int(sh.get("n_diagnosticos") or 0)
    cs = _g(datos, "produccion_hembra", "celulas_somaticas_prom")

    riesgo = (diag_m + diag_h) * 14 + max(0, ev_m - 2) * 5 + max(0, ev_h - 2) * 5
    if cs and cs >= 500000:
        riesgo += 12
    score = _clamp(100 - riesgo)
    nivel = "bajo" if score >= 70 else "moderado" if score >= 45 else "alto"

    evidencia = [
        f"Eventos sanitarios en los últimos 12 meses: macho {ev_m}, hembra {ev_h}.",
        f"Diagnósticos de enfermedad: macho {diag_m}, hembra {diag_h}.",
    ]
    if cs and cs >= 500000:
        evidencia.append(f"Células somáticas de la hembra elevadas ({int(cs):,}/ml): vigilar salud de ubre.")
    confianza = "alta" if (ev_m or ev_h or diag_m or diag_h) else "media"

    return {
        "id": "riesgo_enfermedades", "titulo": "Riesgo de enfermedades",
        "valor": nivel.capitalize(), "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


def _dim_capacidad_reproductiva(datos: dict) -> dict:
    em = _g(datos, "macho", "edad_meses")
    eh = _g(datos, "hembra", "edad_meses")
    cc_h = _g(datos, "hembra", "condicion_corporal")   # 1-5
    cc_m = _g(datos, "macho", "condicion_corporal")

    score, evidencia = 70, []
    if em is not None:
        if em < 8:
            score -= 30; evidencia.append(f"Macho de {round(em)} meses: por debajo de la edad mínima reproductiva (~8 meses).")
        elif em > 84:
            score -= 12; evidencia.append(f"Macho de {round(em)} meses: edad avanzada.")
        else:
            score += 10; evidencia.append(f"Macho de {round(em)} meses: dentro del rango reproductivo óptimo.")
    if eh is not None:
        if eh < 7:
            score -= 32; evidencia.append(f"Hembra de {round(eh)} meses: por debajo de la edad mínima reproductiva (~7 meses).")
        elif eh > 72:
            score -= 12; evidencia.append(f"Hembra de {round(eh)} meses: edad avanzada para la reproducción.")
        else:
            score += 10; evidencia.append(f"Hembra de {round(eh)} meses: dentro del rango reproductivo óptimo.")
    if cc_h is not None:
        if 2.5 <= cc_h <= 3.5:
            score += 6; evidencia.append(f"Condición corporal de la hembra {cc_h}/5: adecuada para la gestación.")
        else:
            score -= 8; evidencia.append(f"Condición corporal de la hembra {cc_h}/5: fuera del rango ideal (2.5–3.5).")
    if cc_m is not None:
        evidencia.append(f"Condición corporal del macho {cc_m}/5.")

    score = _clamp(score)
    nivel = "alta" if score >= 70 else "media" if score >= 50 else "baja"
    confianza = "alta" if (em is not None and eh is not None) else "baja"
    if not evidencia:
        evidencia.append("Sin datos de edad ni condición corporal para evaluar.")

    return {
        "id": "capacidad_reproductiva", "titulo": "Capacidad reproductiva",
        "valor": nivel.capitalize(), "score": score, "nivel": nivel,
        "confianza": confianza, "evidencia": evidencia,
    }


# ---------------------------------------------------------------------------
# Ensamblado
# ---------------------------------------------------------------------------

def evaluar(datos: dict, ml_prob: float | None = None, ml_conf: float | None = None) -> dict[str, Any]:
    """
    Calcula la evaluación completa del cruce a partir de los datos crudos.
    `ml_prob`/`ml_conf` provienen del modelo RandomForest (probabilidad de parto
    exitoso y su confianza); si no se pasan, la dimensión usa solo el historial.
    """
    dims = [
        _dim_compatibilidad_genetica(datos),
        _dim_consanguinidad(datos),
        _dim_riesgo_hereditario(datos),
        _dim_parto_exitoso(datos, ml_prob, ml_conf),
        _dim_calidad_leche(datos),
        _dim_fertilidad(datos),
        _dim_riesgo_enfermedades(datos),
        _dim_capacidad_reproductiva(datos),
    ]

    # Score global: promedio ponderado por peso × factor de confianza.
    num = den = 0.0
    for d in dims:
        w = PESOS.get(d["id"], 0.0) * _CONF_FACTOR.get(d["confianza"], 0.0)
        num += d["score"] * w
        den += w
    score_global = _clamp(num / den) if den > 0 else 0

    # Confianza global = completitud real de los datos (media ponderada).
    conf_num = sum(PESOS.get(d["id"], 0.0) * _CONF_FACTOR.get(d["confianza"], 0.0) for d in dims)
    conf_den = sum(PESOS.get(d["id"], 0.0) for d in dims)
    completitud = (conf_num / conf_den) if conf_den > 0 else 0.0
    if completitud >= 0.75:
        conf_global = "alta"
    elif completitud >= 0.45:
        conf_global = "media"
    else:
        conf_global = "baja"

    if score_global < 40:
        # Señales de riesgo claras: el veredicto es válido aun con datos limitados.
        clasificacion, recomendacion = "No recomendado", \
            "Los riesgos identificados desaconsejan este cruce. Considere otro reproductor."
    elif conf_global == "baja":
        # Sin datos suficientes no se puede afirmar que el cruce sea bueno.
        clasificacion, recomendacion = "Datos insuficientes", \
            "No hay datos suficientes para una recomendación firme. Registre producción, " \
            "historial reproductivo y sanitario de ambos animales para evaluar con fiabilidad."
    elif score_global >= 72:
        clasificacion, recomendacion = "Recomendado", \
            "Cruce favorable según los datos disponibles. Puede procederse con seguimiento veterinario habitual."
    elif score_global >= 50:
        clasificacion, recomendacion = "Precaución", \
            "Cruce viable con reservas. Se aconseja evaluación veterinaria de los puntos débiles antes de la monta."
    else:
        clasificacion, recomendacion = "No recomendado", \
            "Los riesgos identificados desaconsejan este cruce. Considere otro reproductor."

    return {
        "scoreGlobal": score_global,
        "clasificacion": clasificacion,
        "confianzaGlobal": conf_global,
        "completitudDatos": round(completitud, 2),
        "recomendacionVeterinaria": recomendacion,
        "dimensiones": dims,
        "metodo": "motor-evaluacion-fundamentada-v2",
    }


# Esquema de ejemplo de `datos` (referencia para el backend y las pruebas).
_DATOS_EJEMPLO = {
    "macho":  {"id": 1, "nombre": "Centauro", "codigo": "GT-001", "edad_meses": 30,
               "raza_nombre": "Saanen", "aptitud": "lechera", "raza_leche_dia": 2.8,
               "generaciones": 2, "condicion_corporal": 3},
    "hembra": {"id": 2, "nombre": "Luna", "codigo": "GT-002", "edad_meses": 24,
               "raza_nombre": "Saanen", "aptitud": "lechera", "raza_leche_dia": 2.8,
               "generaciones": 2, "condicion_corporal": 3},
    "consanguinidad": {"coi_aprox": 0.0, "ancestros_comunes": [], "relacion_directa": False,
                       "mismos_padres": False, "mismo_padre": False, "misma_madre": False},
    "produccion_hembra": {"n_registros": 60, "litros_promedio": 2.6, "grasa_prom": 3.5,
                          "proteina_prom": 3.1, "celulas_somaticas_prom": 280000},
    "reproduccion_hembra": {"total_partos": 3, "exitosos": 3, "abortos": 0, "mortinatos": 0,
                            "crias_promedio": 1.7},
    "reproduccion_macho": {"servicios": 6, "exitosos": 5},
    "salud_macho": {"eventos_12m": 1, "n_diagnosticos": 0, "diagnosticos": []},
    "salud_hembra": {"eventos_12m": 0, "n_diagnosticos": 0, "diagnosticos": []},
}
