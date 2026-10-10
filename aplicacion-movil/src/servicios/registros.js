/**
 * Registros simples de campo (salud, pesaje, producción, FAMACHA).
 *
 * Con red se envían de una vez; sin red quedan en la cola del teléfono y se
 * envían solos al volver la conexión.
 */

import api, { esErrorDeRed } from './api';
import { estaConectado } from './conectividad';
import { agregarACola } from './almacenamientoLocal';

const encolar = (tipo, endpoint, datos, resumen) => {
  agregarACola({ tipo, endpoint, datos, resumen });
  window.dispatchEvent(new Event('cola-actualizada'));
  return { estado: 'encolado' };
};

/** @returns {Promise<{estado:'enviado'|'encolado'}>} */
export const registrar = async (tipo, endpoint, datos, resumen = '') => {
  if (!(await estaConectado())) return encolar(tipo, endpoint, datos, resumen);
  try {
    await api.post(endpoint, datos);
    return { estado: 'enviado' };
  } catch (error) {
    if (esErrorDeRed(error)) return encolar(tipo, endpoint, datos, resumen);
    throw error;
  }
};

export const TIPOS_SALUD = [
  { valor: 'vacuna', etiqueta: 'Vacuna' },
  { valor: 'tratamiento', etiqueta: 'Tratamiento' },
  { valor: 'desparasitacion', etiqueta: 'Desparasitación' },
  { valor: 'diagnostico', etiqueta: 'Enfermedad' },
  { valor: 'cirugia', etiqueta: 'Cirugía' },
];
export const METODOS_PESAJE = [
  { valor: 'bascula', etiqueta: 'Báscula' },
  { valor: 'cinta', etiqueta: 'Cinta' },
  { valor: 'estimado', etiqueta: 'Estimado' },
];
export const TURNOS = [
  { valor: 'mañana', etiqueta: 'Mañana' },
  { valor: 'tarde', etiqueta: 'Tarde' },
  { valor: 'total_dia', etiqueta: 'Todo el día' },
];
// Escala FAMACHA: color de la mucosa del ojo
export const FAMACHA = [
  { valor: 1, color: '#C62828', nombre: 'Rojo', lectura: 'Sana' },
  { valor: 2, color: '#E57373', nombre: 'Rojo rosado', lectura: 'Sana' },
  { valor: 3, color: '#F4A6A6', nombre: 'Rosado', lectura: 'Vigilar' },
  { valor: 4, color: '#F8D7D7', nombre: 'Rosado pálido', lectura: 'Anemia: tratar' },
  { valor: 5, color: '#FBF1EE', nombre: 'Blanco', lectura: 'Anemia grave' },
];
