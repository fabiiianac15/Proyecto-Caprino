import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, CheckCircle } from 'lucide-react';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white';

const SelectAnimal = ({ animales = [], value, onChange, busqueda = '', onBusqueda, colorFocus = 'focus:ring-blue-500' }) => {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const animalSeleccionado = animales.find(a => a.id === value);
  const animalesFiltrados = busqueda
    ? animales.filter(a =>
        a.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : animales;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)}
        className={`${inp} ${colorFocus} text-left flex items-center justify-between`}>
        {animalSeleccionado
          ? <span className="truncate">
              <span className="font-mono font-semibold">{animalSeleccionado.codigo}</span>
              {animalSeleccionado.nombre ? ` — ${animalSeleccionado.nombre}` : ''}
            </span>
          : <span className="text-gray-400">{animales.length === 0 ? 'Cargando animales...' : 'Seleccionar animal...'}</span>
        }
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-2 ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                autoFocus
                type="text"
                value={busqueda}
                onChange={e => onBusqueda(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {animalesFiltrados.length === 0
              ? <p className="text-center text-sm text-gray-400 py-4">Sin resultados</p>
              : animalesFiltrados.map(a => (
                <button key={a.id} type="button"
                  onClick={() => { onChange(a.id); setAbierto(false); onBusqueda(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between ${value === a.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                  <span>
                    <span className="font-mono font-semibold">{a.codigo}</span>
                    {a.nombre ? ` — ${a.nombre}` : ''}
                    {a.sexo ? <span className="ml-1 text-xs text-gray-400">({a.sexo})</span> : null}
                  </span>
                  {value === a.id && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectAnimal;
