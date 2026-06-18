/**
 * Servicio de registros de Producción de leche (offline-first para escritura).
 *
 * Envía a POST /api/produccion. Campos que acepta el backend:
 *  idAnimal (req), litros (req), fechaProduccion, turno
 *  (mañana|tarde|noche|total_dia), numeroLactancia, diasLactancia,
 *  grasaPorcentaje, observaciones.
 *
 * Si no hay conexión (o falla por red), encola y sincroniza al volver internet.
 */

import api, { esErrorDeRed } from './api';
import { estaConectado } from './conectividad';
import { agregarACola } from './almacenamientoLocal';

export const TURNOS = [
  { valor: 'total_dia', etiqueta: 'Total del día' },
  { valor: 'mañana', etiqueta: 'Mañana' },
  { valor: 'tarde', etiqueta: 'Tarde' },
  { valor: 'noche', etiqueta: 'Noche' },
];

/**
 * Registra una producción de leche.
 * @param {object} datos  Cuerpo con los campos de producción.
 * @param {string} resumen  Texto corto para mostrar en la cola.
 * @returns {Promise<{estado:'enviado'|'encolado'}>}
 */
export const registrarProduccion = async (datos, resumen = '') => {
  const hayRed = await estaConectado();

  if (!hayRed) {
    agregarACola({ tipo: 'produccion', endpoint: '/produccion', datos, resumen });
    return { estado: 'encolado' };
  }

  try {
    await api.post('/produccion', datos);
    return { estado: 'enviado' };
  } catch (error) {
    if (esErrorDeRed(error)) {
      agregarACola({ tipo: 'produccion', endpoint: '/produccion', datos, resumen });
      return { estado: 'encolado' };
    }
    throw error;
  }
};
