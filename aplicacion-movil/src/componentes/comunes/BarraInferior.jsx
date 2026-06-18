/**
 * Barra de navegación inferior fija (Inicio / Buscar / Salud / Sync).
 * Se muestra en las pantallas principales cuando hay sesión iniciada.
 */

import { NavLink } from 'react-router-dom';
import { Home, Search, RefreshCw } from 'lucide-react';
import { useSincronizacion } from '@hooks/useSincronizacion';

const ITEMS = [
  { ruta: '/', etiqueta: 'Inicio', Icono: Home, exacta: true },
  { ruta: '/buscar', etiqueta: 'Buscar', Icono: Search },
  { ruta: '/sincronizacion', etiqueta: 'Sync', Icono: RefreshCw, badge: true },
];

export default function BarraInferior() {
  const { pendientes } = useSincronizacion();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200
                 flex justify-around items-stretch shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map(({ ruta, etiqueta, Icono, exacta, badge }) => (
        <NavLink
          key={ruta}
          to={ruta}
          end={exacta}
          className={({ isActive }) =>
            `relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[58px]
             ${isActive ? 'text-green-600' : 'text-gray-400'} active:bg-gray-50 transition-colors`
          }
        >
          <span className="relative">
            <Icono className="w-6 h-6" />
            {badge && pendientes > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full
                               bg-red-600 text-white text-[10px] font-bold flex items-center
                               justify-center ring-2 ring-white">
                {pendientes}
              </span>
            )}
          </span>
          <span className="text-[11px] font-medium">{etiqueta}</span>
        </NavLink>
      ))}
    </nav>
  );
}
