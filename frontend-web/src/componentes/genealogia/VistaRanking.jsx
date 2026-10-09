import React, { useState, useCallback } from 'react';
import {
  ChevronLeft, TrendingUp, Zap, Loader2, XCircle, Trophy, Baby, Milk, Link2, Users, ChevronRight,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { apiHelpers } from '../../servicios/api';
import { pct, edadTexto, hoyISO, colorScore, barraScore, BadgeClasificacion, AnalisisIA, Tarjeta, FAVOR } from './comun';

const FILTRO_F = [
  { v: '', l: 'Sin límite' },
  { v: '0.0625', l: 'Hasta 6,25 % (primos)' },
  { v: '0.03125', l: 'Hasta 3,1 %' },
  { v: '0', l: 'Sin parentesco' },
];

const TooltipPunto = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2 text-xs">
      <p className="font-bold text-gray-800">{d.nombre}</p>
      <p className="text-gray-500">Puntaje <b className="text-gray-700">{d.score}</b> · consanguinidad <b className="text-gray-700">{d.coiPct} %</b></p>
      {d.leche != null && <p className="text-gray-500">Leche de una hija: <b className="text-gray-700">{d.leche} L/día</b></p>}
    </div>
  );
};

const Podio = ({ fila, puesto, onVer }) => {
  const c = fila.candidato;
  const colores = ['from-amber-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-orange-300 to-orange-400'];
  return (
    <button onClick={onVer} className={`text-left bg-white rounded-2xl border ${puesto === 0 ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'} p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colores[puesto]} text-white font-black flex items-center justify-center`}>{puesto + 1}</div>
        <div className="text-right">
          <span className={`text-3xl font-black ${colorScore(fila.score)}`}>{fila.score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <p className="font-bold text-gray-800 mt-3 truncate">{c.nombre || 'Sin nombre'}</p>
      <p className="text-xs text-gray-500 truncate"><span className="font-mono">{c.codigo}</span> · {c.raza || 'raza ?'}{c.edadMeses != null && ` · ${edadTexto(c.edadMeses)}`}</p>
      <div className="mt-3"><BadgeClasificacion c={fila.clasificacion} /></div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div><p className="text-[10px] text-gray-400">Parto</p><p className="text-sm font-bold text-gray-700">{pct(fila.probParto, 0)}</p></div>
        <div><p className="text-[10px] text-gray-400">Leche hija</p><p className="text-sm font-bold text-gray-700">{fila.lecheHija != null ? `${fila.lecheHija} L` : '—'}</p></div>
        <div><p className="text-[10px] text-gray-400">Consang.</p><p className="text-sm font-bold text-gray-700">{pct(fila.coi)}</p></div>
      </div>
      {!fila.disponible && <p className="text-[11px] text-amber-700 mt-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No disponible ahora</p>}
      <p className="text-xs font-semibold text-teal-700 mt-3 flex items-center gap-1">Ver el cruce completo <ChevronRight className="w-3.5 h-3.5" /></p>
    </button>
  );
};

const VistaRanking = ({ animal1, onVolver, onVerCruce }) => {
  const [filtros, setFiltros] = useState({ soloMismaRaza: false, soloDisponibles: true, maxConsanguinidad: '0.0625', limite: 20 });
  const [cargando, setCargando] = useState(false);
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);
  const [iaTexto, setIaTexto] = useState('');
  const [iaCargando, setIaCargando] = useState(false);

  const sexoObjetivo = animal1.sexo === 'hembra' ? 'machos' : 'hembras';
  const set = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));

  const generarIA = useCallback(async (f) => {
    setIaTexto(''); setIaCargando(true);
    try {
      await apiHelpers.postStream('/genealogia/ranking/analisis-ia',
        { idAnimal: animal1.id, ...f, fechaReferencia: hoyISO() }, (full) => setIaTexto(full));
    } catch { /* la IA es complemento: el ranking ya se muestra */ } finally {
      setIaCargando(false);
    }
  }, [animal1]);

  const calcular = useCallback(async () => {
    setCargando(true); setError(null); setIaTexto('');
    try {
      const res = await apiHelpers.post('/genealogia/ranking', { idAnimal: animal1.id, ...filtros, fechaReferencia: hoyISO() });
      setRanking(res);
      if (res?.ranking?.length) generarIA(filtros);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'No se pudo calcular el ranking.');
    } finally {
      setCargando(false);
    }
  }, [animal1, filtros, generarIA]);

  const filas = ranking?.ranking || [];
  const puntos = filas.map((r, i) => ({
    nombre: `${r.candidato.codigo} — ${r.candidato.nombre || 'sin nombre'}`,
    coiPct: Math.round(r.coi * 1000) / 10, score: r.score, leche: r.lecheHija, mejor: i === 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
          <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Mejor pareja para {animal1.nombre || animal1.codigo}</h2>
            <p className="text-sm text-gray-500">Se evalúan todos los {sexoObjetivo} activos con el mismo motor del análisis individual</p>
          </div>
        </div>

        {/* Filtros: una sola fila sobre todos los resultados */}
        <div className="flex flex-wrap items-end gap-3 mt-5">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
            <input type="checkbox" checked={filtros.soloDisponibles} onChange={(e) => set('soloDisponibles', e.target.checked)} className="rounded text-violet-600 focus:ring-violet-500" />
            Solo disponibles hoy
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
            <input type="checkbox" checked={filtros.soloMismaRaza} onChange={(e) => set('soloMismaRaza', e.target.checked)} className="rounded text-violet-600 focus:ring-violet-500" />
            Solo de la misma raza
          </label>
          <div>
            <p className="text-[11px] text-gray-500 mb-1">Consanguinidad máxima de la cría</p>
            <select value={filtros.maxConsanguinidad} onChange={(e) => set('maxConsanguinidad', e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
              {FILTRO_F.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 mb-1">Mostrar</p>
            <select value={filtros.limite} onChange={(e) => set('limite', Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
              {[10, 20, 50].map((n) => <option key={n} value={n}>Los {n} mejores</option>)}
            </select>
          </div>
          <button onClick={calcular} disabled={cargando}
            className="ml-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm">
            {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculando…</> : <><Zap className="w-4 h-4" /> Buscar</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {ranking && filas.length === 0 && (
        <div className="bg-white/70 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500 text-sm">
          Ningún candidato cumple los filtros. Pruebe quitando «Solo disponibles hoy» o aumentando la consanguinidad máxima.
        </div>
      )}

      {filas.length > 0 && (
        <div className={`space-y-5 transition-opacity ${cargando ? 'opacity-50' : ''}`}>
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Las mejores opciones ({ranking.total} {ranking.total === 1 ? sexoObjetivo.slice(0, -1) : sexoObjetivo} cumple{ranking.total === 1 ? '' : 'n'} los filtros)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filas.slice(0, 3).map((f, i) => <Podio key={f.candidato.id} fila={f} puesto={i} onVer={() => onVerCruce(f.candidato)} />)}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <Tarjeta className="xl:col-span-3" titulo="Todos los candidatos" icono={Users}
              subtitulo="Ordenados por puntaje; a igual puntaje, primero el de menor consanguinidad">
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                      <th className="text-left font-semibold px-5 py-2">#</th>
                      <th className="text-left font-semibold py-2">Candidato</th>
                      <th className="text-left font-semibold py-2 w-36">Puntaje</th>
                      <th className="text-right font-semibold py-2"><Baby className="w-3.5 h-3.5 inline" /> Parto</th>
                      <th className="text-right font-semibold py-2"><Milk className="w-3.5 h-3.5 inline" /> Leche hija</th>
                      <th className="text-right font-semibold py-2 pr-5"><Link2 className="w-3.5 h-3.5 inline" /> Consang.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={f.candidato.id} onClick={() => onVerCruce(f.candidato)}
                        className={`border-b border-gray-50 cursor-pointer hover:bg-violet-50/50 ${i === 0 ? 'bg-emerald-50/40' : ''}`}>
                        <td className="px-5 py-2.5 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="py-2.5">
                          <p className="font-semibold text-gray-800 truncate max-w-[14rem]">{f.candidato.nombre || 'Sin nombre'} <span className="font-mono text-xs text-gray-400">{f.candidato.codigo}</span></p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            {f.candidato.raza || 'raza ?'}
                            {f.disponible ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <span className="text-amber-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> no disponible</span>}
                          </p>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-black tabular-nums w-7 ${colorScore(f.score)}`}>{f.score}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: barraScore(f.score) }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-gray-700">{pct(f.probParto, 0)}</td>
                        <td className="py-2.5 text-right tabular-nums text-gray-700">{f.lecheHija != null ? `${f.lecheHija} L` : '—'}</td>
                        <td className="py-2.5 pr-5 text-right tabular-nums text-gray-700">{pct(f.coi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tarjeta>

            <Tarjeta className="xl:col-span-2" titulo="Puntaje frente a consanguinidad" icono={TrendingUp}
              subtitulo="Lo ideal está arriba a la izquierda: puntaje alto y poca consanguinidad">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: -8 }}>
                    <CartesianGrid stroke="#f1f1ef" />
                    <XAxis type="number" dataKey="coiPct" name="Consanguinidad" unit=" %" tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }} tickLine={false}
                      label={{ value: 'Consanguinidad de la cría (%)', position: 'insideBottom', offset: -14, fontSize: 11, fill: '#6b7280' }} />
                    <YAxis type="number" dataKey="score" name="Puntaje" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <Tooltip content={<TooltipPunto />} cursor={{ stroke: '#d1d5db' }} />
                    <Scatter data={puntos} shape={({ cx, cy, payload }) => (
                      <circle cx={cx} cy={cy} r={payload.mejor ? 7 : 5} fill={payload.mejor ? FAVOR : '#a8a29e'} stroke="#fcfcfb" strokeWidth={2} />
                    )} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 text-[11px] text-gray-500 mt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: FAVOR }} /> Mejor opción</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-stone-400" /> Otros candidatos</span>
              </div>
            </Tarjeta>
          </div>

          {(iaCargando || iaTexto) && (
            <AnalisisIA titulo="Resumen comparativo de la IA" texto={iaTexto} cargando={iaCargando} error={null} onRegenerar={() => generarIA(filtros)} />
          )}
        </div>
      )}

      {!ranking && !cargando && !error && (
        <div className="bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center gap-3 text-gray-300">
          <TrendingUp className="w-12 h-12" />
          <p className="text-sm font-medium text-gray-400 text-center">Ajuste los filtros y pulse «Buscar» para evaluar todos los {sexoObjetivo} activos.</p>
        </div>
      )}
    </div>
  );
};

export default VistaRanking;
