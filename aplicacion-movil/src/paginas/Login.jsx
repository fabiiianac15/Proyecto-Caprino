/**
 * Pantalla de inicio de sesión.
 * Estética acoplada a la web: fondo verde con imagen de cabra, logo, íconos
 * lucide y campos con foco verde. Backend: POST /api/auth/login (campo email).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, WifiOff } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { useConectividad } from '@hooks/useConectividad';
import { useToast } from '@componentes/comunes/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const enLinea = useConectividad();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const datos = await login(email.trim(), password);
      const nombre = (datos?.nombre || '').split(' ')[0];
      toast.exito('¡Bienvenido!', nombre ? `Hola, ${nombre}` : 'Sesión iniciada', 2000);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      const credenciales = /credencial|invalid|incorrect/i.test(msg || '');
      if (credenciales) {
        toast.error('Credenciales incorrectas', 'El correo o la contraseña no son válidos.');
      } else if (!enLinea) {
        toast.error('Sin conexión', 'Necesitas internet para iniciar sesión la primera vez.');
      } else {
        toast.error('Error al iniciar sesión', msg || 'Intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center px-6 py-10 overflow-hidden">
      {/* Fondo: imagen de cabra + degradado verde (igual que la web) */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/img/AtrasCabra.jpeg"
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-green-800/85 to-green-600/80" />
      </div>

      {/* Encabezado con logo */}
      <div className="mb-8 text-center text-white animate-aparecer">
        <img
          src="/img/LogoCabra.jpg"
          alt="Logo"
          className="w-20 h-20 rounded-full object-cover mx-auto mb-3 ring-4 ring-white/30 shadow-lg"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-2xl font-bold tracking-tight">Gestión Caprina</h1>
        <p className="text-green-100 text-sm">App de campo · UFPSO</p>
      </div>

      {/* Tarjeta de formulario */}
      <form
        onSubmit={manejarSubmit}
        className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 space-y-4 animate-aparecer"
      >
        <div>
          <label className="etiqueta-campo">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="campo-grande pl-11"
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ufpso.edu.co"
              required
            />
          </div>
        </div>

        <div>
          <label className="etiqueta-campo">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="campo-grande pl-11 pr-11"
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full min-h-[54px] rounded-xl bg-green-600 active:bg-green-700 text-white
                     text-lg font-semibold flex items-center justify-center gap-2 shadow-sm
                     disabled:opacity-60 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          {cargando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>

        {!enLinea && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-amber-600">
            <WifiOff className="w-4 h-4" /> Sin conexión a internet
          </p>
        )}
      </form>
    </div>
  );
}
