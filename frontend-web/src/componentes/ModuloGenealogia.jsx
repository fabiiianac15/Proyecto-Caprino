import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, Search, User, Heart, X, Plus, ChevronLeft,
  AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw,
  Scale, Link2, Shield, Dna, Activity, Baby, Users, Zap,
  Brain, TrendingUp, Info, ChevronDown, ChevronUp,
  Sparkles, RotateCcw,
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
const NodoCard = ({ nodo, rol, onVincularPadre, onVincularMadre, onDesvincularPadre, onDesvincularMadre, compact = false }) => {
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
      {!compact && (
        <div className="mt-2 flex flex-col gap-1">
          {/* Padre: vincular o desvincular */}
          {onVincularPadre && !nodo.padre && (
            <button onClick={onVincularPadre}
              className="text-[9px] py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-0.5">
              <Link2 className="w-2.5 h-2.5" /> Vincular Padre
            </button>
          )}
          {onDesvincularPadre && nodo.padre && (
            <button onClick={onDesvincularPadre}
              className="text-[9px] py-1 bg-blue-50 text-blue-400 rounded hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center gap-0.5 border border-blue-200 hover:border-red-200">
              <X className="w-2.5 h-2.5" /> Quitar Padre
            </button>
          )}
          {/* Madre: vincular o desvincular */}
          {onVincularMadre && !nodo.madre && (
            <button onClick={onVincularMadre}
              className="text-[9px] py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 transition-colors flex items-center justify-center gap-0.5">
              <Link2 className="w-2.5 h-2.5" /> Vincular Madre
            </button>
          )}
          {onDesvincularMadre && nodo.madre && (
            <button onClick={onDesvincularMadre}
              className="text-[9px] py-1 bg-pink-50 text-pink-400 rounded hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center gap-0.5 border border-pink-200 hover:border-red-200">
              <X className="w-2.5 h-2.5" /> Quitar Madre
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

// ── Conectores del árbol horizontal ──────────────────────────────────────────
// Tramo horizontal corto que sale del progenitor hacia el "tronco" de sus padres.
const TroncoH = ({ color = 'bg-gray-300' }) => (
  <div className={`h-0.5 w-8 ${color} shrink-0`} />
);

// Agrupa dos (o más) ramas y dibuja el corchete vertical que las une al
// progenitor. Cada hija se centra verticalmente en su fila y de ahí sale una
// línea horizontal hasta el tronco vertical compartido.
const Corchete = ({ hijas, color = 'bg-gray-300' }) => (
  <div className="flex flex-col">
    {hijas.map((hija, i) => {
      const sola   = hijas.length === 1;
      const arriba = i === 0;
      const abajo  = i === hijas.length - 1;
      // El tronco vertical sólo cubre la mitad interior de la fila extrema,
      // de modo que ambas mitades se encuentran en el centro del bloque.
      const troncoPos = sola ? '' : arriba ? 'top-1/2 bottom-0' : abajo ? 'top-0 bottom-1/2' : 'top-0 bottom-0';
      return (
        <div key={i} className="relative flex items-center pl-8 py-2.5">
          {!sola && <div className={`absolute left-0 w-0.5 ${color} ${troncoPos}`} />}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-8 ${color}`} />
          {hija}
        </div>
      );
    })}
  </div>
);

// Nodo del árbol: tarjeta del progenitor + (opcionalmente) sus ramas a la derecha.
const RamaHorizontal = ({ tarjeta, hijas }) => (
  <div className="flex items-center">
    {tarjeta}
    {hijas && hijas.length > 0 && (
      <>
        <TroncoH />
        <Corchete hijas={hijas} />
      </>
    )}
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

// ── Vista: Selector de animal (landing profesional) ──────────────────────────
const SelectorAnimal = ({ allAnimals, cargando, onSeleccionar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');

  const filtrados = allAnimals.filter(a => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q) || a.raza?.toLowerCase().includes(q);
    const matchSexo = !filtroSexo || a.sexo === filtroSexo;
    return matchQ && matchSexo;
  });

  const totalMachos  = allAnimals.filter(a => a.sexo === 'macho').length;
  const totalHembras = allAnimals.filter(a => a.sexo === 'hembra').length;

  const PASOS = [
    { num: '1', icon: <Search className="w-5 h-5" />, titulo: 'Seleccionar animal', desc: 'Elige cualquier animal del rebaño para explorar su linaje' },
    { num: '2', icon: <GitBranch className="w-5 h-5" />, titulo: 'Explorar árbol', desc: 'Visualiza 3 generaciones y vincula progenitores directamente' },
    { num: '3', icon: <Scale className="w-5 h-5" />, titulo: 'Comparar cruces', desc: 'Analiza la compatibilidad genética entre dos animales' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl shadow-lg p-7 text-white relative overflow-hidden">
        {/* fondo decorativo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none flex items-center justify-end pr-8">
          <GitBranch className="w-48 h-48 text-white" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Dna className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-tight">Genealogía y Linaje</h2>
              <p className="text-teal-200 text-sm">Gestión del patrimonio genético del rebaño</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-5">
            {[
              { icon: <Users className="w-4 h-4" />, val: allAnimals.length, label: 'Animales' },
              { icon: <User className="w-4 h-4" />,  val: totalMachos,       label: 'Machos ♂' },
              { icon: <Heart className="w-4 h-4" />, val: totalHembras,      label: 'Hembras ♀' },
            ].map(s => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <span className="text-teal-200">{s.icon}</span>
                <div>
                  <p className="text-xl font-black leading-none">{s.val}</p>
                  <p className="text-[11px] text-teal-200 leading-none mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Guía de 3 pasos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PASOS.map((paso, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-600">
              {paso.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mb-0.5">Paso {paso.num}</p>
              <p className="text-sm font-bold text-gray-800 mb-0.5">{paso.titulo}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{paso.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Buscador y filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por código, nombre o raza..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50" />
        </div>
        <div className="flex gap-2 shrink-0">
          {[['', 'Todos'], ['macho', '♂ Machos'], ['hembra', '♀ Hembras']].map(([v, l]) => (
            <button key={v} onClick={() => setFiltroSexo(v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors
                ${filtroSexo === v
                  ? v === '' ? 'bg-teal-600 text-white border-teal-600'
                    : v === 'macho' ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-pink-600 text-white border-pink-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 shrink-0">
          {filtrados.length} de {allAnimals.length} animales
        </p>
      </div>

      {/* ── Grid de animales ── */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-gray-500 text-sm">Cargando animales...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No se encontraron animales con esos filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map(animal => {
            const esMacho = animal.sexo === 'macho';
            return (
              <button key={animal.id} onClick={() => onSeleccionar(animal)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left overflow-hidden group">
                {/* Banda de color */}
                <div className={`h-1.5 ${esMacho ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-pink-400 to-pink-600'}`} />
                <div className="p-5">
                  {/* Avatar + badge sexo */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${esMacho ? 'bg-blue-50 border border-blue-100' : 'bg-pink-50 border border-pink-100'}`}>
                      {esMacho
                        ? <User className="w-5 h-5 text-blue-500" />
                        : <Heart className="w-5 h-5 text-pink-500" />}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esMacho ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {esMacho ? '♂ Macho' : '♀ Hembra'}
                    </span>
                  </div>

                  {/* Nombre y código */}
                  <p className="text-base font-bold text-gray-800 leading-tight truncate">{animal.nombre || <span className="italic text-gray-400 font-normal">Sin nombre</span>}</p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{animal.codigo}</p>

                  {/* Raza + estado */}
                  <div className="mt-2.5 space-y-1">
                    {animal.raza && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block shrink-0" />
                        {animal.raza}
                      </p>
                    )}
                    {animal.estadoGeneral && (
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold
                        ${animal.estadoGeneral.toLowerCase().includes('buen') || animal.estadoGeneral.toLowerCase().includes('san') || animal.estadoGeneral.toLowerCase().includes('activ')
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'}`}>
                        {animal.estadoGeneral}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className={`mt-4 pt-3 border-t border-gray-100 flex items-center justify-between
                    text-teal-600 group-hover:text-teal-700 transition-colors`}>
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" /> Ver árbol genealógico
                    </span>
                    <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Vista: Árbol genealógico ─────────────────────────────────────────────────
const VistaArbol = ({ arbol, allAnimals, cargando, onVolver, onComparar, onRankear, onActualizar, animalBase }) => {
  const [modal, setModal] = useState(null); // { tipo: 'padre'|'madre'|'abuelo_pp'|..., targetId }
  const [guardando, setGuardando] = useState(false);

  const excluirIds = arbol ? [String(arbol.id)] : [];

  const vincular = async (animal) => {
    if (!modal || !arbol) return;
    setGuardando(true);
    setModal(null);
    try {
      let payload = {};
      // Siempre incluir ambos progenitores para no borrar el que ya existe
      if (modal.tipo === 'padre') {
        payload = { idAnimal: arbol.id, idPadre: animal.id, idMadre: arbol.idMadre };
      } else if (modal.tipo === 'madre') {
        payload = { idAnimal: arbol.id, idMadre: animal.id, idPadre: arbol.idPadre };
      } else if (modal.tipo === 'abuelo_pp') {
        payload = { idAnimal: arbol.idPadre, idPadre: animal.id, idMadre: arbol.padre?.idMadre };
      } else if (modal.tipo === 'abuela_pp') {
        payload = { idAnimal: arbol.idPadre, idMadre: animal.id, idPadre: arbol.padre?.idPadre };
      } else if (modal.tipo === 'abuelo_mm') {
        payload = { idAnimal: arbol.idMadre, idPadre: animal.id, idMadre: arbol.madre?.idMadre };
      } else if (modal.tipo === 'abuela_mm') {
        payload = { idAnimal: arbol.idMadre, idMadre: animal.id, idPadre: arbol.madre?.idPadre };
      }
      await apiHelpers.post('/genealogia', payload);
      await onActualizar();
    } catch (err) {
      console.error('Error vinculando:', err);
    } finally {
      setGuardando(false);
    }
  };

  const desvincular = async (tipo) => {
    if (!arbol) return;
    setGuardando(true);
    try {
      const payload = {
        idAnimal: arbol.id,
        idPadre: tipo === 'padre' ? null : arbol.idPadre,
        idMadre: tipo === 'madre' ? null : arbol.idMadre,
      };
      await apiHelpers.post('/genealogia', payload);
      await onActualizar();
    } catch (err) {
      console.error('Error desvinculando:', err);
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
            <button onClick={onRankear}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <TrendingUp className="w-4 h-4" /> Buscar mejor cruce
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
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3 rotate-90" /> Padre arriba · Madre abajo · el linaje crece hacia la derecha
          </span>
          <span className="hidden lg:flex items-center gap-1 border-l border-gray-200 pl-3">
            <Link2 className="w-3 h-3" /> Clic en los recuadros vacíos para vincular
          </span>
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
          (() => {
            // ── Generación 2: abuelos (tarjetas compactas u opción de vincular) ──
            const abueloPP = arbol.padre?.padre
              ? <NodoCard nodo={arbol.padre.padre} rol="abuelo_pp" compact />
              : <NodoVacio rol="abuelo_pp" onVincular={() => setModal({ tipo: 'abuelo_pp', targetId: arbol.idPadre })} />;
            const abuelaPP = arbol.padre?.madre
              ? <NodoCard nodo={arbol.padre.madre} rol="abuela_pp" compact />
              : <NodoVacio rol="abuela_pp" onVincular={() => setModal({ tipo: 'abuela_pp', targetId: arbol.idPadre })} />;
            const abueloMM = arbol.madre?.padre
              ? <NodoCard nodo={arbol.madre.padre} rol="abuelo_mm" compact />
              : <NodoVacio rol="abuelo_mm" onVincular={() => setModal({ tipo: 'abuelo_mm', targetId: arbol.idMadre })} />;
            const abuelaMM = arbol.madre?.madre
              ? <NodoCard nodo={arbol.madre.madre} rol="abuela_mm" compact />
              : <NodoVacio rol="abuela_mm" onVincular={() => setModal({ tipo: 'abuela_mm', targetId: arbol.idMadre })} />;

            // ── Generación 1: rama del PADRE (arriba) y de la MADRE (abajo) ──
            const ramaPadre = arbol.padre
              ? <RamaHorizontal
                  tarjeta={<NodoCard nodo={arbol.padre} rol="padre" />}
                  hijas={arbol.idPadre ? [abueloPP, abuelaPP] : null} />
              : <NodoVacio rol="padre" onVincular={() => setModal({ tipo: 'padre', targetId: arbol.id })} />;

            const ramaMadre = arbol.madre
              ? <RamaHorizontal
                  tarjeta={<NodoCard nodo={arbol.madre} rol="madre" />}
                  hijas={arbol.idMadre ? [abueloMM, abuelaMM] : null} />
              : <NodoVacio rol="madre" onVincular={() => setModal({ tipo: 'madre', targetId: arbol.id })} />;

            // ── Generación 0: animal principal, raíz a la izquierda ──
            return (
              <div className="flex justify-start py-4 min-w-max">
                <RamaHorizontal
                  tarjeta={
                    <NodoCard nodo={arbol} rol="principal"
                      onVincularPadre={() => setModal({ tipo: 'padre', targetId: arbol.id })}
                      onVincularMadre={() => setModal({ tipo: 'madre', targetId: arbol.id })}
                      onDesvincularPadre={() => desvincular('padre')}
                      onDesvincularMadre={() => desvincular('madre')} />
                  }
                  hijas={[ramaPadre, ramaMadre]} />
              </div>
            );
          })()
        ) : (
          <div className="text-center py-12 text-gray-400">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron datos genealógicos para este animal.</p>
            <p className="text-xs mt-1">Usa los recuadros para vincular progenitores.</p>
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

// ── Helpers de UI para resultado ML ─────────────────────────────────────────
const CONFIG_CLASIFICACION = {
  'Recomendado':              { color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', barra: '#10b981', icon: 'ok'      },
  'Precaución':               { color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-300',   barra: '#f59e0b', icon: 'warning' },
  'No recomendado':           { color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-300',     barra: '#ef4444', icon: 'x'       },
  'Insuficiente información': { color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-300',    barra: '#9ca3af', icon: 'info'    },
  'Datos insuficientes':      { color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-300',    barra: '#9ca3af', icon: 'info'    },
};

// Color de cada dimensión según si es de calidad (alto=bueno) o de riesgo (alto=malo)
const DIMS_RIESGO = new Set(['consanguinidad', 'riesgo_hereditario', 'riesgo_enfermedades']);
const ICONO_DIM = {
  compatibilidad_genetica: Dna,
  consanguinidad: Link2,
  riesgo_hereditario: Dna,
  parto_exitoso: Baby,
  calidad_leche: Activity,
  fertilidad: Heart,
  riesgo_enfermedades: Shield,
  capacidad_reproductiva: Activity,
};
const colorScoreDim = (score) =>
  score >= 72 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';
const colorBarraDim = (score) =>
  score >= 72 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
const colorConfianza = (c) =>
  c === 'alta' ? 'bg-emerald-100 text-emerald-700'
  : c === 'media' ? 'bg-amber-100 text-amber-700'
  : 'bg-gray-200 text-gray-500';

// ── Render de markdown ligero (negritas, títulos ##, citas >) ─────────────────
const renderInline = (texto) =>
  texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-800">{parte.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{parte}</React.Fragment>
  );

const MarkdownLigero = ({ texto }) => {
  const lineas = texto.split('\n');
  return (
    <div className="space-y-2">
      {lineas.map((linea, i) => {
        const l = linea.trimEnd();
        if (!l.trim()) return <div key={i} className="h-1" />;
        if (l.trim().startsWith('```')) return null;   // ignora cercas de código
        if (l.startsWith('## ') || l.startsWith('### ')) {
          const txt = l.replace(/^#+\s/, '');
          return (
            <h4 key={i} className="text-sm font-bold text-teal-700 mt-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {renderInline(txt)}
            </h4>
          );
        }
        if (l.startsWith('> ')) {
          return (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 border-l-2 border-amber-300 pl-3 py-1.5 rounded-r">
              {renderInline(l.replace(/^>\s*/, ''))}
            </p>
          );
        }
        if (l.startsWith('- ')) {
          return (
            <p key={i} className="text-sm text-gray-600 leading-relaxed pl-3">• {renderInline(l.slice(2))}</p>
          );
        }
        return <p key={i} className="text-sm text-gray-600 leading-relaxed">{renderInline(l)}</p>;
      })}
    </div>
  );
};

// ── Panel del análisis generado por IA ────────────────────────────────────────
const AnalisisIA = ({ texto, cargando, error, onRegenerar }) => (
  <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/70 to-white p-6 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
          <Sparkles className={`w-5 h-5 text-violet-600 ${cargando ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-800">Análisis del asistente de IA</h3>
          <p className="text-[10px] text-gray-400">Interpretación en lenguaje natural · IA generativa local</p>
        </div>
      </div>
      {!cargando && (texto || error) && (
        <button onClick={onRegenerar}
          className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 transition-colors">
          <RotateCcw className="w-3 h-3" /> Regenerar
        </button>
      )}
    </div>

    {error && !texto && (
      <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
    )}

    {texto
      ? <MarkdownLigero texto={texto} />
      : cargando && (
        <div className="flex items-center gap-2 text-xs text-violet-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Redactando análisis a partir del resultado del modelo…
        </div>
      )}

    {cargando && texto && (
      <span className="inline-block w-2 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
    )}
  </div>
);

// ── Vista: Comparar compatibilidad ───────────────────────────────────────────
const VistaComparar = ({ arbol1, animal1, allAnimals, onVolver }) => {
  const [animal2,    setAnimal2]    = useState(null);
  const [arbol2,     setArbol2]     = useState(null);
  const [cargando2,  setCargando2]  = useState(false);
  const [mlCargando, setMlCargando] = useState(false);
  const [mlResultado,setMlResultado]= useState(null);  // { animales, evaluacion } | { aviso } | null
  const [mlError,    setMlError]    = useState(null);
  const [busqueda,   setBusqueda]   = useState('');
  const [iaTexto,    setIaTexto]    = useState('');
  const [iaCargando, setIaCargando] = useState(false);
  const [iaError,    setIaError]    = useState(null);

  // Ancestros comunes para resaltar en el mini-árbol (calculados localmente)
  const ancestrosComunes = (() => {
    if (!arbol1 || !arbol2) return [];
    const idsA = collectIds(arbol1);
    const idsB = collectIds(arbol2);
    return [...idsA].filter(id => idsB.has(id));
  })();

  const seleccionar2 = async (a) => {
    setAnimal2(a);
    setCargando2(true);
    setMlResultado(null);
    setMlError(null);
    setIaTexto('');
    setIaError(null);
    try {
      const tree = await buildTree(a.id, allAnimals);
      setArbol2(tree);
    } finally {
      setCargando2(false);
    }
  };

  // ── Paso 2: análisis narrativo generado por la IA local (streaming) ───────
  const generarAnalisisIA = useCallback(async (idMacho, idHembra) => {
    setIaTexto('');
    setIaError(null);
    setIaCargando(true);
    try {
      await apiHelpers.postStream(
        '/genealogia/analisis-ia',
        { idMacho, idHembra, fechaReferencia: new Date().toISOString().split('T')[0] },
        (full) => setIaTexto(full),
      );
    } catch (err) {
      setIaError(err?.message || 'No se pudo generar el análisis con IA.');
    } finally {
      setIaCargando(false);
    }
  }, []);

  // Llamar al endpoint ML cuando tengamos los dos animales
  const evaluarML = useCallback(async () => {
    if (!animal1 || !animal2) return;

    // Validación previa local: mismo sexo
    if (animal1.sexo && animal2.sexo && animal1.sexo === animal2.sexo) {
      setMlResultado({ aviso: 'Ambos animales son del mismo sexo. La reproducción no es posible.' });
      return;
    }

    const idMacho  = animal1.sexo === 'macho'  ? animal1.id : animal2.id;
    const idHembra = animal1.sexo === 'hembra' ? animal1.id : animal2.id;

    setMlCargando(true);
    setMlError(null);
    setIaTexto('');
    setIaError(null);
    try {
      const res = await apiHelpers.post('/genealogia/compatibilidad', {
        idMacho,
        idHembra,
        fechaReferencia: new Date().toISOString().split('T')[0],
      });
      setMlResultado(res);
      // Paso 2: la IA interpreta el resultado del modelo (en streaming).
      generarAnalisisIA(idMacho, idHembra);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detalle || 'No se pudo conectar con el servicio de IA.';
      setMlError(msg);
    } finally {
      setMlCargando(false);
    }
  }, [animal1, animal2, generarAnalisisIA]);

  const regenerarIA = useCallback(() => {
    if (!animal1 || !animal2) return;
    const idMacho  = animal1.sexo === 'macho'  ? animal1.id : animal2.id;
    const idHembra = animal1.sexo === 'hembra' ? animal1.id : animal2.id;
    generarAnalisisIA(idMacho, idHembra);
  }, [animal1, animal2, generarAnalisisIA]);

  const candidatos = allAnimals.filter(a => {
    if (String(a.id) === String(animal1.id)) return false;
    const q = busqueda.toLowerCase();
    return !q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q);
  });

  // ── Mini-árbol con ancestros comunes resaltados ───────────────────────────
  const MiniArbol = ({ arbol, titulo }) => {
    if (!arbol) return (
      <div className="flex items-center justify-center h-32 text-gray-300">
        <GitBranch className="w-8 h-8" />
      </div>
    );
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
        <div className="flex justify-center overflow-x-auto py-2">
          <RamaHorizontal
            tarjeta={<NodoMini nodo={arbol} rol="principal" />}
            hijas={[
              <RamaHorizontal
                tarjeta={<NodoMini nodo={arbol.padre} rol="padre" />}
                hijas={[
                  <NodoMini nodo={arbol.padre?.padre} rol="abuelo_pp" />,
                  <NodoMini nodo={arbol.padre?.madre} rol="abuela_pp" />,
                ]} />,
              <RamaHorizontal
                tarjeta={<NodoMini nodo={arbol.madre} rol="madre" />}
                hijas={[
                  <NodoMini nodo={arbol.madre?.padre} rol="abuelo_mm" />,
                  <NodoMini nodo={arbol.madre?.madre} rol="abuela_mm" />,
                ]} />,
            ]} />
        </div>
      </div>
    );
  };

  // ── Tarjeta de una dimensión (con su evidencia: la "defensa" del dato) ─────
  const DimensionCard = ({ dim }) => {
    const [abierto, setAbierto] = useState(false);
    const esRiesgo = DIMS_RIESGO.has(dim.id);
    const Icono = ICONO_DIM[dim.id] || Activity;
    return (
      <div className="bg-white/70 rounded-xl border border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <Icono className={`w-4 h-4 ${colorScoreDim(dim.score)} shrink-0`} />
          <span className="flex-1 text-xs font-semibold text-gray-700">{dim.titulo}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colorConfianza(dim.confianza)}`}>
            {dim.confianza === 'sin_datos' ? 'sin datos' : `conf. ${dim.confianza}`}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dim.score}%`, background: colorBarraDim(dim.score) }} />
          </div>
          <span className={`text-sm font-bold ${colorScoreDim(dim.score)} tabular-nums w-9 text-right`}>{dim.score}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-gray-500">
            {dim.valor} · <span className="font-medium">{esRiesgo ? `riesgo ${dim.nivel}` : `nivel ${dim.nivel}`}</span>
          </span>
          {dim.evidencia?.length > 0 && (
            <button onClick={() => setAbierto(v => !v)}
              className="text-[10px] text-teal-600 hover:text-teal-800 flex items-center gap-0.5">
              {abierto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {abierto ? 'Ocultar evidencia' : 'Ver en qué se basa'}
            </button>
          )}
        </div>
        {abierto && dim.evidencia?.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2">
            {dim.evidencia.map((e, i) => (
              <li key={i} className="text-[11px] text-gray-500 flex gap-1.5">
                <span className="text-teal-400 shrink-0">•</span>{e}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // ── Render del resultado: evaluación multidimensional fundamentada ─────────
  const ResultadoML = ({ evaluacion }) => {
    const clasificacion = evaluacion?.clasificacion ?? 'Datos insuficientes';
    const cfg = CONFIG_CLASIFICACION[clasificacion] ?? CONFIG_CLASIFICACION['Datos insuficientes'];
    const score = evaluacion?.scoreGlobal ?? 0;
    const confianza = evaluacion?.confianzaGlobal ?? 'baja';
    const dims = evaluacion?.dimensiones ?? [];

    return (
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 shadow-sm`}>
        {/* Cabecera: veredicto + score global */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Evaluación del cruce</span>
            <div className="flex items-baseline gap-2 mt-1">
              {cfg.icon === 'ok'      && <CheckCircle2  className={`w-6 h-6 ${cfg.color} shrink-0`} />}
              {cfg.icon === 'warning' && <AlertTriangle className={`w-6 h-6 ${cfg.color} shrink-0`} />}
              {cfg.icon === 'x'       && <XCircle       className={`w-6 h-6 ${cfg.color} shrink-0`} />}
              {cfg.icon === 'info'    && <Info          className={`w-6 h-6 ${cfg.color} shrink-0`} />}
              <h3 className={`text-xl font-bold ${cfg.color}`}>{clasificacion}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{evaluacion?.recomendacionVeterinaria}</p>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-5xl font-black ${cfg.color}`}>{score}</div>
            <div className="text-xs text-gray-400 font-medium">/ 100</div>
            <span className={`mt-1 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${colorConfianza(confianza)}`}>
              confianza {confianza}
            </span>
          </div>
        </div>

        {/* Barra de score global */}
        <div className="mb-5">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: cfg.barra }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0 — No rec.</span>
            <span>50 — Precaución</span>
            <span>72 — Recomendado</span>
            <span>100</span>
          </div>
        </div>

        {/* Dimensiones evaluadas (cada una con su evidencia) */}
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Dimensiones evaluadas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {dims.map((d) => <DimensionCard key={d.id} dim={d} />)}
        </div>

        {confianza === 'baja' && (
          <p className="mt-4 text-[11px] text-amber-700 bg-amber-50 border-l-2 border-amber-300 pl-3 py-1.5 rounded-r">
            Confianza baja: faltan datos registrados de estos animales. Registra producción,
            historial reproductivo y sanitario para una evaluación más fiable.
          </p>
        )}
      </div>
    );
  };

  // ── Render principal ──────────────────────────────────────────────────────
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
            <p className="text-sm text-gray-500">
              Evaluación de cruce con IA · Score generado por modelo de Machine Learning
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: selector + botón evaluar */}
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" /> Segundo animal
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
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

          {/* Botón evaluar */}
          {animal2 && !cargando2 && (
            <button
              onClick={evaluarML}
              disabled={mlCargando}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold rounded-xl
                flex items-center justify-center gap-2 transition-colors shadow-sm">
              {mlCargando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluando con IA...</>
                : <><Brain className="w-4 h-4" /> Evaluar compatibilidad</>}
            </button>
          )}
        </div>

        {/* Columna derecha: árboles + resultado ML */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mini-árboles lado a lado */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5">
            <div className="grid grid-cols-2 gap-6 overflow-x-auto">
              <div className="min-w-0">
                <MiniArbol arbol={arbol1} titulo={`${animal1.codigo} — ${animal1.nombre}`} />
              </div>
              <div className="min-w-0 border-l border-dashed border-gray-200 pl-6">
                {cargando2 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                    <p className="text-xs text-gray-400">Cargando árbol...</p>
                  </div>
                ) : animal2 ? (
                  <MiniArbol arbol={arbol2} titulo={`${animal2.codigo} — ${animal2.nombre}`} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-300">
                    <Scale className="w-8 h-8" />
                    <p className="text-xs text-center">Selecciona el segundo animal</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estado de carga ML */}
          {mlCargando && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-teal-200 p-8 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
                <Brain className="w-7 h-7 text-teal-500 animate-pulse" />
              </div>
              <p className="font-semibold text-teal-700">El modelo está analizando el cruce...</p>
              <p className="text-xs text-gray-400 text-center">Calculando features genéticas, sanitarias y reproductivas</p>
            </div>
          )}

          {/* Error ML */}
          {mlError && !mlCargando && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Servicio ML no disponible</p>
                <p className="text-xs text-red-600 mt-1">{mlError}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Asegúrate de que el microservicio ML está corriendo en el servidor.
                </p>
              </div>
            </div>
          )}

          {/* Resultado: evaluación multidimensional */}
          {mlResultado && !mlCargando && !mlError && mlResultado.evaluacion && (
            <ResultadoML evaluacion={mlResultado.evaluacion} />
          )}

          {/* Aviso (p. ej. mismo sexo) */}
          {mlResultado && !mlCargando && !mlError && mlResultado.aviso && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{mlResultado.aviso}</p>
            </div>
          )}

          {/* Análisis IA (paso 2, streaming) — solo si hubo evaluación real */}
          {mlResultado && !mlCargando && !mlError &&
           mlResultado.evaluacion &&
           (iaCargando || iaTexto || iaError) && (
            <AnalisisIA
              texto={iaTexto}
              cargando={iaCargando}
              error={iaError}
              onRegenerar={regenerarIA}
            />
          )}

          {/* Placeholder inicial */}
          {!animal2 && !mlCargando && !mlResultado && (
            <div className="bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-gray-300">
              <Brain className="w-12 h-12" />
              <p className="text-sm font-medium text-gray-400 text-center">
                Selecciona un segundo animal y pulsa
                <br />
                &ldquo;Evaluar compatibilidad&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Vista: Ranking de candidatos ──────────────────────────────────────────────
const VistaRanking = ({ animal1, onVolver }) => {
  const [cargando,  setCargando]  = useState(false);
  const [ranking,   setRanking]   = useState(null);   // { base, total, ranking[] } | null
  const [error,     setError]     = useState(null);
  const [soloRaza,  setSoloRaza]  = useState(false);
  const [iaTexto,   setIaTexto]   = useState('');
  const [iaCargando,setIaCargando]= useState(false);

  const calcular = useCallback(async () => {
    setCargando(true); setError(null); setRanking(null); setIaTexto('');
    try {
      const res = await apiHelpers.post('/genealogia/ranking', {
        idAnimal: animal1.id, limite: 10, soloMismaRaza: soloRaza,
        fechaReferencia: new Date().toISOString().split('T')[0],
      });
      setRanking(res);
      // Resumen comparativo de la IA (streaming) si hay candidatos
      if (res?.ranking?.length) {
        setIaCargando(true);
        try {
          await apiHelpers.postStream('/genealogia/ranking/analisis-ia',
            { idAnimal: animal1.id, soloMismaRaza: soloRaza,
              fechaReferencia: new Date().toISOString().split('T')[0] },
            (full) => setIaTexto(full));
        } catch { /* la IA es complemento; el ranking ya se muestra */ }
        finally { setIaCargando(false); }
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'No se pudo calcular el ranking.');
    } finally {
      setCargando(false);
    }
  }, [animal1, soloRaza]);

  const sexoObjetivo = animal1.sexo === 'hembra' ? 'machos' : 'hembras';

  const colorScore = (s) =>
    s >= 72 ? 'text-emerald-600' : s >= 50 ? 'text-amber-600' : 'text-red-500';
  const bgClasif = (c) =>
    c === 'Recomendado' ? 'bg-emerald-100 text-emerald-700'
    : c === 'Precaución' ? 'bg-amber-100 text-amber-700'
    : c === 'No recomendado' ? 'bg-red-100 text-red-600'
    : 'bg-gray-100 text-gray-500';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-5 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Mejor cruce para {animal1.codigo} — {animal1.nombre}</h2>
            <p className="text-sm text-gray-500">Ranking de {sexoObjetivo} activos por compatibilidad (modelo ML)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={soloRaza} onChange={e => setSoloRaza(e.target.checked)}
              className="rounded text-violet-600 focus:ring-violet-500" />
            Solo de la misma raza
          </label>
          <button onClick={calcular} disabled={cargando}
            className="ml-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm">
            {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculando...</>
                      : <><Zap className="w-4 h-4" /> Calcular ranking</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3 mb-6">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {ranking && ranking.ranking.length === 0 && (
        <div className="bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400">
          No se encontraron candidatos con datos suficientes para evaluar.
        </div>
      )}

      {ranking && ranking.ranking.length > 0 && (
        <div className="space-y-6">
          {/* Tabla de ranking */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Candidatos ordenados ({ranking.total} evaluados)</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {ranking.ranking.map((r, i) => (
                <div key={r.candidato.id}
                  className={`flex items-center gap-4 px-5 py-3 ${i === 0 ? 'bg-emerald-50/50' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {r.candidato.codigo} — {r.candidato.nombre}
                      {i === 0 && <span className="ml-2 text-[10px] font-bold text-emerald-600 uppercase">★ Mejor opción</span>}
                    </p>
                    <p className="text-[11px] text-gray-400">{r.candidato.raza || 'raza desconocida'} · consanguinidad cría ≈ {Math.round((r.coi || 0) * 1000) / 10}%</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${bgClasif(r.clasificacion)}`}>{r.clasificacion}</span>
                  <div className="text-right w-14 shrink-0">
                    <span className={`text-2xl font-black ${colorScore(r.score)}`}>{r.score}</span>
                    <span className="text-[10px] text-gray-400">/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen comparativo IA */}
          {(iaCargando || iaTexto) && (
            <AnalisisIA texto={iaTexto} cargando={iaCargando} error={null} onRegenerar={calcular} />
          )}
        </div>
      )}

      {!ranking && !cargando && !error && (
        <div className="bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-gray-300">
          <TrendingUp className="w-12 h-12" />
          <p className="text-sm font-medium text-gray-400 text-center">
            Pulsa &ldquo;Calcular ranking&rdquo; para evaluar todos los {sexoObjetivo} disponibles.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const ModuloGenealogia = () => {
  const [vista, setVista] = useState('selector'); // 'selector' | 'arbol' | 'comparar' | 'ranking'
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

  if (vista === 'ranking' && animalSeleccionado) {
    return (
      <VistaRanking
        animal1={animalSeleccionado}
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
        onRankear={() => setVista('ranking')}
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
