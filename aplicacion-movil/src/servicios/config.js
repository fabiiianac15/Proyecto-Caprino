/**
 * Dirección del servidor. La app trae la del servidor en internet y funciona
 * con wifi o datos; solo se cambia desde la app si el servidor se muda.
 */

// v2: el servidor pasó de la red local a internet; se descarta la dirección vieja guardada
const CLAVE_SERVIDOR = 'caprino_servidor_v2';
export const SERVIDOR_POR_DEFECTO = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/** Normaliza lo que escriba la persona: agrega http:// y /api si faltan. */
export const normalizarServidor = (texto) => {
  let url = String(texto || '').trim().replace(/\/+$/, '');
  if (!url) return SERVIDOR_POR_DEFECTO;
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  if (!/\/api$/i.test(url)) url = `${url}/api`;
  return url;
};

export const obtenerServidor = () => localStorage.getItem(CLAVE_SERVIDOR) || SERVIDOR_POR_DEFECTO;

export const guardarServidor = (texto) => {
  const url = normalizarServidor(texto);
  // Si es la de fábrica no se guarda: así una app actualizada sigue al servidor nuevo
  if (url === SERVIDOR_POR_DEFECTO) localStorage.removeItem(CLAVE_SERVIDOR);
  else localStorage.setItem(CLAVE_SERVIDOR, url);
  window.dispatchEvent(new Event('servidor-cambiado'));
  return url;
};

/** Origen del backend sin /api, para armar la URL de las fotos de animales. */
export const origenServidor = () => obtenerServidor().replace(/\/api$/i, '');
