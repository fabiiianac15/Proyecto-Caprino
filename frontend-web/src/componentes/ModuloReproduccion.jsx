import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Plus, Search, Baby, Stethoscope,
  X, ChevronDown, AlertCircle, CheckCircle, Clock,
  RefreshCw
} from 'lucide-react';
import { reproduccionAPI, animalesAPI } from '../servicios/caprino-api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

// ── Constantes alineadas con CHECK constraints de Oracle ──────────────────────
const TIPO_SERVICIO_OPTS = [
  { value: 'monta_natural',         label: 'Monta Natural' },
  { value: 'inseminacion_artificial', label: 'Inseminación Artificial' },
  { value: 'transferencia_embrion',  label: 'Transferencia de Embrión' },
];
const RESULTADO_OPTS = [
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'exitoso',    label: 'Exitoso (Gestante)' },
  { value: 'aborto',     label: 'Aborto' },
  { value: 'mortinato',  label: 'Mortinato' },
];
const TIPO_PARTO_OPTS = [
  { value: 'simple',   label: 'Simple (1 cría)' },
  { value: 'doble',    label: 'Doble (2 crías)' },
  { value: 'triple',   label: 'Triple (3 crías)' },
  { value: 'multiple', label: 'Múltiple (4-5 crías)' },
];
const DIFICULTAD_OPTS = [
  { value: 'normal',    label: 'Normal' },
  { value: 'asistido',  label: 'Asistido' },
  { value: 'distocico', label: 'Distócico' },
  { value: 'cesarea',   label: 'Cesárea' },
];

// ── Helpers de presentación ───────────────────────────────────────────────────
const RESULTADO_STYLE = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  exitoso:   'bg-green-100  text-green-800  border-green-200',
  aborto:    'bg-red-100    text-red-800    border-red-200',
  mortinato: 'bg-orange-100 text-orange-800 border-orange-200',
};
const SERVICIO_STYLE = {
  monta_natural:          'bg-pink-100   text-pink-800',
  inseminacion_artificial:'bg-purple-100 text-purple-800',
  transferencia_embrion:  'bg-indigo-100 text-indigo-800',
};

const fmtDate = (v) => {
  if (!v) return '—';
  const s = typeof v === 'string' ? v : String(v);
  const d = new Date(s);
  if (!isNaN(d)) return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  return s.split(' ')[0];
};

const diasHasta = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
};

const labelOpt = (opts, val) => opts.find(o => o.value === val)?.label ?? val ?? '—';

// ── Componente principal ──────────────────────────────────────────────────────
export default function ModuloReproduccion() {
  const [vista, setVista]         = useState('lista'); // 'lista'|'monta'|'diagnostico'|'parto'
  const [registros, setRegistros] = useState([]);
  const [hembras, setHembras]     = useState([]);
  const [machos, setMachos]       = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);
  const [busqueda, setBusqueda]   = useState('');
  const [filtroRes, setFiltroRes] = useState('');
  const [editando, setEditando]   = useState(null); // registro para editar

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [repRes, hemRes, macRes] = await Promise.all([
        fetch(`${API_BASE}/reproduccion`, { headers: hdrs() }),
        fetch(`${API_BASE}/animales?sexo=hembra`, { headers: hdrs() }),
        fetch(`${API_BASE}/animales?sexo=macho`,  { headers: hdrs() }),
      ]);
      if (!repRes.ok) throw new Error('Error al cargar registros reproductivos');
      const repData = await repRes.json();
      setRegistros(repData.data || []);
      if (hemRes.ok) { const d = await hemRes.json(); setHembras(d.data || []); }
      if (macRes.ok) { const d = await macRes.json(); setMachos(d.data  || []); }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const volver = (recargar = false) => {
    setVista('lista');
    setEditando(null);
    if (recargar) cargar();
  };

  // Filtros aplicados
  const registrosFiltrados = registros.filter(r => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = !texto ||
      (r.codigoHembra || '').toLowerCase().includes(texto) ||
      (r.nombreHembra || '').toLowerCase().includes(texto) ||
      (r.codigoMacho  || '').toLowerCase().includes(texto) ||
      (r.nombreMacho  || '').toLowerCase().includes(texto);
    const coincideRes = !filtroRes || r.resultado === filtroRes;
    return coincideTexto && coincideRes;
  });

  // Estadísticas rápidas
  const stats = {
    total:     registros.length,
    pendiente: registros.filter(r => r.resultado === 'pendiente').length,
    exitoso:   registros.filter(r => r.resultado === 'exitoso').length,
    parto:     registros.filter(r => r.fechaPartoReal).length,
  };

  if (vista === 'monta')       return <FormMonta      hembras={hembras} machos={machos}  onGuardar={() => volver(true)} onCancelar={() => volver()} editando={editando} />;
  if (vista === 'diagnostico') return <FormDiagnostico pendientes={registros.filter(r => r.resultado === 'pendiente')} onGuardar={() => volver(true)} onCancelar={() => volver()} editando={editando} />;
  if (vista === 'parto')       return <FormParto       gestantes={registros.filter(r => r.resultado === 'exitoso' && !r.fechaPartoReal)}  onGuardar={() => volver(true)} onCancelar={() => volver()} editando={editando} />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* ── Encabezado ── */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg"><Heart className="w-6 h-6 text-pink-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reproducción y Montas</h1>
              <p className="text-sm text-gray-500">Control del ciclo reproductivo del rebaño</p>
            </div>
          </div>
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total registros', value: stats.total,     color: 'text-gray-800',   bg: 'bg-gray-50' },
            { label: 'Pendientes',      value: stats.pendiente, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Gestantes',       value: stats.exitoso,   color: 'text-green-700',  bg: 'bg-green-50' },
            { label: 'Partos',          value: stats.parto,     color: 'text-blue-700',   bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Botones de acción ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button onClick={() => setVista('monta')}
          className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Registrar Monta
        </button>
        <button onClick={() => setVista('diagnostico')}
          disabled={stats.pendiente === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <Stethoscope className="w-4 h-4" /> Registrar Diagnóstico
          {stats.pendiente > 0 && <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.pendiente}</span>}
        </button>
        <button onClick={() => setVista('parto')}
          disabled={stats.exitoso === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <Baby className="w-4 h-4" /> Registrar Parto
          {stats.exitoso > 0 && <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.exitoso}</span>}
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por hembra o macho..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
        </div>
        <select value={filtroRes} onChange={e => setFiltroRes(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
          <option value="">Todos los estados</option>
          {RESULTADO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Lista ── */}
      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600 mr-3" />
          <span className="text-gray-500">Cargando...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Heart className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No hay registros reproductivos</p>
          <button onClick={() => setVista('monta')}
            className="mt-4 px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium">
            Registrar primera monta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {registrosFiltrados.map(r => <TarjetaReproduccion key={r.id} r={r}
            onEditarDiagnostico={() => { setEditando(r); setVista('diagnostico'); }}
            onEditarParto={() => { setEditando(r); setVista('parto'); }}
          />)}
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de un registro ────────────────────────────────────────────────────
function TarjetaReproduccion({ r, onEditarDiagnostico, onEditarParto }) {
  const [expandido, setExpandido] = useState(false);
  const dias = r.fechaPartoEstimada ? diasHasta(r.fechaPartoEstimada) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between ${
        r.resultado === 'exitoso'   ? 'bg-green-50  border-b border-green-100' :
        r.resultado === 'pendiente' ? 'bg-yellow-50 border-b border-yellow-100' :
        r.resultado === 'aborto'    ? 'bg-red-50    border-b border-red-100' :
                                      'bg-orange-50 border-b border-orange-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${RESULTADO_STYLE[r.resultado] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {labelOpt(RESULTADO_OPTS, r.resultado)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SERVICIO_STYLE[r.tipoServicio] || 'bg-gray-100 text-gray-700'}`}>
            {labelOpt(TIPO_SERVICIO_OPTS, r.tipoServicio)}
          </span>
        </div>
        <span className="text-xs text-gray-500">#{r.id}</span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
          <div>
            <p className="text-xs text-gray-400">Hembra</p>
            <p className="font-semibold text-gray-800">{r.codigoHembra} {r.nombreHembra ? `· ${r.nombreHembra}` : ''}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Macho / Servicio</p>
            <p className="font-semibold text-gray-800">
              {r.codigoMacho ? `${r.codigoMacho}${r.nombreMacho ? ` · ${r.nombreMacho}` : ''}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha servicio</p>
            <p className="text-gray-700">{fmtDate(r.fechaServicio)}</p>
          </div>
          {r.fechaPartoEstimada && (
            <div>
              <p className="text-xs text-gray-400">Parto estimado</p>
              <p className={`font-medium ${dias !== null && dias <= 15 ? 'text-orange-600' : 'text-gray-700'}`}>
                {fmtDate(r.fechaPartoEstimada)}
                {dias !== null && <span className="text-xs ml-1 text-gray-400">({dias > 0 ? `${dias}d` : 'hoy/pasado'})</span>}
              </p>
            </div>
          )}
          {r.fechaPartoReal && (
            <div>
              <p className="text-xs text-gray-400">Parto real</p>
              <p className="text-gray-700">{fmtDate(r.fechaPartoReal)}</p>
            </div>
          )}
          {r.numeroCrias && (
            <div>
              <p className="text-xs text-gray-400">Crías</p>
              <p className="text-gray-700 font-semibold">{r.numeroCrias} · {labelOpt(TIPO_PARTO_OPTS, r.tipoParto)}</p>
            </div>
          )}
        </div>

        {r.dificultadParto && (
          <p className="text-xs text-gray-500 mb-3">Dificultad parto: <span className="font-medium">{labelOpt(DIFICULTAD_OPTS, r.dificultadParto)}</span></p>
        )}

        {r.observaciones && expandido && (
          <div className="mb-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
            {r.observaciones}
          </div>
        )}

        {r.observaciones && (
          <button onClick={() => setExpandido(e => !e)} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mb-3">
            <ChevronDown className={`w-3 h-3 transition-transform ${expandido ? 'rotate-180' : ''}`} />
            {expandido ? 'Ocultar' : 'Ver observaciones'}
          </button>
        )}

        {/* Acciones según estado */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {r.resultado === 'pendiente' && (
            <button onClick={onEditarDiagnostico}
              className="flex-1 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" /> Registrar diagnóstico
            </button>
          )}
          {r.resultado === 'exitoso' && !r.fechaPartoReal && (
            <button onClick={onEditarParto}
              className="flex-1 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1">
              <Baby className="w-3.5 h-3.5" /> Registrar parto
            </button>
          )}
          {r.fechaPartoReal && (
            <span className="flex-1 py-1.5 text-xs font-medium bg-gray-50 text-gray-500 rounded-lg flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Ciclo completado
            </span>
          )}
          {(r.resultado === 'aborto' || r.resultado === 'mortinato') && (
            <span className="flex-1 py-1.5 text-xs font-medium bg-red-50 text-red-500 rounded-lg flex items-center justify-center gap-1">
              <X className="w-3.5 h-3.5" /> {labelOpt(RESULTADO_OPTS, r.resultado)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Formulario: Registrar Monta ───────────────────────────────────────────────
function FormMonta({ hembras, machos, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    idHembra: '', idMacho: '', tipoServicio: 'monta_natural',
    fechaServicio: new Date().toISOString().split('T')[0], observaciones: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.idHembra) { setError('Selecciona la hembra.'); return; }
    if (form.tipoServicio === 'monta_natural' && !form.idMacho) { setError('Selecciona el macho para monta natural.'); return; }
    setGuardando(true);
    setError(null);
    try {
      await reproduccionAPI.create({
        idHembra:      parseInt(form.idHembra),
        idMacho:       form.idMacho ? parseInt(form.idMacho) : null,
        tipoServicio:  form.tipoServicio,
        fechaServicio: form.fechaServicio,
        observaciones: form.observaciones || null,
      });
      onGuardar();
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  return (
    <FormWrapper titulo="Registrar Monta / Servicio" color="pink" icono={<Heart className="w-5 h-5" />} onCancelar={onCancelar}>
      <form onSubmit={guardar} className="space-y-5">
        {error && <Alerta mensaje={error} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Campo label="Hembra" requerido>
            <SelectAnimal opciones={hembras} valor={form.idHembra} onChange={v => set('idHembra', v)} placeholder="Seleccionar hembra..." />
          </Campo>

          <Campo label={`Macho ${form.tipoServicio === 'monta_natural' ? '' : '(opcional)'}`} requerido={form.tipoServicio === 'monta_natural'}>
            <SelectAnimal opciones={machos} valor={form.idMacho} onChange={v => set('idMacho', v)} placeholder="Seleccionar macho..." />
            {form.tipoServicio !== 'monta_natural' && <p className="text-xs text-gray-400 mt-1">No aplica para {labelOpt(TIPO_SERVICIO_OPTS, form.tipoServicio)}</p>}
          </Campo>

          <Campo label="Tipo de servicio" requerido>
            <select value={form.tipoServicio} onChange={e => set('tipoServicio', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
              {TIPO_SERVICIO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Campo>

          <Campo label="Fecha de servicio" requerido>
            <input type="date" value={form.fechaServicio} onChange={e => set('fechaServicio', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </Campo>
        </div>

        <Campo label="Observaciones">
          <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
            rows={3} placeholder="Notas sobre el servicio..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
        </Campo>

        <BotonesForm guardando={guardando} onCancelar={onCancelar} colorBtn="bg-pink-600 hover:bg-pink-700" />
      </form>
    </FormWrapper>
  );
}

// ── Formulario: Registrar Diagnóstico ─────────────────────────────────────────
function FormDiagnostico({ pendientes, onGuardar, onCancelar, editando }) {
  const inicial = editando?.id ?? '';
  const [idReg, setIdReg]         = useState(String(inicial));
  const [resultado, setResultado] = useState('exitoso');
  const [fechaEst, setFechaEst]   = useState('');
  const [obs, setObs]             = useState(editando?.observaciones ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState(null);

  // Auto-calcular fecha parto estimada cuando cambia el registro seleccionado o el resultado
  useEffect(() => {
    if (resultado !== 'exitoso') { setFechaEst(''); return; }
    const reg = pendientes.find(r => String(r.id) === String(idReg));
    if (!reg?.fechaServicio) return;
    const d = new Date(reg.fechaServicio);
    if (isNaN(d)) return;
    d.setDate(d.getDate() + 150);
    setFechaEst(d.toISOString().split('T')[0]);
  }, [idReg, resultado, pendientes]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!idReg) { setError('Selecciona el registro de monta.'); return; }
    setGuardando(true);
    setError(null);
    try {
      await reproduccionAPI.update(idReg, {
        resultado,
        fechaPartoEstimada: resultado === 'exitoso' ? fechaEst || null : null,
        observaciones: obs || null,
      });
      onGuardar();
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  const regSeleccionado = pendientes.find(r => String(r.id) === String(idReg));

  return (
    <FormWrapper titulo="Registrar Diagnóstico de Gestación" color="blue" icono={<Stethoscope className="w-5 h-5" />} onCancelar={onCancelar}>
      {pendientes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay montas pendientes de diagnóstico.</p>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-5">
          {error && <Alerta mensaje={error} />}

          <Campo label="Monta a diagnosticar" requerido>
            <select value={idReg} onChange={e => setIdReg(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">— Seleccionar monta pendiente —</option>
              {pendientes.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.id} · {r.codigoHembra}{r.nombreHembra ? ` (${r.nombreHembra})` : ''} — {fmtDate(r.fechaServicio)}
                </option>
              ))}
            </select>
          </Campo>

          {regSeleccionado && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 border border-blue-100">
              <p><span className="font-medium">Hembra:</span> {regSeleccionado.codigoHembra} {regSeleccionado.nombreHembra && `· ${regSeleccionado.nombreHembra}`}</p>
              {regSeleccionado.codigoMacho && <p><span className="font-medium">Macho:</span> {regSeleccionado.codigoMacho} {regSeleccionado.nombreMacho && `· ${regSeleccionado.nombreMacho}`}</p>}
              <p><span className="font-medium">Servicio:</span> {labelOpt(TIPO_SERVICIO_OPTS, regSeleccionado.tipoServicio)} — {fmtDate(regSeleccionado.fechaServicio)}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo label="Resultado del diagnóstico" requerido>
              <div className="space-y-2">
                {[
                  { value: 'exitoso',   label: 'Gestante (preñada)',        color: 'border-green-400  bg-green-50  text-green-800' },
                  { value: 'pendiente', label: 'Dudoso (repetir en 7-15d)', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
                  { value: 'aborto',    label: 'Vacía / No gestante',       color: 'border-red-400    bg-red-50    text-red-800' },
                ].map(op => (
                  <label key={op.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${resultado === op.value ? op.color + ' border-opacity-100' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="resultado" value={op.value} checked={resultado === op.value} onChange={() => setResultado(op.value)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${resultado === op.value ? 'border-current' : 'border-gray-300'}`}>
                      {resultado === op.value && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className="text-sm font-medium">{op.label}</span>
                  </label>
                ))}
              </div>
            </Campo>

            {resultado === 'exitoso' && (
              <Campo label="Fecha estimada de parto" requerido>
                <input type="date" value={fechaEst} onChange={e => setFechaEst(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p className="text-xs text-gray-400 mt-1">Auto-calculada: fecha servicio + 150 días (gestación caprina)</p>
              </Campo>
            )}
          </div>

          <Campo label="Observaciones del diagnóstico">
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Método utilizado, notas del veterinario..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </Campo>

          <BotonesForm guardando={guardando} onCancelar={onCancelar} colorBtn="bg-blue-600 hover:bg-blue-700" />
        </form>
      )}
    </FormWrapper>
  );
}

// ── Formulario: Registrar Parto ───────────────────────────────────────────────
function FormParto({ gestantes, onGuardar, onCancelar, editando }) {
  const inicial = editando?.id ?? '';
  const [idReg, setIdReg]           = useState(String(inicial));
  const [fechaReal, setFechaReal]   = useState(new Date().toISOString().split('T')[0]);
  const [tipoParto, setTipoParto]   = useState('simple');
  const [numCrias, setNumCrias]     = useState(1);
  const [dificultad, setDificultad] = useState('normal');
  const [resultado, setResultado]   = useState('exitoso');
  const [obs, setObs]               = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState(null);

  // Sincronizar tipo_parto con numero_crias
  useEffect(() => {
    const map = { simple: 1, doble: 2, triple: 3, multiple: 4 };
    setNumCrias(map[tipoParto] ?? 1);
  }, [tipoParto]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!idReg) { setError('Selecciona la hembra gestante.'); return; }
    setGuardando(true);
    setError(null);
    try {
      await reproduccionAPI.update(idReg, {
        fechaPartoReal: fechaReal,
        tipoParto,
        numeroCrias:    parseInt(numCrias),
        dificultadParto: dificultad,
        resultado,
        observaciones:  obs || null,
      });
      onGuardar();
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  const regSel = gestantes.find(r => String(r.id) === String(idReg));

  return (
    <FormWrapper titulo="Registrar Parto" color="green" icono={<Baby className="w-5 h-5" />} onCancelar={onCancelar}>
      {gestantes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Baby className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay hembras gestantes pendientes de parto.</p>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-5">
          {error && <Alerta mensaje={error} />}

          <Campo label="Hembra gestante" requerido>
            <select value={idReg} onChange={e => setIdReg(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="">— Seleccionar hembra gestante —</option>
              {gestantes.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.id} · {r.codigoHembra}{r.nombreHembra ? ` (${r.nombreHembra})` : ''}
                  {r.fechaPartoEstimada ? ` — Estimado: ${fmtDate(r.fechaPartoEstimada)}` : ''}
                </option>
              ))}
            </select>
          </Campo>

          {regSel && (
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800 border border-green-100">
              <p><span className="font-medium">Hembra:</span> {regSel.codigoHembra} {regSel.nombreHembra && `· ${regSel.nombreHembra}`}</p>
              <p><span className="font-medium">Servicio:</span> {fmtDate(regSel.fechaServicio)} · {labelOpt(TIPO_SERVICIO_OPTS, regSel.tipoServicio)}</p>
              {regSel.fechaPartoEstimada && (
                <p><span className="font-medium">Parto estimado:</span> {fmtDate(regSel.fechaPartoEstimada)}
                  {diasHasta(regSel.fechaPartoEstimada) !== null && <span className="ml-1 text-green-600">({diasHasta(regSel.fechaPartoEstimada)}d)</span>}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo label="Fecha real del parto" requerido>
              <input type="date" value={fechaReal} onChange={e => setFechaReal(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </Campo>

            <Campo label="Resultado del parto" requerido>
              <select value={resultado} onChange={e => setResultado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="exitoso">Exitoso</option>
                <option value="aborto">Aborto</option>
                <option value="mortinato">Mortinato</option>
              </select>
            </Campo>

            <Campo label="Tipo de parto (nro crías)" requerido>
              <select value={tipoParto} onChange={e => setTipoParto(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {TIPO_PARTO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Campo>

            <Campo label="Número de crías" requerido>
              <input type="number" value={numCrias} onChange={e => setNumCrias(e.target.value)}
                min={1} max={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              <p className="text-xs text-gray-400 mt-1">Máximo 5 por parto</p>
            </Campo>

            <Campo label="Dificultad del parto">
              <div className="grid grid-cols-2 gap-2">
                {DIFICULTAD_OPTS.map(op => (
                  <label key={op.value} className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer text-sm transition-all ${dificultad === op.value ? 'border-green-400 bg-green-50 text-green-800' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="dificultad" value={op.value} checked={dificultad === op.value} onChange={() => setDificultad(op.value)} className="sr-only" />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${dificultad === op.value ? 'border-green-500' : 'border-gray-300'}`}>
                      {dificultad === op.value && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </div>
                    {op.label}
                  </label>
                ))}
              </div>
            </Campo>
          </div>

          <Campo label="Observaciones del parto">
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              placeholder="Complicaciones, medicamentos usados, condición de las crías..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </Campo>

          <BotonesForm guardando={guardando} onCancelar={onCancelar} colorBtn="bg-green-600 hover:bg-green-700" />
        </form>
      )}
    </FormWrapper>
  );
}

// ── Sub-componentes reutilizables ─────────────────────────────────────────────
function FormWrapper({ titulo, color, icono, onCancelar, children }) {
  const colores = { pink: 'text-pink-600 bg-pink-100', blue: 'text-blue-600 bg-blue-100', green: 'text-green-600 bg-green-100' };
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colores[color]}`}>{icono}</div>
            <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
          </div>
          <button onClick={onCancelar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Campo({ label, requerido, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {requerido && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectAnimal({ opciones, valor, onChange, placeholder }) {
  return (
    <select value={valor} onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-current">
      <option value="">{placeholder}</option>
      {opciones.map(a => (
        <option key={a.id} value={a.id}>
          {a.codigo} {a.nombre ? `· ${a.nombre}` : ''} ({a.nombreRaza || 'sin raza'})
        </option>
      ))}
    </select>
  );
}

function Alerta({ mensaje }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      {mensaje}
    </div>
  );
}

function BotonesForm({ guardando, onCancelar, colorBtn }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancelar}
        className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
        Cancelar
      </button>
      <button type="submit" disabled={guardando}
        className={`flex-1 py-2.5 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${colorBtn}`}>
        {guardando ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</> : 'Guardar'}
      </button>
    </div>
  );
}
