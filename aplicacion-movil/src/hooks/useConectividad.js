/**
 * Hook de conectividad: devuelve si el dispositivo está en línea y reacciona
 * a los cambios de red en tiempo real.
 */

import { useEffect, useState } from 'react';
import { estaConectado, escucharConectividad } from '@servicios/conectividad';

export function useConectividad() {
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    let montado = true;

    estaConectado().then((c) => {
      if (montado) setEnLinea(c);
    });

    const cancelar = escucharConectividad((c) => {
      if (montado) setEnLinea(c);
    });

    return () => {
      montado = false;
      cancelar();
    };
  }, []);

  return enLinea;
}
