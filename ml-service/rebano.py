"""
Instantánea del rebaño y consultas "a una fecha".

El backend envía TODO el rebaño en pocas consultas agregadas (animales con su
pedigrí, producción por lactancia, servicios/partos, salud, pesajes, FAMACHA y
clasificación lineal). Aquí se indexa una sola vez y se responden preguntas
como "¿cuántos partos exitosos tenía esta hembra ANTES de esta fecha?".

Calcular todo a una fecha concreta es lo que permite entrenar el modelo con el
historial real sin hacer trampa: cada servicio pasado se describe solo con lo
que se sabía el día de la monta.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
from collections import defaultdict
from functools import cached_property

from genetica import Pedigri, blup_rasgo, ResultadoBLUP

# Prior bayesiano para tasas de éxito (equivale a "k servicios a la tasa del rebaño")
FUERZA_PRIOR = 5
TASA_EXITO_DEFECTO = 0.78       # tasa de partos exitosos por servicio en caprinos
CRIAS_DEFECTO = 1.6             # prolificidad media caprina
REPETIBILIDAD_CAMADA = 0.15
GESTACION_DIAS = 150


def _fecha(v) -> dt.date | None:
    if not v:
        return None
    if isinstance(v, dt.date):
        return v
    try:
        return dt.date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def meses_entre(a: dt.date | None, b: dt.date) -> float | None:
    if a is None:
        return None
    return round((b - a).days / 30.44, 1)


def tasa_suavizada(exitos: int, total: int, base: float, fuerza: float = FUERZA_PRIOR) -> float:
    """Tasa con prior Beta: con pocos datos se acerca a la del rebaño."""
    return (exitos + fuerza * base) / (total + fuerza)


class Rebano:
    def __init__(self, snap: dict):
        self.snap = snap
        self.fecha_ref = _fecha(snap.get("fecha_referencia")) or dt.date.today()
        self.animales: dict[int, dict] = {}
        for a in snap.get("animales", []):
            a = dict(a)
            a["id"] = int(a["id"])
            a["fecha_nac"] = _fecha(a.get("fecha_nac"))
            a["padre"] = int(a["padre"]) if a.get("padre") else None
            a["madre"] = int(a["madre"]) if a.get("madre") else None
            self.animales[a["id"]] = a

        self.servicios: list[dict] = []
        for s in snap.get("servicios", []):
            s = dict(s)
            s["hembra"] = int(s["hembra"])
            s["macho"] = int(s["macho"]) if s.get("macho") else None
            s["fecha"] = _fecha(s.get("fecha"))
            s["fecha_parto"] = _fecha(s.get("fecha_parto"))
            s["crias"] = int(s["crias"]) if s.get("crias") else None
            if s["fecha"]:
                self.servicios.append(s)
        self.servicios.sort(key=lambda s: s["fecha"])
        self.serv_hembra: dict[int, list[dict]] = defaultdict(list)
        self.serv_macho: dict[int, list[dict]] = defaultdict(list)
        for s in self.servicios:
            self.serv_hembra[s["hembra"]].append(s)
            if s["macho"]:
                self.serv_macho[s["macho"]].append(s)

        self.salud: dict[int, list[dict]] = defaultdict(list)
        for e in snap.get("salud", []):
            f = _fecha(e.get("fecha"))
            if f:
                self.salud[int(e["id"])].append({"fecha": f, "tipo": e.get("tipo"), "diag": e.get("diag")})
        self.cc: dict[int, list[tuple[dt.date, float]]] = defaultdict(list)
        for e in snap.get("pesajes", []):
            f = _fecha(e.get("fecha"))
            if f and e.get("cc") is not None:
                self.cc[int(e["id"])].append((f, float(e["cc"])))
        self.famacha: dict[int, list[tuple[dt.date, int]]] = defaultdict(list)
        for e in snap.get("famacha", []):
            f = _fecha(e.get("fecha"))
            if f and e.get("puntuacion") is not None:
                self.famacha[int(e["id"])].append((f, int(e["puntuacion"])))
        self.lineal: dict[int, list[tuple[dt.date, float, float | None]]] = defaultdict(list)
        for e in snap.get("lineal", []):
            f = _fecha(e.get("fecha"))
            if f and e.get("punt_final") is not None:
                self.lineal[int(e["id"])].append((f, float(e["punt_final"]),
                                                  float(e["mamario"]) if e.get("mamario") is not None else None))
        for d in (self.cc, self.famacha, self.lineal):
            for v in d.values():
                v.sort()

        self.produccion: dict[int, list[dict]] = defaultdict(list)
        for p in snap.get("produccion", []):
            self.produccion[int(p["id"])].append(p)

        self._tasa_cache: dict[dt.date, float] = {}
        self._crias_cache: dict[dt.date, float] = {}

    # ------------------------------------------------------------------
    # Identidad y caché
    # ------------------------------------------------------------------

    @staticmethod
    def huella(snap: dict) -> str:
        return hashlib.sha1(json.dumps(snap, sort_keys=True, default=str).encode()).hexdigest()

    def info(self, a: int | None) -> dict:
        return self.animales.get(a, {}) if a is not None else {}

    def etiqueta(self, a: int | None) -> str:
        x = self.info(a)
        if not x:
            return "desconocido"
        nombre = (x.get("nombre") or "").strip()
        codigo = x.get("codigo") or a
        if not nombre or set(nombre) <= set(".-_ "):
            return f"chapeta {codigo}"
        return f"{nombre} ({codigo})"

    # ------------------------------------------------------------------
    # Genética (se calcula una vez por instantánea)
    # ------------------------------------------------------------------

    @cached_property
    def pedigri(self) -> Pedigri:
        return Pedigri({a: (x["padre"], x["madre"]) for a, x in self.animales.items()})

    def _registros(self, campo: str) -> list[tuple[int, int | None, float]]:
        regs = []
        for a, lacts in self.produccion.items():
            for p in lacts:
                if p.get(campo) is not None and int(p.get("n") or 0) >= 3:
                    regs.append((a, int(p["lactancia"]) if p.get("lactancia") else None, float(p[campo])))
        return regs

    @cached_property
    def blup_litros(self) -> ResultadoBLUP:
        return blup_rasgo(self.pedigri, self._registros("litros"), "litros")

    @cached_property
    def blup_grasa(self) -> ResultadoBLUP:
        return blup_rasgo(self.pedigri, self._registros("grasa"), "grasa")

    @cached_property
    def blup_proteina(self) -> ResultadoBLUP:
        return blup_rasgo(self.pedigri, self._registros("proteina"), "proteina")

    # ------------------------------------------------------------------
    # Estadísticas del rebaño (a una fecha)
    # ------------------------------------------------------------------

    @staticmethod
    def resultado_final(s: dict, hasta: dt.date) -> int | None:
        """1 = terminó en parto exitoso, 0 = no hubo parto (vacía, aborto,
        mortinato), None = aún no se sabe a esa fecha."""
        r = s.get("resultado")
        if r in ("aborto", "mortinato"):
            return 0
        if r == "exitoso":
            if s.get("fecha_parto") and s["fecha_parto"] <= hasta:
                return 1
            return None   # gestante: todavía no parió
        return None       # pendiente de diagnóstico

    def tasa_rebano(self, hasta: dt.date) -> float:
        if hasta in self._tasa_cache:
            return self._tasa_cache[hasta]
        self._tasa_cache[hasta] = self._tasa_rebano(hasta)
        return self._tasa_cache[hasta]

    def _tasa_rebano(self, hasta: dt.date) -> float:
        cerrados = [self.resultado_final(s, hasta) for s in self.servicios if s["fecha"] < hasta]
        cerrados = [r for r in cerrados if r is not None]
        if len(cerrados) < 10:
            return TASA_EXITO_DEFECTO
        return tasa_suavizada(sum(cerrados), len(cerrados), TASA_EXITO_DEFECTO, 10)

    def crias_rebano(self, hasta: dt.date) -> float:
        if hasta not in self._crias_cache:
            self._crias_cache[hasta] = self._crias_rebano(hasta)
        return self._crias_cache[hasta]

    def _crias_rebano(self, hasta: dt.date) -> float:
        c = [s["crias"] for s in self.servicios
             if s["crias"] and s.get("fecha_parto") and s["fecha_parto"] <= hasta]
        if len(c) < 10:
            return CRIAS_DEFECTO
        return (sum(c) + 10 * CRIAS_DEFECTO) / (len(c) + 10)

    # ------------------------------------------------------------------
    # Historial de un animal a una fecha
    # ------------------------------------------------------------------

    def edad_meses(self, a: int, fecha: dt.date) -> float | None:
        return meses_entre(self.info(a).get("fecha_nac"), fecha)

    def historial_hembra(self, a: int, hasta: dt.date) -> dict:
        servs = [s for s in self.serv_hembra.get(a, []) if s["fecha"] < hasta]
        res = [self.resultado_final(s, hasta) for s in servs]
        cerrados = [r for r in res if r is not None]
        partos = [s for s in servs if s.get("fecha_parto") and s["fecha_parto"] <= hasta]
        crias = [s["crias"] for s in partos if s["crias"]]
        abortos = sum(1 for s in servs if s.get("resultado") == "aborto")
        mortinatos = sum(1 for s in servs if s.get("resultado") == "mortinato")
        ultimo_parto = max((s["fecha_parto"] for s in partos), default=None)
        base = self.tasa_rebano(hasta)
        base_c = self.crias_rebano(hasta)
        n_c = len(crias)
        b = n_c * REPETIBILIDAD_CAMADA / (1 + (n_c - 1) * REPETIBILIDAD_CAMADA) if n_c else 0.0
        crias_prom = sum(crias) / n_c if n_c else None
        return {
            "servicios": len(cerrados),
            "exitosos": sum(cerrados),
            "abortos": abortos,
            "mortinatos": mortinatos,
            "partos": len(partos),
            "crias_promedio": round(crias_prom, 2) if crias_prom else None,
            "camada_esperada": round(base_c + b * ((crias_prom or base_c) - base_c), 2),
            "tasa_suavizada": round(tasa_suavizada(sum(cerrados), len(cerrados), base), 3),
            "tasa_rebano": round(base, 3),
            "dias_desde_parto": (hasta - ultimo_parto).days if ultimo_parto else None,
            "ultimo_parto": ultimo_parto.isoformat() if ultimo_parto else None,
        }

    def historial_macho(self, a: int, hasta: dt.date) -> dict:
        servs = [s for s in self.serv_macho.get(a, []) if s["fecha"] < hasta]
        res = [self.resultado_final(s, hasta) for s in servs]
        cerrados = [r for r in res if r is not None]
        base = self.tasa_rebano(hasta)
        return {
            "servicios": len(cerrados),
            "exitosos": sum(cerrados),
            "tasa_suavizada": round(tasa_suavizada(sum(cerrados), len(cerrados), base), 3),
            "tasa_rebano": round(base, 3),
        }

    def estado_reproductivo(self, a: int, hoy: dt.date) -> dict:
        """¿La hembra está disponible para un servicio hoy?"""
        for s in reversed(self.serv_hembra.get(a, [])):
            dias = (hoy - s["fecha"]).days
            if s.get("resultado") == "exitoso" and not s.get("fecha_parto") and dias <= GESTACION_DIAS + 20:
                return {"disponible": False, "motivo": f"Está preñada (servicio hace {dias} días)."}
            if s.get("resultado") == "pendiente" and dias <= 60:
                return {"disponible": False, "motivo": f"Tiene un servicio de hace {dias} días pendiente de diagnóstico."}
        return {"disponible": True, "motivo": None}

    def salud_hasta(self, a: int, hasta: dt.date, meses: int = 12) -> dict:
        desde = hasta - dt.timedelta(days=int(meses * 30.44))
        ev = [e for e in self.salud.get(a, []) if desde <= e["fecha"] < hasta]
        diags = sorted({e["diag"] for e in ev if e.get("tipo") == "diagnostico" and e.get("diag")})
        diags_hist = sorted({e["diag"] for e in self.salud.get(a, [])
                             if e.get("tipo") == "diagnostico" and e.get("diag") and e["fecha"] < hasta})
        return {"eventos": len(ev), "diagnosticos": diags, "diagnosticos_historicos": diags_hist}

    @staticmethod
    def _ultimo(serie: list, hasta: dt.date, max_dias: int = 365):
        val = None
        for f, *resto in serie:
            if f <= hasta and (hasta - f).days <= max_dias:
                val = resto[0] if len(resto) == 1 else tuple(resto)
        return val

    def cc_hasta(self, a: int, hasta: dt.date) -> float | None:
        return self._ultimo(self.cc.get(a, []), hasta, 180)

    def famacha_hasta(self, a: int, hasta: dt.date) -> int | None:
        return self._ultimo(self.famacha.get(a, []), hasta, 120)

    def produccion_resumen(self, a: int) -> dict:
        lacts = self.produccion.get(a, [])
        n = sum(int(p.get("n") or 0) for p in lacts)
        if not n:
            return {"n_registros": 0}

        def prom(campo):
            tot = sum(float(p[campo]) * int(p["n"]) for p in lacts if p.get(campo) is not None)
            den = sum(int(p["n"]) for p in lacts if p.get(campo) is not None)
            return round(tot / den, 2) if den else None
        return {
            "n_registros": n,
            "lactancias": len(lacts),
            "litros": prom("litros"),
            "grasa": prom("grasa"),
            "proteina": prom("proteina"),
            "cs": int(prom("cs")) if prom("cs") else None,
        }

    def lineal_resumen(self, a: int) -> dict | None:
        serie = self.lineal.get(a, [])
        if not serie:
            return None
        f, final, mamario = serie[-1]
        return {"punt_final": final, "mamario": mamario, "fecha": f.isoformat(), "n": len(serie)}

    def hijas(self, a: int) -> list[int]:
        return [x for x, info in self.animales.items()
                if info.get("sexo") == "hembra" and a in (info.get("padre"), info.get("madre"))]

    def lineal_hijas(self, a: int) -> dict | None:
        vals = [self.lineal[h][-1][1] for h in self.hijas(a) if self.lineal.get(h)]
        if not vals:
            return None
        return {"promedio": round(sum(vals) / len(vals), 1), "n": len(vals)}


# ---------------------------------------------------------------------------
# Características del modelo predictivo (mismas para entrenar y para predecir)
# ---------------------------------------------------------------------------

FEATURE_NAMES = [
    "coi_cria",
    "edad_macho_meses",
    "edad_hembra_meses",
    "misma_raza",
    "eventos_salud_macho_12m",
    "eventos_salud_hembra_12m",
    "diagnosticos_hembra_12m",
    "servicios_previos_hembra",
    "tasa_exito_hembra",
    "crias_promedio_hembra",
    "servicios_previos_macho",
    "tasa_exito_macho",
    "dias_desde_ultimo_parto",
    "condicion_corporal_hembra",
    "famacha_hembra",
    "tipo_servicio",
    "mes_sin",
    "mes_cos",
]

FEATURE_LABELS_ES = {
    "coi_cria": "Consanguinidad de la cría",
    "edad_macho_meses": "Edad del macho",
    "edad_hembra_meses": "Edad de la hembra",
    "misma_raza": "Misma raza",
    "eventos_salud_macho_12m": "Eventos sanitarios del macho (12 meses)",
    "eventos_salud_hembra_12m": "Eventos sanitarios de la hembra (12 meses)",
    "diagnosticos_hembra_12m": "Enfermedades diagnosticadas a la hembra (12 meses)",
    "servicios_previos_hembra": "Servicios previos de la hembra",
    "tasa_exito_hembra": "Historial de partos exitosos de la hembra",
    "crias_promedio_hembra": "Crías por parto de la hembra",
    "servicios_previos_macho": "Servicios previos del macho",
    "tasa_exito_macho": "Historial de preñeces logradas por el macho",
    "dias_desde_ultimo_parto": "Días desde el último parto",
    "condicion_corporal_hembra": "Condición corporal de la hembra",
    "famacha_hembra": "FAMACHA de la hembra",
    "tipo_servicio": "Tipo de servicio",
    "mes_sin": "Época del año",
    "mes_cos": "Época del año",
}

TIPO_SERVICIO_COD = {"monta_natural": 0, "inseminacion_artificial": 1, "transferencia_embrion": 2}
DESCONOCIDO = -1.0   # los árboles de decisión separan este valor sin problema


def features_cruce(r: Rebano, macho: int, hembra: int, fecha: dt.date,
                   tipo_servicio: str = "monta_natural") -> dict:
    hh = r.historial_hembra(hembra, fecha)
    hm = r.historial_macho(macho, fecha)
    sm = r.salud_hasta(macho, fecha)
    sh = r.salud_hasta(hembra, fecha)
    em, eh = r.edad_meses(macho, fecha), r.edad_meses(hembra, fecha)
    raza_m, raza_h = r.info(macho).get("raza"), r.info(hembra).get("raza")
    cc = r.cc_hasta(hembra, fecha)
    fam = r.famacha_hasta(hembra, fecha)
    ang = 2 * math.pi * (fecha.month - 1) / 12
    return {
        "coi_cria": r.pedigri.kinship(macho, hembra),
        "edad_macho_meses": em if em is not None else DESCONOCIDO,
        "edad_hembra_meses": eh if eh is not None else DESCONOCIDO,
        "misma_raza": 1.0 if raza_m and raza_m == raza_h else 0.0,
        "eventos_salud_macho_12m": float(sm["eventos"]),
        "eventos_salud_hembra_12m": float(sh["eventos"]),
        "diagnosticos_hembra_12m": float(len(sh["diagnosticos"])),
        "servicios_previos_hembra": float(hh["servicios"]),
        "tasa_exito_hembra": hh["tasa_suavizada"],
        "crias_promedio_hembra": hh["crias_promedio"] if hh["crias_promedio"] else DESCONOCIDO,
        "servicios_previos_macho": float(hm["servicios"]),
        "tasa_exito_macho": hm["tasa_suavizada"],
        "dias_desde_ultimo_parto": float(hh["dias_desde_parto"]) if hh["dias_desde_parto"] is not None else DESCONOCIDO,
        "condicion_corporal_hembra": cc if cc is not None else DESCONOCIDO,
        "famacha_hembra": float(fam) if fam is not None else DESCONOCIDO,
        "tipo_servicio": float(TIPO_SERVICIO_COD.get(tipo_servicio, 0)),
        "mes_sin": round(math.sin(ang), 4),
        "mes_cos": round(math.cos(ang), 4),
    }


def vector(feats: dict) -> list[float]:
    return [float(feats[n]) for n in FEATURE_NAMES]


def dataset_real(r: Rebano) -> tuple[list[list[float]], list[int], list[str]]:
    """Servicios históricos con resultado conocido → (X, y, fechas).
    Cada servicio se describe con lo que se sabía el día de la monta."""
    X, y, fechas = [], [], []
    for s in r.servicios:
        if not s["macho"] or s["hembra"] not in r.animales or s["macho"] not in r.animales:
            continue
        res = r.resultado_final(s, r.fecha_ref)
        if res is None:
            continue
        f = features_cruce(r, s["macho"], s["hembra"], s["fecha"], s.get("tipo") or "monta_natural")
        X.append(vector(f))
        y.append(res)
        fechas.append(s["fecha"].isoformat())
    return X, y, fechas
