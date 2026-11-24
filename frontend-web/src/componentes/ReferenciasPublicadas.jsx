// Secciones de la base morfométrica publicada que se muestran en
// "Medidas de referencia por raza": criterios de uso, estándares de la raza,
// datos publicados por edad, ficha técnica de cada medida y bibliografía.
import React, { useState } from 'react';
import { ChevronDown, ExternalLink, AlertTriangle, BookOpen, Ruler, Library, ShieldCheck, Copy } from 'lucide-react';
import { fmt, deDeValor, perfilApto, ETAPAS } from '../utilidades/morfometria';

const tarjeta = 'bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm';

const Plegable = ({ titulo, icono: Icono, resumen, abierto: inicial = false, children }) => {
  const [abierto, setAbierto] = useState(inicial);
  return (
    <section className={`${tarjeta} mt-4`}>
      <button type="button" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <Icono className="w-5 h-5 text-rose-600 shrink-0" /> {titulo}
        </span>
        <span className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          {resumen}
          <ChevronDown className={`w-5 h-5 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {abierto && <div className="mt-4">{children}</div>}
    </section>
  );
};

const Cita = ({ codigo, fuentes }) => {
  const f = fuentes.find((x) => x.codigo === codigo);
  if (!f) return codigo ? <span className="font-mono">{codigo}</span> : null;
  return (
    <a href={f.url} target="_blank" rel="noreferrer" title={f.referencia}
      className="inline-flex items-center gap-1 text-sky-700 hover:underline">
      <span className="font-mono font-semibold">{f.codigo}</span> {f.referencia.split('(')[0].trim().replace(/,$/, '')}
      {(f.referencia.match(/\((\d{4})\)/) || [])[1] && ` (${f.referencia.match(/\((\d{4})\)/)[1]})`}
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  );
};

const SEXO_TXT = { HEMBRA: 'Hembras', MACHO: 'Machos', AMBOS: 'Sexos juntos' };

const colorTipo = (p) => {
  if (p.preliminar) return 'bg-amber-100 text-amber-900 border-amber-300';
  if (p.tipoDato === 'Media observada') return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

// ---------------------------------------------------------------------
export const CriteriosUso = () => (
  <Plegable titulo="Cómo usar estos datos" icono={ShieldCheck} resumen="Leer antes de cambiar referencias">
    <ul className="space-y-2 text-base text-gray-700 list-disc ml-5">
      <li><b>Media observada</b> es el promedio que midió un estudio en sus animales. No es el valor «ideal» ni un mínimo para seleccionar.</li>
      <li><b>DE</b> (desviación estándar) dice cuánto varían los animales. <b>EE</b> (error estándar) dice qué tan seguro es el promedio y es mucho más pequeño. No se deben confundir: con EE la desviación se calcula como EE × √n.</li>
      <li>Los datos de <b>sexos juntos</b> o de <b>edades agrupadas</b> no se pasan a un solo sexo ni a una edad exacta. Tampoco se inventan valores para edades que nadie midió.</li>
      <li>Las filas <b>preliminares</b> (versión previa o tabla sin cotejar) sirven para consultar, no para calificar animales.</li>
      <li>Los <b>estándares</b> de asociaciones (ADGA, ANGBA) y la escala CAPRIGRAN son referencias técnicas, no promedios observados ni límites biológicos.</li>
      <li>Altura a la punta de la nalga no es lo mismo que altura a la base de la cola, largo de grupa ni altura al corvejón: cada medida se toma en su punto.</li>
      <li>Es una compilación de literatura. Antes de usarla para decidir cruces, el docente y datos de campo colombianos deben validarla.</li>
    </ul>
    <div className="mt-4">
      <p className="text-base font-semibold text-gray-800">Etapas por edad que usa la aplicación</p>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ETAPAS.map((e) => (
          <div key={e.key} className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
            <b className="block text-gray-800">{e.texto}</b><span className="text-gray-600">{e.rango}</span>
          </div>
        ))}
      </div>
    </div>
  </Plegable>
);

// ---------------------------------------------------------------------
export const EstandaresRaza = ({ estandares, sexo, medidas, fuentes }) => {
  const lista = estandares.filter((e) => e.sexo === sexo || e.sexo === 'AMBOS');
  if (!lista.length) return null;
  const nombre = (c) => medidas.find((m) => m.codigo === c)?.nombre || c;
  const unidad = (c) => medidas.find((m) => m.codigo === c)?.unidad || '';
  return (
    <Plegable titulo="Estándares de la raza" icono={BookOpen} resumen={`${lista.length} valor(es)`} abierto>
      <p className="text-base text-gray-600 mb-3">Mínimos de la asociación de la raza o escalas de calificación publicadas. Se muestran como aviso al medir, no cambian la calificación.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead><tr className="text-left text-gray-600 border-b-2"><th className="py-2 pr-3">Medida</th><th className="pr-3">Grupo</th><th className="pr-3">Tipo</th><th className="pr-3">Valor</th><th>Fuente</th></tr></thead>
          <tbody>
            {lista.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3 font-medium text-gray-800">{nombre(e.codigo)}{e.sexo === 'AMBOS' && <span className="block text-sm text-gray-500">Sexo no especificado</span>}</td>
                <td className="py-2 pr-3 text-gray-700">{e.grupo}</td>
                <td className="py-2 pr-3 text-gray-700">{e.tipo}</td>
                <td className="py-2 pr-3 tabular-nums whitespace-nowrap">
                  {e.maximo == null ? <>mín. <b>{fmt(e.minimo)}</b></> : <><b>{fmt(e.minimo)}–{fmt(e.maximo)}</b></>} {unidad(e.codigo)}
                  {e.optimo != null && <span className="block text-sm text-gray-600">óptimo del modelo {fmt(e.optimo)}</span>}
                </td>
                <td className="py-2 text-sm"><Cita codigo={e.fuente} fuentes={fuentes} /><span className="block text-gray-500 mt-0.5">{e.observaciones}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Plegable>
  );
};

// ---------------------------------------------------------------------
export const DatosPublicados = ({ perfiles, sexo, medidas, fuentes, onUsar, puedeEditar }) => {
  const lista = perfiles
    .filter((p) => p.sexo === sexo || p.sexo === 'AMBOS')
    .sort((a, b) => (a.edadMeses ?? a.edadMin ?? 999) - (b.edadMeses ?? b.edadMin ?? 999));
  const nombre = (c) => medidas.find((m) => m.codigo === c)?.nombre || c;
  const unidad = (c) => medidas.find((m) => m.codigo === c)?.unidad || '';
  const orden = (c) => medidas.find((m) => m.codigo === c)?.orden ?? 99;
  return (
    <Plegable titulo="Datos publicados de esta raza" icono={Ruler} resumen={`${lista.length} estudio(s)`} abierto>
      {!lista.length ? (
        <p className="text-base text-gray-600">No hay mediciones publicadas de esta raza para {sexo === 'MACHO' ? 'machos' : 'hembras'} en la base. Los valores de la tabla de arriba siguen siendo los aproximados hasta que el docente los ajuste.</p>
      ) : (
        <>
          <p className="text-base text-gray-600 mb-3">Promedios medidos por estudios, ordenados por edad. Verde: observados; gris: ajustados por un modelo; ámbar: preliminares (solo consulta).</p>
          <div className="space-y-3">
            {lista.map((p) => {
              const apto = perfilApto(p);
              return (
                <article key={p.id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-lg font-bold text-gray-800">{p.edadPublicada}{p.etapa && p.etapa !== 'Agrupada / no exacta' && <span className="text-gray-500 font-normal"> · {p.etapa}</span>}</p>
                      <p className="text-sm text-gray-600">{SEXO_TXT[p.sexo]} · {p.n ? `n = ${p.n}` : 'n no informado'} · {p.pais}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm px-2.5 py-1 rounded-full border ${colorTipo(p)}`}>{p.tipoDato}</span>
                      {apto && puedeEditar && onUsar && (
                        <button type="button" onClick={() => onUsar(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold">
                          <Copy className="w-4 h-4" /> Usar como referencia
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[...p.valores].sort((a, b) => orden(a.codigo) - orden(b.codigo)).map((v) => (
                      <div key={v.codigo} className="rounded-xl bg-gray-50 px-3 py-2 text-sm">
                        <span className="block text-gray-600">{nombre(v.codigo)}</span>
                        <span className="text-base font-bold text-gray-900 tabular-nums">{fmt(v.media)} {unidad(v.codigo)}</span>
                        {v.dispersion != null && <span className="text-gray-700 tabular-nums"> ± {String(v.dispersion).replace('.', ',')} <span className="text-gray-500">{v.tipoDispersion === '± informado' ? '(tipo no indicado)' : v.tipoDispersion}</span></span>}
                        {v.minimo != null && <span className="block text-gray-500 tabular-nums">mín. {fmt(v.minimo)} · máx. {fmt(v.maximo)}</span>}
                        {v.tipoDispersion === 'EE' && deDeValor(v, p.n) != null && <span className="block text-gray-500 tabular-nums">DE calculada ≈ {fmt(deDeValor(v, p.n))}</span>}
                      </div>
                    ))}
                  </div>
                  {p.observaciones && <p className={`mt-2 text-sm flex items-start gap-1.5 ${p.preliminar ? 'text-amber-800' : 'text-gray-600'}`}>{p.preliminar && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}{p.observaciones}</p>}
                  <p className="mt-1 text-sm"><Cita codigo={p.fuente} fuentes={fuentes} />{p.localizacion && <span className="text-gray-500"> · {p.localizacion}</span>}{p.verificacion && <span className="text-gray-500"> · {p.verificacion}</span>}</p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Plegable>
  );
};

// ---------------------------------------------------------------------
export const FichaTecnica = ({ medidas, fuentes }) => {
  const lista = medidas.filter((m) => m.definicion);
  if (!lista.length) return null;
  return (
    <Plegable titulo="Ficha técnica de las medidas" icono={Ruler} resumen={`${lista.length} medidas`}>
      <p className="text-base text-gray-600 mb-3">Definición técnica de cada punto de medición (FAO 2012 y Ferreira et al. 2013), para que todos los evaluadores midan igual.</p>
      <dl className="grid md:grid-cols-2 gap-3">
        {lista.map((m) => (
          <div key={m.codigo} className="rounded-xl border border-gray-200 p-3">
            <dt className="font-bold text-gray-800">{m.nombre} <span className="text-sm font-mono text-gray-400">{m.codigoRef}</span></dt>
            <dd className="text-base text-gray-700 mt-1">{m.definicion}</dd>
            <dd className="text-sm text-gray-500 mt-1">Instrumento: {m.instrumento}{m.sexo === 'MACHO' && ' · solo machos'}</dd>
            {m.advertencia && <dd className="text-sm text-amber-800 mt-1 flex items-start gap-1"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{m.advertencia}</dd>}
            {m.fuenteMetodo && <dd className="text-xs text-gray-400 mt-1">Fuente: {m.fuenteMetodo.split(';').map((c) => c.trim()).map((c) => fuentes.find((f) => f.codigo === c)?.referencia.split('(')[0].trim().replace(/,$/, '') || c).join(' · ')}</dd>}
          </div>
        ))}
      </dl>
    </Plegable>
  );
};

// ---------------------------------------------------------------------
export const Bibliografia = ({ fuentes }) => {
  if (!fuentes.length) return null;
  return (
    <Plegable titulo="Bibliografía" icono={Library} resumen={`${fuentes.length} fuentes`}>
      <ol className="space-y-2">
        {fuentes.map((f) => (
          <li key={f.codigo} className="text-base text-gray-700 flex gap-3">
            <span className="font-mono font-semibold text-gray-500 shrink-0">{f.codigo}</span>
            <span>
              {f.referencia}{' '}
              {f.url && <a href={f.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline break-all inline-flex items-center gap-1">{f.url.replace(/^https?:\/\//, '')}<ExternalLink className="w-3.5 h-3.5" /></a>}
              {f.verificacion && <span className="block text-sm text-gray-500">{f.verificacion}</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-gray-500">Búsqueda dirigida, no revisión sistemática. Algunos artículos requieren comprobar su indexación o cotejar la tabla original.</p>
    </Plegable>
  );
};
