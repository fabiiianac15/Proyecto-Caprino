/**
 * Servicio de registros de Salud (offline-first para escritura).
 *
 * Envía a POST /api/salud. Campos que acepta el backend:
 *  idAnimal (req), tipoRegistro (req: vacuna|tratamiento|diagnostico|cirugia|
 *  desparasitacion; 'enfermedad' se traduce a 'diagnostico'), fechaAplicacion,
 *  enfermedadDiagnostico, medicamentoProducto, dosis, viaAdministracion,
 *  loteProducto, fechaProximaAplicacion, diasRetiroLeche, diasRetiroCarne,
 *  veterinario, observaciones.
 *
 * Si no hay conexión (o falla por red), la operación se guarda en la cola
 * local y se sincroniza automáticamente al volver el internet.
 */

import api, { esErrorDeRed } from './api';
import { estaConectado } from './conectividad';
import { agregarACola } from './almacenamientoLocal';

export const TIPOS_SALUD = [
  { valor: 'vacuna', etiqueta: 'Vacuna' },
  { valor: 'tratamiento', etiqueta: 'Tratamiento' },
  { valor: 'desparasitacion', etiqueta: 'Desparasitación' },
  { valor: 'diagnostico', etiqueta: 'Diagnóstico / Enfermedad' },
  { valor: 'cirugia', etiqueta: 'Cirugía' },
];

/**
 * Registra un evento de salud.
 * @param {object} datos  Cuerpo con los campos de salud (ver arriba).
 * @param {string} resumen  Texto corto para mostrar en la cola.
 * @returns {Promise<{estado:'enviado'|'encolado'}>}
 */
export const registrarSalud = async (datos, resumen = '') => {
  const hayRed = await estaConectado();

  // Sin red: directo a la cola.
  if (!hayRed) {
    agregarACola({ tipo: 'salud', endpoint: '/salud', datos, resumen });
    return { estado: 'encolado' };
  }

  // Con red: intentar enviar; si falla por red, encolar como respaldo.
  try {
    await api.post('/salud', datos);
    return { estado: 'enviado' };
  } catch (error) {
    if (esErrorDeRed(error)) {
      agregarACola({ tipo: 'salud', endpoint: '/salud', datos, resumen });
      return { estado: 'encolado' };
    }
    // Error de validación u otro: se propaga para mostrar el mensaje real.
    throw error;
  }
};
