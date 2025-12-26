/**
 * Módulo Completo de Salud y Vacunas
 * Gestión integral de la salud del rebaño: vacunaciones, enfermedades, tratamientos
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Plus,
  Calendar,
  Search,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  Syringe,
  Stethoscope,
  Pill,
  User,
  X,
  FileText,
  TrendingUp,
  AlertTriangle,
  Zap,
  Droplet,
  Wind,
  Smile
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';

const ModuloSalud = () => {
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'registro', 'detalle'
  const [tipoRegistro, setTipoRegistro] = useState('vacuna'); // 'vacuna', 'enfermedad', 'tratamiento'
  const [eventoEditar, setEventoEditar] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);

  const [eventos, setEventos] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: '',
    estado: ''
  });

  /**
   * Obtiene el color del badge según el tipo de evento
   */
  const obtenerColorTipo = (tipo) => {
    const colores = {
      vacuna: 'bg-blue-100 text-blue-700',
      enfermedad: 'bg-red-100 text-red-700',
      tratamiento: 'bg-green-100 text-green-700'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Obtiene el color del badge según el estado
   */
  const obtenerColorEstado = (estado) => {
    const colores = {
      programada: 'bg-yellow-100 text-yellow-700',
      aplicada: 'bg-green-100 text-green-700',
      en_tratamiento: 'bg-blue-100 text-blue-700',
      recuperado: 'bg-green-100 text-green-700',
      activo: 'bg-red-100 text-red-700',
      completado: 'bg-gray-100 text-gray-700'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Formatea el nombre del estado
   */
  const formatearEstado = (estado) => {
    const estados = {
      programada: 'Programada',
      aplicada: 'Aplicada',
      en_tratamiento: 'En Tratamiento',
      recuperado: 'Recuperado',
      activo: 'Activo',
      completado: 'Completado'
    };
    return estados[estado] || estado;
  };

  /**
   * Calcula días hasta una fecha
   */
  const calcularDiasHasta = (fecha) => {
    const hoy = new Date();
    const fechaObj = new Date(fecha);
    const diffTime = fechaObj - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (vistaActual === 'detalle') {
    return (
      <DetalleEvento 
        evento={eventoDetalle}
        onCerrar={() => {
          setVistaActual('lista');
          setEventoDetalle(null);
        }}
        onEditar={() => {
          setEventoEditar(eventoDetalle);
          setTipoRegistro(eventoDetalle.tipo);
          setVistaActual('registro');
        }}
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <FormularioSalud 
        tipo={tipoRegistro}
        eventoEditar={eventoEditar}
        onGuardar={(data) => {
          console.log('Guardar:', data);
          setVistaActual('lista');
          setEventoEditar(null);
        }}
        onCancelar={() => {
          setVistaActual('lista');
          setEventoEditar(null);
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
              <Activity className="w-8 h-8 mr-3 text-blue-600" />
              Salud y Vacunas
            </h2>
            <p className="text-gray-600 mt-1">
              Gestión integral de la salud del rebaño
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setTipoRegistro('vacuna');
                setVistaActual('registro');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Vacuna
            </button>
            <button
              onClick={() => {
                setTipoRegistro('enfermedad');
                setVistaActual('registro');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Enfermedad
            </button>
            <button
              onClick={() => {
                setTipoRegistro('tratamiento');
                setVistaActual('registro');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Tratamiento
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código o nombre de animal..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los eventos</option>
              <option value="vacuna">Vacunaciones</option>
              <option value="enfermedad">Enfermedades</option>
              <option value="tratamiento">Tratamientos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de eventos de salud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {eventos.map(evento => (
          <div key={evento.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            {/* Header del evento */}
            <div className={`px-6 py-4 border-b ${
              evento.tipo === 'vacuna' ? 'bg-blue-50' :
              evento.tipo === 'enfermedad' ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {evento.tipo === 'vacuna' && <Syringe className="w-6 h-6 text-blue-600" />}
                  {evento.tipo === 'enfermedad' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                  {evento.tipo === 'tratamiento' && <Pill className="w-6 h-6 text-green-600" />}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 capitalize">{evento.tipo}</h3>
                    <p className="text-sm text-gray-600">
                      Animal: {evento.animal.codigo} - {evento.animal.nombre}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorTipo(evento.tipo)}`}>
                  {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
                </span>
              </div>
            </div>

            {/* Contenido del evento */}
            <div className="p-6">
              {evento.tipo === 'vacuna' && (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Fecha aplicación:</span>
                    <span className="ml-2 text-gray-600">{new Date(evento.fechaAplicacion).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Syringe className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Vacuna:</span>
                    <span className="ml-2 text-gray-600">{evento.nombreVacuna}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700">Lote:</span>
                    <span className="ml-2 text-gray-600">{evento.lote}</span>
                  </div>
                  {evento.proximaDosis && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center text-sm text-yellow-700">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="font-medium">Próxima dosis:</span>
                        <span className="ml-2">{new Date(evento.proximaDosis).toLocaleDateString('es-ES')}</span>
                      </div>
                      <p className="text-xs text-yellow-600 mt-1">
                        Faltan {calcularDiasHasta(evento.proximaDosis)} días
                      </p>
                    </div>
                  )}
                  {evento.estado && (
                    <div className="mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(evento.estado)}`}>
                        {formatearEstado(evento.estado)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {evento.tipo === 'enfermedad' && (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Fecha detección:</span>
                    <span className="ml-2 text-gray-600">{new Date(evento.fechaDeteccion).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AlertTriangle className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Enfermedad:</span>
                    <span className="ml-2 text-gray-600">{evento.nombreEnfermedad}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700">Gravedad:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                      evento.gravedad === 'leve' ? 'bg-yellow-100 text-yellow-700' :
                      evento.gravedad === 'moderada' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {evento.gravedad.charAt(0).toUpperCase() + evento.gravedad.slice(1)}
                    </span>
                  </div>
                  {evento.estado && (
                    <div className="mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(evento.estado)}`}>
                        {formatearEstado(evento.estado)}
                      </span>
                    </div>
                  )}
                  {evento.diagnostico && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Diagnóstico:</span> {evento.diagnostico}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {evento.tipo === 'tratamiento' && (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Fecha inicio:</span>
                    <span className="ml-2 text-gray-600">{new Date(evento.fechaInicio).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Pill className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Medicamento:</span>
                    <span className="ml-2 text-gray-600">{evento.medicamento}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700">Dosis:</span>
                    <span className="ml-2 text-gray-600">{evento.dosis}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700">Frecuencia:</span>
                    <span className="ml-2 text-gray-600">{evento.frecuencia}</span>
                  </div>
                  {evento.fechaFin && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center text-sm text-blue-700">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="font-medium">Fin tratamiento:</span>
                        <span className="ml-2">{new Date(evento.fechaFin).toLocaleDateString('es-ES')}</span>
                      </div>
                      {calcularDiasHasta(evento.fechaFin) > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Faltan {calcularDiasHasta(evento.fechaFin)} días
                        </p>
                      )}
                    </div>
                  )}
                  {evento.estado && (
                    <div className="mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(evento.estado)}`}>
                        {formatearEstado(evento.estado)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {evento.observaciones && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                  <p className="text-sm text-gray-600">{evento.observaciones}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setEventoEditar(evento);
                    setTipoRegistro(evento.tipo);
                    setVistaActual('registro');
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setEventoDetalle(evento);
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
        ))}
      </div>

      {/* Mensaje cuando no hay datos */}
      {eventos.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No hay eventos de salud registrados</p>
          <button
            onClick={() => {
              setTipoRegistro('vacuna');
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primer Evento
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Formulario de Salud
 */
const FormularioSalud = ({ tipo, eventoEditar, onGuardar, onCancelar }) => {
  // Opciones para selectores personalizados
  const opcionesViaAdministracion = [
    { 
      value: 'subcutanea', 
      label: 'Subcutánea', 
      icono: <Zap />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    },
    { 
      value: 'intramuscular', 
      label: 'Intramuscular', 
      icono: <Activity />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    },
    { 
      value: 'intranasal', 
      label: 'Intranasal', 
      icono: <Wind />,
      colorFondo: 'bg-cyan-100',
      colorIcono: 'text-cyan-600'
    },
    { 
      value: 'oral', 
      label: 'Oral', 
      icono: <Smile />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    }
  ];

  const opcionesGravedad = [
    { 
      value: 'leve', 
      label: 'Leve', 
      icono: <CheckCircle />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'moderada', 
      label: 'Moderada', 
      icono: <AlertCircle />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    },
    { 
      value: 'grave', 
      label: 'Grave', 
      icono: <AlertTriangle />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    }
  ];

  const [formData, setFormData] = useState({
    // Común
    animalId: eventoEditar?.animal?.codigo || '',
    observaciones: eventoEditar?.observaciones || '',
    
    // Vacuna
    nombreVacuna: eventoEditar?.nombreVacuna || '',
    fechaAplicacion: eventoEditar?.fechaAplicacion || new Date().toISOString().split('T')[0],
    lote: eventoEditar?.lote || '',
    laboratorio: eventoEditar?.laboratorio || '',
    viaAdministracion: eventoEditar?.viaAdministracion || 'subcutanea',
    dosis: eventoEditar?.dosis || '',
    veterinarioResponsable: eventoEditar?.veterinarioResponsable || '',
    proximaDosis: eventoEditar?.proximaDosis || '',
    
    // Enfermedad
    nombreEnfermedad: eventoEditar?.nombreEnfermedad || '',
    fechaDeteccion: eventoEditar?.fechaDeteccion || new Date().toISOString().split('T')[0],
    sintomas: eventoEditar?.sintomas || '',
    diagnostico: eventoEditar?.diagnostico || '',
    gravedad: eventoEditar?.gravedad || 'leve',
    contagiosa: eventoEditar?.contagiosa || false,
    aislamiento: eventoEditar?.aislamiento || false,
    
    // Tratamiento
    medicamento: eventoEditar?.medicamento || '',
    fechaInicio: eventoEditar?.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: eventoEditar?.fechaFin || '',
    dosisTratamiento: eventoEditar?.dosis || '',
    frecuencia: eventoEditar?.frecuencia || '',
    viaAdministracionTratamiento: eventoEditar?.viaAdministracion || 'oral',
    motivoTratamiento: eventoEditar?.motivoTratamiento || '',
    resultadoTratamiento: eventoEditar?.resultadoTratamiento || ''
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

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setGuardando(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onGuardar(formData);
    setGuardando(false);
  };

  const getTitulo = () => {
    if (eventoEditar) return `Editar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    return `Registrar ${tipo === 'vacuna' ? 'Vacunación' : tipo === 'enfermedad' ? 'Enfermedad' : 'Tratamiento'}`;
  };

  const getColorBoton = () => {
    return tipo === 'vacuna' ? 'blue' : tipo === 'enfermedad' ? 'red' : 'green';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{getTitulo()}</h2>
          <button onClick={onCancelar} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-6">
          {/* Selección de animal (común para todos) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Información del Animal
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código del Animal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="animalId"
                value={formData.animalId}
                onChange={manejarCambio}
                placeholder="Código del animal (ej: CAB-001)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Campos específicos para VACUNA */}
          {tipo === 'vacuna' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Syringe className="w-5 h-5 mr-2 text-blue-600" />
                Información de la Vacuna
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Vacuna <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombreVacuna"
                      value={formData.nombreVacuna}
                      onChange={manejarCambio}
                      placeholder="Ej: Triple viral caprina"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Aplicación <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaAplicacion"
                      value={formData.fechaAplicacion}
                      onChange={manejarCambio}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Lote <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lote"
                      value={formData.lote}
                      onChange={manejarCambio}
                      placeholder="Ej: LOT-2024-001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Laboratorio Fabricante
                    </label>
                    <input
                      type="text"
                      name="laboratorio"
                      value={formData.laboratorio}
                      onChange={manejarCambio}
                      placeholder="Nombre del laboratorio"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vía de Administración <span className="text-red-500">*</span>
                    </label>
                    <SelectPersonalizado
                      valor={formData.viaAdministracion}
                      onChange={(valor) => manejarCambio({ target: { name: 'viaAdministracion', value: valor } })}
                      opciones={opcionesViaAdministracion}
                      placeholder="Seleccionar vía..."
                      requerido
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosis Aplicada <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="dosis"
                      value={formData.dosis}
                      onChange={manejarCambio}
                      placeholder="Ej: 2 ml"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Veterinario Responsable
                    </label>
                    <input
                      type="text"
                      name="veterinarioResponsable"
                      value={formData.veterinarioResponsable}
                      onChange={manejarCambio}
                      placeholder="Nombre del veterinario"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Próxima Dosis / Refuerzo
                    </label>
                    <input
                      type="date"
                      name="proximaDosis"
                      value={formData.proximaDosis}
                      onChange={manejarCambio}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campos específicos para ENFERMEDAD */}
          {tipo === 'enfermedad' && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Información de la Enfermedad
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Enfermedad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombreEnfermedad"
                      value={formData.nombreEnfermedad}
                      onChange={manejarCambio}
                      placeholder="Ej: Neumonía"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Detección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaDeteccion"
                      value={formData.fechaDeteccion}
                      onChange={manejarCambio}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Síntomas Observados <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="sintomas"
                    value={formData.sintomas}
                    onChange={manejarCambio}
                    rows="3"
                    placeholder="Describe los síntomas observados..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico del Veterinario
                  </label>
                  <textarea
                    name="diagnostico"
                    value={formData.diagnostico}
                    onChange={manejarCambio}
                    rows="2"
                    placeholder="Diagnóstico profesional..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Gravedad <span className="text-red-500">*</span>
                  </label>
                  <SelectPersonalizado
                    valor={formData.gravedad}
                    onChange={(valor) => manejarCambio({ target: { name: 'gravedad', value: valor } })}
                    opciones={opcionesGravedad}
                    placeholder="Seleccionar gravedad..."
                    requerido
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="contagiosa"
                      checked={formData.contagiosa}
                      onChange={manejarCambio}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enfermedad contagiosa
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="aislamiento"
                      checked={formData.aislamiento}
                      onChange={manejarCambio}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Requiere aislamiento
                    </label>
                  </div>
                </div>

                {formData.contagiosa && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                      <p className="text-sm text-red-700">
                        <strong>Atención:</strong> Esta enfermedad es contagiosa. Se recomienda revisar y monitorear a otros animales del rebaño.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campos específicos para TRATAMIENTO */}
          {tipo === 'tratamiento' && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-green-600" />
                Información del Tratamiento
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo del Tratamiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="motivoTratamiento"
                    value={formData.motivoTratamiento}
                    onChange={manejarCambio}
                    placeholder="Ej: Infección respiratoria"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicamento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="medicamento"
                      value={formData.medicamento}
                      onChange={manejarCambio}
                      placeholder="Nombre del medicamento"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="dosisTratamiento"
                      value={formData.dosisTratamiento}
                      onChange={manejarCambio}
                      placeholder="Ej: 5 ml"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="frecuencia"
                      value={formData.frecuencia}
                      onChange={manejarCambio}
                      placeholder="Ej: Cada 12 horas"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vía de Administración <span className="text-red-500">*</span>
                    </label>
                    <SelectPersonalizado
                      valor={formData.viaAdministracionTratamiento}
                      onChange={(valor) => manejarCambio({ target: { name: 'viaAdministracionTratamiento', value: valor } })}
                      opciones={opcionesViaAdministracion}
                      placeholder="Seleccionar vía..."
                      requerido
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={manejarCambio}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Estimada de Fin
                    </label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={manejarCambio}
                      min={formData.fechaInicio}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resultado del Tratamiento
                  </label>
                  <textarea
                    name="resultadoTratamiento"
                    value={formData.resultadoTratamiento}
                    onChange={manejarCambio}
                    rows="2"
                    placeholder="Describe la evolución y resultado del tratamiento..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observaciones (común para todos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Adicionales
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={manejarCambio}
              rows="4"
              placeholder="Notas adicionales sobre el evento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
              className={`flex-1 px-6 py-3 bg-${getColorBoton()}-600 text-white rounded-lg hover:bg-${getColorBoton()}-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50`}
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Componente de Vista Detallada de Evento
 */
const DetalleEvento = ({ evento, onCerrar, onEditar }) => {
  if (!evento) return null;

  const calcularDiasHasta = (fecha) => {
    const hoy = new Date();
    const fechaObj = new Date(fecha);
    const diffTime = fechaObj - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const obtenerColorTipo = (tipo) => {
    const colores = {
      vacuna: 'blue',
      enfermedad: 'red',
      tratamiento: 'green'
    };
    return colores[tipo] || 'gray';
  };

  const color = obtenerColorTipo(evento.tipo);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-6 bg-${color}-600 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {evento.tipo === 'vacuna' && <Syringe className="w-10 h-10" />}
              {evento.tipo === 'enfermedad' && <AlertTriangle className="w-10 h-10" />}
              {evento.tipo === 'tratamiento' && <Pill className="w-10 h-10" />}
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {evento.tipo === 'vacuna' ? 'Registro de Vacunación' :
                   evento.tipo === 'enfermedad' ? 'Registro de Enfermedad' :
                   'Registro de Tratamiento'}
                </h2>
                <p className="text-white/90 text-sm">
                  ID del evento: #{evento.id}
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
                <p className="text-base font-semibold text-gray-800">{evento.animal.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-base font-semibold text-gray-800">{evento.animal.nombre}</p>
              </div>
            </div>
          </div>

          {/* Detalles específicos según tipo */}
          <div className={`bg-${color}-50 rounded-lg p-4 border-2 border-${color}-200`}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Detalles Completos
            </h3>
            
            {/* Renderizar detalles según el tipo */}
            <div className="space-y-3">
              {Object.entries(evento).map(([key, value]) => {
                if (key === 'id' || key === 'tipo' || key === 'animal' || key === 'observaciones') return null;
                if (value === null || value === undefined || value === '') return null;
                
                return (
                  <div key={key} className="flex items-start border-b border-gray-200 pb-2">
                    <p className="text-sm font-medium text-gray-700 w-1/3 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </p>
                    <p className="text-sm text-gray-600 w-2/3">
                      {typeof value === 'boolean' ? (value ? 'Sí' : 'No') :
                       key.includes('fecha') || key.includes('Fecha') ? 
                         new Date(value).toLocaleDateString('es-ES', {
                           weekday: 'long',
                           year: 'numeric',
                           month: 'long',
                           day: 'numeric'
                         }) : 
                         value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          {evento.observaciones && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Observaciones
              </h3>
              <p className="text-gray-700 leading-relaxed">{evento.observaciones}</p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={onEditar}
              className={`flex-1 px-6 py-3 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors font-medium flex items-center justify-center`}
            >
              <Edit className="w-5 h-5 mr-2" />
              Editar Evento
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

export default ModuloSalud;
