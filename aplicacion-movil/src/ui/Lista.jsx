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

/**
 * Ícono en cuadro de tono suave (fondo al 15 % y trazo del color). `tono`:
 * marca, exito, info, aviso, critico, salvia o neutro. Se acepta el antiguo
 * `color` (clase bg-[#…]) y se traduce al tono equivalente.
 */
const TONOS = {
  marca: 'bg-acento/10 text-acento', exito: 'bg-exito/15 text-exito', info: 'bg-info/15 text-info',
  aviso: 'bg-aviso/15 text-aviso', critico: 'bg-critico/15 text-critico', salvia: 'bg-salvia/20 text-acento',
  neutro: 'bg-relleno text-secundario',
};
const DE_COLOR = {
  'bg-[#C62828]': 'critico', 'bg-[#1D5FA8]': 'info', 'bg-[#0F766E]': 'exito', 'bg-[#B45309]': 'aviso',
  'bg-[#1E7B45]': 'exito', 'bg-[#6E6E73]': 'neutro', 'bg-[#5B4BC4]': 'salvia', 'bg-acento': 'marca',
};
export const IconoFila = ({ Icono, tono, color }) => (
  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONOS[tono || DE_COLOR[color] || 'marca']}`} aria-hidden="true">
    <Icono className="w-5 h-5" strokeWidth={2.1} />
  </span>
);

export function Fila({ icono, titulo, sub, valor, alHacerClic, flecha, derecha, critico = false, sangria }) {
  const Etiqueta = alHacerClic ? 'button' : 'div';
  return (
    <Etiqueta onClick={alHacerClic} className="fila" style={{ '--sangria': sangria ?? (icono ? '64px' : '16px') }}>
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
