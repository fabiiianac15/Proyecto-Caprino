/**
 * Catálogos de bienestar (MEBA) y clasificación lineal.
 *
 * Se descargan cuando hay red y se guardan en el teléfono, porque las
 * evaluaciones se hacen en el corral y ahí casi nunca hay señal.
 * La clasificación lineal tiene un catálogo de rasgos para hembras
 * ('lineal') y otro para machos ('lineal_macho'), más las medidas, las
 * reglas morfométricas y las medidas de referencia de cada raza.
 */

import api from './api';
import { leerLocal, escribirLocal } from './almacenamientoLocal';

const CLAVES = { bienestar: 'caprino_cat_bienestar', lineal: 'caprino_cat_lineal', lineal_macho: 'caprino_cat_lineal_macho' };
const CLAVE_MEDIDAS = 'caprino_cat_lineal_medidas2';
const CLAVE_REGLAS = 'caprino_cat_lineal_reglas';
const CLAVE_REFERENCIAS = 'caprino_cat_lineal_referencias';
const RUTAS = {
  bienestar: '/bienestar/catalogo?especie=CAPRINO',
  lineal: '/clasificacion-lineal/catalogo?sexo=HEMBRA',
  lineal_macho: '/clasificacion-lineal/catalogo?sexo=MACHO',
};

/** Catálogo guardado en el teléfono ([] si nunca se descargó). */
export const catalogoLocal = (tipo) => leerLocal(CLAVES[tipo], null)?.datos || [];

/** Catálogo de rasgos según el sexo (HEMBRA | MACHO). */
export const tipoCatalogoLineal = (sexo) => (sexo === 'MACHO' ? 'lineal_macho' : 'lineal');

/** Todas las medidas (las de ubre son de hembras, la escrotal de machos). */
export const medidasLocal = () => leerLocal(CLAVE_MEDIDAS, null)?.datos || [];
export const reglasLocal = () => leerLocal(CLAVE_REGLAS, null)?.datos || [];
/** Medidas de referencia de todas las razas: [{idRaza, raza, sexo, codigo, media, de}] */
export const referenciasLocal = () => leerLocal(CLAVE_REFERENCIAS, null)?.datos || [];

/** Medidas que aplican a un sexo (las guardadas antes no traen "sexo": la ubre es de hembras). */
export const medidasDeSexo = (medidas, sexo) => medidas.filter((m) => {
  const s = m.sexo || (m.grupo === 'UBRE' ? 'HEMBRA' : 'AMBOS');
  return s === 'AMBOS' || s === sexo;
});

/** Referencias de una raza y sexo, más las generales (ubre). */
export const referenciasDe = (idRaza, sexo) => referenciasLocal()
  .filter((r) => r.sexo === sexo && (r.idRaza == null || (idRaza && Number(r.idRaza) === Number(idRaza))));

export const fechaCatalogo = (tipo) => leerLocal(CLAVES[tipo], null)?.fecha || null;

const guardar = (clave, datos) => { if (Array.isArray(datos) && datos.length) escribirLocal(clave, { fecha: Date.now(), datos }); };

/** Intenta refrescar desde el servidor; si falla devuelve lo guardado. */
export const obtenerCatalogo = async (tipo) => {
  try {
    const { data } = await api.get(RUTAS[tipo]);
    const datos = data.data || [];
    guardar(CLAVES[tipo], datos);
    if (tipo === 'lineal' || tipo === 'lineal_macho') {
      guardar(CLAVE_REGLAS, data.reglas);
      // Medidas de los dos sexos y referencias de todas las razas
      const [med, refs] = await Promise.all([
        api.get('/clasificacion-lineal/medidas/catalogo').then((r) => r.data.data).catch(() => null),
        api.get('/clasificacion-lineal/referencias').then((r) => r.data.data).catch(() => null),
      ]);
      guardar(CLAVE_MEDIDAS, med);
      guardar(CLAVE_REFERENCIAS, refs);
    }
    return datos.length ? datos : catalogoLocal(tipo);
  } catch {
    return catalogoLocal(tipo);
  }
};

/** Descarga todos los catálogos (se llama al iniciar sesión y al volver la red). */
export const refrescarCatalogos = () => Promise.all([
  obtenerCatalogo('bienestar'), obtenerCatalogo('lineal'), obtenerCatalogo('lineal_macho'),
]);
