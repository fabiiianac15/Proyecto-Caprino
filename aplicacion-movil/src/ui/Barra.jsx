/**
 * Barra de navegación superior.
 *
 * Las acciones de la pantalla van aquí; la navegación entre secciones va en
 * la barra de pestañas. El título grande se usa en las pantallas raíz.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Barra({ titulo, grande = false, atras = false, alVolver, accion, subtitulo }) {
  const navigate = useNavigate();
  const volver = alVolver || (() => navigate(-1));
  return (
    <header className={`sticky top-0 z-20 seguro-arriba ${grande ? 'bg-fondo' : 'vidrio border-b border-separador/60'}`}>
      <div className="flex items-center min-h-[44px] px-2">
        <div className="w-[88px] flex items-center">
          {atras && (
            <button onClick={volver} className="flex items-center gap-0.5 min-h-[44px] pr-3 text-acento active:opacity-60" aria-label="Atrás">
              <ChevronLeft className="w-6 h-6 -mr-0.5" strokeWidth={2.4} />
              <span className="t-cuerpo">Atrás</span>
            </button>
          )}
        </div>
        <h1 className={`flex-1 text-center t-encabezado truncate ${grande ? 'opacity-0' : ''}`}>{titulo}</h1>
        <div className="w-[88px] flex items-center justify-end pr-2">{accion}</div>
      </div>
      {grande && (
        <div className="px-4 pb-2">
          <h1 className="t-grande">{titulo}</h1>
          {subtitulo && <p className="t-sub text-secundario mt-0.5">{subtitulo}</p>}
        </div>
      )}
    </header>
  );
}

/** Acción de texto para el lado derecho de la barra. */
export const AccionBarra = ({ children, alHacerClic, fuerte = false, deshabilitado = false }) => (
  <button onClick={alHacerClic} disabled={deshabilitado}
    className={`min-h-[44px] px-1 text-acento active:opacity-60 disabled:opacity-40 ${fuerte ? 't-encabezado' : 't-cuerpo'}`}>
    {children}
  </button>
);
