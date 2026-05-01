import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, RefreshCw, ChevronDown, ChevronUp, User, Clock, Database, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const OPERACION_LABEL = { INSERT: 'Creación', UPDATE: 'Modificación', DELETE: 'Eliminación' };
const OPERACION_COLOR = {
  INSERT: 'bg-green-100 text-green-800 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
};
const TABLA_LABEL = {
  ANIMAL: 'Animales', PRODUCCION_LECHE: 'Producción', SALUD: 'Salud',
  REPRODUCCION: 'Reproducción', PESAJE: 'Pesaje', GENEALOGIA: 'Genealogía',
  USUARIO: 'Usuarios',
};

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export default function ModuloAuditoria() {
  const [registros, setRegistros]     = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState(null);
  const [expandido, setExpandido]     = useState(null);
  const [filtros, setFiltros]         = useState({ tabla: '', operacion: '', usuario: '', desde: '', hasta: '' });
  const [resumen, setResumen]         = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
      );
      const [logRes, resRes] = await Promise.all([
        fetch(`${API_BASE}/auditoria?${params}&limite=200`, { headers: headers() }),
        fetch(`${API_BASE}/auditoria/resumen`, { headers: headers() }),
      ]);
      if (!logRes.ok) throw new Error('Sin acceso al registro de auditoría');
      const logData = await logRes.json();
      const resData = resRes.ok ? await resRes.json() : null;
      setRegistros(logData.data || []);
      setResumen(resData?.data || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  const formatFecha = (f) => {
    if (!f) return '—';
    // Oracle timestamp: "30-APR-26 09.51.51.705724 PM"
    const d = new Date(f);
    if (!isNaN(d)) return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    return String(f).split('.')[0];
  };

  const renderDiff = (ant, nue) => {
    if (!ant && !nue) return null;
    const keys = [...new Set([...Object.keys(ant || {}), ...Object.keys(nue || {})])];
    const cambios = keys.filter(k => JSON.stringify((ant || {})[k]) !== JSON.stringify((nue || {})[k]));
    if (cambios.length === 0 && ant) {
      return (
        <div className="text-xs text-gray-500 mt-2">
          <p className="font-medium text-gray-700 mb-1">Datos eliminados:</p>
          {Object.entries(ant).map(([k, v]) => (
            <div key={k} className="flex gap-2"><span className="text-gray-500 w-32 shrink-0">{k}:</span><span className="text-red-700">{String(v ?? '—')}</span></div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-xs mt-2 space-y-1">
        {cambios.length > 0 && <p className="font-medium text-gray-700 mb-1">Cambios detectados:</p>}
        {cambios.map(k => (
          <div key={k} className="flex gap-2 items-start">
            <span className="text-gray-500 w-32 shrink-0">{k}:</span>
            {ant && <span className="line-through text-red-600">{String((ant)[k] ?? '—')}</span>}
            {ant && nue && <span className="text-gray-400">→</span>}
            {nue && <span className="text-green-700">{String((nue)[k] ?? '—')}</span>}
          </div>
        ))}
        {cambios.length === 0 && nue && (
          <>
            <p className="font-medium text-gray-700 mb-1">Datos registrados:</p>
            {Object.entries(nue).map(([k, v]) => (
              <div key={k} className="flex gap-2"><span className="text-gray-500 w-32 shrink-0">{k}:</span><span className="text-green-700">{String(v ?? '—')}</span></div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><Shield className="w-6 h-6 text-indigo-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Auditoría del Sistema</h1>
              <p className="text-sm text-gray-500">Registro completo de quién hizo qué y cuándo</p>
            </div>
          </div>
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        {/* Resumen de estadísticas */}
        {resumen && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{resumen.totalAcciones}</p>
              <p className="text-xs text-gray-500">Total acciones</p>
            </div>
            {(resumen.porOperacion || []).map(op => (
              <div key={op.OPERACION} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">{op.TOTAL}</p>
                <p className="text-xs text-gray-500">{OPERACION_LABEL[op.OPERACION] || op.OPERACION}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select value={filtros.tabla} onChange={e => setFiltros(p => ({ ...p, tabla: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none">
            <option value="">Todos los módulos</option>
            {Object.entries(TABLA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filtros.operacion} onChange={e => setFiltros(p => ({ ...p, operacion: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none">
            <option value="">Todas las acciones</option>
            <option value="INSERT">Creaciones</option>
            <option value="UPDATE">Modificaciones</option>
            <option value="DELETE">Eliminaciones</option>
          </select>
          <input value={filtros.usuario} onChange={e => setFiltros(p => ({ ...p, usuario: e.target.value }))}
            placeholder="Buscar usuario..." type="text"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
          <input value={filtros.desde} onChange={e => setFiltros(p => ({ ...p, desde: e.target.value }))}
            type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
          <input value={filtros.hasta} onChange={e => setFiltros(p => ({ ...p, hasta: e.target.value }))}
            type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
        </div>
      </div>

      {/* Lista de registros */}
      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mr-3"></div>
          <span className="text-gray-500">Cargando auditoría...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay registros de auditoría con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.map(reg => (
            <div key={reg.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(expandido === reg.id ? null : reg.id)}
              >
                {/* Operación badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${OPERACION_COLOR[reg.operacion] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {OPERACION_LABEL[reg.operacion] || reg.operacion}
                </span>

                {/* Módulo */}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">
                  <Database className="w-3 h-3 inline mr-1" />
                  {TABLA_LABEL[reg.tabla] || reg.tabla}
                  {reg.idRegistro && <span className="ml-1 font-mono">#{reg.idRegistro}</span>}
                </span>

                {/* Descripción */}
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {reg.descripcion || '—'}
                </span>

                {/* Usuario */}
                <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                  <User className="w-3 h-3" /> {reg.usuario}
                </span>

                {/* IP */}
                {reg.ip && (
                  <span className="text-xs text-gray-400 font-mono shrink-0">{reg.ip}</span>
                )}

                {/* Fecha */}
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> {formatFecha(reg.fecha)}
                </span>

                {(reg.datosAnteriores || reg.datosNuevos) && (
                  expandido === reg.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Detalle expandible */}
              {expandido === reg.id && (reg.datosAnteriores || reg.datosNuevos) && (
                <div className="px-5 pb-4 border-t border-gray-100 bg-gray-50">
                  {renderDiff(reg.datosAnteriores, reg.datosNuevos)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
