/**
 * Listas agrupadas con margen (el patrón de Ajustes): secciones con cabecera
 * y pie, filas de al menos 48 px de alto y separadores que respetan la sangría
 * del icono.
 */

import { ChevronRight } from 'lucide-react';

export function Seccion({ titulo, pie, children, className = '' }) {
  return (
    <section className={`px-4 ${className}`}>
      {titulo && <h2 className="cabecera-seccion">{titulo}</h2>}
      <div className="lista">{children}</div>
      {pie && <p className="pie-seccion">{pie}</p>}
    </section>
  );
}

/** Icono en cuadro de color, como en Ajustes. `color` es una clase bg-*. */
export const IconoFila = ({ Icono, color = 'bg-acento' }) => (
  <span className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 ${color}`} aria-hidden="true">
    <Icono className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
  </span>
);

export function Fila({ icono, titulo, sub, valor, alHacerClic, flecha, derecha, critico = false, sangria }) {
  const Etiqueta = alHacerClic ? 'button' : 'div';
  return (
    <Etiqueta onClick={alHacerClic} className="fila" style={{ '--sangria': sangria ?? (icono ? '58px' : '16px') }}>
      {icono}
      <span className="flex-1 min-w-0">
        <span className={`block t-cuerpo ${critico ? 'text-critico' : ''}`}>{titulo}</span>
        {sub && <span className="block t-nota text-secundario mt-0.5">{sub}</span>}
      </span>
      {valor != null && <span className="t-cuerpo text-secundario shrink-0 max-w-[55%] text-right truncate">{valor}</span>}
      {derecha}
      {(flecha ?? !!alHacerClic) && <ChevronRight className="w-5 h-5 text-terciario shrink-0 -mr-1" aria-hidden="true" />}
    </Etiqueta>
  );
}

/** Fila con un campo de texto alineado a la derecha. */
export function FilaCampo({ etiqueta, ...props }) {
  return (
    <label className="fila">
      <span className="t-cuerpo shrink-0">{etiqueta}</span>
      <input className="campo-fila" {...props} />
    </label>
  );
}

/** Fila con interruptor. */
export function FilaInterruptor({ titulo, sub, valor, alCambiar }) {
  return (
    <label className="fila cursor-pointer">
      <span className="flex-1 min-w-0">
        <span className="block t-cuerpo">{titulo}</span>
        {sub && <span className="block t-nota text-secundario mt-0.5">{sub}</span>}
      </span>
      <input type="checkbox" role="switch" checked={!!valor} onChange={(e) => alCambiar(e.target.checked)} className="sr-only peer" />
      <span className="w-[51px] h-[31px] rounded-full bg-relleno peer-checked:bg-acento relative transition-colors shrink-0
                       after:absolute after:top-[2px] after:left-[2px] after:w-[27px] after:h-[27px] after:rounded-full after:bg-white
                       after:shadow after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-acento" />
    </label>
  );
}

export function EstadoVacio({ Icono, titulo, texto, children }) {
  return (
    <div className="px-8 py-14 text-center">
      {Icono && <Icono className="w-12 h-12 mx-auto text-terciario mb-3" strokeWidth={1.6} aria-hidden="true" />}
      <p className="t-encabezado">{titulo}</p>
      {texto && <p className="t-sub text-secundario mt-1">{texto}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
