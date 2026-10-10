import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Ruler, Plus, ArrowLeft, RefreshCw, Trash2, Eye, Camera,
  CheckCircle, AlertTriangle, ImageOff, Info, X, ChevronDown,
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
const VISTAS = [
  { key: 'FRONTAL',   label: 'De frente',      ayuda: 'La cabra completa, de frente.' },
  { key: 'LATERAL',   label: 'De lado',        ayuda: 'El cuerpo completo, de lado.' },
  { key: 'POSTERIOR', label: 'Desde atrás',    ayuda: 'El cuerpo completo, desde atrás.' },
  { key: 'UBRE_POST', label: 'Ubre de atrás',  ayuda: 'De cerca: la ubre vista desde atrás.' },
  { key: 'UBRE_LAT',  label: 'Ubre de lado',   ayuda: 'De cerca: la ubre vista de lado.' },
  { key: 'PATAS',     label: 'Patas',          ayuda: 'Las patas de atrás, parada en piso plano.' },
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
  ['Corvejón', 'La articulación que dobla en la pata de atrás (parece una rodilla al revés).'],
  ['Inserción de la ubre', 'El lugar donde la ubre se pega al cuerpo.'],
  ['Ligamento suspensor', 'El "tirante" que sostiene la ubre; se ve como una rayita en el centro.'],
  ['Aplomos', 'La forma en que la cabra apoya las patas en el piso.'],
];

const hoy = () => new Date().toISOString().slice(0, 10);
const cabVacia = () => ({ idAnimal: null, fechaEvaluacion: hoy(), edadMeses: '', numLactancia: '', observaciones: '' });

const mesesDesde = (fecha) => {
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  return Math.max(0, Math.floor((Date.now() - d) / (30.44 * 86400000)));
};

// Imagen protegida: se descarga con el token y se muestra como blob.
const FotoProtegida = ({ idFoto, alt }) => {
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
  if (err) return <div className="w-full h-28 flex items-center justify-center bg-gray-50 text-gray-300"><ImageOff className="w-6 h-6" /></div>;
  if (!src) return <div className="w-full h-28 flex items-center justify-center bg-gray-50"><RefreshCw className="w-4 h-4 animate-spin text-gray-300" /></div>;
  return <img src={src} alt={alt} className="w-full h-28 object-cover rounded-lg" />;
};

const Visor = ({ src, onCerrar }) => src ? (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
    <img src={src} alt="Referencia" className="max-w-full max-h-full rounded-lg bg-white" />
    <button onClick={onCerrar} className="absolute top-4 right-4 text-white"><X className="w-7 h-7" /></button>
  </div>
) : null;

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
  const [vista, setVista] = useState('lista');
  const [cargando, setCargando] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visor, setVisor] = useState(null);

  const [animales, setAnimales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [valores, setValores] = useState({});
  const [cab, setCab] = useState(cabVacia());
  const [partoInfo, setPartoInfo] = useState(null); // { dias, partos } de la hembra elegida
  const [verGlosario, setVerGlosario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const fileRefs = useRef({});

  useEffect(() => {
    cargarLista();
    animalesAPI.getAll().then((r) => setAnimales(r.data || [])).catch(() => setAnimales([]));
  }, []);

  // Solo se evalúan hembras (el método es para cabras lecheras en lactancia)
  const hembras = useMemo(() => animales.filter((a) => a.sexo === 'hembra'), [animales]);

  const cargarLista = async () => {
    setCargando(true);
    try { const r = await clasificacionLinealAPI.getAll(); setEvaluaciones(r.data); }
    catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const iniciarNueva = async () => {
    setError('');
    setCargando(true);
    try {
      const cat = await clasificacionLinealAPI.getCatalogo();
      setCatalogo(cat);
      setValores({}); // sin calificar: obliga a revisar cada rasgo
      setCab(cabVacia());
      setPartoInfo(null);
      setVista('nueva');
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
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
  const faltantes = catalogo.filter((r) => !valores[r.idRasgo]);

  const guardar = async () => {
    if (!cab.idAnimal) { setError('Primero elige la cabra que vas a evaluar (arriba).'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (faltantes.length) {
      setError(`Faltan ${faltantes.length} rasgo(s) por calificar: ${faltantes.map((f) => f.nombre).join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const payload = {
        idAnimal: cab.idAnimal,
        fechaEvaluacion: cab.fechaEvaluacion,
        edadMeses: cab.edadMeses ? Number(cab.edadMeses) : null,
        numLactancia: cab.numLactancia ? Number(cab.numLactancia) : null,
        observaciones: cab.observaciones || null,
        detalle: catalogo.map((r) => ({ idRasgo: r.idRasgo, calificacion: valores[r.idRasgo] })),
      };
      const res = await clasificacionLinealAPI.create(payload);
      await cargarLista();
      // ir directo al detalle para poder subir fotos
      await verDetalle(res.data.idEvaluacion);
    } catch (e) { setError(e.message || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const verDetalle = async (id) => {
    setCargando(true);
    try { const d = await clasificacionLinealAPI.getById(id); setDetalle(d); setVista('detalle'); }
    catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta clasificación lineal?')) return;
    try { await clasificacionLinealAPI.delete(id); await cargarLista(); }
    catch (e) { alert(e.message); }
  };

  const subirFoto = async (tipoVista, file) => {
    if (!file || !detalle) return;
    try {
      await clasificacionLinealAPI.subirFoto(detalle.id, file, tipoVista);
      await verDetalle(detalle.id);
    } catch (e) { alert(e.message || 'Error al subir la foto'); }
  };

  // ---------------- LISTA ----------------
  if (vista === 'lista') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-lg p-7 text-white mb-5 relative overflow-hidden">
          <Ruler className="absolute -right-6 -bottom-10 w-48 h-48 text-white/10" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><Ruler className="w-6 h-6 text-white" /></div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Clasificación Lineal</h1>
                <p className="text-rose-100 text-sm">Calificar la forma del cuerpo y la ubre de cada cabra lechera (método ADGA)</p>
              </div>
            </div>
            <button onClick={iniciarNueva} className="flex items-center gap-2 px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Nueva evaluación
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

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
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-700">{e.codigoAnimal}</span>
                    {e.nombreAnimal ? <span className="text-gray-500">— {e.nombreAnimal}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CAT[e.categoria] || ''}`}>{e.categoria?.replace('_', ' ')}</span>
                    <span className="text-lg font-bold text-gray-800">{e.puntFinal} pts</span>
                    <span className="text-sm text-gray-400">{e.fechaEvaluacion?.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => verDetalle(e.id)} className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(e.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Volver</button>
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono font-semibold text-gray-700">{detalle.codigoAnimal} {detalle.nombreAnimal ? `— ${detalle.nombreAnimal}` : ''}</p>
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

        {/* Fotos */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-1"><Camera className="w-4 h-4" /> Fotos de evidencia</h3>
          <p className="text-xs text-gray-500 mb-3">Con la cabra parada en piso plano, tome una foto de cada vista. En el celular el botón abre la cámara.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VISTAS.map((v) => {
              const foto = (detalle.fotos || []).find((f) => f.tipoVista === v.key);
              return (
                <div key={v.key} className="border border-gray-100 rounded-lg p-2">
                  <p className="text-xs font-medium text-gray-600">{v.label}</p>
                  <p className="text-[11px] text-gray-400 mb-1">{v.ayuda}</p>
                  {foto ? (
                    <FotoProtegida idFoto={foto.idFoto} alt={v.label} />
                  ) : (
                    <button onClick={() => fileRefs.current[v.key]?.click()} className="w-full h-28 flex flex-col items-center justify-center bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg border border-dashed border-gray-200">
                      <Camera className="w-5 h-5 mb-1" /><span className="text-xs">Tomar / subir foto</span>
                    </button>
                  )}
                  <input ref={(el) => (fileRefs.current[v.key] = el)} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { if (e.target.files[0]) subirFoto(v.key, e.target.files[0]); e.target.value = ''; }} />
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

  // ---------------- NUEVA ----------------
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-36">
      <Visor src={visor} onCerrar={() => setVisor(null)} />
      <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Cancelar</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-3">Nueva clasificación lineal</h1>

      {/* Cómo hacerlo */}
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4 text-sm text-rose-900">
        <p className="font-semibold flex items-center gap-1.5 mb-1.5"><Info className="w-4 h-4" /> Cómo hacer la evaluación</p>
        <ol className="list-decimal ml-5 space-y-0.5 text-rose-800">
          <li>Se evalúan <b>hembras adultas</b>, idealmente unos <b>45 días después de parir</b> (así la ubre está bien desarrollada).</li>
          <li>Ponga la cabra <b>parada en piso plano</b>, tranquila, con la cabeza en posición normal.</li>
          <li>En cada rasgo verá desde dónde mirarla (de lado, desde atrás…). Compárela con el dibujo y elija <b>1, 2 o 3</b>: 1 = bajo, 2 = intermedio, 3 = alto.</li>
          <li>Al guardar podrá tomar las fotos de evidencia.</li>
        </ol>
        <button type="button" onClick={() => setVerGlosario((v) => !v)} className="mt-2 text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1">
          <ChevronDown className={`w-3 h-3 transition-transform ${verGlosario ? 'rotate-180' : ''}`} /> Palabras que quizá no conozca
        </button>
        {verGlosario && (
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {GLOSARIO.map(([t, d]) => <div key={t}><dt className="inline font-semibold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
          </dl>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className={lbl}>Cabra a evaluar <span className="text-red-500">*</span></label>
          <SelectAnimal animales={hembras} value={cab.idAnimal} onChange={elegirAnimal} busqueda={busqueda} onBusqueda={setBusqueda} colorFocus="focus:ring-rose-500" />
          <p className="text-[11px] text-gray-400 mt-1">Solo aparecen hembras.</p>
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
          <input type="date" className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Edad (meses)</label>
            <input type="number" min="0" className={inp} value={cab.edadMeses} onChange={(e) => setCab({ ...cab, edadMeses: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>N° de partos</label>
            <input type="number" min="0" className={inp} value={cab.numLactancia} onChange={(e) => setCab({ ...cab, numLactancia: e.target.value })} />
          </div>
        </div>
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
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
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
            {guardando ? 'Guardando…' : 'Guardar y tomar fotos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuloClasificacionLineal;
