import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Edit, Trash2, Eye, Plus, Download,
  AlertCircle, User, Tag, Calendar, Weight, AlertTriangle, X, Edit2, RefreshCw
} from 'lucide-react';
import { animalesAPI, razasAPI } from '../servicios/caprino-api';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const ListaAnimales = ({ onEditar, onNuevo }) => {
  const [animales, setAnimales]   = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState(null);
  const [razas, setRazas]         = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [modalEliminar, setModalEliminar] = useState({ mostrar: false, animal: null });
  const [modalDetalles, setModalDetalles] = useState({ mostrar: false, animal: null });

  const [filtros, setFiltros] = useState({ busqueda: '', sexo: '', raza: '', estado: 'activo' });

  useEffect(() => {
    razasAPI.getAll().then(d => setRazas(d)).catch(() => setRazas([]));
  }, []);

  useEffect(() => { cargarAnimales(); }, [filtros]);

  const cargarAnimales = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await animalesAPI.search({ sexo: filtros.sexo, idRaza: filtros.raza, estadoGeneral: filtros.estado, busqueda: filtros.busqueda });
      setAnimales(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('No se pudo cargar la lista. Verifica la conexión.');
      setAnimales([]);
    } finally {
      setCargando(false);
    }
  };

  const cambioFiltro = (e) => { const { name, value } = e.target; setFiltros(p => ({ ...p, [name]: value })); };
  const limpiarFiltros = () => setFiltros({ busqueda: '', sexo: '', raza: '', estado: 'activo' });

  const calcularEdad = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const meses = Math.max(0, (new Date().getFullYear() - new Date(fecha).getFullYear()) * 12 + (new Date().getMonth() - new Date(fecha).getMonth()));
    const años  = Math.floor(meses / 12);
    const m     = meses % 12;
    if (años === 0) return `${meses}m`;
    return m > 0 ? `${años}a ${m}m` : `${años} año${años > 1 ? 's' : ''}`;
  };

  const exportarCSV = () => {
    const csv = [
      ['Identificación', 'Nombre', 'Sexo', 'Raza', 'Estado'].join(','),
      ...animales.map(a => [`"${a.codigo}"`, `"${a.nombre || ''}"`, `"${a.sexo}"`, `"${a.nombreRaza || ''}"`, `"${a.estado}"`].join(','))
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `animales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const eliminarAnimal = async () => {
    try {
      await animalesAPI.delete(modalEliminar.animal.id);
      setModalEliminar({ mostrar: false, animal: null });
      cargarAnimales();
    } catch {
      alert('Error al dar de baja el animal.');
      setModalEliminar({ mostrar: false, animal: null });
    }
  };

  const hembrasMachos = { hembra: animales.filter(a => a.sexo === 'hembra').length, macho: animales.filter(a => a.sexo === 'macho').length };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ── Encabezado ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventario de Animales</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm text-gray-500">{animales.length} {animales.length === 1 ? 'animal' : 'animales'}</span>
              {animales.length > 0 && <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-xs text-pink-600 font-medium">{hembrasMachos.hembra} hembras</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-xs text-blue-600 font-medium">{hembrasMachos.macho} machos</span>
              </>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={cargarAnimales} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Recargar">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setMostrarFiltros(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${mostrarFiltros ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" /> Filtros
            </button>
            <button onClick={exportarCSV} disabled={animales.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={onNuevo}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Nuevo animal
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" name="busqueda" value={filtros.busqueda} onChange={cambioFiltro}
            placeholder="Buscar por código o nombre..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-gray-50" />
        </div>

        {/* Filtros avanzados */}
        {mostrarFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Sexo</label>
              <select name="sexo" value={filtros.sexo} onChange={cambioFiltro}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="">Todos</option>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Estado</label>
              <select name="estado" value={filtros.estado} onChange={cambioFiltro}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="vendido">Vendido</option>
                <option value="muerto">Baja</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={limpiarFiltros}
                className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mr-3" />
          <span className="text-gray-500">Cargando animales...</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={cargarAnimales} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Reintentar</button>
        </div>
      ) : animales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-14 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">Sin resultados</p>
          <p className="text-gray-400 text-sm mb-5">No hay animales con los filtros actuales.</p>
          <button onClick={onNuevo}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar primer animal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animales.map(animal => <TarjetaAnimal key={animal.id} animal={animal} calcularEdad={calcularEdad}
            onEditar={() => onEditar(animal)}
            onVer={() => setModalDetalles({ mostrar: true, animal })}
            onEliminar={() => setModalEliminar({ mostrar: true, animal })} />)}
        </div>
      )}

      {/* ── Modal: Confirmar baja ── */}
      {modalEliminar.mostrar && (
        <Modal onCerrar={() => setModalEliminar({ mostrar: false, animal: null })}>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Dar de baja?</h3>
            <p className="text-gray-500 text-sm mb-1">
              <span className="font-semibold text-gray-700">{modalEliminar.animal?.nombre || modalEliminar.animal?.codigo}</span> quedará en estado <em>muerto</em>.
            </p>
            <p className="text-xs text-gray-400 mb-6">El registro se conserva para auditoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar({ mostrar: false, animal: null })}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancelar</button>
              <button onClick={eliminarAnimal}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Dar de baja</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Detalles ── */}
      {modalDetalles.mostrar && modalDetalles.animal && (
        <Modal onCerrar={() => setModalDetalles({ mostrar: false, animal: null })} ancho="max-w-xl">
          <div>
            {/* Header modal */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{modalDetalles.animal.nombre || 'Sin nombre'}</h3>
                <p className="text-sm font-mono text-gray-500">{modalDetalles.animal.codigo}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${modalDetalles.animal.sexo === 'macho' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                  {modalDetalles.animal.sexo === 'macho' ? '♂ Macho' : '♀ Hembra'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${modalDetalles.animal.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {modalDetalles.animal.estado}
                </span>
              </div>
            </div>

            {/* Foto */}
            <div className="h-52 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden mb-5 border border-gray-100">
              {modalDetalles.animal.fotoUrl ? (
                <img src={`${BASE_URL}${modalDetalles.animal.fotoUrl}`} alt={modalDetalles.animal.nombre}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <User className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Grid de datos */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                ['Raza',           modalDetalles.animal.nombreRaza || '—'],
                ['Edad',           calcularEdad(modalDetalles.animal.fechaNacimiento)],
                ['Peso nacimiento',modalDetalles.animal.pesoNacimiento ? `${modalDetalles.animal.pesoNacimiento} kg` : '—'],
                ['Color pelaje',   modalDetalles.animal.colorPelaje || '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {modalDetalles.animal.observaciones && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-sm text-blue-800 mb-4">
                <p className="font-medium text-blue-700 mb-0.5 text-xs uppercase tracking-wide">Observaciones</p>
                {modalDetalles.animal.observaciones}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setModalDetalles({ mostrar: false, animal: null }); onEditar(modalDetalles.animal); }}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => setModalDetalles({ mostrar: false, animal: null })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Tarjeta de animal ─────────────────────────────────────────────────────────
function TarjetaAnimal({ animal, calcularEdad, onEditar, onVer, onEliminar }) {
  const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Foto */}
      <div className="h-44 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
        {animal.fotoUrl ? (
          <img src={`${BASE_URL}${animal.fotoUrl}`} alt={animal.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <User className="w-14 h-14" />
          </div>
        )}
        {/* Badges sobre la foto */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${animal.sexo === 'macho' ? 'bg-blue-100/90 text-blue-700' : 'bg-pink-100/90 text-pink-700'}`}>
            {animal.sexo === 'macho' ? '♂' : '♀'} {animal.sexo === 'macho' ? 'Macho' : 'Hembra'}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${animal.estado === 'activo' ? 'bg-green-100/90 text-green-700' : 'bg-gray-100/90 text-gray-600'}`}>
            {animal.estado}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-gray-800 text-base truncate">{animal.nombre || <span className="text-gray-400 font-normal italic">Sin nombre</span>}</h3>
          <p className="text-xs font-mono text-gray-400 mt-0.5">{animal.codigo}</p>
        </div>

        <div className="space-y-1.5 mb-4">
          <InfoRow icon={<Tag className="w-3.5 h-3.5" />}    label="Raza"  value={animal.nombreRaza || '—'} />
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Edad"  value={calcularEdad(animal.fechaNacimiento)} />
          <InfoRow icon={<Weight className="w-3.5 h-3.5" />}  label="Peso"  value={animal.pesoNacimiento ? `${animal.pesoNacimiento} kg` : '—'} />
        </div>

        {/* Botones */}
        <div className="flex gap-1.5 pt-3 border-t border-gray-100">
          <button onClick={onEditar}
            className="flex-1 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1">
            <Edit className="w-3.5 h-3.5" /> Editar
          </button>
          <button onClick={onVer}
            className="flex-1 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Ver
          </button>
          <button onClick={onEliminar}
            className="py-1.5 px-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-300">{icon}</span>
      <span className="text-gray-400 text-xs">{label}:</span>
      <span className="text-gray-700 text-xs font-medium truncate">{value}</span>
    </div>
  );
}

function Modal({ children, onCerrar, ancho = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${ancho} p-6 relative max-h-[90vh] overflow-y-auto`}>
        <button onClick={onCerrar} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default ListaAnimales;
