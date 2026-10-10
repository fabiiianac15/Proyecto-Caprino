/**
 * Barra de pestañas: solo navega entre las cuatro secciones, nunca ejecuta
 * acciones. Siempre visible en las pantallas raíz, con etiqueta en cada una.
 */

import { NavLink } from 'react-router-dom';
import { Home, Tag, ClipboardCheck, Settings } from 'lucide-react';
import { useSincronizacion } from '@hooks/useSincronizacion';

const PESTANAS = [
  { ruta: '/', etiqueta: 'Inicio', Icono: Home, exacta: true, insignia: true },
  { ruta: '/rebano', etiqueta: 'Rebaño', Icono: Tag },
  { ruta: '/evaluar', etiqueta: 'Evaluar', Icono: ClipboardCheck },
  { ruta: '/ajustes', etiqueta: 'Ajustes', Icono: Settings },
];

export const ALTO_PESTANAS = 56;

export default function Pestanas() {
  const { pendientes } = useSincronizacion();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 vidrio border-t border-separador/60 seguro-abajo" aria-label="Secciones">
      <div className="flex max-w-md mx-auto" style={{ height: ALTO_PESTANAS }}>
        {PESTANAS.map(({ ruta, etiqueta, Icono, exacta, insignia }) => (
          <NavLink key={ruta} to={ruta} end={exacta}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-acento' : 'text-secundario'} active:opacity-60`}>
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icono className="w-[26px] h-[26px]" strokeWidth={isActive ? 2.4 : 1.9} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.16 : 0} />
                  {insignia && pendientes > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-critico text-white text-[11px] font-bold flex items-center justify-center"
                      aria-label={`${pendientes} pendientes por enviar`}>
                      {pendientes}
                    </span>
                  )}
                </span>
                <span className="text-[11px] leading-[13px] font-medium">{etiqueta}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
