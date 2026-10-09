"""
Conocimiento previo zootécnico en forma de datos sintéticos.

Sirve de "punto de partida" del modelo cuando la granja aún tiene pocos partos
registrados. A medida que se acumulan servicios reales, el entrenamiento les da
cada vez más peso a los reales y menos a estos (ver modelo.peso_sintetico), de
modo que con suficiente historia el modelo aprende de la propia granja.

Las reglas usan efectos de la literatura caprina sobre la probabilidad de que
un servicio termine en parto exitoso (escala logit):
  - consanguinidad de la cría (pérdidas embrionarias por depresión endogámica)
  - edad de la hembra y del macho (inmadurez / senectud)
  - historial de la hembra y del macho (repetibilidad de la fertilidad)
  - intervalo desde el último parto (involución uterina incompleta < 60 días)
  - condición corporal y FAMACHA (balance energético y anemia parasitaria)
  - eventos sanitarios y enfermedades diagnosticadas
  - tipo de servicio (la IA y la transferencia tienen menor concepción)
"""

from __future__ import annotations

import math

import numpy as np

from rebano import FEATURE_NAMES, FEATURE_LABELS_ES, DESCONOCIDO  # noqa: F401 (reexport)

BASE = 0.78


def _logit(p: float) -> float:
    return math.log(p / (1 - p))


def prob_exito(f: dict) -> float:
    """Probabilidad de parto exitoso según las reglas zootécnicas."""
    z = _logit(BASE)
    z -= 6.0 * f["coi_cria"]                                   # F = 25 % → -1.5

    eh, em = f["edad_hembra_meses"], f["edad_macho_meses"]
    if eh != DESCONOCIDO:
        z += -2.2 if eh < 7 else -0.8 if eh < 10 else -0.7 if eh > 96 else 0.0
    if em != DESCONOCIDO:
        z += -1.6 if em < 8 else -0.4 if em < 12 else -0.5 if em > 96 else 0.0

    z += 2.5 * (f["tasa_exito_hembra"] - BASE) * min(1.0, f["servicios_previos_hembra"] / 3 + 0.3)
    z += 1.5 * (f["tasa_exito_macho"] - BASE) * min(1.0, f["servicios_previos_macho"] / 5 + 0.3)

    z -= 0.12 * max(0.0, f["eventos_salud_hembra_12m"] - 2)
    z -= 0.06 * max(0.0, f["eventos_salud_macho_12m"] - 2)
    z -= 0.35 * f["diagnosticos_hembra_12m"]

    d = f["dias_desde_ultimo_parto"]
    if d != DESCONOCIDO:
        z += -1.2 if d < 60 else -0.4 if d < 90 else 0.0

    cc = f["condicion_corporal_hembra"]
    if cc != DESCONOCIDO:
        z += -1.0 if cc < 2 else -0.3 if cc < 2.5 else -0.5 if cc > 4 else 0.15

    fam = f["famacha_hembra"]
    if fam != DESCONOCIDO:
        z += -0.8 if fam >= 4 else -0.2 if fam == 3 else 0.1

    z += {0: 0.0, 1: -0.35, 2: -0.6}.get(int(f["tipo_servicio"]), 0.0)
    if f["crias_promedio_hembra"] != DESCONOCIDO and f["crias_promedio_hembra"] > 1.5:
        z += 0.15
    z += 0.1 * f["mes_cos"]                                    # leve estacionalidad
    return 1 / (1 + math.exp(-z))


def _muestra(rng: np.random.Generator) -> dict:
    parentesco = rng.choice(["ninguno", "lejano", "primos", "medios", "cercano"],
                            p=[0.62, 0.15, 0.10, 0.08, 0.05])
    coi = {"ninguno": 0.0, "lejano": rng.uniform(0.005, 0.03), "primos": 0.0625,
           "medios": 0.125, "cercano": 0.25}[parentesco]
    serv_h = int(rng.poisson(2.2))
    exit_h = int(rng.binomial(serv_h, rng.beta(8, 2.3))) if serv_h else 0
    serv_m = int(rng.poisson(6))
    exit_m = int(rng.binomial(serv_m, rng.beta(8, 2.3))) if serv_m else 0
    tasa = lambda e, n: (e + 5 * BASE) / (n + 5)
    mes = int(rng.integers(1, 13))
    ang = 2 * math.pi * (mes - 1) / 12
    desc = lambda p: rng.random() < p
    return {
        "coi_cria": coi,
        "edad_macho_meses": DESCONOCIDO if desc(0.08) else float(rng.uniform(5, 110)),
        "edad_hembra_meses": DESCONOCIDO if desc(0.08) else float(rng.uniform(5, 110)),
        "misma_raza": float(rng.random() < 0.7),
        "eventos_salud_macho_12m": float(rng.poisson(1.5)),
        "eventos_salud_hembra_12m": float(rng.poisson(1.8)),
        "diagnosticos_hembra_12m": float(rng.poisson(0.3)),
        "servicios_previos_hembra": float(serv_h),
        "tasa_exito_hembra": tasa(exit_h, serv_h),
        "crias_promedio_hembra": float(rng.uniform(1.0, 2.6)) if exit_h else DESCONOCIDO,
        "servicios_previos_macho": float(serv_m),
        "tasa_exito_macho": tasa(exit_m, serv_m),
        "dias_desde_ultimo_parto": float(rng.uniform(25, 400)) if exit_h else DESCONOCIDO,
        "condicion_corporal_hembra": DESCONOCIDO if desc(0.4) else float(rng.choice([1.5, 2, 2.5, 3, 3.5, 4, 4.5])),
        "famacha_hembra": DESCONOCIDO if desc(0.5) else float(rng.choice([1, 2, 3, 4, 5], p=[0.25, 0.35, 0.22, 0.12, 0.06])),
        "tipo_servicio": float(rng.choice([0, 1, 2], p=[0.8, 0.17, 0.03])),
        "mes_sin": round(math.sin(ang), 4),
        "mes_cos": round(math.cos(ang), 4),
    }


def generar_dataset(n: int = 2000, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    X, y = [], []
    for _ in range(n):
        f = _muestra(rng)
        X.append([f[k] for k in FEATURE_NAMES])
        y.append(int(rng.random() < prob_exito(f)))
    return np.array(X, dtype=float), np.array(y, dtype=int)
