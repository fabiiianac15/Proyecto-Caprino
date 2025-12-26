/**
 * Componente de Registro/Edición de Cabras
 * Formulario completo con todos los detalles y foto del animal
 */

import React, { useState, useRef } from 'react';
import { 
  Save, 
  X, 
  Upload, 
  Camera,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  Weight,
  Info,
  Sparkles,
  Heart,
  Palette,
  Target,
  Moon,
  Mountain,
  Droplet,
  Beef,
  Baby,
  Users as UsersIcon,
  Activity,
  TrendingUp,
  DollarSign,
  Skull,
  Gift,
  Zap,
  Hourglass,
  Milk,
  CloudOff
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';

const RegistroCabra = ({ cabraEditar, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    // Información básica
    codigo: cabraEditar?.codigo || '',
    nombre: cabraEditar?.nombre || '',
    sexo: cabraEditar?.sexo || '',
    raza: cabraEditar?.raza || '',
    
    // Fechas importantes
    fechaNacimiento: cabraEditar?.fechaNacimiento || '',
    fechaIngreso: cabraEditar?.fechaIngreso || new Date().toISOString().split('T')[0],
    
    // Características físicas
    color: cabraEditar?.color || '',
    pesoNacimiento: cabraEditar?.pesoNacimiento || '',
    pesoActual: cabraEditar?.pesoActual || '',
    
    // Genealogía
    codigoPadre: cabraEditar?.codigoPadre || '',
    codigoMadre: cabraEditar?.codigoMadre || '',
    
    // Estado y salud
    estado: cabraEditar?.estado || 'activo',
    estadoReproductivo: cabraEditar?.estadoReproductivo || '',
    
    // Información adicional
    proposito: cabraEditar?.proposito || '',
    observaciones: cabraEditar?.observaciones || '',
    
    // Foto
    foto: cabraEditar?.foto || null
  });

  const [imagenPreview, setImagenPreview] = useState(cabraEditar?.foto || null);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const inputFotoRef = useRef(null);

  // Opciones para los selectores con iconos
  const opcionesSexo = [
    { 
      value: 'macho', 
      label: 'Macho', 
      icono: <User />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    },
    { 
      value: 'hembra', 
      label: 'Hembra', 
      icono: <Heart />,
      colorFondo: 'bg-pink-100',
      colorIcono: 'text-pink-600'
    }
  ];

  const opcionesRaza = [
    { 
      value: 'Saanen', 
      label: 'Saanen', 
      icono: <Sparkles />,
      colorFondo: 'bg-purple-100',
      colorIcono: 'text-purple-600'
    },
    { 
      value: 'Alpina Francesa', 
      label: 'Alpina Francesa', 
      icono: <Mountain />,
      colorFondo: 'bg-indigo-100',
      colorIcono: 'text-indigo-600'
    },
    { 
      value: 'Toggenburg', 
      label: 'Toggenburg', 
      icono: <Moon />,
      colorFondo: 'bg-gray-100',
      colorIcono: 'text-gray-600'
    },
    { 
      value: 'Nubia', 
      label: 'Nubia', 
      icono: <Sparkles />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    },
    { 
      value: 'LaMancha', 
      label: 'LaMancha', 
      icono: <UsersIcon />,
      colorFondo: 'bg-orange-100',
      colorIcono: 'text-orange-600'
    },
    { 
      value: 'Boer', 
      label: 'Boer', 
      icono: <Beef />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    },
    { 
      value: 'Criolla', 
      label: 'Criolla', 
      icono: <Heart />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'Mestiza', 
      label: 'Mestiza', 
      icono: <Sparkles />,
      colorFondo: 'bg-teal-100',
      colorIcono: 'text-teal-600'
    }
  ];

  const opcionesColor = [
    { 
      value: 'Blanco', 
      label: 'Blanco', 
      icono: <Palette />,
      colorFondo: 'bg-gray-50 border border-gray-200',
      colorIcono: 'text-gray-600'
    },
    { 
      value: 'Negro', 
      label: 'Negro', 
      icono: <Palette />,
      colorFondo: 'bg-gray-800',
      colorIcono: 'text-white'
    },
    { 
      value: 'Marrón', 
      label: 'Marrón', 
      icono: <Palette />,
      colorFondo: 'bg-amber-700',
      colorIcono: 'text-white'
    },
    { 
      value: 'Beige', 
      label: 'Beige', 
      icono: <Palette />,
      colorFondo: 'bg-amber-100',
      colorIcono: 'text-amber-700'
    },
    { 
      value: 'Gris', 
      label: 'Gris', 
      icono: <Palette />,
      colorFondo: 'bg-gray-300',
      colorIcono: 'text-gray-700'
    },
    { 
      value: 'Manchado', 
      label: 'Manchado', 
      icono: <Palette />,
      colorFondo: 'bg-gradient-to-r from-white to-gray-800',
      colorIcono: 'text-gray-600'
    },
    { 
      value: 'Multicolor', 
      label: 'Multicolor', 
      icono: <Palette />,
      colorFondo: 'bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200',
      colorIcono: 'text-gray-700'
    }
  ];

  const opcionesProposito = [
    { 
      value: 'Leche', 
      label: 'Leche', 
      icono: <Droplet />,
      colorFondo: 'bg-cyan-100',
      colorIcono: 'text-cyan-600'
    },
    { 
      value: 'Carne', 
      label: 'Carne', 
      icono: <Beef />,
      colorFondo: 'bg-red-100',
      colorIcono: 'text-red-600'
    },
    { 
      value: 'Doble propósito', 
      label: 'Doble propósito', 
      icono: <Target />,
      colorFondo: 'bg-purple-100',
      colorIcono: 'text-purple-600'
    },
    { 
      value: 'Reproducción', 
      label: 'Reproducción', 
      icono: <Heart />,
      colorFondo: 'bg-pink-100',
      colorIcono: 'text-pink-600'
    },
    { 
      value: 'Cría', 
      label: 'Cría', 
      icono: <Baby />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    }
  ];

  const opcionesEstadoGeneral = [
    { 
      value: 'activo', 
      label: 'Activo', 
      icono: <Activity />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'vendido', 
      label: 'Vendido', 
      icono: <DollarSign />,
      colorFondo: 'bg-blue-100',
      colorIcono: 'text-blue-600'
    },
    { 
      value: 'muerto', 
      label: 'Muerto', 
      icono: <Skull />,
      colorFondo: 'bg-gray-100',
      colorIcono: 'text-gray-600'
    },
    { 
      value: 'donado', 
      label: 'Donado', 
      icono: <Gift />,
      colorFondo: 'bg-purple-100',
      colorIcono: 'text-purple-600'
    }
  ];

  const opcionesEstadoReproductivo = [
    { 
      value: '', 
      label: 'No aplica', 
      icono: <CloudOff />,
      colorFondo: 'bg-gray-100',
      colorIcono: 'text-gray-500'
    },
    { 
      value: 'apta', 
      label: 'Apta para reproducción', 
      icono: <CheckCircle />,
      colorFondo: 'bg-green-100',
      colorIcono: 'text-green-600'
    },
    { 
      value: 'gestante', 
      label: 'Gestante', 
      icono: <Heart />,
      colorFondo: 'bg-pink-100',
      colorIcono: 'text-pink-600'
    },
    { 
      value: 'lactante', 
      label: 'Lactante', 
      icono: <Milk />,
      colorFondo: 'bg-cyan-100',
      colorIcono: 'text-cyan-600'
    },
    { 
      value: 'seca', 
      label: 'Seca', 
      icono: <CloudOff />,
      colorFondo: 'bg-orange-100',
      colorIcono: 'text-orange-600'
    },
    { 
      value: 'joven', 
      label: 'Muy joven', 
      icono: <Baby />,
      colorFondo: 'bg-yellow-100',
      colorIcono: 'text-yellow-600'
    }
  ];

  /**
   * Maneja cambios en los campos del formulario
   */
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Maneja la carga de imagen
   */
  const manejarCambioImagen = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      // Validar tipo de archivo
      if (!archivo.type.startsWith('image/')) {
        setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo de imagen válido' });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (archivo.size > 5 * 1024 * 1024) {
        setMensaje({ tipo: 'error', texto: 'La imagen no debe superar los 5MB' });
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
        setFormData(prev => ({ ...prev, foto: archivo }));
      };
      reader.readAsDataURL(archivo);
    }
  };

  /**
   * Calcula la edad del animal
   */
  const calcularEdad = () => {
    if (!formData.fechaNacimiento) return '';
    
    const hoy = new Date();
    const nacimiento = new Date(formData.fechaNacimiento);
    const diffTime = Math.abs(hoy - nacimiento);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const meses = Math.floor(diffDays / 30);
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else {
      const años = Math.floor(diffDays / 365);
      const meses = Math.floor((diffDays % 365) / 30);
      return `${años} ${años === 1 ? 'año' : 'años'}${meses > 0 ? ` y ${meses} ${meses === 1 ? 'mes' : 'meses'}` : ''}`;
    }
  };

  /**
   * Valida el formulario
   */
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.codigo.trim()) {
      nuevosErrores.codigo = 'El código es obligatorio';
    }

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!formData.sexo) {
      nuevosErrores.sexo = 'El sexo es obligatorio';
    }

    if (!formData.raza) {
      nuevosErrores.raza = 'La raza es obligatoria';
    }

    if (!formData.fechaNacimiento) {
      nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      setMensaje({ tipo: 'error', texto: 'Por favor completa todos los campos obligatorios' });
      return;
    }

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Simular guardado (aquí iría la llamada a la API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMensaje({ tipo: 'success', texto: 'Cabra registrada exitosamente' });
      
      setTimeout(() => {
        onGuardar(formData);
      }, 1500);
    } catch (error) {
      console.error('Error al guardar:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {cabraEditar ? 'Editar Cabra' : 'Registrar Nueva Cabra'}
            </h2>
            <p className="text-gray-600">
              Completa toda la información del animal para un registro detallado
            </p>
          </div>
          <button
            onClick={onCancelar}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={manejarEnvio}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Foto */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Fotografía del Animal
              </h3>
              
              <div className="space-y-4">
                {/* Preview de imagen */}
                <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  {imagenPreview ? (
                    <img 
                      src={imagenPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Camera className="w-16 h-16 mb-2" />
                      <p className="text-sm">Sin fotografía</p>
                    </div>
                  )}
                </div>

                {/* Botones de carga */}
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  onChange={manejarCambioImagen}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Subir Fotografía</span>
                </button>

                {imagenPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagenPreview(null);
                      setFormData(prev => ({ ...prev, foto: null }));
                    }}
                    className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Eliminar Foto
                  </button>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Formatos: JPG, PNG. Máximo 5MB
                </p>
              </div>

              {/* Información de edad si hay fecha de nacimiento */}
              {formData.fechaNacimiento && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Info className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">Edad Actual</p>
                      <p className="text-lg font-bold">{calcularEdad()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mensaje de feedback */}
            {mensaje.texto && (
              <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                mensaje.tipo === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {mensaje.tipo === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{mensaje.texto}</span>
              </div>
            )}

            {/* Sección: Información Básica */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código / ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={manejarCambio}
                    placeholder="Ej: CAB-001"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errores.codigo 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errores.codigo && (
                    <p className="mt-1 text-sm text-red-600">{errores.codigo}</p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={manejarCambio}
                    placeholder="Ej: Luna"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errores.nombre 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errores.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>
                  )}
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexo <span className="text-red-500">*</span>
                  </label>
                  <SelectPersonalizado
                    valor={formData.sexo}
                    onChange={(valor) => manejarCambio({ target: { name: 'sexo', value: valor } })}
                    opciones={opcionesSexo}
                    placeholder="Seleccionar sexo..."
                    error={!!errores.sexo}
                    requerido
                  />
                  {errores.sexo && (
                    <p className="mt-1 text-sm text-red-600">{errores.sexo}</p>
                  )}
                </div>

                {/* Raza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raza <span className="text-red-500">*</span>
                  </label>
                  <SelectPersonalizado
                    valor={formData.raza}
                    onChange={(valor) => manejarCambio({ target: { name: 'raza', value: valor } })}
                    opciones={opcionesRaza}
                    placeholder="Seleccionar raza..."
                    error={!!errores.raza}
                    requerido
                  />
                  {errores.raza && (
                    <p className="mt-1 text-sm text-red-600">{errores.raza}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <SelectPersonalizado
                    valor={formData.color}
                    onChange={(valor) => manejarCambio({ target: { name: 'color', value: valor } })}
                    opciones={opcionesColor}
                    placeholder="Seleccionar color..."
                  />
                </div>

                {/* Propósito */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Propósito
                  </label>
                  <SelectPersonalizado
                    valor={formData.proposito}
                    onChange={(valor) => manejarCambio({ target: { name: 'proposito', value: valor } })}
                    opciones={opcionesProposito}
                    placeholder="Seleccionar propósito..."
                  />
                </div>
              </div>
            </div>

            {/* Sección: Fechas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-600" />
                Fechas Importantes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha de nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={manejarCambio}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errores.fechaNacimiento 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errores.fechaNacimiento && (
                    <p className="mt-1 text-sm text-red-600">{errores.fechaNacimiento}</p>
                  )}
                </div>

                {/* Fecha de ingreso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Ingreso al Rebaño
                  </label>
                  <input
                    type="date"
                    name="fechaIngreso"
                    value={formData.fechaIngreso}
                    onChange={manejarCambio}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Características Físicas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Weight className="w-5 h-5 mr-2 text-green-600" />
                Características Físicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Peso al nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso al Nacimiento (kg)
                  </label>
                  <input
                    type="number"
                    name="pesoNacimiento"
                    value={formData.pesoNacimiento}
                    onChange={manejarCambio}
                    step="0.1"
                    min="0"
                    placeholder="Ej: 3.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Peso actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso Actual (kg)
                  </label>
                  <input
                    type="number"
                    name="pesoActual"
                    value={formData.pesoActual}
                    onChange={manejarCambio}
                    step="0.1"
                    min="0"
                    placeholder="Ej: 45.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Genealogía */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-green-600" />
                Genealogía
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código del padre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código del Padre (Macho Reproductor)
                  </label>
                  <input
                    type="text"
                    name="codigoPadre"
                    value={formData.codigoPadre}
                    onChange={manejarCambio}
                    placeholder="Ej: CAB-M-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Código de la madre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de la Madre
                  </label>
                  <input
                    type="text"
                    name="codigoMadre"
                    value={formData.codigoMadre}
                    onChange={manejarCambio}
                    placeholder="Ej: CAB-H-002"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Estado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Estado del Animal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estado general */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado General
                  </label>
                  <SelectPersonalizado
                    valor={formData.estado}
                    onChange={(valor) => manejarCambio({ target: { name: 'estado', value: valor } })}
                    opciones={opcionesEstadoGeneral}
                    placeholder="Seleccionar estado..."
                  />
                </div>

                {/* Estado reproductivo (solo si es hembra) */}
                {formData.sexo === 'hembra' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado Reproductivo
                    </label>
                    <SelectPersonalizado
                      valor={formData.estadoReproductivo}
                      onChange={(valor) => manejarCambio({ target: { name: 'estadoReproductivo', value: valor } })}
                      opciones={opcionesEstadoReproductivo}
                      placeholder="Seleccionar estado reproductivo..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Observaciones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Observaciones Adicionales
              </h3>
              
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={manejarCambio}
                rows="4"
                placeholder="Características especiales, señas particulares, comportamiento, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Botones de acción */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{cabraEditar ? 'Actualizar' : 'Guardar'} Cabra</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistroCabra;
