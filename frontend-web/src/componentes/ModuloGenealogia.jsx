import React, { useState, useEffect, useCallback } from 'react'; 
import {
  GitBranch, Search, User, Heart, X, Plus, ChevronLeft,
  AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw,
  Scale, Link2, Shield, Dna, Activity, Baby, Users, Zap,
} from 'lucide-react';
import { apiHelpers } from '../servicios/api';

// ── Estilos por rol ──────────────────────────────────────────────────────────
const ROLES = {
  principal: { border: 'border-teal-400',    bg: 'bg-teal-50',    badge: 'bg-teal-500',    text: 'text-teal-800',    label: 'Animal' },
  padre:     { border: 'border-blue-400',    bg: 'bg-blue-50',    badge: 'bg-blue-500',    text: 'text-blue-800',    label: 'Padre' },
  madre:     { border: 'border-pink-400',    bg: 'bg-pink-50',    badge: 'bg-pink-500',    text: 'text-pink-800',    label: 'Madre' },
  abuelo_pp: { border: 'border-indigo-300',  bg: 'bg-indigo-50',  badge: 'bg-indigo-400',  text: 'text-indigo-800',  label: 'Abuelo P.' },
  abuela_pp: { border: 'border-purple-300',  bg: 'bg-purple-50',  badge: 'bg-purple-400',  text: 'text-purple-800',  label: 'Abuela P.' },
  abuelo_mm: { border: 'border-rose-300',    bg: 'bg-rose-50',    badge: 'bg-rose-400',    text: 'text-rose-800',    label: 'Abuelo M.' },
  abuela_mm: { border: 'border-fuchsia-300', bg: 'bg-fuchsia-50', badge: 'bg-fuchsia-400', text: 'text-fuchsia-800', label: 'Abuela M.' },
};

// ── Helpers de API ───────────────────────────────────────────────────────────
const fetchGen = async (id) => {
  try {
    const res = await apiHelpers.get(`/genealogia/${id}`);
    return res?.data ?? null;
  } catch {
    return null;
  }
};

const buildTree = async (animalId, allAnimals, depth = 0) => {
  if (!animalId || depth >= 3) return null;
  const base = allAnimals.find(a => String(a.id) === String(animalId));
  if (!base) return null;
  const gen = await fetchGen(animalId);
  const padreId = gen?.padre?.id;
  const madreId = gen?.madre?.id;
  const [padre, madre] = await Promise.all([
    buildTree(padreId, allAnimals, depth + 1),
    buildTree(madreId, allAnimals, depth + 1),
  ]);
  return {
    id: base.id,
    codigo: base.codigo,
    nombre: base.nombre,
    sexo: base.sexo,
    raza: base.raza,
    fechaNacimiento: base.fechaNacimiento || base.fecha_nacimiento,
    estadoGeneral: base.estadoGeneral || base.estado_general || base.estado,
    idPadre: padreId || null,
    idMadre: madreId || null,
    padre,
    madre,
  };
};

// ── Motor de compatibilidad ──────────────────────────────────────────────────
const collectIds = (node, set = new Set()) => {
  if (!node) return set;
  set.add(String(node.id));
  collectIds(node.padre, set);
  collectIds(node.madre, set);
  return set;
};

const calcEdadMeses = (fechaNac) => {
  if (!fechaNac) return null;
  const diff = Date.now() - new Date(fechaNac).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
};

const analizarCompatibilidad = (a, b) => {
  const factores = [];
  let puntos = 100;

  // Mismo sexo
  if (a.sexo && b.sexo && a.sexo === b.sexo) {
    return {
      score: 0,
      veredicto: 'Imposible',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: 'x',
      descripcion: 'Ambos animales son del mismo sexo. La reproducción no es posible.',
      coeficiente: 0,
      ancestrosComunes: [],
      factores: [{ tipo: 'error', texto: 'Mismo sexo — reproducción imposible' }],
    };
  }

  const idsA = collectIds(a);
  const idsB = collectIds(b);

  // Relación directa padre-hijo
  if (idsA.has(String(b.id)) || idsB.has(String(a.id))) {
    puntos -= 70;
    factores.push({ tipo: 'error', texto: 'Relación directa padre/madre–hijo detectada (-70 pts)' });
  }

  // Hermanos (mismos padres)
  const mismoPadre = a.idPadre && b.idPadre && String(a.idPadre) === String(b.idPadre);
  const mismaMadre = a.idMadre && b.idMadre && String(a.idMadre) === String(b.idMadre);
  if (mismoPadre && mismaMadre) {
    puntos -= 50;
    factores.push({ tipo: 'error', texto: 'Hermanos completos (mismo padre y madre) (-50 pts)' });
  } else if (mismoPadre || mismaMadre) {
    puntos -= 30;
    factores.push({ tipo: 'warning', texto: 'Medio hermanos (un progenitor en común) (-30 pts)' });
  }

  // Ancestros en común (abuelos)
  const ancestrosA = new Set([
    a.padre?.id && String(a.padre.id),
    a.madre?.id && String(a.madre.id),
    a.padre?.padre?.id && String(a.padre.padre.id),
    a.padre?.madre?.id && String(a.padre.madre.id),
    a.madre?.padre?.id && String(a.madre.padre.id),
    a.madre?.madre?.id && String(a.madre.madre.id),
  ].filter(Boolean));

  const ancestrosB = new Set([
    b.padre?.id && String(b.padre.id),
    b.madre?.id && String(b.madre.id),
    b.padre?.padre?.id && String(b.padre.padre.id),
    b.padre?.madre?.id && String(b.padre.madre.id),
    b.madre?.padre?.id && String(b.madre.padre.id),
    b.madre?.madre?.id && String(b.madre.madre.id),
  ].filter(Boolean));

  const comunes = [...ancestrosA].filter(id => ancestrosB.has(id));
  const coeficiente = Math.min(comunes.length * 6.25, 25);

  if (comunes.length > 0) {
    const descuento = Math.min(comunes.length * 12, 40);
    puntos -= descuento;
    factores.push({ tipo: 'warning', texto: `${comunes.length} ancestro(s) común(es) — coef. consanguinidad ~${coeficiente.toFixed(2)}% (-${descuento} pts)` });
  } else {
    puntos += 5;
    factores.push({ tipo: 'ok', texto: 'Sin ancestros comunes detectados (+5 pts)' });
  }

  // Edad mínima
  const edadA = calcEdadMeses(a.fechaNacimiento);
  const edadB = calcEdadMeses(b.fechaNacimiento);
  if (edadA !== null && edadA < 8) {
    puntos -= 20;
    factores.push({ tipo: 'warning', texto: `${a.codigo} tiene menos de 8 meses (${edadA} meses) (-20 pts)` });
  }
  if (edadB !== null && edadB < 8) {
    puntos -= 20;
    factores.push({ tipo: 'warning', texto: `${b.codigo} tiene menos de 8 meses (${edadB} meses) (-20 pts)` });
  }

  // Salud
  const malaSalud = ['enfermo', 'baja', 'malo', 'critico'];
  if (a.estadoGeneral && malaSalud.some(s => a.estadoGeneral.toLowerCase().includes(s))) {
    puntos -= 15;
    factores.push({ tipo: 'warning', texto: `Estado de salud de ${a.codigo} comprometido (-15 pts)` });
  }
  if (b.estadoGeneral && malaSalud.some(s => b.estadoGeneral.toLowerCase().includes(s))) {
    puntos -= 15;
    factores.push({ tipo: 'warning', texto: `Estado de salud de ${b.codigo} comprometido (-15 pts)` });
  }

  const score = Math.max(0, Math.min(100, puntos));

  let veredicto, color, bgColor, borderColor, icon, descripcion;
  if (score === 0) {
    veredicto = 'No Viable'; color = 'text-red-700'; bgColor = 'bg-red-50'; borderColor = 'border-red-200'; icon = 'x';
    descripcion = 'Los factores de riesgo genético hacen inviable este cruce.';
  } else if (score <= 35) {
    veredicto = 'No Recomendado'; color = 'text-orange-700'; bgColor = 'bg-orange-50'; borderColor = 'border-orange-200'; icon = 'warning';
    descripcion = 'Alto riesgo genético. Se desaconseja fuertemente este cruce.';
  } else if (score <= 60) {
    veredicto = 'Con Reservas'; color = 'text-amber-700'; bgColor = 'bg-amber-50'; borderColor = 'border-amber-200'; icon = 'warning';
    descripcion = 'Cruce posible pero con riesgos moderados. Consultar con especialista.';
  } else if (score <= 85) {
    veredicto = 'Recomendado'; color = 'text-emerald-700'; bgColor = 'bg-emerald-50'; borderColor = 'border-emerald-200'; icon = 'ok';
    descripcion = 'Buena compatibilidad genética. Cruce viable sin riesgos significativos.';
  } else {
    veredicto = 'Excelente'; color = 'text-teal-700'; bgColor = 'bg-teal-50'; borderColor = 'border-teal-200'; icon = 'ok';
    descripcion = 'Compatibilidad óptima. Este cruce maximiza la diversidad genética.';
  }

  return { score, veredicto, color, bgColor, borderColor, icon, descripcion, coeficiente, ancestrosComunes: comunes, factores };
};

// ── Componentes del árbol ────────────────────────────────────────────────────
const NodoCard = ({ nodo, rol, onVincularPadre, onVincularMadre, compact = false }) => {
  const estilo = ROLES[rol] || ROLES.principal;
  const edad = calcEdadMeses(nodo.fechaNacimiento);
  return (
    <div className={`border-2 ${estilo.border} ${estilo.bg} rounded-xl shadow-sm transition-shadow hover:shadow-md ${compact ? 'p-2.5 min-w-[130px]' : 'p-3.5 min-w-[160px]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-white ${estilo.badge}`}>{estilo.label}</span>
        {nodo.sexo && (
          <span className="text-[10px] text-gray-500">{nodo.sexo === 'macho' ? '♂' : '♀'}</span>
        )}
      </div>
      <p className={`font-bold text-xs ${estilo.text} leading-tight`}>{nodo.codigo}</p>
      <p className="text-xs text-gray-700 font-medium mt-0.5 leading-tight truncate max-w-[140px]">{nodo.nombre}</p>
      {!compact && (
        <>
          {nodo.raza && <p className="text-[10px] text-gray-400 mt-1 truncate">{nodo.raza}</p>}
          {edad !== null && <p className="text-[10px] text-gray-400">{edad} meses</p>}
          {nodo.estadoGeneral && (
            <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium
              ${nodo.estadoGeneral.toLowerCase().includes('bueno') || nodo.estadoGeneral.toLowerCase().includes('sano') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {nodo.estadoGeneral}
            </span>
          )}
        </>
      )}
      {(onVincularPadre || onVincularMadre) && !compact && (
        <div className="mt-2 flex gap-1">
          {onVincularPadre && !nodo.padre && (
            <button onClick={onVincularPadre}
              className="flex-1 text-[9px] py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-0.5">
              <Link2 className="w-2.5 h-2.5" /> Padre
            </button>
          )}
          {onVincularMadre && !nodo.madre && (
            <button onClick={onVincularMadre}
              className="flex-1 text-[9px] py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 transition-colors flex items-center justify-center gap-0.5">
              <Link2 className="w-2.5 h-2.5" /> Madre
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const NodoVacio = ({ rol, onVincular }) => {
  const estilo = ROLES[rol] || ROLES.padre;
  return (
    <button onClick={onVincular}
      className={`border-2 border-dashed ${estilo.border} rounded-xl p-3.5 min-w-[160px] flex flex-col items-center justify-center gap-1.5
        hover:${estilo.bg} transition-colors group opacity-60 hover:opacity-100`}>
      <Plus className={`w-5 h-5 ${estilo.text} group-hover:scale-110 transition-transform`} />
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${estilo.text}`}>Vincular {estilo.label}</span>
    </button>
  );
};

// ── Líneas conectoras ────────────────────────────────────────────────────────
const LineaV = ({ color = 'bg-gray-200' }) => (
  <div className={`w-0.5 h-8 ${color} mx-auto`} />
);
const LineaH = ({ color = 'bg-gray-200', children }) => (
  <div className="relative flex items-center justify-around">
    <div className={`absolute top-0 left-1/4 right-1/4 h-0.5 ${color}`} />
    {children}
  </div>
);

// ── Modal para vincular animal ───────────────────────────────────────────────
const ModalVincular = ({ titulo, filtroSexo, allAnimals, excluirIds, onSeleccionar, onCerrar }) => {
  const [busqueda, setBusqueda] = useState('');
  const candidatos = allAnimals.filter(a => {
    if (excluirIds?.includes(String(a.id))) return false;
    if (filtroSexo && a.sexo !== filtroSexo) return false;
    const q = busqueda.toLowerCase();
    return !q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-gray-800">{titulo}</h3>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input autoFocus type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {candidatos.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Sin animales disponibles</p>
          )}
          {candidatos.map(a => (
            <button key={a.id} onClick={() => onSeleccionar(a)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50 transition-all flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.sexo === 'macho' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                {a.sexo === 'macho' ? <User className="w-4 h-4 text-blue-500" /> : <Heart className="w-4 h-4 text-pink-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{a.codigo} — {a.nombre}</p>
                <p className="text-xs text-gray-400">{a.raza} · {a.sexo === 'macho' ? 'Macho' : 'Hembra'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Vista: Selector de animal ────────────────────────────────────────────────
const SelectorAnimal = ({ allAnimals, cargando, onSeleccionar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');

  const filtrados = allAnimals.filter(a => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q) || a.raza?.toLowerCase().includes(q);
    const matchSexo = !filtroSexo || a.sexo === filtroSexo;
    return matchQ && matchSexo;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Genealogía y Linaje</h2>
            <p className="text-sm text-gray-500">Selecciona un animal para visualizar su árbol genealógico</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por código, nombre o raza..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <select value={filtroSexo} onChange={e => setFiltroSexo(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="">Todos</option>
            <option value="macho">Machos</option>
            <option value="hembra">Hembras</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-gray-500 text-sm">Cargando animales...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map(animal => (
            <button key={animal.id} onClick={() => onSeleccionar(animal)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left overflow-hidden group">
              <div className={`h-2 ${animal.sexo === 'macho' ? 'bg-blue-400' : 'bg-pink-400'}`} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${animal.sexo === 'macho' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                    {animal.sexo === 'macho' ? <User className="w-5 h-5 text-blue-500" /> : <Heart className="w-5 h-5 text-pink-500" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{animal.codigo}</p>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{animal.nombre}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {animal.raza && <p className="text-xs text-gray-500">{animal.raza}</p>}
                  {animal.estadoGeneral && (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
                      ${animal.estadoGeneral.toLowerCase().includes('buen') || animal.estadoGeneral.toLowerCase().includes('san')
                        ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {animal.estadoGeneral}
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-teal-600 group-hover:text-teal-700">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Ver árbol genealógico</span>
                </div>
              </div>
            </button>
          ))}
          {filtrados.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron animales</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Vista: Árbol genealógico ─────────────────────────────────────────────────
const VistaArbol = ({ arbol, allAnimals, cargando, onVolver, onComparar, onActualizar, animalBase }) => {
  const [modal, setModal] = useState(null); // { tipo: 'padre'|'madre'|'abuelo_pp'|..., targetId }
  const [guardando, setGuardando] = useState(false);

  const excluirIds = arbol ? [String(arbol.id)] : [];

  const vincular = async (animal) => {
    if (!modal || !arbol) return;
    setGuardando(true);
    setModal(null);
    try {
      const payload = { idAnimal: modal.targetId };
      if (modal.tipo === 'padre') payload.idPadre = animal.id;
      if (modal.tipo === 'madre') payload.idMadre = animal.id;
      if (modal.tipo === 'abuelo_pp') { payload.idAnimal = arbol.idPadre; payload.idPadre = animal.id; }
      if (modal.tipo === 'abuela_pp') { payload.idAnimal = arbol.idPadre; payload.idMadre = animal.id; }
      if (modal.tipo === 'abuelo_mm') { payload.idAnimal = arbol.idMadre; payload.idPadre = animal.id; }
      if (modal.tipo === 'abuela_mm') { payload.idAnimal = arbol.idMadre; payload.idMadre = animal.id; }
      await apiHelpers.post('/genealogia', payload);
      await onActualizar();
    } catch (err) {
      console.error('Error vinculando:', err);
    } finally {
      setGuardando(false);
    }
  };

  const filtroSexo = (tipo) => {
    if (tipo === 'padre' || tipo === 'abuelo_pp' || tipo === 'abuelo_mm') return 'macho';
    if (tipo === 'madre' || tipo === 'abuela_pp' || tipo === 'abuela_mm') return 'hembra';
    return '';
  };

  if (cargando) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
          <p className="text-gray-500">Construyendo árbol genealógico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onVolver}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {animalBase?.codigo} — {animalBase?.nombre}
              </h2>
              <p className="text-sm text-gray-500">Árbol genealógico · 3 generaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onActualizar}
              className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
            <button onClick={onComparar}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <Scale className="w-4 h-4" /> Comparar compatibilidad
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/70 px-5 py-3 mb-5 flex flex-wrap gap-4 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leyenda:</span>
        {Object.entries(ROLES).map(([rol, e]) => (
          <div key={rol} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border-2 ${e.border} ${e.bg}`} />
            <span className="text-xs text-gray-500">{e.label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <Link2 className="w-3 h-3" /> Haz clic en los botones vacíos para vincular un progenitor
        </span>
      </div>

      {/* Árbol */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 overflow-x-auto">
        {guardando && (
          <div className="flex items-center gap-2 text-sm text-teal-600 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Guardando vínculo...
          </div>
        )}

        {arbol ? (
          <div className="min-w-[700px]">
            {/* Generación 0: Animal principal */}
            <div className="flex justify-center mb-2">
              <NodoCard nodo={arbol} rol="principal"
                onVincularPadre={() => setModal({ tipo: 'padre', targetId: arbol.id })}
                onVincularMadre={() => setModal({ tipo: 'madre', targetId: arbol.id })} />
            </div>

            {/* Conector gen 0 → 1 */}
            {(arbol.padre || arbol.madre || !arbol.idPadre || !arbol.idMadre) && (
              <div className="relative flex justify-center mb-2">
                <div className="w-0.5 h-8 bg-gray-200 mx-auto" />
              </div>
            )}

            {/* Generación 1: Padre y Madre */}
            <div className="flex justify-center gap-16 mb-2 relative">
              {/* Línea horizontal entre gen 0 y gen 1 */}
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gray-200" />
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-0 bg-gray-200" />
                {arbol.padre
                  ? <NodoCard nodo={arbol.padre} rol="padre"
                      onVincularPadre={arbol.idPadre ? () => setModal({ tipo: 'abuelo_pp', targetId: arbol.idPadre }) : null}
                      onVincularMadre={arbol.idPadre ? () => setModal({ tipo: 'abuela_pp', targetId: arbol.idPadre }) : null} />
                  : <NodoVacio rol="padre" onVincular={() => setModal({ tipo: 'padre', targetId: arbol.id })} />
                }
              </div>
              <div className="flex flex-col items-center">
                {arbol.madre
                  ? <NodoCard nodo={arbol.madre} rol="madre"
                      onVincularPadre={arbol.idMadre ? () => setModal({ tipo: 'abuelo_mm', targetId: arbol.idMadre }) : null}
                      onVincularMadre={arbol.idMadre ? () => setModal({ tipo: 'abuela_mm', targetId: arbol.idMadre }) : null} />
                  : <NodoVacio rol="madre" onVincular={() => setModal({ tipo: 'madre', targetId: arbol.id })} />
                }
              </div>
            </div>

            {/* Conectores gen 1 → 2 */}
            <div className="flex justify-center gap-16 mb-2">
              {[arbol.padre, arbol.madre].map((_, i) => (
                <div key={i} className="flex justify-center" style={{ minWidth: '160px' }}>
                  <div className="w-0.5 h-8 bg-gray-200" />
                </div>
              ))}
            </div>

            {/* Generación 2: Abuelos */}
            <div className="flex justify-center">
              <div className="flex gap-6">
                {/* Abuelos paternos */}
                <div className="flex gap-4 border-r border-dashed border-gray-200 pr-6">
                  {arbol.padre?.padre
                    ? <NodoCard nodo={arbol.padre.padre} rol="abuelo_pp" compact />
                    : arbol.idPadre
                      ? <NodoVacio rol="abuelo_pp" onVincular={() => setModal({ tipo: 'abuelo_pp', targetId: arbol.idPadre })} />
                      : null
                  }
                  {arbol.padre?.madre
                    ? <NodoCard nodo={arbol.padre.madre} rol="abuela_pp" compact />
                    : arbol.idPadre
                      ? <NodoVacio rol="abuela_pp" onVincular={() => setModal({ tipo: 'abuela_pp', targetId: arbol.idPadre })} />
                      : null
                  }
                </div>
                {/* Abuelos maternos */}
                <div className="flex gap-4 pl-2">
                  {arbol.madre?.padre
                    ? <NodoCard nodo={arbol.madre.padre} rol="abuelo_mm" compact />
                    : arbol.idMadre
                      ? <NodoVacio rol="abuelo_mm" onVincular={() => setModal({ tipo: 'abuelo_mm', targetId: arbol.idMadre })} />
                      : null
                  }
                  {arbol.madre?.madre
                    ? <NodoCard nodo={arbol.madre.madre} rol="abuela_mm" compact />
                    : arbol.idMadre
                      ? <NodoVacio rol="abuela_mm" onVincular={() => setModal({ tipo: 'abuela_mm', targetId: arbol.idMadre })} />
                      : null
                  }
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron datos genealógicos para este animal.</p>
            <p className="text-xs mt-1">Usa los botones de abajo para vincular progenitores.</p>
          </div>
        )}
      </div>

      {/* Modal vincular */}
      {modal && (
        <ModalVincular
          titulo={`Vincular ${ROLES[modal.tipo]?.label || modal.tipo}`}
          filtroSexo={filtroSexo(modal.tipo)}
          allAnimals={allAnimals}
          excluirIds={excluirIds}
          onSeleccionar={vincular}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ── Vista: Comparar compatibilidad ───────────────────────────────────────────
const VistaComparar = ({ arbol1, animal1, allAnimals, onVolver }) => {
  const [animal2, setAnimal2] = useState(null);
  const [arbol2, setArbol2] = useState(null);
  const [cargando2, setCargando2] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultado, setResultado] = useState(null);

  const seleccionar2 = async (a) => {
    setAnimal2(a);
    setCargando2(true);
    setResultado(null);
    try {
      const tree = await buildTree(a.id, allAnimals);
      setArbol2(tree);
      if (arbol1 && tree) {
        setResultado(analizarCompatibilidad(arbol1, tree));
      }
    } finally {
      setCargando2(false);
    }
  };

  const candidatos = allAnimals.filter(a => {
    if (String(a.id) === String(animal1.id)) return false;
    const q = busqueda.toLowerCase();
    return !q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q);
  });

  const MiniArbol = ({ arbol, titulo, lado }) => {
    if (!arbol) return (
      <div className="flex items-center justify-center h-32 text-gray-300">
        <GitBranch className="w-8 h-8" />
      </div>
    );
    const ancestrosComunes = resultado?.ancestrosComunes || [];
    const marked = (nodo) => nodo && ancestrosComunes.includes(String(nodo.id));

    const NodoMini = ({ nodo, rol }) => {
      if (!nodo) return <div className="w-24 h-12 rounded-lg border-2 border-dashed border-gray-200 opacity-40" />;
      const e = ROLES[rol] || ROLES.principal;
      const isComun = marked(nodo);
      return (
        <div className={`border-2 ${isComun ? 'border-amber-400 bg-amber-50' : `${e.border} ${e.bg}`} rounded-lg p-1.5 w-24`}>
          <p className={`text-[9px] font-bold uppercase ${isComun ? 'text-amber-700' : e.text}`}>{e.label}</p>
          <p className="text-[10px] font-semibold text-gray-700 truncate">{nodo.codigo}</p>
          <p className="text-[9px] text-gray-400 truncate">{nodo.nombre}</p>
          {isComun && <span className="text-[8px] text-amber-600 font-bold">⚠ Común</span>}
        </div>
      );
    };

    return (
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">{titulo}</p>
        <div className="flex flex-col items-center gap-1">
          <NodoMini nodo={arbol} rol="principal" />
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-0.5 h-4 bg-gray-200" />
              <NodoMini nodo={arbol.padre} rol="padre" />
              <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-3 bg-gray-200" />
                  <NodoMini nodo={arbol.padre?.padre} rol="abuelo_pp" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-3 bg-gray-200" />
                  <NodoMini nodo={arbol.padre?.madre} rol="abuela_pp" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-0.5 h-4 bg-gray-200" />
              <NodoMini nodo={arbol.madre} rol="madre" />
              <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-3 bg-gray-200" />
                  <NodoMini nodo={arbol.madre?.padre} rol="abuelo_mm" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-3 bg-gray-200" />
                  <NodoMini nodo={arbol.madre?.madre} rol="abuela_mm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Análisis de Compatibilidad</h2>
            <p className="text-sm text-gray-500">Compara dos árboles genealógicos y evalúa la viabilidad del cruce</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Animal 2 selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-500" /> Seleccionar segundo animal
          </h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {candidatos.map(a => (
              <button key={a.id} onClick={() => seleccionar2(a)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all text-sm flex items-center gap-2.5
                  ${animal2?.id === a.id ? 'border-teal-400 bg-teal-50' : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50/50'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${a.sexo === 'macho' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                  {a.sexo === 'macho' ? <User className="w-3.5 h-3.5 text-blue-500" /> : <Heart className="w-3.5 h-3.5 text-pink-500" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-xs">{a.codigo} — {a.nombre}</p>
                  <p className="text-[10px] text-gray-400">{a.raza}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Árboles comparados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Árboles lado a lado */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5">
            <div className="grid grid-cols-2 gap-6 overflow-x-auto">
              <div className="min-w-0">
                <MiniArbol arbol={arbol1} titulo={animal1.codigo + ' — ' + animal1.nombre} lado="izq" />
              </div>
              <div className="min-w-0 border-l border-dashed border-gray-200 pl-6">
                {cargando2 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                    <p className="text-xs text-gray-400">Cargando árbol...</p>
                  </div>
                ) : animal2 ? (
                  <MiniArbol arbol={arbol2} titulo={animal2.codigo + ' — ' + animal2.nombre} lado="der" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-300">
                    <Scale className="w-8 h-8" />
                    <p className="text-xs text-center">Selecciona el segundo animal para comparar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resultado compatibilidad */}
          {resultado && (
            <div className={`rounded-2xl border-2 ${resultado.borderColor} ${resultado.bgColor} p-6 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {resultado.icon === 'ok'
                      ? <CheckCircle2 className={`w-6 h-6 ${resultado.color}`} />
                      : resultado.icon === 'warning'
                        ? <AlertTriangle className={`w-6 h-6 ${resultado.color}`} />
                        : <XCircle className={`w-6 h-6 ${resultado.color}`} />
                    }
                    <h3 className={`text-xl font-bold ${resultado.color}`}>Veredicto: {resultado.veredicto}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{resultado.descripcion}</p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-black ${resultado.color}`}>{resultado.score}</div>
                  <div className="text-xs text-gray-500 font-medium">/ 100 puntos</div>
                </div>
              </div>

              {/* Barra de puntuación */}
              <div className="mb-5">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${resultado.score}%`,
                      background: resultado.score >= 86 ? '#14b8a6' : resultado.score >= 61 ? '#10b981' : resultado.score >= 36 ? '#f59e0b' : '#ef4444'
                    }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>No viable</span><span>Con reservas</span><span>Recomendado</span><span>Excelente</span>
                </div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: Dna, label: 'Coef. Consanguinidad', value: `${resultado.coeficiente.toFixed(2)}%`,
                    color: resultado.coeficiente > 12.5 ? 'text-red-600' : resultado.coeficiente > 0 ? 'text-amber-600' : 'text-emerald-600' },
                  { icon: Shield, label: 'Ancestros Comunes', value: resultado.ancestrosComunes.length,
                    color: resultado.ancestrosComunes.length > 0 ? 'text-amber-600' : 'text-emerald-600' },
                  { icon: Activity, label: 'Factores Evaluados', value: resultado.factores.length, color: 'text-teal-600' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-white/60 rounded-xl p-3 text-center">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Factores */}
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Factores analizados
                </h4>
                <div className="space-y-1.5">
                  {resultado.factores.map((f, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg
                      ${f.tipo === 'error' ? 'bg-red-100/60 text-red-700' : f.tipo === 'warning' ? 'bg-amber-100/60 text-amber-700' : 'bg-emerald-100/60 text-emerald-700'}`}>
                      {f.tipo === 'error' ? <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                        f.tipo === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      {f.texto}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const ModuloGenealogia = () => {
  const [vista, setVista] = useState('selector'); // 'selector' | 'arbol' | 'comparar'
  const [allAnimals, setAllAnimals] = useState([]);
  const [cargandoAnimales, setCargandoAnimales] = useState(true);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [arbol, setArbol] = useState(null);
  const [cargandoArbol, setCargandoArbol] = useState(false);

  // Cargar lista de animales al montar
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiHelpers.get('/animales', { porPagina: 200 });
        const lista = res?.data || res?.animales || (Array.isArray(res) ? res : []);
        setAllAnimals(lista);
      } catch (err) {
        console.error('Error cargando animales:', err);
      } finally {
        setCargandoAnimales(false);
      }
    };
    cargar();
  }, []);

  const cargarArbol = useCallback(async (animal) => {
    setCargandoArbol(true);
    setArbol(null);
    try {
      const tree = await buildTree(animal.id, allAnimals);
      setArbol(tree);
    } finally {
      setCargandoArbol(false);
    }
  }, [allAnimals]);

  const seleccionarAnimal = async (animal) => {
    setAnimalSeleccionado(animal);
    setVista('arbol');
    await cargarArbol(animal);
  };

  const actualizarArbol = async () => {
    if (animalSeleccionado) await cargarArbol(animalSeleccionado);
  };

  if (vista === 'comparar' && animalSeleccionado) {
    return (
      <VistaComparar
        arbol1={arbol}
        animal1={animalSeleccionado}
        allAnimals={allAnimals}
        onVolver={() => setVista('arbol')}
      />
    );
  }

  if (vista === 'arbol' && animalSeleccionado) {
    return (
      <VistaArbol
        arbol={arbol}
        allAnimals={allAnimals}
        cargando={cargandoArbol}
        animalBase={animalSeleccionado}
        onVolver={() => { setVista('selector'); setAnimalSeleccionado(null); setArbol(null); }}
        onComparar={() => setVista('comparar')}
        onActualizar={actualizarArbol}
      />
    );
  }

  return (
    <SelectorAnimal
      allAnimals={allAnimals}
      cargando={cargandoAnimales}
      onSeleccionar={seleccionarAnimal}
    />
  );
};

export default ModuloGenealogia;
