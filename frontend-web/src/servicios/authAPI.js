/**
 * Servicio de autenticación
 * 
 * Maneja el inicio de sesión, cierre de sesión y gestión del token JWT
 */

import api from './api';

/**
 * Inicia sesión con email y contraseña
 * 
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const iniciarSesion = async (email, password) => {
  try {
    const response = await api.post('/login', {
      username: email,
      password: password,
    });
    
    const { token, usuario } = response.data;
    
    // Guardar token en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    return { token, usuario };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al iniciar sesión'
    );
  }
};

/**
 * Cierra la sesión del usuario actual
 */
export const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

/**
 * Verifica si el usuario está autenticado
 * 
 * @returns {boolean} true si hay un token válido
 */
export const estaAutenticado = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Obtiene el usuario actual desde localStorage
 * 
 * @returns {Object|null} Datos del usuario o null si no hay sesión
 */
export const obtenerUsuarioActual = () => {
  const usuarioStr = localStorage.getItem('usuario');
  
  if (!usuarioStr) {
    return null;
  }
  
  try {
    return JSON.parse(usuarioStr);
  } catch (error) {
    console.error('Error al parsear usuario:', error);
    return null;
  }
};

/**
 * Verifica si el usuario tiene un rol específico
 * 
 * @param {string} rolRequerido - Rol a verificar
 * @returns {boolean} true si el usuario tiene el rol
 */
export const tieneRol = (rolRequerido) => {
  const usuario = obtenerUsuarioActual();
  
  if (!usuario || !usuario.rol) {
    return false;
  }
  
  return usuario.rol === rolRequerido;
};

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 * 
 * @param {Array<string>} roles - Array de roles permitidos
 * @returns {boolean} true si el usuario tiene alguno de los roles
 */
export const tieneAlgunRol = (roles) => {
  const usuario = obtenerUsuarioActual();
  
  if (!usuario || !usuario.rol) {
    return false;
  }
  
  return roles.includes(usuario.rol);
};
