import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Ruler, Plus, ArrowLeft, RefreshCw, Trash2, Eye, Camera, Edit2, Image as ImageIcon,
  CheckCircle, AlertTriangle, ImageOff, Info, X, ChevronDown, Scale,
} from 'lucide-react';
import { clasificacionLinealAPI, animalesAPI, reproduccionAPI } from '../servicios/caprino-api';
import SelectAnimal from './SelectAnimal';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

// Tope de cada rango de la escala 1-50 del artículo: bajo 5, intermedio 25, alto 50
const FACTOR = { 1: 0.10, 2: 0.50, 3: 1.00 };
const REGIONES = [
  { key: 'APARIENCIA', titulo: 'Apariencia general y capacidad', ayuda: 'Tamaño y forma del cuerpo.', pts: 25 },
  { key: 'ESTRUCTURA', titulo: 'Estructura y fortaleza lechera', ayuda: 'Qué tanto "se ve lechera": fina, angulosa y con buen hueso.', pts: 15 },
  { key: 'MAMARIO',    titulo: 'Sistema mamario',                ayuda: 'La ubre y los pezones. Es la parte que más puntos da.', pts: 40 },
  { key: 'PATAS',      titulo: 'Patas y pezuñas',                ayuda: 'Cómo son las patas y cómo camina.', pts: 20 },
];
const GRUPOS_MEDIDA = [
  { key: 'CUERPO', titulo: 'Cuerpo', ayuda: 'Con bastón zoométrico, cinta métrica y compás.' },
  { key: 'UBRE',   titulo: 'Ubre y pezones', ayuda: 'Con cinta, regla y calibrador. Mejor antes del ordeño, siempre a la misma hora.' },
  { key: 'PESO',   titulo: 'Peso', ayuda: 'Con báscula.' },
];
// Fotos estandarizadas: cada vista dice desde dónde y a qué distancia tomarla
const VISTAS = [
  { key: 'LATERAL',   label: 'De lado',        ayuda: 'Lado izquierdo, a 2-3 m. Celular paralelo al cuerpo, a la altura de la barriga. Que se vea completa, de las orejas a la cola y de la cruz a las pezuñas.' },
  { key: 'POSTERIOR', label: 'Desde atrás',    ayuda: 'Centrado en la cola, a 2 m. Que se vean la grupa, las dos patas traseras y la ubre.' },
  { key: 'FRONTAL',   label: 'De frente',      ayuda: 'A 2 m, centrado en el pecho. Que se vean las dos patas delanteras completas.' },
  { key: 'UBRE_LAT',  label: 'Ubre de lado',   ayuda: 'De cerca (50-80 cm), a la altura de la ubre. Que se vea el corvejón para comparar la profundidad.' },
  { key: 'UBRE_POST', label: 'Ubre de atrás',  ayuda: 'De cerca, desde atrás, con la cola levantada. Que se vea desde la vulva hasta la punta de los pezones.' },
  { key: 'PATAS',     label: 'Patas',          ayuda: 'Patas traseras paradas en piso plano, a la altura del corvejón.' },
  { key: 'MEDICION',  label: 'Medición',       ayuda: 'Foto de cerca de la cinta o el bastón marcando la lectura. Puede subir varias.', varias: true },
];
const PROTOCOLO = [
  ['Piso', 'Plano y firme (cemento o tierra apisonada). En pendiente cambian la alzada y los aplomos.'],
  ['Postura', 'Cabra parada, tranquila, con las cuatro patas derechas debajo del cuerpo y la cabeza en posición normal (ni levantada ni agachada).'],
  ['Fondo', 'Una pared o lona lisa de color que contraste con la cabra, sin otras cabras ni personas detrás.'],
  ['Cámara', 'Celular horizontal, sin zoom, a la altura de la mitad del cuerpo (agachado, unos 60-70 cm del piso). Perpendicular: ni desde arriba ni desde abajo.'],
  ['Referencia', 'Ponga el bastón zoométrico o una vara marcada cada 10 cm parada junto a la cabra, en la misma línea del cuerpo. Sirve para comparar fotos de distintas visitas.'],
  ['Luz', 'De día, con el sol a la espalda de quien toma la foto o en sombra pareja. Evite el contraluz.'],
  ['Importante', 'La foto es evidencia, no sirve para medir: la distancia y el ángulo cambian los centímetros. Las medidas se toman sobre la cabra con el instrumento y se escriben en la sección de medidas.'],
];
const CAL_LABEL = { 1: 'Bajo', 2: 'Intermedio', 3: 'Alto' };
// Rasgos con dibujo de referencia (Figura 1 del artículo, ADGA 2019) en /public/img/lineal
const CON_DIBUJO = new Set(['ANCPEC', 'ANGUL', 'ANGRU', 'ANCHGRU', 'PTVL', 'INAU', 'LSM', 'DIAPE', 'COLPE', 'AILPU', 'PROFUB']);
const COLOR_CAT = {
  EXCELENTE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MUY_BUENO: 'bg-teal-100 text-teal-700 border-teal-200',
  BUENO:     'bg-sky-100 text-sky-700 border-sky-200',
  ACEPTABLE: 'bg-amber-100 text-amber-700 border-amber-200',
  REGULAR:   'bg-orange-100 text-orange-700 border-orange-200',
  POBRE:     'bg-red-100 text-red-700 border-red-200',
};
const GLOSARIO = [
  ['Cruz', 'La parte más alta de la espalda, encima de las patas delanteras.'],
  ['Grupa', 'La cadera: la parte de atrás, arriba de la cola.'],
  ['Encuentro', 'La punta del hombro, adelante del pecho.'],
  ['Isquion', 'La punta de la nalga: el hueso que sobresale a cada lado de la cola.'],
  ['Ilíacos', 'Los dos huesos salientes de la cadera, arriba.'],
  ['Corvejón', 'La articulación que dobla en la pata de atrás (parece una rodilla al revés).'],
  ['Caña', 'La parte delgada de la pata, entre la rodilla y el menudillo.'],
  ['Bastón zoométrico', 'Regla vertical con un brazo que se desliza; mide alturas y largos rectos.'],
  ['Compás de brazos', 'Compás grande para medir anchos (pecho, grupa) de un hueso a otro.'],
  ['Calibrador (pie de rey)', 'Regla con mordazas para medir cosas pequeñas como los pezones.'],
  ['Inserción de la ubre', 'El lugar donde la ubre se pega al cuerpo.'],
  ['Ligamento suspensor', 'El "tirante" que sostiene la ubre; se ve como una rayita en el centro.'],
  ['Aplomos', 'La forma en que la cabra apoya las patas en el piso.'],
];

const hoy = () => new Date().toISOString().slice(0, 10);
const cabVacia = () => ({ idAnimal: null, fechaEvaluacion: hoy(), edadMeses: '', numLactancia: '', observaciones: '' });
const nombreCabra = (codigo, nombre) => (nombre ? `${codigo} — ${nombre}` : codigo);

const mesesDesde = (fecha) => {
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  return Math.max(0, Math.floor((Date.now() - d) / (30.44 * 86400000)));
};

const aNumero = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Mismos índices que ClasificacionLinealService::indices del backend
const INDICES = [
  ['CORPORAL', 'Índice corporal', 'LONG_CORP', 'PER_TOR', 'Longitud ÷ perímetro torácico',
    (v) => (v < 86 ? 'Brevilínea (corta y ancha)' : v < 90 ? 'Mesolínea (proporcionada)' : 'Longilínea (larga, típico lechero)')],
  ['PROPORCION', 'Proporcionalidad', 'ALZ_CRUZ', 'LONG_CORP', 'Alzada ÷ longitud',
    (v) => (v < 100 ? 'Más larga que alta' : 'Más alta que larga')],
  ['TORACICO', 'Índice torácico', 'ANCH_PECHO', 'PROF_PECHO', 'Ancho ÷ profundidad del pecho',
    (v) => (v < 50 ? 'Pecho estrecho y profundo' : v < 65 ? 'Pecho intermedio' : 'Pecho ancho')],
  ['PELVIANO', 'Índice pelviano', 'ANCH_GRUPA', 'LONG_GRUPA', 'Ancho ÷ largo de grupa',
    (v) => (v < 100 ? 'Grupa más larga que ancha' : 'Grupa más ancha que larga')],
  ['PROF_RELATIVA', 'Profundidad relativa', 'PROF_PECHO', 'ALZ_CRUZ', 'Profundidad del pecho ÷ alzada',
    (v) => (v < 45 ? 'Poca capacidad corporal' : v < 50 ? 'Capacidad media' : 'Buena capacidad corporal')],
];
const calcIndices = (m) => INDICES.flatMap(([codigo, nombre, a, b, formula, lectura]) => {
  const x = aNumero(m[a]); const y = aNumero(m[b]);
  if (!x || !y) return [];
  const valor = Math.round((x / y) * 1000) / 10;
  return [{ codigo, nombre, valor, formula, lectura: lectura(valor) }];
});

// Imagen protegida: se descarga con el token y se muestra como blob.
const FotoProtegida = ({ idFoto, alt, onVer }) => {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let url;
    const token = localStorage.getItem('token');
    fetch(clasificacionLinealAPI.urlFoto(idFoto), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => { url = URL.createObjectURL(b); setSrc(url); })
      .catch(() => setErr(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [idFoto]);
  if (err) return <div className="w-full h-28 flex items-center justify-center bg-gray-50 rounded-lg text-gray-300"><ImageOff className="w-6 h-6" /></div>;
  if (!src) return <div className="w-full h-28 flex items-center justify-center bg-gray-50 rounded-lg"><RefreshCw className="w-4 h-4 animate-spin text-gray-300" /></div>;
  return <img src={src} alt={alt} onClick={() => onVer?.(src)} className="w-full h-28 object-cover rounded-lg cursor-zoom-in" />;
};

const Visor = ({ src, onCerrar }) => src ? (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
    <img src={src} alt="Ampliada" className="max-w-full max-h-full rounded-lg bg-white" />
    <button onClick={onCerrar} aria-label="Cerrar" className="absolute top-4 right-4 text-white"><X className="w-7 h-7" /></button>
  </div>
) : null;

// Dos botones: cámara (en el celular abre la cámara trasera) y galería
const BotonesFoto = ({ onArchivo, compacto = false }) => {
  const cam = useRef(null);
  const gal = useRef(null);
  const elegir = (e) => { const f = e.target.files?.[0]; if (f) onArchivo(f); e.target.value = ''; };
  const cls = `flex-1 flex flex-col items-center justify-center bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg border border-dashed border-gray-200 ${compacto ? 'h-16' : 'h-28'}`;
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => cam.current?.click()} className={cls}><Camera className="w-5 h-5 mb-0.5" /><span className="text-xs">Cámara</span></button>
      <button type="button" onClick={() => gal.current?.click()} className={cls}><ImageIcon className="w-5 h-5 mb-0.5" /><span className="text-xs">Galería</span></button>
      <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={elegir} />
      <input ref={gal} type="file" accept="image/*" className="hidden" onChange={elegir} />
    </div>
  );
};

const ProtocoloFotos = ({ abierto, onToggle }) => (
  <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm text-sky-900">
    <button type="button" onClick={onToggle} className="w-full font-semibold flex items-center justify-between gap-2 text-left">
      <span className="flex items-center gap-1.5"><Camera className="w-4 h-4" /> Cómo tomar las fotos para que sirvan como evidencia</span>
      <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${abierto ? 'rotate-180' : ''}`} />
    </button>
    {abierto && (
      <dl className="mt-2 space-y-1 text-xs text-sky-800">
        {PROTOCOLO.map(([t, d]) => <div key={t}><dt className="inline font-semibold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
      </dl>
    )}
  </div>
);

const calcular = (catalogo, valores) => {
  const subtotales = { APARIENCIA: 0, ESTRUCTURA: 0, MAMARIO: 0, PATAS: 0 };
  catalogo.forEach((r) => {
    const cal = valores[r.idRasgo];
    if (!cal) return;
    subtotales[r.region] += r.ptsRasgo * (FACTOR[cal] || 0); // se redondea solo el subtotal
  });
  Object.keys(subtotales).forEach((k) => { subtotales[k] = Math.round(subtotales[k] * 100) / 100; });
  const puntFinal = Math.round(Object.values(subtotales).reduce((a, b) => a + b, 0) * 100) / 100;
  let categoria = 'POBRE';
  if (puntFinal >= 90) categoria = 'EXCELENTE';
  else if (puntFinal >= 85) categoria = 'MUY_BUENO';
  else if (puntFinal >= 80) categoria = 'BUENO';
  else if (puntFinal >= 70) categoria = 'ACEPTABLE';
  else if (puntFinal >= 60) categoria = 'REGULAR';
  return { subtotales, puntFinal, categoria };
};

const ModuloClasificacionLineal = () => {
  const [vista, setVista] = useState('lista'); // lista | form | detalle
  const [cargando, setCargando] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visor, setVisor] = useState(null);

  const [animales, setAnimales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [medidasCat, setMedidasCat] = useState([]);
  const [valores, setValores] = useState({});
  const [medidas, setMedidas] = useState({}); // codigo -> texto
  const [cab, setCab] = useState(cabVacia());
  const [idEditando, setIdEditando] = useState(null);
  const [partoInfo, setPartoInfo] = useState(null); // { dias, partos } de la hembra elegida
  const [abiertos, setAbiertos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarLista();
    animalesAPI.getAll().then((r) => setAnimales(r.data || [])).catch(() => setAnimales([]));
  }, []);

  // Solo se evalúan hembras (el método es para cabras lecheras en lactancia)
  const hembras = useMemo(() => animales.filter((a) => a.sexo === 'hembra' && (a.estado || 'activo') === 'activo'), [animales]);
  const medidasPorRasgo = useMemo(() => {
    const m = {};
    medidasCat.forEach((x) => { if (x.rasgoRel) (m[x.rasgoRel] ||= []).push(x); });
    return m;
  }, [medidasCat]);
  const toggle = (k) => setAbiertos((a) => ({ ...a, [k]: !a[k] }));

  const cargarLista = async () => {
    setCargando(true);
    try { const r = await clasificacionLinealAPI.getAll(); setEvaluaciones(r.data); }
    catch (e) { setError(e.message || 'No se pudo cargar la lista'); } finally { setCargando(false); }
  };

  const cargarCatalogo = async () => {
    const { rasgos, medidas: med } = await clasificacionLinealAPI.getCatalogoCompleto();
    setCatalogo(rasgos);
    setMedidasCat(med);
  };

  const iniciarNueva = async () => {
    setError('');
    setCargando(true);
    try {
      await cargarCatalogo();
      setValores({}); // sin calificar: obliga a revisar cada rasgo
      setMedidas({});
      setCab(cabVacia());
      setIdEditando(null);
      setPartoInfo(null);
      setAbiertos({ _medidas: true });
      setVista('form');
      window.scrollTo({ top: 0 });
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
    finally { setCargando(false); }
  };

  const editar = async (id) => {
    setError('');
    setCargando(true);
    try {
      const [, d] = await Promise.all([cargarCatalogo(), clasificacionLinealAPI.getById(id)]);
      setValores(Object.fromEntries((d.detalle || []).map((x) => [x.idRasgo, x.calificacion])));
      setMedidas(Object.fromEntries((d.medidas || []).map((m) => [m.codigo, String(m.valor)])));
      setCab({
        idAnimal: d.idAnimal, fechaEvaluacion: d.fechaEvaluacion?.slice(0, 10) || hoy(),
        edadMeses: d.edadMeses ?? '', numLactancia: d.numLactancia ?? '', observaciones: d.observaciones || '',
      });
      setIdEditando(id);
      setPartoInfo(null);
      setAbiertos({ _medidas: true });
      setVista('form');
      window.scrollTo({ top: 0 });
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); }
    finally { setCargando(false); }
  };

  // Al elegir la cabra: edad y último parto para orientar al evaluador
  const elegirAnimal = async (id) => {
    const a = hembras.find((x) => x.id === id);
    setCab((c) => ({ ...c, idAnimal: id, edadMeses: a?.fechaNacimiento ? String(mesesDesde(a.fechaNacimiento)) : c.edadMeses }));
    setPartoInfo(null);
    try {
      const r = await reproduccionAPI.getAll({ idHembra: id });
      const partos = (r.data || []).filter((x) => x.fechaPartoReal).sort((x, y) => new Date(y.fechaPartoReal) - new Date(x.fechaPartoReal));
      const dias = partos.length ? Math.floor((Date.now() - new Date(partos[0].fechaPartoReal)) / 86400000) : null;
      setPartoInfo({ dias, partos: partos.length });
      if (partos.length) setCab((c) => ({ ...c, numLactancia: c.numLactancia || String(partos.length) }));
    } catch { /* la orientación es opcional */ }
  };

  const resultado = useMemo(() => calcular(catalogo, valores), [catalogo, valores]);
  const indicesVivos = useMemo(() => calcIndices(medidas), [medidas]);
  const faltantes = catalogo.filter((r) => !valores[r.idRasgo]);
  const medidasMal = medidasCat.filter((m) => medidas[m.codigo] !== undefined && medidas[m.codigo] !== '' && !(aNumero(medidas[m.codigo]) > 0 && aNumero(medidas[m.codigo]) < 300));
  const numMedidas = medidasCat.filter((m) => aNumero(medidas[m.codigo]) > 0).length;

  const guardar = async () => {
    if (!cab.idAnimal) { setError('Primero elige la cabra que vas a evaluar (arriba).'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (faltantes.length) {
      setError(`Faltan ${faltantes.length} rasgo(s) por calificar: ${faltantes.map((f) => f.nombre).join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (medidasMal.length) {
      setError(`Revise el valor de: ${medidasMal.map((m) => m.nombre).join(', ')}. Escriba solo el número (por ejemplo 72 o 72,5).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const payload = {
        idAnimal: cab.idAnimal,
        fechaEvaluacion: cab.fechaEvaluacion,
        edadMeses: cab.edadMeses !== '' ? Number(cab.edadMeses) : null,
        numLactancia: cab.numLactancia !== '' ? Number(cab.numLactancia) : null,
        observaciones: cab.observaciones || null,
        detalle: catalogo.map((r) => ({ idRasgo: r.idRasgo, calificacion: valores[r.idRasgo] })),
        medidas: medidasCat
          .filter((m) => aNumero(medidas[m.codigo]) > 0)
          .map((m) => ({ codigo: m.codigo, valor: aNumero(medidas[m.codigo]) })),
      };
      const res = idEditando
        ? await clasificacionLinealAPI.update(idEditando, payload)
        : await clasificacionLinealAPI.create(payload);
      const id = idEditando || res.data.idEvaluacion;
      setIdEditando(id); // si algo falla después, un nuevo intento edita en vez de duplicar
      await cargarLista();
      await verDetalle(id); // ir directo al detalle para tomar las fotos
    } catch (e) { setError(e.message || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const verDetalle = async (id) => {
    setCargando(true);
    setError('');
    try {
      const d = await clasificacionLinealAPI.getById(id);
      setDetalle(d);
      setVista('detalle');
      window.scrollTo({ top: 0 });
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); } finally { setCargando(false); }
  };

  const recargarDetalle = async () => {
    const d = await clasificacionLinealAPI.getById(detalle.id);
    setDetalle(d);
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta clasificación lineal, sus medidas y sus fotos?')) return;
    try { await clasificacionLinealAPI.delete(id); await cargarLista(); }
    catch (e) { setError(e.message || 'No se pudo eliminar'); }
  };

  const subirFoto = async (tipoVista, file) => {
    if (!file || !detalle) return;
    setSubiendo(tipoVista);
    setError('');
    try {
      await clasificacionLinealAPI.subirFoto(detalle.id, file, tipoVista);
      await recargarDetalle();
    } catch (e) { setError(e.message || 'Error al subir la foto'); }
    finally { setSubiendo(''); }
  };

  const borrarFoto = async (foto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try { await clasificacionLinealAPI.eliminarFoto(foto.idFoto); await recargarDetalle(); }
    catch (e) { setError(e.message || 'No se pudo eliminar la foto'); }
  };

  // ---------------- LISTA ----------------
  if (vista === 'lista') {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-lg p-6 sm:p-7 text-white mb-5 relative overflow-hidden">
          <Ruler className="absolute -right-6 -bottom-10 w-48 h-48 text-white/10" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><Ruler className="w-6 h-6 text-white" /></div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Clasificación Lineal</h1>
                <p className="text-rose-100 text-sm">Forma del cuerpo y la ubre (método ADGA), medidas con instrumento y fotos de evidencia</p>
              </div>
            </div>
            <button onClick={iniciarNueva} className="flex items-center gap-2 px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Nueva evaluación
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

        {cargando ? (
          <div className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : evaluaciones.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aún no hay clasificaciones lineales registradas.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {evaluaciones.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-gray-700">{e.codigoAnimal}</span>
                    {e.nombreAnimal ? <span className="text-gray-500 truncate">— {e.nombreAnimal}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CAT[e.categoria] || ''}`}>{e.categoria?.replace('_', ' ')}</span>
                    <span className="text-lg font-bold text-gray-800">{e.puntFinal} pts</span>
                    <span className="text-sm text-gray-400">{e.fechaEvaluacion?.slice(0, 10)}</span>
                    {e.numMedidas > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{e.numMedidas}</span>}
                    {e.numFotos > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{e.numFotos}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => verDetalle(e.id)} title="Ver" aria-label="Ver" className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => editar(e.id)} title="Editar" aria-label="Editar" className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(e.id)} title="Eliminar" aria-label="Eliminar" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------- DETALLE ----------------
  if (vista === 'detalle' && detalle) {
    const medGrupo = (g) => (detalle.medidas || []).filter((m) => m.grupo === g);
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Visor src={visor} onCerrar={() => setVisor(null)} />
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"><ArrowLeft className="w-4 h-4" /> Volver</button>
          <button onClick={() => editar(detalle.id)} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Editar</button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 mb-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono font-semibold text-gray-700">{nombreCabra(detalle.codigoAnimal, detalle.nombreAnimal)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${COLOR_CAT[detalle.categoria] || ''}`}>{detalle.categoria?.replace('_', ' ')}</span>
              <span className="text-3xl font-bold text-gray-800">{detalle.puntFinal} <span className="text-base font-normal text-gray-400">/ 100</span></span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {detalle.fechaEvaluacion?.slice(0, 10)}
              {detalle.edadMeses != null && ` · ${detalle.edadMeses} meses`}
              {detalle.numLactancia != null && ` · ${detalle.numLactancia} parto(s)`}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600 space-y-1">
            <p>Apariencia: <b>{detalle.puntApariencia}</b> / 25</p>
            <p>Estructura: <b>{detalle.puntEstructura}</b> / 15</p>
            <p>Mamario: <b>{detalle.puntMamario}</b> / 40</p>
            <p>Patas: <b>{detalle.puntPatas}</b> / 20</p>
          </div>
        </div>
        {detalle.observaciones && <p className="mb-4 text-sm text-gray-600 bg-white border border-gray-100 rounded-xl p-4 whitespace-pre-line">{detalle.observaciones}</p>}

        {/* Medidas e índices */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-1"><Ruler className="w-4 h-4" /> Medidas tomadas con instrumento</h3>
          {(detalle.medidas || []).length === 0 ? (
            <p className="text-sm text-gray-400">No se registraron medidas. Puede agregarlas con <b>Editar</b>.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {GRUPOS_MEDIDA.map((g) => medGrupo(g.key).length > 0 && (
                  <div key={g.key}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{g.titulo}</p>
                    <dl className="text-sm divide-y divide-gray-50">
                      {medGrupo(g.key).map((m) => (
                        <div key={m.codigo} className="flex justify-between gap-2 py-1">
                          <dt className="text-gray-600">{m.nombre}</dt>
                          <dd className={`font-semibold tabular-nums ${m.fueraRango ? 'text-amber-600' : 'text-gray-800'}`} title={m.fueraRango ? 'Fuera del rango habitual: revise la lectura' : ''}>
                            {String(m.valor).replace('.', ',')} {m.unidad}{m.fueraRango ? ' ⚠' : ''}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              {(detalle.indices || []).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Índices zoométricos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {detalle.indices.map((i) => (
                      <div key={i.codigo} className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">{i.nombre}</p>
                        <p className="text-lg font-bold text-gray-800 tabular-nums">{String(i.valor).replace('.', ',')}</p>
                        <p className="text-xs text-gray-600">{i.lectura}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{i.formula}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-2"><Camera className="w-4 h-4" /> Fotos de evidencia</h3>
          <div className="mb-3"><ProtocoloFotos abierto={abiertos._protocolo} onToggle={() => toggle('_protocolo')} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VISTAS.map((v) => {
              const fotos = (detalle.fotos || []).filter((f) => f.tipoVista === v.key);
              const puedeAgregar = v.varias || fotos.length === 0;
              return (
                <div key={v.key} className={`border rounded-lg p-2 ${fotos.length ? 'border-gray-100' : 'border-amber-100'}`}>
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    {fotos.length > 0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}{v.label}
                  </p>
                  <p className="text-[11px] text-gray-400 mb-1.5 leading-snug">{v.ayuda}</p>
                  <div className="space-y-2">
                    {fotos.map((f) => (
                      <div key={f.idFoto} className="relative">
                        <FotoProtegida idFoto={f.idFoto} alt={v.label} onVer={setVisor} />
                        <button type="button" onClick={() => borrarFoto(f)} title="Eliminar foto" aria-label="Eliminar foto"
                          className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {subiendo === v.key ? (
                      <div className="h-16 flex items-center justify-center text-xs text-gray-500 gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Subiendo…</div>
                    ) : puedeAgregar ? (
                      <BotonesFoto compacto={fotos.length > 0} onArchivo={(f) => subirFoto(v.key, f)} />
                    ) : (
                      <p className="text-[11px] text-gray-400">Para cambiarla, elimínela y tome otra.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalle por región */}
        {REGIONES.map((g) => {
          const items = (detalle.detalle || []).filter((d) => d.region === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
              <h3 className="font-semibold text-gray-700">{g.titulo}</h3>
              <p className="text-xs text-gray-400 mb-2">{g.ayuda}</p>
              <div className="divide-y divide-gray-50">
                {items.map((d) => (
                  <div key={d.idDetalle} className="py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-700">{d.nombre}</span>
                      <span className="text-gray-500 shrink-0">{d.calificacion} · {CAL_LABEL[d.calificacion]} · <b className="text-gray-800">{d.puntaje} pts</b></span>
                    </div>
                    {d.nivelTexto && <p className="text-xs text-gray-400 mt-0.5">{d.nivelTexto}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------- FORMULARIO (nueva / editar) ----------------
  const animalElegido = animales.find((a) => a.id === cab.idAnimal);
  const listaHembras = animalElegido && !hembras.some((h) => h.id === animalElegido.id) ? [animalElegido, ...hembras] : hembras;
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-40">
      <Visor src={visor} onCerrar={() => setVisor(null)} />
      <button onClick={() => (idEditando ? verDetalle(idEditando) : setVista('lista'))} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Cancelar</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-3">{idEditando ? 'Editar clasificación lineal' : 'Nueva clasificación lineal'}</h1>

      {/* Cómo hacerlo */}
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-3 text-sm text-rose-900">
        <p className="font-semibold flex items-center gap-1.5 mb-1.5"><Info className="w-4 h-4" /> Cómo hacer la evaluación</p>
        <ol className="list-decimal ml-5 space-y-0.5 text-rose-800">
          <li>Se evalúan <b>hembras adultas</b>, idealmente unos <b>45 días después de parir</b> (así la ubre está bien desarrollada).</li>
          <li>Ponga la cabra <b>parada en piso plano</b>, tranquila, con la cabeza en posición normal.</li>
          <li><b>Mida</b> con el bastón, la cinta y el calibrador, y escriba cada medida. Son opcionales, pero dan el dato exacto que la vista no da.</li>
          <li>En cada rasgo verá desde dónde mirarla. Compárela con el dibujo y elija <b>1, 2 o 3</b>: 1 = bajo, 2 = intermedio, 3 = alto.</li>
          <li>Al guardar se abren las <b>fotos de evidencia</b>: una por cada vista y las de la medición.</li>
        </ol>
        <button type="button" onClick={() => toggle('_glosario')} className="mt-2 text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1">
          <ChevronDown className={`w-3 h-3 transition-transform ${abiertos._glosario ? 'rotate-180' : ''}`} /> Palabras que quizá no conozca
        </button>
        {abiertos._glosario && (
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {GLOSARIO.map(([t, d]) => <div key={t}><dt className="inline font-semibold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
          </dl>
        )}
      </div>
      <div className="mb-4"><ProtocoloFotos abierto={abiertos._protocolo} onToggle={() => toggle('_protocolo')} /></div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className={lbl}>Cabra a evaluar <span className="text-red-500">*</span></label>
          <SelectAnimal animales={listaHembras} value={cab.idAnimal} onChange={elegirAnimal} busqueda={busqueda} onBusqueda={setBusqueda} colorFocus="focus:ring-rose-500" />
          <p className="text-[11px] text-gray-400 mt-1">Solo aparecen hembras activas. Busque por número de chapeta o nombre.</p>
          {partoInfo && (
            partoInfo.dias === null ? (
              <p className="text-xs text-amber-600 mt-1">No tiene partos registrados en Reproducción. El método está pensado para cabras que ya han parido.</p>
            ) : (
              <p className={`text-xs mt-1 ${partoInfo.dias < 30 || partoInfo.dias > 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                Último parto hace {partoInfo.dias} días.{partoInfo.dias < 30 ? ' Es pronto: lo ideal es cerca de los 45 días.' : partoInfo.dias > 90 ? ' Lo ideal es evaluarla cerca de los 45 días después del parto.' : ' Buen momento para evaluarla.'}
              </p>
            )
          )}
        </div>
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" max={hoy()} className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Edad (meses)</label>
            <input type="number" min="0" inputMode="numeric" className={inp} value={cab.edadMeses} onChange={(e) => setCab({ ...cab, edadMeses: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>N° de partos</label>
            <input type="number" min="0" inputMode="numeric" className={inp} value={cab.numLactancia} onChange={(e) => setCab({ ...cab, numLactancia: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Medidas con instrumento */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <button type="button" onClick={() => toggle('_medidas')} className="w-full flex items-start justify-between gap-3 text-left">
          <div>
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Ruler className="w-4 h-4" /> Medidas con instrumento <span className="text-xs font-normal text-gray-400">(opcional)</span></h3>
            <p className="text-xs text-gray-500">Las medidas exactas no salen de una foto: se toman sobre la cabra y se escriben aquí. Deje vacío lo que no pudo medir.</p>
          </div>
          <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">{numMedidas}/{medidasCat.length}<ChevronDown className={`w-4 h-4 transition-transform ${abiertos._medidas ? 'rotate-180' : ''}`} /></span>
        </button>
        {abiertos._medidas && (
          <div className="mt-3 space-y-4">
            {GRUPOS_MEDIDA.map((g) => {
              const items = medidasCat.filter((m) => m.grupo === g.key);
              if (!items.length) return null;
              return (
                <div key={g.key}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{g.titulo}</p>
                  <p className="text-[11px] text-gray-400 mb-2">{g.ayuda}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((m) => {
                      const val = medidas[m.codigo] ?? '';
                      const n = aNumero(val);
                      const fuera = n != null && n > 0 && ((m.minNormal != null && n < m.minNormal) || (m.maxNormal != null && n > m.maxNormal));
                      const invalido = val !== '' && !(n > 0 && n < 300);
                      const ayudaAbierta = abiertos[`m_${m.codigo}`];
                      return (
                        <div key={m.codigo} className={`rounded-lg border p-2.5 ${invalido ? 'border-red-300' : fuera ? 'border-amber-300' : 'border-gray-100'}`}>
                          <div className="flex items-center gap-2">
                            <label htmlFor={`med-${m.codigo}`} className="flex-1 text-sm text-gray-700 leading-tight">
                              {m.nombre}
                              <span className="block text-[10px] text-gray-400">{m.instrumento}</span>
                            </label>
                            <div className="flex items-center gap-1 shrink-0">
                              <input id={`med-${m.codigo}`} type="text" inputMode="decimal" placeholder="—"
                                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500"
                                value={val} onChange={(e) => setMedidas((x) => ({ ...x, [m.codigo]: e.target.value.replace(/[^0-9.,]/g, '') }))} />
                              <span className="text-xs text-gray-500 w-5">{m.unidad}</span>
                            </div>
                          </div>
                          {(invalido || fuera) && (
                            <p className={`text-[11px] mt-1 ${invalido ? 'text-red-600' : 'text-amber-600'}`}>
                              {invalido ? 'Escriba solo el número.' : `Lo habitual es entre ${m.minNormal} y ${m.maxNormal} ${m.unidad}. Revise la lectura.`}
                            </p>
                          )}
                          <button type="button" onClick={() => toggle(`m_${m.codigo}`)} className="mt-1 text-[11px] text-rose-700 hover:text-rose-900 flex items-center gap-1">
                            <ChevronDown className={`w-3 h-3 transition-transform ${ayudaAbierta ? 'rotate-180' : ''}`} /> Cómo medir
                          </button>
                          {ayudaAbierta && <p className="text-[11px] text-gray-600 mt-1 leading-snug">{m.comoMedir}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {indicesVivos.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Índices calculados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {indicesVivos.map((i) => (
                    <div key={i.codigo} className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">{i.nombre}: <b className="text-gray-800 tabular-nums">{String(i.valor).replace('.', ',')}</b></p>
                      <p className="text-xs text-gray-600">{i.lectura}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {REGIONES.map((g) => {
        const items = catalogo.filter((c) => c.region === g.key);
        const hechos = items.filter((r) => valores[r.idRasgo]).length;
        return (
          <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-700">{g.titulo} <span className="text-xs font-normal text-gray-400">({g.pts} pts)</span></h3>
                <p className="text-xs text-gray-500">{g.ayuda}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 text-right">{hechos}/{items.length} calificados<br />subtotal {resultado.subtotales[g.key]}</span>
            </div>
            <div className="space-y-3">
              {items.map((r) => {
                const sel = valores[r.idRasgo];
                const relacionadas = (medidasPorRasgo[r.codigo] || []).filter((m) => aNumero(medidas[m.codigo]) > 0);
                return (
                  <div key={r.idRasgo} className={`rounded-lg border p-3 ${sel ? 'border-gray-100' : 'border-amber-200'}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.nombre}</p>
                        {r.vista && <span className="inline-block text-[10px] px-1.5 py-0.5 mt-0.5 bg-rose-50 text-rose-600 rounded">Mírela: {r.vista}</span>}
                      </div>
                      <span className="text-[11px] text-gray-400">hasta {Math.round(r.ptsRasgo * 100) / 100} pts</span>
                    </div>
                    {r.queMirar && <p className="text-xs text-gray-600 mt-1.5">{r.queMirar}</p>}
                    {relacionadas.length > 0 && (
                      <p className="text-xs text-sky-700 bg-sky-50 rounded px-2 py-1 mt-1.5 inline-flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> Medida: {relacionadas.map((m) => `${m.nombre.toLowerCase()} ${String(medidas[m.codigo]).replace('.', ',')} ${m.unidad}`).join(' · ')}
                      </p>
                    )}
                    {CON_DIBUJO.has(r.codigo) && (
                      <img src={`/img/lineal/${r.codigo}.jpg`} alt={`Referencia ${r.nombre}`} onClick={() => setVisor(`/img/lineal/${r.codigo}.jpg`)}
                        className="mt-2 w-full max-w-sm rounded-lg border border-gray-100 cursor-zoom-in" />
                    )}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[1, 2, 3].map((c) => (
                        <button key={c} type="button" onClick={() => setValores((v) => ({ ...v, [r.idRasgo]: c }))}
                          className={`text-left rounded-lg border-2 px-3 py-2 transition ${sel === c ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-rose-300 bg-white'}`}>
                          <span className={`text-sm font-bold ${sel === c ? 'text-rose-700' : 'text-gray-700'}`}>{c} · {CAL_LABEL[c]}</span>
                          {r.niveles?.[c] && <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">{r.niveles[c]}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <label className={lbl}>Observaciones</label>
        <textarea className={inp} rows={2} placeholder="Algo que llame la atención: cojera, ubre desigual, una lesión…" value={cab.observaciones} onChange={(e) => setCab({ ...cab, observaciones: e.target.value })} />
      </div>

      <div className="vidrio-claro fixed bottom-0 left-0 right-0 border-t border-gray-200 p-3 sm:p-4 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Calificación final</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{resultado.puntFinal} <span className="text-sm font-normal text-gray-400">/ 100</span></span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CAT[resultado.categoria]}`}>{resultado.categoria.replace('_', ' ')}</span>
              </div>
            </div>
            {faltantes.length > 0
              ? <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Faltan {faltantes.length} de {catalogo.length} rasgos</span>
              : <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Todos los rasgos calificados</span>}
          </div>
          <button onClick={guardar} disabled={guardando} className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando…' : idEditando ? 'Guardar cambios' : 'Guardar y tomar fotos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuloClasificacionLineal;
