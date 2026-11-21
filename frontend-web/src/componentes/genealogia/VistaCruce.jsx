import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ChevronLeft, Scale, Search, Brain, Loader2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Baby, Milk, Dna, Link2, Heart, Activity, Shield, Ruler, Users, GitBranch, Sparkles, Info, ArrowRightLeft,
} from 'lucide-react';
import { apiHelpers } from '../../servicios/api';
import ArbolHorizontal from './ArbolHorizontal';
import {
  pct, signo, edadTexto, hoyISO, cfgClasificacion, colorScore, barraScore, PillConfianza,
  BadgeClasificacion, IconoSexo, AnalisisIA, Tarjeta, FAVOR, CONTRA,
} from './comun';
import { nombreValido, etiquetaAnimal } from '../../utilidades/formateo';

const ICONO_DIM = {
  parto_exitoso: Baby, consanguinidad: Link2, merito_lechero: Milk, fertilidad: Heart,
  sanidad: Shield, aptitud_reproductiva: Activity, conformacion: Ruler, riesgo_hereditario: Dna,
  afinidad_razas: Users,
};
const DIMS_RIESGO = new Set(['consanguinidad', 'riesgo_hereditario']);
const NOMBRE_NIVEL = { 1: ['Padre', 'Madre'], 2: ['Abuelo', 'Abuela'], 3: ['Bisabuelo', 'Bisabuela'] };
const ANCHO = ['w-48', 'w-52', 'w-44', 'w-40'];

// ── Selector de un animal de la pareja ───────────────────────────────────────
const SlotAnimal = ({ sexo, animal, fijo, opciones, onElegir }) => {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const esMacho = sexo === 'macho';
  const filtrados = opciones.filter((a) => {
    const t = q.toLowerCase();
    return !t || a.codigo?.toLowerCase().includes(t) || a.nombre?.toLowerCase().includes(t) || (a.nombreRaza || '').toLowerCase().includes(t);
  });
  return (
    <div className={`relative flex-1 min-w-0 rounded-2xl border-2 p-4 ${esMacho ? 'border-blue-200 bg-blue-50/50' : 'border-pink-200 bg-pink-50/50'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${esMacho ? 'text-blue-600' : 'text-pink-600'}`}>{esMacho ? '♂ Macho' : '♀ Hembra'}</p>
      {animal ? (
        <div className="flex items-center gap-3 mt-2">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${esMacho ? 'bg-blue-100' : 'bg-pink-100'}`}>
            <IconoSexo sexo={sexo} className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-800 truncate">{animal.nombre || 'Sin nombre'}</p>
            <p className="text-xs text-gray-500 truncate"><span className="font-mono">{animal.codigo}</span> · {animal.nombreRaza || animal.raza || 'raza ?'}</p>
          </div>
          {!fijo && (
            <button onClick={() => setAbierto((v) => !v)} className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-lg hover:bg-white">Cambiar</button>
          )}
        </div>
      ) : (
        <button onClick={() => setAbierto((v) => !v)}
          className="mt-2 w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-700 bg-white/70">
          <span className="text-sm font-medium">Elegir {esMacho ? 'macho' : 'hembra'}…</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
      {abierto && (
        <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, nombre o raza..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtrados.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No hay {esMacho ? 'machos' : 'hembras'} activos</p>}
            {filtrados.map((a) => (
              <button key={a.id} onClick={() => { onElegir(a); setAbierto(false); setQ(''); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 flex items-center gap-2.5">
                <IconoSexo sexo={a.sexo} className="w-3.5 h-3.5 shrink-0" />
                <span className="text-sm text-gray-700 truncate"><b>{a.codigo}</b>{nombreValido(a.nombre) ? ` — ${nombreValido(a.nombre)}` : ''}</span>
                <span className="ml-auto text-[11px] text-gray-400 shrink-0">{a.nombreRaza || a.raza}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Cifras clave ─────────────────────────────────────────────────────────────
const Cifra = ({ icono: Icono, titulo, valor, detalle, estado }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4">
    <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5"><Icono className="w-3.5 h-3.5 text-teal-600" /> {titulo}</p>
    <p className="text-2xl font-black text-gray-800 mt-1">{valor}</p>
    {detalle && <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{detalle}</p>}
    {estado && <p className={`text-[11px] font-semibold mt-1 ${estado.color}`}>{estado.texto}</p>}
  </div>
);

// ── Leche esperada de una hija: intervalo frente a la media del rebaño ──────
const FranjaLeche = ({ leche }) => {
  const { esperado, intervalo80: [bajo, alto], media_rebano: media } = leche;
  const min = Math.min(bajo, media) - 0.2;
  const max = Math.max(alto, media) + 0.2;
  const pos = (v) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <div>
      <div className="relative h-12 mt-6 mb-2">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div className="absolute top-3.5 h-3.5 rounded-full bg-teal-100 border border-teal-300" style={{ left: pos(bajo), width: `calc(${pos(alto)} - ${pos(bajo)})` }} />
        <div className="absolute top-2.5 w-0.5 h-6 bg-gray-400" style={{ left: pos(media) }} />
        <span className="absolute -top-4 text-[10px] text-gray-500 -translate-x-1/2 whitespace-nowrap" style={{ left: pos(media) }}>rebaño {media}</span>
        <div className="absolute top-3 w-4 h-4 rounded-full bg-teal-600 ring-2 ring-white -translate-x-1/2" style={{ left: pos(esperado) }} />
        <span className="absolute top-8 text-xs font-bold text-teal-700 -translate-x-1/2 whitespace-nowrap" style={{ left: pos(esperado) }}>{esperado} L/día</span>
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{bajo} L</span><span>{alto} L</span>
      </div>
      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        Una hija de este cruce produciría unos <b className="text-gray-700">{esperado} L/día</b> en lactancia adulta.
        Con 80 % de probabilidad estará entre <b className="text-gray-700">{bajo}</b> y <b className="text-gray-700">{alto}</b> L/día.
        {leche.depresion_consanguinidad > 0.005 && ` La consanguinidad le resta ${leche.depresion_consanguinidad.toFixed(2)} L/día.`}
      </p>
    </div>
  );
};

// ── Valor genético de cada progenitor (con su confiabilidad) ────────────────
const ValorPadre = ({ titulo, ebv, conf, sexo }) => (
  <div className="flex items-center gap-3 py-2">
    <IconoSexo sexo={sexo} className="w-4 h-4 shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-gray-600 truncate">{titulo}</span>
        <span className="text-sm font-bold text-gray-800 tabular-nums">{signo(ebv)} L/día</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.round(conf * 100)}%` }} />
        </div>
        <span className="text-[10px] text-gray-400 w-24 text-right">confiabilidad {Math.round(conf * 100)} %</span>
      </div>
    </div>
  </div>
);

// ── Factores que mueven la probabilidad de parto (SHAP, divergente) ──────────
const Factores = ({ factores }) => {
  if (!factores?.length) return <p className="text-xs text-gray-400">Sin factores destacados.</p>;
  const max = Math.max(...factores.map((f) => Math.abs(f.puntos)), 1);
  return (
    <div className="space-y-2.5">
      {factores.map((f) => {
        const ancho = `${(Math.abs(f.puntos) / max) * 50}%`;
        const favor = f.puntos > 0;
        return (
          <div key={f.feature} className="group" title={`${f.label}: ${f.puntos > 0 ? '+' : ''}${f.puntos} puntos`}>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-gray-600 truncate">{f.label}{f.valor != null && <span className="text-gray-400"> · {f.valor}</span>}</span>
              <span className="font-semibold text-gray-700 tabular-nums shrink-0">{favor ? '+' : ''}{f.puntos} pts {favor ? '▲' : '▼'}</span>
            </div>
            <div className="relative h-2 mt-1 bg-gray-50 rounded">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300" />
              <div className="absolute top-0 bottom-0 rounded" style={{
                background: favor ? FAVOR : CONTRA,
                left: favor ? '50%' : `calc(50% - ${ancho})`, width: ancho,
              }} />
            </div>
          </div>
        );
      })}
      <div className="flex justify-between text-[10px] text-gray-400 pt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: CONTRA }} /> Baja la probabilidad</span>
        <span className="flex items-center gap-1">Sube la probabilidad <span className="w-2 h-2 rounded-sm" style={{ background: FAVOR }} /></span>
      </div>
    </div>
  );
};

// ── Tarjeta de una dimensión con su evidencia ────────────────────────────────
const DimensionCard = ({ dim }) => {
  const [abierto, setAbierto] = useState(false);
  const Icono = ICONO_DIM[dim.id] || Activity;
  const sinDatos = dim.confianza === 'sin_datos';
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${sinDatos ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-2">
        <Icono className={`w-4 h-4 mt-0.5 shrink-0 ${sinDatos ? 'text-gray-400' : colorScore(dim.score)}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700 leading-tight">{dim.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{dim.valor} · {DIMS_RIESGO.has(dim.id) ? `riesgo ${dim.nivel}` : dim.nivel}</p>
        </div>
        <span className={`text-xl font-black ${sinDatos ? 'text-gray-300' : colorScore(dim.score)}`}>{sinDatos ? '—' : dim.score}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
        {!sinDatos && <div className="h-full rounded-full transition-all duration-700" style={{ width: `${dim.score}%`, background: barraScore(dim.score) }} />}
      </div>
      <div className="flex items-center justify-between mt-2">
        <PillConfianza c={dim.confianza} />
        {dim.evidencia?.length > 0 && (
          <button onClick={() => setAbierto((v) => !v)} className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-0.5">
            {abierto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} {abierto ? 'Ocultar' : 'En qué se basa'}
          </button>
        )}
      </div>
      {abierto && (
        <ul className="mt-2.5 space-y-1.5 border-t border-gray-100 pt-2.5">
          {dim.evidencia.map((e, i) => (
            <li key={i} className="text-[11px] text-gray-600 flex gap-1.5 leading-relaxed"><span className="text-teal-500 shrink-0">•</span>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Árbol de la futura cría ──────────────────────────────────────────────────
const ArbolCria = ({ arbol }) => {
  const renderNodo = (n, { nivel, rol }) => {
    if (nivel === 0) {
      return (
        <div className="w-48 rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br from-teal-500 to-teal-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-100 flex items-center gap-1"><Baby className="w-3.5 h-3.5" /> Futura cría</p>
          <p className="text-3xl font-black mt-1">{pct(n.consanguinidad, 2)}</p>
          <p className="text-[11px] text-teal-100">consanguinidad</p>
        </div>
      );
    }
    const compacto = nivel >= 3;
    const borde = n.comun ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200' : rol === 'padre' ? 'border-blue-300 bg-blue-50/70' : 'border-pink-300 bg-pink-50/70';
    return (
      <div className={`${ANCHO[Math.min(nivel, 3)]} border-2 ${borde} rounded-xl ${compacto ? 'p-2' : 'p-3'} shadow-sm`}>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${n.comun ? 'text-amber-700' : rol === 'padre' ? 'text-blue-700' : 'text-pink-700'}`}>
            {(NOMBRE_NIVEL[nivel] || ['Ancestro', 'Ancestra'])[rol === 'madre' ? 1 : 0]}
          </span>
          <IconoSexo sexo={n.sexo} className="w-3.5 h-3.5" />
        </div>
        <p className="font-bold text-sm text-gray-800 truncate">{n.nombre || <span className="italic font-normal text-gray-400">sin nombre</span>}</p>
        <p className="text-[11px] font-mono text-gray-500 truncate">{n.codigo}</p>
        {!compacto && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {n.ebvLeche != null && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600" title={`Valor genético para leche (confiabilidad ${Math.round((n.confEbv || 0) * 100)} %)`}>
                Leche {signo(n.ebvLeche)}
              </span>
            )}
            {n.consanguinidad > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">F {pct(n.consanguinidad)}</span>}
            {nivel === 1 && n.edadMeses != null && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">{edadTexto(n.edadMeses)}</span>}
          </div>
        )}
        {n.comun && (
          <p className="text-[10px] font-bold text-amber-700 mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Común · aporta {pct(n.aporte, 2)}</p>
        )}
      </div>
    );
  };
  const renderVacio = ({ nivel, rol }) => (nivel <= 2 ? (
    <div className={`${ANCHO[Math.min(nivel, 3)]} border-2 border-dashed border-gray-200 rounded-xl p-2.5 text-[11px] text-gray-400 text-center`}>
      {(NOMBRE_NIVEL[nivel] || ['Ancestro', 'Ancestra'])[rol === 'madre' ? 1 : 0]} sin registrar
    </div>
  ) : null);

  return (
    <ArbolHorizontal nodo={arbol} maxNivel={3} renderNodo={renderNodo} renderVacio={renderVacio} resaltar={(n) => n.comun} />
  );
};

// ── Resultado completo ───────────────────────────────────────────────────────
const Resultado = ({ ev }) => {
  const cfg = cfgClasificacion(ev.clasificacion);
  const p = ev.predicciones || {};
  const f = ev.consanguinidad?.f ?? 0;
  const estadoF = f < 0.0625 ? { texto: 'Bajo', color: 'text-emerald-600' } : f < 0.125 ? { texto: 'Moderado', color: 'text-amber-600' } : { texto: 'Alto', color: 'text-red-600' };
  const dims = [...(ev.dimensiones || [])].sort((a, b) => (a.confianza === 'sin_datos') - (b.confianza === 'sin_datos'));
  const comunes = ev.consanguinidad?.ancestrosComunes || [];
  const { macho, hembra } = ev.animales || {};

  return (
    <div className="space-y-5">
      {/* Veredicto + cifras clave */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 flex flex-col`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Resultado del cruce</span>
          <div className="flex items-end gap-2 mt-2">
            <span className={`text-6xl font-black leading-none ${cfg.color}`}>{ev.scoreGlobal}</span>
            <span className="text-sm text-gray-400 mb-1">/ 100</span>
          </div>
          <div className="h-2 bg-white/80 rounded-full overflow-hidden mt-3">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ev.scoreGlobal}%`, background: cfg.barra }} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <BadgeClasificacion c={ev.clasificacion} grande />
            <PillConfianza c={ev.confianzaGlobal} />
          </div>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{ev.recomendacionVeterinaria}</p>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <Cifra icono={Link2} titulo="Consanguinidad de la cría" valor={pct(f, 2)}
            detalle={comunes.length ? `${comunes.length} ancestro(s) en común` : 'Sin ancestros comunes registrados'} estado={estadoF} />
          <Cifra icono={Baby} titulo="Probabilidad de parto exitoso" valor={pct(p.partoExitoso?.probabilidad, 0)}
            detalle="Estimada con el historial de la granja" />
          <Cifra icono={Milk} titulo="Leche esperada de una hija" valor={p.leche ? `${p.leche.esperado} L` : '—'}
            detalle={p.leche ? `80 %: ${p.leche.intervalo80[0]} – ${p.leche.intervalo80[1]} L/día · rebaño ${p.leche.media_rebano}` : 'Registre producción de leche para estimarla'} />
          <Cifra icono={Users} titulo="Crías esperadas por parto" valor={p.camadaEsperada ?? '—'} detalle="Según la prolificidad de la hembra" />
        </div>
      </div>

      {ev.alertas?.length > 0 && (
        <div className="space-y-2">
          {ev.alertas.map((a, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${a.nivel === 'alto' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span><b>{a.nivel === 'alto' ? 'Atención:' : 'Aviso:'}</b> {a.texto}</span>
            </div>
          ))}
        </div>
      )}

      {/* Árbol de la futura cría */}
      {ev.arbolCria && (
        <Tarjeta titulo="Árbol genealógico de la futura cría" icono={GitBranch}
          subtitulo="Padre (macho) arriba, madre (hembra) abajo. En ámbar los ancestros que aparecen por ambos lados: son la causa de la consanguinidad.">
          <ArbolCria arbol={ev.arbolCria} />
        </Tarjeta>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Tarjeta titulo="Producción de leche esperada" icono={Milk}
          subtitulo="Valores genéticos calculados con BLUP sobre todos los registros y el pedigrí del rebaño">
          {p.leche ? (
            <>
              <FranjaLeche leche={p.leche} />
              <div className="mt-4 border-t border-gray-100 pt-2">
                <ValorPadre titulo={`Macho ${macho?.nombre || macho?.codigo || ''}`} ebv={p.leche.ebv_macho} conf={p.leche.conf_macho} sexo="macho" />
                <ValorPadre titulo={`Hembra ${hembra?.nombre || hembra?.codigo || ''}`} ebv={p.leche.ebv_hembra} conf={p.leche.conf_hembra} sexo="hembra" />
              </div>
              {p.componentes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {p.componentes.map((c) => (
                    <span key={c.rasgo} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">
                      {c.rasgo === 'grasa' ? 'Grasa' : 'Proteína'}: <b>{c.esperado} {c.unidad}</b> <span className="text-gray-400">(rebaño {c.media_rebano})</span>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-3 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" />
                La confiabilidad sube con más registros de leche del animal, de sus hijas y de sus padres.</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Aún no hay producción de leche registrada en el rebaño. Cuando se registre, aquí aparecerá la leche esperada de las hijas.</p>
          )}
        </Tarjeta>

        <div className="space-y-5">
          <Tarjeta titulo="Qué influye en la probabilidad de parto" icono={Brain}
            subtitulo="Cuánto sube o baja cada dato la probabilidad para este cruce (explicación SHAP del modelo)">
            <Factores factores={p.partoExitoso?.factores} />
          </Tarjeta>
          <Tarjeta titulo="Ancestros en común" icono={Link2}>
            {comunes.length ? (
              <ul className="space-y-2">
                {comunes.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700 truncate">{a.nombre}</span>
                    <span className="text-xs text-gray-500 shrink-0">{a.gen_macho} gen. del macho · {a.gen_hembra} de la hembra · <b className="text-amber-700">{pct(a.aporte, 2)}</b></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-700 flex items-center gap-2"><Sparkles className="w-4 h-4" /> No comparten ancestros registrados.</p>
            )}
            <p className="text-[11px] text-gray-400 mt-3">
              Pedigrí conocido (3 generaciones): macho {Math.round((ev.consanguinidad?.completitudMacho || 0) * 100)} %,
              hembra {Math.round((ev.consanguinidad?.completitudHembra || 0) * 100)} %. Si es bajo, registre los padres y abuelos para un cálculo más fiable.
            </p>
          </Tarjeta>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-teal-600" /> Las {dims.length} dimensiones evaluadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {dims.map((d) => <DimensionCard key={d.id} dim={d} />)}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          El resultado global pondera cada dimensión por su importancia y por cuántos datos reales la respaldan: las que no tienen datos casi no cuentan.
        </p>
      </div>
    </div>
  );
};

// ── Vista principal ──────────────────────────────────────────────────────────
const VistaCruce = ({ animal1, parejaInicial, allAnimals, onVolver }) => {
  const esMacho = animal1.sexo === 'macho';
  const [pareja, setPareja] = useState(parejaInicial || null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [iaTexto, setIaTexto] = useState('');
  const [iaCargando, setIaCargando] = useState(false);
  const [iaError, setIaError] = useState(null);

  const opciones = useMemo(
    () => allAnimals.filter((a) => a.sexo !== animal1.sexo && a.estado === 'activo'),
    [allAnimals, animal1.sexo],
  );
  const macho = esMacho ? animal1 : pareja;
  const hembra = esMacho ? pareja : animal1;

  const generarIA = useCallback(async (idMacho, idHembra) => {
    setIaTexto(''); setIaError(null); setIaCargando(true);
    try {
      await apiHelpers.postStream('/genealogia/analisis-ia', { idMacho, idHembra, fechaReferencia: hoyISO() }, (full) => setIaTexto(full));
    } catch (e) {
      setIaError(e?.message || 'No se pudo generar el análisis con IA.');
    } finally {
      setIaCargando(false);
    }
  }, []);

  const evaluar = useCallback(async (m = macho, h = hembra) => {
    if (!m || !h) return;
    setCargando(true); setError(null); setResultado(null); setIaTexto(''); setIaError(null);
    try {
      const res = await apiHelpers.post('/genealogia/compatibilidad', { idMacho: m.id, idHembra: h.id, fechaReferencia: hoyISO() });
      setResultado(res.evaluacion);
      generarIA(m.id, h.id);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.detalle || 'No se pudo evaluar el cruce. Verifique que el servicio de IA esté encendido.');
    } finally {
      setCargando(false);
    }
  }, [macho, hembra, generarIA]);

  // Si se llega desde el ranking, evaluar de una vez
  useEffect(() => {
    if (parejaInicial) evaluar(esMacho ? animal1 : parejaInicial, esMacho ? parejaInicial : animal1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVolver} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
          <div className="w-11 h-11 bg-teal-500 rounded-xl flex items-center justify-center"><Scale className="w-5 h-5 text-white" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Evaluar un cruce</h2>
            <p className="text-sm text-gray-500">Consanguinidad exacta · valor genético (BLUP) · modelo entrenado con la granja · IA</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <SlotAnimal sexo="macho" animal={macho} fijo={esMacho} opciones={opciones}
            onElegir={(a) => { setPareja(a); setResultado(null); }} />
          <div className="flex items-center justify-center text-gray-300"><ArrowRightLeft className="w-6 h-6" /></div>
          <SlotAnimal sexo="hembra" animal={hembra} fijo={!esMacho} opciones={opciones}
            onElegir={(a) => { setPareja(a); setResultado(null); }} />
          <button onClick={() => evaluar()} disabled={!pareja || cargando}
            className="md:w-48 px-5 py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-colors">
            {cargando ? <><Loader2 className="w-5 h-5 animate-spin" /> Evaluando…</> : <><Brain className="w-5 h-5" /> Evaluar cruce</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div><p className="font-semibold text-red-700 text-sm">No se pudo evaluar</p><p className="text-xs text-red-600 mt-1">{error}</p></div>
        </div>
      )}

      {cargando && !resultado && (
        <div className="bg-white/90 rounded-2xl border border-teal-100 p-12 flex flex-col items-center gap-3">
          <Brain className="w-10 h-10 text-teal-500 animate-pulse" />
          <p className="font-semibold text-teal-700">Analizando el cruce con los datos del rebaño…</p>
          <p className="text-xs text-gray-400">Pedigrí completo, valores genéticos, historial reproductivo y sanitario</p>
        </div>
      )}

      {resultado && <Resultado ev={resultado} />}

      {resultado && (iaCargando || iaTexto || iaError) && (
        <AnalisisIA texto={iaTexto} cargando={iaCargando} error={iaError} onRegenerar={() => generarIA(macho.id, hembra.id)} />
      )}

      {!resultado && !cargando && !error && (
        <div className="bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center gap-3 text-gray-300">
          <Scale className="w-12 h-12" />
          <p className="text-sm font-medium text-gray-400 text-center">Elija la pareja y pulse «Evaluar cruce».<br />
            Si no sabe cuál elegir, use «Buscar la mejor pareja» en el árbol del animal.</p>
        </div>
      )}
    </div>
  );
};

export default VistaCruce;
