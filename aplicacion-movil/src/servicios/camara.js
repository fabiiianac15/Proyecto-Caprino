/**
 * Tomar una foto de evidencia.
 *
 * En el teléfono usa la cámara nativa (@capacitor/camera); en el navegador
 * abre el selector de archivos. Siempre devuelve un Blob JPEG reducido a un
 * tamaño razonable para subirlo con datos móviles.
 */

import { Capacitor } from '@capacitor/core';

const LADO_MAXIMO = 1600;
const CALIDAD = 0.7;
// El servidor (nginx) rechaza subidas de más de 1 MB: la foto se deja por debajo
const PESO_MAXIMO = 800 * 1024;

const aBlob = (lienzo, calidad) => new Promise((r) => lienzo.toBlob(r, 'image/jpeg', calidad));

const dibujar = (img, lado) => {
  const escala = Math.min(1, lado / Math.max(img.width, img.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(img.width * escala);
  lienzo.height = Math.round(img.height * escala);
  lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return lienzo;
};

const reducir = (origen) =>
  new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = async () => {
      // Baja calidad y tamaño hasta que la foto quepa en el límite del servidor
      let blob = null;
      for (const [lado, calidad] of [[LADO_MAXIMO, CALIDAD], [LADO_MAXIMO, 0.55], [1280, 0.6], [1024, 0.55], [800, 0.5]]) {
        blob = await aBlob(dibujar(img, lado), calidad);
        if (blob && blob.size <= PESO_MAXIMO) break;
      }
      if (blob) resolver(blob); else rechazar(new Error('No se pudo procesar la foto'));
    };
    img.onerror = () => rechazar(new Error('No se pudo leer la foto'));
    img.src = origen;
  });

const desdeArchivo = () =>
  new Promise((resolver) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (!archivo) return resolver(null);
      const url = URL.createObjectURL(archivo);
      reducir(url).then(resolver).catch(() => resolver(null)).finally(() => URL.revokeObjectURL(url));
    };
    input.click();
  });

/**
 * @param {'camara'|'galeria'} origen
 * @returns {Promise<Blob|null>} null si la persona cancela
 */
export const tomarFoto = async (origen = 'camara') => {
  if (!Capacitor.isNativePlatform()) return desdeArchivo();

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  try {
    const foto = await Camera.getPhoto({
      source: origen === 'galeria' ? CameraSource.Photos : CameraSource.Camera,
      resultType: CameraResultType.DataUrl,
      quality: 80,
      width: LADO_MAXIMO,
      correctOrientation: true,
      saveToGallery: false,
    });
    return await reducir(foto.dataUrl);
  } catch (e) {
    // Cancelar no es un error
    if (/cancel/i.test(e?.message || '')) return null;
    throw new Error('No se pudo usar la cámara. Revise el permiso de cámara de la app.');
  }
};
