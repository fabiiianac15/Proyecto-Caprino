/**
 * Módulo Completo de Perfil de Usuario y Configuración de Granja
 * Gestión de datos personales, foto de perfil e información de la finca
 */

import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Edit,
  Save,
  X,
  Building,
  FileText,
  Users,
  Droplet,
  MapPinned,
  Globe,
  Briefcase,
  Award,
  Shield,
  Key,
  Bell,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

const PerfilUsuario = ({ onCerrar }) => {
  const [seccionActiva, setSeccionActiva] = useState('personal');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef(null);

  const [datosUsuario, setDatosUsuario] = useState({
    // Datos personales
    nombre: 'Juan Pérez',
    email: 'juan.perez@granja.com',
    telefono: '+57 300 123 4567',
    direccion: 'Vereda El Carmen, Finca La Esperanza',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    fechaNacimiento: '1985-05-15',
    cedula: '1234567890',
    rol: 'Administrador',
    fechaRegistro: '2024-01-15',
    fotoPerfil: null,

    // Datos de la granja
    nombreGranja: 'Finca La Esperanza',
    tipoProduccion: 'Leche y Carne',
    numeroAnimales: 124,
    razaPrincipal: 'Saanen',
    areaTotal: '15 hectáreas',
    sistemaManejoProductivo: 'Semi-estabulado',
    capacidadInstalada: 200,
    
    // Ubicación granja
    coordenadasGPS: '6.2442° N, 75.5812° W',
    altitud: '1,495 msnm',
    temperaturaPromedio: '24°C',
    precipitacion: '1,500 mm/año',

    // Información legal
    nit: '900123456-7',
    ica: 'ICA-2024-001234',
    registroGanadero: 'RG-ANT-2024-5678',
    licenciaAmbiental: 'LA-2023-9876'
  });

  const [imagenPreview, setImagenPreview] = useState(null);

  const secciones = [
    { id: 'personal', nombre: 'Datos Personales', icono: User },
    { id: 'granja', nombre: 'Información de Granja', icono: Building },
    { id: 'ubicacion', nombre: 'Ubicación y Clima', icono: MapPin },
    { id: 'legal', nombre: 'Documentación Legal', icono: FileText },
    { id: 'seguridad', nombre: 'Seguridad', icono: Shield },
    { id: 'notificaciones', nombre: 'Notificaciones', icono: Bell }
  ];

  const manejarCambio = (campo, valor) => {
    setDatosUsuario(prev => ({ ...prev, [campo]: valor }));
  };

  const manejarCambioFoto = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
        setDatosUsuario(prev => ({ ...prev, fotoPerfil: archivo }));
      };
      reader.readAsDataURL(archivo);
    }
  };

  const manejarGuardar = async () => {
    setGuardando(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Guardar datos:', datosUsuario);
    // TODO: Llamada a API para guardar

    setGuardando(false);
    setModoEdicion(false);
  };

  const renderSeccionPersonal = () => (
    <div className="space-y-6">
      {/* Foto de perfil */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-green-600" />
          Foto de Perfil
        </h3>
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
              {imagenPreview || datosUsuario.fotoPerfil ? (
                <img 
                  src={imagenPreview || datosUsuario.fotoPerfil} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            {modoEdicion && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors shadow-lg"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={manejarCambioFoto}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-800">{datosUsuario.nombre}</h4>
            <p className="text-green-600 font-medium">{datosUsuario.rol}</p>
            <p className="text-sm text-gray-600 mt-2">
              Miembro desde {new Date(datosUsuario.fechaRegistro).toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            {modoEdicion && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Cambiar Foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoFormulario
          icono={User}
          etiqueta="Nombre Completo"
          valor={datosUsuario.nombre}
          campo="nombre"
          editable={modoEdicion}
          onChange={manejarCambio}
          required
        />
        
        <CampoFormulario
          icono={Mail}
          etiqueta="Correo Electrónico"
          valor={datosUsuario.email}
          campo="email"
          tipo="email"
          editable={modoEdicion}
          onChange={manejarCambio}
          required
        />

        <CampoFormulario
          icono={Phone}
          etiqueta="Teléfono"
          valor={datosUsuario.telefono}
          campo="telefono"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Calendar}
          etiqueta="Fecha de Nacimiento"
          valor={datosUsuario.fechaNacimiento}
          campo="fechaNacimiento"
          tipo="date"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={FileText}
          etiqueta="Cédula"
          valor={datosUsuario.cedula}
          campo="cedula"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Briefcase}
          etiqueta="Rol"
          valor={datosUsuario.rol}
          campo="rol"
          editable={false}
        />
      </div>

      {/* Dirección */}
      <div className="space-y-4">
        <CampoFormulario
          icono={MapPin}
          etiqueta="Dirección"
          valor={datosUsuario.direccion}
          campo="direccion"
          editable={modoEdicion}
          onChange={manejarCambio}
          fullWidth
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CampoFormulario
            icono={MapPinned}
            etiqueta="Ciudad"
            valor={datosUsuario.ciudad}
            campo="ciudad"
            editable={modoEdicion}
            onChange={manejarCambio}
          />

          <CampoFormulario
            icono={MapPinned}
            etiqueta="Departamento"
            valor={datosUsuario.departamento}
            campo="departamento"
            editable={modoEdicion}
            onChange={manejarCambio}
          />
        </div>
      </div>
    </div>
  );

  const renderSeccionGranja = () => (
    <div className="space-y-6">
      {/* Encabezado granja */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{datosUsuario.nombreGranja}</h3>
            <p className="text-blue-600 font-medium">{datosUsuario.tipoProduccion}</p>
          </div>
        </div>
      </div>

      {/* Información de producción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoFormulario
          icono={Building}
          etiqueta="Nombre de la Granja"
          valor={datosUsuario.nombreGranja}
          campo="nombreGranja"
          editable={modoEdicion}
          onChange={manejarCambio}
          required
        />

        <CampoFormulario
          icono={Droplet}
          etiqueta="Tipo de Producción"
          valor={datosUsuario.tipoProduccion}
          campo="tipoProduccion"
          editable={modoEdicion}
          onChange={manejarCambio}
          tipo="select"
          opciones={['Leche', 'Carne', 'Leche y Carne', 'Mixta']}
        />

        <CampoFormulario
          icono={Users}
          etiqueta="Número de Animales"
          valor={datosUsuario.numeroAnimales}
          campo="numeroAnimales"
          tipo="number"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Award}
          etiqueta="Raza Principal"
          valor={datosUsuario.razaPrincipal}
          campo="razaPrincipal"
          editable={modoEdicion}
          onChange={manejarCambio}
          tipo="select"
          opciones={['Saanen', 'Alpina Francesa', 'Toggenburg', 'Murciana-Granadina', 'Boer', 'Criolla']}
        />

        <CampoFormulario
          icono={MapPin}
          etiqueta="Área Total"
          valor={datosUsuario.areaTotal}
          campo="areaTotal"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Settings}
          etiqueta="Sistema de Manejo"
          valor={datosUsuario.sistemaManejoProductivo}
          campo="sistemaManejoProductivo"
          editable={modoEdicion}
          onChange={manejarCambio}
          tipo="select"
          opciones={['Estabulado', 'Semi-estabulado', 'Pastoreo', 'Mixto']}
        />

        <CampoFormulario
          icono={Users}
          etiqueta="Capacidad Instalada"
          valor={datosUsuario.capacidadInstalada}
          campo="capacidadInstalada"
          tipo="number"
          editable={modoEdicion}
          onChange={manejarCambio}
        />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <EstadisticaGranja
          icono={Users}
          valor={datosUsuario.numeroAnimales}
          etiqueta="Animales"
          color="blue"
        />
        <EstadisticaGranja
          icono={Droplet}
          valor="485 L/día"
          etiqueta="Producción"
          color="cyan"
        />
        <EstadisticaGranja
          icono={MapPin}
          valor={datosUsuario.areaTotal}
          etiqueta="Área"
          color="green"
        />
        <EstadisticaGranja
          icono={Award}
          valor={datosUsuario.razaPrincipal}
          etiqueta="Raza Principal"
          color="purple"
        />
      </div>
    </div>
  );

  const renderSeccionUbicacion = () => (
    <div className="space-y-6">
      {/* Mapa placeholder */}
      <div className="bg-gray-100 rounded-lg h-64 border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Mapa de ubicación</p>
          <p className="text-sm text-gray-500">Integración con Google Maps</p>
        </div>
      </div>

      {/* Datos de ubicación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoFormulario
          icono={Globe}
          etiqueta="Coordenadas GPS"
          valor={datosUsuario.coordenadasGPS}
          campo="coordenadasGPS"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={MapPin}
          etiqueta="Altitud"
          valor={datosUsuario.altitud}
          campo="altitud"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={AlertCircle}
          etiqueta="Temperatura Promedio"
          valor={datosUsuario.temperaturaPromedio}
          campo="temperaturaPromedio"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Droplet}
          etiqueta="Precipitación Anual"
          valor={datosUsuario.precipitacion}
          campo="precipitacion"
          editable={modoEdicion}
          onChange={manejarCambio}
        />
      </div>
    </div>
  );

  const renderSeccionLegal = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800">Documentación Legal</h4>
            <p className="text-sm text-gray-600 mt-1">
              Mantenga actualizada la información legal de su granja para cumplir con las normativas vigentes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoFormulario
          icono={FileText}
          etiqueta="NIT"
          valor={datosUsuario.nit}
          campo="nit"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Award}
          etiqueta="Registro ICA"
          valor={datosUsuario.ica}
          campo="ica"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Users}
          etiqueta="Registro Ganadero"
          valor={datosUsuario.registroGanadero}
          campo="registroGanadero"
          editable={modoEdicion}
          onChange={manejarCambio}
        />

        <CampoFormulario
          icono={Shield}
          etiqueta="Licencia Ambiental"
          valor={datosUsuario.licenciaAmbiental}
          campo="licenciaAmbiental"
          editable={modoEdicion}
          onChange={manejarCambio}
        />
      </div>

      {/* Estado de documentos */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-semibold text-gray-800 mb-3">Estado de Documentos</h4>
        <div className="space-y-2">
          <DocumentoEstado nombre="NIT" estado="vigente" />
          <DocumentoEstado nombre="Registro ICA" estado="vigente" />
          <DocumentoEstado nombre="Registro Ganadero" estado="vigente" />
          <DocumentoEstado nombre="Licencia Ambiental" estado="proximo_vencer" />
        </div>
      </div>
    </div>
  );

  const renderSeccionSeguridad = () => (
    <div className="space-y-6">
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800">Seguridad de la Cuenta</h4>
            <p className="text-sm text-gray-600 mt-1">
              Protege tu cuenta con una contraseña segura y mantén tu información actualizada.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-800">Cambiar Contraseña</p>
                <p className="text-sm text-gray-600">Última actualización: hace 3 meses</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-800">Autenticación de Dos Factores</p>
                <p className="text-sm text-gray-600">Desactivada</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-800">Sesiones Activas</p>
                <p className="text-sm text-gray-600">Gestionar dispositivos conectados</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>
    </div>
  );

  const renderSeccionNotificaciones = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <Bell className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800">Preferencias de Notificaciones</h4>
            <p className="text-sm text-gray-600 mt-1">
              Configura cómo y cuándo quieres recibir notificaciones del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <OpcionNotificacion
          titulo="Alertas de Reproducción"
          descripcion="Partos próximos, diagnósticos pendientes"
          activa={true}
        />
        <OpcionNotificacion
          titulo="Alertas de Salud"
          descripcion="Vacunas, tratamientos, enfermedades"
          activa={true}
        />
        <OpcionNotificacion
          titulo="Alertas de Producción"
          descripcion="Bajadas de producción, calidad de leche"
          activa={true}
        />
        <OpcionNotificacion
          titulo="Reportes Automáticos"
          descripcion="Envío de reportes mensuales por email"
          activa={false}
        />
        <OpcionNotificacion
          titulo="Notificaciones Push"
          descripcion="Notificaciones en tiempo real"
          activa={true}
        />
      </div>
    </div>
  );

  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'personal':
        return renderSeccionPersonal();
      case 'granja':
        return renderSeccionGranja();
      case 'ubicacion':
        return renderSeccionUbicacion();
      case 'legal':
        return renderSeccionLegal();
      case 'seguridad':
        return renderSeccionSeguridad();
      case 'notificaciones':
        return renderSeccionNotificaciones();
      default:
        return renderSeccionPersonal();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-6 h-6 text-white mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-white">Mi Perfil</h2>
              <p className="text-sm text-green-100">Gestiona tu información personal y de granja</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white hover:text-green-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar de navegación */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <nav className="p-4 space-y-1">
              {secciones.map(seccion => {
                const IconoSeccion = seccion.icono;
                const isActive = seccionActiva === seccion.id;
                return (
                  <button
                    key={seccion.id}
                    onClick={() => setSeccionActiva(seccion.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconoSeccion className="w-5 h-5 mr-3" />
                    <span className="font-medium text-sm">{seccion.nombre}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Área de contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderSeccion()}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onCerrar}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cerrar
          </button>
          
          <div className="flex gap-3">
            {modoEdicion ? (
              <>
                <button
                  onClick={() => setModoEdicion(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={manejarGuardar}
                  disabled={guardando}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setModoEdicion(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente Campo de Formulario
 */
const CampoFormulario = ({ 
  icono: Icono, 
  etiqueta, 
  valor, 
  campo, 
  tipo = 'text', 
  editable, 
  onChange, 
  required = false,
  fullWidth = false,
  opciones = []
}) => {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <div className="flex items-center">
          {Icono && <Icono className="w-4 h-4 mr-2 text-gray-500" />}
          {etiqueta}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </label>
      {editable ? (
        tipo === 'select' ? (
          <select
            value={valor}
            onChange={(e) => onChange(campo, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {opciones.map(opcion => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </select>
        ) : (
          <input
            type={tipo}
            value={valor}
            onChange={(e) => onChange(campo, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required={required}
          />
        )
      ) : (
        <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
          {valor || '-'}
        </div>
      )}
    </div>
  );
};

/**
 * Componente Estadística de Granja
 */
const EstadisticaGranja = ({ icono: Icono, valor, etiqueta, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${colorClasses[color]}`}>
      <Icono className="w-6 h-6 mb-2" />
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-sm opacity-75">{etiqueta}</p>
    </div>
  );
};

/**
 * Componente Estado de Documento
 */
const DocumentoEstado = ({ nombre, estado }) => {
  const estados = {
    vigente: { color: 'text-green-600', icono: CheckCircle, texto: 'Vigente' },
    proximo_vencer: { color: 'text-yellow-600', icono: AlertCircle, texto: 'Próximo a vencer' },
    vencido: { color: 'text-red-600', icono: AlertCircle, texto: 'Vencido' }
  };

  const estadoActual = estados[estado];
  const IconoEstado = estadoActual.icono;

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border">
      <span className="text-sm font-medium text-gray-700">{nombre}</span>
      <div className={`flex items-center ${estadoActual.color}`}>
        <IconoEstado className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">{estadoActual.texto}</span>
      </div>
    </div>
  );
};

/**
 * Componente Opción de Notificación
 */
const OpcionNotificacion = ({ titulo, descripcion, activa }) => {
  const [enabled, setEnabled] = useState(activa);

  return (
    <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{titulo}</h4>
        <p className="text-sm text-gray-600">{descripcion}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export default PerfilUsuario;
