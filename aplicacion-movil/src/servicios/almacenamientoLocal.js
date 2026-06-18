/**
 * Almacenamiento local (offline-first).
 *
 * v1: persiste en localStorage (disponible tanto en el navegador como dentro
 * del WebView de Capacitor). En una versión futura esta capa se reemplazará
 * por SQLite (@capacitor-community/sqlite) sin tocar el resto de la app,
 * porque toda la lógica de la cola pasa por aquí.
 *
 * Guarda dos cosas:
 *  1. cola_sincronizacion -> peticiones POST pendientes de enviar al backend.
 *  2. cache_animales       -> animales descargados, para consultarlos sin red.
 */

const CLAVE_COLA = 'caprino_cola_sync';
const CLAVE_CACHE_ANIMALES = 'caprino_cache_animales';

const leer = (clave, porDefecto) => {
  try {
    const str = localStorage.getItem(clave);
    return str ? JSON.parse(str) : porDefecto;
  } catch {
    return porDefecto;
  }
};

const escribir = (clave, valor) => {
  localStorage.setItem(clave, JSON.stringify(valor));
};

/* ------------------------------------------------------------------ */
/*  Cola de sincronización                                            */
/* ------------------------------------------------------------------ */

/**
 * Agrega una operación a la cola para enviarla cuando haya conexión.
 * @param {{tipo:string, endpoint:string, metodo?:string, datos:object, resumen?:string}} item
 * @returns {object} El item encolado (con id y metadatos).
 */
export const agregarACola = (item) => {
  const cola = leer(CLAVE_COLA, []);
  const registro = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tipo: item.tipo,
    endpoint: item.endpoint,
    metodo: item.metodo || 'POST',
    datos: item.datos,
    resumen: item.resumen || '',
    fechaCreacion: Date.now(),
    intentos: 0,
    estado: 'pendiente', // pendiente | error
    ultimoError: null,
  };
  cola.push(registro);
  escribir(CLAVE_COLA, cola);
  return registro;
};

/** Devuelve todos los items de la cola (pendientes y con error). */
export const obtenerCola = () => leer(CLAVE_COLA, []);

/** Cantidad de items aún por sincronizar. */
export const contarPendientes = () => obtenerCola().length;

/** Elimina un item de la cola por id (tras enviarse con éxito). */
export const eliminarDeCola = (id) => {
  const cola = leer(CLAVE_COLA, []).filter((i) => i.id !== id);
  escribir(CLAVE_COLA, cola);
};

/** Actualiza un item de la cola (p. ej. para marcar intento fallido). */
export const actualizarItemCola = (id, cambios) => {
  const cola = leer(CLAVE_COLA, []).map((i) =>
    i.id === id ? { ...i, ...cambios } : i
  );
  escribir(CLAVE_COLA, cola);
};

/** Vacía toda la cola (uso administrativo / depuración). */
export const vaciarCola = () => escribir(CLAVE_COLA, []);

/* ------------------------------------------------------------------ */
/*  Caché de animales                                                 */
/* ------------------------------------------------------------------ */

/** Guarda la lista completa de animales descargada del backend. */
export const guardarCacheAnimales = (animales) => {
  escribir(CLAVE_CACHE_ANIMALES, {
    fecha: Date.now(),
    animales,
  });
};

/** Lee la caché de animales. Devuelve [] si no hay nada. */
export const obtenerCacheAnimales = () => {
  const cache = leer(CLAVE_CACHE_ANIMALES, null);
  return cache?.animales || [];
};

/** Fecha (timestamp) de la última descarga de animales, o null. */
export const fechaCacheAnimales = () => {
  const cache = leer(CLAVE_CACHE_ANIMALES, null);
  return cache?.fecha || null;
};
