// Reglas morfométricas de la clasificación lineal (compartidas por la web y la app).
//
// Cada raza tiene, para hembras y machos adultos, el valor promedio (media) de
// cada medida y su desviación (de). Al medir una cabra se compara con su raza:
//   Bajo  (calificación 1): menos de  media - k·de
//   Medio (calificación 2): entre     media - k·de  y  media + k·de
//   Alto  (calificación 3): más de    media + k·de
// Con k = 1 el rango "medio" contiene a cerca de 7 de cada 10 animales normales
// de la raza. Las reglas FIJO usan cortes fijos (p. ej. grados de la grupa).

export const NIVELES = {
  1: { texto: 'Bajo', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  2: { texto: 'Medio', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  3: { texto: 'Alto', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export const aNumero = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const redondo = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
export const fmt = (v) => (v == null ? '—' : String(redondo(v)).replace('.', ','));

/** Ángulo de la grupa en grados: diferencia de alturas ilíaco–isquion sobre el largo de la grupa. */
export const anguloGrupa = (m) => {
  const a = aNumero(m.ALZ_GRUPA); const b = aNumero(m.ALT_ISQUION); const l = aNumero(m.LONG_GRUPA);
  if (!a || !b || !l) return null;
  const s = Math.max(-1, Math.min(1, (a - b) / l));
  return redondo((Math.asin(s) * 180) / Math.PI, 1);
};

export const valorRegla = (regla, medidas) => (
  regla.calculo === 'ANGULO_GRUPA' ? anguloGrupa(medidas) : aNumero(medidas[regla.calculo])
);

/** Índice de referencias {codigo: {media, de, raza}} prefiriendo la de la raza sobre la general. */
export const indexarReferencias = (refs = []) => {
  const out = {};
  [...refs].sort((x, y) => (x.idRaza == null ? -1 : 1) - (y.idRaza == null ? -1 : 1))
    .forEach((r) => { out[r.codigo] = r; });
  return out;
};

/** Límites bajo/alto de una regla; null si falta la referencia. */
export const limitesRegla = (regla, refs) => {
  if (regla.tipo === 'FIJO') {
    return regla.corteBajo == null || regla.corteAlto == null ? null
      : { bajo: regla.corteBajo, alto: regla.corteAlto, unidad: '°', fijo: true };
  }
  const r = refs[regla.calculo];
  if (!r) return null;
  const k = regla.k || 1;
  return { bajo: redondo(r.media - k * r.de), alto: redondo(r.media + k * r.de), media: r.media, de: r.de, raza: r.raza };
};

/** Calificación 1/2/3 de un valor según la regla. */
export const calificarValor = (regla, valor, lim) => {
  if (valor == null || !lim) return null;
  const menor = valor < lim.bajo;
  const mayor = valor > lim.alto;
  if (regla.sentido === 'MENOR') return menor ? 3 : mayor ? 1 : 2;
  return menor ? 1 : mayor ? 3 : 2;
};

/** Texto que explica qué es Bajo, Medio y Alto para esta regla. */
export const explicarRangos = (regla, lim, unidad = 'cm') => {
  if (!lim) return null;
  const u = lim.fijo ? '°' : ` ${unidad}`;
  const b = `${fmt(lim.bajo)}${u}`;
  const a = `${fmt(lim.alto)}${u}`;
  if (regla.sentido === 'MENOR') {
    return { 3: `menos de ${b}`, 2: `de ${b} a ${a}`, 1: `más de ${a}` };
  }
  return { 1: `menos de ${b}`, 2: `de ${b} a ${a}`, 3: `más de ${a}` };
};

/**
 * Aplica todas las reglas: devuelve {codigoRasgo: {calif, valor, lim, regla}}
 * solo para los rasgos que se pudieron calcular.
 */
export const calcularRasgos = (reglas, medidas, refs) => {
  const out = {};
  reglas.forEach((regla) => {
    const valor = valorRegla(regla, medidas);
    const lim = limitesRegla(regla, refs);
    const calif = calificarValor(regla, valor, lim);
    if (calif) out[regla.codigoRasgo] = { calif, valor, lim, regla };
  });
  return out;
};

/** Estado de una medida frente a la referencia de su raza (para pintar la casilla). */
export const compararMedida = (valor, ref, k = 1) => {
  if (valor == null || !ref) return null;
  const bajo = ref.media - k * ref.de;
  const alto = ref.media + k * ref.de;
  const nivel = valor < bajo ? 1 : valor > alto ? 3 : 2;
  const dif = redondo(valor - ref.media);
  return { nivel, bajo: redondo(bajo), alto: redondo(alto), dif, pct: redondo((dif / ref.media) * 100, 0) };
};

// ---------------------------------------------------------------------
// Base morfométrica publicada (Excel "Parámetros morfométricos caprinos APP")
// ---------------------------------------------------------------------

/** Etapas operativas por edad (convención de diseño de la base, no definición universal de madurez). */
export const ETAPAS = [
  { key: 'NACIMIENTO', texto: 'Nacimiento', desde: 0, hasta: 1, rango: '0 meses' },
  { key: 'CRIA', texto: 'Cría', desde: 1, hasta: 6, rango: '1 a menos de 6 meses' },
  { key: 'CABRETON', texto: 'Cabretón', desde: 6, hasta: 12, rango: '6 a menos de 12 meses' },
  { key: 'JOVEN', texto: 'Joven', desde: 12, hasta: 24, rango: '12 a menos de 24 meses' },
  { key: 'ADULTO', texto: 'Adulto', desde: 24, hasta: Infinity, rango: '24 meses o más' },
];
export const etapaPorEdad = (meses) => {
  const m = aNumero(meses);
  if (m == null) return null;
  return ETAPAS.find((e) => m >= e.desde && m < e.hasta) || null;
};

/** La referencia viene de una publicación (fuente "S01 · …") o es un valor inicial aproximado. */
export const origenReferencia = (fuente) => {
  const f = String(fuente || '');
  const m = f.match(/^(S\d\d)\s/);
  if (m) return { tipo: 'PUBLICADA', codigo: m[1] };
  if (/^Valor inicial aproximado/i.test(f) || !f) return { tipo: 'APROXIMADA' };
  return { tipo: 'DOCENTE' };
};

/** Desviación estándar de un valor publicado: la DE tal cual, o EE × √n. Null si no se puede. */
export const deDeValor = (v, n) => {
  if (!v || v.dispersion == null) return null;
  if (v.tipoDispersion === 'DE') return v.dispersion;
  if (v.tipoDispersion === 'EE' && n > 1) return redondo(v.dispersion * Math.sqrt(n), 2);
  return null;
};

/** Un perfil sirve como referencia para calificar si es de un sexo, observado (no preliminar) y con dispersión utilizable. */
export const perfilApto = (p) => !!p && !p.preliminar && p.sexo !== 'AMBOS' && p.tipoDato === 'Media observada'
  && p.valores.some((v) => deDeValor(v, p.n) != null);

/** Texto corto de la fuente para guardar en la referencia. */
export const textoFuentePerfil = (p, fuentes = []) => {
  const cita = fuentes.find((f) => f.codigo === p.fuente)?.referencia || '';
  const autor = cita.split('(')[0].trim().replace(/,$/, '');
  const anio = (cita.match(/\((\d{4})\)/) || [])[1];
  return `${p.fuente} · ${autor}${anio ? ` (${anio})` : ''}, ${p.localizacion || 'tabla'} · n=${p.n}, ${p.edadPublicada}, ${p.pais}`.slice(0, 400);
};

/** Perfil publicado de la misma raza y sexo con la edad exacta más cercana (±3 meses). */
export const perfilParaEdad = (perfiles, sexo, meses) => {
  const m = aNumero(meses);
  if (m == null) return null;
  const c = perfiles
    .filter((p) => p.sexo === sexo && p.edadMeses != null && Math.abs(p.edadMeses - m) <= 3)
    .sort((a, b) => Math.abs(a.edadMeses - m) - Math.abs(b.edadMeses - m) || (b.n || 0) - (a.n || 0));
  return c[0] || null;
};
