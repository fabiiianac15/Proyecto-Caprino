/**
 * Motor de sincronización.
 *
 * Recorre la cola local y reenvía cada operación pendiente al backend.
 * Se invoca:
 *  - manualmente desde la pantalla de Sincronización, y
 *  - automáticamente al recuperar la conexión (ver hook useSincronizacion).
 *
 * Es seguro llamarlo varias veces: usa un candado para no solaparse.
 */

import api from './api';
import { estaConectado } from './conectividad';
import {
  obtenerCola,
  eliminarDeCola,
  actualizarItemCola,
} from './almacenamientoLocal';

const MAX_INTENTOS = parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS) || 3;

let sincronizando = false;

/**
 * Procesa toda la cola pendiente.
 * @returns {Promise<{enviados:number, fallidos:number, omitido?:boolean}>}
 */
export const sincronizarCola = async () => {
  if (sincronizando) return { enviados: 0, fallidos: 0, omitido: true };

  const hayRed = await estaConectado();
  if (!hayRed) return { enviados: 0, fallidos: 0, omitido: true };

  sincronizando = true;
  let enviados = 0;
  let fallidos = 0;

  try {
    const cola = obtenerCola();

    for (const item of cola) {
      try {
        await api.request({
          url: item.endpoint,
          method: item.metodo || 'POST',
          data: item.datos,
        });
        // Éxito -> se elimina de la cola
        eliminarDeCola(item.id);
        enviados += 1;
      } catch (error) {
        const intentos = (item.intentos || 0) + 1;
        const mensaje =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message;

        // Si el backend rechaza por datos (4xx), no tiene sentido reintentar
        // indefinidamente: se marca como error para revisión manual.
        const esRechazoDatos =
          error.response && error.response.status >= 400 && error.response.status < 500;

        actualizarItemCola(item.id, {
          intentos,
          estado: esRechazoDatos || intentos >= MAX_INTENTOS ? 'error' : 'pendiente',
          ultimoError: mensaje,
        });
        fallidos += 1;
      }
    }
  } finally {
    sincronizando = false;
  }

  return { enviados, fallidos };
};
