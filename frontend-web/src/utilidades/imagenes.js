// Reduce una foto antes de subirla: lado mayor de 1600 px y JPEG al 82 %.
// Una foto de celular (4-8 MB) queda en 250-600 KB y sube rápido con la
// señal de la granja. Si el navegador no puede leerla, se envía la original.
export async function reducirImagen(file, ladoMax = 1600, calidad = 0.82) {
  if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await cargar(file);
    const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && file.size < 900 * 1024) return file;
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', calidad));
    if (!blob || blob.size >= file.size) return file;
    const nombre = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

// createImageBitmap respeta la orientación EXIF; si no existe, se usa <img>.
function cargar(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); mal(e); };
    img.src = url;
  });
}
