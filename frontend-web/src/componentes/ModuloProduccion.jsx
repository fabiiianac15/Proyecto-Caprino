/**
 * Módulo Completo de Producción de Leche
 * Gestión integral de la producción lechera del rebaño
 */

import React, { useState } from 'react';
import { 
  Droplet, 
  Plus,
  Calendar,
  Search,
  Eye,
  Edit,
  AlertCircle,
  TrendingUp,
  Clock,
  User,
  X,
  Activity,
  BarChart3,
  Thermometer
} from 'lucide-react';

const ModuloProduccion = () => {
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'registro', 'detalle'
  const [registroEditar, setRegistroEditar] = useState(null);
  const [registroDetalle, setRegistroDetalle] = useState(null);

  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    calidadLeche: ''
  });

  /**
   * Obtiene el color del badge según la calidad
   */
  const obtenerColorCalidad = (calidad) => {
    const colores = {
      excelente: 'bg-green-100 text-green-700',
      buena: 'bg-blue-100 text-blue-700',
      regular: 'bg-yellow-100 text-yellow-700',
      mala: 'bg-red-100 text-red-700'
    };
    return colores[calidad] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Formatea la calidad
   */
  const formatearCalidad = (calidad) => {
    return calidad.charAt(0).toUpperCase() + calidad.slice(1);
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
      <FormularioProduccion 
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
              <Droplet className="w-8 h-8 mr-3 text-cyan-600" />
              Producción de Leche
            </h2>
            <p className="text-gray-600 mt-1">
              Control diario de la producción lechera del rebaño
            </p>
          </div>
          
          <button
            onClick={() => {
              setRegistroEditar(null);
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Producción
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código o nombre de hembra..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              placeholder="Fecha inicio"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <select
              value={filtros.calidadLeche}
              onChange={(e) => setFiltros({ ...filtros, calidadLeche: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todas las calidades</option>
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de registros de producción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {registros.map(registro => (
          <div key={registro.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            {/* Header del registro */}
            <div className="px-6 py-4 bg-cyan-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Droplet className="w-6 h-6 text-cyan-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {registro.hembra.codigo} - {registro.hembra.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Ordeño #{registro.numeroOrdenio} - {new Date(registro.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorCalidad(registro.calidadLeche)}`}>
                  {formatearCalidad(registro.calidadLeche)}
                </span>
              </div>
            </div>

            {/* Contenido del registro */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Cantidad producida */}
                <div className="bg-cyan-50 rounded-lg p-4 border-2 border-cyan-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Producción</p>
                      <p className="text-3xl font-bold text-cyan-700">{registro.cantidadLitros} L</p>
                    </div>
                    <Droplet className="w-12 h-12 text-cyan-400" />
                  </div>
                </div>

                {/* Información de calidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Activity className="w-4 h-4 mr-1" />
                      % Grasa
                    </div>
                    <p className="text-xl font-bold text-gray-800">{registro.porcentajeGrasa}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Activity className="w-4 h-4 mr-1" />
                      % Proteína
                    </div>
                    <p className="text-xl font-bold text-gray-800">{registro.porcentajeProteina}%</p>
                  </div>
                </div>

                {/* Datos adicionales si existen */}
                {(registro.temperatura || registro.ph) && (
                  <div className="grid grid-cols-2 gap-4">
                    {registro.temperatura && (
                      <div className="flex items-center text-sm">
                        <Thermometer className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-700">Temp:</span>
                        <span className="ml-2 text-gray-600">{registro.temperatura}°C</span>
                      </div>
                    )}
                    {registro.ph && (
                      <div className="flex items-center text-sm">
                        <BarChart3 className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-700">pH:</span>
                        <span className="ml-2 text-gray-600">{registro.ph}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Horario y duración */}
                {(registro.horaOrdenio || registro.duracionOrdenio) && (
                  <div className="grid grid-cols-2 gap-4">
                    {registro.horaOrdenio && (
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-700">Hora:</span>
                        <span className="ml-2 text-gray-600">{registro.horaOrdenio}</span>
                      </div>
                    )}
                    {registro.duracionOrdenio && (
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-700">Duración:</span>
                        <span className="ml-2 text-gray-600">{registro.duracionOrdenio} min</span>
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
          <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No hay registros de producción</p>
          <button
            onClick={() => {
              setRegistroEditar(null);
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primera Producción
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Formulario de Producción
 */
const FormularioProduccion = ({ registroEditar, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    // Datos básicos
    hembraId: registroEditar?.hembra?.codigo || '',
    fecha: registroEditar?.fecha || new Date().toISOString().split('T')[0],
    numeroOrdenio: registroEditar?.numeroOrdenio || 1,
    horaOrdenio: registroEditar?.horaOrdenio || '',
    duracionOrdenio: registroEditar?.duracionOrdenio || '',
    
    // Producción
    cantidadLitros: registroEditar?.cantidadLitros || '',
    
    // Calidad
    calidadLeche: registroEditar?.calidadLeche || 'buena',
    porcentajeGrasa: registroEditar?.porcentajeGrasa || '',
    porcentajeProteina: registroEditar?.porcentajeProteina || '',
    porcentajeLactosa: registroEditar?.porcentajeLactosa || '',
    
    // Parámetros físico-químicos
    temperatura: registroEditar?.temperatura || '',
    ph: registroEditar?.ph || '',
    densidad: registroEditar?.densidad || '',
    
    // Control sanitario
    recuentoCelulas: registroEditar?.recuentoCelulas || '',
    presenciaAntibioticos: registroEditar?.presenciaAntibioticos || false,
    
    // Condiciones
    estadoAnimal: registroEditar?.estadoAnimal || 'normal',
    condicionesOrdenio: registroEditar?.condicionesOrdenio || 'optimas',
    
    // Notas
    observaciones: registroEditar?.observaciones || ''
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

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

    if (!formData.hembraId) nuevosErrores.hembraId = 'Debe seleccionar una hembra';
    if (!formData.fecha) nuevosErrores.fecha = 'La fecha es requerida';
    if (!formData.cantidadLitros || parseFloat(formData.cantidadLitros) <= 0) {
      nuevosErrores.cantidadLitros = 'Ingrese una cantidad válida';
    }

    // Validar porcentajes si están presentes
    if (formData.porcentajeGrasa && (parseFloat(formData.porcentajeGrasa) < 0 || parseFloat(formData.porcentajeGrasa) > 100)) {
      nuevosErrores.porcentajeGrasa = 'El porcentaje debe estar entre 0 y 100';
    }
    if (formData.porcentajeProteina && (parseFloat(formData.porcentajeProteina) < 0 || parseFloat(formData.porcentajeProteina) > 100)) {
      nuevosErrores.porcentajeProteina = 'El porcentaje debe estar entre 0 y 100';
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
            {registroEditar ? 'Editar Registro de Producción' : 'Registrar Producción de Leche'}
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
                  Hembra Productora <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hembraId"
                  value={formData.hembraId}
                  onChange={manejarCambio}
                  placeholder="Código de la hembra (ej: CAB-001)"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    errores.hembraId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errores.hembraId && (
                  <p className="text-red-500 text-xs mt-1">{errores.hembraId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Ordeño <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={manejarCambio}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Ordeño <span className="text-red-500">*</span>
                </label>
                <select
                  name="numeroOrdenio"
                  value={formData.numeroOrdenio}
                  onChange={manejarCambio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="1">Primer ordeño (mañana)</option>
                  <option value="2">Segundo ordeño (tarde)</option>
                  <option value="3">Tercer ordeño (noche)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Ordeño
                </label>
                <input
                  type="time"
                  name="horaOrdenio"
                  value={formData.horaOrdenio}
                  onChange={manejarCambio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración del Ordeño (minutos)
                </label>
                <input
                  type="number"
                  name="duracionOrdenio"
                  value={formData.duracionOrdenio}
                  onChange={manejarCambio}
                  placeholder="15"
                  min="1"
                  max="120"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Producción */}
          <div className="bg-cyan-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-cyan-600" />
              Cantidad Producida
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de Leche (litros) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cantidadLitros"
                value={formData.cantidadLitros}
                onChange={manejarCambio}
                placeholder="2.5"
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errores.cantidadLitros ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errores.cantidadLitros && (
                <p className="text-red-500 text-xs mt-1">{errores.cantidadLitros}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Ingrese la cantidad en litros con hasta 2 decimales
              </p>
            </div>
          </div>

          {/* Composición y Calidad */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Composición y Calidad
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calidad de la Leche <span className="text-red-500">*</span>
                </label>
                <select
                  name="calidadLeche"
                  value={formData.calidadLeche}
                  onChange={manejarCambio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="excelente">Excelente</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de Grasa (%)
                  </label>
                  <input
                    type="number"
                    name="porcentajeGrasa"
                    value={formData.porcentajeGrasa}
                    onChange={manejarCambio}
                    placeholder="3.5"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rango normal: 3.0-5.0%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de Proteína (%)
                  </label>
                  <input
                    type="number"
                    name="porcentajeProteina"
                    value={formData.porcentajeProteina}
                    onChange={manejarCambio}
                    placeholder="3.2"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rango normal: 2.8-3.8%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de Lactosa (%)
                  </label>
                  <input
                    type="number"
                    name="porcentajeLactosa"
                    value={formData.porcentajeLactosa}
                    onChange={manejarCambio}
                    placeholder="4.5"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rango normal: 4.2-4.8%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Parámetros Físico-Químicos */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Parámetros Físico-Químicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  name="temperatura"
                  value={formData.temperatura}
                  onChange={manejarCambio}
                  placeholder="4"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">Óptimo: 2-6°C</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH
                </label>
                <input
                  type="number"
                  name="ph"
                  value={formData.ph}
                  onChange={manejarCambio}
                  placeholder="6.7"
                  step="0.1"
                  min="0"
                  max="14"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">Rango normal: 6.5-6.8</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Densidad (g/ml)
                </label>
                <input
                  type="number"
                  name="densidad"
                  value={formData.densidad}
                  onChange={manejarCambio}
                  placeholder="1.030"
                  step="0.001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">Rango: 1.028-1.034</p>
              </div>
            </div>
          </div>

          {/* Control Sanitario */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Control Sanitario
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recuento de Células Somáticas (células/ml)
                </label>
                <input
                  type="number"
                  name="recuentoCelulas"
                  value={formData.recuentoCelulas}
                  onChange={manejarCambio}
                  placeholder="200000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Óptimo: {'<'} 400,000 células/ml
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="presenciaAntibioticos"
                  checked={formData.presenciaAntibioticos}
                  onChange={manejarCambio}
                  className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Presencia de antibióticos detectada
                </label>
              </div>

              {formData.presenciaAntibioticos && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">
                      <strong>Advertencia:</strong> Esta leche no debe ser comercializada. Descartar según protocolo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Condiciones */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Condiciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Animal
                </label>
                <select
                  name="estadoAnimal"
                  value={formData.estadoAnimal}
                  onChange={manejarCambio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="normal">Normal</option>
                  <option value="estresado">Estresado</option>
                  <option value="enfermo">Enfermo</option>
                  <option value="en_recuperacion">En recuperación</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones de Ordeño
                </label>
                <select
                  name="condicionesOrdenio"
                  value={formData.condicionesOrdenio}
                  onChange={manejarCambio}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="optimas">Óptimas</option>
                  <option value="buenas">Buenas</option>
                  <option value="regulares">Regulares</option>
                  <option value="deficientes">Deficientes</option>
                </select>
              </div>
            </div>
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
              placeholder="Notas adicionales sobre la producción, comportamiento del animal, condiciones especiales..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
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
              className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 bg-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Droplet className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold">
                  Registro de Producción de Leche
                </h2>
                <p className="text-white/90 text-sm">
                  ID: #{registro.id} | Ordeño #{registro.numeroOrdenio}
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
                <p className="text-base font-semibold text-gray-800">{registro.hembra.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-base font-semibold text-gray-800">{registro.hembra.nombre}</p>
              </div>
            </div>
          </div>

          {/* Producción */}
          <div className="bg-cyan-50 rounded-lg p-4 border-2 border-cyan-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-cyan-600" />
              Producción
            </h3>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-cyan-700">{registro.cantidadLitros} L</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(registro.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {registro.horaOrdenio && (
                <div className="text-center">
                  <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Hora</p>
                  <p className="font-semibold">{registro.horaOrdenio}</p>
                </div>
              )}
              {registro.duracionOrdenio && (
                <div className="text-center">
                  <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Duración</p>
                  <p className="font-semibold">{registro.duracionOrdenio} min</p>
                </div>
              )}
              <div className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  registro.calidadLeche === 'excelente' ? 'bg-green-100 text-green-700' :
                  registro.calidadLeche === 'buena' ? 'bg-blue-100 text-blue-700' :
                  registro.calidadLeche === 'regular' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {registro.calidadLeche.charAt(0).toUpperCase() + registro.calidadLeche.slice(1)}
                </span>
                <p className="text-sm text-gray-600 mt-1">Calidad</p>
              </div>
            </div>
          </div>

          {/* Composición */}
          {(registro.porcentajeGrasa || registro.porcentajeProteina || registro.porcentajeLactosa) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Composición</h3>
              <div className="grid grid-cols-3 gap-4">
                {registro.porcentajeGrasa && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-700">{registro.porcentajeGrasa}%</p>
                    <p className="text-sm text-gray-600">Grasa</p>
                  </div>
                )}
                {registro.porcentajeProteina && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-700">{registro.porcentajeProteina}%</p>
                    <p className="text-sm text-gray-600">Proteína</p>
                  </div>
                )}
                {registro.porcentajeLactosa && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-700">{registro.porcentajeLactosa}%</p>
                    <p className="text-sm text-gray-600">Lactosa</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Todos los demás datos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información Completa</h3>
            <div className="space-y-3">
              {Object.entries(registro).map(([key, value]) => {
                if (key === 'id' || key === 'hembra' || key === 'observaciones' || key === 'fecha' || 
                    key === 'cantidadLitros' || key === 'calidadLeche' || key === 'porcentajeGrasa' || 
                    key === 'porcentajeProteina' || key === 'porcentajeLactosa' || key === 'horaOrdenio' || 
                    key === 'duracionOrdenio' || key === 'numeroOrdenio') return null;
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
              className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium flex items-center justify-center"
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

export default ModuloProduccion;
