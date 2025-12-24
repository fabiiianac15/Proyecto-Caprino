/**
 * Componente de formulario para registro de eventos reproductivos
 * Permite registrar servicios, diagnósticos y partos
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Save, 
  X, 
  AlertCircle, 
  Calendar,
  Users,
  CheckCircle,
  Baby
} from 'lucide-react';
import { validarFecha } from '../utilidades/validaciones';
import reproduccionService from '../servicios/reproduccionService';
import animalService from '../servicios/animalService';

const RegistroReproduccion = ({ onGuardar, onCancelar }) => {
  const [tipoEvento, setTipoEvento] = useState('servicio');
  const [formulario, setFormulario] = useState({
    hembraId: '',
    machoId: '',
    fechaServicio: new Date().toISOString().split('T')[0],
    tipoServicio: 'monta_natural',
    fechaDiagnostico: '',
    resultadoDiagnostico: '',
    fechaParto: '',
    numeroCrias: 1,
    criasVivas: 1,
    observaciones: ''
  });

  const [errores, setErrores] = useState({});
  const [hembras, setHembras] = useState([]);
  const [machos, setMachos] = useState([]);
  const [serviciosPendientes, setServiciosPendientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar datos iniciales
  useEffect(() => {
    cargarAnimales();
    if (tipoEvento === 'diagnostico' || tipoEvento === 'parto') {
      cargarServiciosPendientes();
    }
  }, [tipoEvento]);

  /**
   * Carga hembras y machos disponibles
   */
  const cargarAnimales = async () => {
    try {
      const [respuestaHembras, respuestaMachos] = await Promise.all([
        animalService.buscarAnimales({ sexo: 'hembra', estado: 'activo' }),
        animalService.buscarAnimales({ sexo: 'macho', estado: 'activo' })
      ]);
      
      setHembras(respuestaHembras.data);
      setMachos(respuestaMachos.data);
    } catch (error) {
      console.error('Error al cargar animales:', error);
      mostrarMensaje('error', 'Error al cargar la lista de animales');
    }
  };

  /**
   * Carga servicios pendientes de diagnóstico
   */
  const cargarServiciosPendientes = async () => {
    try {
      const respuesta = await reproduccionService.obtenerServiciosPendientes();
      setServiciosPendientes(respuesta.data);
    } catch (error) {
      console.error('Error al cargar servicios pendientes:', error);
    }
  };

  /**
   * Maneja cambios en los campos
   */
  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));

    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Maneja el cambio de tipo de evento
   */
  const cambiarTipoEvento = (tipo) => {
    setTipoEvento(tipo);
    setFormulario({
      hembraId: '',
      machoId: '',
      fechaServicio: new Date().toISOString().split('T')[0],
      tipoServicio: 'monta_natural',
      fechaDiagnostico: '',
      resultadoDiagnostico: '',
      fechaParto: '',
      numeroCrias: 1,
      criasVivas: 1,
      observaciones: ''
    });
    setErrores({});
  };

  /**
   * Valida el formulario según el tipo de evento
   */
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (tipoEvento === 'servicio') {
      // Validar hembra
      if (!formulario.hembraId) {
        nuevosErrores.hembraId = 'Debe seleccionar una hembra';
      }

      // Validar macho
      if (!formulario.machoId) {
        nuevosErrores.machoId = 'Debe seleccionar un macho';
      }

      // Validar fecha de servicio
      const validacionFecha = validarFecha(formulario.fechaServicio);
      if (!validacionFecha.valido) {
        nuevosErrores.fechaServicio = validacionFecha.mensaje;
      }

    } else if (tipoEvento === 'diagnostico') {
      // Validar servicio seleccionado
      if (!formulario.servicioId) {
        nuevosErrores.servicioId = 'Debe seleccionar un servicio';
      }

      // Validar fecha de diagnóstico
      const validacionFecha = validarFecha(formulario.fechaDiagnostico);
      if (!validacionFecha.valido) {
        nuevosErrores.fechaDiagnostico = validacionFecha.mensaje;
      }

      // Validar resultado
      if (!formulario.resultadoDiagnostico) {
        nuevosErrores.resultadoDiagnostico = 'Debe seleccionar un resultado';
      }

    } else if (tipoEvento === 'parto') {
      // Validar servicio seleccionado
      if (!formulario.servicioId) {
        nuevosErrores.servicioId = 'Debe seleccionar un servicio';
      }

      // Validar fecha de parto
      const validacionFecha = validarFecha(formulario.fechaParto);
      if (!validacionFecha.valido) {
        nuevosErrores.fechaParto = validacionFecha.mensaje;
      }

      // Validar número de crías
      if (formulario.numeroCrias < 1) {
        nuevosErrores.numeroCrias = 'Debe haber al menos 1 cría';
      }

      // Validar crías vivas
      if (formulario.criasVivas < 0 || formulario.criasVivas > formulario.numeroCrias) {
        nuevosErrores.criasVivas = 'Las crías vivas no pueden ser mayor al número total';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Envía el formulario
   */
  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
      mostrarMensaje('error', 'Por favor corrija los errores en el formulario');
      return;
    }

    setCargando(true);
    try {
      let respuesta;
      
      if (tipoEvento === 'servicio') {
        respuesta = await reproduccionService.registrarServicio({
          hembraId: formulario.hembraId,
          machoId: formulario.machoId,
          fecha: formulario.fechaServicio,
          tipo: formulario.tipoServicio,
          observaciones: formulario.observaciones
        });
        mostrarMensaje('success', 'Servicio registrado exitosamente');
        
      } else if (tipoEvento === 'diagnostico') {
        respuesta = await reproduccionService.registrarDiagnostico({
          servicioId: formulario.servicioId,
          fecha: formulario.fechaDiagnostico,
          resultado: formulario.resultadoDiagnostico,
          observaciones: formulario.observaciones
        });
        mostrarMensaje('success', 'Diagnóstico registrado exitosamente');
        
      } else if (tipoEvento === 'parto') {
        respuesta = await reproduccionService.registrarParto({
          servicioId: formulario.servicioId,
          fecha: formulario.fechaParto,
          numeroCrias: formulario.numeroCrias,
          criasVivas: formulario.criasVivas,
          observaciones: formulario.observaciones
        });
        mostrarMensaje('success', 'Parto registrado exitosamente');
      }

      if (onGuardar) {
        onGuardar(respuesta.data);
      }

      // Limpiar formulario
      setFormulario({
        hembraId: '',
        machoId: '',
        fechaServicio: new Date().toISOString().split('T')[0],
        tipoServicio: 'monta_natural',
        fechaDiagnostico: '',
        resultadoDiagnostico: '',
        fechaParto: '',
        numeroCrias: 1,
        criasVivas: 1,
        observaciones: ''
      });
      setErrores({});

    } catch (error) {
      console.error(`Error al registrar ${tipoEvento}:`, error);
      const mensajeError = error.response?.data?.mensaje || 
        `Error al registrar el ${tipoEvento}. Intente nuevamente.`;
      mostrarMensaje('error', mensajeError);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Muestra mensaje temporal
   */
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 5000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Encabezado */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Heart className="w-6 h-6 mr-2 text-pink-600" />
          Gestión Reproductiva
        </h2>
        <p className="text-gray-600 mt-1">
          Registre servicios, diagnósticos y partos.
        </p>
      </div>

      {/* Mensaje de feedback */}
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-md ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {mensaje.texto}
          </div>
        </div>
      )}

      {/* Selector de tipo de evento */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b">
          <button
            onClick={() => cambiarTipoEvento('servicio')}
            className={`px-4 py-2 font-medium transition-colors ${
              tipoEvento === 'servicio'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-1" />
            Servicio
          </button>
          <button
            onClick={() => cambiarTipoEvento('diagnostico')}
            className={`px-4 py-2 font-medium transition-colors ${
              tipoEvento === 'diagnostico'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Diagnóstico
          </button>
          <button
            onClick={() => cambiarTipoEvento('parto')}
            className={`px-4 py-2 font-medium transition-colors ${
              tipoEvento === 'parto'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Baby className="w-4 h-4 inline mr-1" />
            Parto
          </button>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={manejarEnvio}>
        {tipoEvento === 'servicio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hembra */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Hembra <span className="text-red-500">*</span>
              </label>
              <select
                name="hembraId"
                value={formulario.hembraId}
                onChange={manejarCambio}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.hembraId 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              >
                <option value="">Seleccione una hembra</option>
                {hembras.map(hembra => (
                  <option key={hembra.id} value={hembra.id}>
                    {hembra.identificacion} - {hembra.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
              {errores.hembraId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.hembraId}
                </p>
              )}
            </div>

            {/* Macho */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Macho <span className="text-red-500">*</span>
              </label>
              <select
                name="machoId"
                value={formulario.machoId}
                onChange={manejarCambio}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.machoId 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              >
                <option value="">Seleccione un macho</option>
                {machos.map(macho => (
                  <option key={macho.id} value={macho.id}>
                    {macho.identificacion} - {macho.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
              {errores.machoId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.machoId}
                </p>
              )}
            </div>

            {/* Fecha de servicio */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de Servicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fechaServicio"
                value={formulario.fechaServicio}
                onChange={manejarCambio}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.fechaServicio 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              />
              {errores.fechaServicio && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.fechaServicio}
                </p>
              )}
            </div>

            {/* Tipo de servicio */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Servicio
              </label>
              <select
                name="tipoServicio"
                value={formulario.tipoServicio}
                onChange={manejarCambio}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={cargando}
              >
                <option value="monta_natural">Monta Natural</option>
                <option value="inseminacion_artificial">Inseminación Artificial</option>
              </select>
            </div>
          </div>
        )}

        {tipoEvento === 'diagnostico' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Servicio a diagnosticar */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio <span className="text-red-500">*</span>
              </label>
              <select
                name="servicioId"
                value={formulario.servicioId || ''}
                onChange={manejarCambio}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.servicioId 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              >
                <option value="">Seleccione un servicio pendiente</option>
                {serviciosPendientes.map(servicio => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.hembra.identificacion} x {servicio.macho.identificacion} - 
                    {new Date(servicio.fecha).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {errores.servicioId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.servicioId}
                </p>
              )}
            </div>

            {/* Fecha de diagnóstico */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de Diagnóstico <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fechaDiagnostico"
                value={formulario.fechaDiagnostico}
                onChange={manejarCambio}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.fechaDiagnostico 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              />
              {errores.fechaDiagnostico && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.fechaDiagnostico}
                </p>
              )}
            </div>

            {/* Resultado */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resultado <span className="text-red-500">*</span>
              </label>
              <select
                name="resultadoDiagnostico"
                value={formulario.resultadoDiagnostico}
                onChange={manejarCambio}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.resultadoDiagnostico 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              >
                <option value="">Seleccione el resultado</option>
                <option value="positivo">Positivo (Preñada)</option>
                <option value="negativo">Negativo (Vacía)</option>
              </select>
              {errores.resultadoDiagnostico && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.resultadoDiagnostico}
                </p>
              )}
            </div>
          </div>
        )}

        {tipoEvento === 'parto' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Servicio con parto */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio <span className="text-red-500">*</span>
              </label>
              <select
                name="servicioId"
                value={formulario.servicioId || ''}
                onChange={manejarCambio}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.servicioId 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              >
                <option value="">Seleccione un servicio con diagnóstico positivo</option>
                {serviciosPendientes
                  .filter(s => s.diagnostico?.resultado === 'positivo')
                  .map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.hembra.identificacion} - 
                      Servicio: {new Date(servicio.fecha).toLocaleDateString()}
                    </option>
                  ))}
              </select>
              {errores.servicioId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.servicioId}
                </p>
              )}
            </div>

            {/* Fecha de parto */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de Parto <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fechaParto"
                value={formulario.fechaParto}
                onChange={manejarCambio}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.fechaParto 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              />
              {errores.fechaParto && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.fechaParto}
                </p>
              )}
            </div>

            {/* Número de crías */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Baby className="w-4 h-4 inline mr-1" />
                Número Total de Crías <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numeroCrias"
                value={formulario.numeroCrias}
                onChange={manejarCambio}
                min="1"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.numeroCrias 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              />
              {errores.numeroCrias && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.numeroCrias}
                </p>
              )}
            </div>

            {/* Crías vivas */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crías Vivas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="criasVivas"
                value={formulario.criasVivas}
                onChange={manejarCambio}
                min="0"
                max={formulario.numeroCrias}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                  ${errores.criasVivas 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }`}
                disabled={cargando}
              />
              {errores.criasVivas && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errores.criasVivas}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Observaciones (común para todos) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formulario.observaciones}
            onChange={manejarCambio}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Información adicional sobre el evento..."
            disabled={cargando}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {cargando ? 'Guardando...' : `Registrar ${tipoEvento}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroReproduccion;
