import React, { useEffect, useState } from 'react';
import { TAMANOS, leerLetra, aplicarLetra } from '../utilidades/tamanoLetra';

/** Tres botones A / A+ / A++ para agrandar la letra de todo el sistema. */
const ControlLetra = ({ claro = false, className = '' }) => {
  const [actual, setActual] = useState(leerLetra());
  useEffect(() => {
    const oir = (e) => setActual(e.detail);
    window.addEventListener('capriva:letra', oir);
    return () => window.removeEventListener('capriva:letra', oir);
  }, []);
  return (
    <div role="group" aria-label="Tamaño de la letra"
      className={`inline-flex items-center rounded-xl p-1 ${claro ? 'bg-white/15' : 'bg-gray-100'} ${className}`}>
      {TAMANOS.map((t, k) => (
        <button key={t.valor} type="button" title={t.titulo} aria-pressed={actual === t.valor}
          onClick={() => aplicarLetra(t.valor)}
          className={`px-2.5 py-1 rounded-lg font-bold leading-none transition ${['text-sm', 'text-base', 'text-lg'][k]} ${
            actual === t.valor
              ? (claro ? 'bg-white text-gray-900 shadow' : 'bg-white text-emerald-700 shadow')
              : (claro ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-800')}`}>
          {t.etiqueta}
        </button>
      ))}
    </div>
  );
};

export default ControlLetra;
