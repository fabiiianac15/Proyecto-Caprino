/**
 * Catálogos de bienestar (MEBA) y clasificación lineal.
 *
 * Se descargan cuando hay red y se guardan en el teléfono, porque las
 * evaluaciones se hacen en el corral y ahí casi nunca hay señal.
 */

import api from './api';
import { leerLocal, escribirLocal } from './almacenamientoLocal';

const CLAVES = { bienestar: 'caprino_cat_bienestar', lineal: 'caprino_cat_lineal' };
const RUTAS = { bienestar: '/bienestar/catalogo?especie=CAPRINO', lineal: '/clasificacion-lineal/catalogo' };

/** Catálogo guardado en el teléfono ([] si nunca se descargó). */
export const catalogoLocal = (tipo) => leerLocal(CLAVES[tipo], null)?.datos || [];

export const fechaCatalogo = (tipo) => leerLocal(CLAVES[tipo], null)?.fecha || null;

/** Intenta refrescar desde el servidor; si falla devuelve lo guardado. */
export const obtenerCatalogo = async (tipo) => {
  try {
    const { data } = await api.get(RUTAS[tipo]);
    const datos = data.data || [];
    if (datos.length) escribirLocal(CLAVES[tipo], { fecha: Date.now(), datos });
    return datos.length ? datos : catalogoLocal(tipo);
  } catch {
    return catalogoLocal(tipo);
  }
};

/** Descarga ambos catálogos (se llama al iniciar sesión y al volver la red). */
export const refrescarCatalogos = () => Promise.all([obtenerCatalogo('bienestar'), obtenerCatalogo('lineal')]);
