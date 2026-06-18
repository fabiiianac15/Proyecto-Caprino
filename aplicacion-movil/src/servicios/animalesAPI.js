/**
 * Servicio de animales.
 *
 * Estrategia offline-first para lectura:
 *  - Si hay red, descarga del backend y refresca la caché local.
 *  - Si no hay red (o falla), usa la caché guardada.
 *
 * El backend (GET /api/animales) responde { data: [ ... ] } y cada animal
 * incluye: id, codigo, chapetaNueva, chapetaVieja, nombre, sexo, estado,
 * nombreRaza, nombreCorral, etc.
 */

import api, { esErrorDeRed } from './api';
import {
  guardarCacheAnimales,
  obtenerCacheAnimales,
} from './almacenamientoLocal';

/**
 * Obtiene la lista de animales (refresca caché si hay red).
 * @returns {Promise<{animales:object[], desdeCache:boolean}>}
 */
export const listarAnimales = async () => {
  try {
    const { data } = await api.get('/animales');
    const animales = data.data || [];
    guardarCacheAnimales(animales);
    return { animales, desdeCache: false };
  } catch (error) {
    if (esErrorDeRed(error)) {
      return { animales: obtenerCacheAnimales(), desdeCache: true };
    }
    throw error;
  }
};

/** Normaliza un texto para comparaciones (sin espacios, mayúsculas). */
const norm = (v) => String(v ?? '').trim().toUpperCase();

/**
 * Busca un animal por código de identificación o chapeta (nueva o vieja).
 * Trabaja sobre la caché local, por lo que funciona sin conexión.
 * @param {string} codigo
 * @returns {object|null}
 */
export const buscarPorCodigo = (codigo) => {
  const objetivo = norm(codigo);
  if (!objetivo) return null;
  return (
    obtenerCacheAnimales().find(
      (a) =>
        norm(a.codigo) === objetivo ||
        norm(a.chapetaNueva) === objetivo ||
        norm(a.chapetaVieja) === objetivo
    ) || null
  );
};

/**
 * Filtra animales por texto libre (código, chapetas o nombre).
 * @param {string} texto
 * @returns {object[]}
 */
export const filtrarAnimales = (texto) => {
  const t = norm(texto);
  const todos = obtenerCacheAnimales();
  if (!t) return todos;
  return todos.filter(
    (a) =>
      norm(a.codigo).includes(t) ||
      norm(a.chapetaNueva).includes(t) ||
      norm(a.chapetaVieja).includes(t) ||
      norm(a.nombre).includes(t)
  );
};
