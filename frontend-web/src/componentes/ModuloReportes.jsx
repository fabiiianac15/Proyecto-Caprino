import React, { useState, useEffect } from 'react';
import {
  BarChart3, FileText, Download, Calendar, TrendingUp, TrendingDown,
  Users, Activity, Droplet, Heart, Weight, AlertTriangle, CheckCircle,
  FileSpreadsheet, Printer, Filter, ChevronDown, ChevronRight,
  PieChart, LineChart, DollarSign, Package, Clock, Target, Shield,
  ArrowRight, X, RefreshCw, Loader2, ChevronUp
} from 'lucide-react';
import api from '../servicios/api';
import {
  BarChart as RBarChart, Bar, LineChart as RLineChart, Line, AreaChart, Area,
  PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Catálogo de categorías y reportes ───────────────────────────────────────

const CATEGORIAS = [
  {
    id: 'produccion', nombre: 'Producción de Leche', icono: Droplet,
    color: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-50 border-cyan-100', txt: 'text-cyan-700',
    descripcion: 'Análisis lechero, calidad y tendencias',
    reportes: [
      { id: 'produccion-diaria',   nombre: 'Producción Diaria',      descripcion: 'Registro detallado por animal y ordeño',         tipo: 'tabla',     metricas: ['Litros totales','Promedio/animal','Calidad','Ordeños'] },
      { id: 'produccion-mensual',  nombre: 'Producción Mensual',     descripcion: 'Comparativo mensual y proyecciones',             tipo: 'grafico',   metricas: ['Tendencia mensual','Mejor/peor mes','Variación %'] },
      { id: 'calidad-leche',       nombre: 'Análisis de Calidad',    descripcion: 'Parámetros físico-químicos y sanitarios',        tipo: 'detallado', metricas: ['Grasa %','Proteína %','Células somáticas','pH'] },
      { id: 'produccion-animal',   nombre: 'Producción por Animal',  descripcion: 'Ranking de productoras y análisis individual',   tipo: 'ranking',   metricas: ['Top productoras','Litros/día','Días lactancia'] },
      { id: 'curva-lactancia',     nombre: 'Curva de Lactancia',     descripcion: 'Evolución durante el periodo de lactancia',      tipo: 'grafico',   metricas: ['Pico lactancia','Persistencia','Total acumulado'] },
    ],
  },
  {
    id: 'reproduccion', nombre: 'Reproducción', icono: Heart,
    color: 'pink', bg: 'bg-pink-500', light: 'bg-pink-50 border-pink-100', txt: 'text-pink-700',
    descripcion: 'Eficiencia reproductiva y control de montas',
    reportes: [
      { id: 'eficiencia-reproductiva', nombre: 'Eficiencia Reproductiva', descripcion: 'Indicadores de desempeño del rebaño',          tipo: 'estadistico', metricas: ['Tasa concepción','Días abiertos','Servicios/concepción'] },
      { id: 'calendario-partos',       nombre: 'Calendario de Partos',    descripcion: 'Partos realizados y proyectados',              tipo: 'calendario',  metricas: ['Partos del mes','Próximos partos','Intervalo partos'] },
      { id: 'registro-montas',         nombre: 'Registro de Montas',      descripcion: 'Control de servicios y machos',                tipo: 'tabla',       metricas: ['Total montas','Tipo servicio','Machos activos'] },
      { id: 'analisis-gestacion',      nombre: 'Análisis de Gestación',   descripcion: 'Diagnósticos y gestaciones en curso',          tipo: 'detallado',   metricas: ['Gestantes','Vacías','Pendientes diagnóstico'] },
      { id: 'desempeno-machos',        nombre: 'Desempeño de Machos',     descripcion: 'Evaluación de machos reproductores',           tipo: 'ranking',     metricas: ['Servicios realizados','Tasa preñez','Crías nacidas'] },
    ],
  },
  {
    id: 'salud', nombre: 'Salud y Sanidad', icono: Activity,
    color: 'red', bg: 'bg-red-500', light: 'bg-red-50 border-red-100', txt: 'text-red-700',
    descripcion: 'Control sanitario, vacunaciones y tratamientos',
    reportes: [
      { id: 'plan-vacunacion',     nombre: 'Plan de Vacunación',         descripcion: 'Calendario de vacunas aplicadas y próximas',   tipo: 'calendario',  metricas: ['Vacunas aplicadas','Próximas dosis','Cobertura %'] },
      { id: 'registro-enfermedades', nombre: 'Registro de Enfermedades', descripcion: 'Incidencia de enfermedades y brotes',          tipo: 'estadistico', metricas: ['Casos totales','Por enfermedad','Tasa mortalidad'] },
      { id: 'tratamientos-activos',  nombre: 'Tratamientos Activos',     descripcion: 'Animales en tratamiento y medicamentos',        tipo: 'tabla',       metricas: ['En tratamiento','Medicamentos','Días tratamiento'] },
      { id: 'analisis-sanitario',    nombre: 'Análisis Sanitario General',descripcion: 'Estado de salud general del rebaño',           tipo: 'detallado',   metricas: ['Sanos','En observación','Enfermos','Recuperados'] },
      { id: 'costos-sanitarios',     nombre: 'Costos Sanitarios',        descripcion: 'Inversión en vacunas y tratamientos',           tipo: 'financiero',  metricas: ['Costo total','Por animal','Por intervención'] },
    ],
  },
  {
    id: 'peso', nombre: 'Peso y Desarrollo', icono: Weight,
    color: 'violet', bg: 'bg-violet-500', light: 'bg-violet-50 border-violet-100', txt: 'text-violet-700',
    descripcion: 'Crecimiento y condición corporal',
    reportes: [
      { id: 'evolucion-peso',    nombre: 'Evolución de Peso',      descripcion: 'Curvas de crecimiento por animal y grupo', tipo: 'grafico',    metricas: ['Ganancia diaria','Peso promedio','Vs estándar'] },
      { id: 'condicion-corporal',nombre: 'Condición Corporal',     descripcion: 'Distribución de condición corporal',       tipo: 'estadistico',metricas: ['Condición 1-5','Desnutridos','Promedio'] },
      { id: 'morfometria',       nombre: 'Análisis Morfométrico',  descripcion: 'Medidas corporales y desarrollo físico',   tipo: 'detallado',  metricas: ['Altura cruz','Circunferencia','Longitud'] },
      { id: 'peso-edad',         nombre: 'Peso por Edad',          descripcion: 'Comparativo de peso según edad y raza',    tipo: 'comparativo',metricas: ['Por rango edad','Desviación estándar','Peso ideal'] },
    ],
  },
  {
    id: 'inventario', nombre: 'Inventario del Rebaño', icono: Package,
    color: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-100', txt: 'text-orange-700',
    descripcion: 'Composición y movimientos del rebaño',
    reportes: [
      { id: 'censo-general',      nombre: 'Censo General',          descripcion: 'Inventario completo por categoría',        tipo: 'tabla',       metricas: ['Total animales','Por categoría','Por estado'] },
      { id: 'movimientos',        nombre: 'Movimientos del Rebaño', descripcion: 'Altas, bajas, nacimientos y ventas',       tipo: 'estadistico', metricas: ['Nacimientos','Muertes','Compras','Ventas'] },
      { id: 'piramide-edades',    nombre: 'Pirámide de Edades',     descripcion: 'Distribución por rangos de edad',          tipo: 'grafico',     metricas: ['0-6 meses','6-12 meses','1-2 años','>2 años'] },
      { id: 'distribucion-racial',nombre: 'Distribución Racial',    descripcion: 'Composición por razas y cruces',           tipo: 'estadistico', metricas: ['Raza pura','Cruces','Porcentaje'] },
    ],
  },
  {
    id: 'genealogia', nombre: 'Genealogía', icono: Users,
    color: 'teal', bg: 'bg-teal-500', light: 'bg-teal-50 border-teal-100', txt: 'text-teal-700',
    descripcion: 'Análisis genético y consanguinidad',
    reportes: [
      { id: 'estructura-rebano',     nombre: 'Estructura del Rebaño',   descripcion: 'Composición genética y líneas de sangre', tipo: 'estadistico',  metricas: ['Líneas principales','Por raza','Pureza promedio'] },
      { id: 'consanguinidad',        nombre: 'Análisis de Consanguinidad',descripcion: 'Coeficientes y alertas',                tipo: 'detallado',    metricas: ['Coeficiente promedio','Alto %','Recomendaciones'] },
      { id: 'productividad-lineas',  nombre: 'Productividad por Líneas', descripcion: 'Desempeño según línea genética',         tipo: 'comparativo',  metricas: ['Producción/línea','Fertilidad','Salud'] },
      { id: 'mejoramiento-genetico', nombre: 'Plan de Mejoramiento',     descripcion: 'Sugerencias de cruces y mejora genética', tipo: 'recomendacion',metricas: ['Cruces sugeridos','Objetivos','Prioridades'] },
    ],
  },
  {
    id: 'auditoria', nombre: 'Auditoría del Sistema', icono: Shield,
    color: 'slate', bg: 'bg-slate-600', light: 'bg-slate-50 border-slate-100', txt: 'text-slate-700',
    descripcion: 'Trazabilidad y registro de actividades',
    reportes: [
      { id: 'actividad-usuarios', nombre: 'Actividad de Usuarios',  descripcion: 'Acciones realizadas por cada usuario',  tipo: 'tabla',       metricas: ['Acciones totales','Por usuario','Por módulo'] },
      { id: 'cambios-registros',  nombre: 'Cambios en Registros',   descripcion: 'Historial de modificaciones',           tipo: 'detallado',   metricas: ['Creaciones','Ediciones','Eliminaciones'] },
      { id: 'sesiones',           nombre: 'Registro de Sesiones',   descripcion: 'Historial de inicio de sesión',         tipo: 'tabla',       metricas: ['Logins','Por usuario','Dispositivos'] },
      { id: 'incidencias',        nombre: 'Incidencias y Errores',  descripcion: 'Errores y eventos del sistema',         tipo: 'estadistico', metricas: ['Errores totales','Por tipo','Resolución'] },
    ],
  },
  {
    id: 'financiero', nombre: 'Análisis Financiero', icono: DollarSign,
    color: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-100', txt: 'text-emerald-700',
    descripcion: 'Costos, ingresos y rentabilidad',
    reportes: [
      { id: 'ingresos-produccion', nombre: 'Ingresos por Producción',   descripcion: 'Ventas de leche y derivados',                  tipo: 'financiero', metricas: ['Ingresos totales','Precio/litro','Proyección'] },
      { id: 'costos-operativos',   nombre: 'Costos Operativos',         descripcion: 'Gastos en alimentación, sanidad y mantenimiento',tipo: 'financiero', metricas: ['Costo total','Por animal','Por categoría'] },
      { id: 'rentabilidad',        nombre: 'Análisis de Rentabilidad',  descripcion: 'Margen de utilidad y punto de equilibrio',       tipo: 'estadistico',metricas: ['Margen bruto','ROI','Costo-beneficio'] },
      { id: 'proyecciones',        nombre: 'Proyecciones Financieras',  descripcion: 'Estimaciones de ingresos y gastos',              tipo: 'grafico',    metricas: ['3-6 meses','Escenarios','Metas'] },
    ],
  },
];

const tipoIcono  = { tabla: BarChart3, grafico: LineChart, detallado: FileText, ranking: Target, estadistico: PieChart, financiero: DollarSign, comparativo: BarChart3, recomendacion: Target, calendario: Calendar };
const tipoBadge  = { tabla: 'bg-blue-100 text-blue-700', grafico: 'bg-purple-100 text-purple-700', detallado: 'bg-teal-100 text-teal-700', ranking: 'bg-amber-100 text-amber-700', estadistico: 'bg-indigo-100 text-indigo-700', financiero: 'bg-emerald-100 text-emerald-700', comparativo: 'bg-cyan-100 text-cyan-700', recomendacion: 'bg-orange-100 text-orange-700', calendario: 'bg-pink-100 text-pink-700' };

// ─── Mapeo reporte.id → endpoint API ─────────────────────────────────────────

const ENDPOINT_MAP = {
  'produccion-diaria':       '/reportes/produccion/diaria',
  'produccion-mensual':      '/reportes/produccion',
  'calidad-leche':           '/reportes/produccion',
  'produccion-animal':       '/reportes/produccion/ranking',
  'curva-lactancia':         '/reportes/produccion/ranking',
  'eficiencia-reproductiva': '/reportes/reproduccion',
  'registro-montas':         '/reportes/reproduccion',
  'analisis-gestacion':      '/reportes/reproduccion',
  'calendario-partos':       '/reportes/reproduccion/partos',
  'desempeno-machos':        '/reportes/reproduccion/machos',
  'plan-vacunacion':         '/reportes/salud',
  'analisis-sanitario':      '/reportes/salud',
  'tratamientos-activos':    '/reportes/salud',
  'registro-enfermedades':   '/reportes/salud/enfermedades',
  'costos-sanitarios':       '/reportes/salud/enfermedades',
  'evolucion-peso':          '/reportes/peso',
  'condicion-corporal':      '/reportes/peso',
  'morfometria':             '/reportes/peso',
  'peso-edad':               '/reportes/peso',
  'censo-general':           '/reportes/inventario',
  'movimientos':             '/reportes/inventario',
  'piramide-edades':         '/reportes/inventario',
  'distribucion-racial':     '/reportes/inventario',
  'estructura-rebano':       '/reportes/inventario',
  'consanguinidad':          '/reportes/inventario',
  'productividad-lineas':    '/reportes/inventario',
  'mejoramiento-genetico':   '/reportes/inventario',
  'actividad-usuarios':      '/reportes/auditoria',
  'cambios-registros':       '/reportes/auditoria',
  'sesiones':                '/reportes/auditoria',
  'incidencias':             '/reportes/auditoria',
  'ingresos-produccion':     '/reportes/resumen',
  'costos-operativos':       '/reportes/resumen',
  'rentabilidad':            '/reportes/resumen',
  'proyecciones':            '/reportes/produccion',
};

// ─── Grupo de renderización ───────────────────────────────────────────────────

const getGroup = (id) => {
  const grupos = {
    'produccion-diaria':                          'prd-diaria',
    'produccion-mensual':                         'prd-mensual',
    'calidad-leche':                              'prd-mensual',
    'proyecciones':                               'prd-mensual',
    'produccion-animal':                          'prd-ranking',
    'curva-lactancia':                            'prd-ranking',
    'eficiencia-reproductiva':                    'rep-mensual',
    'registro-montas':                            'rep-detalle',
    'analisis-gestacion':                         'rep-detalle',
    'calendario-partos':                          'rep-partos',
    'desempeno-machos':                           'rep-machos',
    'plan-vacunacion':                            'sal-vacunas',
    'analisis-sanitario':                         'sal-vacunas',
    'tratamientos-activos':                       'sal-trat',
    'registro-enfermedades':                      'sal-enf',
    'costos-sanitarios':                          'sal-enf',
    'evolucion-peso':                             'pes-detalle',
    'morfometria':                                'pes-detalle',
    'peso-edad':                                  'pes-detalle',
    'condicion-corporal':                         'pes-animal',
    'censo-general':                              'inv-censo',
    'movimientos':                                'inv-censo',
    'estructura-rebano':                          'inv-censo',
    'consanguinidad':                             'inv-censo',
    'productividad-lineas':                       'inv-censo',
    'mejoramiento-genetico':                      'inv-censo',
    'piramide-edades':                            'inv-piramide',
    'distribucion-racial':                        'inv-razas',
    'actividad-usuarios':                         'aud',
    'cambios-registros':                          'aud',
    'sesiones':                                   'aud',
    'incidencias':                                'aud',
    'ingresos-produccion':                        'resumen',
    'costos-operativos':                          'resumen',
    'rentabilidad':                               'resumen',
  };
  return grupos[id] ?? 'none';
};

// ─── Extracción de KPIs ───────────────────────────────────────────────────────

const fmt = (v, dec = 2) => v != null ? Number(v).toLocaleString('es-CO', { maximumFractionDigits: dec }) : '—';

const extractKPIs = (group, d) => {
  switch (group) {
    case 'prd-diaria': return [
      { label: 'Litros Totales',    valor: fmt(d.resumen?.totalLitros),    unidad: 'L',   color: 'cyan'   },
      { label: 'Ordeños',           valor: fmt(d.resumen?.totalOrdenos, 0), unidad: '',   color: 'blue'   },
      { label: 'Animales',          valor: fmt(d.resumen?.totalAnimales, 0),unidad: '',   color: 'indigo' },
      { label: 'Grasa Promedio',    valor: fmt(d.resumen?.promedioGrasa, 1),unidad: '%',  color: 'amber'  },
    ];
    case 'prd-mensual': {
      const arr = d.data ?? [];
      const total = arr.reduce((s, r) => s + (r.totalLitros ?? 0), 0);
      const mejor = arr.length ? Math.max(...arr.map(r => r.totalLitros ?? 0)) : 0;
      const prom  = arr.length ? total / arr.length : 0;
      return [
        { label: 'Total Litros (período)', valor: fmt(total),    unidad: 'L',  color: 'cyan'   },
        { label: 'Mejor Mes',              valor: fmt(mejor),    unidad: 'L',  color: 'emerald'},
        { label: 'Promedio Mensual',       valor: fmt(prom),     unidad: 'L',  color: 'blue'   },
        { label: 'Meses con Datos',        valor: arr.length,    unidad: '',   color: 'violet' },
      ];
    }
    case 'prd-ranking': {
      const arr = d.data ?? [];
      const top = arr[0];
      const promDia = arr.length ? (arr.reduce((s, r) => s + (r.promedioDia ?? 0), 0) / arr.length) : 0;
      return [
        { label: 'Top Productora',   valor: fmt(top?.totalLitros),      unidad: 'L',    color: 'cyan'   },
        { label: 'Prom. Litros/Día', valor: fmt(promDia),               unidad: 'L/d',  color: 'blue'   },
        { label: 'Animales Activos', valor: arr.length,                  unidad: '',     color: 'indigo' },
        { label: 'Máximo Día',       valor: fmt(top?.maxLitros),        unidad: 'L',    color: 'amber'  },
      ];
    }
    case 'rep-mensual':
    case 'rep-detalle': return [
      { label: 'Total Servicios',  valor: d.resumen?.total,            unidad: '',   color: 'pink'   },
      { label: 'Tasa Concepción',  valor: fmt(d.resumen?.tasaConcepcion, 1), unidad: '%', color: 'emerald'},
      { label: 'Exitosos',         valor: d.resumen?.exitosos,         unidad: '',   color: 'green'  },
      { label: 'En Gestación',     valor: d.resumen?.pendientes,       unidad: '',   color: 'blue'   },
    ];
    case 'rep-partos': return [
      { label: 'Gestantes',       valor: d.resumen?.gestantes,        unidad: '',   color: 'pink'   },
      { label: 'Próximos 7 días', valor: d.resumen?.proximos7dias,    unidad: '',   color: 'red'    },
      { label: 'Próximos 30 días',valor: d.resumen?.proximos30dias,   unidad: '',   color: 'orange' },
      { label: 'Partos últ. 90d', valor: d.resumen?.partosUltimos90,  unidad: '',   color: 'violet' },
    ];
    case 'rep-machos': {
      const arr = d.data ?? [];
      const totalSrv = arr.reduce((s, r) => s + (r.servicios ?? 0), 0);
      const totalCrias = arr.reduce((s, r) => s + (r.totalCrias ?? 0), 0);
      const topTasa = arr.length ? Math.max(...arr.filter(r => r.tasa != null).map(r => r.tasa)) : null;
      return [
        { label: 'Machos Activos',   valor: arr.length,        unidad: '',  color: 'pink'   },
        { label: 'Total Servicios',  valor: totalSrv,          unidad: '',  color: 'blue'   },
        { label: 'Mejor Tasa',       valor: fmt(topTasa, 1),   unidad: '%', color: 'emerald'},
        { label: 'Total Crías',      valor: totalCrias,         unidad: '',  color: 'violet' },
      ];
    }
    case 'sal-vacunas': return [
      { label: 'Total Vacunas',    valor: d.resumen?.totalVacunas, unidad: '',  color: 'red'    },
      { label: 'Vencidas',         valor: d.resumen?.vencidas,     unidad: '',  color: 'rose'   },
      { label: 'Urgentes (≤7d)',   valor: d.resumen?.urgentes,     unidad: '',  color: 'orange' },
      { label: 'Tratamientos',     valor: d.resumen?.tratamientos, unidad: '',  color: 'violet' },
    ];
    case 'sal-trat': return [
      { label: 'Tratamientos',     valor: d.resumen?.tratamientos, unidad: '',  color: 'red'    },
      { label: 'Total Vacunas',    valor: d.resumen?.totalVacunas, unidad: '',  color: 'blue'   },
      { label: 'Vencidas',         valor: d.resumen?.vencidas,     unidad: '',  color: 'rose'   },
      { label: 'Urgentes',         valor: d.resumen?.urgentes,     unidad: '',  color: 'orange' },
    ];
    case 'sal-enf': return [
      { label: 'Total Casos',          valor: d.resumen?.totalCasos,       unidad: '', color: 'red'    },
      { label: 'Enfermedades Distintas',valor: d.resumen?.tiposDistintos,  unidad: '', color: 'orange' },
      { label: 'Animales Afectados',   valor: d.resumen?.animalesAfectados,unidad: '', color: 'pink'   },
    ];
    case 'pes-detalle':
    case 'pes-animal': return [
      { label: 'Total Pesajes',    valor: d.resumen?.totalPesajes,    unidad: '',     color: 'violet' },
      { label: 'Peso Promedio',    valor: fmt(d.resumen?.pesoPromedio),unidad: 'kg',  color: 'blue'   },
      { label: 'Ganancia/Día',     valor: fmt(d.resumen?.gananciaProm, 3),unidad: 'kg/d',color: 'emerald'},
      { label: 'CC Promedio',      valor: fmt(d.resumen?.ccPromedio, 1),  unidad: '/5',  color: 'amber'  },
    ];
    case 'inv-censo':
    case 'inv-piramide':
    case 'inv-razas': return [
      { label: 'Total Animales',   valor: d.resumen?.total,           unidad: '', color: 'orange' },
      { label: 'Activos',          valor: d.resumen?.activos,         unidad: '', color: 'emerald'},
      { label: 'Hembras',          valor: d.resumen?.hembras,         unidad: '', color: 'pink'   },
      { label: 'Machos',           valor: d.resumen?.machos,          unidad: '', color: 'blue'   },
    ];
    case 'aud': return [
      { label: 'Total Acciones',  valor: d.resumen?.total,    unidad: '', color: 'slate'  },
      { label: 'Registros',       valor: d.resumen?.inserts,  unidad: '', color: 'emerald'},
      { label: 'Ediciones',       valor: d.resumen?.updates,  unidad: '', color: 'blue'   },
      { label: 'Eliminaciones',   valor: d.resumen?.deletes,  unidad: '', color: 'red'    },
    ];
    case 'resumen': {
      const s = d.data ?? {};
      return [
        { label: 'Total Animales',       valor: s.totalAnimales,           unidad: '',  color: 'emerald'},
        { label: 'Producción Mes (L)',   valor: fmt(s.produccionLitrosMes),unidad: 'L', color: 'cyan'  },
        { label: 'Gestaciones',          valor: s.gestacionesPendientes,   unidad: '',  color: 'pink'  },
        { label: 'Alertas Sanitarias',   valor: s.alertasPendientes,       unidad: '',  color: 'red'   },
      ];
    }
    default: return [];
  }
};

// ─── Extracción de tabla ──────────────────────────────────────────────────────

const extractTabla = (group, reporteId, d) => {
  switch (group) {
    case 'prd-diaria':
      return {
        headers: ['Fecha','Código','Nombre','Raza','Litros','Ordeños','Grasa %','Proteína %','CS'],
        filas:   (d.data ?? []).map(r => [r.fecha, r.codigo, r.nombre ?? '—', r.raza, r.litros, r.ordenos, r.grasa ?? '—', r.proteina ?? '—', r.celulasSomaticas ?? '—']),
        raw:     d.data ?? [],
      };
    case 'prd-mensual':
      return {
        headers: ['Mes','Litros Total','Animales','Registros','Prom. Litros','Grasa %','Proteína %'],
        filas:   (d.data ?? []).map(r => [r.mes, r.totalLitros, r.animales, r.registros, r.promedioLitros, r.promedioGrasa ?? '—', r.promedioProteina ?? '—']),
        raw:     d.data ?? [],
      };
    case 'prd-ranking':
      return {
        headers: ['#','Código','Nombre','Raza','Total Litros','Prom./Día','Grasa %','Proteína %','Máx. Día'],
        filas:   (d.data ?? []).map(r => [r.posicion, r.codigo, r.nombre ?? '—', r.raza, r.totalLitros, r.promedioDia, r.promedioGrasa ?? '—', r.promedioProteina ?? '—', r.maxLitros]),
        raw:     d.data ?? [],
      };
    case 'rep-mensual':
      return {
        headers: ['Mes','Servicios','Exitosos','Abortos','Mortinatos','Pendientes','Crías','Tasa %'],
        filas:   (d.mensual ?? []).map(r => [r.mes, r.servicios, r.exitosos, r.abortos, r.mortinatos, r.pendientes, r.totalCrias, r.tasaConcepcion ?? '—']),
        raw:     d.mensual ?? [],
      };
    case 'rep-detalle':
      return {
        headers: ['Fecha Servicio','Hembra','Macho','Tipo Servicio','Resultado','Parto Estimado','Crías'],
        filas:   (d.detalle ?? []).map(r => [r.fechaServicio, `${r.codigoHembra} ${r.nombreHembra ?? ''}`.trim(), r.codigoMacho ? `${r.codigoMacho} ${r.nombreMacho ?? ''}`.trim() : '—', r.tipoServicio, r.resultado, r.fechaPartoEstimada ?? '—', r.numeroCrias ?? '—']),
        raw:     d.detalle ?? [],
      };
    case 'rep-partos':
      return {
        headers: ['Código','Nombre','Raza','Fecha Estimada','Días Restantes','Urgencia','Macho'],
        filas:   (d.proximos ?? []).map(r => [r.codigo, r.nombre ?? '—', r.raza, r.fechaEstimada, r.diasRestantes, r.urgencia, r.codigoMacho ?? '—']),
        raw:     d.proximos ?? [],
      };
    case 'rep-machos':
      return {
        headers: ['Código','Nombre','Raza','Servicios','Exitosos','Abortos','Pendientes','Crías','Tasa %'],
        filas:   (d.data ?? []).map(r => [r.codigo, r.nombre ?? '—', r.raza, r.servicios, r.exitosos, r.abortos, r.pendientes, r.totalCrias, r.tasa ?? '—']),
        raw:     d.data ?? [],
      };
    case 'sal-vacunas':
      return {
        headers: ['Código','Nombre','Raza','Vacuna / Medicamento','Fecha Aplic.','Próxima Dosis','Estado'],
        filas:   (d.vacunas ?? []).map(r => [r.codigo, r.nombre ?? '—', r.raza, r.vacuna ?? '—', r.fechaAplicacion, r.fechaProxima ?? '—', r.estadoVacuna]),
        raw:     d.vacunas ?? [],
      };
    case 'sal-trat':
      return {
        headers: ['Código','Nombre','Tipo','Enfermedad','Medicamento','Fecha','Retiro Leche','Retiro Carne'],
        filas:   (d.tratamientos ?? []).map(r => [r.codigo, r.nombre ?? '—', r.tipo, r.enfermedad ?? '—', r.medicamento ?? '—', r.fechaAplicacion, r.diasRetiroLeche != null ? `${r.diasRetiroLeche}d` : '—', r.diasRetiroCarne != null ? `${r.diasRetiroCarne}d` : '—']),
        raw:     d.tratamientos ?? [],
      };
    case 'sal-enf':
      return {
        headers: ['Fecha','Código','Nombre','Raza','Tipo','Enfermedad','Medicamento','Veterinario'],
        filas:   (d.detalle ?? []).map(r => [r.fecha, r.codigo, r.nombre ?? '—', r.raza, r.tipo, r.enfermedad ?? '—', r.medicamento ?? '—', r.veterinario ?? '—']),
        raw:     d.detalle ?? [],
      };
    case 'pes-detalle':
      return {
        headers: ['Fecha','Código','Nombre','Raza','Sexo','Peso (kg)','Edad Días','Ganancia/Día','CC'],
        filas:   (d.detalle ?? []).map(r => [r.fechaPesaje, r.codigo, r.nombre ?? '—', r.raza, r.sexo, r.pesoKg, r.edadDias ?? '—', r.gananciaDiaria != null ? r.gananciaDiaria : '—', r.condicionCorporal ?? '—']),
        raw:     d.detalle ?? [],
      };
    case 'pes-animal':
      return {
        headers: ['Código','Nombre','Raza','Sexo','Pesajes','Peso Mín.','Peso Máx.','Promedio','CC Prom.'],
        filas:   (d.porAnimal ?? []).map(r => [r.codigo, r.nombre ?? '—', r.raza, r.sexo, r.pesajes, r.pesoMin, r.pesoMax, r.pesoPromedio, r.ccPromedio ?? '—']),
        raw:     d.porAnimal ?? [],
      };
    case 'inv-censo':
      return {
        headers: ['Código','Nombre','Raza','Sexo','Estado','Fecha Nac.','Edad (años)'],
        filas:   (d.censo ?? []).map(r => [r.codigo, r.nombre ?? '—', r.raza, r.sexo, r.estado, r.fechaNacimiento, r.edadAnos ?? '—']),
        raw:     d.censo ?? [],
      };
    case 'inv-piramide':
      return {
        headers: ['Rango de Edad','Sexo','Total'],
        filas:   (d.pirEdades ?? []).map(r => [r.rangoEdad, r.sexo, r.total]),
        raw:     d.pirEdades ?? [],
      };
    case 'inv-razas':
      return {
        headers: ['Raza','Sexo','Estado','Total','Edad Prom. (años)'],
        filas:   (d.porRazaSexo ?? []).map(r => [r.raza, r.sexo, r.estado, r.total, r.edadPromAnos ?? '—']),
        raw:     d.porRazaSexo ?? [],
      };
    case 'aud':
      return {
        headers: ['Fecha','Usuario','Rol','Operación','Tabla','ID Registro','IP'],
        filas:   (d.data ?? []).map(r => [r.fecha, r.usuario ?? '—', r.rol ?? '—', r.operacion, r.tabla, r.idRegistro ?? '—', r.ip ?? '—']),
        raw:     d.data ?? [],
      };
    case 'resumen':
      return { headers: [], filas: [], raw: [] };
    default:
      return { headers: [], filas: [], raw: [] };
  }
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

const descargarCSV = (headers, filas, nombre) => {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...filas.map(f => f.map(escape).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Badge de estado ──────────────────────────────────────────────────────────

const BADGE_STYLES = {
  Vencida:     'bg-red-100 text-red-700',
  Urgente:     'bg-orange-100 text-orange-700',
  'Próxima':   'bg-yellow-100 text-yellow-700',
  Programada:  'bg-green-100 text-green-700',
  'Sin próxima':'bg-gray-100 text-gray-500',
  exitoso:     'bg-emerald-100 text-emerald-700',
  pendiente:   'bg-blue-100 text-blue-700',
  aborto:      'bg-red-100 text-red-700',
  mortinato:   'bg-gray-200 text-gray-600',
  alta:        'bg-red-100 text-red-700',
  media:       'bg-orange-100 text-orange-700',
  baja:        'bg-green-100 text-green-700',
  INSERT:      'bg-emerald-100 text-emerald-700',
  UPDATE:      'bg-blue-100 text-blue-700',
  DELETE:      'bg-red-100 text-red-700',
  activo:      'bg-emerald-100 text-emerald-700',
  inactivo:    'bg-gray-100 text-gray-500',
  hembra:      'bg-pink-100 text-pink-700',
  macho:       'bg-blue-100 text-blue-700',
  vacuna:      'bg-violet-100 text-violet-700',
  tratamiento: 'bg-amber-100 text-amber-700',
  diagnostico: 'bg-sky-100 text-sky-700',
  cirugia:     'bg-red-100 text-red-700',
  desparasitacion:'bg-teal-100 text-teal-700',
};

const CeldaBadge = ({ valor }) => {
  const style = BADGE_STYLES[valor];
  if (!style) return <span className="text-gray-700">{valor}</span>;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}>{valor}</span>;
};

const BADGE_COLS = new Set(['estado','resultado','estadoVacuna','urgencia','operacion','sexo','tipo','tipoServicio','tipoRegistro']);

const esBadgeCol = (header) => {
  const map = {
    'Estado': true, 'Resultado': true, 'Estado Vacuna': true, 'Urgencia': true,
    'Operación': true, 'Sexo': true, 'Tipo': true, 'Tipo Servicio': true,
  };
  return !!map[header];
};

// ─── Constantes y helpers de gráficas ────────────────────────────────────────

const COLORES_GRAFICO = ['#06b6d4','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#3b82f6','#f97316'];

const colorHex = {
  cyan: '#06b6d4', pink: '#ec4899', red: '#ef4444', violet: '#8b5cf6',
  orange: '#f97316', teal: '#14b8a6', slate: '#64748b', emerald: '#10b981',
};

const TooltipChart = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-2">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>{typeof p.value === 'number' ? Number(p.value).toLocaleString('es-CO', { maximumFractionDigits: 2 }) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const SinDatosChart = ({ msg = 'No hay datos suficientes para generar la gráfica' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
    <BarChart3 className="w-10 h-10 text-gray-200" />
    <p className="text-sm">{msg}</p>
  </div>
);

const GraficoReporte = ({ group, datos, colorCat }) => {
  if (!datos) return null;
  const color = colorHex[colorCat] ?? '#6366f1';

  switch (group) {

    case 'prd-mensual': {
      const data = (datos.data ?? []).map(r => ({
        mes: r.mes ?? '',
        'Total Litros': r.totalLitros ?? 0,
        'Promedio': r.promedioLitros ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Producción mensual de leche</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradLit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Area type="monotone" dataKey="Total Litros" stroke={color} fill="url(#gradLit)" strokeWidth={2} />
              <Line type="monotone" dataKey="Promedio" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'prd-ranking': {
      const data = (datos.data ?? []).slice(0, 10).map(r => ({
        nombre: (r.nombre ?? r.codigo ?? '').slice(0, 16),
        'Total Litros': r.totalLitros ?? 0,
        'Prom./Día': r.promedioDia ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top 10 animales por producción</p>
          <ResponsiveContainer width="100%" height={320}>
            <RBarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Bar dataKey="Total Litros" fill={color}    radius={[0,4,4,0]} />
              <Bar dataKey="Prom./Día"    fill="#94a3b8"  radius={[0,4,4,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'prd-diaria': {
      const byFecha = {};
      (datos.data ?? []).forEach(r => {
        const f = r.fecha ?? '?';
        byFecha[f] = (byFecha[f] ?? 0) + (r.litros ?? 0);
      });
      const data = Object.entries(byFecha).map(([fecha, Litros]) => ({ fecha, Litros }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Producción diaria (litros totales)</p>
          <ResponsiveContainer width="100%" height={300}>
            <RBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Bar dataKey="Litros" fill={color} radius={[4,4,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'rep-mensual': {
      const data = (datos.mensual ?? []).map(r => ({
        mes: r.mes ?? '',
        Exitosos:   r.exitosos   ?? 0,
        Pendientes: r.pendientes ?? 0,
        Abortos:    r.abortos    ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Servicios reproductivos por mes</p>
          <ResponsiveContainer width="100%" height={280}>
            <RBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Bar dataKey="Exitosos"   stackId="a" fill="#10b981" />
              <Bar dataKey="Pendientes" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Abortos"    stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'rep-detalle': {
      const counts = {};
      (datos.detalle ?? []).forEach(r => { const k = r.resultado ?? 'desconocido'; counts[k] = (counts[k] ?? 0) + 1; });
      const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribución de servicios por resultado</p>
          <ResponsiveContainer width="100%" height={280}>
            <RPieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />)}
              </Pie>
              <RTooltip content={<TooltipChart />} />
              <Legend />
            </RPieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'rep-partos': {
      const counts = { alta: 0, media: 0, baja: 0 };
      (datos.proximos ?? []).forEach(r => { const u = r.urgencia ?? 'baja'; counts[u] = (counts[u] ?? 0) + 1; });
      const data = [
        { name: 'Alta urgencia',  value: counts.alta  },
        { name: 'Media urgencia', value: counts.media },
        { name: 'Baja urgencia',  value: counts.baja  },
      ].filter(d => d.value > 0);
      if (!data.length) return <SinDatosChart msg="No hay partos próximos registrados" />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Partos próximos por urgencia</p>
          <ResponsiveContainer width="100%" height={260}>
            <RPieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}>
                {[<Cell key={0} fill="#ef4444" />, <Cell key={1} fill="#f59e0b" />, <Cell key={2} fill="#10b981" />]}
              </Pie>
              <RTooltip content={<TooltipChart />} />
              <Legend />
            </RPieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'rep-machos': {
      const data = (datos.data ?? []).slice(0, 10).map(r => ({
        nombre: (r.nombre ?? r.codigo ?? '').slice(0, 12),
        Servicios: r.servicios ?? 0,
        Exitosos:  r.exitosos  ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Desempeño de machos reproductores</p>
          <ResponsiveContainer width="100%" height={300}>
            <RBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Bar dataKey="Servicios" fill={color}    radius={[4,4,0,0]} />
              <Bar dataKey="Exitosos"  fill="#10b981"  radius={[4,4,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'sal-vacunas':
    case 'sal-trat': {
      const arr = group === 'sal-vacunas' ? (datos.vacunas ?? []) : (datos.tratamientos ?? []);
      const counts = {};
      arr.forEach(r => { const k = r.estadoVacuna ?? r.tipo ?? 'otro'; counts[k] = (counts[k] ?? 0) + 1; });
      const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
      if (!data.length) return <SinDatosChart />;
      const titulo = group === 'sal-vacunas' ? 'Estado de vacunas' : 'Tratamientos por tipo';
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{titulo}</p>
          <ResponsiveContainer width="100%" height={280}>
            <RPieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />)}
              </Pie>
              <RTooltip content={<TooltipChart />} />
              <Legend />
            </RPieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'sal-enf': {
      const data = (datos.frecuentes ?? []).map(r => ({
        enfermedad: (r.enfermedad ?? '').slice(0, 22),
        Casos:     r.casos            ?? 0,
        Afectados: r.animalesAfectados ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Enfermedades más frecuentes</p>
          <ResponsiveContainer width="100%" height={300}>
            <RBarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="enfermedad" width={145} tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Bar dataKey="Casos"     fill="#ef4444" radius={[0,4,4,0]} />
              <Bar dataKey="Afectados" fill="#f97316" radius={[0,4,4,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'pes-detalle': {
      const byFecha = {};
      (datos.detalle ?? []).forEach(r => {
        const f = r.fechaPesaje ?? '?';
        if (!byFecha[f]) byFecha[f] = { sum: 0, n: 0 };
        byFecha[f].sum += r.pesoKg ?? 0;
        byFecha[f].n   += 1;
      });
      const data = Object.entries(byFecha)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([fecha, { sum, n }]) => ({ fecha, 'Peso Prom. (kg)': +(sum / n).toFixed(2) }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Evolución del peso promedio del rebaño</p>
          <ResponsiveContainer width="100%" height={300}>
            <RLineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} />
              <YAxis tick={{ fontSize: 11 }} unit=" kg" />
              <RTooltip content={<TooltipChart />} />
              <Line type="monotone" dataKey="Peso Prom. (kg)" stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} />
            </RLineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'pes-animal': {
      const data = (datos.porAnimal ?? []).slice(0, 15).map(r => ({
        nombre: (r.nombre ?? r.codigo ?? '').slice(0, 12),
        Mínimo:   r.pesoMin      ?? 0,
        Promedio: r.pesoPromedio ?? 0,
        Máximo:   r.pesoMax      ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Peso por animal (kg)</p>
          <ResponsiveContainer width="100%" height={320}>
            <RBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" kg" />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Bar dataKey="Mínimo"   fill="#94a3b8" radius={[4,4,0,0]} />
              <Bar dataKey="Promedio" fill={color}   radius={[4,4,0,0]} />
              <Bar dataKey="Máximo"   fill="#1e293b" radius={[4,4,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'inv-piramide': {
      const byRango = {};
      (datos.pirEdades ?? []).forEach(r => {
        const rg = r.rangoEdad ?? '?';
        if (!byRango[rg]) byRango[rg] = { rango: rg, hembra: 0, macho: 0 };
        const sx = (r.sexo ?? '').toLowerCase();
        if (sx === 'hembra') byRango[rg].hembra += r.total ?? 0;
        else                  byRango[rg].macho  += r.total ?? 0;
      });
      const data = Object.values(byRango);
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pirámide de edades del rebaño</p>
          <ResponsiveContainer width="100%" height={280}>
            <RBarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="rango" width={100} tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Legend />
              <Bar dataKey="hembra" name="Hembras" fill="#ec4899" radius={[0,4,4,0]} />
              <Bar dataKey="macho"  name="Machos"  fill="#3b82f6" radius={[0,4,4,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'inv-razas': {
      const byRaza = {};
      (datos.porRazaSexo ?? []).forEach(r => {
        const rz = r.raza ?? '?';
        byRaza[rz] = (byRaza[rz] ?? 0) + (r.total ?? 0);
      });
      const data = Object.entries(byRaza).map(([name, value]) => ({ name, value }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribución del rebaño por raza</p>
          <ResponsiveContainer width="100%" height={280}>
            <RPieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />)}
              </Pie>
              <RTooltip content={<TooltipChart />} />
              <Legend />
            </RPieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'inv-censo': {
      const r = datos.resumen ?? {};
      const dataSexo = [
        { name: 'Hembras', value: r.hembras ?? 0 },
        { name: 'Machos',  value: r.machos  ?? 0 },
      ].filter(d => d.value > 0);
      const dataEstado = [
        { name: 'Activos',   value: r.activos ?? 0 },
        { name: 'Baja/Otro', value: Math.max(0, (r.total ?? 0) - (r.activos ?? 0)) },
      ].filter(d => d.value > 0);
      if (!dataSexo.length && !dataEstado.length) return <SinDatosChart />;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {dataSexo.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">Por sexo</p>
              <ResponsiveContainer width="100%" height={220}>
                <RPieChart>
                  <Pie data={dataSexo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="#ec4899" /><Cell fill="#3b82f6" />
                  </Pie>
                  <RTooltip content={<TooltipChart />} />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          )}
          {dataEstado.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">Por estado</p>
              <ResponsiveContainer width="100%" height={220}>
                <RPieChart>
                  <Pie data={dataEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="#10b981" /><Cell fill="#94a3b8" />
                  </Pie>
                  <RTooltip content={<TooltipChart />} />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      );
    }

    case 'aud': {
      const data = (datos.porTabla ?? []).map(t => ({
        tabla: t.tabla ?? '?',
        Total: t.total ?? 0,
      }));
      if (!data.length) return <SinDatosChart />;
      return (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actividad por módulo del sistema</p>
          <ResponsiveContainer width="100%" height={280}>
            <RBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tabla" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip content={<TooltipChart />} />
              <Bar dataKey="Total" fill={color} radius={[4,4,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    default:
      return <SinDatosChart msg="Visualización gráfica no disponible para este reporte" />;
  }
};

// ─── Módulo principal (grilla de categorías) ──────────────────────────────────

const ModuloReportes = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [reporteSeleccionado,   setReporteSeleccionado]   = useState(null);
  const [mostrarFiltros,        setMostrarFiltros]         = useState(false);
  const [filtros, setFiltros] = useState({ fechaInicio: '', fechaFin: '', animalId: '', razaId: '', sexo: '' });

  if (reporteSeleccionado) {
    return (
      <VisualizadorReporte
        reporte={reporteSeleccionado}
        categoria={categoriaSeleccionada}
        filtros={filtros}
        onCerrar={() => setReporteSeleccionado(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Reportes y Estadísticas</h2>
              <p className="text-sm text-gray-500">Análisis de datos e informes para la toma de decisiones</p>
            </div>
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros Globales'}
            {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'fechaInicio', label: 'Fecha Inicio', type: 'date' },
                { key: 'fechaFin',    label: 'Fecha Fin',    type: 'date' },
                { key: 'animalId',    label: 'Animal',       type: 'text', ph: 'Código' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{f.label}</label>
                  <input
                    type={f.type} value={filtros[f.key]} placeholder={f.ph}
                    onChange={e => setFiltros({ ...filtros, [f.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sexo</label>
                <select
                  value={filtros.sexo} onChange={e => setFiltros({ ...filtros, sexo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Todos</option>
                  <option value="hembra">Hembras</option>
                  <option value="macho">Machos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Raza</label>
                <select
                  value={filtros.razaId} onChange={e => setFiltros({ ...filtros, razaId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Todas</option>
                  <option value="saanen">Saanen</option>
                  <option value="alpina">Alpina Francesa</option>
                  <option value="toggenburg">Toggenburg</option>
                  <option value="murciana">Murciana-Granadina</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grilla de categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {CATEGORIAS.map(cat => {
          const Icono = cat.icono;
          return (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
              <div className={`${cat.bg} px-5 py-4`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icono className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{cat.nombre}</h3>
                    <p className="text-white/80 text-xs">{cat.descripcion}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {cat.reportes.map(reporte => {
                    const TipoIcon = tipoIcono[reporte.tipo] || FileText;
                    return (
                      <button
                        key={reporte.id}
                        onClick={() => { setCategoriaSeleccionada(cat); setReporteSeleccionado(reporte); }}
                        className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-white transition-colors mt-0.5">
                            <TipoIcon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <h4 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{reporte.nombre}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tipoBadge[reporte.tipo] || 'bg-gray-100 text-gray-600'}`}>
                                {reporte.tipo}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{reporte.descripcion}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {reporte.metricas.slice(0, 2).map((m, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{m}</span>
                              ))}
                              {reporte.metricas.length > 2 && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">+{reporte.metricas.length - 2}</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{cat.reportes.length} tipos de reporte disponibles</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.light} border ${cat.txt}`}>
                    {cat.nombre.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Visualizador de reporte ──────────────────────────────────────────────────

const COLOR_KPI = {
  cyan:    'bg-cyan-50 border-cyan-100',
  blue:    'bg-blue-50 border-blue-100',
  indigo:  'bg-indigo-50 border-indigo-100',
  amber:   'bg-amber-50 border-amber-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  violet:  'bg-violet-50 border-violet-100',
  pink:    'bg-pink-50 border-pink-100',
  red:     'bg-red-50 border-red-100',
  rose:    'bg-rose-50 border-rose-100',
  orange:  'bg-orange-50 border-orange-100',
  green:   'bg-green-50 border-green-100',
  slate:   'bg-slate-50 border-slate-100',
};
const TEXT_KPI = {
  cyan: 'text-cyan-700', blue: 'text-blue-700', indigo: 'text-indigo-700',
  amber: 'text-amber-700', emerald: 'text-emerald-700', violet: 'text-violet-700',
  pink: 'text-pink-700', red: 'text-red-700', rose: 'text-rose-700',
  orange: 'text-orange-700', green: 'text-green-700', slate: 'text-slate-700',
};

const LIMITE_DEFECTO = 50;

const VisualizadorReporte = ({ reporte, categoria, filtros, onCerrar }) => {
  const Icono = categoria.icono;

  const [datos,      setDatos]      = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState(null);
  const [vistaActual,setVistaActual]= useState('visualizacion');
  const [limite,     setLimite]     = useState(LIMITE_DEFECTO);

  const endpoint = ENDPOINT_MAP[reporte.id];
  const group    = getGroup(reporte.id);

  const cargar = () => {
    if (!endpoint) { setCargando(false); return; }
    setCargando(true);
    setError(null);

    const params = {};
    if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin)    params.fechaFin    = filtros.fechaFin;

    api.get(endpoint, { params })
      .then(res => { setDatos(res.data); setCargando(false); })
      .catch(err => { setError(err.response?.data?.detail ?? err.message); setCargando(false); });
  };

  useEffect(() => { setLimite(LIMITE_DEFECTO); cargar(); }, [reporte.id, filtros.fechaInicio, filtros.fechaFin]);

  const kpis              = datos ? extractKPIs(group, datos) : [];
  const { headers, filas} = datos ? extractTabla(group, reporte.id, datos) : { headers: [], filas: [] };
  const filasPaginadas    = filas.slice(0, limite);

  const periodo = filtros.fechaInicio && filtros.fechaFin
    ? `${filtros.fechaInicio} – ${filtros.fechaFin}`
    : 'Período por defecto';

  const manejarCSV = () => {
    if (headers.length && filas.length) descargarCSV(headers, filas, reporte.nombre);
  };

  const manejarImprimir = () => window.print();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:max-w-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden print:shadow-none print:border-0">

        {/* Header */}
        <div className={`${categoria.bg} px-6 py-5 flex items-center justify-between print:py-3`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icono className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{reporte.nombre}</h2>
              <p className="text-white/80 text-sm">{categoria.nombre} · {reporte.descripcion}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1.5 rounded-lg print:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de acciones */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3 items-center print:hidden">
          <div className="flex gap-2">
            <button
              onClick={manejarCSV}
              disabled={!datos || filas.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <FileSpreadsheet className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={manejarImprimir}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              onClick={cargar}
              disabled={cargando}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </div>
          <div className="ml-auto flex gap-2">
            {['visualizacion', 'datos'].map(v => (
              <button
                key={v}
                onClick={() => setVistaActual(v)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${vistaActual === v ? `${categoria.bg} text-white` : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {v === 'visualizacion'
                  ? <><BarChart3 className="w-4 h-4 inline mr-1" />Visualización</>
                  : <><FileText className="w-4 h-4 inline mr-1" />Datos</>}
              </button>
            ))}
          </div>
        </div>

        {/* Subheader: período y totales */}
        <div className="px-6 py-2.5 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-wrap gap-6 text-sm">
            <span><span className="font-medium text-gray-500">Período:</span> <span className="text-gray-800">{periodo}</span></span>
            <span><span className="font-medium text-gray-500">Registros:</span> <span className="text-gray-800">{cargando ? '…' : filas.length}</span></span>
            <span><span className="font-medium text-gray-500">Generado:</span> <span className="text-gray-800">{new Date().toLocaleString('es-CO')}</span></span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">

          {/* Estado: cargando */}
          {cargando && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className={`w-10 h-10 animate-spin ${categoria.txt}`} />
              <p className="text-gray-500 text-sm">Cargando datos desde la base de datos…</p>
            </div>
          )}

          {/* Estado: error */}
          {!cargando && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 mb-1">No se pudieron cargar los datos</p>
                <p className="text-sm text-gray-400 max-w-md">{error}</p>
              </div>
              <button
                onClick={cargar}
                className={`px-5 py-2.5 ${categoria.bg} text-white text-sm font-medium rounded-xl flex items-center gap-2`}
              >
                <RefreshCw className="w-4 h-4" /> Reintentar
              </button>
            </div>
          )}

          {/* Estado: sin endpoint */}
          {!cargando && !error && !endpoint && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-600">Módulo en desarrollo</p>
              <p className="text-sm text-gray-400 text-center max-w-sm">
                Este reporte requiere datos que aún no están disponibles en la base de datos del sistema.
              </p>
            </div>
          )}

          {/* Datos cargados */}
          {!cargando && !error && datos && (
            <div className="space-y-8">

              {/* KPI Cards */}
              {kpis.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Indicadores Clave</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((k, i) => (
                      <div key={i} className={`rounded-xl border p-4 ${COLOR_KPI[k.color] ?? 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-gray-500 mb-2">{k.label}</p>
                        <p className={`text-3xl font-bold ${TEXT_KPI[k.color] ?? 'text-gray-700'}`}>
                          {k.valor ?? '—'}
                          {k.unidad && <span className="text-base font-normal text-gray-400 ml-1">{k.unidad}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vista: Gráfica */}
              {vistaActual === 'visualizacion' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Visualización Gráfica</h3>
                  <GraficoReporte group={group} datos={datos} colorCat={categoria.color} />
                </div>
              )}

              {/* Vista: Tabla de datos */}
              {vistaActual === 'datos' && headers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Datos Completos
                    </h3>
                    {filas.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {Math.min(limite, filas.length)} de {filas.length} registros
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`${categoria.bg} text-white`}>
                          {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left font-semibold whitespace-nowrap text-xs uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filasPaginadas.length === 0 ? (
                          <tr>
                            <td colSpan={headers.length} className="px-4 py-12 text-center text-gray-400">
                              <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                              No hay registros en el período seleccionado
                            </td>
                          </tr>
                        ) : (
                          filasPaginadas.map((fila, ri) => (
                            <tr key={ri} className={`border-t border-gray-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                              {fila.map((celda, ci) => (
                                <td key={ci} className="px-4 py-2.5 whitespace-nowrap text-gray-700">
                                  {esBadgeCol(headers[ci])
                                    ? <CeldaBadge valor={celda} />
                                    : (celda == null || celda === '' ? <span className="text-gray-300">—</span> : celda)
                                  }
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mostrar más */}
                  {filas.length > limite && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setLimite(l => l + 100)}
                        className={`px-5 py-2 text-sm font-medium border rounded-xl ${categoria.light} ${categoria.txt} hover:opacity-80 transition-opacity`}
                      >
                        Mostrar 100 más ({filas.length - limite} restantes)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sin tabla pero con datos (resumen) */}
              {headers.length === 0 && kpis.length > 0 && (
                <div className={`rounded-xl border p-5 ${categoria.light}`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 ${categoria.txt}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Datos de resumen cargados correctamente</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Este reporte muestra los indicadores consolidados del sistema. Para ver tablas detalladas, seleccione un reporte específico de la categoría correspondiente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen de partos: tabla de recientes */}
              {group === 'rep-partos' && datos.recientes?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Partos Recientes (últimos 90 días)</h3>
                  <div className="rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`${categoria.bg} text-white`}>
                          {['Código','Nombre','Raza','Fecha Parto','Tipo Parto','Crías','Dificultad','Resultado'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {datos.recientes.map((r, i) => (
                          <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{r.codigo}</td>
                            <td className="px-4 py-2.5 text-gray-700">{r.nombre ?? '—'}</td>
                            <td className="px-4 py-2.5 text-gray-500">{r.raza}</td>
                            <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{r.fechaPartoReal}</td>
                            <td className="px-4 py-2.5"><CeldaBadge valor={r.tipoParto} /></td>
                            <td className="px-4 py-2.5 text-center font-semibold text-gray-700">{r.numeroCrias ?? '—'}</td>
                            <td className="px-4 py-2.5"><CeldaBadge valor={r.dificultadParto} /></td>
                            <td className="px-4 py-2.5"><CeldaBadge valor={r.resultado} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inventario: pirámide y por-raza en mismo reporte */}
              {group === 'inv-censo' && datos.porRazaSexo?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Distribución por Raza y Sexo</h3>
                  <div className="rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`${categoria.bg} text-white`}>
                          {['Raza','Sexo','Estado','Total','Edad Prom.'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {datos.porRazaSexo.map((r, i) => (
                          <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="px-4 py-2.5 font-medium text-gray-700">{r.raza}</td>
                            <td className="px-4 py-2.5"><CeldaBadge valor={r.sexo} /></td>
                            <td className="px-4 py-2.5"><CeldaBadge valor={r.estado} /></td>
                            <td className="px-4 py-2.5 font-bold text-gray-800">{r.total}</td>
                            <td className="px-4 py-2.5 text-gray-500">{r.edadPromAnos != null ? `${r.edadPromAnos} años` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Enfermedades: tabla de frecuencia */}
              {group === 'sal-enf' && datos.frecuentes?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Enfermedades más Frecuentes</h3>
                  <div className="rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`${categoria.bg} text-white`}>
                          {['Enfermedad / Diagnóstico','Casos','Animales Afectados','Tipo'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {datos.frecuentes.map((r, i) => (
                          <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="px-4 py-2.5 font-medium text-gray-700">{r.enfermedad}</td>
                            <td className="px-4 py-2.5 font-bold text-red-600">{r.casos}</td>
                            <td className="px-4 py-2.5 text-gray-700">{r.animalesAfectados}</td>
                            <td className="px-4 py-2.5"><CeldaBadge valor={r.tipo} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Auditoría: tabla por módulo */}
              {group === 'aud' && datos.porTabla?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Actividad por Módulo</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {datos.porTabla.map((t, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <p className="text-xs font-medium text-slate-500 mb-1">{t.tabla}</p>
                        <p className="text-2xl font-bold text-slate-700">{t.total}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span><Clock className="w-3.5 h-3.5 inline mr-1" />Generado el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}</span>
          <span>Sistema Caprino · {categoria.nombre}</span>
        </div>
      </div>
    </div>
  );
};

export default ModuloReportes;
