/**
 * Evaluaciones guardadas en el teléfono (bienestar y clasificación lineal).
 *
 * Un borrador vive aquí hasta que se envía completo al servidor. Guarda los
 * datos en localStorage y las fotos, por su clave, en IndexedDB.
 */

import { leerLocal, escribirLocal } from './almacenamientoLocal';
import { borrarFotos } from './fotosLocales';

const CLAVE = 'caprino_borradores';

const avisar = () => window.dispatchEvent(new Event('cola-actualizada'));

export const listarBorradores = (tipo) => {
  const todos = leerLocal(CLAVE, []);
  return (tipo ? todos.filter((b) => b.tipo === tipo) : todos).sort((a, b) => b.modificado - a.modificado);
};

export const obtenerBorrador = (id) => leerLocal(CLAVE, []).find((b) => b.id === id) || null;

export const guardarBorrador = (borrador) => {
  const todos = leerLocal(CLAVE, []);
  const registro = { ...borrador, modificado: Date.now() };
  const i = todos.findIndex((b) => b.id === registro.id);
  if (i >= 0) todos[i] = registro; else todos.push(registro);
  escribirLocal(CLAVE, todos);
  avisar();
  return registro;
};

export const nuevoId = () => `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Todas las claves de foto que usa un borrador. */
export const fotosDeBorrador = (b) => {
  if (!b) return [];
  if (b.tipo === 'lineal') return Object.values(b.fotos || {}).filter(Boolean);
  return [
    ...(b.fotosGenerales || []),
    ...Object.values(b.valores || {}).flatMap((v) => v.fotos || []),
  ];
};

export const eliminarBorrador = async (id) => {
  const todos = leerLocal(CLAVE, []);
  const b = todos.find((x) => x.id === id);
  await borrarFotos(fotosDeBorrador(b));
  escribirLocal(CLAVE, todos.filter((x) => x.id !== id));
  avisar();
};

/** Borradores marcados para enviar en cuanto haya conexión. */
export const borradoresPorEnviar = () => leerLocal(CLAVE, []).filter((b) => b.pendienteEnvio);
