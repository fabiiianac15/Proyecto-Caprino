/**
 * Servicio de registros de Pesaje (offline-first para escritura).
 *
 * Envía a POST /api/pesaje. Campos que acepta el backend:
 *  idAnimal (req), pesoKg (req), fechaPesaje, condicionCorporal,
 *  metodoPesaje, observaciones.
 *
 * Si no hay conexión (o falla por red), encola y sincroniza al volver internet.
 */

import api, { esErrorDeRed } from './api';
import { estaConectado } from './conectividad';
import { agregarACola } from './almacenamientoLocal';

export const METODOS_PESAJE = [
  { valor: 'bascula', etiqueta: 'Báscula' },
  { valor: 'cinta', etiqueta: 'Cinta métrica' },
  { valor: 'estimado', etiqueta: 'Estimado' },
];

/**
 * Registra un pesaje.
 * @param {object} datos  Cuerpo con los campos de pesaje.
 * @param {string} resumen  Texto corto para mostrar en la cola.
 * @returns {Promise<{estado:'enviado'|'encolado'}>}
 */
export const registrarPesaje = async (datos, resumen = '') => {
  const hayRed = await estaConectado();

  if (!hayRed) {
    agregarACola({ tipo: 'pesaje', endpoint: '/pesaje', datos, resumen });
    return { estado: 'encolado' };
  }

  try {
    await api.post('/pesaje', datos);
    return { estado: 'enviado' };
  } catch (error) {
    if (esErrorDeRed(error)) {
      agregarACola({ tipo: 'pesaje', endpoint: '/pesaje', datos, resumen });
      return { estado: 'encolado' };
    }
    throw error;
  }
};
