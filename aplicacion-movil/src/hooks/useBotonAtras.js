/**
 * Deja que una pantalla atienda el botón atrás de Android (por ejemplo para
 * volver al paso anterior de un asistente). Si `manejar` devuelve true, la
 * app no navega.
 */

import { useEffect, useRef } from 'react';

export function useBotonAtras(manejar) {
  const ref = useRef(manejar);
  ref.current = manejar;
  useEffect(() => {
    const alPulsar = (e) => { if (ref.current()) e.preventDefault(); };
    window.addEventListener('boton-atras', alPulsar);
    return () => window.removeEventListener('boton-atras', alPulsar);
  }, []);
}
