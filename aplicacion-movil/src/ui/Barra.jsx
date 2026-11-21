/**
 * Barra superior.
 *
 * - `grande`: encabezado verde bosque de las pantallas raíz (Inicio, Rebaño,
 *   Evaluar, Ajustes), con esquinas inferiores redondeadas. Puede llevar
 *   contenido extra debajo del título (estado de conexión, búsqueda…).
 * - normal: barra fija con "Atrás" para las pantallas que se abren encima.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Barra({ titulo, grande = false, atras = false, alVolver, accion, subtitulo, children }) {
  const navigate = useNavigate();
  const volver = alVolver || (() => navigate(-1));

  if (grande) {
    return (
      <header className="bg-marca text-sobre-marca rounded-b-[24px] seguro-arriba mb-4">
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="t-grande">{titulo}</h1>
              {subtitulo && <p className="t-sub text-sobre-marca/85 mt-0.5">{subtitulo}</p>}
            </div>
            {accion && <div className="shrink-0 -mr-2">{accion}</div>}
          </div>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 seguro-arriba vidrio border-b border-separador/70">
      <div className="flex items-center min-h-[52px] px-2">
        <div className="w-[88px] flex items-center">
          {atras && (
            <button onClick={volver} className="flex items-center gap-0.5 min-h-[44px] pr-3 text-acento active:opacity-60" aria-label="Atrás">
              <ChevronLeft className="w-6 h-6 -mr-0.5" strokeWidth={2.4} />
              <span className="t-cuerpo font-medium">Atrás</span>
            </button>
          )}
        </div>
        <h1 className="flex-1 text-center t-seccion truncate">{titulo}</h1>
        <div className="w-[88px] flex items-center justify-end pr-2">{accion}</div>
      </div>
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

/** Botón redondo para el encabezado verde (por ejemplo, escanear). */
export const BotonEncabezado = ({ Icono, etiqueta, alHacerClic }) => (
  <button onClick={alHacerClic} aria-label={etiqueta}
    className="w-11 h-11 rounded-xl bg-sobre-marca/15 flex items-center justify-center active:opacity-60">
    <Icono className="w-6 h-6 text-sobre-marca" />
  </button>
);
