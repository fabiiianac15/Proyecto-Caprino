import React, { useState } from 'react';
import {
  GitBranch, ChevronLeft, RefreshCw, TrendingUp, Scale, Loader2, Plus, X, Link2, Search,
} from 'lucide-react';
import { apiHelpers } from '../../servicios/api';
import ArbolHorizontal from './ArbolHorizontal';
import { IconoSexo, edadTexto } from './comun';
import { nombreValido, etiquetaAnimal } from '../../utilidades/formateo';

// Nombre del ancestro según su posición respecto al animal principal
const NOMBRE_NIVEL = { 1: ['Padre', 'Madre'], 2: ['Abuelo', 'Abuela'], 3: ['Bisabuelo', 'Bisabuela'] };
const etiqueta = (nivel, rol) => (NOMBRE_NIVEL[nivel] || ['Ancestro', 'Ancestra'])[rol === 'madre' ? 1 : 0];
const ESTILO = {
  principal: 'border-teal-400 bg-teal-50',
  padre: 'border-blue-300 bg-blue-50/70',
  madre: 'border-pink-300 bg-pink-50/70',
};
const ANCHO = ['w-56', 'w-52', 'w-44', 'w-40'];

const edadMeses = (f) => (f ? (Date.now() - new Date(f).getTime()) / (1000 * 60 * 60 * 24 * 30.44) : null);

// ── Modal para vincular un progenitor ─────────────────────────────────────────
const ModalVincular = ({ titulo, sexo, allAnimals, excluirIds, onSeleccionar, onCerrar }) => {
  const [busqueda, setBusqueda] = useState('');
  const q = busqueda.toLowerCase();
  const candidatos = allAnimals.filter((a) =>
    !excluirIds.has(String(a.id)) && a.sexo === sexo &&
    (!q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q)));
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Link2 className="w-5 h-5 text-teal-500" /> {titulo}</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Solo se muestran {sexo === 'macho' ? 'machos' : 'hembras'} (incluidos los que ya no están en la granja).</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {candidatos.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Sin animales disponibles</p>}
          {candidatos.map((a) => (
            <button key={a.id} onClick={() => onSeleccionar(a)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50 transition-all flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.sexo === 'macho' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                <IconoSexo sexo={a.sexo} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{etiquetaAnimal(a.codigo, a.nombre)}</p>
                <p className="text-xs text-gray-400">{a.nombreRaza || a.raza || 'raza sin registrar'} · {a.estado}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const VistaArbol = ({ arbol, allAnimals, cargando, onVolver, onComparar, onRankear, onActualizar, animalBase }) => {
  const [modal, setModal] = useState(null);       // { hijo, rol, ruta }
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Guarda padre/madre de `hijo` conservando el otro progenitor
  const guardar = async (hijo, cambios) => {
    setGuardando(true);
    setError(null);
    try {
      await apiHelpers.post('/genealogia', {
        idAnimal: hijo.id,
        idPadre: 'idPadre' in cambios ? cambios.idPadre : hijo.idPadre,
        idMadre: 'idMadre' in cambios ? cambios.idMadre : hijo.idMadre,
      });
      await onActualizar();
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo guardar el vínculo.');
    } finally {
      setGuardando(false);
    }
  };

  const vincular = (animal) => {
    const { hijo, rol } = modal;
    setModal(null);
    guardar(hijo, rol === 'padre' ? { idPadre: animal.id } : { idMadre: animal.id });
  };

  const renderNodo = (n, { nivel, rol, hijo }) => {
    const principal = nivel === 0;
    const compacto = nivel >= 3;
    return (
      <div className={`${ANCHO[Math.min(nivel, 3)]} border-2 ${ESTILO[principal ? 'principal' : rol]} rounded-xl shadow-sm hover:shadow-md transition-shadow ${compacto ? 'p-2' : 'p-3'} relative group`}>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${principal ? 'text-teal-700' : rol === 'padre' ? 'text-blue-700' : 'text-pink-700'}`}>
            {principal ? 'Animal' : etiqueta(nivel, rol)}
          </span>
          <IconoSexo sexo={n.sexo} className="w-3.5 h-3.5" />
        </div>
        <p className="font-bold text-sm text-gray-800 truncate mt-0.5">{n.nombre || <span className="italic font-normal text-gray-400">sin nombre</span>}</p>
        <p className="text-[11px] font-mono text-gray-500 truncate">{n.codigo}</p>
        {!compacto && (
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {[n.raza, edadTexto(edadMeses(n.fechaNacimiento)), n.estado !== 'activo' ? n.estado : null].filter(Boolean).join(' · ')}
          </p>
        )}
        {!principal && hijo && (
          <button title="Quitar este vínculo"
            onClick={() => guardar(hijo, rol === 'padre' ? { idPadre: null } : { idMadre: null })}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const renderVacio = ({ nivel, rol, hijo, ruta }) => {
    if (!hijo) return null;
    return (
      <button onClick={() => setModal({ hijo, rol, ruta })}
        className={`${ANCHO[Math.min(nivel, 3)]} border-2 border-dashed ${rol === 'padre' ? 'border-blue-200 text-blue-500 hover:bg-blue-50' : 'border-pink-200 text-pink-500 hover:bg-pink-50'}
          rounded-xl ${nivel >= 3 ? 'p-2' : 'p-3'} flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-all`}>
        <Plus className="w-4 h-4" />
        <span className="text-[11px] font-semibold">Vincular {etiqueta(nivel, rol).toLowerCase()}</span>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onVolver} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
            <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center"><GitBranch className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{animalBase?.nombre || 'Sin nombre'} <span className="text-gray-400 font-mono text-base">{animalBase?.codigo}</span></h2>
              <p className="text-sm text-gray-500">Árbol genealógico · 4 generaciones</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onActualizar} className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
            <button onClick={onRankear} className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 flex items-center gap-1.5 shadow-sm">
              <TrendingUp className="w-4 h-4" /> Buscar la mejor pareja
            </button>
            <button onClick={onComparar} className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 flex items-center gap-1.5 shadow-sm">
              <Scale className="w-4 h-4" /> Evaluar un cruce
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 px-5 py-3 flex flex-wrap gap-x-5 gap-y-2 items-center text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-blue-300 bg-blue-50" /> Línea paterna (arriba)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-pink-300 bg-pink-50" /> Línea materna (abajo)</span>
        <span className="flex items-center gap-1.5"><Plus className="w-3 h-3" /> Toque un recuadro vacío para vincular</span>
        <span className="flex items-center gap-1.5"><X className="w-3 h-3" /> Pase el cursor sobre un ancestro para quitarlo</span>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        {(guardando || error) && (
          <div className={`flex items-center gap-2 text-sm mb-4 ${error ? 'text-red-600' : 'text-teal-600'}`}>
            {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando vínculo...</> : error}
          </div>
        )}
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <p className="text-gray-500 text-sm">Construyendo árbol genealógico...</p>
          </div>
        ) : arbol ? (
          <ArbolHorizontal nodo={arbol} maxNivel={3} renderNodo={renderNodo} renderVacio={renderVacio} />
        ) : (
          <p className="text-center py-12 text-gray-400 text-sm">No se pudo cargar el árbol de este animal.</p>
        )}
      </div>

      {modal && (
        <ModalVincular
          titulo={`Vincular ${etiqueta(modal.ruta.length, modal.rol).toLowerCase()} de ${modal.hijo.nombre || modal.hijo.codigo}`}
          sexo={modal.rol === 'padre' ? 'macho' : 'hembra'}
          allAnimals={allAnimals}
          excluirIds={new Set(modal.ruta.map((n) => String(n.id)))}
          onSeleccionar={vincular}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default VistaArbol;
