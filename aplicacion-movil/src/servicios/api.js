/**
 * Cliente HTTP base de la app móvil
 *
 * Reutiliza el mismo contrato que el frontend web:
 * - Misma API Symfony (baseURL desde VITE_API_URL)
 * - Token JWT en cabecera Authorization
 *
 * A diferencia del web, NO redirige al hacer 401 (en móvil lo maneja el
 * AuthContext) y guarda el token en localStorage (persistente dentro del
 * WebView de Capacitor).
 */

import axios from 'axios';

export const CLAVE_TOKEN = 'caprino_token';
export const CLAVE_USUARIO = 'caprino_usuario';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Agrega el token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.VITE_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Manejo básico de errores. El 401 limpia la sesión; el AuthContext reacciona.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
      window.dispatchEvent(new Event('sesion-expirada'));
    }
    return Promise.reject(error);
  }
);

/**
 * Devuelve true si el error de axios es por falta de red / timeout,
 * es decir, un caso candidato a encolarse para sincronización posterior.
 */
export const esErrorDeRed = (error) =>
  !error.response &&
  (error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message === 'Network Error');

export default api;
