import React, { useState } from 'react';
import {
  BarChart3, FileText, Download, Calendar, TrendingUp, TrendingDown,
  Users, Activity, Droplet, Heart, Weight, AlertTriangle, CheckCircle,
  FileSpreadsheet, Printer, Filter, ChevronDown, ChevronRight,
  PieChart, LineChart, DollarSign, Package, Clock, Target, Shield,
  ArrowRight, X
} from 'lucide-react';

const CATEGORIAS = [
  {
    id: 'produccion', nombre: 'Producción de Leche', icono: Droplet,
    color: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-50 border-cyan-100', txt: 'text-cyan-700',
    descripcion: 'Análisis lechero, calidad y tendencias',
    reportes: [
      { id: 'produccion-diaria', nombre: 'Producción Diaria', descripcion: 'Registro detallado por animal y ordeño', tipo: 'tabla', metricas: ['Litros totales','Promedio/animal','Calidad','Ordeños'] },
      { id: 'produccion-mensual', nombre: 'Producción Mensual', descripcion: 'Comparativo mensual y proyecciones', tipo: 'grafico', metricas: ['Tendencia mensual','Mejor/peor mes','Variación %'] },
      { id: 'calidad-leche', nombre: 'Análisis de Calidad', descripcion: 'Parámetros físico-químicos y sanitarios', tipo: 'detallado', metricas: ['Grasa %','Proteína %','Células somáticas','pH'] },
      { id: 'produccion-animal', nombre: 'Producción por Animal', descripcion: 'Ranking de productoras y análisis individual', tipo: 'ranking', metricas: ['Top productoras','Litros/día','Días lactancia'] },
      { id: 'curva-lactancia', nombre: 'Curva de Lactancia', descripcion: 'Evolución durante el periodo de lactancia', tipo: 'grafico', metricas: ['Pico lactancia','Persistencia','Total acumulado'] },
    ]
  },
  {
    id: 'reproduccion', nombre: 'Reproducción', icono: Heart,
    color: 'pink', bg: 'bg-pink-500', light: 'bg-pink-50 border-pink-100', txt: 'text-pink-700',
    descripcion: 'Eficiencia reproductiva y control de montas',
    reportes: [
      { id: 'eficiencia-reproductiva', nombre: 'Eficiencia Reproductiva', descripcion: 'Indicadores de desempeño del rebaño', tipo: 'estadistico', metricas: ['Tasa concepción','Días abiertos','Servicios/concepción'] },
      { id: 'calendario-partos', nombre: 'Calendario de Partos', descripcion: 'Partos realizados y proyectados', tipo: 'calendario', metricas: ['Partos del mes','Próximos partos','Intervalo partos'] },
      { id: 'registro-montas', nombre: 'Registro de Montas', descripcion: 'Control de servicios y machos', tipo: 'tabla', metricas: ['Total montas','Tipo servicio','Machos activos'] },
      { id: 'analisis-gestacion', nombre: 'Análisis de Gestación', descripcion: 'Diagnósticos y gestaciones en curso', tipo: 'detallado', metricas: ['Gestantes','Vacías','Pendientes diagnóstico'] },
      { id: 'desempeno-machos', nombre: 'Desempeño de Machos', descripcion: 'Evaluación de machos reproductores', tipo: 'ranking', metricas: ['Servicios realizados','Tasa preñez','Crías nacidas'] },
    ]
  },
  {
    id: 'salud', nombre: 'Salud y Sanidad', icono: Activity,
    color: 'red', bg: 'bg-red-500', light: 'bg-red-50 border-red-100', txt: 'text-red-700',
    descripcion: 'Control sanitario, vacunaciones y tratamientos',
    reportes: [
      { id: 'plan-vacunacion', nombre: 'Plan de Vacunación', descripcion: 'Calendario de vacunas aplicadas y próximas', tipo: 'calendario', metricas: ['Vacunas aplicadas','Próximas dosis','Cobertura %'] },
      { id: 'registro-enfermedades', nombre: 'Registro de Enfermedades', descripcion: 'Incidencia de enfermedades y brotes', tipo: 'estadistico', metricas: ['Casos totales','Por enfermedad','Tasa mortalidad'] },
      { id: 'tratamientos-activos', nombre: 'Tratamientos Activos', descripcion: 'Animales en tratamiento y medicamentos', tipo: 'tabla', metricas: ['En tratamiento','Medicamentos','Días tratamiento'] },
      { id: 'analisis-sanitario', nombre: 'Análisis Sanitario General', descripcion: 'Estado de salud general del rebaño', tipo: 'detallado', metricas: ['Sanos','En observación','Enfermos','Recuperados'] },
      { id: 'costos-sanitarios', nombre: 'Costos Sanitarios', descripcion: 'Inversión en vacunas y tratamientos', tipo: 'financiero', metricas: ['Costo total','Por animal','Por intervención'] },
    ]
  },
  {
    id: 'peso', nombre: 'Peso y Desarrollo', icono: Weight,
    color: 'violet', bg: 'bg-violet-500', light: 'bg-violet-50 border-violet-100', txt: 'text-violet-700',
    descripcion: 'Crecimiento y condición corporal',
    reportes: [
      { id: 'evolucion-peso', nombre: 'Evolución de Peso', descripcion: 'Curvas de crecimiento por animal y grupo', tipo: 'grafico', metricas: ['Ganancia diaria','Peso promedio','Vs estándar'] },
      { id: 'condicion-corporal', nombre: 'Condición Corporal', descripcion: 'Distribución de condición corporal', tipo: 'estadistico', metricas: ['Condición 1-5','Desnutridos','Promedio'] },
      { id: 'morfometria', nombre: 'Análisis Morfométrico', descripcion: 'Medidas corporales y desarrollo físico', tipo: 'detallado', metricas: ['Altura cruz','Circunferencia','Longitud'] },
      { id: 'peso-edad', nombre: 'Peso por Edad', descripcion: 'Comparativo de peso según edad y raza', tipo: 'comparativo', metricas: ['Por rango edad','Desviación estándar','Peso ideal'] },
    ]
  },
  {
    id: 'inventario', nombre: 'Inventario del Rebaño', icono: Package,
    color: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-100', txt: 'text-orange-700',
    descripcion: 'Composición y movimientos del rebaño',
    reportes: [
      { id: 'censo-general', nombre: 'Censo General', descripcion: 'Inventario completo por categoría', tipo: 'tabla', metricas: ['Total animales','Por categoría','Por estado'] },
      { id: 'movimientos', nombre: 'Movimientos del Rebaño', descripcion: 'Altas, bajas, nacimientos y ventas', tipo: 'estadistico', metricas: ['Nacimientos','Muertes','Compras','Ventas'] },
      { id: 'piramide-edades', nombre: 'Pirámide de Edades', descripcion: 'Distribución por rangos de edad', tipo: 'grafico', metricas: ['0-6 meses','6-12 meses','1-2 años','>2 años'] },
      { id: 'distribucion-racial', nombre: 'Distribución Racial', descripcion: 'Composición por razas y cruces', tipo: 'estadistico', metricas: ['Raza pura','Cruces','Porcentaje'] },
    ]
  },
  {
    id: 'genealogia', nombre: 'Genealogía', icono: Users,
    color: 'teal', bg: 'bg-teal-500', light: 'bg-teal-50 border-teal-100', txt: 'text-teal-700',
    descripcion: 'Análisis genético y consanguinidad',
    reportes: [
      { id: 'estructura-rebano', nombre: 'Estructura del Rebaño', descripcion: 'Composición genética y líneas de sangre', tipo: 'estadistico', metricas: ['Líneas principales','Por raza','Pureza promedio'] },
      { id: 'consanguinidad', nombre: 'Análisis de Consanguinidad', descripcion: 'Coeficientes y alertas', tipo: 'detallado', metricas: ['Coeficiente promedio','Alto %','Recomendaciones'] },
      { id: 'productividad-lineas', nombre: 'Productividad por Líneas', descripcion: 'Desempeño según línea genética', tipo: 'comparativo', metricas: ['Producción/línea','Fertilidad','Salud'] },
      { id: 'mejoramiento-genetico', nombre: 'Plan de Mejoramiento', descripcion: 'Sugerencias de cruces y mejora genética', tipo: 'recomendacion', metricas: ['Cruces sugeridos','Objetivos','Prioridades'] },
    ]
  },
  {
    id: 'auditoria', nombre: 'Auditoría del Sistema', icono: Shield,
    color: 'slate', bg: 'bg-slate-600', light: 'bg-slate-50 border-slate-100', txt: 'text-slate-700',
    descripcion: 'Trazabilidad y registro de actividades',
    reportes: [
      { id: 'actividad-usuarios', nombre: 'Actividad de Usuarios', descripcion: 'Acciones realizadas por cada usuario', tipo: 'tabla', metricas: ['Acciones totales','Por usuario','Por módulo'] },
      { id: 'cambios-registros', nombre: 'Cambios en Registros', descripcion: 'Historial de modificaciones', tipo: 'detallado', metricas: ['Creaciones','Ediciones','Eliminaciones'] },
      { id: 'sesiones', nombre: 'Registro de Sesiones', descripcion: 'Historial de inicio de sesión', tipo: 'tabla', metricas: ['Logins','Por usuario','Dispositivos'] },
      { id: 'incidencias', nombre: 'Incidencias y Errores', descripcion: 'Errores y eventos del sistema', tipo: 'estadistico', metricas: ['Errores totales','Por tipo','Resolución'] },
    ]
  },
  {
    id: 'financiero', nombre: 'Análisis Financiero', icono: DollarSign,
    color: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-100', txt: 'text-emerald-700',
    descripcion: 'Costos, ingresos y rentabilidad',
    reportes: [
      { id: 'ingresos-produccion', nombre: 'Ingresos por Producción', descripcion: 'Ventas de leche y derivados', tipo: 'financiero', metricas: ['Ingresos totales','Precio/litro','Proyección'] },
      { id: 'costos-operativos', nombre: 'Costos Operativos', descripcion: 'Gastos en alimentación, sanidad y mantenimiento', tipo: 'financiero', metricas: ['Costo total','Por animal','Por categoría'] },
      { id: 'rentabilidad', nombre: 'Análisis de Rentabilidad', descripcion: 'Margen de utilidad y punto de equilibrio', tipo: 'estadistico', metricas: ['Margen bruto','ROI','Costo-beneficio'] },
      { id: 'proyecciones', nombre: 'Proyecciones Financieras', descripcion: 'Estimaciones de ingresos y gastos', tipo: 'grafico', metricas: ['3-6 meses','Escenarios','Metas'] },
    ]
  },
];

const tipoIcono = { tabla: BarChart3, grafico: LineChart, detallado: FileText, ranking: Target, estadistico: PieChart, financiero: DollarSign, comparativo: BarChart3, recomendacion: Target, calendario: Calendar };
const tipoBadge = { tabla: 'bg-blue-100 text-blue-700', grafico: 'bg-purple-100 text-purple-700', detallado: 'bg-teal-100 text-teal-700', ranking: 'bg-amber-100 text-amber-700', estadistico: 'bg-indigo-100 text-indigo-700', financiero: 'bg-emerald-100 text-emerald-700', comparativo: 'bg-cyan-100 text-cyan-700', recomendacion: 'bg-orange-100 text-orange-700', calendario: 'bg-pink-100 text-pink-700' };

const ModuloReportes = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({ fechaInicio: '', fechaFin: '', animalId: '', razaId: '', sexo: '' });

  if (reporteSeleccionado) {
    return (
      <VisualizadorReporte reporte={reporteSeleccionado} categoria={categoriaSeleccionada}
        filtros={filtros} onCerrar={() => setReporteSeleccionado(null)}
        onExportar={(fmt) => console.log('Exportar:', fmt)} />
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
          <button onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros Globales'}
            {mostrarFiltros ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'fechaInicio', label: 'Fecha Inicio', type: 'date' },
                { key: 'fechaFin', label: 'Fecha Fin', type: 'date' },
                { key: 'animalId', label: 'Animal', type: 'text', ph: 'Código' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{f.label}</label>
                  <input type={f.type} value={filtros[f.key]} placeholder={f.ph}
                    onChange={e => setFiltros({ ...filtros, [f.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sexo</label>
                <select value={filtros.sexo} onChange={e => setFiltros({ ...filtros, sexo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                  <option value="">Todos</option>
                  <option value="hembra">Hembras</option>
                  <option value="macho">Machos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Raza</label>
                <select value={filtros.razaId} onChange={e => setFiltros({ ...filtros, razaId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
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

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {CATEGORIAS.map(cat => {
          const Icono = cat.icono;
          return (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
              {/* Header de categoría */}
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

              {/* Lista de reportes */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {cat.reportes.map(reporte => {
                    const TipoIcon = tipoIcono[reporte.tipo] || FileText;
                    return (
                      <button key={reporte.id}
                        onClick={() => { setCategoriaSeleccionada(cat); setReporteSeleccionado(reporte); }}
                        className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group">
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

const VisualizadorReporte = ({ reporte, categoria, filtros, onCerrar, onExportar }) => {
  const Icono = categoria.icono;
  const [vistaActual, setVistaActual] = useState('visualizacion');
  const [generando, setGenerando] = useState(false);

  const manejarExportar = async (fmt) => {
    setGenerando(true);
    await new Promise(r => setTimeout(r, 1200));
    onExportar(fmt);
    setGenerando(false);
  };

  const periodo = filtros.fechaInicio && filtros.fechaFin ? `${filtros.fechaInicio} – ${filtros.fechaFin}` : 'Último mes';
  const metricas = reporte.metricas.map((m, i) => ({ nombre: m, valor: 0, unidad: i % 2 === 0 ? '' : '%', tendencia: 'up', cambio: '0' }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        {/* Header */}
        <div className={`${categoria.bg} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icono className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{reporte.nombre}</h2>
              <p className="text-white/80 text-sm">{categoria.nombre} · {reporte.descripcion}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Barra de acciones */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <button onClick={() => manejarExportar('pdf')} disabled={generando}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
              {generando ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF
            </button>
            <button onClick={() => manejarExportar('excel')} disabled={generando}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => manejarExportar('print')} disabled={generando}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
          <div className="ml-auto flex gap-2">
            {['visualizacion', 'datos'].map(v => (
              <button key={v} onClick={() => setVistaActual(v)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${vistaActual === v ? `${categoria.bg} text-white` : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {v === 'visualizacion' ? <><BarChart3 className="w-4 h-4 inline mr-1" />Visualización</> : <><FileText className="w-4 h-4 inline mr-1" />Datos</>}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className={`px-6 py-3 border-b border-gray-100 ${categoria.light} border-0`}>
          <div className="flex flex-wrap gap-6 text-sm">
            <span><span className="font-medium text-gray-600">Período:</span> <span className="text-gray-800">{periodo}</span></span>
            <span><span className="font-medium text-gray-600">Registros:</span> <span className="text-gray-800">0</span></span>
            <span><span className="font-medium text-gray-600">Generado:</span> <span className="text-gray-800">{new Date().toLocaleString('es-ES')}</span></span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {vistaActual === 'visualizacion' && (
            <div className="space-y-6">
              {/* Métricas KPI */}
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Indicadores Clave</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metricas.map((m, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">{m.nombre}</span>
                        {m.tendencia === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{m.valor} <span className="text-base font-normal text-gray-400">{m.unidad}</span></p>
                      <p className={`text-xs mt-1 ${m.tendencia === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.tendencia === 'up' ? '↑' : '↓'} {m.cambio}% vs período anterior
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico placeholder */}
              {(reporte.tipo === 'grafico' || reporte.tipo === 'estadistico') && (
                <div>
                  <h3 className="text-base font-semibold text-gray-700 mb-4">
                    {reporte.tipo === 'grafico' ? 'Gráfico de Tendencias' : 'Análisis Estadístico'}
                  </h3>
                  <div className={`rounded-xl border p-8 ${categoria.light}`}>
                    <div className="flex items-center justify-center h-56">
                      <div className="text-center">
                        {reporte.tipo === 'grafico'
                          ? <LineChart className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                          : <PieChart className="w-14 h-14 text-gray-300 mx-auto mb-3" />}
                        <p className={`font-medium ${categoria.txt}`}>{reporte.nombre}</p>
                        <p className="text-sm text-gray-400 mt-1">La visualización se generará con datos reales de la API</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de datos */}
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Datos Detallados</h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Animal</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Métrica 1</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Métrica 2</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                          <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                          Los datos se cargarán desde la API cuando estén disponibles
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {reporte.tipo === 'recomendacion' && (
                <div className={`rounded-xl border p-5 ${categoria.light}`}>
                  <div className="flex items-start gap-3">
                    <Target className={`w-5 h-5 mt-0.5 ${categoria.txt}`} />
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-3">Recomendaciones</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {['Análisis basado en datos históricos del rebaño', 'Sugerencia para optimización de recursos', 'Alerta de indicadores que requieren atención'].map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            {i < 2 ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {vistaActual === 'datos' && (
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-4">Vista de Datos Completa</h3>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['#','Animal','Métrica 1','Métrica 2','Métrica 3','Estado'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        Sin datos para mostrar
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span><Clock className="w-3.5 h-3.5 inline mr-1" />Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}</span>
          <span>Sistema Caprino · Reportes</span>
        </div>
      </div>
    </div>
  );
};

export default ModuloReportes;
