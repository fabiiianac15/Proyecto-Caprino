/**
 * Reportes: el panel del hato y los informes por módulo.
 *
 * Cada informe llega del backend con la misma estructura (indicadores,
 * gráficos y tabla), así que una sola vista los muestra todos y los exporta
 * a Excel o PDF. Ver InformeService.php y servicios/exportarInforme.js.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  FileText, FileSpreadsheet, ChevronLeft, ChevronRight, Search, RefreshCw, AlertTriangle, ArrowUpDown,
  Users, ArrowLeftRight, Mountain, Milk, Award, ClipboardList, Heart, CalendarClock, Target,
  Syringe, Activity, Bell, Eye, Weight, TrendingUp, ShieldCheck, Ruler, BarChart3, Inbox,
} from 'lucide-react';
import { apiHelpers } from '../servicios/api';
import { useAuth } from '../contextos/AuthContext';
import { formatear, textoPeriodo, capturarGraficos, exportarExcel, exportarPDF, PALETA } from '../servicios/exportarInforme';

/* ── Catálogo: solo informes que salen de datos que el sistema sí registra ── */

const GRUPOS = [
  {
    titulo: 'Hato', color: 'bg-emerald-500',
    informes: [
      { clave: 'inventario', nombre: 'Censo del hato', ayuda: 'Animales activos con raza, edad, estado y corral', Icono: Users, hoy: true },
      { clave: 'movimientos', nombre: 'Ingresos y salidas', ayuda: 'Nacimientos, registros, ventas, muertes y descartes', Icono: ArrowLeftRight },
      { clave: 'corrales', nombre: 'Ocupación de corrales', ayuda: 'Animales en cada corral frente a su capacidad', Icono: Mountain, hoy: true },
    ],
  },
  {
    titulo: 'Leche', color: 'bg-amber-500',
    informes: [
      { clave: 'leche-mensual', nombre: 'Producción por mes', ayuda: 'Litros, cabras en ordeño y calidad', Icono: Milk },
      { clave: 'leche-cabra', nombre: 'Producción por cabra', ayuda: 'De la que más leche dio a la que menos', Icono: Award },
      { clave: 'leche-detalle', nombre: 'Registro de ordeños', ayuda: 'Cada ordeño con litros, grasa y proteína', Icono: ClipboardList },
    ],
  },
  {
    titulo: 'Reproducción', color: 'bg-pink-500',
    informes: [
      { clave: 'servicios', nombre: 'Servicios y partos', ayuda: 'Montas, tasa de preñez, tipo de parto y crías', Icono: Heart },
      { clave: 'partos-proximos', nombre: 'Partos esperados', ayuda: 'Hembras por parir y qué preparar', Icono: CalendarClock, hoy: true },
      { clave: 'machos', nombre: 'Desempeño de los machos', ayuda: 'Servicios, partos y crías por reproductor', Icono: Target },
    ],
  },
  {
    titulo: 'Salud', color: 'bg-blue-500',
    informes: [
      { clave: 'salud-eventos', nombre: 'Registro sanitario', ayuda: 'Vacunas, tratamientos y enfermedades', Icono: Syringe },
      { clave: 'enfermedades', nombre: 'Enfermedades frecuentes', ayuda: 'Diagnósticos agrupados y animales afectados', Icono: Activity },
      { clave: 'salud-pendientes', nombre: 'Pendientes sanitarios', ayuda: 'Aplicaciones por venir y animales en retiro', Icono: Bell, hoy: true },
      { clave: 'famacha', nombre: 'FAMACHA', ayuda: 'Anemia por parásitos según el color del ojo', Icono: Eye },
    ],
  },
  {
    titulo: 'Peso', color: 'bg-violet-500',
    informes: [
      { clave: 'pesajes', nombre: 'Registro de pesajes', ayuda: 'Peso, condición corporal y ganancia diaria', Icono: Weight },
      { clave: 'crecimiento', nombre: 'Crecimiento por animal', ayuda: 'Peso inicial, final y gramos ganados por día', Icono: TrendingUp },
    ],
  },
  {
    titulo: 'Evaluaciones', color: 'bg-rose-500',
    informes: [
      { clave: 'bienestar', nombre: 'Bienestar animal', ayuda: 'Puntajes MEBA y clasificación de cada visita', Icono: ShieldCheck },
      { clave: 'lineal', nombre: 'Clasificación lineal', ayuda: 'Cabras ordenadas por puntaje, con cada parte', Icono: Ruler },
    ],
  },
];

const TODOS = GRUPOS.flatMap((g) => g.informes.map((i) => ({ ...i, grupo: g.titulo, color: g.color })));

/* ── Periodo ─────────────────────────────────────────────────────────────── */

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const haceMeses = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d; };

const PRESETS = [
  { clave: 'mes', etiqueta: 'Este mes', rango: () => { const h = new Date(); return [iso(new Date(h.getFullYear(), h.getMonth(), 1)), iso(h)]; } },
  { clave: '3m', etiqueta: '3 meses', rango: () => [iso(haceMeses(3)), iso(new Date())] },
  { clave: '12m', etiqueta: '12 meses', rango: () => [iso(haceMeses(12)), iso(new Date())] },
  { clave: 'anio', etiqueta: 'Este año', rango: () => [`${new Date().getFullYear()}-01-01`, iso(new Date())] },
  { clave: 'todo', etiqueta: 'Todo', rango: () => ['2000-01-01', iso(new Date())] },
];

/* ── Gráficos ────────────────────────────────────────────────────────────── */

// La paleta tiene tonos separados entre sí; los valores también van escritos en ejes y leyenda
const EJE = { fontSize: 11, fill: '#636366' };

const Grafico = ({ grafico }) => {
  const vacio = !grafico.datos.length || grafico.datos.every((d) => grafico.series.every((s) => !Number(d[s.clave])));
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5" data-grafico={vacio ? undefined : grafico.titulo}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{grafico.titulo}</h3>
      {vacio ? (
        <div className="h-[240px] flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
          <BarChart3 className="w-7 h-7" aria-hidden="true" />
          Sin datos en este periodo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          {grafico.tipo === 'torta' ? (
            <PieChart>
              <Pie data={grafico.datos} dataKey={grafico.series[0].clave} nameKey="nombre" innerRadius={52} outerRadius={88} paddingAngle={2} isAnimationActive={false}>
                {grafico.datos.map((d, i) => <Cell key={d.nombre} fill={PALETA[i % PALETA.length]} stroke="#fff" strokeWidth={2} />)}
              </Pie>
              <Tooltip formatter={(v) => formatear(v, 'decimal')} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(valor, entrada) => `${valor}: ${formatear(entrada.payload.value, 'decimal')}`} />
            </PieChart>
          ) : grafico.tipo === 'linea' ? (
            <LineChart data={grafico.datos} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" vertical={false} />
              <XAxis dataKey="nombre" tick={EJE} tickLine={false} axisLine={{ stroke: '#d1d1d6' }} />
              <YAxis tick={EJE} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => formatear(v, 'decimal')} />
              {grafico.series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
              {grafico.series.map((s, i) => (
                <Line key={s.clave} type="monotone" dataKey={s.clave} name={s.nombre} stroke={PALETA[i % PALETA.length]} strokeWidth={i === 0 ? 2.5 : 1.8}
                  dot={{ r: 3 }} isAnimationActive={false} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={grafico.datos} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" vertical={false} />
              <XAxis dataKey="nombre" tick={EJE} tickLine={false} axisLine={{ stroke: '#d1d1d6' }} interval={0}
                tickFormatter={(t) => (String(t).length > 14 ? `${String(t).slice(0, 13)}…` : t)} />
              <YAxis tick={EJE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(v) => formatear(v, 'decimal')} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              {grafico.series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
              {grafico.series.map((s, i) => (
                <Bar key={s.clave} dataKey={s.clave} name={s.nombre} fill={PALETA[i % PALETA.length]} radius={[5, 5, 0, 0]} maxBarSize={46} isAnimationActive={false} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
};

const Indicadores = ({ lista }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {lista.map((i) => (
      <div key={i.etiqueta} className="bg-white rounded-2xl shadow-sm px-4 py-3.5">
        <p className="text-xs font-medium text-gray-500">{i.etiqueta}</p>
        <p className={`font-bold text-gray-900 tabular-nums tracking-tight mt-0.5 ${i.formato === 'texto' ? 'text-lg leading-snug' : 'text-[26px] leading-8'}`}>
          {formatear(i.valor, i.formato)}
          {i.unidad && i.valor !== null && <span className="text-sm font-medium text-gray-500 ml-1">{i.unidad}</span>}
        </p>
      </div>
    ))}
  </div>
);

const Cargando = ({ texto }) => (
  <div className="bg-white rounded-2xl shadow-sm py-16 flex flex-col items-center gap-3 text-gray-500" role="status">
    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" aria-hidden="true" />
    <p className="text-sm">{texto}</p>
  </div>
);

const ErrorCarga = ({ mensaje, alReintentar }) => (
  <div className="bg-white rounded-2xl shadow-sm py-12 px-6 flex flex-col items-center gap-3 text-center" role="alert">
    <AlertTriangle className="w-7 h-7 text-red-500" aria-hidden="true" />
    <p className="text-sm text-gray-700 max-w-md">{mensaje}</p>
    <button onClick={alReintentar} className="px-4 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-800">Volver a intentar</button>
  </div>
);

/* ── Tabla con búsqueda, orden y páginas ─────────────────────────────────── */

const POR_PAGINA = 25;

const Tabla = ({ tabla }) => {
  const [texto, setTexto] = useState('');
  const [orden, setOrden] = useState(null);     // { clave, asc }
  const [pagina, setPagina] = useState(0);

  const filas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    let r = t
      ? tabla.filas.filter((f) => tabla.columnas.some((c) => String(f[c.clave] ?? '').toLowerCase().includes(t)))
      : tabla.filas;
    if (orden) {
      r = [...r].sort((a, b) => {
        const x = a[orden.clave]; const y = b[orden.clave];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true });
        return orden.asc ? cmp : -cmp;
      });
    }
    return r;
  }, [tabla, texto, orden]);

  useEffect(() => { setPagina(0); }, [texto, orden, tabla]);

  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const visibles = filas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const ordenar = (clave) => setOrden((o) => (o?.clave === clave ? (o.asc ? { clave, asc: false } : null) : { clave, asc: true }));

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">
          Detalle <span className="font-normal text-gray-500">· {filas.length} {filas.length === 1 ? 'registro' : 'registros'}</span>
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar en la tabla" aria-label="Buscar en la tabla"
            className="h-9 w-64 max-w-full pl-9 pr-3 rounded-lg bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:bg-white" />
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2 text-center px-6">
          <Inbox className="w-8 h-8 text-gray-300" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-700">{texto ? 'Nada coincide con la búsqueda' : 'No hay registros en este periodo'}</p>
          {!texto && <p className="text-xs text-gray-500">Pruebe con un periodo más amplio o registre datos en el módulo correspondiente.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                {tabla.columnas.map((c) => (
                  <th key={c.clave} scope="col" className={`px-4 py-2.5 font-semibold text-xs whitespace-nowrap ${c.tipo === 'texto' || c.tipo === 'fecha' ? 'text-left' : 'text-right'}`}>
                    <button onClick={() => ordenar(c.clave)} className="inline-flex items-center gap-1 hover:text-gray-900"
                      aria-label={`Ordenar por ${c.titulo}`}>
                      {c.titulo}
                      <ArrowUpDown className={`w-3 h-3 ${orden?.clave === c.clave ? 'text-indigo-600' : 'text-gray-300'}`} aria-hidden="true" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((f, n) => (
                <tr key={n} className="border-t border-gray-100 hover:bg-gray-50/70">
                  {tabla.columnas.map((c) => (
                    <td key={c.clave} className={`px-4 py-2.5 align-top ${c.tipo === 'texto' ? `text-left text-gray-800 ${String(f[c.clave] ?? '').length < 30 ? 'whitespace-nowrap' : 'min-w-[220px]'}` : c.tipo === 'fecha' ? 'text-left text-gray-700 whitespace-nowrap' : 'text-right text-gray-900 whitespace-nowrap'}`}>
                      {formatear(f[c.clave], c.tipo)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
          <span>Página {pagina + 1} de {paginas}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0} aria-label="Página anterior"
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPagina((p) => Math.min(paginas - 1, p + 1))} disabled={pagina >= paginas - 1} aria-label="Página siguiente"
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Vista de un informe ─────────────────────────────────────────────────── */

const VistaInforme = ({ meta, desde, hasta, alVolver }) => {
  const { usuario } = useAuth();
  const [informe, setInforme] = useState(null);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState('');
  const refGraficos = useRef(null);

  const cargar = () => {
    setInforme(null);
    setError('');
    apiHelpers.get(`/reportes/informe/${meta.clave}`, { desde, hasta })
      .then((r) => setInforme(r.data))
      .catch((e) => setError(e.response?.data?.error || 'No se pudo generar el informe. Revise la conexión e intente de nuevo.'));
  };
  useEffect(cargar, [meta.clave, desde, hasta]);   // eslint-disable-line react-hooks/exhaustive-deps

  const exportar = async (formato) => {
    setExportando(formato);
    try {
      const opciones = { usuario: usuario?.nombre || usuario?.nombre_completo || '', graficos: await capturarGraficos(refGraficos.current) };
      if (formato === 'excel') await exportarExcel(informe, opciones);
      else await exportarPDF(informe, opciones);
    } catch (e) {
      setError(`No se pudo crear el archivo: ${e.message}`);
    } finally {
      setExportando('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <button onClick={alVolver} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900 -ml-1 mb-3">
          <ChevronLeft className="w-4 h-4" /> Todos los informes
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}><meta.Icono className="w-6 h-6 text-white" /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{meta.grupo}</p>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{informe?.titulo || meta.nombre}</h2>
              <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{informe?.descripcion || meta.ayuda}</p>
              {informe && <p className="text-xs text-gray-500 mt-1.5">{textoPeriodo(informe.periodo)}</p>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => exportar('excel')} disabled={!informe || !!exportando}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold">
              <FileSpreadsheet className="w-4 h-4" /> {exportando === 'excel' ? 'Creando…' : 'Excel'}
            </button>
            <button onClick={() => exportar('pdf')} disabled={!informe || !!exportando}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold">
              <FileText className="w-4 h-4" /> {exportando === 'pdf' ? 'Creando…' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorCarga mensaje={error} alReintentar={cargar} />}
      {!informe && !error && <Cargando texto="Generando el informe…" />}

      {informe && (
        <>
          {informe.indicadores.length > 0 && <Indicadores lista={informe.indicadores} />}
          {informe.graficos.length > 0 && (
            <div ref={refGraficos} className={`grid gap-4 ${informe.graficos.length > 1 ? 'lg:grid-cols-2' : ''}`}>
              {informe.graficos.map((g) => <Grafico key={g.titulo} grafico={g} />)}
            </div>
          )}
          <Tabla tabla={informe.tabla} />
          {informe.notas.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-1 px-1">
              {informe.notas.map((n) => <li key={n}>Nota: {n}</li>)}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

/* ── Panel general ───────────────────────────────────────────────────────── */

const Panel = ({ desde, hasta }) => {
  const [panel, setPanel] = useState(null);
  const [error, setError] = useState('');

  const cargar = () => {
    setPanel(null);
    setError('');
    apiHelpers.get('/reportes/panel', { desde, hasta })
      .then((r) => setPanel(r.data))
      .catch(() => setError('No se pudieron cargar los indicadores del hato.'));
  };
  useEffect(cargar, [desde, hasta]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorCarga mensaje={error} alReintentar={cargar} />;
  if (!panel) return <Cargando texto="Calculando los indicadores…" />;
  return (
    <div className="space-y-4">
      <Indicadores lista={panel.indicadores} />
      <div className="grid gap-4 lg:grid-cols-3">
        {panel.graficos.map((g) => <Grafico key={g.titulo} grafico={g} />)}
      </div>
    </div>
  );
};

/* ── Módulo ──────────────────────────────────────────────────────────────── */

const ModuloReportes = () => {
  const [params, setParams] = useSearchParams();
  const [preset, setPreset] = useState('12m');
  const [[desde, hasta], setRango] = useState(() => PRESETS.find((p) => p.clave === '12m').rango());

  const meta = TODOS.find((i) => i.clave === params.get('informe'));

  const elegirPreset = (p) => { setPreset(p.clave); setRango(p.rango()); };
  const cambiarFecha = (cual, valor) => {
    if (!valor) return;
    setPreset('');
    setRango(([d, h]) => (cual === 'desde' ? [valor, h < valor ? valor : h] : [d > valor ? valor : d, valor]));
  };
  const abrir = (clave) => { setParams(clave ? { informe: clave } : {}); window.scrollTo(0, 0); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Cabecera con el periodo, que aplica al panel y a todos los informes */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg p-7 text-white relative overflow-hidden">
        <BarChart3 className="absolute -right-6 -bottom-10 w-48 h-48 text-white/10" aria-hidden="true" />
        <div className="relative flex items-end justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><BarChart3 className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Reportes</h1>
              <p className="text-indigo-100 text-sm">Indicadores del hato e informes para descargar en Excel o PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex p-[3px] rounded-xl bg-white/15" role="radiogroup" aria-label="Periodo">
              {PRESETS.map((p) => (
                <button key={p.clave} role="radio" aria-checked={preset === p.clave} onClick={() => elegirPreset(p)}
                  className={`h-8 px-3 rounded-[10px] text-sm transition-colors ${preset === p.clave ? 'bg-white text-indigo-700 font-semibold shadow-sm' : 'text-white font-medium hover:bg-white/10'}`}>
                  {p.etiqueta}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input type="date" value={desde} max={hasta} onChange={(e) => cambiarFecha('desde', e.target.value)} aria-label="Desde"
                className="h-9 px-2.5 rounded-lg bg-white text-gray-900 text-sm" />
              <span className="text-indigo-100">a</span>
              <input type="date" value={hasta} min={desde} onChange={(e) => cambiarFecha('hasta', e.target.value)} aria-label="Hasta"
                className="h-9 px-2.5 rounded-lg bg-white text-gray-900 text-sm" />
            </div>
          </div>
        </div>
      </div>

      {meta ? (
        <VistaInforme meta={meta} desde={desde} hasta={hasta} alVolver={() => abrir(null)} />
      ) : (
        <>
          <Panel desde={desde} hasta={hasta} />

          <section aria-label="Informes">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight mt-2 mb-3">Informes</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {GRUPOS.map((g) => (
                <div key={g.titulo} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${g.color}`} aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-gray-900">{g.titulo}</h3>
                  </div>
                  <ul>
                    {g.informes.map((i) => (
                      <li key={i.clave} className="border-t border-gray-100 first:border-t-0">
                        <button onClick={() => abrir(i.clave)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group">
                          <span className={`w-9 h-9 rounded-[10px] ${g.color} flex items-center justify-center shrink-0`}><i.Icono className="w-5 h-5 text-white" /></span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-gray-900">{i.nombre}</span>
                            <span className="block text-xs text-gray-500">{i.ayuda}</span>
                          </span>
                          {i.hoy && <span className="text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 shrink-0">Hoy</span>}
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 px-1">
              Los informes marcados con "Hoy" muestran la situación actual y no cambian con el periodo. Todos se descargan en Excel y en PDF.
            </p>
          </section>
        </>
      )}
    </div>
  );
};

export default ModuloReportes;
