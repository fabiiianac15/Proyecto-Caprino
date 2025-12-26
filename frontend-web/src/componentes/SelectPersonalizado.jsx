/**
 * Componente Select Personalizado con Iconos
 * Dropdown mejorado visualmente con iconos y búsqueda
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

const SelectPersonalizado = ({ 
  valor, 
  onChange, 
  opciones = [], 
  placeholder = "Seleccionar...",
  className = "",
  error = false,
  requerido = false,
  deshabilitado = false
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const selectRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const manejarClickFuera = (evento) => {
      if (selectRef.current && !selectRef.current.contains(evento.target)) {
        setAbierto(false);
        setBusqueda('');
      }
    };

    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, []);

  // Filtrar opciones según búsqueda
  const opcionesFiltradas = opciones.filter(opcion => 
    opcion.label.toLowerCase().includes(busqueda.toLowerCase())
  );

  const opcionSeleccionada = opciones.find(op => op.value === valor);

  const manejarSeleccion = (opcion) => {
    onChange(opcion.value);
    setAbierto(false);
    setBusqueda('');
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => !deshabilitado && setAbierto(!abierto)}
        disabled={deshabilitado}
        className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center justify-between transition-all ${
          error 
            ? 'border-red-300 focus:ring-2 focus:ring-red-500' 
            : abierto
            ? 'border-green-500 ring-2 ring-green-500'
            : 'border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500'
        } ${deshabilitado ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {opcionSeleccionada ? (
            <>
              {opcionSeleccionada.icono && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${opcionSeleccionada.colorFondo} flex items-center justify-center`}>
                  {React.cloneElement(opcionSeleccionada.icono, { 
                    className: `w-5 h-5 ${opcionSeleccionada.colorIcono}` 
                  })}
                </div>
              )}
              <span className="font-medium text-gray-800 truncate">{opcionSeleccionada.label}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
            abierto ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {abierto && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* Barra de búsqueda */}
          {opciones.length > 5 && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Lista de opciones */}
          <div className="max-h-64 overflow-y-auto">
            {opcionesFiltradas.length > 0 ? (
              opcionesFiltradas.map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => manejarSeleccion(opcion)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    valor === opcion.value ? 'bg-green-50' : ''
                  }`}
                >
                  {/* Icono */}
                  {opcion.icono && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${opcion.colorFondo} flex items-center justify-center`}>
                      {React.cloneElement(opcion.icono, { 
                        className: `w-5 h-5 ${opcion.colorIcono}` 
                      })}
                    </div>
                  )}

                  {/* Label */}
                  <span className={`flex-1 text-left font-medium ${
                    valor === opcion.value ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {opcion.label}
                  </span>

                  {/* Check cuando está seleccionado */}
                  {valor === opcion.value && (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPersonalizado;
