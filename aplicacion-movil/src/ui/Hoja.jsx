/**
 * Hoja inferior para una tarea corta. Tiene agarradera, se cierra al deslizar
 * hacia abajo, al tocar fuera y con el botón Cerrar (siempre hay otra salida
 * además de terminar la tarea).
 */

import { useEffect, useRef, useState } from 'react';

export default function Hoja({ abierta, alCerrar, titulo, children, alta = false }) {
  const [arrastre, setArrastre] = useState(0);
  const inicio = useRef(null);

  useEffect(() => {
    if (!abierta) return undefined;
    setArrastre(0);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [abierta]);

  if (!abierta) return null;

  const alTocar = (e) => { inicio.current = e.touches[0].clientY; };
  const alMover = (e) => {
    if (inicio.current == null) return;
    setArrastre(Math.max(0, e.touches[0].clientY - inicio.current));
  };
  const alSoltar = () => {
    if (arrastre > 110) alCerrar(); else setArrastre(0);
    inicio.current = null;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button className="absolute inset-0 bg-black/40" onClick={alCerrar} aria-label="Cerrar" />
      <div className={`relative w-full max-w-md bg-fondo rounded-t-[20px] animar-hoja flex flex-col ${alta ? 'h-[92vh]' : 'max-h-[88vh]'}`}
        style={{ transform: arrastre ? `translateY(${arrastre}px)` : undefined, transition: arrastre ? 'none' : 'transform 0.2s' }}>
        <div onTouchStart={alTocar} onTouchMove={alMover} onTouchEnd={alSoltar} className="shrink-0 pt-2 pb-1 touch-none">
          <div className="w-9 h-[5px] rounded-full bg-terciario/60 mx-auto" aria-hidden="true" />
          <div className="flex items-center min-h-[44px] px-4">
            <h2 className="flex-1 t-encabezado truncate">{titulo}</h2>
            <button onClick={alCerrar} className="t-cuerpo text-acento min-h-[44px] pl-3 active:opacity-60">Cerrar</button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain pb-6 seguro-abajo">{children}</div>
      </div>
    </div>
  );
}
