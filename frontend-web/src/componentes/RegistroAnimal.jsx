/**
 * Componente de formulario para registro de animales
 * Permite crear y editar animales con validación completa
 */

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  AlertCircle, 
  Calendar, 
  Tag, 
  Users 
} from 'lucide-react';
import { 
  validarIdentificacion, 
  validarPeso, 
  validarFecha 
} from '../utilidades/validaciones';
import { animalesAPI, razasAPI } from '../servicios/caprino-api';

const RegistroAnimal = ({ animalEditar = null, onGuardar, onCancelar }) => {
  // Estado inicial del formulario
  const formularioInicial = {
    identificacion: '',
    nombre: '',
    sexo: 'hembra',
    fechaNacimiento: '',
    razaId: '',
    colorPelaje: '',
    padreId: null,
    madreId: null,
    pesoNacimiento: '',
    numeroPartos: 0,
    estado: 'activo',
    observaciones: '',
    fotoUrl: ''
  };

  const [formulario, setFormulario] = useState(formularioInicial);
  const [errores, setErrores] = useState({});
  const [razas, setRazas] = useState([]);
  const [machos, setMachos] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar datos necesarios al montar el componente
  useEffect(() => {
    cargarDatosIniciales();
    if (animalEditar) {
      setFormulario(animalEditar);
    }
  }, [animalEditar]);

  /**
   * Carga razas y animales reproductores disponibles
   */
  const cargarDatosIniciales = async () => {
    try {
      // Cargar razas disponibles
      const datosRazas = await razasAPI.getAll();
      setRazas(datosRazas);

      // Cargar machos reproductores
      const respuestaMachos = await animalesAPI.search({ 
        sexo: 'Macho', 
        estadoGeneral: 'Sano' 
      });
      setMachos(respuestaMachos['hydra:member'] || respuestaMachos);

      // Cargar hembras reproductoras
      const respuestaHembras = await animalesAPI.search({ 
        sexo: 'Hembra', 
        estadoGeneral: 'Sano' 
      });
      setHembras(respuestaHembras['hydra:member'] || respuestaHembras);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      mostrarMensaje('error', 'Error al cargar datos del formulario');
    }
  };

  /**
   * Maneja cambios en los campos del formulario
   */
  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo modificado
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Valida todos los campos del formulario
   */
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar identificación
    const validacionId = validarIdentificacion(formulario.identificacion);
    if (!validacionId.valido) {
      nuevosErrores.identificacion = validacionId.mensaje;
    }

    // Validar sexo
    if (!['macho', 'hembra'].includes(formulario.sexo)) {
      nuevosErrores.sexo = 'Debe seleccionar un sexo válido';
    }

    // Validar fecha de nacimiento
    const validacionFecha = validarFecha(formulario.fechaNacimiento);
    if (!validacionFecha.valido) {
      nuevosErrores.fechaNacimiento = validacionFecha.mensaje;
    }

    // Validar raza
    if (!formulario.razaId) {
      nuevosErrores.razaId = 'Debe seleccionar una raza';
    }

    // Validar peso de nacimiento
    if (formulario.pesoNacimiento) {
      const validacionPeso = validarPeso(formulario.pesoNacimiento);
      if (!validacionPeso.valido) {
        nuevosErrores.pesoNacimiento = validacionPeso.mensaje;
      }
    }

    // Validar número de partos (solo para hembras)
    if (formulario.sexo === 'hembra' && formulario.numeroPartos < 0) {
      nuevosErrores.numeroPartos = 'El número de partos no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Envía el formulario al backend
   */
  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    
    console.log('=== REGISTRO ANIMAL - manejarEnvio llamado');
    console.log('=== REGISTRO ANIMAL - Formulario:', formulario);
    
    if (!validarFormulario()) {
      console.log('=== REGISTRO ANIMAL - Validación falló');
      mostrarMensaje('error', 'Por favor corrija los errores en el formulario');
      return;
    }

    console.log('=== REGISTRO ANIMAL - Validación pasó, guardando...');
    
    setCargando(true);
    try {
      let respuesta;
      if (animalEditar) {
        // Actualizar animal existente
        console.log('=== REGISTRO ANIMAL - Actualizando animal:', animalEditar.id);
        respuesta = await animalesAPI.update(
          animalEditar.id, 
          formulario
        );
        mostrarMensaje('success', 'Animal actualizado exitosamente');
      } else {
        // Crear nuevo animal
        console.log('=== REGISTRO ANIMAL - Creando nuevo animal');
        respuesta = await animalesAPI.create(formulario);
        console.log('=== REGISTRO ANIMAL - Respuesta recibida:', respuesta);
        mostrarMensaje('success', 'Animal registrado exitosamente');
      }

      // Notificar al componente padre
      if (onGuardar) {
        console.log('=== REGISTRO ANIMAL - Llamando onGuardar callback');
        onGuardar(respuesta);
      } else {
        console.log('=== REGISTRO ANIMAL - No hay callback onGuardar');
      }

      // Limpiar formulario si es registro nuevo
      if (!animalEditar) {
        setFormulario(formularioInicial);
        setErrores({});
      }
    } catch (error) {
      console.error('=== REGISTRO ANIMAL - Error al guardar:', error);
      const mensajeError = error.message || 
        'Error al guardar el animal. Intente nuevamente.';
      mostrarMensaje('error', mensajeError);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Muestra mensaje de éxito o error
   */
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 5000);
  };

  /**
   * Renderiza campo de entrada con validación
   */
  const renderCampo = (nombre, etiqueta, tipo = 'text', opciones = {}) => {
    const error = errores[nombre];
    
    return (
      <div className="mb-4">
        <label 
          htmlFor={nombre}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {etiqueta}
          {opciones.requerido && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={tipo}
          id={nombre}
          name={nombre}
          value={formulario[nombre]}
          onChange={manejarCambio}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
            ${error 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
            }`}
          disabled={cargando}
          {...opciones}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Encabezado */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Tag className="w-6 h-6 mr-2 text-blue-600" />
          {animalEditar ? 'Editar Animal' : 'Registrar Nuevo Animal'}
        </h2>
        <p className="text-gray-600 mt-1">
          Complete la información del animal. Los campos con * son obligatorios.
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

      {/* Formulario */}
      <form onSubmit={manejarEnvio}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Identificación */}
          {renderCampo(
            'identificacion', 
            'Identificación', 
            'text', 
            { 
              requerido: true, 
              placeholder: 'Ej: CAP-001' 
            }
          )}

          {/* Nombre */}
          {renderCampo(
            'nombre', 
            'Nombre', 
            'text', 
            { 
              placeholder: 'Nombre del animal (opcional)' 
            }
          )}

          {/* Sexo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sexo <span className="text-red-500">*</span>
            </label>
            <select
              name="sexo"
              value={formulario.sexo}
              onChange={manejarCambio}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="hembra">Hembra</option>
              <option value="macho">Macho</option>
            </select>
          </div>

          {/* Fecha de nacimiento */}
          {renderCampo(
            'fechaNacimiento', 
            'Fecha de Nacimiento', 
            'date', 
            { 
              requerido: true,
              max: new Date().toISOString().split('T')[0]
            }
          )}

          {/* Raza */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raza <span className="text-red-500">*</span>
            </label>
            <select
              name="razaId"
              value={formulario.razaId}
              onChange={manejarCambio}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 
                ${errores.razaId 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
              disabled={cargando}
            >
              <option value="">Seleccione una raza</option>
              {razas.map(raza => (
                <option key={raza.id} value={raza.id}>
                  {raza.nombre}
                </option>
              ))}
            </select>
            {errores.razaId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errores.razaId}
              </p>
            )}
          </div>

          {/* Color de pelaje */}
          {renderCampo(
            'colorPelaje', 
            'Color de Pelaje', 
            'text', 
            { 
              placeholder: 'Ej: Blanco, Café, Negro con blanco'
            }
          )}

          {/* Peso al nacimiento */}
          {renderCampo(
            'pesoNacimiento', 
            'Peso al Nacimiento (kg)', 
            'number', 
            { 
              step: '0.1',
              min: '0',
              placeholder: 'Ej: 2.5'
            }
          )}

          {/* Padre */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Padre (Macho)
            </label>
            <select
              name="padreId"
              value={formulario.padreId || ''}
              onChange={manejarCambio}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="">Sin padre registrado</option>
              {machos.map(macho => (
                <option key={macho.id} value={macho.id}>
                  {macho.identificacion} - {macho.nombre || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* Madre */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Madre (Hembra)
            </label>
            <select
              name="madreId"
              value={formulario.madreId || ''}
              onChange={manejarCambio}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="">Sin madre registrada</option>
              {hembras.map(hembra => (
                <option key={hembra.id} value={hembra.id}>
                  {hembra.identificacion} - {hembra.nombre || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* Número de partos (solo para hembras) */}
          {formulario.sexo === 'hembra' && renderCampo(
            'numeroPartos', 
            'Número de Partos', 
            'number', 
            { 
              min: '0',
              placeholder: '0'
            }
          )}

          {/* Estado */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={formulario.estado}
              onChange={manejarCambio}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={cargando}
            >
              <option value="activo">Activo</option>
              <option value="vendido">Vendido</option>
              <option value="muerto">Muerto</option>
              <option value="descartado">Descartado</option>
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
              placeholder="Información adicional sobre el animal..."
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
            {cargando ? 'Guardando...' : 'Guardar Animal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroAnimal;
