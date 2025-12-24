import axios from 'axios';

/**
 * Servicio API para gestión de producción de leche
 * 
 * Maneja operaciones de registro y consulta de producción láctea
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const produccionService = {
  /**
   * Obtiene todos los registros de producción
   * 
   * @param {Object} filtros - Filtros opcionales (idAnimal, fechaInicio, fechaFin)
   * @returns {Promise<Array>} Lista de producciones
   */
  obtenerTodos: async (filtros = {}) => {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await axios.get(`${API_BASE_URL}/api/produccion_leches?${params}`);
      return response.data['hydra:member'] || response.data;
    } catch (error) {
      console.error('Error al obtener producción:', error);
      throw error;
    }
  },

  /**
   * Obtiene producción de un animal específico
   * 
   * @param {number} idAnimal - ID del animal
   * @returns {Promise<Array>} Registros de producción
   */
  obtenerPorAnimal: async (idAnimal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/produccion_leches`, {
        params: { 'animal.id': idAnimal }
      });
      return response.data['hydra:member'] || response.data;
    } catch (error) {
      console.error(`Error al obtener producción del animal ${idAnimal}:`, error);
      throw error;
    }
  },

  /**
   * Registra una nueva producción
   * 
   * @param {Object} datos - Datos del ordeño
   * @returns {Promise<Object>} Producción registrada
   */
  registrar: async (datos) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/produccion_leches`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al registrar producción:', error);
      throw error;
    }
  },

  /**
   * Obtiene la curva de lactancia de un animal
   * 
   * @param {number} idAnimal - ID del animal
   * @param {number} numeroLactancia - Número de lactancia
   * @returns {Promise<Array>} Datos de la curva
   */
  obtenerCurvaLactancia: async (idAnimal, numeroLactancia) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/produccion/curva-lactancia/${idAnimal}/${numeroLactancia}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener curva de lactancia:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de producción por período
   * 
   * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: async (fechaInicio, fechaFin) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/produccion/estadisticas`, {
        params: { fechaInicio, fechaFin }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de producción:', error);
      throw error;
    }
  },

  /**
   * Obtiene el ranking de producción
   * 
   * @param {string} fechaInicio - Fecha inicio
   * @param {string} fechaFin - Fecha fin
   * @param {number} limite - Número de animales
   * @returns {Promise<Array>} Ranking
   */
  obtenerRanking: async (fechaInicio, fechaFin, limite = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/produccion/ranking`, {
        params: { fechaInicio, fechaFin, limite }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ranking de producción:', error);
      throw error;
    }
  },
};

export default produccionService;
