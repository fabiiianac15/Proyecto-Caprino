// Fecha local (toISOString da la de Londres y de noche marca el día siguiente)
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const edadMeses = (fechaNac) => {
  if (!fechaNac) return null;
  const d = new Date(fechaNac);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (30.44 * 86400000)));
};

export const edadTexto = (fechaNac) => {
  const m = edadMeses(fechaNac);
  if (m == null) return null;
  if (m < 24) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  const a = Math.floor(m / 12);
  const r = m % 12;
  return `${a} años${r ? ` y ${r} ${r === 1 ? 'mes' : 'meses'}` : ''}`;
};

export const fechaCorta = (v) => {
  if (!v) return '';
  const d = new Date(typeof v === 'number' ? v : String(v).slice(0, 10) + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const haceCuanto = (ms) => {
  if (!ms) return 'nunca';
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} días`;
};

export const ESTADOS_PRODUCTIVOS = {
  produccion: 'Producción', seca: 'Seca', prenada: 'Preñada', cabretona: 'Cabretona', cabrita: 'Cabrita',
};
