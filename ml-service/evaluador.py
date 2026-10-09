"""
Motor de evaluación de cruces caprinos (v3).

Cada número se fundamenta en los registros reales del rebaño (instantánea
`Rebano`), en la genética cuantitativa (`genetica.py`: consanguinidad exacta,
BLUP) y en el modelo predictivo entrenado con el historial de la granja
(`modelo.py`). Nada se inventa: si falta información, baja la confianza de
esa dimensión y su peso en el score global.

Salida (lo consume el backend, el frontend y la IA generativa):
  scoreGlobal, clasificacion, confianzaGlobal, recomendacionVeterinaria,
  dimensiones[]  (score 0-100 de favorabilidad, nivel, confianza, evidencia)
  predicciones   (leche/grasa/proteína de una hija con intervalo, camada,
                  probabilidad de parto exitoso con sus factores)
  consanguinidad (F exacta, ancestros comunes con su aporte)
  alertas[]      (situaciones que impiden o desaconsejan el servicio hoy)
  arbolCria      (pedigrí de la futura cría, 4 generaciones)
"""

from __future__ import annotations

import bisect
from typing import Any

import numpy as np

import modelo as ml
from genetica import prediccion_cria
from rebano import Rebano, features_cruce, vector

PESOS = {
    "parto_exitoso":          0.20,
    "consanguinidad":         0.18,
    "merito_lechero":         0.16,
    "fertilidad":             0.12,
    "sanidad":                0.10,
    "aptitud_reproductiva":   0.08,
    "conformacion":           0.07,
    "riesgo_hereditario":     0.05,
    "afinidad_razas":         0.04,
}
_CONF_FACTOR = {"alta": 1.0, "media": 0.65, "baja": 0.30, "sin_datos": 0.0}
UMBRAL_F_ALTO = 0.125      # medios hermanos o más cercano
UMBRAL_F_PROHIBIDO = 0.25  # padre-hija / hermanos completos


def _clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> int:
    return int(round(max(lo, min(hi, x))))


def _pct(x: float, dec: int = 1) -> str:
    return f"{round(x * 100, dec)} %"


def _parentesco_texto(gen: int, sexo_desc: str) -> str:
    nombres = {0: "él/ella misma", 1: "padre/madre", 2: "abuelo/a", 3: "bisabuelo/a",
               4: "tatarabuelo/a"}
    return nombres.get(gen, f"ancestro a {gen} generaciones") + f" {sexo_desc}"


# ---------------------------------------------------------------------------
# Contexto compartido (se calcula una vez por instantánea)
# ---------------------------------------------------------------------------

class Contexto:
    def __init__(self, rebano: Rebano, modelo_ml):
        self.r = rebano
        self.modelo = modelo_ml
        self.metricas = ml.get_metrics()
        self._dist_pa: list[float] | None = None

    def activos(self, sexo: str) -> list[int]:
        return [a for a, x in self.r.animales.items() if x.get("sexo") == sexo and x.get("estado") == "activo"]

    def percentil_pa(self, pa: float) -> float | None:
        """Percentil del mérito lechero del cruce entre todos los cruces posibles
        del rebaño activo (machos × hembras)."""
        if self._dist_pa is None:
            b = self.r.blup_litros
            if not b.n_registros:
                self._dist_pa = []
            else:
                m = np.array([b.ebv.get(a, 0.0) for a in self.activos("macho")])
                h = np.array([b.ebv.get(a, 0.0) for a in self.activos("hembra")])
                if len(m) and len(h):
                    self._dist_pa = sorted(((m[:, None] + h[None, :]) / 2).ravel().tolist())
                else:
                    self._dist_pa = []
        if not self._dist_pa:
            return None
        return bisect.bisect_left(self._dist_pa, pa) / len(self._dist_pa)


# ---------------------------------------------------------------------------
# Dimensiones
# ---------------------------------------------------------------------------

def _dim_consanguinidad(c: Contexto, macho: int, hembra: int, f: float, comunes: list[dict]) -> dict:
    r = c.r
    compl = (r.pedigri.completitud(macho) + r.pedigri.completitud(hembra)) / 2
    score = _clamp(100 - f * 400)
    nivel = "bajo" if f < 0.0625 else "moderado" if f < UMBRAL_F_ALTO else "alto"
    ev = [f"Consanguinidad exacta de la cría: {_pct(f, 2)} (método tabular sobre todo el pedigrí registrado)."]
    for a in comunes[:4]:
        ev.append(
            f"Ancestro común {r.etiqueta(a['id'])}: es {_parentesco_texto(a['gen_macho'], 'del macho')} "
            f"y {_parentesco_texto(a['gen_hembra'], 'de la hembra')}; aporta {_pct(a['aporte'], 2)}."
        )
    if not comunes:
        ev.append("No hay ancestros comunes en el pedigrí registrado.")
    ev.append(f"Pedigrí conocido (3 generaciones): {round(compl * 100)} % de los ancestros.")
    if f >= UMBRAL_F_PROHIBIDO:
        ev.append("Parentesco muy cercano (padre-hija o hermanos completos): cruce no aconsejable.")
    confianza = "alta" if compl >= 0.6 else "media" if compl >= 0.25 else "baja"
    if confianza != "alta":
        ev.append("Con pedigrí incompleto la consanguinidad real puede ser mayor que la calculada.")
    return {"id": "consanguinidad", "titulo": "Riesgo de consanguinidad", "valor": _pct(f, 2),
            "score": score, "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_merito(c: Contexto, macho: int, hembra: int, pred: dict, preds_extra: list[dict]) -> dict:
    b = c.r.blup_litros
    ev = []
    if not b.n_registros:
        return {"id": "merito_lechero", "titulo": "Mérito genético lechero", "valor": "Sin datos",
                "score": 50, "nivel": "desconocido", "confianza": "sin_datos",
                "evidencia": ["No hay producción de leche registrada en el rebaño para estimar valores genéticos."]}
    pct = c.percentil_pa(pred["merito_genetico"])
    score = _clamp(pct * 100) if pct is not None else 50
    signo = lambda v: f"{'+' if v >= 0 else ''}{round(v, 2)}"
    ev.append(f"Valor genético del macho: {signo(pred['ebv_macho'])} L/día (confiabilidad {round(pred['conf_macho'] * 100)} %).")
    ev.append(f"Valor genético de la hembra: {signo(pred['ebv_hembra'])} L/día (confiabilidad {round(pred['conf_hembra'] * 100)} %).")
    ev.append(
        f"Una hija produciría en lactancia adulta unos {pred['esperado']} L/día "
        f"(80 % de probabilidad entre {pred['intervalo80'][0]} y {pred['intervalo80'][1]}); "
        f"media del rebaño {pred['media_rebano']} L/día."
    )
    if pred["depresion_consanguinidad"] > 0.005:
        ev.append(f"La consanguinidad le resta unos {round(pred['depresion_consanguinidad'], 2)} L/día.")
    for p in preds_extra:
        ev.append(f"{p['rasgo'].capitalize()} esperada en la hija: {p['esperado']} {p['unidad']} "
                  f"(rebaño {p['media_rebano']} {p['unidad']}).")
    if pct is not None:
        ev.append(f"Supera al {round(pct * 100)} % de los cruces posibles entre los animales activos.")
    conf = pred["confiabilidad"]
    confianza = "alta" if conf >= 0.35 else "media" if conf >= 0.15 else "baja" if conf > 0.02 else "sin_datos"
    nivel = "alto" if score >= 70 else "medio" if score >= 40 else "bajo"
    return {"id": "merito_lechero", "titulo": "Mérito genético lechero",
            "valor": f"{pred['esperado']} L/día", "score": score, "nivel": nivel,
            "confianza": confianza, "evidencia": ev}


def _dim_parto(c: Contexto, prob: dict, hh: dict) -> dict:
    p = prob["probabilidad"]
    score = _clamp(p * 100)
    m = c.metricas
    n_real = int(m.get("n_reales") or 0)
    ev = [f"Probabilidad estimada de que el servicio termine en parto exitoso: {round(p * 100)} %."]
    for fct in prob["factores"][:4]:
        val = f" ({fct['valor']})" if fct.get("valor") not in (None, "") else ""
        ev.append(f"{fct['label']}{val}: {'+' if fct['puntos'] > 0 else ''}{fct['puntos']} puntos.")
    if hh["servicios"]:
        ev.append(f"Historial de la hembra: {hh['exitosos']} partos exitosos en {hh['servicios']} servicios"
                  + (f", {hh['abortos']} vacías/abortos" if hh["abortos"] else "")
                  + (f", {hh['mortinatos']} mortinatos" if hh["mortinatos"] else "") + ".")
    val = m.get("validacion_real")
    if val:
        ev.append(f"Modelo validado con {n_real} servicios reales de la granja (AUC {val['auc']}).")
    else:
        ev.append(f"Modelo basado en conocimiento zootécnico; la granja tiene {n_real} servicios cerrados "
                  f"(se valida con datos reales a partir de 30).")
    confianza = "alta" if n_real >= 100 and val else "media" if n_real >= 30 or hh["servicios"] >= 2 else "baja"
    nivel = "alta" if score >= 70 else "moderada" if score >= 50 else "baja"
    return {"id": "parto_exitoso", "titulo": "Probabilidad de parto exitoso", "valor": f"{round(p * 100)} %",
            "score": score, "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_fertilidad(c: Contexto, macho: int, hembra: int, hh: dict, hm: dict) -> dict:
    r = c.r
    base_c = r.crias_rebano(r.fecha_ref)
    prolif = _clamp(50 + (hh["camada_esperada"] - base_c) * 70)
    score = _clamp((hh["tasa_suavizada"] * 100 + hm["tasa_suavizada"] * 100 + prolif) / 3)
    ev = [
        f"Fertilidad de la hembra {r.etiqueta(hembra)}: {round(hh['tasa_suavizada'] * 100)} % "
        f"({hh['exitosos']}/{hh['servicios']} servicios; con pocos datos se acerca a la tasa del rebaño, "
        f"{round(hh['tasa_rebano'] * 100)} %).",
        f"Fertilidad del macho {r.etiqueta(macho)}: {round(hm['tasa_suavizada'] * 100)} % "
        f"({hm['exitosos']}/{hm['servicios']} servicios).",
        f"Camada esperada: {hh['camada_esperada']} crías por parto (rebaño {round(base_c, 2)}).",
    ]
    n = hh["servicios"] + hm["servicios"]
    confianza = "alta" if hh["servicios"] >= 3 and hm["servicios"] >= 3 else "media" if n >= 2 else "baja"
    nivel = "alta" if score >= 70 else "media" if score >= 50 else "baja"
    return {"id": "fertilidad", "titulo": "Fertilidad y prolificidad", "valor": f"{hh['camada_esperada']} crías",
            "score": score, "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_sanidad(c: Contexto, macho: int, hembra: int) -> dict:
    r, hoy = c.r, c.r.fecha_ref
    sm, sh = r.salud_hasta(macho, hoy), r.salud_hasta(hembra, hoy)
    fam = r.famacha_hasta(hembra, hoy)
    cs = r.produccion_resumen(hembra).get("cs")
    riesgo = (len(sm["diagnosticos"]) + len(sh["diagnosticos"])) * 14 \
        + max(0, sm["eventos"] - 2) * 4 + max(0, sh["eventos"] - 2) * 5
    ev = [f"Eventos sanitarios en 12 meses: macho {sm['eventos']}, hembra {sh['eventos']}."]
    if sm["diagnosticos"] or sh["diagnosticos"]:
        ev.append("Enfermedades diagnosticadas en 12 meses: "
                  + "; ".join(filter(None, [
                      f"macho: {', '.join(sm['diagnosticos'])}" if sm["diagnosticos"] else "",
                      f"hembra: {', '.join(sh['diagnosticos'])}" if sh["diagnosticos"] else ""])) + ".")
    else:
        ev.append("Sin enfermedades diagnosticadas en los últimos 12 meses.")
    if fam is not None:
        ev.append(f"Último FAMACHA de la hembra: {fam} " + ("(anemia: tratar antes del servicio)." if fam >= 4
                  else "(vigilar)." if fam == 3 else "(bien)."))
        riesgo += 18 if fam >= 4 else 6 if fam == 3 else 0
    if cs:
        ev.append(f"Células somáticas medias de la hembra: {cs:,}/ml" + (" (posible mastitis subclínica)." if cs >= 500000 else "."))
        if cs >= 500000:
            riesgo += 10
    score = _clamp(100 - riesgo)
    hay_datos = sm["eventos"] or sh["eventos"] or fam is not None or cs
    confianza = "alta" if hay_datos else "baja"
    if not hay_datos:
        ev.append("No hay registros sanitarios recientes: no se puede confirmar su estado de salud.")
    nivel = "bueno" if score >= 70 else "regular" if score >= 45 else "malo"
    return {"id": "sanidad", "titulo": "Estado sanitario", "valor": nivel.capitalize(), "score": score,
            "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_hereditario(c: Contexto, macho: int, hembra: int, f: float) -> dict:
    r, hoy = c.r, c.r.fecha_ref
    propios = set(r.salud_hasta(macho, hoy)["diagnosticos_historicos"]) | set(r.salud_hasta(hembra, hoy)["diagnosticos_historicos"])
    padres = set()
    for a in (macho, hembra):
        for p in (r.pedigri.padre(a), r.pedigri.madre(a)):
            if p is not None:
                padres |= set(r.salud_hasta(p, hoy)["diagnosticos_historicos"])
    riesgo = f * 200 + len(propios) * 8 + len(padres - propios) * 5
    score = _clamp(100 - riesgo)
    ev = []
    if propios:
        ev.append("Enfermedades registradas alguna vez en los padres del cruce: " + ", ".join(sorted(propios)) + ".")
    if padres - propios:
        ev.append("En sus propios padres (abuelos de la cría): " + ", ".join(sorted(padres - propios)) + ".")
    if not propios and not padres:
        ev.append("No hay enfermedades registradas en estos animales ni en sus padres.")
    if f > 0:
        ev.append(f"La consanguinidad ({_pct(f, 2)}) aumenta la probabilidad de que aparezcan defectos recesivos.")
    compl = (r.pedigri.completitud(macho, 1) + r.pedigri.completitud(hembra, 1)) / 2
    confianza = "media" if compl >= 0.5 else "baja"
    nivel = "bajo" if score >= 70 else "moderado" if score >= 45 else "alto"
    return {"id": "riesgo_hereditario", "titulo": "Riesgo hereditario", "valor": nivel.capitalize(),
            "score": score, "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_aptitud(c: Contexto, macho: int, hembra: int, hh: dict, alertas: list) -> dict:
    r, hoy = c.r, c.r.fecha_ref
    em, eh = r.edad_meses(macho, hoy), r.edad_meses(hembra, hoy)
    cc = r.cc_hasta(hembra, hoy)
    score, ev = 75, []
    if em is not None:
        if em < 8:
            score -= 35; ev.append(f"Macho de {round(em)} meses: aún no tiene la edad mínima para servir (~8 meses).")
            alertas.append({"tipo": "edad", "nivel": "alto", "texto": f"El macho tiene {round(em)} meses: es muy joven para servir."})
        elif em > 96:
            score -= 12; ev.append(f"Macho de {round(em)} meses: edad avanzada.")
        else:
            score += 8; ev.append(f"Macho de {round(em)} meses: edad reproductiva adecuada.")
    if eh is not None:
        if eh < 7:
            score -= 40; ev.append(f"Hembra de {round(eh)} meses: aún no tiene la edad mínima (~7-8 meses y buen peso).")
            alertas.append({"tipo": "edad", "nivel": "alto", "texto": f"La hembra tiene {round(eh)} meses: es muy joven para preñarla."})
        elif eh > 96:
            score -= 12; ev.append(f"Hembra de {round(eh)} meses: edad avanzada para la gestación.")
        else:
            score += 8; ev.append(f"Hembra de {round(eh)} meses: edad reproductiva adecuada.")
    d = hh["dias_desde_parto"]
    if d is not None:
        if d < 60:
            score -= 25; ev.append(f"Parió hace {d} días: el útero aún no se recupera (lo ideal es esperar al menos 60 días).")
            alertas.append({"tipo": "posparto", "nivel": "medio", "texto": f"La hembra parió hace solo {d} días; espere al menos 60."})
        else:
            ev.append(f"Último parto hace {d} días.")
    if cc is not None:
        if 2.5 <= cc <= 3.5:
            score += 5; ev.append(f"Condición corporal de la hembra {cc}/5: adecuada.")
        else:
            score -= 10; ev.append(f"Condición corporal de la hembra {cc}/5: fuera del rango ideal (2,5-3,5).")
    estado = r.estado_reproductivo(hembra, hoy)
    if not estado["disponible"]:
        score -= 50
        ev.append(estado["motivo"])
        alertas.append({"tipo": "disponibilidad", "nivel": "alto", "texto": "La hembra no está disponible ahora: " + estado["motivo"]})
    if not ev:
        ev.append("Sin fecha de nacimiento ni condición corporal registradas.")
    score = _clamp(score)
    confianza = "alta" if em is not None and eh is not None else "baja"
    nivel = "alta" if score >= 70 else "media" if score >= 50 else "baja"
    return {"id": "aptitud_reproductiva", "titulo": "Aptitud reproductiva actual", "valor": nivel.capitalize(),
            "score": score, "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_conformacion(c: Contexto, macho: int, hembra: int) -> dict:
    r = c.r
    lh = r.lineal_resumen(hembra)
    lm = r.lineal_hijas(macho)
    vals, ev = [], []
    if lh:
        vals.append(lh["punt_final"])
        ev.append(f"Clasificación lineal de la hembra: {lh['punt_final']}/100"
                  + (f" (sistema mamario {lh['mamario']}/40)" if lh.get("mamario") is not None else "") + ".")
    if lm:
        vals.append(lm["promedio"])
        ev.append(f"Hijas del macho evaluadas: {lm['n']}, con clasificación lineal media de {lm['promedio']}/100.")
    if not vals:
        return {"id": "conformacion", "titulo": "Conformación (clasificación lineal)", "valor": "Sin datos",
                "score": 50, "nivel": "desconocido", "confianza": "sin_datos",
                "evidencia": ["Ni la hembra ni las hijas del macho tienen clasificación lineal registrada."]}
    prom = sum(vals) / len(vals)
    confianza = "alta" if lh and lm and lm["n"] >= 3 else "media" if len(vals) == 2 or (lm and lm["n"] >= 3) else "baja"
    nivel = "excelente" if prom >= 90 else "buena" if prom >= 80 else "aceptable" if prom >= 70 else "regular"
    return {"id": "conformacion", "titulo": "Conformación (clasificación lineal)", "valor": f"{round(prom, 1)}/100",
            "score": _clamp(prom), "nivel": nivel, "confianza": confianza, "evidencia": ev}


def _dim_razas(c: Contexto, macho: int, hembra: int) -> dict:
    im, ih = c.r.info(macho), c.r.info(hembra)
    rm, rh = im.get("raza"), ih.get("raza")
    am, ah = im.get("aptitud"), ih.get("aptitud")
    if rm and rm == rh:
        score, txt = 85, f"Ambos son {rm}: la cría conserva la raza."
    elif am and am == ah:
        score, txt = 75, f"Razas distintas ({rm} × {rh}) con la misma aptitud ({am}): cruce con vigor híbrido."
    elif rm and rh:
        score, txt = 60, f"Razas de aptitud distinta ({rm}: {am or '?'}, {rh}: {ah or '?'}): cría de doble propósito."
    else:
        score, txt = 50, "Raza de alguno de los animales sin registrar."
    return {"id": "afinidad_razas", "titulo": "Afinidad de razas", "valor": f"{rm or '?'} × {rh or '?'}",
            "score": score, "nivel": "alta" if score >= 75 else "media", "confianza": "alta" if rm and rh else "baja",
            "evidencia": [txt]}


# ---------------------------------------------------------------------------
# Árbol de la futura cría
# ---------------------------------------------------------------------------

def _nodo(c: Contexto, a: int | None, nivel: int, comunes: dict[int, float], max_nivel: int = 3):
    if a is None:
        return None
    r = c.r
    x = r.info(a)
    b = r.blup_litros
    ebv, conf = b.de(a)
    nodo = {
        "id": a, "nombre": x.get("nombre"), "codigo": x.get("codigo"), "sexo": x.get("sexo"),
        "raza": x.get("raza"), "estado": x.get("estado"),
        "edadMeses": r.edad_meses(a, r.fecha_ref),
        "consanguinidad": round(r.pedigri.consanguinidad(a), 4),
        "ebvLeche": round(ebv, 3) if b.n_registros else None,
        "confEbv": round(conf, 2) if b.n_registros else None,
        "comun": a in comunes,
        "aporte": round(comunes.get(a, 0.0), 4),
        "registrado": bool(x),
        "padre": None, "madre": None,
    }
    if nivel < max_nivel:
        nodo["padre"] = _nodo(c, r.pedigri.padre(a), nivel + 1, comunes, max_nivel)
        nodo["madre"] = _nodo(c, r.pedigri.madre(a), nivel + 1, comunes, max_nivel)
    return nodo


# ---------------------------------------------------------------------------
# Ensamblado
# ---------------------------------------------------------------------------

def _clasificar(score: int, conf_global: str, f: float, alertas: list) -> tuple[str, str]:
    if f >= UMBRAL_F_PROHIBIDO:
        return "No recomendado", ("El parentesco entre los dos animales es demasiado cercano: la cría tendría "
                                  "alta consanguinidad. Busque otro reproductor.")
    if score < 40:
        return "No recomendado", "Los riesgos identificados desaconsejan este cruce. Considere otro reproductor."
    if conf_global == "baja":
        return "Datos insuficientes", ("No hay datos suficientes para una recomendación firme. Registre producción, "
                                       "partos, salud y el pedigrí de ambos animales.")
    if score >= 72 and f >= UMBRAL_F_ALTO:
        # Con parentesco de medios hermanos o más cercano no se recomienda,
        # aunque el resto de dimensiones sea bueno.
        return "Precaución", ("El cruce es bueno en lo demás, pero los animales son parientes cercanos "
                              f"(la cría tendría {_pct(f, 1)} de consanguinidad). Prefiera otra pareja si la hay.")
    if score >= 72:
        txt = "Cruce favorable según los datos de la granja."
    elif score >= 50:
        return "Precaución", "Cruce viable con reservas: revise los puntos débiles antes de la monta."
    else:
        return "No recomendado", "Los riesgos identificados desaconsejan este cruce. Considere otro reproductor."
    if any(a["nivel"] == "alto" for a in alertas):
        txt += " Pero hoy no es el momento: atienda primero las alertas."
    return "Recomendado", txt


def evaluar(c: Contexto, macho: int, hembra: int, detalle: bool = True,
            prob: dict | None = None) -> dict[str, Any]:
    """`prob` permite pasar la probabilidad ya calculada en lote (ranking)."""
    r = c.r
    hoy = r.fecha_ref
    f = r.pedigri.kinship(macho, hembra)
    comunes = r.pedigri.ancestros_comunes(macho, hembra) if detalle or f > 0 else []
    hh = r.historial_hembra(hembra, hoy)
    hm = r.historial_macho(macho, hoy)
    if prob is None:
        prob = ml.predecir(c.modelo, features_cruce(r, macho, hembra, hoy), explicar=detalle)
    pred_l = prediccion_cria(r.blup_litros, macho, hembra, f, r.pedigri)
    preds_extra = []
    if detalle:   # grasa y proteína solo en la evaluación individual (más cálculo)
        for blup in (r.blup_grasa, r.blup_proteina):
            if blup.n_registros:
                preds_extra.append(prediccion_cria(blup, macho, hembra, f, r.pedigri))

    alertas: list[dict] = []
    if f >= UMBRAL_F_PROHIBIDO:
        alertas.append({"tipo": "parentesco", "nivel": "alto",
                        "texto": f"Parentesco muy cercano: la cría tendría {_pct(f, 1)} de consanguinidad."})
    elif f >= UMBRAL_F_ALTO:
        alertas.append({"tipo": "parentesco", "nivel": "medio",
                        "texto": f"Parentesco de medios hermanos o similar: {_pct(f, 1)} de consanguinidad en la cría."})
    dims = [
        _dim_parto(c, prob, hh),
        _dim_consanguinidad(c, macho, hembra, f, comunes),
        _dim_merito(c, macho, hembra, pred_l, preds_extra),
        _dim_fertilidad(c, macho, hembra, hh, hm),
        _dim_sanidad(c, macho, hembra),
        _dim_aptitud(c, macho, hembra, hh, alertas),
        _dim_conformacion(c, macho, hembra),
        _dim_hereditario(c, macho, hembra, f),
        _dim_razas(c, macho, hembra),
    ]

    num = den = 0.0
    for d in dims:
        w = PESOS[d["id"]] * _CONF_FACTOR[d["confianza"]]
        num += d["score"] * w
        den += w
    score = _clamp(num / den) if den else 0
    completitud = sum(PESOS[d["id"]] * _CONF_FACTOR[d["confianza"]] for d in dims) / sum(PESOS.values())
    conf_global = "alta" if completitud >= 0.7 else "media" if completitud >= 0.4 else "baja"
    clasificacion, recomendacion = _clasificar(score, conf_global, f, alertas)

    out = {
        "scoreGlobal": score,
        "clasificacion": clasificacion,
        "confianzaGlobal": conf_global,
        "completitudDatos": round(completitud, 2),
        "recomendacionVeterinaria": recomendacion,
        "dimensiones": dims,
        "alertas": alertas,
        "predicciones": {
            "partoExitoso": {"probabilidad": prob["probabilidad"], "factores": prob["factores"]},
            "leche": pred_l if r.blup_litros.n_registros else None,
            "componentes": preds_extra,
            "camadaEsperada": hh["camada_esperada"],
            "consanguinidadCria": round(f, 4),
        },
        "consanguinidad": {
            "f": round(f, 4),
            "ancestrosComunes": [{**a, "aporte": round(a["aporte"], 4), "nombre": r.etiqueta(a["id"])} for a in comunes],
            "completitudMacho": round(r.pedigri.completitud(macho), 2),
            "completitudHembra": round(r.pedigri.completitud(hembra), 2),
        },
        "metodo": "motor-evaluacion-v3 (BLUP + consanguinidad exacta + modelo calibrado con la granja)",
    }
    if detalle:
        cmap = {a["id"]: a["aporte"] for a in comunes}
        out["arbolCria"] = {
            "id": None, "nombre": "Futura cría", "consanguinidad": round(f, 4),
            "padre": _nodo(c, macho, 1, cmap), "madre": _nodo(c, hembra, 1, cmap),
        }
        out["animales"] = {
            "macho": _resumen_animal(c, macho), "hembra": _resumen_animal(c, hembra),
        }
    return out


def _resumen_animal(c: Contexto, a: int) -> dict:
    r = c.r
    x = r.info(a)
    ebv, conf = r.blup_litros.de(a)
    return {
        "id": a, "nombre": x.get("nombre"), "codigo": x.get("codigo"), "sexo": x.get("sexo"),
        "raza": x.get("raza"), "edadMeses": r.edad_meses(a, r.fecha_ref),
        "consanguinidad": round(r.pedigri.consanguinidad(a), 4),
        "ebvLeche": round(ebv, 3) if r.blup_litros.n_registros else None,
        "confEbv": round(conf, 2) if r.blup_litros.n_registros else None,
        "produccion": r.produccion_resumen(a),
        "generacionesConocidas": r.pedigri.generaciones_conocidas(a),
    }


def ranking(c: Contexto, base: int, limite: int = 10, solo_misma_raza: bool = False,
            max_consanguinidad: float | None = None, solo_disponibles: bool = False) -> dict:
    r = c.r
    info = r.info(base)
    sexo = info.get("sexo")
    if sexo not in ("macho", "hembra"):
        return {"base": None, "total": 0, "ranking": []}
    opuesto = "hembra" if sexo == "macho" else "macho"
    candidatos = [a for a in c.activos(opuesto) if a != base]
    if solo_misma_raza and info.get("raza"):
        candidatos = [a for a in candidatos if r.info(a).get("raza") == info.get("raza")]

    pares = []
    for cand in candidatos:
        macho, hembra = (base, cand) if sexo == "macho" else (cand, base)
        if max_consanguinidad is not None and r.pedigri.kinship(macho, hembra) > max_consanguinidad:
            continue
        pares.append((cand, macho, hembra))
    # Probabilidades del modelo en un solo lote y confiabilidades genéticas juntas
    probs = ml.predecir_lote(c.modelo, [vector(features_cruce(r, m, h, r.fecha_ref)) for _, m, h in pares])
    r.blup_litros.precalcular([base] + [cand for cand, _, _ in pares])

    filas = []
    for (cand, macho, hembra), p in zip(pares, probs):
        ev = evaluar(c, macho, hembra, detalle=False, prob={"probabilidad": round(p, 4), "factores": []})
        disponible = not any(a["tipo"] == "disponibilidad" for a in ev["alertas"])
        if solo_disponibles and not disponible:
            continue
        niveles = {d["id"]: d for d in ev["dimensiones"]}
        leche = ev["predicciones"]["leche"]
        x = r.info(cand)
        filas.append({
            "candidato": {"id": cand, "nombre": x.get("nombre"), "codigo": x.get("codigo"),
                          "raza": x.get("raza"), "edadMeses": r.edad_meses(cand, r.fecha_ref)},
            "score": ev["scoreGlobal"],
            "clasificacion": ev["clasificacion"],
            "confianza": ev["confianzaGlobal"],
            "coi": ev["consanguinidad"]["f"],
            "probParto": ev["predicciones"]["partoExitoso"]["probabilidad"],
            "lecheHija": leche["esperado"] if leche else None,
            "lecheIntervalo": leche["intervalo80"] if leche else None,
            "camada": ev["predicciones"]["camadaEsperada"],
            "disponible": disponible,
            "alertas": ev["alertas"],
            "dimensiones": {k: {"score": v["score"], "nivel": v["nivel"], "confianza": v["confianza"]}
                            for k, v in niveles.items()},
        })
    filas.sort(key=lambda x: (-x["score"], x["coi"]))
    return {
        "base": {"id": base, "nombre": info.get("nombre"), "codigo": info.get("codigo"),
                 "sexo": sexo, "raza": info.get("raza")},
        "total": len(filas),
        "ranking": filas[:limite],
    }
