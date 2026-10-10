/** Botones, control segmentado y contador. Todos con al menos 44 px de toque. */

import { Minus, Plus } from 'lucide-react';

const VARIANTES = {
  lleno: 'bg-acento text-sobre-acento',
  tintado: 'bg-acento/15 text-acento',
  gris: 'bg-relleno text-texto',
  critico: 'bg-critico/[0.12] text-critico',
};

export function Boton({ variante = 'lleno', Icono, children, className = '', ...props }) {
  return (
    <button {...props}
      className={`w-full min-h-[50px] rounded-[14px] px-5 t-encabezado flex items-center justify-center gap-2
                  active:opacity-70 disabled:opacity-40 transition-opacity ${VARIANTES[variante]} ${className}`}>
      {Icono && <Icono className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Segmentado({ opciones, valor, alCambiar, etiqueta }) {
  return (
    <div className="flex p-[2px] rounded-[9px] bg-relleno" role="radiogroup" aria-label={etiqueta}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button key={o.valor} type="button" role="radio" aria-checked={activo} onClick={() => alCambiar(o.valor)}
            className={`flex-1 min-h-[34px] rounded-[7px] px-2 t-sub transition-colors
                        ${activo ? 'bg-elevado shadow-sm font-semibold text-texto' : 'text-texto/80'}`}>
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/** Contador para los conteos del muestreo: se toca más fácil que un teclado. */
export function Contador({ valor, alCambiar, minimo = 0, maximo = 9999, etiqueta }) {
  const n = valor === '' || valor == null ? null : Number(valor);
  const poner = (v) => alCambiar(Math.max(minimo, Math.min(maximo, v)));
  return (
    <div className="flex items-center gap-2" role="group" aria-label={etiqueta}>
      <button type="button" onClick={() => poner((n ?? 0) - 1)} disabled={n === null || n <= minimo}
        className="w-11 h-11 rounded-full bg-relleno flex items-center justify-center active:opacity-60 disabled:opacity-35" aria-label="Restar uno">
        <Minus className="w-5 h-5" />
      </button>
      <input type="number" inputMode="numeric" value={valor ?? ''} placeholder="0"
        onChange={(e) => alCambiar(e.target.value === '' ? '' : Math.max(minimo, Math.min(maximo, Number(e.target.value))))}
        className="w-16 h-11 text-center t-titulo bg-transparent focus:outline-none tabular-nums" aria-label={etiqueta} />
      <button type="button" onClick={() => poner((n ?? 0) + 1)} disabled={n !== null && n >= maximo}
        className="w-11 h-11 rounded-full bg-relleno flex items-center justify-center active:opacity-60 disabled:opacity-35" aria-label="Sumar uno">
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
