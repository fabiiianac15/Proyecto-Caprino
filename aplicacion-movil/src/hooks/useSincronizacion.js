/**
 * Hook de sincronización.
 *
 * - Mantiene el contador de pendientes.
 * - Dispara la sincronización automáticamente cuando se recupera la conexión.
 * - Expone `sincronizarAhora()` para la pantalla de Sincronización.
 *
 * El contador se refresca escuchando el evento global 'cola-actualizada', que
 * emiten las pantallas al encolar un registro.
 */

import { useCallback, useEffect, useState } from 'react';
import { contarPendientes } from '@servicios/almacenamientoLocal';
import { sincronizarCola } from '@servicios/sincronizacion';
import { useConectividad } from './useConectividad';

export function useSincronizacion() {
  const enLinea = useConectividad();
  const [pendientes, setPendientes] = useState(() => contarPendientes());
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState(null);

  const refrescar = useCallback(() => {
    setPendientes(contarPendientes());
  }, []);

  const sincronizarAhora = useCallback(async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarCola();
      setUltimoResultado(resultado);
      return resultado;
    } finally {
      setSincronizando(false);
      refrescar();
    }
  }, [refrescar]);

  // Auto-sync al recuperar conexión si hay pendientes.
  useEffect(() => {
    if (enLinea && contarPendientes() > 0) {
      sincronizarAhora();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enLinea]);

  // Refresca el contador cuando alguna pantalla encola algo.
  useEffect(() => {
    window.addEventListener('cola-actualizada', refrescar);
    return () => window.removeEventListener('cola-actualizada', refrescar);
  }, [refrescar]);

  return { enLinea, pendientes, sincronizando, ultimoResultado, sincronizarAhora, refrescar };
}
