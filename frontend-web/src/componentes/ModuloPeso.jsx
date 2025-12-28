/**
 * Módulo Completo de Control de Peso
 * Gestión integral del seguimiento de peso del rebaño
 */

import React, { useState, useEffect } from 'react';
import { 
  Weight, 
  Plus,
  Calendar,
  Search,
  Eye,
  Edit,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  X,
  Activity,
  BarChart3,
  Scale,
  Baby,
  Milk,
  DollarSign,
  Stethoscope,
  Clock,
  Smile,
  Frown,
  Meh,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ruler,
  Zap
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';
import { pesajeAPI, animalesAPI } from '../servicios/caprino-api';

const ModuloPeso = () => {
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'registro', 'detalle'
  const [registroEditar, setRegistroEditar] = useState(null);
  const [registroDetalle, setRegistroDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    tipoPesaje: ''
  });

  // Cargar registros al montar
  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = async () => {
    setCargando(true);
    try {
      const datos = await pesajeAPI.getAll();
      setRegistros(datos['hydra:member'] || datos);
    } catch (error) {
      console.error('Error al cargar pesajes:', error);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Obtiene el color del badge según el tipo de pesaje
   */
  const obtenerColorTipo = (tipo) => {
    const colores = {
      nacimiento: 'bg-pink-100 text-pink-700',
      destete: 'bg-blue-100 text-blue-700',
      periodico: 'bg-green-100 text-green-700',
      venta: 'bg-purple-100 text-purple-700',
      enfermedad: 'bg-red-100 text-red-700'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Obtiene el color según la tendencia
   */
  const obtenerColorTendencia = (tendencia) => {
    if (tendencia > 0) return 'text-green-600';
    if (tendencia < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  /**
   * Formatea el tipo de pesaje
   */
  const formatearTipo = (tipo) => {
    const tipos = {
      nacimiento: 'Nacimiento',
      destete: 'Destete',
      periodico: 'Periódico',
      venta: 'Pre-venta',
      enfermedad: 'Control Enfermedad'
    };
    return tipos[tipo] || tipo;
  };

  if (vistaActual === 'detalle') {
    return (
      <DetalleRegistro 
        registro={registroDetalle}
        onCerrar={() => {
          setVistaActual('lista');
          setRegistroDetalle(null);
        }}
        onEditar={() => {
          setRegistroEditar(registroDetalle);
          setVistaActual('registro');
        }}
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <FormularioPeso 
        registroEditar={registroEditar}
        onGuardar={(data) => {
          console.log('Guardar:', data);
          setVistaActual('lista');
          setRegistroEditar(null);
        }}
        onCancelar={() => {
          setVistaActual('lista');
          setRegistroEditar(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <Weight className="w-8 h-8 mr-3 text-indigo-600" />
              Control de Peso
            </h2>
            <p className="text-gray-600 mt-1">
              Seguimiento del crecimiento y desarrollo del rebaño
            </p>
          </div>
          
          <button
            onClick={() => {
              setRegistroEditar(null);
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Pesaje
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código o nombre del animal..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              placeholder="Fecha inicio"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={filtros.tipoPesaje}
              onChange={(e) => setFiltros({ ...filtros, tipoPesaje: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los tipos</option>
              <option value="nacimiento">Nacimiento</option>
              <option value="destete">Destete</option>
              <option value="periodico">Periódico</option>
              <option value="venta">Pre-venta</option>
              <option value="enfermedad">Control Enfermedad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de registros de peso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {registros.map(registro => (
          <div key={registro.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            {/* Header del registro */}
            <div className="px-6 py-4 bg-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Weight className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {registro.animal.codigo} - {registro.animal.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(registro.fechaPesaje).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorTipo(registro.tipoPesaje)}`}>
                  {formatearTipo(registro.tipoPesaje)}
                </span>
              </div>
            </div>

            {/* Contenido del registro */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Peso actual */}
                <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Peso Actual</p>
                      <p className="text-3xl font-bold text-indigo-700">{registro.pesoActual} kg</p>
                    </div>
                    <Scale className="w-12 h-12 text-indigo-400" />
                  </div>
                </div>

                {/* Información de crecimiento */}
                {registro.pesoAnterior && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Peso Anterior</p>
                      <p className="text-xl font-bold text-gray-800">{registro.pesoAnterior} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Variación</p>
                      <div className="flex items-center">
                        {registro.variacionPeso > 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-600 mr-1" />
                        ) : registro.variacionPeso < 0 ? (
                          <TrendingDown className="w-5 h-5 text-red-600 mr-1" />
                        ) : (
                          <Minus className="w-5 h-5 text-gray-600 mr-1" />
                        )}
                        <p className={`text-xl font-bold ${obtenerColorTendencia(registro.variacionPeso)}`}>
                          {registro.variacionPeso > 0 ? '+' : ''}{registro.variacionPeso} kg
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Métricas adicionales */}
                {(registro.gananciaPromedioDiaria || registro.condicionCorporal) && (
                  <div className="grid grid-cols-2 gap-4">
                    {registro.gananciaPromedioDiaria && (
                      <div className="flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-600">GPD</p>
                          <p className="font-semibold text-gray-800">{registro.gananciaPromedioDiaria} kg/día</p>
                        </div>
                      </div>
                    )}
                    {registro.condicionCorporal && (
                      <div className="flex items-center text-sm">
                        <Activity className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-600">Condición</p>
                          <p className="font-semibold text-gray-800">{registro.condicionCorporal}/5</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Edad y medidas */}
                {(registro.edadDias || registro.circunferenciaPecho) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {registro.edadDias && (
                      <div>
                        <span className="text-gray-600">Edad:</span>
                        <span className="ml-2 font-semibold text-gray-800">{registro.edadDias} días</span>
                      </div>
                    )}
                    {registro.circunferenciaPecho && (
                      <div>
                        <span className="text-gray-600">Circ. Pecho:</span>
                        <span className="ml-2 font-semibold text-gray-800">{registro.circunferenciaPecho} cm</span>
                      </div>
                    )}
                  </div>
                )}

                {registro.observaciones && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                    <p className="text-sm text-gray-600">{registro.observaciones}</p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setRegistroEditar(registro);
                      setVistaActual('registro');
                    }}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setRegistroDetalle(registro);
                      setVistaActual('detalle');
                    }}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay datos */}
      {registros.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Weight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No hay registros de peso</p>
          <button
            onClick={() => {
              setRegistroEditar(null);
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primer Pesaje
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Formulario de Peso
 */
const FormularioPeso = ({ registroEditar, onGuardar, onCancelar }) => {
  // Opciones para selectores personalizados
  const opcionesTipoPesaje = [
    { 
      value: 'periodico', 
      label: 'Pesaje Periódico', 
      icono: <Clock />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    },
    { 
      value: 'nacimiento', 
      label: 'Nacimiento', 
      icono: <Baby />,
      colorFondo: 'bg-pink-100',
      colorIcono: 'text-pink-600'
    },
    { 
      value: 'destete', 
      label: 'Destete', 
      icono: <Milk />,
      colorFondo: 'bg-cyan-100',
      colorIcono: 'text-cyan-600'
    },
    { 
      value: 'venta', 
      label: 'Pre-venta', 
      icono: <DollarSign />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'enfermedad', 
      label: 'Control Enfermedad', 
      icono: <Stethoscope />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    }
  ];

  const opcionesEstadoNutricional = [
    { 
      value: 'desnutrido', 
      label: 'Desnutrido', 
      icono: <TrendingDown />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    },
    { 
      value: 'bajo_peso', 
      label: 'Bajo Peso', 
      icono: <Frown />,
      colorFondo: 'bg-orange-100',
      colorIcono: 'text-orange-600'
    },
    { 
      value: 'normal', 
      label: 'Normal', 
      icono: <CheckCircle />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'sobrepeso', 
      label: 'Sobrepeso', 
      icono: <AlertCircle />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    },
    { 
      value: 'obeso', 
      label: 'Obeso', 
      icono: <AlertTriangle />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    }
  ];

  const opcionesEstadoSalud = [
    { 
      value: 'sano', 
      label: 'Sano', 
      icono: <Smile />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'en_observacion', 
      label: 'En Observación', 
      icono: <Eye />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    },
    { 
      value: 'enfermo', 
      label: 'Enfermo', 
      icono: <XCircle />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    },
    { 
      value: 'en_recuperacion', 
      label: 'En Recuperación', 
      icono: <TrendingUp />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    }
  ];

  const opcionesMetodoPesaje = [
    { 
      value: 'bascula', 
      label: 'Báscula Electrónica', 
      icono: <Scale />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    },
    { 
      value: 'romana', 
      label: 'Romana Mecánica', 
      icono: <Weight />,
      colorFondo: 'bg-gray-100',
      colorIcono: 'text-gray-600'
    },
    { 
      value: 'cinta', 
      label: 'Cinta Métrica (estimado)', 
      icono: <Ruler />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    },
    { 
      value: 'dinamometro', 
      label: 'Dinamómetro', 
      icono: <Zap />,
      colorFondo: 'bg-purple-100',
      colorIcono: 'text-purple-600'
    }
  ];

  const opcionesMomentoAlimentacion = [
    { 
      value: 'antes', 
      label: 'Antes de alimentar', 
      icono: <Clock />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    },
    { 
      value: 'despues', 
      label: 'Después de alimentar', 
      icono: <CheckCircle />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'intermedio', 
      label: 'Intermedio', 
      icono: <Meh />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    }
  ];

  const [formData, setFormData] = useState({
    // Datos básicos
    animalId: registroEditar?.animal?.codigo || '',
    fechaPesaje: registroEditar?.fechaPesaje || new Date().toISOString().split('T')[0],
    horaPesaje: registroEditar?.horaPesaje || '',
    tipoPesaje: registroEditar?.tipoPesaje || 'periodico',
    
    // Peso
    pesoActual: registroEditar?.pesoActual || '',
    pesoAnterior: registroEditar?.pesoAnterior || '',
    
    // Medidas corporales
    circunferenciaPecho: registroEditar?.circunferenciaPecho || '',
    alturaCruz: registroEditar?.alturaCruz || '',
    longitudCuerpo: registroEditar?.longitudCuerpo || '',
    circunferenciaAbdomen: registroEditar?.circunferenciaAbdomen || '',
    
    // Condición y estado
    condicionCorporal: registroEditar?.condicionCorporal || '',
    estadoNutricional: registroEditar?.estadoNutricional || 'normal',
    estadoSalud: registroEditar?.estadoSalud || 'sano',
    
    // Contexto
    ayunas: registroEditar?.ayunas || false,
    momentoAlimentacion: registroEditar?.momentoAlimentacion || 'antes',
    metodoPesaje: registroEditar?.metodoPesaje || 'bascula',
    
    // Edad
    edadDias: registroEditar?.edadDias || '',
    edadMeses: registroEditar?.edadMeses || '',
    
    // Análisis
    pesoEsperado: registroEditar?.pesoEsperado || '',
    desviacionEstandar: registroEditar?.desviacionEstandar || '',
    
    // Personal
    responsablePesaje: registroEditar?.responsablePesaje || '',
    
    // Notas
    observaciones: registroEditar?.observaciones || ''
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [variacionCalculada, setVariacionCalculada] = useState(0);
  const [gpdCalculada, setGpdCalculada] = useState(0);

  // Calcular variación de peso automáticamente
  React.useEffect(() => {
    if (formData.pesoActual && formData.pesoAnterior) {
      const variacion = (parseFloat(formData.pesoActual) - parseFloat(formData.pesoAnterior)).toFixed(2);
      setVariacionCalculada(parseFloat(variacion));
    }
  }, [formData.pesoActual, formData.pesoAnterior]);

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: null }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.animalId) nuevosErrores.animalId = 'Debe seleccionar un animal';
    if (!formData.fechaPesaje) nuevosErrores.fechaPesaje = 'La fecha es requerida';
    if (!formData.pesoActual || parseFloat(formData.pesoActual) <= 0) {
      nuevosErrores.pesoActual = 'Ingrese un peso válido';
    }

    // Validar condición corporal si está presente
    if (formData.condicionCorporal && (parseFloat(formData.condicionCorporal) < 1 || parseFloat(formData.condicionCorporal) > 5)) {
      nuevosErrores.condicionCorporal = 'La condición corporal debe estar entre 1 y 5';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onGuardar(formData);
    setGuardando(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {registroEditar ? 'Editar Registro de Peso' : 'Registrar Pesaje'}
          </h2>
          <button onClick={onCancelar} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="animalId"
                  value={formData.animalId}
                  onChange={manejarCambio}
                  placeholder="Código del animal (ej: CAB-001)"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errores.animalId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errores.animalId && (
                  <p className="text-red-500 text-xs mt-1">{errores.animalId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pesaje <span className="text-red-500">*</span>
                </label>
                <SelectPersonalizado
                  valor={formData.tipoPesaje}
                  onChange={(valor) => manejarCambio({ target: { name: 'tipoPesaje', value: valor } })}
                  opciones={opcionesTipoPesaje}
                  placeholder="Seleccionar tipo..."
                  requerido
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pesaje <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fechaPesaje"
                  value={formData.fechaPesaje}
                  onChange={manejarCambio}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Pesaje
                </label>
                <input
                  type="time"
                  name="horaPesaje"
                  value={formData.horaPesaje}
                  onChange={manejarCambio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Peso */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Weight className="w-5 h-5 mr-2 text-indigo-600" />
              Peso del Animal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Actual (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pesoActual"
                  value={formData.pesoActual}
                  onChange={manejarCambio}
                  placeholder="25.5"
                  step="0.1"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errores.pesoActual ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errores.pesoActual && (
                  <p className="text-red-500 text-xs mt-1">{errores.pesoActual}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Anterior (kg)
                </label>
                <input
                  type="number"
                  name="pesoAnterior"
                  value={formData.pesoAnterior}
                  onChange={manejarCambio}
                  placeholder="23.0"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {variacionCalculada !== 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variación
                  </label>
                  <div className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center ${obtenerColorTendencia(variacionCalculada)}`}>
                    {variacionCalculada > 0 ? (
                      <TrendingUp className="w-5 h-5 mr-2" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-bold">
                      {variacionCalculada > 0 ? '+' : ''}{variacionCalculada} kg
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medidas Corporales */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Medidas Corporales (Morfometría)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circunferencia de Pecho (cm)
                </label>
                <input
                  type="number"
                  name="circunferenciaPecho"
                  value={formData.circunferenciaPecho}
                  onChange={manejarCambio}
                  placeholder="75"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Medida detrás de las patas delanteras</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altura a la Cruz (cm)
                </label>
                <input
                  type="number"
                  name="alturaCruz"
                  value={formData.alturaCruz}
                  onChange={manejarCambio}
                  placeholder="65"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Punto más alto del hombro</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud del Cuerpo (cm)
                </label>
                <input
                  type="number"
                  name="longitudCuerpo"
                  value={formData.longitudCuerpo}
                  onChange={manejarCambio}
                  placeholder="70"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Desde hombro hasta nalga</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circunferencia de Abdomen (cm)
                </label>
                <input
                  type="number"
                  name="circunferenciaAbdomen"
                  value={formData.circunferenciaAbdomen}
                  onChange={manejarCambio}
                  placeholder="80"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Parte más ancha del abdomen</p>
              </div>
            </div>
          </div>

          {/* Condición y Estado */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Condición y Estado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condición Corporal (1-5)
                </label>
                <input
                  type="number"
                  name="condicionCorporal"
                  value={formData.condicionCorporal}
                  onChange={manejarCambio}
                  placeholder="3"
                  step="0.5"
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">1=Muy delgado, 5=Obeso</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado Nutricional
                </label>
                <SelectPersonalizado
                  valor={formData.estadoNutricional}
                  onChange={(valor) => manejarCambio({ target: { name: 'estadoNutricional', value: valor } })}
                  opciones={opcionesEstadoNutricional}
                  placeholder="Seleccionar estado nutricional..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de Salud
                </label>
                <SelectPersonalizado
                  valor={formData.estadoSalud}
                  onChange={(valor) => manejarCambio({ target: { name: 'estadoSalud', value: valor } })}
                  opciones={opcionesEstadoSalud}
                  placeholder="Seleccionar estado de salud..."
                />
              </div>
            </div>
          </div>

          {/* Contexto del Pesaje */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Contexto del Pesaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pesaje
                </label>
                <SelectPersonalizado
                  valor={formData.metodoPesaje}
                  onChange={(valor) => manejarCambio({ target: { name: 'metodoPesaje', value: valor } })}
                  opciones={opcionesMetodoPesaje}
                  placeholder="Seleccionar método..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Momento Alimentación
                </label>
                <SelectPersonalizado
                  valor={formData.momentoAlimentacion}
                  onChange={(valor) => manejarCambio({ target: { name: 'momentoAlimentacion', value: valor } })}
                  opciones={opcionesMomentoAlimentacion}
                  placeholder="Seleccionar momento..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ayunas"
                  checked={formData.ayunas}
                  onChange={manejarCambio}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Animal en ayunas
                </label>
              </div>
            </div>
          </div>

          {/* Edad */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Edad del Animal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad en Días
                </label>
                <input
                  type="number"
                  name="edadDias"
                  value={formData.edadDias}
                  onChange={manejarCambio}
                  placeholder="90"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad en Meses
                </label>
                <input
                  type="number"
                  name="edadMeses"
                  value={formData.edadMeses}
                  onChange={manejarCambio}
                  placeholder="3"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Análisis Comparativo */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
              Análisis Comparativo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Esperado (kg)
                </label>
                <input
                  type="number"
                  name="pesoEsperado"
                  value={formData.pesoEsperado}
                  onChange={manejarCambio}
                  placeholder="26.0"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Según raza y edad</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desviación Estándar
                </label>
                <input
                  type="number"
                  name="desviacionEstandar"
                  value={formData.desviacionEstandar}
                  onChange={manejarCambio}
                  placeholder="±2.5"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comparado con el promedio del rebaño</p>
              </div>
            </div>
          </div>

          {/* Personal Responsable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsable del Pesaje
            </label>
            <input
              type="text"
              name="responsablePesaje"
              value={formData.responsablePesaje}
              onChange={manejarCambio}
              placeholder="Nombre del encargado"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={manejarCambio}
              rows="4"
              placeholder="Notas adicionales sobre el pesaje, comportamiento del animal, condiciones especiales..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Registro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Componente de Vista Detallada de Registro
 */
const DetalleRegistro = ({ registro, onCerrar, onEditar }) => {
  if (!registro) return null;

  const obtenerColorTendencia = (tendencia) => {
    if (tendencia > 0) return 'text-green-600';
    if (tendencia < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 bg-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Weight className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold">
                  Registro de Peso
                </h2>
                <p className="text-white/90 text-sm">
                  ID: #{registro.id}
                </p>
              </div>
            </div>
            <button 
              onClick={onCerrar}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Información del Animal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Información del Animal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Código</p>
                <p className="text-base font-semibold text-gray-800">{registro.animal.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-base font-semibold text-gray-800">{registro.animal.nombre}</p>
              </div>
            </div>
          </div>

          {/* Peso */}
          <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Weight className="w-5 h-5 mr-2 text-indigo-600" />
              Peso
            </h3>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-indigo-700">{registro.pesoActual} kg</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(registro.fechaPesaje).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {registro.pesoAnterior && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Peso Anterior</p>
                  <p className="text-2xl font-bold text-gray-800">{registro.pesoAnterior} kg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Variación</p>
                  <div className="flex items-center justify-center">
                    {registro.variacionPeso > 0 ? (
                      <TrendingUp className="w-6 h-6 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 mr-1 text-red-600" />
                    )}
                    <p className={`text-2xl font-bold ${obtenerColorTendencia(registro.variacionPeso)}`}>
                      {registro.variacionPeso > 0 ? '+' : ''}{registro.variacionPeso} kg
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información Completa */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información Completa</h3>
            <div className="space-y-3">
              {Object.entries(registro).map(([key, value]) => {
                if (key === 'id' || key === 'animal' || key === 'observaciones' || key === 'fechaPesaje' || 
                    key === 'pesoActual' || key === 'pesoAnterior' || key === 'variacionPeso') return null;
                if (value === null || value === undefined || value === '') return null;
                
                return (
                  <div key={key} className="flex items-start border-b border-gray-200 pb-2">
                    <p className="text-sm font-medium text-gray-700 w-1/3 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </p>
                    <p className="text-sm text-gray-600 w-2/3">
                      {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          {registro.observaciones && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-gray-600" />
                Observaciones
              </h3>
              <p className="text-gray-700 leading-relaxed">{registro.observaciones}</p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={onEditar}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center"
            >
              <Edit className="w-5 h-5 mr-2" />
              Editar Registro
            </button>
            <button
              onClick={onCerrar}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloPeso;
