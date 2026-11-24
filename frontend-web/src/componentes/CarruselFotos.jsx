import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, ImageOff, RefreshCw } from 'lucide-react';

/**
 * Carrusel de fotos con deslizamiento animado.
 *
 * items: [{ key, url, protegida?, etiqueta?, descripcion?, extra? }]
 *   - protegida: la URL exige el token (fotos de evaluaciones); se descarga
 *     con fetch y se muestra como blob.
 *   - extra: nodo opcional que se pinta sobre la foto (botones de acción).
 * Se maneja con flechas, puntos, miniaturas, teclado y arrastrando con el
 * dedo o el mouse. "Ampliar" abre la misma foto a pantalla completa.
 */

// Descarga con token las fotos protegidas; las públicas pasan tal cual.
const useSrc = (url, protegida) => {
  const [src, setSrc] = useState(protegida ? null : url);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!protegida) { setSrc(url); setError(false); return undefined; }
    let creada;
    let vivo = true;
    setSrc(null); setError(false);
    const token = localStorage.getItem('token');
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => { if (vivo) { creada = URL.createObjectURL(b); setSrc(creada); } })
      .catch(() => vivo && setError(true));
    return () => { vivo = false; if (creada) URL.revokeObjectURL(creada); };
  }, [url, protegida]);
  return { src, error };
};

const Imagen = ({ item, className, contain = false }) => {
  const { src, error } = useSrc(item.url, item.protegida);
  if (error) return <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-300`}><ImageOff className="w-8 h-8" /></div>;
  if (!src) return <div className={`${className} flex items-center justify-center bg-gray-100`}><RefreshCw className="w-5 h-5 animate-spin text-gray-300" /></div>;
  return <img src={src} alt={item.etiqueta || 'Foto'} draggable={false} className={`${className} ${contain ? 'object-contain' : 'object-cover'} select-none`} />;
};

const CarruselFotos = ({ items = [], alto = 'h-72 sm:h-96', vacio = 'Sin fotos todavía', inicial = 0, onCambio }) => {
  const [i, setI] = useState(Math.min(inicial, Math.max(0, items.length - 1)));
  const [ampliada, setAmpliada] = useState(false);
  const [arrastre, setArrastre] = useState(0);
  const inicio = useRef(null);
  const caja = useRef(null);

  const n = items.length;
  useEffect(() => { if (i > n - 1) setI(Math.max(0, n - 1)); }, [n, i]);
  useEffect(() => { onCambio?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const ir = useCallback((k) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (!ampliada) return undefined;
    const tecla = (e) => {
      if (e.key === 'Escape') setAmpliada(false);
      if (e.key === 'ArrowRight') ir(i + 1);
      if (e.key === 'ArrowLeft') ir(i - 1);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [ampliada, i, ir]);

  if (!n) {
    return (
      <div className={`${alto} rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400`}>
        <ImageOff className="w-10 h-10 mb-2" />
        <p className="text-base">{vacio}</p>
      </div>
    );
  }

  // Arrastre con dedo o mouse
  const empezar = (x) => { inicio.current = x; };
  const mover = (x) => { if (inicio.current !== null) setArrastre(x - inicio.current); };
  const soltar = () => {
    if (inicio.current === null) return;
    const ancho = caja.current?.offsetWidth || 1;
    if (arrastre < -ancho * 0.18) ir(i + 1);
    else if (arrastre > ancho * 0.18) ir(i - 1);
    inicio.current = null;
    setArrastre(0);
  };

  const actual = items[i];
  const pista = (claseImg, contain) => (
    <div
      className="flex h-full"
      style={{
        transform: `translateX(calc(${-i * 100}% + ${arrastre}px))`,
        transition: inicio.current !== null ? 'none' : 'transform 450ms cubic-bezier(.22,.8,.26,1)',
      }}
    >
      {items.map((it, k) => (
        <div key={it.key ?? k} className="w-full h-full shrink-0 relative">
          {/* Solo se cargan la actual y las vecinas */}
          {Math.abs(k - i) <= 1 || (i === 0 && k === n - 1) || (i === n - 1 && k === 0)
            ? <Imagen item={it} className={claseImg} contain={contain} />
            : <div className={`${claseImg} bg-gray-100`} />}
        </div>
      ))}
    </div>
  );

  const Flecha = ({ lado }) => n > 1 && (
    <button type="button" aria-label={lado === 'izq' ? 'Foto anterior' : 'Foto siguiente'}
      onClick={(e) => { e.stopPropagation(); ir(lado === 'izq' ? i - 1 : i + 1); }}
      className={`absolute top-1/2 -translate-y-1/2 ${lado === 'izq' ? 'left-3' : 'right-3'} w-12 h-12 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95`}>
      {lado === 'izq' ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
    </button>
  );

  return (
    <div className="select-none">
      <div
        ref={caja}
        className={`relative ${alto} rounded-2xl overflow-hidden bg-gray-900 shadow-sm touch-pan-y cursor-grab active:cursor-grabbing`}
        onTouchStart={(e) => empezar(e.touches[0].clientX)}
        onTouchMove={(e) => mover(e.touches[0].clientX)}
        onTouchEnd={soltar}
        onMouseDown={(e) => empezar(e.clientX)}
        onMouseMove={(e) => mover(e.clientX)}
        onMouseUp={soltar}
        onMouseLeave={soltar}
      >
        {pista('w-full h-full', false)}

        {/* Etiqueta de la vista */}
        {actual.etiqueta && (
          <div key={`et-${i}`} className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-semibold backdrop-blur-sm animate-[aparecer_.35s_ease-out]">
            {actual.etiqueta}
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {actual.extra}
          <button type="button" onClick={() => setAmpliada(true)} aria-label="Ver en grande"
            className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
        {actual.descripcion && (
          <p className="absolute bottom-10 left-3 right-3 text-white text-sm drop-shadow">{actual.descripcion}</p>
        )}

        <Flecha lado="izq" />
        <Flecha lado="der" />

        {/* Puntos */}
        {n > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {items.map((it, k) => (
              <button key={it.key ?? k} type="button" aria-label={`Foto ${k + 1}`} onClick={() => ir(k)}
                className={`h-2.5 rounded-full transition-all duration-300 ${k === i ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((it, k) => (
            <button key={it.key ?? k} type="button" onClick={() => ir(k)}
              className={`relative shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition ${k === i ? 'border-emerald-500 scale-105 shadow' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <Imagen item={it} className="w-full h-full" />
              {it.etiqueta && <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[11px] leading-4 px-1 truncate">{it.etiqueta}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Pantalla completa */}
      {ampliada && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-[aparecer_.25s_ease-out]" role="dialog" aria-label="Foto ampliada">
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-lg font-semibold">{actual.etiqueta} <span className="text-white/50 text-base font-normal">· {i + 1} de {n}</span></p>
            <button type="button" onClick={() => setAmpliada(false)} aria-label="Cerrar" className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"><X className="w-7 h-7" /></button>
          </div>
          <div className="relative flex-1 overflow-hidden"
            onTouchStart={(e) => empezar(e.touches[0].clientX)} onTouchMove={(e) => mover(e.touches[0].clientX)} onTouchEnd={soltar}>
            {pista('w-full h-full', true)}
            <Flecha lado="izq" />
            <Flecha lado="der" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CarruselFotos;
