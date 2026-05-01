import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Eye, EyeOff,
  CheckCircle, XCircle, AlertCircle, Shield, Users,
} from 'lucide-react';
import { useAuth } from '../contextos/AuthContext';
import { validarEmail } from '../utilidades/validaciones';
import SelectPersonalizado from './SelectPersonalizado';
import ToastNotificacion, { useToast } from './ToastNotificacion';

const INPUT_BASE = 'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors';
const INPUT_OK   = 'border-gray-200 bg-white focus:ring-green-500 focus:border-green-400';
const INPUT_ERR  = 'border-red-300 bg-red-50 focus:ring-red-400 focus:border-red-400';

const LoginRegistro = () => {
  const [vistaActual, setVistaActual] = useState('login');
  const navigate = useNavigate();
  const { iniciarSesion, registrarse } = useAuth();
  const { toasts, agregar: toast, quitar } = useToast();

  const [loginForm, setLoginForm] = useState({ email: '', password: '', recordar: false });
  const [registroForm, setRegistroForm] = useState({ nombre: '', email: '', rol: '', password: '', confirmarPassword: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores]   = useState({});
  const [cargando, setCargando] = useState(false);

  const evaluarPassword = (pw) => {
    const req = {
      longitud:  pw.length >= 8,
      mayuscula: /[A-Z]/.test(pw),
      minuscula: /[a-z]/.test(pw),
      numero:    /[0-9]/.test(pw),
      especial:  /[!@#$%^&*(),.?":{}|<>]/.test(pw),
    };
    const fuerza = Object.values(req).filter(Boolean).length;
    return {
      fuerza, req,
      nivel: fuerza >= 4 ? 'fuerte' : fuerza >= 3 ? 'media' : 'débil',
      color: fuerza >= 4 ? 'green' : fuerza >= 3 ? 'yellow' : 'red',
    };
  };
  const pwEval = evaluarPassword(registroForm.password);

  const cambioLogin    = (e) => { const { name, value, type, checked } = e.target; setLoginForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); setErrores(p => ({ ...p, [name]: null })); };
  const cambioRegistro = (e) => { const { name, value } = e.target; setRegistroForm(p => ({ ...p, [name]: value })); setErrores(p => ({ ...p, [name]: null })); };

  /* ── Validaciones ── */
  const validarLogin = () => {
    const err = {};
    if (!validarEmail(loginForm.email).valido) err.email = 'Correo inválido';
    if (!loginForm.password) err.password = 'La contraseña es requerida';
    setErrores(err);
    if (Object.keys(err).length) {
      if (err.email && err.password) {
        toast('warning', 'Campos requeridos', 'Ingresa tu correo y contraseña para continuar.');
      } else if (err.email) {
        toast('warning', 'Correo inválido', 'Ingresa un correo electrónico válido.');
      } else {
        toast('warning', 'Contraseña requerida', 'Debes ingresar tu contraseña.');
      }
      return false;
    }
    return true;
  };

  const validarRegistro = () => {
    const err = {};
    if (!registroForm.nombre.trim()) err.nombre = 'El nombre es requerido';
    if (!registroForm.rol)           err.rol    = 'Selecciona un rol';
    if (!validarEmail(registroForm.email).valido) err.email = 'Correo inválido';
    if (pwEval.fuerza < 3)           err.password = 'Contraseña muy débil';
    if (registroForm.password !== registroForm.confirmarPassword) err.confirmarPassword = 'Las contraseñas no coinciden';
    setErrores(err);

    if (Object.keys(err).length) {
      if (err.password === 'Contraseña muy débil') {
        toast('warning', 'Contraseña insegura',
          'Usa al menos 8 caracteres con mayúsculas, minúsculas y números.');
      } else if (err.confirmarPassword) {
        toast('warning', 'Contraseñas distintas',
          'Las dos contraseñas que ingresaste no coinciden.');
      } else if (err.email) {
        toast('warning', 'Correo inválido',
          'Ingresa un correo electrónico con formato válido.');
      } else {
        const campo = err.nombre ? 'nombre completo'
          : err.rol ? 'rol'
          : 'información';
        toast('warning', 'Campo requerido',
          `El campo "${campo}" es obligatorio para continuar.`);
      }
      return false;
    }
    return true;
  };

  /* ── Handlers ── */
  const manejarLogin = async (e) => {
    e.preventDefault();
    if (!validarLogin()) return;
    setCargando(true);
    const res = await iniciarSesion(loginForm.email, loginForm.password, loginForm.recordar);
    setCargando(false);
    if (res.success) {
      toast('success', '¡Bienvenido!', 'Sesión iniciada correctamente. Redirigiendo…', 2500);
      setTimeout(() => navigate('/'), 900);
    } else {
      const esCredenciales = /credencial|contraseña|password|incorrect|invalid|wrong/i.test(res.error ?? '');
      if (esCredenciales) {
        toast('error', 'Credenciales incorrectas',
          'El correo o la contraseña que ingresaste no son válidos.');
      } else {
        toast('error', 'Error al iniciar sesión', res.error ?? 'Ocurrió un error inesperado.');
      }
    }
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    if (!validarRegistro()) return;
    setCargando(true);
    const res = await registrarse({
      nombre_completo: registroForm.nombre.trim(),
      email: registroForm.email,
      password: registroForm.password,
      rol: registroForm.rol,
    });
    if (res.success) {
      toast('success', '¡Cuenta creada!', 'Tu cuenta fue registrada. Redirigiendo al sistema…', 3000);
      setTimeout(() => { setCargando(false); navigate('/'); }, 1600);
    } else {
      setCargando(false);
      toast('error', 'Error en el registro', res.error ?? 'No se pudo crear la cuenta.');
    }
  };

  const FEATURES = [
    'Registro y seguimiento de cada animal',
    'Control de reproducción y partos',
    'Historial de salud y vacunación',
    'Producción de leche y pesajes',
  ];

  return (
    <>
      {/* ── Toasts ── */}
      <ToastNotificacion toasts={toasts} onClose={quitar} />

      <div className="min-h-screen flex">
        {/* ── Panel izquierdo ── */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
          <div className="absolute inset-0">
            <img src="/img/AtrasCabra.jpeg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/85 to-green-700/70" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <img src="/img/LogoCabra.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/40" />
              <span className="text-white font-bold text-lg tracking-wide">Sistema Caprino</span>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight mb-3">
                Gestión integral<br />de tu rebaño
              </h1>
              <p className="text-green-100 text-base leading-relaxed">
                Todo lo que necesitas para administrar tu granja caprina en un solo lugar.
              </p>
            </div>

            <ul className="space-y-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-green-400/30 ring-1 ring-green-300 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-green-300" />
                  </span>
                  <span className="text-green-50 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10">
            <p className="text-green-200/60 text-xs">UFPSO · Proyecto Caprino</p>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
          <div className="w-full max-w-md">

            {/* Logo móvil */}
            <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
              <img src="/img/LogoCabra.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
              <span className="font-bold text-xl text-gray-800">Sistema Caprino</span>
            </div>

            {/* Tab switcher */}
            <div className="bg-white border border-gray-200 rounded-xl p-1 flex mb-6 shadow-sm">
              {['login', 'registro'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setVistaActual(tab); setErrores({}); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${vistaActual === tab ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

              {/* ── LOGIN ── */}
              {vistaActual === 'login' && (
                <form onSubmit={manejarLogin} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bienvenido</h2>
                    <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
                  </div>

                  <Campo label="Correo institucional" error={errores.email}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email" name="email" value={loginForm.email} onChange={cambioLogin}
                        placeholder="tu@ufpso.edu.co"
                        className={`${INPUT_BASE} pl-10 ${errores.email ? INPUT_ERR : INPUT_OK}`}
                      />
                    </div>
                  </Campo>

                  <Campo label="Contraseña" error={errores.password}>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={mostrarPassword ? 'text' : 'password'} name="password" value={loginForm.password} onChange={cambioLogin}
                        placeholder="••••••••"
                        className={`${INPUT_BASE} pl-10 pr-10 ${errores.password ? INPUT_ERR : INPUT_OK}`}
                      />
                      <button
                        type="button" onClick={() => setMostrarPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Campo>

                  <div className="flex items-center text-sm">
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                      <input
                        type="checkbox" name="recordar" checked={loginForm.recordar} onChange={cambioLogin}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      Recordarme
                    </label>
                  </div>

                  <button
                    type="submit" disabled={cargando}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {cargando && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>

                  {import.meta.env.DEV && (
                    <div className="p-3 bg-green-50 rounded-lg text-xs border border-green-200 text-green-800">
                      <p className="font-semibold mb-1">Credenciales de prueba</p>
                      <p>admin@caprino.com · Admin123!</p>
                    </div>
                  )}
                </form>
              )}

              {/* ── REGISTRO ── */}
              {vistaActual === 'registro' && (
                <form onSubmit={manejarRegistro} className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Crear cuenta</h2>
                    <p className="text-gray-500 text-sm mt-1">Completa los datos para registrarte</p>
                  </div>

                  <Campo label="Nombre completo" error={errores.nombre}>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text" name="nombre" value={registroForm.nombre} onChange={cambioRegistro}
                        placeholder="Nombre Apellido"
                        className={`${INPUT_BASE} pl-10 ${errores.nombre ? INPUT_ERR : INPUT_OK}`}
                      />
                    </div>
                  </Campo>

                  <Campo label="Correo institucional" error={errores.email}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email" name="email" value={registroForm.email} onChange={cambioRegistro}
                        placeholder="tu@ufpso.edu.co"
                        className={`${INPUT_BASE} pl-10 ${errores.email ? INPUT_ERR : INPUT_OK}`}
                      />
                    </div>
                  </Campo>

                  <Campo label="Rol" error={errores.rol}>
                    <SelectPersonalizado
                      valor={registroForm.rol}
                      onChange={(v) => cambioRegistro({ target: { name: 'rol', value: v } })}
                      opciones={[
                        { value: 'administrador_granja', label: 'Administrador de Granja', icono: <Shield />, colorFondo: 'bg-purple-100', colorIcono: 'text-purple-600' },
                        { value: 'pasante',              label: 'Pasante',                 icono: <Users />, colorFondo: 'bg-blue-100',   colorIcono: 'text-blue-600' },
                      ]}
                      placeholder="Selecciona un rol..."
                      error={!!errores.rol}
                      requerido
                    />
                  </Campo>

                  <Campo label="Contraseña" error={errores.password}>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={mostrarPassword ? 'text' : 'password'} name="password" value={registroForm.password} onChange={cambioRegistro}
                        placeholder="••••••••"
                        className={`${INPUT_BASE} pl-10 pr-10 ${errores.password ? INPUT_ERR : INPUT_OK}`}
                      />
                      <button
                        type="button" onClick={() => setMostrarPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registroForm.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Seguridad:</span>
                          <span className={`text-xs font-semibold ${pwEval.color === 'green' ? 'text-green-600' : pwEval.color === 'yellow' ? 'text-yellow-600' : 'text-red-500'}`}>
                            {pwEval.nivel.toUpperCase()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pwEval.color === 'green' ? 'bg-green-500' : pwEval.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${(pwEval.fuerza / 5) * 100}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 mt-2">
                          {[['longitud', 'Mín. 8 caracteres'], ['mayuscula', 'Mayúscula'], ['minuscula', 'Minúscula'], ['numero', 'Número'], ['especial', 'Carácter especial']].map(([k, label]) => (
                            <div key={k} className="flex items-center gap-1 text-xs">
                              {pwEval.req[k]
                                ? <CheckCircle className="w-3 h-3 text-green-500" />
                                : <XCircle className="w-3 h-3 text-gray-300" />}
                              <span className={pwEval.req[k] ? 'text-green-600' : 'text-gray-400'}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Campo>

                  <Campo label="Confirmar contraseña" error={errores.confirmarPassword}>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={mostrarPassword ? 'text' : 'password'} name="confirmarPassword" value={registroForm.confirmarPassword} onChange={cambioRegistro}
                        placeholder="••••••••"
                        className={`${INPUT_BASE} pl-10 ${errores.confirmarPassword ? INPUT_ERR : INPUT_OK}`}
                      />
                    </div>
                  </Campo>

                  <button
                    type="submit" disabled={cargando}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {cargando && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {cargando ? 'Registrando...' : 'Crear Cuenta'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function Campo({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

export default LoginRegistro;
