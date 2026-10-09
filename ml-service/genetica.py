"""
Genética cuantitativa del rebaño: parentesco, consanguinidad y valores genéticos.

Todo se calcula a partir del pedigrí y los registros REALES del rebaño:

1. Parentesco (kinship) y consanguinidad EXACTOS con el método tabular recursivo
   sobre el pedigrí completo (todas las generaciones registradas):
       f(a, a) = ½ (1 + F_a)            F_a = f(padre_a, madre_a)
       f(a, b) = ½ [f(padre_a, b) + f(madre_a, b)]   (a no es ancestro de b)
   El coeficiente de consanguinidad de la cría de un cruce es f(macho, hembra).

2. Ancestros comunes con su aporte (fórmula de Wright) para EXPLICAR el valor:
       F = Σ (½)^(n1 + n2 + 1) · (1 + F_A)
   sobre los pares de caminos que no comparten animales salvo el ancestro A.

3. Valor genético estimado (EBV) por BLUP con modelo animal de repetibilidad
   (Henderson): y = Xb + Za + Wpe + e, usando la inversa de la matriz de
   parentesco A⁻¹ (reglas de Henderson con consanguinidad). Cada animal recibe
   información de sus propios registros, de sus padres y de sus hijas.
   La confiabilidad (0-1) sale de la varianza del error de predicción (PEV).

4. Predicción para la cría de un cruce: media de los EBV de los padres, con su
   intervalo de predicción y la depresión por consanguinidad.

Parámetros genéticos de cabras lecheras (valores de literatura, ajustables).
"""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass, field

import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import splu

sys.setrecursionlimit(20000)

# Heredabilidad (h²) y repetibilidad (t) por rasgo — cabras lecheras.
PARAMETROS = {
    "litros":   {"h2": 0.30, "t": 0.50, "sd_defecto": 0.60, "unidad": "L/día"},
    "grasa":    {"h2": 0.45, "t": 0.60, "sd_defecto": 0.50, "unidad": "%"},
    "proteina": {"h2": 0.50, "t": 0.60, "sd_defecto": 0.35, "unidad": "%"},
}
# Pérdida de producción por cada 1 % de consanguinidad de la cría (depresión
# endogámica; en caprinos se reportan pérdidas de ~0,2-0,5 % por 1 % de F).
DEPRESION_LECHE_POR_PUNTO_F = 0.004


# ---------------------------------------------------------------------------
# Pedigrí
# ---------------------------------------------------------------------------

class Pedigri:
    """Pedigrí del rebaño con parentesco exacto memorizado."""

    def __init__(self, padres: dict[int, tuple[int | None, int | None]]):
        # padres: id -> (padre, madre). Los padres que no están como animal se
        # agregan como fundadores (sin padres conocidos).
        self.padres: dict[int, tuple[int | None, int | None]] = {}
        for a, (p, m) in padres.items():
            self.padres[a] = (p, m)
        for a, (p, m) in list(padres.items()):
            for x in (p, m):
                if x is not None and x not in self.padres:
                    self.padres[x] = (None, None)
        self._limpiar_ciclos()
        self.orden = self._calcular_orden()
        self._kin: dict[tuple[int, int], float] = {}

    def padre(self, a: int | None) -> int | None:
        return self.padres.get(a, (None, None))[0] if a is not None else None

    def madre(self, a: int | None) -> int | None:
        return self.padres.get(a, (None, None))[1] if a is not None else None

    def _limpiar_ciclos(self) -> None:
        """Rompe ciclos (datos mal cargados: un animal ancestro de sí mismo)."""
        estado: dict[int, int] = {}  # 0 = visitando, 1 = listo

        def visitar(a: int) -> None:
            pila = [(a, 0)]
            while pila:
                nodo, i = pila.pop()
                if i == 0:
                    if estado.get(nodo) == 1:
                        continue
                    estado[nodo] = 0
                progenitores = self.padres.get(nodo, (None, None))
                if i < 2:
                    pila.append((nodo, i + 1))
                    x = progenitores[i]
                    if x is not None:
                        if estado.get(x) == 0:
                            # x está en la pila actual → ciclo: se corta el vínculo
                            nuevo = list(self.padres[nodo])
                            nuevo[i] = None
                            self.padres[nodo] = (nuevo[0], nuevo[1])
                        elif x not in estado:
                            pila.append((x, 0))
                else:
                    estado[nodo] = 1

        for a in list(self.padres):
            if a not in estado:
                visitar(a)

    def _calcular_orden(self) -> dict[int, int]:
        """Profundidad generacional: los padres siempre tienen orden menor."""
        orden: dict[int, int] = {}

        def prof(a: int) -> int:
            pila = [a]
            while pila:
                x = pila[-1]
                if x in orden:
                    pila.pop()
                    continue
                p, m = self.padres.get(x, (None, None))
                pend = [y for y in (p, m) if y is not None and y not in orden]
                if pend:
                    pila.extend(pend)
                    continue
                orden[x] = 1 + max([orden[y] for y in (p, m) if y is not None], default=-1)
                pila.pop()
            return orden[a]

        for a in self.padres:
            prof(a)
        return orden

    def kinship(self, a: int | None, b: int | None) -> float:
        """Coeficiente de parentesco f(a, b) (método tabular, exacto)."""
        if a is None or b is None:
            return 0.0
        if a not in self.padres or b not in self.padres:
            return 0.5 if a == b else 0.0
        clave = (a, b) if a <= b else (b, a)
        if clave in self._kin:
            return self._kin[clave]
        if a == b:
            p, m = self.padres[a]
            val = 0.5 * (1.0 + self.kinship(p, m))
        else:
            # Se recursa siempre sobre el más joven (mayor orden)
            if self.orden[a] < self.orden[b]:
                a, b = b, a
            p, m = self.padres[a]
            val = 0.5 * (self.kinship(p, b) + self.kinship(m, b))
        self._kin[clave] = val
        return val

    def consanguinidad(self, a: int | None) -> float:
        """Coeficiente de consanguinidad F de un animal."""
        if a is None:
            return 0.0
        p, m = self.padres.get(a, (None, None))
        return self.kinship(p, m)

    # --- Explicación: caminos y ancestros comunes -------------------------

    def caminos_ancestros(self, a: int, max_gen: int = 6) -> dict[int, list[tuple[int, ...]]]:
        """Para cada ancestro, los caminos (tupla de animales desde el padre/madre
        hasta el ancestro inclusive) por los que se llega desde `a`."""
        caminos: dict[int, list[tuple[int, ...]]] = {}

        def recorrer(x: int, camino: tuple[int, ...]) -> None:
            if len(camino) > max_gen:
                return
            for y in self.padres.get(x, (None, None)):
                if y is None or y in camino:
                    continue
                nuevo = camino + (y,)
                caminos.setdefault(y, []).append(nuevo)
                recorrer(y, nuevo)

        recorrer(a, ())
        return caminos

    def ancestros_comunes(self, macho: int, hembra: int, max_gen: int = 6) -> list[dict]:
        """Ancestros comunes del cruce con su aporte (Wright) a la F de la cría."""
        cm = self.caminos_ancestros(macho, max_gen)
        ch = self.caminos_ancestros(hembra, max_gen)
        # El propio macho puede ser ancestro de la hembra (padre-hija) y viceversa
        for a, propios, otros in ((macho, cm, ch), (hembra, ch, cm)):
            if a in otros:
                propios.setdefault(a, []).append((a,))  # camino de longitud 0 (n=0)
        resultado = []
        for anc in set(cm) & set(ch):
            aporte = 0.0
            n_min = None
            for c1 in cm[anc]:
                for c2 in ch[anc]:
                    # Wright: los caminos solo pueden compartir al ancestro común
                    if set(c1[:-1]) & set(c2[:-1]):
                        continue
                    n1 = 0 if c1 == (macho,) else len(c1)
                    n2 = 0 if c2 == (hembra,) else len(c2)
                    aporte += 0.5 ** (n1 + n2 + 1) * (1.0 + self.consanguinidad(anc))
                    gen = (n1, n2)
                    if n_min is None or sum(gen) < sum(n_min):
                        n_min = gen
            if aporte > 0:
                resultado.append({"id": anc, "aporte": aporte,
                                  "gen_macho": n_min[0], "gen_hembra": n_min[1]})
        resultado.sort(key=lambda r: -r["aporte"])
        return resultado

    def completitud(self, a: int, generaciones: int = 3) -> float:
        """Fracción de ancestros conocidos en las primeras `generaciones` (0-1)."""
        conocidos = 0
        total = 0
        nivel = [a]
        for _ in range(generaciones):
            siguiente = []
            for x in nivel:
                for y in self.padres.get(x, (None, None)) if x is not None else (None, None):
                    total += 1
                    if y is not None:
                        conocidos += 1
                    siguiente.append(y)
            nivel = siguiente
        return conocidos / total if total else 0.0

    def generaciones_conocidas(self, a: int) -> int:
        """Número de generaciones completamente o parcialmente conocidas."""
        g = 0
        nivel = [a]
        while True:
            siguiente = [y for x in nivel if x is not None
                         for y in self.padres.get(x, (None, None)) if y is not None]
            if not siguiente:
                return g
            g += 1
            nivel = siguiente
            if g >= 20:
                return g


# ---------------------------------------------------------------------------
# BLUP — modelo animal de repetibilidad
# ---------------------------------------------------------------------------

@dataclass
class ResultadoBLUP:
    rasgo: str
    media: float                       # media de la clase de parto adulta (2+)
    sigma_a2: float
    sigma_pe2: float
    sigma_e2: float
    ebv: dict[int, float] = field(default_factory=dict)
    confiabilidad: dict[int, float] = field(default_factory=dict)
    n_registros: int = 0
    n_animales_con_datos: int = 0
    metodo_pev: str = "exacta"
    # Factorización LU de las ecuaciones del modelo mixto: permite obtener la
    # PEV exacta de cualquier animal bajo demanda sin invertir la matriz.
    _lu: object = field(default=None, repr=False)
    _idx: dict = field(default_factory=dict, repr=False)
    _p: int = 0
    _tam: int = 0

    def precalcular(self, ids) -> None:
        """Confiabilidad exacta de varios animales con una sola resolución."""
        faltan = [a for a in ids if a is not None and a not in self.confiabilidad and a in self._idx]
        if not faltan or self._lu is None:
            return
        for i in range(0, len(faltan), 256):
            lote = faltan[i:i + 256]
            E = np.zeros((self._tam, len(lote)))
            for j, a in enumerate(lote):
                E[self._p + self._idx[a], j] = 1.0
            X = self._lu.solve(E)
            for j, a in enumerate(lote):
                pev = X[self._p + self._idx[a], j] * self.sigma_e2
                self.confiabilidad[a] = float(np.clip(1.0 - pev / self.sigma_a2, 0.0, 0.99))

    def de(self, a: int | None) -> tuple[float, float]:
        """(EBV, confiabilidad) de un animal; 0 y 0 si no hay información."""
        if a is None:
            return 0.0, 0.0
        if a not in self.confiabilidad:
            self.precalcular([a])
        return self.ebv.get(a, 0.0), self.confiabilidad.get(a, 0.0)


def _clase_parto(lactancia: int | None) -> int:
    if not lactancia:
        return 0          # desconocida
    return 1 if lactancia == 1 else 2 if lactancia == 2 else 3


def blup_rasgo(pedigri: Pedigri, registros: list[tuple[int, int | None, float]], rasgo: str) -> ResultadoBLUP:
    """
    BLUP del rasgo con modelo de repetibilidad.
    registros: (id_animal, numero_lactancia, valor medio de esa lactancia).
    Efectos fijos: clase de parto (1, 2, 3+, desconocida).
    """
    par = PARAMETROS[rasgo]
    h2, t = par["h2"], par["t"]
    regs = [(a, _clase_parto(l), float(y)) for a, l, y in registros if y is not None and a in pedigri.padres]

    # Varianza fenotípica: de los datos si hay suficientes, si no de literatura.
    if len(regs) >= 20:
        ys = np.array([r[2] for r in regs])
        clases = np.array([r[1] for r in regs])
        resid = ys.copy()
        for c in set(clases.tolist()):
            resid[clases == c] -= ys[clases == c].mean()
        var_p = float(np.var(resid, ddof=1)) or par["sd_defecto"] ** 2
    else:
        var_p = par["sd_defecto"] ** 2
    sa2, spe2, se2 = h2 * var_p, max(t - h2, 1e-6) * var_p, (1 - t) * var_p

    res = ResultadoBLUP(rasgo=rasgo, media=0.0, sigma_a2=sa2, sigma_pe2=spe2, sigma_e2=se2,
                        n_registros=len(regs))
    if not regs:
        return res

    animales = sorted(pedigri.padres, key=lambda a: (pedigri.orden[a], a))
    idx = {a: i for i, a in enumerate(animales)}
    n = len(animales)
    con_datos = sorted({r[0] for r in regs}, key=lambda a: idx[a])
    ipe = {a: i for i, a in enumerate(con_datos)}
    m = len(con_datos)
    clases = sorted({r[1] for r in regs})
    ic = {c: i for i, c in enumerate(clases)}
    p = len(clases)
    res.n_animales_con_datos = m

    # Matrices de incidencia
    filas = range(len(regs))
    X = sp.csr_matrix(([1.0] * len(regs), (list(filas), [ic[r[1]] for r in regs])), shape=(len(regs), p))
    Z = sp.csr_matrix(([1.0] * len(regs), (list(filas), [idx[r[0]] for r in regs])), shape=(len(regs), n))
    W = sp.csr_matrix(([1.0] * len(regs), (list(filas), [ipe[r[0]] for r in regs])), shape=(len(regs), m))
    y = np.array([r[2] for r in regs])

    # A⁻¹ por reglas de Henderson con consanguinidad de los padres
    rows, cols, vals = [], [], []

    def add(i, j, v):
        rows.append(i); cols.append(j); vals.append(v)

    for a in animales:
        i = idx[a]
        s, d = pedigri.padres[a]
        si = idx.get(s) if s is not None else None
        di = idx.get(d) if d is not None else None
        if si is not None and di is not None:
            delta = 0.5 - 0.25 * (pedigri.consanguinidad(s) + pedigri.consanguinidad(d))
        elif si is not None or di is not None:
            conocido = s if si is not None else d
            delta = 0.75 - 0.25 * pedigri.consanguinidad(conocido)
        else:
            delta = 1.0
        b = 1.0 / delta
        add(i, i, b)
        for k in (si, di):
            if k is not None:
                add(i, k, -b / 2); add(k, i, -b / 2)
        for k in (si, di):
            for l in (si, di):
                if k is not None and l is not None:
                    add(k, l, b / 4)
    Ainv = sp.csr_matrix((vals, (rows, cols)), shape=(n, n))

    alfa, gamma = se2 / sa2, se2 / spe2
    C = sp.bmat([
        [X.T @ X, X.T @ Z, X.T @ W],
        [Z.T @ X, Z.T @ Z + Ainv * alfa, Z.T @ W],
        [W.T @ X, W.T @ Z, W.T @ W + sp.identity(m) * gamma],
    ], format="csc")
    rhs = np.concatenate([X.T @ y, Z.T @ y, W.T @ y])
    try:
        lu = splu(C)
    except RuntimeError:            # sistema singular (datos degenerados)
        return res
    sol = lu.solve(rhs)
    b_hat = sol[:p]
    a_hat = sol[p:p + n]

    # Media de referencia: clase adulta (2.º parto) o la que exista
    for c in (2, 3, 0, 1):
        if c in ic:
            res.media = float(b_hat[ic[c]])
            break

    # Confiabilidad = 1 - PEV / σa², exacta, bajo demanda (ver precalcular)
    res._lu, res._idx, res._p, res._tam = lu, idx, p, p + n + m
    for a in animales:
        res.ebv[a] = float(a_hat[idx[a]])
    return res


# ---------------------------------------------------------------------------
# Predicción para la cría de un cruce
# ---------------------------------------------------------------------------

def prediccion_cria(blup: ResultadoBLUP, macho: int, hembra: int, f_cria: float,
                    pedigri: Pedigri) -> dict:
    """
    Valor esperado de la producción de una HIJA del cruce en lactancia adulta
    y su intervalo de predicción del 80 %.

      PA = (EBV_macho + EBV_hembra) / 2
      Var = ¼(PEV_m + PEV_h) + ½σa²(1 - F̄) + σpe² + σe²
    """
    em, rm = blup.de(macho)
    eh, rh = blup.de(hembra)
    pa = (em + eh) / 2
    media = blup.media
    depresion = DEPRESION_LECHE_POR_PUNTO_F * (f_cria * 100) * media if blup.rasgo == "litros" else 0.0
    esperado = media + pa - depresion
    pev_m = (1 - rm) * blup.sigma_a2
    pev_h = (1 - rh) * blup.sigma_a2
    f_bar = (pedigri.consanguinidad(macho) + pedigri.consanguinidad(hembra)) / 2
    var = 0.25 * (pev_m + pev_h) + 0.5 * blup.sigma_a2 * (1 - f_bar) + blup.sigma_pe2 + blup.sigma_e2
    sd = math.sqrt(max(var, 0.0))
    z80 = 1.2816
    return {
        "rasgo": blup.rasgo,
        "unidad": PARAMETROS[blup.rasgo]["unidad"],
        "esperado": round(esperado, 2),
        "intervalo80": [round(esperado - z80 * sd, 2), round(esperado + z80 * sd, 2)],
        "media_rebano": round(media, 2),
        "merito_genetico": round(pa, 3),         # aporte genético esperado vs la media
        "depresion_consanguinidad": round(depresion, 3),
        "ebv_macho": round(em, 3), "conf_macho": round(rm, 2),
        "ebv_hembra": round(eh, 3), "conf_hembra": round(rh, 2),
        "confiabilidad": round(0.25 * (rm + rh), 2),  # confiabilidad del PA de la cría
    }
