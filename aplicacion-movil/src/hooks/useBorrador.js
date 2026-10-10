/** Borrador de una evaluación: cada cambio queda guardado en el teléfono. */

import { useCallback, useRef, useState } from 'react';
import { obtenerBorrador, guardarBorrador } from '@servicios/borradores';

export function useBorrador(id) {
  const ref = useRef(undefined);
  if (ref.current === undefined) ref.current = obtenerBorrador(id);
  const [, pintar] = useState(0);

  const cambiar = useCallback((fn) => {
    if (!ref.current) return;
    ref.current = guardarBorrador(typeof fn === 'function' ? fn(ref.current) : { ...ref.current, ...fn });
    pintar((n) => n + 1);
  }, []);

  return [ref.current, cambiar];
}
