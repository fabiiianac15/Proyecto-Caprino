/**
 * Fotos de evidencia guardadas en el teléfono (IndexedDB).
 *
 * localStorage solo admite unos pocos MB y texto; las fotos van como Blob en
 * IndexedDB, que sí está pensada para archivos. Cada foto tiene una clave y
 * las evaluaciones guardan solo esa clave.
 */

const BD = 'caprino_fotos';
const ALMACEN = 'fotos';

const abrir = () =>
  new Promise((resolver, rechazar) => {
    const pet = indexedDB.open(BD, 1);
    pet.onupgradeneeded = () => pet.result.createObjectStore(ALMACEN);
    pet.onsuccess = () => resolver(pet.result);
    pet.onerror = () => rechazar(pet.error);
  });

const operar = async (modo, accion) => {
  const bd = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = bd.transaction(ALMACEN, modo);
    const pet = accion(tx.objectStore(ALMACEN));
    tx.oncomplete = () => { bd.close(); resolver(pet?.result); };
    tx.onerror = () => { bd.close(); rechazar(tx.error); };
  });
};

/** Guarda un Blob y devuelve su clave. */
export const guardarFoto = async (blob) => {
  const clave = `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await operar('readwrite', (a) => a.put(blob, clave));
  return clave;
};

export const leerFoto = (clave) => operar('readonly', (a) => a.get(clave));

export const borrarFoto = (clave) => operar('readwrite', (a) => a.delete(clave));

export const borrarFotos = async (claves = []) => {
  for (const c of claves) {
    try { await borrarFoto(c); } catch { /* ya no existe */ }
  }
};
