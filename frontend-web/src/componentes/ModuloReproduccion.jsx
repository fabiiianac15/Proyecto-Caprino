/**
 * Módulo Completo de Reproducción y Montas
 * Gestión integral del ciclo reproductivo: montas, diagnósticos, partos
 */

import React, { useState } from 'react';
import { 
  Heart, 
  Plus,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  Baby,
  Stethoscope,
  User,
  X,
  Sparkles,
  HelpCircle,
  XCircle,
  Activity,
  UserPlus,
  Scissors
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';

const ModuloReproduccion = () => {
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'registro', 'detalle'
  const [tipoRegistro, setTipoRegistro] = useState('monta'); // 'monta', 'diagnostico', 'parto'
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
      monta: 'bg-pink-100 text-pink-700',
      diagnostico: 'bg-blue-100 text-blue-700',
      parto: 'bg-green-100 text-green-700'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Obtiene el color del badge según el estado
   */
  const obtenerColorEstado = (estado) => {
    const colores = {
      pendiente_diagnostico: 'bg-yellow-100 text-yellow-700',
      gestante: 'bg-green-100 text-green-700',
      vacia: 'bg-gray-100 text-gray-700',
      parto_realizado: 'bg-blue-100 text-blue-700'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Formatea el nombre del estado
   */
  const formatearEstado = (estado) => {
    const estados = {
      pendiente_diagnostico: 'Pendiente Diagnóstico',
      gestante: 'Gestante',
      vacia: 'Vacía',
      parto_realizado: 'Parto Realizado'
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
      <FormularioReproduccion 
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
              <Heart className="w-8 h-8 mr-3 text-pink-600" />
              Reproducción y Montas
            </h2>
            <p className="text-gray-600 mt-1">
              Control completo del ciclo reproductivo del rebaño
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setTipoRegistro('monta');
                setVistaActual('registro');
              }}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Monta
            </button>
            <button
              onClick={() => {
                setTipoRegistro('diagnostico');
                setVistaActual('registro');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Diagnóstico
            </button>
            <button
              onClick={() => {
                setTipoRegistro('parto');
                setVistaActual('registro');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Parto
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
                placeholder="Buscar por código o nombre de hembra..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Todos los eventos</option>
              <option value="monta">Montas</option>
              <option value="diagnostico">Diagnósticos</option>
              <option value="parto">Partos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de eventos reproductivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {eventos.map(evento => (
          <div key={evento.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            {/* Header del evento */}
            <div className={`px-6 py-4 border-b ${
              evento.tipo === 'monta' ? 'bg-pink-50' :
              evento.tipo === 'diagnostico' ? 'bg-blue-50' : 'bg-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {evento.tipo === 'monta' && <Heart className="w-6 h-6 text-pink-600" />}
                  {evento.tipo === 'diagnostico' && <Stethoscope className="w-6 h-6 text-blue-600" />}
                  {evento.tipo === 'parto' && <Baby className="w-6 h-6 text-green-600" />}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 capitalize">{evento.tipo}</h3>
                    <p className="text-sm text-gray-600">
                      Hembra: {evento.hembra.codigo} - {evento.hembra.nombre}
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
              {evento.tipo === 'monta' && (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Fecha de monta:</span>
                    <span className="ml-2 text-gray-600">{new Date(evento.fechaMonta).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Heart className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Macho:</span>
                    <span className="ml-2 text-gray-600">{evento.macho.codigo} - {evento.macho.nombre}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <span className="ml-2 text-gray-600 capitalize">{evento.tipoMonta.replace('_', ' ')}</span>
                  </div>
                  {evento.estado && (
                    <div className="mt-3 pt-3 border-t">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(evento.estado)}`}>
                        {formatearEstado(evento.estado)}
                      </span>
                      {evento.fechaEsperadaDiagnostico && (
                        <p className="text-sm text-gray-600 mt-2">
                          Diagnóstico esperado en {calcularDiasHasta(evento.fechaEsperadaDiagnostico)} días
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {evento.tipo === 'diagnostico' && (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Fecha diagnóstico:</span>
                    <span className="ml-2 text-gray-600">{new Date(evento.fechaDiagnostico).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Resultado:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                      evento.resultado === 'gestante' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {evento.resultado.charAt(0).toUpperCase() + evento.resultado.slice(1)}
                    </span>
                  </div>
                  {evento.resultado === 'gestante' && evento.fechaEsperadaParto && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center text-sm text-green-700">
                        <Baby className="w-4 h-4 mr-2" />
                        <span className="font-medium">Parto esperado:</span>
                        <span className="ml-2">{new Date(evento.fechaEsperadaParto).toLocaleDateString('es-ES')}</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Faltan {calcularDiasHasta(evento.fechaEsperadaParto)} días aproximadamente
                      </p>
                    </div>
                  )}
                </div>
              )}

              {evento.tipo === 'parto' && (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Fecha parto:</span>
                    <span className="ml-2 text-gray-600">{new Date(evento.fechaParto).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{evento.numeroCrias}</p>
                      <p className="text-xs text-gray-600">Total crías</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{evento.criasVivas}</p>
                      <p className="text-xs text-gray-600">Vivas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{evento.criasMuertas}</p>
                      <p className="text-xs text-gray-600">Muertas</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700">Tipo parto:</span>
                    <span className="ml-2 text-gray-600 capitalize">{evento.tipoParto}</span>
                  </div>
                  {evento.pesoCrias && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Peso crías:</span>
                      <span className="ml-2 text-gray-600">{evento.pesoCrias.join(' kg, ')} kg</span>
                    </div>
                  )}
                  {evento.sexoCrias && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Sexo:</span>
                      <span className="ml-2 text-gray-600">{evento.sexoCrias.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</span>
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
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No hay eventos reproductivos registrados</p>
          <button
            onClick={() => {
              setTipoRegistro('monta');
              setVistaActual('registro');
            }}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Primera Monta
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Formulario de Reproducción
 */
const FormularioReproduccion = ({ tipo, eventoEditar, onGuardar, onCancelar }) => {
  // Opciones para selectores personalizados
  const opcionesTipoMonta = [
    { 
      value: 'natural', 
      label: 'Monta Natural', 
      icono: <Heart />,
      colorFondo: 'bg-pink-100',
      colorIcono: 'text-pink-600'
    },
    { 
      value: 'inseminacion', 
      label: 'Inseminación Artificial', 
      icono: <Sparkles />,
      colorFondo: 'bg-purple-100',
      colorIcono: 'text-purple-600'
    }
  ];

  const opcionesResultado = [
    { 
      value: '', 
      label: 'Seleccionar...', 
      icono: <HelpCircle />,
      colorFondo: 'bg-gray-100',
      colorIcono: 'text-gray-500'
    },
    { 
      value: 'gestante', 
      label: 'Gestante', 
      icono: <CheckCircle />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'vacia', 
      label: 'Vacía', 
      icono: <XCircle />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    },
    { 
      value: 'dudoso', 
      label: 'Dudoso (repetir)', 
      icono: <HelpCircle />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    }
  ];

  const opcionesTipoParto = [
    { 
      value: 'normal', 
      label: 'Normal', 
      icono: <CheckCircle />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'asistido', 
      label: 'Asistido', 
      icono: <UserPlus />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    },
    { 
      value: 'cesarea', 
      label: 'Cesárea', 
      icono: <Scissors />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    }
  ];

  const [formData, setFormData] = useState({
    // Común
    hembraId: eventoEditar?.hembra?.codigo || '',
    observaciones: eventoEditar?.observaciones || '',
    
    // Monta
    machoId: eventoEditar?.macho?.codigo || '',
    fechaMonta: eventoEditar?.fechaMonta || new Date().toISOString().split('T')[0],
    tipoMonta: eventoEditar?.tipoMonta || 'natural',
    
    // Diagnóstico
    fechaDiagnostico: eventoEditar?.fechaDiagnostico || new Date().toISOString().split('T')[0],
    resultado: eventoEditar?.resultado || '',
    fechaEsperadaParto: eventoEditar?.fechaEsperadaParto || '',
    
    // Parto
    fechaParto: eventoEditar?.fechaParto || new Date().toISOString().split('T')[0],
    numeroCrias: eventoEditar?.numeroCrias || 1,
    criasVivas: eventoEditar?.criasVivas || 1,
    criasMuertas: eventoEditar?.criasMuertas || 0,
    tipoParto: eventoEditar?.tipoParto || 'normal',
    complicaciones: eventoEditar?.complicaciones || '',
    pesosCrias: eventoEditar?.pesoCrias?.join(', ') || '',
    sexosCrias: eventoEditar?.sexoCrias?.join(', ') || ''
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    return `Registrar ${tipo === 'monta' ? 'Monta' : tipo === 'diagnostico' ? 'Diagnóstico' : 'Parto'}`;
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
          {/* Selección de hembra (común para todos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hembra <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="hembraId"
              value={formData.hembraId}
              onChange={manejarCambio}
              placeholder="Código de la hembra (ej: CAB-001)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          {/* Campos específicos para MONTA */}
          {tipo === 'monta' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Macho Reproductor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="machoId"
                  value={formData.machoId}
                  onChange={manejarCambio}
                  placeholder="Código del macho (ej: CAB-M-001)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Monta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaMonta"
                    value={formData.fechaMonta}
                    onChange={manejarCambio}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Monta
                  </label>
                  <SelectPersonalizado
                    valor={formData.tipoMonta}
                    onChange={(valor) => manejarCambio({ target: { name: 'tipoMonta', value: valor } })}
                    opciones={opcionesTipoMonta}
                    placeholder="Seleccionar tipo de monta..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Campos específicos para DIAGNÓSTICO */}
          {tipo === 'diagnostico' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Diagnóstico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaDiagnostico"
                    value={formData.fechaDiagnostico}
                    onChange={manejarCambio}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resultado <span className="text-red-500">*</span>
                  </label>
                  <SelectPersonalizado
                    valor={formData.resultado}
                    onChange={(valor) => manejarCambio({ target: { name: 'resultado', value: valor } })}
                    opciones={opcionesResultado}
                    placeholder="Seleccionar resultado..."
                    requerido
                  />
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p><span className="font-semibold">Gestante:</span> Confirmado que está preñada</p>
                    <p><span className="font-semibold">Vacía:</span> Confirmado que NO está preñada (puede ser montada nuevamente)</p>
                    <p><span className="font-semibold">Dudoso:</span> Resultado no concluyente, repetir diagnóstico en 7-15 días</p>
                  </div>
                </div>
              </div>

              {formData.resultado === 'gestante' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Esperada de Parto
                  </label>
                  <input
                    type="date"
                    name="fechaEsperadaParto"
                    value={formData.fechaEsperadaParto}
                    onChange={manejarCambio}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La gestación promedio es de 150 días (5 meses)
                  </p>
                </div>
              )}
            </>
          )}

          {/* Campos específicos para PARTO */}
          {tipo === 'parto' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Parto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaParto"
                    value={formData.fechaParto}
                    onChange={manejarCambio}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Parto
                  </label>
                  <SelectPersonalizado
                    valor={formData.tipoParto}
                    onChange={(valor) => manejarCambio({ target: { name: 'tipoParto', value: valor } })}
                    opciones={opcionesTipoParto}
                    placeholder="Seleccionar tipo de parto..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Total de Crías <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="numeroCrias"
                    value={formData.numeroCrias}
                    onChange={manejarCambio}
                    min="1"
                    max="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crías Vivas
                  </label>
                  <input
                    type="number"
                    name="criasVivas"
                    value={formData.criasVivas}
                    onChange={manejarCambio}
                    min="0"
                    max={formData.numeroCrias}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crías Muertas
                  </label>
                  <input
                    type="number"
                    name="criasMuertas"
                    value={formData.criasMuertas}
                    onChange={manejarCambio}
                    min="0"
                    max={formData.numeroCrias}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso de las Crías (kg, separados por coma)
                </label>
                <input
                  type="text"
                  name="pesosCrias"
                  value={formData.pesosCrias}
                  onChange={manejarCambio}
                  placeholder="Ej: 3.2, 3.5, 3.8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo de las Crías (separados por coma)
                </label>
                <input
                  type="text"
                  name="sexosCrias"
                  value={formData.sexosCrias}
                  onChange={manejarCambio}
                  placeholder="Ej: hembra, macho, hembra"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complicaciones
                </label>
                <textarea
                  name="complicaciones"
                  value={formData.complicaciones}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Describe cualquier complicación durante el parto..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Observaciones (común para todos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Generales
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={manejarCambio}
              rows="4"
              placeholder="Notas adicionales sobre el evento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
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
              className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
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
      monta: 'pink',
      diagnostico: 'blue',
      parto: 'green'
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
              {evento.tipo === 'monta' && <Heart className="w-10 h-10" />}
              {evento.tipo === 'diagnostico' && <Stethoscope className="w-10 h-10" />}
              {evento.tipo === 'parto' && <Baby className="w-10 h-10" />}
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {evento.tipo === 'monta' ? 'Registro de Monta' :
                   evento.tipo === 'diagnostico' ? 'Diagnóstico de Gestación' :
                   'Registro de Parto'}
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
          {/* Información de la Hembra */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Información de la Hembra
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Código</p>
                <p className="text-base font-semibold text-gray-800">{evento.hembra.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-base font-semibold text-gray-800">{evento.hembra.nombre}</p>
              </div>
            </div>
          </div>

          {/* Información Específica de MONTA */}
          {evento.tipo === 'monta' && (
            <>
              <div className="bg-pink-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-pink-600" />
                  Detalles de la Monta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Monta</p>
                    <p className="text-base font-semibold text-gray-800">
                      {new Date(evento.fechaMonta).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Monta</p>
                    <p className="text-base font-semibold text-gray-800 capitalize">
                      {evento.tipoMonta.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Código del Macho</p>
                    <p className="text-base font-semibold text-gray-800">{evento.macho.codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nombre del Macho</p>
                    <p className="text-base font-semibold text-gray-800">{evento.macho.nombre}</p>
                  </div>
                </div>
              </div>

              {evento.estado && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                    Estado Actual
                  </h3>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-yellow-800">
                      {evento.estado.replace('_', ' ').toUpperCase()}
                    </p>
                    {evento.fechaEsperadaDiagnostico && (
                      <p className="text-sm text-gray-700">
                        Se espera realizar diagnóstico el{' '}
                        <span className="font-semibold">
                          {new Date(evento.fechaEsperadaDiagnostico).toLocaleDateString('es-ES')}
                        </span>
                        {' '}(en {calcularDiasHasta(evento.fechaEsperadaDiagnostico)} días)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Información Específica de DIAGNÓSTICO */}
          {evento.tipo === 'diagnostico' && (
            <>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                  Detalles del Diagnóstico
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Diagnóstico</p>
                    <p className="text-base font-semibold text-gray-800">
                      {new Date(evento.fechaDiagnostico).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resultado</p>
                    <p className={`text-base font-bold ${
                      evento.resultado === 'gestante' ? 'text-green-600' :
                      evento.resultado === 'vacia' ? 'text-gray-600' : 'text-yellow-600'
                    }`}>
                      {evento.resultado.charAt(0).toUpperCase() + evento.resultado.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {evento.resultado === 'gestante' && evento.fechaEsperadaParto && (
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                  <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                    <Baby className="w-5 h-5 mr-2 text-green-600" />
                    Parto Esperado
                  </h3>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-green-800">
                      {new Date(evento.fechaEsperadaParto).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700">
                        Faltan aproximadamente{' '}
                        <span className="font-bold text-lg">{calcularDiasHasta(evento.fechaEsperadaParto)}</span>
                        {' '}días para el parto
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Información Específica de PARTO */}
          {evento.tipo === 'parto' && (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Baby className="w-5 h-5 mr-2 text-green-600" />
                  Detalles del Parto
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Parto</p>
                    <p className="text-base font-semibold text-gray-800">
                      {new Date(evento.fechaParto).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Parto</p>
                    <p className="text-base font-semibold text-gray-800 capitalize">
                      {evento.tipoParto}
                    </p>
                  </div>
                </div>

                {/* Estadísticas de Crías */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{evento.numeroCrias}</p>
                    <p className="text-sm text-gray-600 font-medium">Total de Crías</p>
                  </div>
                  <div className="text-center border-l border-r border-green-200">
                    <p className="text-3xl font-bold text-green-600">{evento.criasVivas}</p>
                    <p className="text-sm text-gray-600 font-medium">Crías Vivas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{evento.criasMuertas}</p>
                    <p className="text-sm text-gray-600 font-medium">Crías Muertas</p>
                  </div>
                </div>
              </div>

              {/* Detalles de las Crías */}
              {(evento.pesoCrias || evento.sexoCrias) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">
                    Información Detallada de las Crías
                  </h3>
                  <div className="space-y-3">
                    {evento.pesoCrias && evento.pesoCrias.map((peso, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Cría #{index + 1}</p>
                            <p className="text-base font-semibold text-gray-800">
                              {evento.sexoCrias && evento.sexoCrias[index] ? 
                                evento.sexoCrias[index].charAt(0).toUpperCase() + evento.sexoCrias[index].slice(1)
                                : 'No especificado'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Peso al Nacer</p>
                          <p className="text-lg font-bold text-gray-800">{peso} kg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {evento.complicaciones && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                    Complicaciones
                  </h3>
                  <p className="text-gray-700">{evento.complicaciones}</p>
                </div>
              )}
            </>
          )}

          {/* Observaciones */}
          {evento.observaciones && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-gray-600" />
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

export default ModuloReproduccion;
