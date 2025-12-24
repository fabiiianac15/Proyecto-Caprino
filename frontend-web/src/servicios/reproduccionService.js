import axios from 'axios';

/**
 * Servicio API para gestión reproductiva
 * 
 * Maneja operaciones de servicios, diagnósticos y partos
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const reproduccionService = {
  /**
   * Obtiene todos los registros reproductivos
   * 
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Lista de eventos reproductivos
   */
  obtenerTodos: async (filtros = {}) => {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await axios.get(`${API_BASE_URL}/api/reproduccions?${params}`);
      return response.data['hydra:member'] || response.data;
    } catch (error) {
      console.error('Error al obtener reproducción:', error);
      throw error;
    }
  },

  /**
   * Registra un nuevo servicio/monta
   * 
   * @param {Object} datos - Datos del servicio
   * @returns {Promise<Object>} Servicio registrado
   */
  registrarServicio: async (datos) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/reproduccions`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al registrar servicio:', error);
      throw error;
    }
  },

  /**
   * Actualiza un registro reproductivo
   * 
   * @param {number} id - ID del registro
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Registro actualizado
   */
  actualizar: async (id, datos) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/reproduccions/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar reproducción ${id}:`, error);
      throw error;
    }
  },

  /**
   * Registra diagnóstico de gestación
   * 
   * @param {number} id - ID del servicio
   * @param {Object} diagnostico - Datos del diagnóstico
   * @returns {Promise<Object>} Registro actualizado
   */
  registrarDiagnostico: async (id, diagnostico) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/reproduccions/${id}`, {
        fechaDiagnostico: diagnostico.fecha,
        resultadoDiagnostico: diagnostico.resultado,
        metodoDiagnostico: diagnostico.metodo,
      });
      return response.data;
    } catch (error) {
      console.error('Error al registrar diagnóstico:', error);
      throw error;
    }
  },

  /**
   * Registra parto
   * 
   * @param {number} id - ID del servicio
   * @param {Object} parto - Datos del parto
   * @returns {Promise<Object>} Registro actualizado
   */
  registrarParto: async (id, parto) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/reproduccions/${id}`, {
        fechaPartoReal: parto.fecha,
        tipoParto: parto.tipo,
        numeroCrias: parto.numeroCrias,
        criasVivas: parto.criasVivas,
        dificultadParto: parto.dificultad,
        condicionMadre: parto.condicionMadre,
      });
      return response.data;
    } catch (error) {
      console.error('Error al registrar parto:', error);
      throw error;
    }
  },

  /**
   * Obtiene hembras gestantes actualmente
   * 
   * @returns {Promise<Array>} Lista de gestantes
   */
  obtenerGestantes: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reproduccion/gestantes`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener gestantes:', error);
      throw error;
    }
  },

  /**
   * Obtiene partos próximos
   * 
   * @param {number} dias - Días hacia adelante
   * @returns {Promise<Array>} Lista de partos próximos
   */
  obtenerPartosProximos: async (dias = 30) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reproduccion/partos-proximos`, {
        params: { dias }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener partos próximos:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas reproductivas
   * 
   * @param {string} fechaInicio - Fecha inicio
   * @param {string} fechaFin - Fecha fin
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: async (fechaInicio, fechaFin) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reproduccion/estadisticas`, {
        params: { fechaInicio, fechaFin }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas reproductivas:', error);
      throw error;
    }
  },

  /**
   * Obtiene el calendario reproductivo mensual
   * 
   * @param {number} mes - Mes (1-12)
   * @param {number} año - Año
   * @returns {Promise<Array>} Eventos del mes
   */
  obtenerCalendarioMensual: async (mes, año) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reproduccion/calendario`, {
        params: { mes, año }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener calendario reproductivo:', error);
      throw error;
    }
  },
};

export default reproduccionService;
