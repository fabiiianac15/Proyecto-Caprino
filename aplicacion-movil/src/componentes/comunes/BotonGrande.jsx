/**
 * Botón grande optimizado para uso en campo (con guantes, sol directo).
 * Estética acoplada a la web (verde, rounded-xl). Acepta un ícono opcional.
 */

import clsx from 'clsx';

export default function BotonGrande({
  children,
  variante = 'primario',
  Icono,
  className,
  type = 'button',
  ...props
}) {
  const variantes = {
    primario: 'bg-green-600 text-white active:bg-green-700 shadow-sm',
    secundario: 'bg-white text-green-700 border-2 border-green-600 active:bg-green-50',
    peligro: 'bg-red-600 text-white active:bg-red-700 shadow-sm',
    neutro: 'bg-gray-100 text-gray-800 active:bg-gray-200 border border-gray-200',
  };

  return (
    <button
      type={type}
      className={clsx(
        'w-full min-h-[56px] rounded-xl px-5 text-lg font-semibold',
        'flex items-center justify-center gap-2',
        'disabled:opacity-50 transition-colors select-none',
        variantes[variante],
        className
      )}
      {...props}
    >
      {Icono && <Icono className="w-5 h-5" />}
      {children}
    </button>
  );
}
