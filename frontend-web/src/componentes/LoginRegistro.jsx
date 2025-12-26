/**
 * Componente de Login y Registro
 * Diseño dividido: imagen izquierda, formulario derecha
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  UserCheck, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contextos/AuthContext';
import { validarEmail } from '../utilidades/validaciones';

const LoginRegistro = () => {
  const [vistaActual, setVistaActual] = useState('login'); // 'login' o 'registro'
  const navigate = useNavigate();
  const { iniciarSesion, registrarUsuario } = useAuth();

  // Estados para Login
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    recordar: false
  });

  // Estados para Registro
  const [registroForm, setRegistroForm] = useState({
    codigo: '',
    nombre: '',
    email: '',
    rol: '',
    password: '',
    confirmarPassword: ''
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  /**
   * Evalúa la fortaleza de la contraseña
   */
  const evaluarPassword = (password) => {
    let fuerza = 0;
    const requisitos = {
      longitud: password.length >= 8,
      mayuscula: /[A-Z]/.test(password),
      minuscula: /[a-z]/.test(password),
      numero: /[0-9]/.test(password),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(requisitos).forEach(cumple => {
      if (cumple) fuerza++;
    });

    let nivel = 'débil';
    let color = 'red';
    if (fuerza >= 4) {
      nivel = 'fuerte';
      color = 'green';
    } else if (fuerza >= 3) {
      nivel = 'media';
      color = 'yellow';
    }

    return { nivel, color, fuerza, requisitos };
  };

  const passwordEval = evaluarPassword(registroForm.password);

  /**
   * Maneja cambios en formulario de login
   */
  const manejarCambioLogin = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Maneja cambios en formulario de registro
   */
  const manejarCambioRegistro = (e) => {
    const { name, value } = e.target;
    setRegistroForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Valida formulario de login
   */
  const validarLogin = () => {
    const nuevosErrores = {};

    const validacionEmail = validarEmail(loginForm.email);
    if (!validacionEmail.valido) {
      nuevosErrores.email = validacionEmail.mensaje;
    }

    if (!loginForm.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Valida formulario de registro
   */
  const validarRegistro = () => {
    const nuevosErrores = {};

    if (!registroForm.codigo.trim()) {
      nuevosErrores.codigo = 'El código es requerido';
    }

    if (!registroForm.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre completo es requerido';
    }

    const validacionEmail = validarEmail(registroForm.email);
    if (!validacionEmail.valido) {
      nuevosErrores.email = validacionEmail.mensaje;
    }

    if (!registroForm.rol) {
      nuevosErrores.rol = 'Debe seleccionar un rol';
    }

    if (passwordEval.fuerza < 3) {
      nuevosErrores.password = 'La contraseña no cumple con los requisitos mínimos';
    }

    if (registroForm.password !== registroForm.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Procesa el login
   */
  const manejarLogin = async (e) => {
    e.preventDefault();
    
    if (!validarLogin()) {
      return;
    }

    setCargando(true);
    
    // Simular delay de red
    setTimeout(() => {
      const resultado = iniciarSesion(
        loginForm.email, 
        loginForm.password, 
        loginForm.recordar
      );
      
      if (resultado.exito) {
        setMensaje({ tipo: 'success', texto: resultado.mensaje });
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setMensaje({ tipo: 'error', texto: resultado.mensaje });
      }
      
      setCargando(false);
    }, 800);
  };

  /**
   * Procesa el registro
   */
  const manejarRegistro = async (e) => {
    e.preventDefault();
    
    if (!validarRegistro()) {
      return;
    }

    setCargando(true);
    
    // Simular delay de red
    setTimeout(() => {
      const resultado = registrarUsuario(registroForm);
      
      if (resultado.exito) {
        setMensaje({ tipo: 'success', texto: resultado.mensaje });
        setTimeout(() => {
          setVistaActual('login');
          setRegistroForm({
            codigo: '',
            nombre: '',
            email: '',
            rol: '',
            password: '',
            confirmarPassword: ''
          });
        }, 2000);
      } else {
        setMensaje({ tipo: 'error', texto: resultado.mensaje });
      }
      
      setCargando(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo - Imagen */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center p-12">
        <div className="text-center text-white">
          <img 
            src="/img/granja-caprino.png" 
            alt="Granja Caprina" 
            className="w-full max-w-lg mx-auto mb-8 drop-shadow-2xl"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div style={{ display: 'none' }} className="text-center">
            <div className="text-8xl mb-4">🐐</div>
            <h2 className="text-4xl font-bold mb-4">Sistema Caprino</h2>
            <p className="text-xl opacity-90">Gestión Zootécnica Profesional</p>
          </div>
          <h2 className="text-4xl font-bold mb-4">Sistema de Gestión Caprina</h2>
          <p className="text-xl opacity-90">
            Control integral de producción, reproducción y salud de tu rebaño
          </p>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-6xl mb-2">🐐</div>
            <h1 className="text-2xl font-bold text-gray-800">Sistema Caprino</h1>
          </div>

          {/* Selector Login/Registro */}
          <div className="flex mb-6 bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setVistaActual('login')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                vistaActual === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setVistaActual('registro')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                vistaActual === 'registro'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Registrarse
            </button>
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

          {/* Formulario de Login */}
          {vistaActual === 'login' && (
            <form onSubmit={manejarLogin} className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>
              
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={manejarCambioLogin}
                    placeholder="usuario@institucion.edu"
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errores.email && (
                  <p className="mt-1 text-sm text-red-600">{errores.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    name="password"
                    value={loginForm.password}
                    onChange={manejarCambioLogin}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.password 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errores.password && (
                  <p className="mt-1 text-sm text-red-600">{errores.password}</p>
                )}
              </div>

              {/* Recordar */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="recordar"
                    checked={loginForm.recordar}
                    onChange={manejarCambioLogin}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón login */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>

              {/* Credenciales de prueba */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                <p className="font-medium text-blue-900 mb-1">Credenciales de prueba:</p>
                <p className="text-blue-700">Email: juan.perez@institucion.edu</p>
                <p className="text-blue-700">Contraseña: Admin123!</p>
              </div>
            </form>
          )}

          {/* Formulario de Registro */}
          {vistaActual === 'registro' && (
            <form onSubmit={manejarRegistro} className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Cuenta</h2>
              
              {/* Código */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={registroForm.codigo}
                  onChange={manejarCambioRegistro}
                  placeholder="ADM001 o PAS001"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errores.codigo 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errores.codigo && (
                  <p className="mt-1 text-sm text-red-600">{errores.codigo}</p>
                )}
              </div>

              {/* Nombre completo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="nombre"
                    value={registroForm.nombre}
                    onChange={manejarCambioRegistro}
                    placeholder="Juan Pérez García"
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.nombre 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errores.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Institucional <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={registroForm.email}
                    onChange={manejarCambioRegistro}
                    placeholder="usuario@institucion.edu"
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errores.email && (
                  <p className="mt-1 text-sm text-red-600">{errores.email}</p>
                )}
              </div>

              {/* Rol */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="rol"
                    value={registroForm.rol}
                    onChange={manejarCambioRegistro}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.rol 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Seleccione un rol</option>
                    <option value="administrador">Administrador de Granja</option>
                    <option value="pasante">Pasante</option>
                    <option value="zootecnista">Zootecnista</option>
                    <option value="veterinario">Veterinario</option>
                  </select>
                </div>
                {errores.rol && (
                  <p className="mt-1 text-sm text-red-600">{errores.rol}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    name="password"
                    value={registroForm.password}
                    onChange={manejarCambioRegistro}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.password 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Indicador de fortaleza */}
                {registroForm.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Fortaleza:</span>
                      <span className={`text-xs font-medium ${
                        passwordEval.color === 'green' ? 'text-green-600' :
                        passwordEval.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {passwordEval.nivel.toUpperCase()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          passwordEval.color === 'green' ? 'bg-green-500' :
                          passwordEval.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(passwordEval.fuerza / 5) * 100}%` }}
                      />
                    </div>
                    
                    {/* Requisitos */}
                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex items-center">
                        {passwordEval.requisitos.longitud ? 
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                          <XCircle className="w-3 h-3 text-gray-400 mr-1" />
                        }
                        <span className={passwordEval.requisitos.longitud ? 'text-green-600' : 'text-gray-500'}>
                          Mínimo 8 caracteres
                        </span>
                      </div>
                      <div className="flex items-center">
                        {passwordEval.requisitos.mayuscula ? 
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                          <XCircle className="w-3 h-3 text-gray-400 mr-1" />
                        }
                        <span className={passwordEval.requisitos.mayuscula ? 'text-green-600' : 'text-gray-500'}>
                          Una letra mayúscula
                        </span>
                      </div>
                      <div className="flex items-center">
                        {passwordEval.requisitos.minuscula ? 
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                          <XCircle className="w-3 h-3 text-gray-400 mr-1" />
                        }
                        <span className={passwordEval.requisitos.minuscula ? 'text-green-600' : 'text-gray-500'}>
                          Una letra minúscula
                        </span>
                      </div>
                      <div className="flex items-center">
                        {passwordEval.requisitos.numero ? 
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                          <XCircle className="w-3 h-3 text-gray-400 mr-1" />
                        }
                        <span className={passwordEval.requisitos.numero ? 'text-green-600' : 'text-gray-500'}>
                          Un número
                        </span>
                      </div>
                      <div className="flex items-center">
                        {passwordEval.requisitos.especial ? 
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                          <XCircle className="w-3 h-3 text-gray-400 mr-1" />
                        }
                        <span className={passwordEval.requisitos.especial ? 'text-green-600' : 'text-gray-500'}>
                          Un carácter especial (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {errores.password && (
                  <p className="mt-1 text-sm text-red-600">{errores.password}</p>
                )}
              </div>

              {/* Confirmar password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    name="confirmarPassword"
                    value={registroForm.confirmarPassword}
                    onChange={manejarCambioRegistro}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errores.confirmarPassword 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errores.confirmarPassword && (
                  <p className="mt-1 text-sm text-red-600">{errores.confirmarPassword}</p>
                )}
              </div>

              {/* Botón registro */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {cargando ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegistro;
