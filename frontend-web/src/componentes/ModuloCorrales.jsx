import React, { useState, useEffect } from 'react';
import {
  Mountain, Plus, X, Edit, Trash2, Users, AlertCircle, RefreshCw,
  CheckCircle2, Save, Layers
} from 'lucide-react';
import { corralesAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const TIPOS = [
  { value: 'general',   label: 'General' },
  { value: 'gestante',  label: 'Gestantes' },
  { value: 'ordeno',    label: 'Ordeño' },
  { value: 'lactancia', label: 'Lactancia' },
  { value: 'levante',   label: 'Levante' },
  { value: 'machos',    label: 'Machos' },
];
const tipoLabel = (t) => (TIPOS.find(x => x.value === t)?.label) || t;

const tipoBadge = (t) => ({
  general:   'bg-gray-100 text-gray-700',
  gestante:  'bg-pink-100 text-pink-700',
  ordeno:    'bg-cyan-100 text-cyan-700',
  lactancia: 'bg-amber-100 text-amber-700',
  levante:   'bg-blue-100 text-blue-700',
  machos:    'bg-indigo-100 text-indigo-700',
}[t] || 'bg-gray-100 text-gray-700');

const ModuloCorrales = () => {
  const [corrales, setCorrales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ abierto: false, corral: null });
  const [confirmar, setConfirmar] = useState({ abierto: false, corral: null });
  const [aviso, setAviso] = useState('');

  const cargar = async () => {
    setCargando(true); setError(null);
    try {
      const res = await corralesAPI.getAll();
      setCorrales(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('No se pudieron cargar los corrales.');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async () => {
    try {
      await corralesAPI.delete(confirmar.corral.id);
      setConfirmar({ abierto: false, corral: null });
      cargar();
    } catch (e) {
      setAviso(e.message || 'No se pudo eliminar el corral.');
      setConfirmar({ abierto: false, corral: null });
    }
  };

  const totalCapacidad = corrales.reduce((s, c) => s + (c.capacidadMaxima || 0), 0);
  const totalOcupacion = corrales.reduce((s, c) => s + (c.ocupacion || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl shadow-lg p-7 text-white mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-tight">Corrales y Lotes</h2>
              <p className="text-teal-100 text-sm">Distribución del rebaño por corral, tipo y capacidad</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 bg-white/15 rounded-xl hover:bg-white/25 transition-colors" title="Actualizar">
              <RefreshCw className={`w-4 h-4 text-white ${cargando ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setModal({ abierto: true, corral: null })}
              className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-50 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Nuevo corral
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            { icon: <Layers className="w-4 h-4" />, val: corrales.length, label: 'Corrales' },
            { icon: <Users className="w-4 h-4" />,  val: totalOcupacion, label: 'Animales ubicados' },
            { icon: <Mountain className="w-4 h-4" />, val: totalCapacidad || '—', label: 'Capacidad total' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-teal-100">{s.icon}</span>
              <div>
                <p className="text-xl font-black leading-none">{s.val}</p>
                <p className="text-[11px] text-teal-100 leading-none mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {aviso && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{aviso}</span>
          <button onClick={() => setAviso('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mr-3" /> Cargando corrales...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={cargar} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">Reintentar</button>
        </div>
      ) : corrales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-14 text-center">
          <Mountain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Sin corrales</p>
          <p className="text-gray-400 text-sm mb-5">Crea el primer corral para empezar a ubicar el rebaño.</p>
          <button onClick={() => setModal({ abierto: true, corral: null })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo corral
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corrales.map(c => {
            const pct = c.capacidadMaxima ? Math.min(100, Math.round((c.ocupacion / c.capacidadMaxima) * 100)) : 0;
            const barColor = c.lleno ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-teal-500';
            return (
              <div key={c.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${c.estado === 'inactivo' ? 'opacity-60 border-gray-200' : 'border-gray-100'}`}>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mountain className="w-4 h-4 text-teal-500 shrink-0" />
                    <p className="font-bold text-gray-800 truncate">{c.nombre}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoBadge(c.tipo)}`}>{tipoLabel(c.tipo)}</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Lote</span>
                    <span className="font-medium text-gray-700">{c.lote || '—'}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Ocupación</span>
                      <span className="font-semibold text-gray-700">
                        {c.ocupacion}{c.capacidadMaxima != null ? ` / ${c.capacidadMaxima}` : ''}
                      </span>
                    </div>
                    {c.capacidadMaxima != null && (
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  {(c.pesoMinKg != null || c.pesoMaxKg != null) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Rango de peso</span>
                      <span className="font-medium text-gray-700">{c.pesoMinKg ?? 0}–{c.pesoMaxKg ?? '∞'} kg</span>
                    </div>
                  )}
                  {c.descripcion && <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">{c.descripcion}</p>}
                </div>
                <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
                  <button onClick={() => setModal({ abierto: true, corral: c })}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => setConfirmar({ abierto: true, corral: c })}
                    className="py-2 px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal.abierto && (
        <FormCorral corral={modal.corral}
          onCerrar={() => setModal({ abierto: false, corral: null })}
          onGuardado={() => { setModal({ abierto: false, corral: null }); cargar(); }} />
      )}

      {confirmar.abierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">¿Eliminar corral?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{confirmar.corral?.nombre}</strong> se desactivará. Solo es posible si no tiene animales asignados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar({ abierto: false, corral: null })}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancelar</button>
              <button onClick={eliminar}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FormCorral = ({ corral, onCerrar, onGuardado }) => {
  const [form, setForm] = useState({
    nombre: corral?.nombre || '',
    lote: corral?.lote || '',
    tipo: corral?.tipo || 'general',
    capacidadMaxima: corral?.capacidadMaxima ?? '',
    pesoMinKg: corral?.pesoMinKg ?? '',
    pesoMaxKg: corral?.pesoMaxKg ?? '',
    descripcion: corral?.descripcion || '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setGuardando(true); setError('');
    try {
      if (corral) await corralesAPI.update(corral.id, form);
      else await corralesAPI.create(form);
      onGuardado();
    } catch (err) {
      setError(err.message || 'Error al guardar el corral.');
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-teal-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{corral ? 'Editar corral' : 'Nuevo corral'}</h3>
          <button onClick={onCerrar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={enviar} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Nombre <span className="text-red-500">*</span></label>
              <input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Ej: Corral 1" className={inp} />
            </div>
            <div>
              <label className={lbl}>Lote</label>
              <input name="lote" value={form.lote} onChange={cambiar} placeholder="Ej: Lote 1" className={inp} />
            </div>
            <div>
              <label className={lbl}>Tipo</label>
              <select name="tipo" value={form.tipo} onChange={cambiar} className={inp}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Capacidad máxima</label>
              <input type="number" name="capacidadMaxima" value={form.capacidadMaxima} onChange={cambiar} min="1" placeholder="Ej: 30" className={inp} />
            </div>
            <div>
              <label className={lbl}>Peso mínimo (kg)</label>
              <input type="number" name="pesoMinKg" value={form.pesoMinKg} onChange={cambiar} step="0.1" min="0" placeholder="Ej: 10" className={inp} />
            </div>
            <div>
              <label className={lbl}>Peso máximo (kg)</label>
              <input type="number" name="pesoMaxKg" value={form.pesoMaxKg} onChange={cambiar} step="0.1" min="0" placeholder="Ej: 80" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={cambiar} rows="2"
              placeholder="Notas sobre el corral..." className={`${inp} resize-none`} />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-5 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {guardando ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuloCorrales;
