import axios from 'axios';

/**
 * Servicio API para gestión de animales
 * 
 * Maneja todas las operaciones CRUD de animales
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const animalService = {
  /**
   * Obtiene todos los animales
   * 
   * @param {Object} filtros - Filtros opcionales (estado, sexo, raza)
   * @returns {Promise<Array>} Lista de animales
   */
  obtenerTodos: async (filtros = {}) => {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await axios.get(`${API_BASE_URL}/api/animals?${params}`);
      return response.data['hydra:member'] || response.data;
    } catch (error) {
      console.error('Error al obtener animales:', error);
      throw error;
    }
  },

  /**
   * Obtiene un animal por ID
   * 
   * @param {number} id - ID del animal
   * @returns {Promise<Object>} Datos del animal
   */
  obtenerPorId: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/animals/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener animal ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo animal
   * 
   * @param {Object} datos - Datos del animal
   * @returns {Promise<Object>} Animal creado
   */
  crear: async (datos) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/animals`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear animal:', error);
      throw error;
    }
  },

  /**
   * Actualiza un animal existente
   * 
   * @param {number} id - ID del animal
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Animal actualizado
   */
  actualizar: async (id, datos) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/animals/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar animal ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un animal (marca como Inactivo)
   * 
   * @param {number} id - ID del animal
   * @returns {Promise<void>}
   */
  eliminar: async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/animals/${id}`);
    } catch (error) {
      console.error(`Error al eliminar animal ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca animales por término
   * 
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Animales encontrados
   */
  buscar: async (termino) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/animals`, {
        params: {
          'identificacion': termino,
          'nombre': termino,
        }
      });
      return response.data['hydra:member'] || response.data;
    } catch (error) {
      console.error('Error al buscar animales:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas del rebaño
   * 
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/animals/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },
};

export default animalService;
