import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Search, User, Heart, Users, Dna, Scale, TrendingUp, Loader2, Brain } from 'lucide-react';
import { apiHelpers } from '../servicios/api';
import VistaArbol from './genealogia/VistaArbol';
import VistaCruce from './genealogia/VistaCruce';
import VistaRanking from './genealogia/VistaRanking';
import PanelModelo from './genealogia/PanelModelo';
import { edadTexto } from './genealogia/comun';

const edadMeses = (f) => (f ? (Date.now() - new Date(f).getTime()) / (1000 * 60 * 60 * 24 * 30.44) : null);

// ── Portada: elegir el animal ─────────────────────────────────────────────────
const SelectorAnimal = ({ animales, cargando, onSeleccionar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');

  const activos = animales.filter((a) => a.estado === 'activo');
  const q = busqueda.toLowerCase();
  const filtrados = activos.filter((a) =>
    (!q || a.codigo?.toLowerCase().includes(q) || a.nombre?.toLowerCase().includes(q) || (a.nombreRaza || '').toLowerCase().includes(q))
    && (!filtroSexo || a.sexo === filtroSexo));

  const PASOS = [
    { icon: GitBranch, titulo: 'Explore el linaje', desc: 'Árbol horizontal de 4 generaciones; vincule padres, abuelos y bisabuelos.' },
    { icon: TrendingUp, titulo: 'Busque la mejor pareja', desc: 'El sistema evalúa a todos los candidatos del rebaño y los ordena.' },
    { icon: Scale, titulo: 'Evalúe el cruce', desc: 'Consanguinidad exacta, leche esperada de las hijas, probabilidad de parto e IA.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl shadow-lg p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-8"><Dna className="w-48 h-48" /></div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><Dna className="w-6 h-6" /></div>
            <div>
              <h2 className="text-2xl font-bold leading-tight">Genealogía y mejoramiento genético</h2>
              <p className="text-teal-100 text-sm">Linaje del rebaño y selección de los mejores cruces con inteligencia artificial</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { icon: Users, val: activos.length, label: 'Animales activos' },
              { icon: User, val: activos.filter((a) => a.sexo === 'macho').length, label: 'Machos ♂' },
              { icon: Heart, val: activos.filter((a) => a.sexo === 'hembra').length, label: 'Hembras ♀' },
              { icon: GitBranch, val: animales.length, label: 'En el pedigrí (incl. históricos)' },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <s.icon className="w-4 h-4 text-teal-100" />
                <div>
                  <p className="text-xl font-black leading-none">{s.val}</p>
                  <p className="text-[11px] text-teal-100 leading-none mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PASOS.map((p, i) => (
          <div key={p.titulo} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-600"><p.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Paso {i + 1}</p>
              <p className="text-sm font-bold text-gray-800">{p.titulo}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <PanelModelo />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por código, nombre o raza..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50" />
        </div>
        <div className="flex gap-2 shrink-0">
          {[['', 'Todos'], ['macho', '♂ Machos'], ['hembra', '♀ Hembras']].map(([v, l]) => (
            <button key={v} onClick={() => setFiltroSexo(v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${filtroSexo === v
                ? v === '' ? 'bg-teal-600 text-white border-teal-600' : v === 'macho' ? 'bg-blue-600 text-white border-blue-600' : 'bg-pink-600 text-white border-pink-600'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 shrink-0">{filtrados.length} de {activos.length}</p>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-gray-500 text-sm">Cargando animales...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">{activos.length ? 'No se encontraron animales con esos filtros' : 'Aún no hay animales activos registrados'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((a) => {
            const esMacho = a.sexo === 'macho';
            return (
              <button key={a.id} onClick={() => onSeleccionar(a)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left overflow-hidden group">
                <div className={`h-1.5 ${esMacho ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-pink-400 to-pink-600'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${esMacho ? 'bg-blue-50 border border-blue-100' : 'bg-pink-50 border border-pink-100'}`}>
                      {esMacho ? <User className="w-5 h-5 text-blue-500" /> : <Heart className="w-5 h-5 text-pink-500" />}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esMacho ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {esMacho ? '♂ Macho' : '♀ Hembra'}
                    </span>
                  </div>
                  <p className="text-base font-bold text-gray-800 truncate">{a.nombre || <span className="italic text-gray-400 font-normal">Sin nombre</span>}</p>
                  <p className="text-xs font-mono text-gray-400">{a.codigo}</p>
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {[a.nombreRaza, edadTexto(edadMeses(a.fechaNacimiento))].filter(Boolean).join(' · ') || 'Sin raza ni edad registradas'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-teal-600 group-hover:text-teal-700">
                    <span className="text-xs font-semibold flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Árbol y mejores cruces</span>
                    <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 justify-center">
        <Brain className="w-3.5 h-3.5" /> Mientras más partos, producción, salud y pedigrí registre, más precisas serán las recomendaciones.
      </p>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const ModuloGenealogia = () => {
  const [vista, setVista] = useState('selector'); // selector | arbol | cruce | ranking
  const [animales, setAnimales] = useState([]);
  const [cargandoAnimales, setCargandoAnimales] = useState(true);
  const [animal, setAnimal] = useState(null);
  const [arbol, setArbol] = useState(null);
  const [cargandoArbol, setCargandoArbol] = useState(false);
  const [parejaInicial, setParejaInicial] = useState(null);

  // Todos los animales, incluidos los muertos: pueden ser ancestros en el pedigrí
  useEffect(() => {
    (async () => {
      try {
        const [vigentes, muertos] = await Promise.all([
          apiHelpers.get('/animales'),
          apiHelpers.get('/animales', { estado: 'muerto' }).catch(() => ({ data: [] })),
        ]);
        const porId = new Map();
        [...(vigentes?.data || []), ...(muertos?.data || [])].forEach((a) => porId.set(a.id, a));
        setAnimales([...porId.values()]);
      } catch (e) {
        console.error('Error cargando animales:', e);
      } finally {
        setCargandoAnimales(false);
      }
    })();
  }, []);

  const cargarArbol = useCallback(async (a) => {
    setCargandoArbol(true);
    try {
      const res = await apiHelpers.get(`/genealogia/arbol/${a.id}`, { generaciones: 3 });
      setArbol(res?.data ?? null);
    } catch {
      setArbol(null);
    } finally {
      setCargandoArbol(false);
    }
  }, []);

  const seleccionar = (a) => {
    setAnimal(a);
    setVista('arbol');
    cargarArbol(a);
  };

  if (vista === 'cruce' && animal) {
    return <VistaCruce key={parejaInicial?.id || 'nuevo'} animal1={animal} parejaInicial={parejaInicial}
      allAnimals={animales} onVolver={() => setVista(parejaInicial ? 'ranking' : 'arbol')} />;
  }
  if (vista === 'ranking' && animal) {
    return <VistaRanking animal1={animal} onVolver={() => setVista('arbol')}
      onVerCruce={(c) => { setParejaInicial(animales.find((x) => x.id === c.id) || c); setVista('cruce'); }} />;
  }
  if (vista === 'arbol' && animal) {
    return (
      <VistaArbol
        arbol={arbol}
        allAnimals={animales}
        cargando={cargandoArbol}
        animalBase={animal}
        onVolver={() => { setVista('selector'); setAnimal(null); setArbol(null); }}
        onComparar={() => { setParejaInicial(null); setVista('cruce'); }}
        onRankear={() => setVista('ranking')}
        onActualizar={() => cargarArbol(animal)}
      />
    );
  }
  return <SelectorAnimal animales={animales} cargando={cargandoAnimales} onSeleccionar={seleccionar} />;
};

export default ModuloGenealogia;
