/**
 * Módulo Completo de Reportes y Estadísticas
 * Generación de informes analíticos para toma de decisiones estratégicas
 */

import React, { useState } from 'react';
import { 
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Droplet,
  Heart,
  Weight,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Filter,
  Search,
  Eye,
  ChevronDown,
  ChevronRight,
  PieChart,
  LineChart,
  DollarSign,
  Package,
  Clock,
  Target,
  Award,
  Percent
} from 'lucide-react';

const ModuloReportes = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    animalId: '',
    razaId: '',
    estadoReproductivo: '',
    rangoEdad: '',
    sexo: ''
  });

  /**
   * Categorías de reportes disponibles
   */
  const categoriasReportes = [
    {
      id: 'produccion',
      nombre: 'Producción de Leche',
      icono: Droplet,
      color: 'cyan',
      descripcion: 'Análisis de producción lechera, calidad y tendencias',
      reportes: [
        {
          id: 'produccion-diaria',
          nombre: 'Producción Diaria',
          descripcion: 'Registro detallado de producción por animal y ordeño',
          tipo: 'tabla',
          metricas: ['Litros totales', 'Promedio por animal', 'Calidad', 'Ordeños']
        },
        {
          id: 'produccion-mensual',
          nombre: 'Producción Mensual',
          descripcion: 'Comparativo mensual de producción y proyecciones',
          tipo: 'grafico',
          metricas: ['Tendencia mensual', 'Mejor/peor mes', 'Variación %']
        },
        {
          id: 'calidad-leche',
          nombre: 'Análisis de Calidad',
          descripcion: 'Parámetros físico-químicos y sanitarios de la leche',
          tipo: 'detallado',
          metricas: ['Grasa %', 'Proteína %', 'Células somáticas', 'pH', 'Temperatura']
        },
        {
          id: 'produccion-animal',
          nombre: 'Producción por Animal',
          descripcion: 'Ranking de productoras y análisis individual',
          tipo: 'ranking',
          metricas: ['Top productoras', 'Litros/día', 'Días en lactancia']
        },
        {
          id: 'produccion-lactancia',
          nombre: 'Curva de Lactancia',
          descripcion: 'Evolución de producción durante el periodo de lactancia',
          tipo: 'grafico',
          metricas: ['Pico de lactancia', 'Persistencia', 'Total acumulado']
        }
      ]
    },
    {
      id: 'reproduccion',
      nombre: 'Reproducción',
      icono: Heart,
      color: 'pink',
      descripcion: 'Eficiencia reproductiva y control de montas',
      reportes: [
        {
          id: 'eficiencia-reproductiva',
          nombre: 'Eficiencia Reproductiva',
          descripcion: 'Indicadores de desempeño reproductivo del rebaño',
          tipo: 'estadistico',
          metricas: ['Tasa de concepción', 'Días abiertos', 'Servicios/concepción']
        },
        {
          id: 'calendario-partos',
          nombre: 'Calendario de Partos',
          descripcion: 'Partos realizados y proyección de partos esperados',
          tipo: 'calendario',
          metricas: ['Partos del mes', 'Próximos partos', 'Intervalo entre partos']
        },
        {
          id: 'registro-montas',
          nombre: 'Registro de Montas',
          descripcion: 'Control de servicios y machos utilizados',
          tipo: 'tabla',
          metricas: ['Total montas', 'Tipo (natural/IA)', 'Machos activos']
        },
        {
          id: 'analisis-gestacion',
          nombre: 'Análisis de Gestación',
          descripcion: 'Seguimiento de diagnósticos y gestaciones en curso',
          tipo: 'detallado',
          metricas: ['Gestantes', 'Vacías', 'Pendientes diagnóstico']
        },
        {
          id: 'desempeno-machos',
          nombre: 'Desempeño de Machos',
          descripcion: 'Evaluación de machos reproductores',
          tipo: 'ranking',
          metricas: ['Servicios realizados', 'Tasa de preñez', 'Crías nacidas']
        }
      ]
    },
    {
      id: 'salud',
      nombre: 'Salud y Sanidad',
      icono: Activity,
      color: 'red',
      descripcion: 'Control sanitario, vacunaciones y tratamientos',
      reportes: [
        {
          id: 'plan-vacunacion',
          nombre: 'Plan de Vacunación',
          descripcion: 'Calendario de vacunas aplicadas y próximas',
          tipo: 'calendario',
          metricas: ['Vacunas aplicadas', 'Próximas dosis', 'Cobertura %']
        },
        {
          id: 'registro-enfermedades',
          nombre: 'Registro de Enfermedades',
          descripcion: 'Incidencia de enfermedades y brotes',
          tipo: 'estadistico',
          metricas: ['Casos totales', 'Por enfermedad', 'Tasa de mortalidad']
        },
        {
          id: 'tratamientos-activos',
          nombre: 'Tratamientos Activos',
          descripcion: 'Animales en tratamiento y medicamentos utilizados',
          tipo: 'tabla',
          metricas: ['Animales en tratamiento', 'Medicamentos', 'Días de tratamiento']
        },
        {
          id: 'analisis-sanitario',
          nombre: 'Análisis Sanitario General',
          descripcion: 'Estado de salud general del rebaño',
          tipo: 'detallado',
          metricas: ['Animales sanos', 'En observación', 'Enfermos', 'Recuperados']
        },
        {
          id: 'costos-sanitarios',
          nombre: 'Costos Sanitarios',
          descripcion: 'Inversión en vacunas, medicamentos y tratamientos',
          tipo: 'financiero',
          metricas: ['Costo total', 'Por animal', 'Por tipo de intervención']
        }
      ]
    },
    {
      id: 'peso',
      nombre: 'Peso y Desarrollo',
      icono: Weight,
      color: 'indigo',
      descripcion: 'Seguimiento de crecimiento y condición corporal',
      reportes: [
        {
          id: 'evolucion-peso',
          nombre: 'Evolución de Peso',
          descripcion: 'Curvas de crecimiento por animal y grupo',
          tipo: 'grafico',
          metricas: ['Ganancia diaria', 'Peso promedio', 'Comparativo con estándar']
        },
        {
          id: 'condicion-corporal',
          nombre: 'Condición Corporal',
          descripcion: 'Distribución de condición corporal del rebaño',
          tipo: 'estadistico',
          metricas: ['Condición 1-5', 'Animales desnutridos', 'Promedio general']
        },
        {
          id: 'morfometria',
          nombre: 'Análisis Morfométrico',
          descripcion: 'Medidas corporales y desarrollo físico',
          tipo: 'detallado',
          metricas: ['Altura cruz', 'Circunferencia pecho', 'Longitud corporal']
        },
        {
          id: 'peso-edad',
          nombre: 'Peso por Edad',
          descripcion: 'Comparativo de peso según edad y raza',
          tipo: 'comparativo',
          metricas: ['Por rango de edad', 'Desviación estándar', 'Peso ideal']
        }
      ]
    },
    {
      id: 'genealogia',
      nombre: 'Genealogía',
      icono: Users,
      color: 'purple',
      descripcion: 'Análisis genético y consanguinidad',
      reportes: [
        {
          id: 'estructura-rebano',
          nombre: 'Estructura del Rebaño',
          descripcion: 'Composición genética y líneas de sangre',
          tipo: 'estadistico',
          metricas: ['Líneas principales', 'Distribución por raza', 'Pureza promedio']
        },
        {
          id: 'consanguinidad',
          nombre: 'Análisis de Consanguinidad',
          descripcion: 'Coeficientes de consanguinidad y alertas',
          tipo: 'detallado',
          metricas: ['Coeficiente promedio', 'Animales con alto %', 'Recomendaciones']
        },
        {
          id: 'productividad-lineas',
          nombre: 'Productividad por Líneas',
          descripcion: 'Desempeño productivo según línea genética',
          tipo: 'comparativo',
          metricas: ['Producción por línea', 'Fertilidad', 'Salud']
        },
        {
          id: 'mejoramiento-genetico',
          nombre: 'Plan de Mejoramiento',
          descripcion: 'Sugerencias de cruces y mejoramiento genético',
          tipo: 'recomendacion',
          metricas: ['Cruces sugeridos', 'Objetivos', 'Prioridades']
        }
      ]
    },
    {
      id: 'financiero',
      nombre: 'Análisis Financiero',
      icono: DollarSign,
      color: 'green',
      descripcion: 'Costos, ingresos y rentabilidad',
      reportes: [
        {
          id: 'ingresos-produccion',
          nombre: 'Ingresos por Producción',
          descripcion: 'Ventas de leche y productos derivados',
          tipo: 'financiero',
          metricas: ['Ingresos totales', 'Precio/litro', 'Proyección mensual']
        },
        {
          id: 'costos-operativos',
          nombre: 'Costos Operativos',
          descripcion: 'Gastos en alimentación, sanidad y mantenimiento',
          tipo: 'financiero',
          metricas: ['Costo total', 'Por animal', 'Distribución por categoría']
        },
        {
          id: 'rentabilidad',
          nombre: 'Análisis de Rentabilidad',
          descripcion: 'Margen de utilidad y punto de equilibrio',
          tipo: 'estadistico',
          metricas: ['Margen bruto', 'ROI', 'Costo-beneficio']
        },
        {
          id: 'proyecciones',
          nombre: 'Proyecciones Financieras',
          descripcion: 'Estimaciones de ingresos y gastos futuros',
          tipo: 'grafico',
          metricas: ['Proyección 3-6 meses', 'Escenarios', 'Metas']
        }
      ]
    },
    {
      id: 'inventario',
      nombre: 'Inventario del Rebaño',
      icono: Package,
      color: 'orange',
      descripcion: 'Composición y movimientos del rebaño',
      reportes: [
        {
          id: 'censo-general',
          nombre: 'Censo General',
          descripcion: 'Inventario completo por categoría y estado',
          tipo: 'tabla',
          metricas: ['Total animales', 'Por categoría', 'Por estado']
        },
        {
          id: 'movimientos',
          nombre: 'Movimientos del Rebaño',
          descripcion: 'Altas, bajas, nacimientos y ventas',
          tipo: 'estadistico',
          metricas: ['Nacimientos', 'Muertes', 'Compras', 'Ventas']
        },
        {
          id: 'piramide-edades',
          nombre: 'Pirámide de Edades',
          descripcion: 'Distribución por rangos de edad',
          tipo: 'grafico',
          metricas: ['0-6 meses', '6-12 meses', '1-2 años', '>2 años']
        },
        {
          id: 'distribucion-racial',
          nombre: 'Distribución Racial',
          descripcion: 'Composición por razas y cruces',
          tipo: 'estadistico',
          metricas: ['Por raza pura', 'Cruces', 'Porcentaje']
        }
      ]
    }
  ];

  if (reporteSeleccionado) {
    return (
      <VisualizadorReporte
        reporte={reporteSeleccionado}
        categoria={categoriaSeleccionada}
        filtros={filtros}
        onCerrar={() => setReporteSeleccionado(null)}
        onExportar={(formato) => console.log('Exportar:', formato)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Reportes y Estadísticas
            </h2>
            <p className="text-gray-600 mt-1">
              Análisis de datos e informes para la toma de decisiones estratégicas
            </p>
          </div>
        </div>

        {/* Filtros globales */}
        <div className="mt-6">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros Globales'}
            {mostrarFiltros ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
          </button>

          {mostrarFiltros && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Animal
                  </label>
                  <input
                    type="text"
                    value={filtros.animalId}
                    onChange={(e) => setFiltros({ ...filtros, animalId: e.target.value })}
                    placeholder="Código del animal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raza
                  </label>
                  <select
                    value={filtros.razaId}
                    onChange={(e) => setFiltros({ ...filtros, razaId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las razas</option>
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
      </div>

      {/* Grid de categorías de reportes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categoriasReportes.map(categoria => {
          const IconoCategoria = categoria.icono;
          const colorClasses = {
            cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
            pink: 'bg-pink-50 border-pink-200 text-pink-700',
            red: 'bg-red-50 border-red-200 text-red-700',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700',
            green: 'bg-green-50 border-green-200 text-green-700',
            orange: 'bg-orange-50 border-orange-200 text-orange-700'
          };

          return (
            <div key={categoria.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
              {/* Header de categoría */}
              <div className={`px-6 py-4 border-b-2 ${colorClasses[categoria.color]}`}>
                <div className="flex items-center">
                  <IconoCategoria className="w-6 h-6 mr-3" />
                  <div>
                    <h3 className="text-lg font-bold">{categoria.nombre}</h3>
                    <p className="text-sm opacity-90">{categoria.descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Lista de reportes */}
              <div className="p-4">
                <div className="space-y-2">
                  {categoria.reportes.map(reporte => (
                    <button
                      key={reporte.id}
                      onClick={() => {
                        setCategoriaSeleccionada(categoria);
                        setReporteSeleccionado(reporte);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {reporte.nombre}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{reporte.descripcion}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reporte.metricas.slice(0, 2).map((metrica, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {metrica}
                              </span>
                            ))}
                            {reporte.metricas.length > 2 && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                +{reporte.metricas.length - 2} más
                              </span>
                            )}
                          </div>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-2" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Contador de reportes */}
                <div className="mt-4 pt-4 border-t text-center">
                  <span className="text-sm text-gray-600">
                    {categoria.reportes.length} reportes disponibles
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estadísticas rápidas */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen Ejecutivo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <EstadisticaRapida
            icono={Users}
            valor="124"
            etiqueta="Total Animales"
            color="blue"
          />
          <EstadisticaRapida
            icono={Droplet}
            valor="485 L"
            etiqueta="Producción Diaria"
            color="cyan"
            tendencia="up"
          />
          <EstadisticaRapida
            icono={Heart}
            valor="18"
            etiqueta="Gestantes"
            color="pink"
          />
          <EstadisticaRapida
            icono={Activity}
            valor="95%"
            etiqueta="Salud del Rebaño"
            color="green"
          />
          <EstadisticaRapida
            icono={Weight}
            valor="42.5 kg"
            etiqueta="Peso Promedio"
            color="indigo"
            tendencia="up"
          />
          <EstadisticaRapida
            icono={DollarSign}
            valor="$24,580"
            etiqueta="Ingresos Mes"
            color="green"
            tendencia="up"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para mostrar estadísticas rápidas
 */
const EstadisticaRapida = ({ icono: Icono, valor, etiqueta, color, tendencia }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    pink: 'bg-pink-50 text-pink-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        <Icono className="w-5 h-5" />
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-800">{valor}</p>
        {tendencia === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
        {tendencia === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
      </div>
      <p className="text-sm text-gray-600 mt-1">{etiqueta}</p>
    </div>
  );
};

/**
 * Componente Visualizador de Reportes
 */
const VisualizadorReporte = ({ reporte, categoria, filtros, onCerrar, onExportar }) => {
  const IconoCategoria = categoria.icono;
  const [vistaActual, setVistaActual] = useState('visualizacion'); // visualizacion, datos, graficos
  const [generando, setGenerando] = useState(false);

  const manejarExportar = async (formato) => {
    setGenerando(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onExportar(formato);
    setGenerando(false);
  };

  // Datos de ejemplo según el tipo de reporte
  const obtenerDatosReporte = () => {
    // Aquí se generarían los datos reales desde la API
    return {
      resumen: {
        periodo: filtros.fechaInicio && filtros.fechaFin 
          ? `${filtros.fechaInicio} a ${filtros.fechaFin}` 
          : 'Último mes',
        registros: 156,
        generado: new Date().toLocaleString('es-ES')
      },
      metricas: reporte.metricas.map((metrica, idx) => ({
        nombre: metrica,
        valor: Math.floor(Math.random() * 1000),
        unidad: idx % 2 === 0 ? 'unidades' : '%',
        tendencia: Math.random() > 0.5 ? 'up' : 'down',
        cambio: (Math.random() * 20).toFixed(1)
      })),
      datos: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        animal: `CAB-${String(i + 1).padStart(3, '0')}`,
        valor1: (Math.random() * 100).toFixed(2),
        valor2: (Math.random() * 50).toFixed(2),
        estado: Math.random() > 0.7 ? 'Óptimo' : Math.random() > 0.4 ? 'Normal' : 'Revisar'
      }))
    };
  };

  const datosReporte = obtenerDatosReporte();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header del reporte */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconoCategoria className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{reporte.nombre}</h2>
                <p className="text-sm text-gray-600 mt-1">{categoria.nombre} - {reporte.descripcion}</p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => manejarExportar('pdf')}
              disabled={generando}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
            >
              {generando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </button>
            <button
              onClick={() => manejarExportar('excel')}
              disabled={generando}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </button>
            <button
              onClick={() => manejarExportar('print')}
              disabled={generando}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </button>

            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setVistaActual('visualizacion')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  vistaActual === 'visualizacion' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Visualización
              </button>
              <button
                onClick={() => setVistaActual('datos')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  vistaActual === 'datos' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Datos
              </button>
            </div>
          </div>
        </div>

        {/* Información del reporte */}
        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Período:</span>
              <span className="ml-2 text-gray-900">{datosReporte.resumen.periodo}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Registros:</span>
              <span className="ml-2 text-gray-900">{datosReporte.resumen.registros}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Generado:</span>
              <span className="ml-2 text-gray-900">{datosReporte.resumen.generado}</span>
            </div>
          </div>
        </div>

        {/* Contenido del reporte */}
        <div className="p-6">
          {vistaActual === 'visualizacion' && (
            <div className="space-y-6">
              {/* Métricas principales */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Indicadores Clave</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {datosReporte.metricas.map((metrica, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{metrica.nombre}</span>
                        {metrica.tendencia === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-3xl font-bold text-gray-800">
                        {metrica.valor} <span className="text-lg text-gray-600">{metrica.unidad}</span>
                      </p>
                      <p className={`text-sm mt-1 ${metrica.tendencia === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {metrica.tendencia === 'up' ? '↑' : '↓'} {metrica.cambio}% vs período anterior
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visualización según tipo */}
              {reporte.tipo === 'grafico' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Gráfico de Tendencias</h3>
                  <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Gráfico de {reporte.nombre}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          La visualización se generará con datos reales de la API
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reporte.tipo === 'estadistico' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Análisis Estadístico</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <PieChart className="w-12 h-12 text-blue-600 mb-3" />
                      <h4 className="font-semibold text-gray-800 mb-2">Distribución</h4>
                      <p className="text-sm text-gray-600">
                        Gráfico circular mostrando la distribución de datos
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <BarChart3 className="w-12 h-12 text-green-600 mb-3" />
                      <h4 className="font-semibold text-gray-800 mb-2">Comparativa</h4>
                      <p className="text-sm text-gray-600">
                        Gráfico de barras comparando períodos
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla resumen */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Datos Detallados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Animal</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor 1</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor 2</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosReporte.datos.map((fila) => (
                        <tr key={fila.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{fila.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{fila.animal}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{fila.valor1}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{fila.valor2}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              fila.estado === 'Óptimo' ? 'bg-green-100 text-green-700' :
                              fila.estado === 'Normal' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {fila.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recomendaciones */}
              {reporte.tipo === 'recomendacion' && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start">
                    <Target className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Recomendaciones</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Recomendación basada en análisis de datos históricos</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Sugerencia para optimización de recursos</span>
                        </li>
                        <li className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Alerta de atención requerida en ciertos indicadores</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {vistaActual === 'datos' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Vista de Datos Completa</h3>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-600 mb-4">
                  Esta vista mostraría todos los datos en formato tabla con opciones de ordenamiento y filtrado.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b-2 border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Animal</th>
                        <th className="px-3 py-2 text-left font-semibold">Métrica 1</th>
                        <th className="px-3 py-2 text-left font-semibold">Métrica 2</th>
                        <th className="px-3 py-2 text-left font-semibold">Métrica 3</th>
                        <th className="px-3 py-2 text-left font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {datosReporte.datos.map((fila) => (
                        <tr key={fila.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">{fila.id}</td>
                          <td className="px-3 py-2 font-medium">{fila.animal}</td>
                          <td className="px-3 py-2">{fila.valor1}</td>
                          <td className="px-3 py-2">{fila.valor2}</td>
                          <td className="px-3 py-2">{(parseFloat(fila.valor1) + parseFloat(fila.valor2)).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              fila.estado === 'Óptimo' ? 'bg-green-100 text-green-700' :
                              fila.estado === 'Normal' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {fila.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del reporte */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <Clock className="w-4 h-4 inline mr-1" />
              Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
            </div>
            <div>
              Sistema Caprino - Reportes v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloReportes;
