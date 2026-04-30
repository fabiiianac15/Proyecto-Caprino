import React, { useState, useRef, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Camera, Edit, Save, X,
  Building, FileText, Users, Droplet, MapPinned, Globe, Briefcase,
  Award, Shield, Key, Bell, Settings, ChevronRight, CheckCircle,
  AlertCircle, Upload, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contextos/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ETIQUETAS_ROL = {
  administrador: 'Administrador de Granja',
  pasante:       'Pasante',
  veterinario:   'Veterinario',
  zootecnista:   'Zootecnista',
  tecnico:       'Técnico',
};

// ─── Componente principal ──────────────────────────────────────────────────────
const PerfilUsuario = ({ onCerrar }) => {
  const { usuario, token } = useAuth();
  const [seccionActiva, setSeccionActiva]   = useState('personal');
  const [modoEdicion, setModoEdicion]       = useState(false);
  const [guardando, setGuardando]           = useState(false);
  const [cargando, setCargando]             = useState(true);
  const [mensaje, setMensaje]               = useState({ tipo: '', texto: '' });
  const fileInputRef = useRef(null);

  const [datosUsuario, setDatosUsuario] = useState({
    nombre: '', email: '', telefono: '', cedula: '',
    fechaNacimiento: '', direccion: '', ciudad: '', departamento: '',
    rol: '', fotoPerfil: null,
    nombreGranja: 'Granja Experimental UFPSO',
    tipoProduccion: 'Leche y Carne', areaTotal: '',
    sistemaManejo: '', capacidadInstalada: '',
    coordenadasGPS: '8°14\'20"N, 73°21\'21"W',
    altitud: '1.200 msnm', temperaturaPromedio: '21°C',
    precipitacion: '1.400 mm/año',
    nit: '', ica: '', registroGanadero: '', licenciaAmbiental: '',
    notifReproduccion: true, notifSalud: true, notifProduccion: true,
    notifReportes: false, notifPush: true,
  });

  const [imagenPreview, setImagenPreview] = useState(null);

  // ─── Password change state ───────────────────────────────────────────────────
  const [pwForm, setPwForm]         = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwMostrar, setPwMostrar]   = useState({ actual: false, nueva: false });
  const [pwGuardando, setPwGuardando] = useState(false);
  const [pwMensaje, setPwMensaje]   = useState({ tipo: '', texto: '' });

  // ─── Cargar perfil al abrir ──────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      // Datos base del usuario autenticado
      if (usuario) {
        setDatosUsuario(prev => ({
          ...prev,
          nombre: usuario.nombre || usuario.nombre_completo || '',
          email:  usuario.email  || '',
          rol:    ETIQUETAS_ROL[usuario.rol] || usuario.rol || '',
        }));
      }

      // Datos extendidos del perfil
      try {
        const res = await fetch(`${API_URL}/perfil`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const perfil = await res.json();
          setDatosUsuario(prev => ({ ...prev, ...perfil }));
        }
      } catch (e) {
        // Si falla la carga del perfil, los defaults son suficientes
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [usuario, token]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

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
    try {
      const res = await fetch(`${API_URL}/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosUsuario),
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('success', 'Perfil guardado correctamente');
        setModoEdicion(false);
      } else {
        mostrarMensaje('error', data.error || 'Error al guardar');
      }
    } catch {
      mostrarMensaje('error', 'Error de conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarPassword = async (e) => {
    e.preventDefault();
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (pwForm.nueva.length < 8) {
      setPwMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }
    setPwGuardando(true);
    setPwMensaje({ tipo: '', texto: '' });
    try {
      const res = await fetch(`${API_URL}/perfil/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password_actual: pwForm.actual, password_nueva: pwForm.nueva }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMensaje({ tipo: 'success', texto: 'Contraseña actualizada correctamente' });
        setPwForm({ actual: '', nueva: '', confirmar: '' });
      } else {
        setPwMensaje({ tipo: 'error', texto: data.error || 'Error al cambiar la contraseña' });
      }
    } catch {
      setPwMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setPwGuardando(false);
    }
  };

  const secciones = [
    { id: 'personal',       nombre: 'Datos Personales',      icono: User     },
    { id: 'granja',         nombre: 'Información de Granja', icono: Building },
    { id: 'ubicacion',      nombre: 'Ubicación y Clima',     icono: MapPin   },
    { id: 'legal',          nombre: 'Documentación Legal',   icono: FileText },
    { id: 'seguridad',      nombre: 'Seguridad',             icono: Shield   },
    { id: 'notificaciones', nombre: 'Notificaciones',        icono: Bell     },
  ];

  // ─── Secciones ───────────────────────────────────────────────────────────────

  const renderSeccionPersonal = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-green-600" />
          Foto de Perfil
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
              {imagenPreview ? (
                <img src={imagenPreview} alt="Perfil" className="w-full h-full object-cover" />
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={manejarCambioFoto} className="hidden" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-gray-800">{datosUsuario.nombre}</h4>
            <p className="text-green-600 font-medium">{datosUsuario.rol}</p>
            <p className="text-sm text-gray-500 mt-1">{datosUsuario.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo icono={User}     label="Nombre Completo"  campo="nombre"          valor={datosUsuario.nombre}          editable={modoEdicion} onChange={manejarCambio} required />
        <Campo icono={Mail}     label="Correo Electrónico" campo="email"         valor={datosUsuario.email}           editable={false} />
        <Campo icono={Phone}    label="Teléfono"          campo="telefono"        valor={datosUsuario.telefono}        editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Calendar} label="Fecha de Nacimiento" campo="fechaNacimiento" valor={datosUsuario.fechaNacimiento} editable={modoEdicion} onChange={manejarCambio} tipo="date" />
        <Campo icono={FileText} label="Cédula"            campo="cedula"          valor={datosUsuario.cedula}          editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Briefcase} label="Rol"              campo="rol"             valor={datosUsuario.rol}             editable={false} />
      </div>
      <div className="space-y-4">
        <Campo icono={MapPin}   label="Dirección"         campo="direccion"       valor={datosUsuario.direccion}       editable={modoEdicion} onChange={manejarCambio} fullWidth />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo icono={MapPinned} label="Ciudad"         campo="ciudad"          valor={datosUsuario.ciudad}          editable={modoEdicion} onChange={manejarCambio} />
          <Campo icono={MapPinned} label="Departamento"   campo="departamento"    valor={datosUsuario.departamento}    editable={modoEdicion} onChange={manejarCambio} />
        </div>
      </div>
    </div>
  );

  const renderSeccionGranja = () => (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo icono={Building} label="Nombre de la Granja"  campo="nombreGranja"       valor={datosUsuario.nombreGranja}       editable={modoEdicion} onChange={manejarCambio} required />
        <Campo icono={Droplet}  label="Tipo de Producción"   campo="tipoProduccion"     valor={datosUsuario.tipoProduccion}     editable={modoEdicion} onChange={manejarCambio} tipo="select" opciones={['Leche','Carne','Leche y Carne','Mixta']} />
        <Campo icono={MapPin}   label="Área Total"           campo="areaTotal"          valor={datosUsuario.areaTotal}          editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Settings} label="Sistema de Manejo"    campo="sistemaManejo"      valor={datosUsuario.sistemaManejo}      editable={modoEdicion} onChange={manejarCambio} tipo="select" opciones={['Estabulado','Semi-estabulado','Pastoreo','Mixto']} />
        <Campo icono={Users}    label="Capacidad Instalada"  campo="capacidadInstalada" valor={datosUsuario.capacidadInstalada} editable={modoEdicion} onChange={manejarCambio} tipo="number" />
      </div>
    </div>
  );

  const renderSeccionUbicacion = () => (
    <div className="space-y-6">
      <div className="bg-gray-100 rounded-lg h-48 border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Granja Experimental UFPSO — Ocaña, Norte de Santander</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo icono={Globe}        label="Coordenadas GPS"       campo="coordenadasGPS"     valor={datosUsuario.coordenadasGPS}     editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={MapPin}       label="Altitud"               campo="altitud"            valor={datosUsuario.altitud}            editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={AlertCircle}  label="Temperatura Promedio"  campo="temperaturaPromedio" valor={datosUsuario.temperaturaPromedio} editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Droplet}      label="Precipitación Anual"   campo="precipitacion"      valor={datosUsuario.precipitacion}      editable={modoEdicion} onChange={manejarCambio} />
      </div>
    </div>
  );

  const renderSeccionLegal = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-700">Mantenga actualizada la información legal de su granja para cumplir con las normativas vigentes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo icono={FileText} label="NIT"                campo="nit"                valor={datosUsuario.nit}                editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Award}    label="Registro ICA"       campo="ica"                valor={datosUsuario.ica}                editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Users}    label="Registro Ganadero"  campo="registroGanadero"   valor={datosUsuario.registroGanadero}   editable={modoEdicion} onChange={manejarCambio} />
        <Campo icono={Shield}   label="Licencia Ambiental" campo="licenciaAmbiental"  valor={datosUsuario.licenciaAmbiental}  editable={modoEdicion} onChange={manejarCambio} />
      </div>
    </div>
  );

  const renderSeccionSeguridad = () => (
    <div className="space-y-6">
      <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-start gap-3">
        <Shield className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-700">Mantén tu cuenta protegida con una contraseña segura.</p>
      </div>

      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
          <Key className="w-5 h-5 mr-2 text-gray-600" />
          Cambiar Contraseña
        </h3>

        {pwMensaje.texto && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${pwMensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {pwMensaje.texto}
          </div>
        )}

        <form onSubmit={manejarCambiarPassword} className="space-y-4">
          <CampoPassword
            label="Contraseña actual"
            value={pwForm.actual}
            mostrar={pwMostrar.actual}
            onChange={v => setPwForm(p => ({ ...p, actual: v }))}
            onToggleMostrar={() => setPwMostrar(p => ({ ...p, actual: !p.actual }))}
          />
          <CampoPassword
            label="Nueva contraseña"
            value={pwForm.nueva}
            mostrar={pwMostrar.nueva}
            onChange={v => setPwForm(p => ({ ...p, nueva: v }))}
            onToggleMostrar={() => setPwMostrar(p => ({ ...p, nueva: !p.nueva }))}
          />
          <CampoPassword
            label="Confirmar nueva contraseña"
            value={pwForm.confirmar}
            mostrar={pwMostrar.nueva}
            onChange={v => setPwForm(p => ({ ...p, confirmar: v }))}
            onToggleMostrar={() => setPwMostrar(p => ({ ...p, nueva: !p.nueva }))}
          />
          <button
            type="submit"
            disabled={pwGuardando || !pwForm.actual || !pwForm.nueva || !pwForm.confirmar}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
          >
            {pwGuardando ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Actualizando...</>
            ) : (
              <><Key className="w-4 h-4 mr-2" />Cambiar Contraseña</>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderSeccionNotificaciones = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-start gap-3">
        <Bell className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-700">Configura cómo y cuándo quieres recibir notificaciones del sistema. Los cambios se guardan con el botón "Guardar Cambios".</p>
      </div>
      <div className="space-y-3">
        {[
          { campo: 'notifReproduccion', titulo: 'Alertas de Reproducción',  desc: 'Partos próximos, diagnósticos pendientes' },
          { campo: 'notifSalud',        titulo: 'Alertas de Salud',         desc: 'Vacunas, tratamientos, enfermedades' },
          { campo: 'notifProduccion',   titulo: 'Alertas de Producción',    desc: 'Bajadas de producción, calidad de leche' },
          { campo: 'notifReportes',     titulo: 'Reportes Automáticos',     desc: 'Envío de reportes mensuales por email' },
          { campo: 'notifPush',         titulo: 'Notificaciones Push',      desc: 'Notificaciones en tiempo real' },
        ].map(({ campo, titulo, desc }) => (
          <div key={campo} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{titulo}</h4>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
            <button
              onClick={() => manejarCambio(campo, !datosUsuario[campo])}
              className={`relative w-12 h-6 rounded-full transition-colors ${datosUsuario[campo] ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${datosUsuario[campo] ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'personal':       return renderSeccionPersonal();
      case 'granja':         return renderSeccionGranja();
      case 'ubicacion':      return renderSeccionUbicacion();
      case 'legal':          return renderSeccionLegal();
      case 'seguridad':      return renderSeccionSeguridad();
      case 'notificaciones': return renderSeccionNotificaciones();
      default:               return renderSeccionPersonal();
    }
  };

  // ─── Render principal ────────────────────────────────────────────────────────
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

        {/* Mensaje global */}
        {mensaje.texto && (
          <div className={`mx-6 mt-3 px-4 py-3 rounded-lg text-sm font-medium ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Cuerpo */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <nav className="p-4 space-y-1">
              {secciones.map(sec => {
                const Ico = sec.icono;
                const activo = seccionActiva === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSeccionActiva(sec.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${activo ? 'bg-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Ico className="w-5 h-5 mr-3" />
                    <span className="font-medium text-sm">{sec.nombre}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {cargando ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
              </div>
            ) : renderSeccion()}
          </div>
        </div>

        {/* Footer — no mostrar botón Guardar en la sección de seguridad */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onCerrar}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cerrar
          </button>
          {seccionActiva !== 'seguridad' && (
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
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Guardando...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>
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
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Componente Campo de formulario ───────────────────────────────────────────
const Campo = ({ icono: Ico, label, campo, valor, tipo = 'text', editable, onChange, required = false, fullWidth = false, opciones = [] }) => (
  <div className={fullWidth ? 'col-span-full' : ''}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      <span className="flex items-center gap-1.5">
        {Ico && <Ico className="w-4 h-4 text-gray-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
    </label>
    {editable ? (
      tipo === 'select' ? (
        <select
          value={valor || ''}
          onChange={e => onChange(campo, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Seleccionar...</option>
          {opciones.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={tipo}
          value={valor || ''}
          onChange={e => onChange(campo, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          required={required}
        />
      )
    ) : (
      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 min-h-[40px]">
        {valor || <span className="text-gray-400">—</span>}
      </div>
    )}
  </div>
);

// ─── Campo contraseña ─────────────────────────────────────────────────────────
const CampoPassword = ({ label, value, mostrar, onChange, onToggleMostrar }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={mostrar ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        required
      />
      <button
        type="button"
        onClick={onToggleMostrar}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

export default PerfilUsuario;
