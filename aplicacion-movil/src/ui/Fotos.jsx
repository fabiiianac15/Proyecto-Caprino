/**
 * Fotos de evidencia guardadas en el teléfono: miniaturas, visor a pantalla
 * completa y botón para tomar una nueva con la cámara.
 */

import { useEffect, useState } from 'react';
import { Camera, X, Image as IconoImagen } from 'lucide-react';
import { leerFoto } from '@servicios/fotosLocales';
import { tomarFoto } from '@servicios/camara';
import { guardarFoto } from '@servicios/fotosLocales';
import { useAvisos } from './Avisos';

/** URL temporal de una foto local (se libera al desmontar). */
export function useFotoLocal(clave) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let vivo = true;
    let creada;
    if (!clave) { setUrl(null); return undefined; }
    leerFoto(clave).then((blob) => {
      if (!vivo || !blob) return;
      creada = URL.createObjectURL(blob);
      setUrl(creada);
    });
    return () => { vivo = false; if (creada) URL.revokeObjectURL(creada); };
  }, [clave]);
  return url;
}

export function Miniatura({ clave, alQuitar, alVer, className = 'w-[76px] h-[76px]' }) {
  const url = useFotoLocal(clave);
  return (
    <div className={`relative shrink-0 ${className}`}>
      <button type="button" onClick={() => url && alVer?.(url)} className="w-full h-full rounded-xl overflow-hidden bg-relleno flex items-center justify-center" aria-label="Ver foto">
        {url ? <img src={url} alt="Foto de evidencia" className="w-full h-full object-cover" /> : <IconoImagen className="w-6 h-6 text-terciario" />}
      </button>
      {alQuitar && (
        <button type="button" onClick={alQuitar} aria-label="Quitar foto"
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-texto text-fondo flex items-center justify-center shadow">
          <X className="w-4 h-4" strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
}

export function Visor({ url, alCerrar }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" role="dialog" aria-label="Foto">
      <img src={url} alt="Foto de evidencia" className="max-w-full max-h-full" />
      <button onClick={alCerrar} className="absolute top-3 right-3 seguro-arriba w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center" aria-label="Cerrar foto">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

/** Tira de fotos con botón de cámara. `claves` son las fotos ya tomadas. */
export function GaleriaFotos({ claves = [], alCambiar, maximo = 6 }) {
  const avisos = useAvisos();
  const [visor, setVisor] = useState(null);
  const [tomando, setTomando] = useState(false);

  const agregar = async () => {
    setTomando(true);
    try {
      const blob = await tomarFoto('camara');
      if (blob) alCambiar([...claves, await guardarFoto(blob)]);
    } catch (e) {
      avisos.error('No se tomó la foto', e.message);
    } finally {
      setTomando(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1">
        {claves.map((c) => (
          <Miniatura key={c} clave={c} alVer={setVisor} alQuitar={() => alCambiar(claves.filter((x) => x !== c))} />
        ))}
        {claves.length < maximo && (
          <button type="button" onClick={agregar} disabled={tomando}
            className="w-[76px] h-[76px] shrink-0 rounded-xl bg-acento/[0.12] text-acento flex flex-col items-center justify-center gap-1 active:opacity-60 disabled:opacity-40">
            <Camera className="w-6 h-6" />
            <span className="t-mini font-semibold">{tomando ? 'Abriendo…' : 'Tomar foto'}</span>
          </button>
        )}
      </div>
      <Visor url={visor} alCerrar={() => setVisor(null)} />
    </>
  );
}
