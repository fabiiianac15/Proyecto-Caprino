/**
 * Carrusel de fotos de una cabra (galería por vistas: de lado, de frente,
 * desde atrás, cabeza, ubre o testículos, patas). Se desliza con el dedo,
 * tiene puntos y etiqueta de la vista. Las fotos vienen del servidor; la
 * lista se guarda en el teléfono para verla sin señal (si las imágenes ya
 * se habían cargado, el WebView las tiene en caché).
 *
 * HojaNuevaFoto: elegir la vista y tomar la foto (necesita internet).
 */

import { useEffect, useRef, useState } from 'react';
import { Camera, Image as IconoImagen, Star, Trash2 } from 'lucide-react';
import api from '@servicios/api';
import { tomarFoto } from '@servicios/camara';
import { leerLocal, escribirLocal } from '@servicios/almacenamientoLocal';
import { origenServidor } from '@servicios/config';
import IconoCabra from './IconoCabra';
import Hoja from './Hoja';
import { Boton } from './Controles';

export const VISTAS_ANIMAL = [
  { clave: 'LATERAL', etiqueta: 'De lado' },
  { clave: 'FRONTAL', etiqueta: 'De frente' },
  { clave: 'POSTERIOR', etiqueta: 'Desde atrás' },
  { clave: 'CABEZA', etiqueta: 'Cabeza' },
  { clave: 'UBRE', etiqueta: 'Ubre', sexo: 'hembra' },
  { clave: 'TESTICULOS', etiqueta: 'Testículos', sexo: 'macho' },
  { clave: 'PATAS', etiqueta: 'Patas' },
  { clave: 'OTRA', etiqueta: 'Otra' },
];
const etiqueta = (k) => VISTAS_ANIMAL.find((v) => v.clave === k)?.etiqueta || 'Foto';
const CLAVE = (id) => `caprino_fotos_${id}`;
const url = (f) => (/^(https?:|data:)/i.test(f) ? f : `${origenServidor()}${f.startsWith('/') ? '' : '/'}${f}`);

/** Fotos de la galería: guardadas en el teléfono y refrescadas del servidor. */
export function useFotosAnimal(id) {
  const [fotos, setFotos] = useState(() => leerLocal(CLAVE(id), []));
  const poner = (lista) => { setFotos(lista); escribirLocal(CLAVE(id), lista); };
  useEffect(() => {
    api.get(`/animales/${id}/fotos`, { timeout: 15000 }).then((r) => poner(r.data?.data || [])).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return [fotos, poner];
}

export default function CarruselAnimal({ fotos, sexo, alto = 'h-[320px]', alAcciones }) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const inicio = useRef(null);
  const n = fotos.length;
  useEffect(() => { if (i > n - 1) setI(Math.max(0, n - 1)); }, [n, i]);

  if (!n) {
    return (
      <div className={`relative ${alto} bg-relleno flex items-center justify-center text-salvia`}>
        <IconoCabra sexo={sexo} className="w-24 h-24" />
      </div>
    );
  }
  const ir = (k) => setI(((k % n) + n) % n);
  const soltar = () => {
    if (inicio.current == null) return;
    if (dx < -60) ir(i + 1); else if (dx > 60) ir(i - 1);
    inicio.current = null; setDx(0);
  };
  const actual = fotos[i];

  return (
    <div className={`relative ${alto} bg-black overflow-hidden`}
      onTouchStart={(e) => { inicio.current = e.touches[0].clientX; }}
      onTouchMove={(e) => inicio.current != null && setDx(e.touches[0].clientX - inicio.current)}
      onTouchEnd={soltar}>
      <div className="flex h-full" style={{
        transform: `translateX(calc(${-i * 100}% + ${dx}px))`,
        transition: inicio.current != null ? 'none' : 'transform 420ms cubic-bezier(.22,.8,.26,1)',
      }}>
        {fotos.map((f, k) => (
          <div key={f.idFoto ?? f.url} className="w-full h-full shrink-0">
            {Math.abs(k - i) <= 1 && <img src={url(f.url)} alt={etiqueta(f.tipoVista)} className="w-full h-full object-cover" draggable={false} />}
          </div>
        ))}
      </div>
      <span className="absolute inset-x-0 top-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgb(0 0 0 / 0.35), transparent)' }} aria-hidden="true" />
      <span key={i} className="absolute left-4 bottom-12 px-3 py-1.5 rounded-full bg-black/55 text-white t-sub font-semibold">
        {etiqueta(actual.tipoVista)}{actual.principal ? ' · principal' : ''}
      </span>
      {alAcciones && <div className="absolute right-3 bottom-11 flex gap-2">{alAcciones(actual)}</div>}
      {n > 1 && (
        <div className="absolute bottom-12 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
          {fotos.map((f, k) => (
            <span key={f.idFoto ?? f.url} className={`h-2 rounded-full transition-all duration-300 ${k === i ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Hoja para agregar una foto a la galería: primero la vista, luego cámara o galería. */
export function HojaNuevaFoto({ abierta, alCerrar, idAnimal, sexo, alSubir, avisos }) {
  const [vista, setVista] = useState('LATERAL');
  const [subiendo, setSubiendo] = useState(false);
  const vistas = VISTAS_ANIMAL.filter((v) => !v.sexo || v.sexo === sexo);
  const tomar = async (origen) => {
    setSubiendo(true);
    try {
      const blob = await tomarFoto(origen);
      if (!blob) return;
      const fd = new FormData();
      fd.append('file', blob, 'foto.jpg');
      fd.append('tipoVista', vista);
      const { data } = await api.post(`/animales/${idAnimal}/fotos`, fd, { timeout: 60000 });
      alSubir(data.data || []);
      avisos?.exito('Foto guardada', etiqueta(vista));
      alCerrar();
    } catch (e) {
      avisos?.error('No se subió la foto', e.response?.data?.error || (e.message?.includes('Network') ? 'Necesita internet para subir fotos de la cabra.' : e.message));
    } finally {
      setSubiendo(false);
    }
  };
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Agregar foto">
      <div className="px-4 pb-8">
        <h3 className="cabecera-seccion">1. ¿Qué foto va a tomar?</h3>
        <div className="grid grid-cols-2 gap-2">
          {vistas.map((v) => (
            <button key={v.clave} type="button" onClick={() => setVista(v.clave)}
              className={`min-h-[52px] rounded-xl t-encabezado ${vista === v.clave ? 'bg-acento text-sobre-acento' : 'bg-relleno'}`}>{v.etiqueta}</button>
          ))}
        </div>
        <h3 className="cabecera-seccion mt-5">2. Tómela</h3>
        <div className="grid grid-cols-2 gap-2">
          <Boton Icono={Camera} onClick={() => tomar('camara')} disabled={subiendo}>{subiendo ? 'Subiendo…' : 'Cámara'}</Boton>
          <Boton variante="gris" Icono={IconoImagen} onClick={() => tomar('galeria')} disabled={subiendo}>Galería</Boton>
        </div>
        <p className="pie-seccion">Animal completo, a 2-3 m, sin zoom y en piso plano. Se necesita internet para subirla.</p>
      </div>
    </Hoja>
  );
}

/** Botones sobre la foto actual: hacerla principal o borrarla. */
export function accionesFoto({ alPrincipal, alBorrar }) {
  return (f) => (f.idFoto ? (
    <>
      {!f.principal && (
        <button type="button" onClick={() => alPrincipal(f)} aria-label="Usar como foto principal"
          className="w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center active:opacity-70"><Star className="w-5 h-5" /></button>
      )}
      <button type="button" onClick={() => alBorrar(f)} aria-label="Eliminar foto"
        className="w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center active:opacity-70"><Trash2 className="w-5 h-5" /></button>
    </>
  ) : null);
}
