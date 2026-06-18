import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart, Plus, ArrowLeft, RefreshCw, Trash2, Eye, FileText,
  Droplets, PawPrint, ClipboardList, CheckCircle, AlertTriangle, Sparkles,
} from 'lucide-react';
import { bienestarAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const PESOS = { RECURSOS: 0.35, ANIMAL: 0.55, GESTION: 0.10 };
const GRUPOS = [
  { key: 'RECURSOS', titulo: 'Recursos (35%)', icono: Droplets,      color: 'sky' },
  { key: 'ANIMAL',   titulo: 'Animal (55%)',   icono: PawPrint,      color: 'emerald' },
  { key: 'GESTION',  titulo: 'Gestión (10%)',  icono: ClipboardList, color: 'amber' },
];
const PUNTAJES = [0, 20, 55, 100];

// Cálculo en vivo (mismo modelo que BienestarService del backend)
const calcular = (catalogo, valores, rspp, asi) => {
  const sumas = { RECURSOS: 0, ANIMAL: 0, GESTION: 0 };
  const conteo = { RECURSOS: 0, ANIMAL: 0, GESTION: 0 };
  catalogo.forEach((ind) => {
    const v = valores[ind.idIndicador];
    if (!v || !v.aplica) return;
    sumas[ind.tipoMedida] += v.puntaje;
    conteo[ind.tipoMedida] += 1;
  });
  const prom = {};
  Object.keys(sumas).forEach((g) => {
    prom[g] = conteo[g] > 0 ? Math.round((sumas[g] / conteo[g]) * 100) / 100 : null;
  });
  let acum = 0, pesoUsado = 0;
  Object.entries(PESOS).forEach(([g, p]) => {
    if (prom[g] !== null) { acum += prom[g] * p; pesoUsado += p; }
  });
  const total = pesoUsado > 0 ? Math.round((acum / pesoUsado) * 100) / 100 : 0;
  let clasificacion = 'BAJO';
  if (total >= 90 && rspp && asi) clasificacion = 'EXCELENTE';
  else if (total >= 75) clasificacion = 'ALTO';
  else if (total >= 50) clasificacion = 'MEDIO';
  const pendientes = catalogo.filter((ind) => {
    const v = valores[ind.idIndicador];
    return v && v.aplica && v.puntaje < 100;
  });
  return { prom, total, clasificacion, pendientes };
};

const COLOR_CLASIF = {
  EXCELENTE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ALTO:      'bg-sky-100 text-sky-700 border-sky-200',
  MEDIO:     'bg-amber-100 text-amber-700 border-amber-200',
  BAJO:      'bg-red-100 text-red-700 border-red-200',
};

const ModuloBienestar = () => {
  const [vista, setVista] = useState('lista'); // lista | nueva | detalle
  const [cargando, setCargando] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [detalle, setDetalle] = useState(null);

  // estado del formulario
  const [catalogo, setCatalogo] = useState([]);
  const [valores, setValores] = useState({});
  const [cab, setCab] = useState({
    fechaEvaluacion: new Date().toISOString().slice(0, 10),
    tipoProductor: 'EXTENSIVO',
    numAnimales: '',
    tamanoMuestra: '',
    tieneRspp: false,
    tieneAsi: false,
    observaciones: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargarLista(); }, []);

  const cargarLista = async () => {
    setCargando(true);
    try {
      const r = await bienestarAPI.getAll();
      setEvaluaciones(r.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const confinamientoNoAplica = (tipoProd) => tipoProd === 'FAMILIAR' || tipoProd === 'EXTENSIVO';

  const iniciarNueva = async () => {
    setError('');
    setCargando(true);
    try {
      const [cat, sug] = await Promise.all([
        bienestarAPI.getCatalogo('CAPRINO'),
        bienestarAPI.getSugerencias().catch(() => ({})),
      ]);
      const init = {};
      cat.forEach((ind) => {
        const aplica = !(ind.soloConfinamiento && confinamientoNoAplica(cab.tipoProductor));
        const sugerido = sug[ind.codigo]?.puntajeSugerido;
        init[ind.idIndicador] = {
          puntaje: sugerido ?? 100,
          aplica,
          soporteDoc: '',
          info: sug[ind.codigo]?.info || null,
        };
      });
      setCatalogo(cat);
      setValores(init);
      setVista('nueva');
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
    finally { setCargando(false); }
  };

  const setPuntaje = (id, p) => setValores((v) => ({ ...v, [id]: { ...v[id], puntaje: p } }));
  const toggleAplica = (id) => setValores((v) => ({ ...v, [id]: { ...v[id], aplica: !v[id].aplica } }));
  const setSoporte = (id, s) => setValores((v) => ({ ...v, [id]: { ...v[id], soporteDoc: s } }));

  const onTipoProductor = (tp) => {
    setCab((c) => ({ ...c, tipoProductor: tp }));
    setValores((v) => {
      const nv = { ...v };
      catalogo.forEach((ind) => {
        if (ind.soloConfinamiento) nv[ind.idIndicador] = { ...nv[ind.idIndicador], aplica: !confinamientoNoAplica(tp) };
      });
      return nv;
    });
  };

  const resultado = useMemo(
    () => calcular(catalogo, valores, cab.tieneRspp, cab.tieneAsi),
    [catalogo, valores, cab.tieneRspp, cab.tieneAsi]
  );

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const payload = {
        especie: 'CAPRINO',
        fechaEvaluacion: cab.fechaEvaluacion,
        tipoProductor: cab.tipoProductor,
        sistemaProductivo: null,
        numAnimales: cab.numAnimales ? Number(cab.numAnimales) : null,
        tamanoMuestra: cab.tamanoMuestra ? Number(cab.tamanoMuestra) : null,
        tieneRspp: cab.tieneRspp,
        tieneAsi: cab.tieneAsi,
        observaciones: cab.observaciones || null,
        detalle: catalogo.map((ind) => ({
          idIndicador: ind.idIndicador,
          puntaje: valores[ind.idIndicador].puntaje,
          aplica: valores[ind.idIndicador].aplica,
          soporteDoc: valores[ind.idIndicador].soporteDoc || null,
        })),
      };
      await bienestarAPI.create(payload);
      await cargarLista();
      setVista('lista');
    } catch (e) { setError(e.message || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const verDetalle = async (id) => {
    setCargando(true);
    try {
      const d = await bienestarAPI.getById(id);
      setDetalle(d);
      setVista('detalle');
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta evaluación de bienestar?')) return;
    try { await bienestarAPI.delete(id); await cargarLista(); }
    catch (e) { alert(e.message); }
  };

  // ---------------- LISTA ----------------
  if (vista === 'lista') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl"><Heart className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bienestar Animal</h1>
              <p className="text-sm text-gray-500">Metodología MEBA (ICA) — evaluación del hato caprino</p>
            </div>
          </div>
          <button onClick={iniciarNueva} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva evaluación
          </button>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : evaluaciones.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aún no hay evaluaciones de bienestar registradas.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {evaluaciones.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CLASIF[e.clasificacion] || ''}`}>{e.clasificacion}</span>
                    <span className="text-lg font-bold text-gray-800">{e.puntTotal}%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{e.fechaEvaluacion?.slice(0, 10)} · {e.tipoProductor} · {e.numAnimales || '—'} animales</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => verDetalle(e.id)} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Eye className="w-4 h-4" /></button>
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
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${COLOR_CLASIF[detalle.clasificacion] || ''}`}>{detalle.clasificacion}</span>
              <p className="text-3xl font-bold text-gray-800 mt-2">{detalle.puntTotal}%</p>
              <p className="text-sm text-gray-500">{detalle.fechaEvaluacion?.slice(0, 10)} · {detalle.tipoProductor}</p>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p>Recursos: <b>{detalle.puntRecursos ?? '—'}</b></p>
              <p>Animal: <b>{detalle.puntAnimal ?? '—'}</b></p>
              <p>Gestión: <b>{detalle.puntGestion ?? '—'}</b></p>
            </div>
          </div>
        </div>
        {GRUPOS.map((g) => {
          const items = (detalle.detalle || []).filter((d) => d.tipoMedida === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
              <h3 className="font-semibold text-gray-700 mb-2">{g.titulo}</h3>
              <div className="divide-y divide-gray-50">
                {items.map((d) => (
                  <div key={d.idDetalle} className="flex items-center justify-between py-2 text-sm">
                    <span className={d.aplica ? 'text-gray-700' : 'text-gray-400 line-through'}>{d.nombre}</span>
                    <span className="font-semibold text-gray-800">{d.aplica ? `${d.puntaje}` : 'N/A'}</span>
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
    <div className="p-6 max-w-6xl mx-auto pb-32">
      <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Cancelar</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Nueva evaluación de bienestar</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

      {/* Datos del predio */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Tipo de productor</label>
          <select className={inp} value={cab.tipoProductor} onChange={(e) => onTipoProductor(e.target.value)}>
            <option value="FAMILIAR">Familiar</option>
            <option value="EXTENSIVO">Extensivo (semi-estabulado)</option>
            <option value="SEMI_INTENSIVO">Semi-intensivo</option>
            <option value="INTENSIVO">Intensivo</option>
          </select>
        </div>
        <div>
          <label className={lbl}>N° animales</label>
          <input type="number" className={inp} value={cab.numAnimales} onChange={(e) => setCab({ ...cab, numAnimales: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Tamaño muestra</label>
          <input type="number" className={inp} value={cab.tamanoMuestra} onChange={(e) => setCab({ ...cab, tamanoMuestra: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
          <input type="checkbox" checked={cab.tieneRspp} onChange={(e) => setCab({ ...cab, tieneRspp: e.target.checked })} />
          Cuenta con RSPP (Registro Sanitario de Predio Pecuario)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
          <input type="checkbox" checked={cab.tieneAsi} onChange={(e) => setCab({ ...cab, tieneAsi: e.target.checked })} />
          Cuenta con ASI (Autorización Sanitaria y de Inocuidad)
        </label>
      </div>

      {/* Indicadores por grupo */}
      {GRUPOS.map((g) => {
        const Icono = g.icono;
        const items = catalogo.filter((c) => c.tipoMedida === g.key);
        return (
          <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-3"><Icono className="w-4 h-4" /> {g.titulo}</h3>
            <div className="space-y-2">
              {items.map((ind) => {
                const v = valores[ind.idIndicador];
                if (!v) return null;
                return (
                  <div key={ind.idIndicador} className={`rounded-lg border p-3 ${v.aplica ? 'border-gray-100' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-medium text-gray-700">{ind.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {ind.esDocumental && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">Documental</span>}
                          {ind.soloConfinamiento && <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">Solo confinamiento</span>}
                          {ind.fuenteModulo && <span className="text-[10px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{ind.fuenteModulo}</span>}
                          {v.info && <span className="text-[10px] text-gray-400">{v.info}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {PUNTAJES.map((p) => (
                          <button key={p} disabled={!v.aplica} onClick={() => setPuntaje(ind.idIndicador, p)}
                            className={`w-10 h-9 rounded-lg text-xs font-semibold border transition ${v.puntaje === p && v.aplica ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'} ${!v.aplica ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            {p}
                          </button>
                        ))}
                        <button onClick={() => toggleAplica(ind.idIndicador)} title="No aplica"
                          className={`ml-1 px-2 h-9 rounded-lg text-xs border ${!v.aplica ? 'bg-gray-200 text-gray-600 border-gray-300' : 'bg-white text-gray-400 border-gray-200'}`}>
                          N/A
                        </button>
                      </div>
                    </div>
                    {ind.esDocumental && v.aplica && (
                      <input className={`${inp} mt-2`} placeholder="Soporte / referencia del documento (opcional)"
                        value={v.soporteDoc} onChange={(e) => setSoporte(ind.idIndicador, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Observaciones */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <label className={lbl}>Observaciones</label>
        <textarea className={inp} rows={2} value={cab.observaciones} onChange={(e) => setCab({ ...cab, observaciones: e.target.value })} />
      </div>

      {/* Barra de resultado fija */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-400">Resultado</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{resultado.total}%</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CLASIF[resultado.clasificacion]}`}>{resultado.clasificacion}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              R {resultado.prom.RECURSOS ?? '—'} · A {resultado.prom.ANIMAL ?? '—'} · G {resultado.prom.GESTION ?? '—'}
            </div>
            {resultado.total >= 90 && !(cab.tieneRspp && cab.tieneAsi) && (
              <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Falta RSPP/ASI para "Excelente"</span>
            )}
            {resultado.pendientes.length > 0 && (
              <span className="text-xs text-gray-400 hidden md:flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {resultado.pendientes.length} indicador(es) por debajo de 100</span>
            )}
            {resultado.pendientes.length === 0 && (
              <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Todos los indicadores en 100</span>
            )}
          </div>
          <button onClick={guardar} disabled={guardando} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando…' : 'Guardar evaluación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuloBienestar;
