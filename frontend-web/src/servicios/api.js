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

  /**
   * POST con respuesta en streaming (text/plain).
   * Invoca `onChunk(textoAcumulado, fragmento)` por cada fragmento recibido.
   * Usa fetch nativo porque axios no expone el cuerpo como stream.
   *
   * @param {string} url           Ruta relativa (se antepone la baseURL)
   * @param {object} data          Cuerpo JSON
   * @param {(full:string, chunk:string)=>void} onChunk  Callback por fragmento
   * @param {AbortSignal} [signal] Señal para cancelar la petición
   * @returns {Promise<string>}    Texto completo acumulado
   */
  postStream: async (url, data = {}, onChunk = () => {}, signal) => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
    const token = localStorage.getItem('token');

    const response = await fetch(`${base}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      let detalle = `Error ${response.status}`;
      try {
        const j = await response.json();
        detalle = j.error || j.detalle || detalle;
      } catch { /* respuesta no-JSON */ }
      throw new Error(detalle);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let full = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      onChunk(full, chunk);
    }
    return full;
  },
};

export default api;
