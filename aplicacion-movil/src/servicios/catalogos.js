/**
 * Catálogos de bienestar (MEBA) y clasificación lineal.
 *
 * Se descargan cuando hay red y se guardan en el teléfono, porque las
 * evaluaciones se hacen en el corral y ahí casi nunca hay señal.
 */

import api from './api';
import { leerLocal, escribirLocal } from './almacenamientoLocal';

const CLAVES = { bienestar: 'caprino_cat_bienestar', lineal: 'caprino_cat_lineal' };
const CLAVE_MEDIDAS = 'caprino_cat_lineal_medidas';
const RUTAS = { bienestar: '/bienestar/catalogo?especie=CAPRINO', lineal: '/clasificacion-lineal/catalogo' };

/** Catálogo guardado en el teléfono ([] si nunca se descargó). */
export const catalogoLocal = (tipo) => leerLocal(CLAVES[tipo], null)?.datos || [];

/** Medidas de la clasificación lineal guardadas en el teléfono. */
export const medidasLocal = () => leerLocal(CLAVE_MEDIDAS, null)?.datos || [];

export const fechaCatalogo = (tipo) => leerLocal(CLAVES[tipo], null)?.fecha || null;

/** Intenta refrescar desde el servidor; si falla devuelve lo guardado. */
export const obtenerCatalogo = async (tipo) => {
  try {
    const { data } = await api.get(RUTAS[tipo]);
    const datos = data.data || [];
    if (datos.length) escribirLocal(CLAVES[tipo], { fecha: Date.now(), datos });
    // Lineal trae también el catálogo de medidas (bastón, cinta, compás, calibrador)
    if (tipo === 'lineal' && Array.isArray(data.medidas) && data.medidas.length) escribirLocal(CLAVE_MEDIDAS, { fecha: Date.now(), datos: data.medidas });
    return datos.length ? datos : catalogoLocal(tipo);
  } catch {
    return catalogoLocal(tipo);
  }
};

/** Descarga ambos catálogos (se llama al iniciar sesión y al volver la red). */
export const refrescarCatalogos = () => Promise.all([obtenerCatalogo('bienestar'), obtenerCatalogo('lineal')]);
