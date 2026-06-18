/**
 * Detección de conectividad.
 *
 * Usa el plugin @capacitor/network en dispositivo y cae a navigator.onLine
 * en el navegador (desarrollo con `npm run dev`).
 */

import { Network } from '@capacitor/network';

/** Lee el estado actual de la red. @returns {Promise<boolean>} */
export const estaConectado = async () => {
  try {
    const estado = await Network.getStatus();
    return estado.connected;
  } catch {
    // Fallback navegador
    return navigator.onLine;
  }
};

/**
 * Suscribe un callback a los cambios de conectividad.
 * @param {(conectado:boolean)=>void} callback
 * @returns {()=>void} función para cancelar la suscripción
 */
export const escucharConectividad = (callback) => {
  let handle;
  let activo = true;

  Network.addListener('networkStatusChange', (estado) => {
    callback(estado.connected);
  })
    .then((h) => {
      if (activo) handle = h;
      else h.remove();
    })
    .catch(() => {
      // Fallback navegador: eventos online/offline
      const online = () => callback(true);
      const offline = () => callback(false);
      window.addEventListener('online', online);
      window.addEventListener('offline', offline);
      handle = {
        remove: () => {
          window.removeEventListener('online', online);
          window.removeEventListener('offline', offline);
        },
      };
    });

  return () => {
    activo = false;
    handle?.remove?.();
  };
};
