/**
 * Medir sobre una foto con una vara de referencia.
 *
 * 1. Foto: se toma (o se reutiliza una de esta evaluación) con la vara o el
 *    bastón parado junto a la cabra, en la misma línea del cuerpo.
 * 2. Vara: se marcan sus dos extremos y se escribe su largo real → px por cm.
 *    La calibración queda guardada con la foto para medir otras cosas en ella.
 * 3. Medida: se marcan los dos puntos (p. ej. piso y cruz) y sale el valor en cm.
 *
 * Los puntos se guardan en píxeles de la imagen original, así el resultado no
 * depende del tamaño de la pantalla. Al arrastrar un punto se ve una lupa x3.
 * Es una estimación (≈3-5 % de error con foto perpendicular): por eso la
 * medida queda marcada como FOTO y no como de instrumento.
 */

import { useRef, useState } from 'react';
import { Camera, Image as IconoImagen, X, Ruler, RotateCcw, Info } from 'lucide-react';
import { tomarFoto } from '@servicios/camara';
import { guardarFoto, borrarFoto } from '@servicios/fotosLocales';
import { useFotoLocal, Miniatura } from './Fotos';
import { Boton } from './Controles';
import { useAvisos } from './Avisos';

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const fmt = (v) => (Math.round(v * 10) / 10).toLocaleString('es-CO', { maximumFractionDigits: 1 });

function Lienzo({ url, puntos, color, alCambiar, etiquetaLinea }) {
  const envoltura = useRef(null);
  const [nat, setNat] = useState(null);       // tamaño natural de la imagen
  const [arrastre, setArrastre] = useState(null); // { i, cliente:{x,y} }

  const aNatural = (e) => {
    const r = envoltura.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(nat.w, ((e.clientX - r.left) / r.width) * nat.w)),
      y: Math.max(0, Math.min(nat.h, ((e.clientY - r.top) / r.height) * nat.h)),
    };
  };
  const escala = () => (nat ? envoltura.current.getBoundingClientRect().width / nat.w : 1);

  const abajo = (e) => {
    if (!nat) return;
    e.preventDefault();
    const p = aNatural(e);
    // ¿Toca cerca de un punto existente? (40 px de pantalla) → se arrastra
    const radio = 40 / escala();
    let i = puntos.findIndex((q) => q && dist(q, p) < radio);
    if (i === -1) {
      i = !puntos[0] ? 0 : !puntos[1] ? 1 : (dist(puntos[0], p) < dist(puntos[1], p) ? 0 : 1);
      const nuevos = [...puntos]; nuevos[i] = p; alCambiar(nuevos);
    }
    envoltura.current.setPointerCapture?.(e.pointerId);
    setArrastre({ i, cliente: { x: e.clientX, y: e.clientY } });
  };
  const mover = (e) => {
    if (!arrastre) return;
    const nuevos = [...puntos]; nuevos[arrastre.i] = aNatural(e); alCambiar(nuevos);
    setArrastre({ ...arrastre, cliente: { x: e.clientX, y: e.clientY } });
  };
  const arriba = () => setArrastre(null);

  // Lupa: muestra x3 la zona bajo el dedo, desplazada hacia arriba para que el dedo no la tape
  const lupa = (() => {
    if (!arrastre || !nat || !puntos[arrastre.i]) return null;
    const r = envoltura.current.getBoundingClientRect();
    const z = 3; const tam = 120;
    const p = puntos[arrastre.i];
    const px = (p.x / nat.w) * r.width; const py = (p.y / nat.h) * r.height;
    return {
      left: arrastre.cliente.x - tam / 2, top: arrastre.cliente.y - tam - 50, tam,
      fondo: { backgroundImage: `url(${url})`, backgroundSize: `${r.width * z}px ${r.height * z}px`, backgroundPosition: `${-(px * z - tam / 2)}px ${-(py * z - tam / 2)}px` },
    };
  })();

  const [a, b] = puntos;
  const sw = nat ? Math.max(2, nat.w / 260) : 2;
  return (
    <>
      <div ref={envoltura} className="relative w-full select-none touch-none" onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba}>
        <img src={url} alt="Foto para medir" draggable={false} className="block w-full h-auto"
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
        {nat && (
          <svg viewBox={`0 0 ${nat.w} ${nat.h}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            {a && b && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={sw * 1.4} strokeDasharray={`${sw * 4} ${sw * 2}`} />}
            {[a, b].map((p, i) => p && (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={sw * 7} fill="none" stroke="white" strokeWidth={sw * 1.6} />
                <circle cx={p.x} cy={p.y} r={sw * 7} fill="none" stroke={color} strokeWidth={sw} />
                <line x1={p.x - sw * 4} y1={p.y} x2={p.x + sw * 4} y2={p.y} stroke={color} strokeWidth={sw * 0.8} />
                <line x1={p.x} y1={p.y - sw * 4} x2={p.x} y2={p.y + sw * 4} stroke={color} strokeWidth={sw * 0.8} />
              </g>
            ))}
          </svg>
        )}
        {etiquetaLinea && a && b && (
          <span className="absolute px-2 py-0.5 rounded-md bg-black/70 text-white t-nota font-semibold pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: `${((a.x + b.x) / 2 / (nat?.w || 1)) * 100}%`, top: `${((Math.min(a.y, b.y)) / (nat?.h || 1)) * 100}%` }}>
            {etiquetaLinea}
          </span>
        )}
      </div>
      {lupa && (
        <div className="fixed z-[60] rounded-full border-4 border-white shadow-lg overflow-hidden pointer-events-none"
          style={{ left: lupa.left, top: Math.max(8, lupa.top), width: lupa.tam, height: lupa.tam, ...lupa.fondo, backgroundRepeat: 'no-repeat' }}>
          <span className="absolute left-1/2 top-1/2 w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2" style={{ borderColor: color }} />
        </div>
      )}
    </>
  );
}

export default function MedidorFoto({ medida, fotos = [], calibraciones = {}, alGuardar, alCerrar }) {
  const avisos = useAvisos();
  const [clave, setClave] = useState(null);
  const [nueva, setNueva] = useState(false);
  const [etapa, setEtapa] = useState('foto');      // foto | vara | medir
  const [vara, setVara] = useState([null, null]);
  const [cm, setCm] = useState('100');
  const [puntos, setPuntos] = useState([null, null]);
  const [tomando, setTomando] = useState(false);
  const url = useFotoLocal(clave);

  const cerrar = () => { if (nueva && clave) borrarFoto(clave); alCerrar(); };

  const usar = (c, esNueva) => {
    setClave(c); setNueva(esNueva); setPuntos([null, null]);
    const cal = calibraciones[c];
    if (cal) { setVara([cal.a, cal.b]); setCm(String(cal.cm)); setEtapa('medir'); } else { setVara([null, null]); setEtapa('vara'); }
  };
  const tomar = async (origen) => {
    setTomando(true);
    try {
      const blob = await tomarFoto(origen);
      if (blob) usar(await guardarFoto(blob), true);
    } catch (e) { avisos.error('No se tomó la foto', e.message); }
    finally { setTomando(false); }
  };

  const largoVaraPx = vara[0] && vara[1] ? dist(vara[0], vara[1]) : 0;
  const cmNum = Number(String(cm).replace(',', '.'));
  const pxPorCm = largoVaraPx && cmNum > 0 ? largoVaraPx / cmNum : 0;
  const valor = pxPorCm && puntos[0] && puntos[1] ? dist(puntos[0], puntos[1]) / pxPorCm : null;
  const varaCorta = largoVaraPx > 0 && largoVaraPx < 150;   // vara muy chica en la foto: poca precisión

  const guardar = () => {
    if (!valor) return;
    alGuardar({ valor: Math.round(valor * 10) / 10, clave, nueva, calibracion: { a: vara[0], b: vara[1], cm: cmNum } });
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-md bg-[#101411] text-white flex flex-col" role="dialog" aria-label={`Medir ${medida.nombre} en foto`}>
      <header className="seguro-arriba flex items-center gap-2 px-2 min-h-[56px] border-b border-white/10">
        <button onClick={cerrar} className="w-11 h-11 flex items-center justify-center active:opacity-60" aria-label="Cerrar"><X className="w-6 h-6" /></button>
        <div className="flex-1 min-w-0">
          <p className="t-nota text-white/60">Medir en foto</p>
          <p className="t-encabezado truncate">{medida.nombre}</p>
        </div>
        {etapa === 'medir' && (
          <button onClick={() => { setEtapa('vara'); setPuntos([null, null]); }} className="flex items-center gap-1 px-3 min-h-[44px] t-nota text-white/80 active:opacity-60">
            <RotateCcw className="w-4 h-4" /> Vara
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {etapa === 'foto' && (
          <div className="p-5 space-y-4">
            <div className="rounded-2xl bg-white/5 p-4 t-sub text-white/85 space-y-2">
              <p className="flex gap-2"><Info className="w-5 h-5 shrink-0 text-[#D7A85C]" />Ponga la vara o el bastón <b>parado junto a la cabra, en la misma línea del cuerpo</b>.</p>
              <p>Tome la foto de lado (o de frente, según la medida), a 2-3 m, agachado a la altura de la barriga y sin zoom. Que la vara y los dos puntos a medir se vean completos.</p>
              {medida.comoMedir && <p className="text-white/60">Qué se mide: {medida.comoMedir}</p>}
            </div>
            <Boton Icono={Camera} onClick={() => tomar('camara')} disabled={tomando}>{tomando ? 'Abriendo…' : 'Tomar foto'}</Boton>
            <Boton variante="gris" Icono={IconoImagen} onClick={() => tomar('galeria')} disabled={tomando}>Elegir de la galería</Boton>
            {fotos.length > 0 && (
              <div>
                <p className="t-sub text-white/70 mb-2">O use una foto que ya tomó en esta evaluación (si ya marcó la vara, no hay que repetirla):</p>
                <div className="flex gap-3 overflow-x-auto sin-barra py-1">
                  {fotos.map((c) => (
                    <button key={c} onClick={() => usar(c, false)} className="relative shrink-0" aria-label="Usar esta foto">
                      <Miniatura clave={c} className="w-[92px] h-[92px]" />
                      {calibraciones[c] && <span className="absolute bottom-1 left-1 right-1 rounded bg-black/70 t-mini text-center">vara lista</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {etapa !== 'foto' && url && (
          <>
            <div className="px-4 py-3 t-sub text-white/85 bg-white/5">
              {etapa === 'vara'
                ? <>Paso 1 de 2: toque los <b className="text-[#D7A85C]">dos extremos de la vara</b>. Arrastre los puntos para ajustarlos.</>
                : <>Paso 2 de 2: toque los <b className="text-[#8CBA92]">dos puntos de la medida</b>. {medida.comoMedir}</>}
            </div>
            <Lienzo url={url} color={etapa === 'vara' ? '#D7A85C' : '#8CBA92'}
              puntos={etapa === 'vara' ? vara : puntos}
              alCambiar={etapa === 'vara' ? setVara : setPuntos}
              etiquetaLinea={etapa === 'vara' ? (cmNum > 0 && largoVaraPx ? `${fmt(cmNum)} cm` : null) : (valor ? `${fmt(valor)} cm` : null)} />
          </>
        )}
      </div>

      {etapa === 'vara' && (
        <footer className="seguro-abajo p-4 space-y-3 border-t border-white/10">
          <label className="flex items-center gap-3">
            <span className="flex-1 t-sub">Largo real de la vara</span>
            <input value={cm} onChange={(e) => setCm(e.target.value.replace(/[^0-9.,]/g, ''))} inputMode="decimal"
              className="w-24 min-h-[44px] rounded-xl bg-white/10 px-3 text-right text-white focus:outline-none focus:ring-2 focus:ring-[#8CBA92]" aria-label="Largo real de la vara en centímetros" />
            <span className="t-sub w-6">cm</span>
          </label>
          {varaCorta && <p className="t-nota text-[#ECB866]">La vara se ve muy pequeña en la foto: acérquese un poco para que la medida sea más precisa.</p>}
          <Boton onClick={() => setEtapa('medir')} disabled={!pxPorCm} Icono={Ruler}>Vara lista, medir</Boton>
        </footer>
      )}
      {etapa === 'medir' && (
        <footer className="seguro-abajo p-4 space-y-2 border-t border-white/10">
          <p className="t-nota text-white/60">Estimación sobre la foto (error de 3 a 5 % si la foto está derecha). Quedará marcada como «medida en foto».</p>
          <Boton onClick={guardar} disabled={!valor}>{valor ? `Guardar ${fmt(valor)} ${medida.unidad}` : 'Marque los dos puntos'}</Boton>
        </footer>
      )}
    </div>
  );
}
