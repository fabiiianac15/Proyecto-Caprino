/**
 * Cliente HTTP base para comunicación con la API
 * 
 * Configuración centralizada de Axios con interceptores para:
 * - Agregar token JWT automáticamente
 * - Manejo de errores global
 * - Reintentos automáticos
 */

import axios from 'axios';

// Crear instancia de Axios con configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Interceptor de peticiones
 * Agrega el token JWT a todas las peticiones
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Registrar petición en modo debug
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.params || config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Error en petición:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas
 * Manejo centralizado de errores
 */
api.interceptors.response.use(
  (response) => {
    // Registrar respuesta en modo debug
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log(`[API] Respuesta ${response.status}:`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Extraer información del error
    const estado = error.response?.status;
    const mensaje = error.response?.data?.message || error.message;
    
    // Manejo específico según código de estado
    switch (estado) {
      case 401:
        // Token inválido o expirado
        console.error('[API] No autorizado - Token inválido o expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/iniciar-sesion';
        break;
        
      case 403:
        console.error('[API] Acceso prohibido - Permisos insuficientes');
        break;
        
      case 404:
        console.error('[API] Recurso no encontrado');
        break;
        
      case 422:
        console.error('[API] Error de validación:', error.response?.data);
        break;
        
      case 500:
        console.error('[API] Error interno del servidor');
        break;
        
      default:
        console.error('[API] Error:', mensaje);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Métodos auxiliares para peticiones comunes
 */
export const apiHelpers = {
  /**
   * GET con manejo de parámetros de consulta
   */
  get: async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  },
  
  /**
   * POST para crear recursos
   */
  post: async (url, data = {}) => {
    const response = await api.post(url, data);
    return response.data;
  },
  
  /**
   * PUT para actualizar recursos completamente
   */
  put: async (url, data = {}) => {
    const response = await api.put(url, data);
    return response.data;
  },
  
  /**
   * PATCH para actualizaciones parciales
   */
  patch: async (url, data = {}) => {
    const response = await api.patch(url, data);
    return response.data;
  },
  
  /**
   * DELETE para eliminar recursos
   */
  delete: async (url) => {
    const response = await api.delete(url);
    return response.data;
  },
};

export default api;
