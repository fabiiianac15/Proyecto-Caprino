import React from 'react';
import {
  Sparkles, RotateCcw, Loader2, CheckCircle2, AlertTriangle, XCircle, Info, User, Heart,
} from 'lucide-react';

// ── Formato ──────────────────────────────────────────────────────────────────
export const pct = (v, dec = 1) => (v == null ? '—' : `${Math.round(v * 100 * 10 ** dec) / 10 ** dec} %`);
export const signo = (v, dec = 2) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(dec)}`);
export const edadTexto = (meses) => {
  if (meses == null) return null;
  if (meses < 24) return `${Math.round(meses)} meses`;
  const a = Math.floor(meses / 12);
  const m = Math.round(meses % 12);
  return `${a} año${a > 1 ? 's' : ''}${m ? ` ${m} m` : ''}`;
};
export const hoyISO = () => new Date().toISOString().split('T')[0];

// ── Clasificación del cruce (estado: icono + texto, nunca solo color) ───────
export const CONFIG_CLASIFICACION = {
  'Recomendado':         { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', barra: '#10b981', Icono: CheckCircle2 },
  'Precaución':          { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   barra: '#f59e0b', Icono: AlertTriangle },
  'No recomendado':      { color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     barra: '#ef4444', Icono: XCircle },
  'Datos insuficientes': { color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200',    barra: '#9ca3af', Icono: Info },
};
export const cfgClasificacion = (c) => CONFIG_CLASIFICACION[c] ?? CONFIG_CLASIFICACION['Datos insuficientes'];

export const colorScore = (s) => (s >= 72 ? 'text-emerald-600' : s >= 50 ? 'text-amber-600' : 'text-red-500');
export const barraScore = (s) => (s >= 72 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444');

export const ETIQUETA_CONFIANZA = { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja', sin_datos: 'Sin datos' };
export const PillConfianza = ({ c, className = '' }) => (
  <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
    c === 'alta' ? 'bg-emerald-100 text-emerald-700'
      : c === 'media' ? 'bg-amber-100 text-amber-700'
      : c === 'baja' ? 'bg-orange-100 text-orange-700'
      : 'bg-gray-100 text-gray-500'} ${className}`}>
    {ETIQUETA_CONFIANZA[c] || c}
  </span>
);

export const BadgeClasificacion = ({ c, grande = false }) => {
  const cfg = cfgClasificacion(c);
  const { Icono } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}
      ${grande ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5'}`}>
      <Icono className={grande ? 'w-4 h-4' : 'w-3 h-3'} /> {c}
    </span>
  );
};

export const IconoSexo = ({ sexo, className = 'w-4 h-4' }) =>
  sexo === 'macho' ? <User className={`${className} text-blue-500`} /> : <Heart className={`${className} text-pink-500`} />;

// ── Paleta diverging (validada: CVD y contraste en modo claro) ───────────────
export const FAVOR = '#0d9488';   // teal-600: empuja a favor
export const CONTRA = '#ea580c';  // orange-600: empuja en contra

// ── Markdown ligero para la narrativa de la IA ──────────────────────────────
const renderInline = (texto) =>
  texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-800">{parte.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{parte}</React.Fragment>
  );

export const MarkdownLigero = ({ texto }) => (
  <div className="space-y-2">
    {texto.split('\n').map((linea, i) => {
      const l = linea.trimEnd();
      if (!l.trim()) return <div key={i} className="h-1" />;
      if (l.trim().startsWith('```')) return null;
      if (l.startsWith('## ') || l.startsWith('### ')) {
        return (
          <h4 key={i} className="text-sm font-bold text-violet-700 mt-4 first:mt-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {renderInline(l.replace(/^#+\s/, ''))}
          </h4>
        );
      }
      if (l.startsWith('> ')) {
        return (
          <p key={i} className="text-xs text-amber-700 bg-amber-50 border-l-2 border-amber-300 pl-3 py-1.5 rounded-r">
            {renderInline(l.replace(/^>\s*/, ''))}
          </p>
        );
      }
      if (l.startsWith('- ') || l.startsWith('* ')) {
        return <p key={i} className="text-sm text-gray-600 leading-relaxed pl-3">• {renderInline(l.slice(2))}</p>;
      }
      return <p key={i} className="text-sm text-gray-600 leading-relaxed">{renderInline(l)}</p>;
    })}
  </div>
);

// ── Panel del análisis generado por la IA local ─────────────────────────────
export const AnalisisIA = ({ texto, cargando, error, onRegenerar, titulo = 'Análisis del asistente de IA' }) => (
  <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <Sparkles className={`w-5 h-5 text-violet-600 ${cargando ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-800">{titulo}</h3>
          <p className="text-[11px] text-gray-400">IA local (Ollama) · solo redacta lo que calculó el sistema, no inventa cifras</p>
        </div>
      </div>
      {!cargando && (texto || error) && onRegenerar && (
        <button onClick={onRegenerar}
          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Regenerar
        </button>
      )}
    </div>
    {error && !texto && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
    {texto
      ? <MarkdownLigero texto={texto} />
      : cargando && (
        <div className="flex items-center gap-2 text-xs text-violet-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Redactando el análisis a partir de los resultados…
        </div>
      )}
    {cargando && texto && <span className="inline-block w-2 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />}
  </div>
);

// ── Tarjeta contenedora con el estilo del módulo ─────────────────────────────
export const Tarjeta = ({ titulo, icono: Icono, accion, children, className = '', subtitulo }) => (
  <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
    {(titulo || accion) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {titulo && (
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              {Icono && <Icono className="w-4 h-4 text-teal-600" />} {titulo}
            </h3>
          )}
          {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
        </div>
        {accion}
      </div>
    )}
    {children}
  </div>
);
