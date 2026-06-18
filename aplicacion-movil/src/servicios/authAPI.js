/**
 * Servicio de autenticación de la app móvil.
 *
 * Usa el endpoint POST /api/auth/login (json_login de Lexik). La config del
 * backend tiene `username_path: email`, por lo que el campo de identificación
 * debe enviarse como `email` (NO como `username`).
 * El backend responde: { token, user: { id, nombre, email, rol }, ... }
 */

import api, { CLAVE_TOKEN, CLAVE_USUARIO } from './api';

/**
 * Inicia sesión con email y contraseña.
 * @returns {Promise<{token:string, usuario:object}>}
 */
export const iniciarSesion = async (email, password) => {
  const { data } = await api.post('/auth/login', {
    email,
    password,
  });

  const token = data.token;
  // El backend devuelve la clave "user"; aquí la normalizamos a "usuario".
  const datosUsuario = data.user || data.usuario || null;

  if (!token) {
    throw new Error('Respuesta de login sin token');
  }

  localStorage.setItem(CLAVE_TOKEN, token);
  if (datosUsuario) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datosUsuario));
  }

  return { token, usuario: datosUsuario };
};

export const cerrarSesion = () => {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
};

export const estaAutenticado = () => !!localStorage.getItem(CLAVE_TOKEN);

export const obtenerUsuarioActual = () => {
  const str = localStorage.getItem(CLAVE_USUARIO);
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};
