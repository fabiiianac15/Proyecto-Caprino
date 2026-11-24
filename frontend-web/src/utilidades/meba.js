// Reglas de la guía MEBA del ICA (v3.0, 2026) que comparten la web y la app.
// Fuente: documentacion/MEBA-ovinos-y-caprinos.pdf, numerales 4.4 y 4.5.

// ---------------------------------------------------------------
// Tabla 1. Tamaño de muestra mínimo según el número de animales
// ---------------------------------------------------------------
export const TABLA_MUESTRA = [
  { desde: 1,    hasta: 10,       texto: 'Menor de 10',       muestra: 'Todos' },
  { desde: 11,   hasta: 50,       texto: 'De 11 a 50',        muestra: '10' },
  { desde: 51,   hasta: 100,      texto: 'De 51 a 100',       muestra: '20' },
  { desde: 101,  hasta: 500,      texto: 'De 101 a 500',      muestra: '35' },
  { desde: 501,  hasta: 1000,     texto: 'De 501 a 1000',     muestra: '45' },
  { desde: 1001, hasta: Infinity, texto: 'Mayor de 1000',     muestra: '4 % del total' },
];

export const filaTabla = (n) => {
  n = Number(n);
  if (!n || n < 1) return -1;
  return TABLA_MUESTRA.findIndex((f) => n >= f.desde && n <= f.hasta);
};

export const muestraMinima = (n) => {
  n = Number(n);
  if (!n || n < 1) return 0;
  if (n <= 10) return n;
  if (n <= 50) return 10;
  if (n <= 100) return 20;
  if (n <= 500) return 35;
  if (n <= 1000) return 45;
  return Math.ceil(n * 0.04);
};

// ---------------------------------------------------------------
// Grupos de edad (numeral 4.4): la muestra se reparte en proporción
// ---------------------------------------------------------------
export const GRUPOS_EDAD = [
  { key: 'CRIAS',   titulo: 'Crías lactantes', ayuda: 'Menos de 3 meses, todavía maman.' },
  { key: 'JOVENES', titulo: 'Jóvenes',         ayuda: 'De 3 a 12 meses, ya destetadas.' },
  { key: 'ADULTOS', titulo: 'Adultos',         ayuda: 'Más de 12 meses.' },
];

/**
 * Reparte la muestra en proporción al inventario de cada grupo (método del
 * mayor residuo). Si un grupo tiene animales y le tocó 0, se le da 1 a costa
 * del grupo más grande, para que ningún grupo quede sin revisar.
 */
export const repartirMuestra = (inventario, total) => {
  const keys = GRUPOS_EDAD.map((g) => g.key);
  const inv = keys.map((k) => Math.max(0, Number(inventario?.[k]) || 0));
  const suma = inv.reduce((a, b) => a + b, 0);
  const out = Object.fromEntries(keys.map((k) => [k, 0]));
  total = Math.min(Number(total) || 0, suma);
  if (!suma || !total) return out;
  const exactos = inv.map((x) => (x / suma) * total);
  const base = exactos.map(Math.floor);
  let falta = total - base.reduce((a, b) => a + b, 0);
  exactos.map((x, k) => [x - base[k], k]).sort((a, b) => b[0] - a[0]).forEach(([, k]) => {
    if (falta > 0) { base[k] += 1; falta -= 1; }
  });
  inv.forEach((x, k) => {
    if (x > 0 && base[k] === 0) {
      const mayor = base.indexOf(Math.max(...base));
      if (base[mayor] > 1) { base[mayor] -= 1; base[k] = 1; }
    }
  });
  keys.forEach((k, j) => { out[k] = base[j]; });
  return out;
};

/** Sortea qué animales revisar en cada grupo. Faltantes se completan con animales sin fecha de nacimiento. */
export const sortearMuestra = (animales, porGrupo) => {
  const barajar = (l) => {
    const a = [...l];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const elegidos = new Set();
  const sinFecha = barajar(animales.filter((a) => a.meses == null));
  GRUPOS_EDAD.forEach(({ key }) => {
    let quiere = Number(porGrupo?.[key]) || 0;
    for (const a of barajar(animales.filter((x) => x.grupo === key && x.meses != null))) {
      if (!quiere) break;
      elegidos.add(a.id); quiere -= 1;
    }
    for (const a of sinFecha) {
      if (!quiere) break;
      if (!elegidos.has(a.id)) { elegidos.add(a.id); quiere -= 1; }
    }
  });
  return [...elegidos];
};

// ---------------------------------------------------------------
// RSPP y ASI
// ---------------------------------------------------------------
export const ESTADOS_DOC = [
  { valor: 'VIGENTE',    texto: 'Sí, vigente',          color: 'emerald', cuenta: true },
  { valor: 'EN_TRAMITE', texto: 'En trámite',           color: 'amber' },
  { valor: 'VENCIDO',    texto: 'Vencido',              color: 'red' },
  { valor: 'NO_TIENE',   texto: 'No tiene',             color: 'red' },
  { valor: 'NO_SABE',    texto: 'No se pudo verificar', color: 'gray' },
];

export const DOCUMENTOS_ICA = {
  RSPP: {
    sigla: 'RSPP',
    nombre: 'Registro Sanitario de Predio Pecuario',
    que: 'Es la inscripción obligatoria de la granja ante el ICA. Dice dónde queda el predio, quién es el dueño o tenedor, qué especies tiene y cuántos animales. Sin este registro no se pueden sacar guías para mover animales ni registrar las vacunaciones oficiales.',
    porque: 'La guía MEBA exige RSPP y ASI para que la granja pueda quedar en "Excelente". Si falta alguno, aunque saque 90 % o más, queda en "Alto".',
    norma: 'Resolución ICA 090464 de 2021 (reemplazó a la 9810 de 2017). Confirme siempre la norma vigente en ica.gov.co.',
    como: 'Se pide en la oficina local del ICA del municipio, con el documento del propietario y un documento que demuestre la tenencia del predio (escritura, contrato de arriendo o certificado de sana posesión).',
    vence: false,
    checks: [
      ['DOC_VISTO',   'Vi el certificado o la constancia del RSPP (en papel o en el celular).'],
      ['NOMBRE',      'El nombre del predio y del propietario coinciden con la granja que visito.'],
      ['UBICACION',   'La vereda y el municipio del registro coinciden.'],
      ['ESPECIE',     'La especie caprina aparece en el registro.'],
      ['INVENTARIO',  'El número de cabras registrado se parece al que conté hoy.'],
    ],
  },
  ASI: {
    sigla: 'ASI',
    nombre: 'Autorización Sanitaria y de Inocuidad',
    que: 'La da el ICA a las granjas que producen carne o leche para consumo humano, después de revisar que cumplen requisitos sanitarios y de inocuidad: agua de buena calidad, medicamentos con registro ICA y con fórmula del veterinario, respeto del tiempo de retiro, registros al día, manejo de residuos y control de plagas.',
    porque: 'Muestra que lo que sale de la granja (leche, carne) es seguro para la gente. Junto con el RSPP es requisito para "Excelente".',
    norma: 'Resolución ICA 115708 de 2021 y su modificación de 2023. La certificación en Buenas Prácticas Ganaderas de ovinos y caprinos está en la Resolución ICA 20277 de 2018. Confirme la norma vigente en ica.gov.co.',
    como: 'Se pide en la oficina del ICA. Para solicitarla la granja ya debe tener el RSPP. Un funcionario del ICA o un profesional autorizado visita el predio y verifica los requisitos.',
    vence: true,
    checks: [
      ['DOC_VISTO',   'Vi el documento de la ASI con su número y fecha.'],
      ['NOMBRE',      'El documento es de esta granja (nombre del predio y propietario coinciden).'],
      ['ESPECIE',     'La autorización cubre la producción de cabras (leche y/o carne).'],
      ['VIGENCIA',    'El documento está vigente: no se ha pasado la fecha de vencimiento.'],
      ['RSPP_PREVIO', 'La granja también tiene RSPP (la ASI lo exige).'],
      ['REGISTROS',   'Vi los registros de medicamentos y tiempos de retiro al día.'],
    ],
  },
};

export const docVacio = () => ({ estado: 'NO_SABE', numero: '', fecha: '', vence: '', checks: [], obs: '' });

/** Avisos de coherencia de un documento (no bloquean, orientan). */
export const avisosDoc = (sigla, d, fechaVisita) => {
  const av = [];
  if (d.estado === 'VIGENTE' && !d.checks.includes('DOC_VISTO')) {
    av.push('Marcó "vigente" pero no vio el documento. El ICA pide verlo; si no lo muestran, márquelo como "No se pudo verificar".');
  }
  if (d.estado === 'VIGENTE' && !d.numero) av.push('Escriba el número del registro tal como aparece en el documento.');
  if (d.vence && fechaVisita && d.vence < fechaVisita && d.estado === 'VIGENTE') {
    av.push('La fecha de vencimiento ya pasó: debería quedar como "Vencido".');
  }
  if (sigla === 'ASI' && d.estado === 'VIGENTE' && !d.checks.includes('RSPP_PREVIO')) {
    av.push('La ASI exige que la granja tenga RSPP. Confírmelo.');
  }
  return av;
};

// ---------------------------------------------------------------
// Tabla 3. Clasificación final del predio
// ---------------------------------------------------------------
export const TABLA_CLASIFICACION = [
  { nivel: 'EXCELENTE', rango: '90 % o más y con RSPP y ASI vigentes' },
  { nivel: 'ALTO',      rango: 'De 75 % a menos de 90 %, o 90 % o más sin RSPP o sin ASI' },
  { nivel: 'MEDIO',     rango: 'De 50 % a menos de 75 %' },
  { nivel: 'BAJO',      rango: 'Menos de 50 %' },
];

export const clasificar = (total, rspp, asi) => {
  if (total >= 90 && rspp && asi) return 'EXCELENTE';
  if (total >= 75) return 'ALTO';
  if (total >= 50) return 'MEDIO';
  return 'BAJO';
};
