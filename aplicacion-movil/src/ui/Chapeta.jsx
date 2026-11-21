/**
 * Chapeta: el elemento de firma de la app.
 *
 * Cada animal se identifica en el corral por la chapeta amarilla de su oreja,
 * así que su código se muestra con esa misma forma: placa amarilla, agujero
 * del pasador y el código en negro. El texto oscuro sobre el amarillo da
 * 10,44:1 en ambos modos, por eso no cambia con el tema.
 */

const TAMANOS = {
  sm: { caja: 'h-7 pl-5 pr-2.5 text-[13px]', agujero: 'w-1.5 h-1.5 left-2' },
  md: { caja: 'h-9 pl-7 pr-3.5 text-[15px]', agujero: 'w-2 h-2 left-2.5' },
  lg: { caja: 'h-12 pl-9 pr-5 text-[20px]', agujero: 'w-2.5 h-2.5 left-3.5' },
};

export default function Chapeta({ codigo, tamano = 'md', vieja = false, className = '' }) {
  if (!codigo) return null;
  const t = TAMANOS[tamano];
  return (
    <span
      className={`relative inline-flex items-center rounded-[10px] rounded-l-[16px] font-sans font-bold tabular-nums
                  tracking-tight text-[#343A35] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] ${t.caja} ${className}`}
      style={{ background: vieja ? '#E8D3A6' : 'rgb(var(--chapeta))' }}
      aria-label={`Chapeta ${vieja ? 'vieja ' : ''}${codigo}`}
    >
      <span className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-[#343A35]/35 ${t.agujero}`} aria-hidden="true" />
      {codigo}
    </span>
  );
}

/** Código principal de un animal: la chapeta nueva si existe, si no la vieja. */
export const codigoDe = (a) => a?.chapetaNueva || a?.chapetaVieja || a?.codigo || '';
