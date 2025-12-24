/**
 * Servicio de API para gestión de animales
 * 
 * Contiene todas las funciones para interactuar con los endpoints
 * relacionados con la entidad Animal
 */

import { apiHelpers } from './api';

/**
 * Obtiene lista de animales con filtros opcionales
 * 
 * @param {Object} filtros - Filtros de búsqueda
 * @param {string} filtros.estado - Estado del animal (activo, vendido, etc.)
 * @param {string} filtros.sexo - Sexo del animal (macho, hembra)
 * @param {number} filtros.idRaza - ID de la raza
 * @param {string} filtros.busqueda - Búsqueda por código o nombre
 * @param {number} filtros.pagina - Número de página
 * @param {number} filtros.porPagina - Registros por página
 * @returns {Promise<Object>} Lista de animales y metadatos de paginación
 */
export const obtenerAnimales = async (filtros = {}) => {
  return await apiHelpers.get('/animales', filtros);
};

/**
 * Obtiene el detalle completo de un animal
 * 
 * @param {number} idAnimal - ID del animal
 * @returns {Promise<Object>} Datos completos del animal
 */
export const obtenerAnimalPorId = async (idAnimal) => {
  return await apiHelpers.get(`/animales/${idAnimal}`);
};

/**
 * Crea un nuevo registro de animal
 * 
 * @param {Object} datosAnimal - Datos del nuevo animal
 * @returns {Promise<Object>} Animal creado
 */
export const crearAnimal = async (datosAnimal) => {
  return await apiHelpers.post('/animales', datosAnimal);
};

/**
 * Actualiza los datos de un animal existente
 * 
 * @param {number} idAnimal - ID del animal
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<Object>} Animal actualizado
 */
export const actualizarAnimal = async (idAnimal, datosActualizados) => {
  return await apiHelpers.put(`/animales/${idAnimal}`, datosActualizados);
};

/**
 * Elimina (o cambia estado a inactivo) un animal
 * 
 * @param {number} idAnimal - ID del animal
 * @param {string} motivo - Motivo de la eliminación/descarte
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAnimal = async (idAnimal, motivo) => {
  return await apiHelpers.delete(`/animales/${idAnimal}`, { motivo });
};

/**
 * Obtiene el árbol genealógico de un animal
 * 
 * @param {number} idAnimal - ID del animal
 * @param {number} generaciones - Número de generaciones hacia atrás (default: 3)
 * @returns {Promise<Object>} Árbol genealógico
 */
export const obtenerGenealogiaAnimal = async (idAnimal, generaciones = 3) => {
  return await apiHelpers.get(`/animales/${idAnimal}/genealogia`, { generaciones });
};

/**
 * Obtiene estadísticas de un animal específico
 * 
 * @param {number} idAnimal - ID del animal
 * @returns {Promise<Object>} Estadísticas del animal
 */
export const obtenerEstadisticasAnimal = async (idAnimal) => {
  return await apiHelpers.get(`/animales/${idAnimal}/estadisticas`);
};

/**
 * Busca animales por código de identificación
 * 
 * @param {string} codigo - Código a buscar
 * @returns {Promise<Array>} Lista de animales que coinciden
 */
export const buscarPorCodigo = async (codigo) => {
  return await apiHelpers.get('/animales/buscar', { codigo });
};

/**
 * Obtiene el historial completo de un animal
 * 
 * @param {number} idAnimal - ID del animal
 * @returns {Promise<Object>} Historial completo (pesajes, producción, salud, etc.)
 */
export const obtenerHistorialCompleto = async (idAnimal) => {
  return await apiHelpers.get(`/animales/${idAnimal}/historial`);
};
