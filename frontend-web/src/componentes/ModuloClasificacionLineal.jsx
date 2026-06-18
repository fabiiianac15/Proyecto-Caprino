import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Ruler, Plus, ArrowLeft, RefreshCw, Trash2, Eye, Camera,
  CheckCircle, AlertTriangle, ImageOff,
} from 'lucide-react';
import { clasificacionLinealAPI, animalesAPI } from '../servicios/caprino-api';
import SelectAnimal from './SelectAnimal';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const FACTOR = { 1: 0.10, 2: 0.50, 3: 1.00 };
const REGIONES = [
  { key: 'APARIENCIA', titulo: 'Apariencia general y capacidad', pts: 25 },
  { key: 'ESTRUCTURA', titulo: 'Estructura y fortaleza lechera', pts: 15 },
  { key: 'MAMARIO',    titulo: 'Sistema mamario',                pts: 40 },
  { key: 'PATAS',      titulo: 'Patas y pezuñas',                pts: 20 },
];
const VISTAS = [
  { key: 'FRONTAL',   label: 'Frontal' },
  { key: 'LATERAL',   label: 'Lateral' },
  { key: 'POSTERIOR', label: 'Posterior' },
  { key: 'UBRE_POST', label: 'Ubre posterior' },
  { key: 'UBRE_LAT',  label: 'Ubre lateral' },
  { key: 'PATAS',     label: 'Patas' },
];
const CAL_LABEL = { 1: 'Bajo', 2: 'Intermedio', 3: 'Alto' };
const COLOR_CAT = {
  EXCELENTE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MUY_BUENO: 'bg-teal-100 text-teal-700 border-teal-200',
  BUENO:     'bg-sky-100 text-sky-700 border-sky-200',
  ACEPTABLE: 'bg-amber-100 text-amber-700 border-amber-200',
  REGULAR:   'bg-orange-100 text-orange-700 border-orange-200',
  POBRE:     'bg-red-100 text-red-700 border-red-200',
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

const calcular = (catalogo, valores) => {
  const porRegion = {};
  catalogo.forEach((r) => { porRegion[r.region] = (porRegion[r.region] || 0) + 1; });
  const subtotales = { APARIENCIA: 0, ESTRUCTURA: 0, MAMARIO: 0, PATAS: 0 };
  catalogo.forEach((r) => {
    const cal = valores[r.idRasgo];
    if (!cal) return;
    const n = Math.max(1, porRegion[r.region]);
    subtotales[r.region] += Math.round((r.ptsRegion / n) * (FACTOR[cal] || 0) * 100) / 100;
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

  const [animales, setAnimales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [valores, setValores] = useState({});
  const [cab, setCab] = useState({ idAnimal: null, fechaEvaluacion: new Date().toISOString().slice(0, 10), edadMeses: '', numLactancia: '', observaciones: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const fileRefs = useRef({});

  useEffect(() => {
    cargarLista();
    animalesAPI.getAll().then((r) => setAnimales(r.data || [])).catch(() => setAnimales([]));
  }, []);

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
      const init = {};
      cat.forEach((r) => { init[r.idRasgo] = 2; }); // por defecto intermedio
      setCatalogo(cat);
      setValores(init);
      setCab({ idAnimal: null, fechaEvaluacion: new Date().toISOString().slice(0, 10), edadMeses: '', numLactancia: '', observaciones: '' });
      setVista('nueva');
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
    finally { setCargando(false); }
  };

  const resultado = useMemo(() => calcular(catalogo, valores), [catalogo, valores]);

  const guardar = async () => {
    if (!cab.idAnimal) { setError('Selecciona un animal'); return; }
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 rounded-xl"><Ruler className="w-6 h-6 text-rose-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Clasificación Lineal</h1>
              <p className="text-sm text-gray-500">Evaluación fenotípica morfológica (método ADGA)</p>
            </div>
          </div>
          <button onClick={iniciarNueva} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva evaluación
          </button>
        </div>

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
          </div>
          <div className="text-right text-sm text-gray-600 space-y-1">
            <p>Apariencia: <b>{detalle.puntApariencia}</b> / 25</p>
            <p>Estructura: <b>{detalle.puntEstructura}</b> / 15</p>
            <p>Mamario: <b>{detalle.puntMamario}</b> / 40</p>
            <p>Patas: <b>{detalle.puntPatas}</b> / 20</p>
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-3"><Camera className="w-4 h-4" /> Fotos de evidencia</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VISTAS.map((v) => {
              const foto = (detalle.fotos || []).find((f) => f.tipoVista === v.key);
              return (
                <div key={v.key} className="border border-gray-100 rounded-lg p-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">{v.label}</p>
                  {foto ? (
                    <FotoProtegida idFoto={foto.idFoto} alt={v.label} />
                  ) : (
                    <button onClick={() => fileRefs.current[v.key]?.click()} className="w-full h-28 flex flex-col items-center justify-center bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg border border-dashed border-gray-200">
                      <Camera className="w-5 h-5 mb-1" /><span className="text-xs">Subir</span>
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
              <h3 className="font-semibold text-gray-700 mb-2">{g.titulo}</h3>
              <div className="divide-y divide-gray-50">
                {items.map((d) => (
                  <div key={d.idDetalle} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-700">{d.nombre}</span>
                    <span className="text-gray-500">{CAL_LABEL[d.calificacion]} · <b className="text-gray-800">{d.puntaje}</b></span>
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
    <div className="p-6 max-w-5xl mx-auto pb-32">
      <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Cancelar</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Nueva clasificación lineal</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className={lbl}>Animal <span className="text-red-500">*</span></label>
          <SelectAnimal animales={animales} value={cab.idAnimal} onChange={(id) => setCab({ ...cab, idAnimal: id })} busqueda={busqueda} onBusqueda={setBusqueda} colorFocus="focus:ring-rose-500" />
        </div>
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Edad (meses)</label>
          <input type="number" className={inp} value={cab.edadMeses} onChange={(e) => setCab({ ...cab, edadMeses: e.target.value })} />
        </div>
      </div>

      {REGIONES.map((g) => {
        const items = catalogo.filter((c) => c.region === g.key);
        return (
          <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">{g.titulo}</h3>
              <span className="text-xs text-gray-400">{g.pts} pts · subtotal {resultado.subtotales[g.key]}</span>
            </div>
            <div className="space-y-2">
              {items.map((r) => (
                <div key={r.idRasgo} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700 flex-1">{r.nombre}</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((c) => (
                      <button key={c} onClick={() => setValores((v) => ({ ...v, [r.idRasgo]: c }))}
                        className={`px-3 h-9 rounded-lg text-xs font-semibold border transition ${valores[r.idRasgo] === c ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'}`}>
                        {CAL_LABEL[c]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <label className={lbl}>Observaciones</label>
        <textarea className={inp} rows={2} value={cab.observaciones} onChange={(e) => setCab({ ...cab, observaciones: e.target.value })} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-gray-400">Calificación final</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{resultado.puntFinal} <span className="text-sm font-normal text-gray-400">/ 100</span></span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CAT[resultado.categoria]}`}>{resultado.categoria.replace('_', ' ')}</span>
              </div>
            </div>
            <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Podrás añadir fotos tras guardar</span>
          </div>
          <button onClick={guardar} disabled={guardando} className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando…' : 'Guardar y añadir fotos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuloClasificacionLineal;
