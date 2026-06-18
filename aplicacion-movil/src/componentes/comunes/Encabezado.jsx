/**
 * Encabezado de página interna con botón de retroceso. Barra verde tipo web.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function Encabezado({ titulo, volverA = -1 }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-2 px-2 py-3 bg-green-600 text-white sticky top-0 z-10 shadow-sm">
      <button
        onClick={() => navigate(volverA)}
        className="w-11 h-11 flex items-center justify-center rounded-full active:bg-green-700"
        aria-label="Volver"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <h1 className="text-lg font-bold truncate">{titulo}</h1>
    </header>
  );
}
