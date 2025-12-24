/**
 * Componente de formulario para registro de producción de leche
 * Permite registrar la producción diaria individual o grupal
 */

import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Save, 
  X, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  validarProduccionLeche, 
  validarFecha,
  validarPorcentaje 
} from '../utilidades/validaciones';
import produccionService from '../servicios/produccionService';
import animalService from '../servicios/animalService';

const RegistroProduccion = ({ onGuardar, onCancelar }) => {
  // Estado del formulario
  const [formulario, setFormulario] = useState({
    animalId: '',
    fecha: new Date().toISOString().split('T')[0],
    numeroOrdenio: 1,
    cantidadLitros: '',
    porcentajeGrasa: '',
    porcentajeProteina: '',
    calidadLeche: 'buena',
    observaciones: ''
  });

  const [errores, setErrores] = useState({});
  const [hembras, setHembras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [produccionAnterior, setProduccionAnterior] = useState(null);

  // Cargar hembras lactantes al montar
  useEffect(() => {
    cargarHembrasLactantes();
  }, []);

  // Cargar producción anterior al seleccionar animal
  useEffect(() => {
    if (formulario.animalId) {
      cargarProduccionAnterior();
    }
  }, [formulario.animalId]);

  /**
   * Carga las hembras en lactancia disponibles
   */
  const cargarHembrasLactantes = async () => {
    try {
      const respuesta = await animalService.buscarAnimales({
        sexo: 'hembra',
        estado: 'activo',
        enLactancia: true
      });
      setHembras(respuesta.data);
    } catch (error) {
      console.error('Error al cargar hembras lactantes:', error);
      mostrarMensaje('error', 'Error al cargar la lista de hembras');
    }
  };

  /**
   * Carga la última producción registrada del animal
   */
  const cargarProduccionAnterior = async () => {
    try {
      const respuesta = await produccionService.obtenerUltimaProduccion(
        formulario.animalId
      );
      setProduccionAnterior(respuesta.data);
    } catch (error) {
      console.error('Error al cargar producción anterior:', error);
      setProduccionAnterior(null);
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

    // Limpiar error del campo
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Valida el formulario completo
   */
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar animal
    if (!formulario.animalId) {
      nuevosErrores.animalId = 'Debe seleccionar un animal';
    }

    // Validar fecha
    const validacionFecha = validarFecha(formulario.fecha);
    if (!validacionFecha.valido) {
      nuevosErrores.fecha = validacionFecha.mensaje;
    }

    // Validar número de ordeño
    if (formulario.numeroOrdenio < 1 || formulario.numeroOrdenio > 3) {
      nuevosErrores.numeroOrdenio = 'El número de ordeño debe estar entre 1 y 3';
    }

    // Validar cantidad de litros
    const validacionLitros = validarProduccionLeche(formulario.cantidadLitros);
    if (!validacionLitros.valido) {
      nuevosErrores.cantidadLitros = validacionLitros.mensaje;
    }

    // Validar porcentaje de grasa (opcional)
    if (formulario.porcentajeGrasa) {
      const validacionGrasa = validarPorcentaje(formulario.porcentajeGrasa);
      if (!validacionGrasa.valido) {
        nuevosErrores.porcentajeGrasa = validacionGrasa.mensaje;
      }
    }

    // Validar porcentaje de proteína (opcional)
    if (formulario.porcentajeProteina) {
      const validacionProteina = validarPorcentaje(formulario.porcentajeProteina);
      if (!validacionProteina.valido) {
        nuevosErrores.porcentajeProteina = validacionProteina.mensaje;
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
      const respuesta = await produccionService.registrarProduccion(formulario);
      mostrarMensaje('success', 'Producción registrada exitosamente');

      if (onGuardar) {
        onGuardar(respuesta.data);
      }

      // Limpiar formulario manteniendo fecha y animal
      setFormulario(prev => ({
        ...prev,
        cantidadLitros: '',
        porcentajeGrasa: '',
        porcentajeProteina: '',
        observaciones: '',
        numeroOrdenio: prev.numeroOrdenio < 3 ? prev.numeroOrdenio + 1 : 1
      }));
      setErrores({});

      // Recargar producción anterior
      cargarProduccionAnterior();
    } catch (error) {
      console.error('Error al registrar producción:', error);
      const mensajeError = error.response?.data?.mensaje || 
        'Error al registrar la producción. Intente nuevamente.';
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

  /**
   * Calcula la variación respecto a la producción anterior
   */
  const calcularVariacion = () => {
    if (!produccionAnterior || !formulario.cantidadLitros) {
      return null;
    }

    const diferencia = formulario.cantidadLitros - produccionAnterior.cantidadLitros;
    const porcentaje = (diferencia / produccionAnterior.cantidadLitros) * 100;
    
    return {
      diferencia: diferencia.toFixed(2),
      porcentaje: porcentaje.toFixed(1),
      tendencia: diferencia > 0 ? 'subida' : diferencia < 0 ? 'bajada' : 'igual'
    };
  };

  const variacion = calcularVariacion();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Encabezado */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Droplet className="w-6 h-6 mr-2 text-blue-600" />
          Registro de Producción de Leche
        </h2>
        <p className="text-gray-600 mt-1">
          Registre la producción diaria de cada ordeño.
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

      {/* Producción anterior */}
      {produccionAnterior && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-900 font-medium">
                Última producción registrada
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {produccionAnterior.cantidadLitros} L
              </p>
              <p className="text-xs text-blue-600">
                {new Date(produccionAnterior.fecha).toLocaleDateString()} - 
                Ordeño {produccionAnterior.numeroOrdenio}
              </p>
            </div>
            {variacion && variacion.tendencia !== 'igual' && (
              <div className={`flex items-center ${
                variacion.tendencia === 'subida' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp 
                  className={`w-6 h-6 mr-1 ${
                    variacion.tendencia === 'bajada' ? 'rotate-180' : ''
                  }`} 
                />
                <div className="text-right">
                  <p className="text-lg font-bold">{variacion.porcentaje}%</p>
                  <p className="text-xs">
                    {variacion.diferencia > 0 ? '+' : ''}{variacion.diferencia} L
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={manejarEnvio}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Animal */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animal <span className="text-red-500">*</span>
            </label>
            <select
              name="animalId"
              value={formulario.animalId}
              onChange={manejarCambio}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                ${errores.animalId 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
              disabled={cargando}
            >
              <option value="">Seleccione un animal</option>
              {hembras.map(hembra => (
                <option key={hembra.id} value={hembra.id}>
                  {hembra.identificacion} - {hembra.nombre || 'Sin nombre'}
                </option>
              ))}
            </select>
            {errores.animalId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errores.animalId}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="fecha"
              value={formulario.fecha}
              onChange={manejarCambio}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                ${errores.fecha 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
              disabled={cargando}
            />
            {errores.fecha && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errores.fecha}
              </p>
            )}
          </div>

          {/* Número de ordeño */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Número de Ordeño <span className="text-red-500">*</span>
            </label>
            <select
              name="numeroOrdenio"
              value={formulario.numeroOrdenio}
              onChange={manejarCambio}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="1">1 - Mañana</option>
              <option value="2">2 - Tarde</option>
              <option value="3">3 - Noche</option>
            </select>
          </div>

          {/* Cantidad de litros */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Droplet className="w-4 h-4 inline mr-1" />
              Cantidad (Litros) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="cantidadLitros"
              value={formulario.cantidadLitros}
              onChange={manejarCambio}
              step="0.1"
              min="0"
              placeholder="Ej: 3.5"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                ${errores.cantidadLitros 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
              disabled={cargando}
            />
            {errores.cantidadLitros && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errores.cantidadLitros}
              </p>
            )}
          </div>

          {/* Porcentaje de grasa */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje de Grasa (%)
            </label>
            <input
              type="number"
              name="porcentajeGrasa"
              value={formulario.porcentajeGrasa}
              onChange={manejarCambio}
              step="0.1"
              min="0"
              max="100"
              placeholder="Ej: 3.8"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                ${errores.porcentajeGrasa 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
              disabled={cargando}
            />
            {errores.porcentajeGrasa && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errores.porcentajeGrasa}
              </p>
            )}
          </div>

          {/* Porcentaje de proteína */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje de Proteína (%)
            </label>
            <input
              type="number"
              name="porcentajeProteina"
              value={formulario.porcentajeProteina}
              onChange={manejarCambio}
              step="0.1"
              min="0"
              max="100"
              placeholder="Ej: 3.2"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                ${errores.porcentajeProteina 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
              disabled={cargando}
            />
            {errores.porcentajeProteina && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errores.porcentajeProteina}
              </p>
            )}
          </div>

          {/* Calidad de la leche */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calidad de la Leche
            </label>
            <select
              name="calidadLeche"
              value={formulario.calidadLeche}
              onChange={manejarCambio}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
            </select>
          </div>

          {/* Observaciones */}
          <div className="mb-4 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formulario.observaciones}
              onChange={manejarCambio}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales sobre el ordeño..."
              disabled={cargando}
            />
          </div>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {cargando ? 'Guardando...' : 'Guardar Producción'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroProduccion;
