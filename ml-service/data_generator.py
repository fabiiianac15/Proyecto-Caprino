"""
Generador de datos sintéticos para entrenamiento del modelo de compatibilidad.

Las probabilidades de éxito están calibradas con reglas zootécnicas caprinas:
consanguinidad, edad reproductiva, historial sanitario e historial de partos.
"""

import numpy as np

FEATURE_NAMES = [
    "ancestros_comunes_count",       # Nº ancestros compartidos [0-4+]
    "relacion_directa",              # Relación padre/madre-hijo [0,1]
    "mismos_padres_completos",       # Hermanos completos [0,1]
    "mismo_padre",                   # Medio hermanos por padre [0,1]
    "misma_madre",                   # Medio hermanos por madre [0,1]
    "edad_macho_meses",              # Edad macho en meses
    "edad_hembra_meses",             # Edad hembra en meses
    "misma_raza",                    # Misma raza [0,1]
    "eventos_salud_macho_12m",       # Eventos sanitarios macho (12 meses)
    "eventos_salud_hembra_12m",      # Eventos sanitarios hembra (12 meses)
    "partos_exitosos_hembra",        # Partos exitosos históricos
    "total_partos_hembra",           # Total partos (excl. pendientes)
    "num_crias_promedio",            # Promedio crías por parto exitoso
    "generaciones_conocidas_macho",  # Profundidad genealógica macho [0-2]
    "generaciones_conocidas_hembra", # Profundidad genealógica hembra [0-2]
]

FEATURE_LABELS_ES = {
    "ancestros_comunes_count":       "Ancestros en común",
    "relacion_directa":              "Relación directa padre/madre-hijo",
    "mismos_padres_completos":       "Hermanos completos",
    "mismo_padre":                   "Mismo padre (medio hermanos)",
    "misma_madre":                   "Misma madre (medio hermanos)",
    "edad_macho_meses":              "Edad del macho",
    "edad_hembra_meses":             "Edad de la hembra",
    "misma_raza":                    "Misma raza",
    "eventos_salud_macho_12m":       "Eventos sanitarios macho (últimos 12 meses)",
    "eventos_salud_hembra_12m":      "Eventos sanitarios hembra (últimos 12 meses)",
    "partos_exitosos_hembra":        "Partos exitosos de la hembra",
    "total_partos_hembra":           "Total partos de la hembra",
    "num_crias_promedio":            "Promedio de crías por parto",
    "generaciones_conocidas_macho":  "Generaciones conocidas del macho",
    "generaciones_conocidas_hembra": "Generaciones conocidas de la hembra",
}


def _prob_exito(
    ancestros,
    relacion_directa,
    mismos_padres,
    mismo_padre,
    misma_madre,
    edad_macho,
    edad_hembra,
    eventos_macho,
    eventos_hembra,
    total_partos,
    partos_exitosos,
    num_crias,
):
    """Calcula la probabilidad de éxito según reglas zootécnicas caprinas."""
    if relacion_directa:
        return 0.04

    if mismos_padres:
        return 0.10

    prob = 0.72

    # Consanguinidad por parentesco
    if mismo_padre and misma_madre:
        prob -= 0.30
    elif mismo_padre or misma_madre:
        prob -= 0.20

    # Ancestros comunes adicionales
    prob -= min(ancestros * 0.07, 0.30)

    # Edad mínima reproductiva (macho: 8 meses, hembra: 7 meses)
    if edad_macho < 8:
        prob -= 0.42
    elif edad_macho < 12:
        prob -= 0.16

    if edad_hembra < 7:
        prob -= 0.48
    elif edad_hembra < 10:
        prob -= 0.22

    # Estado sanitario
    if eventos_macho > 5:
        prob -= 0.15
    elif eventos_macho > 3:
        prob -= 0.07

    if eventos_hembra > 5:
        prob -= 0.15
    elif eventos_hembra > 3:
        prob -= 0.07

    # Historial reproductivo de la hembra
    if total_partos > 0:
        tasa = partos_exitosos / total_partos
        if tasa >= 0.8:
            prob += 0.13
        elif tasa >= 0.6:
            prob += 0.06
        elif tasa < 0.4:
            prob -= 0.13

    if num_crias > 1.5:
        prob += 0.06

    return max(0.03, min(0.96, prob))


def generar_dataset(n: int = 800, seed: int = 42):
    """
    Genera n muestras sintéticas con sus etiquetas binarias.
    Devuelve (X: ndarray shape [n,15], y: ndarray shape [n]).
    """
    rng = np.random.default_rng(seed)
    X_rows, y_rows = [], []

    for _ in range(n):
        relacion = int(rng.choice([0, 1], p=[0.87, 0.13]))

        if relacion:
            mismos_padres = mismo_padre = misma_madre = 0
            ancestros = 0
        else:
            mismos_padres = int(rng.choice([0, 1], p=[0.82, 0.18]))
            if mismos_padres:
                mismo_padre = misma_madre = 1
                ancestros = int(rng.integers(1, 4))
            else:
                mismo_padre = int(rng.choice([0, 1], p=[0.72, 0.28]))
                misma_madre = int(rng.choice([0, 1], p=[0.72, 0.28]))
                ancestros = (
                    int(rng.integers(1, 3))
                    if (mismo_padre or misma_madre)
                    else int(rng.integers(0, 5))
                )

        edad_macho = float(rng.uniform(4, 96))
        edad_hembra = float(rng.uniform(3, 84))
        misma_raza = int(rng.choice([0, 1], p=[0.35, 0.65]))
        eventos_macho = int(rng.integers(0, 9))
        eventos_hembra = int(rng.integers(0, 9))
        total_partos = int(rng.integers(0, 8))
        partos_exitosos = (
            int(rng.integers(0, total_partos + 1)) if total_partos > 0 else 0
        )
        num_crias = float(rng.uniform(0.8, 2.8)) if total_partos > 0 else 0.0
        gen_macho = int(rng.integers(0, 3))
        gen_hembra = int(rng.integers(0, 3))

        prob = _prob_exito(
            ancestros, relacion, mismos_padres, mismo_padre, misma_madre,
            edad_macho, edad_hembra, eventos_macho, eventos_hembra,
            total_partos, partos_exitosos, num_crias,
        )
        resultado = int(rng.random() < prob)

        X_rows.append([
            ancestros, relacion, mismos_padres, mismo_padre, misma_madre,
            edad_macho, edad_hembra, misma_raza,
            eventos_macho, eventos_hembra,
            partos_exitosos, total_partos, num_crias,
            gen_macho, gen_hembra,
        ])
        y_rows.append(resultado)

    return np.array(X_rows, dtype=float), np.array(y_rows, dtype=int)
