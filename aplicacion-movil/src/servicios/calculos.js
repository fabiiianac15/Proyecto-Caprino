/**
 * Cálculos en el teléfono. Son los mismos del backend (BienestarService y
 * ClasificacionLinealService): el servidor recalcula al guardar, aquí solo se
 * muestra el resultado mientras se llena, aunque no haya red.
 */

/* ── Bienestar animal (MEBA ICA v3.0) ─────────────────────────────────────── */

export const PESOS_BIENESTAR = { RECURSOS: 0.35, ANIMAL: 0.55, GESTION: 0.10 };
export const PUNTAJES = [100, 55, 20, 0];

/** Niveles que existen para el indicador (p. ej. Enriquecimiento no tiene 20). */
export const nivelesDe = (ind) => {
  const n = PUNTAJES.filter((p) => ind.criterios?.[p]);
  return n.length ? n : PUNTAJES;
};

/** Tabla 1: cuántos animales revisar según el tamaño del hato. */
export const muestraMinima = (n) => {
  n = Number(n);
  if (!n || n < 1) return '';
  if (n <= 10) return n;
  if (n <= 50) return 10;
  if (n <= 100) return 20;
  if (n <= 500) return 35;
  if (n <= 1000) return 45;
  return Math.ceil(n * 0.04);
};

export const porcentaje = (v) =>
  Number(v?.nEvaluados) > 0 && v.nHallazgo !== '' && v.nHallazgo != null
    ? Math.round((Number(v.nHallazgo) / Number(v.nEvaluados)) * 1000) / 10
    : null;

/**
 * Puntaje a partir del conteo y los cortes de la tabla del ICA.
 *  CUMPLE   → % que está bien:  100 si % > corte (corte 100 = todos)
 *  HALLAZGO → % con problema:   100 si % < corte (corte 0 = ninguno)
 */
export const puntajeMuestreo = (ind, v) => {
  const pct = porcentaje(v);
  if (!ind.medicion || pct === null || pct > 100) return null;
  for (const p of [100, 55, 20]) {
    const c = ind.cortes?.[p];
    if (c == null) continue;
    const ok = ind.medicion === 'CUMPLE' ? (c >= 100 ? pct >= 100 : pct > c) : (c <= 0 ? pct <= 0 : pct < c);
    if (ok) return p;
  }
  return 0;
};

export const confinamientoNoAplica = (tipoProductor) => tipoProductor === 'FAMILIAR' || tipoProductor === 'EXTENSIVO';

export const calcularBienestar = (catalogo, valores, rspp, asi) => {
  const sumas = { RECURSOS: 0, ANIMAL: 0, GESTION: 0 };
  const conteo = { RECURSOS: 0, ANIMAL: 0, GESTION: 0 };
  let sinCalificar = 0;
  let aplicables = 0;
  catalogo.forEach((ind) => {
    const v = valores[ind.idIndicador];
    if (!v || !v.aplica) return;
    aplicables += 1;
    if (v.puntaje == null) { sinCalificar += 1; return; }
    sumas[ind.tipoMedida] += v.puntaje;
    conteo[ind.tipoMedida] += 1;
  });
  const prom = {};
  Object.keys(sumas).forEach((g) => {
    prom[g] = conteo[g] > 0 ? Math.round((sumas[g] / conteo[g]) * 100) / 100 : null;
  });
  let acum = 0;
  let pesoUsado = 0;
  Object.entries(PESOS_BIENESTAR).forEach(([g, p]) => {
    if (prom[g] !== null) { acum += prom[g] * p; pesoUsado += p; }
  });
  const total = pesoUsado > 0 ? Math.round((acum / pesoUsado) * 100) / 100 : 0;
  let clasificacion = 'BAJO';
  if (total >= 90 && rspp && asi) clasificacion = 'EXCELENTE';
  else if (total >= 75) clasificacion = 'ALTO';
  else if (total >= 50) clasificacion = 'MEDIO';
  return { prom, total, clasificacion, sinCalificar, aplicables, calificados: aplicables - sinCalificar };
};

/* ── Clasificación lineal (ADGA) ──────────────────────────────────────────── */

// Tope de cada rango de la escala 1-50 del artículo: bajo 5, intermedio 25, alto 50
export const FACTOR_LINEAL = { 1: 0.10, 2: 0.50, 3: 1.00 };

export const categoriaLineal = (p) =>
  p >= 90 ? 'EXCELENTE' : p >= 85 ? 'MUY_BUENO' : p >= 80 ? 'BUENO' : p >= 70 ? 'ACEPTABLE' : p >= 60 ? 'REGULAR' : 'POBRE';

export const calcularLineal = (catalogo, valores) => {
  const subtotales = { APARIENCIA: 0, ESTRUCTURA: 0, MAMARIO: 0, PATAS: 0 };
  let calificados = 0;
  catalogo.forEach((r) => {
    const cal = valores[r.idRasgo];
    if (!cal) return;
    calificados += 1;
    subtotales[r.region] += r.ptsRasgo * (FACTOR_LINEAL[cal] || 0);   // se redondea solo el subtotal
  });
  Object.keys(subtotales).forEach((k) => { subtotales[k] = Math.round(subtotales[k] * 100) / 100; });
  const puntFinal = Math.round(Object.values(subtotales).reduce((a, b) => a + b, 0) * 100) / 100;
  return { subtotales, puntFinal, categoria: categoriaLineal(puntFinal), calificados, total: catalogo.length };
};

/**
 * Índices zoométricos (mismas fórmulas que ClasificacionLinealService del
 * servidor). `m` = { CODIGO: valor en cm }. Solo los que tienen sus dos medidas.
 */
const INDICES = [
  ['CORPORAL', 'Índice corporal', 'LONG_CORP', 'PER_TOR', (v) => (v < 86 ? 'Brevilínea (corta y ancha)' : v < 90 ? 'Mesolínea (proporcionada)' : 'Longilínea (larga, típico lechero)')],
  ['PROPORCION', 'Proporcionalidad', 'ALZ_CRUZ', 'LONG_CORP', (v) => (v < 100 ? 'Más larga que alta' : 'Más alta que larga')],
  ['TORACICO', 'Índice torácico', 'ANCH_PECHO', 'PROF_PECHO', (v) => (v < 50 ? 'Pecho estrecho y profundo' : v < 65 ? 'Pecho intermedio' : 'Pecho ancho')],
  ['PELVIANO', 'Índice pelviano', 'ANCH_GRUPA', 'LONG_GRUPA', (v) => (v < 100 ? 'Grupa más larga que ancha' : 'Grupa más ancha que larga')],
  ['PROF_RELATIVA', 'Profundidad relativa', 'PROF_PECHO', 'ALZ_CRUZ', (v) => (v < 45 ? 'Poca capacidad corporal' : v < 50 ? 'Capacidad media' : 'Buena capacidad corporal')],
];
export const indicesLineal = (m) => INDICES.flatMap(([codigo, nombre, a, b, lectura]) => {
  const x = Number(m[a]); const y = Number(m[b]);
  if (!(x > 0) || !(y > 0)) return [];
  const valor = Math.round((x / y) * 1000) / 10;
  return [{ codigo, nombre, valor, lectura: lectura(valor) }];
});
