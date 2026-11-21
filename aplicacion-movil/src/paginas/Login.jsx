/**
 * Inicio de sesión. La dirección del servidor se puede cambiar aquí porque el
 * teléfono llega al backend por la red local. La contraseña nunca se rellena.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Eye, EyeOff, Server } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { obtenerServidor, guardarServidor } from '@servicios/config';
import { esErrorDeRed } from '@servicios/api';
import { Boton } from '@/ui/Controles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [servidor, setServidor] = useState(obtenerServidor());
  const [verServidor, setVerServidor] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState('');

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    setEntrando(true);
    try {
      setServidor(guardarServidor(servidor));
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (esErrorDeRed(err)) {
        setError('No se pudo llegar al servidor. Revise que el teléfono tenga internet (wifi o datos) e intente de nuevo.');
      } else if (err.response?.status === 401) {
        setError('El correo o la contraseña no coinciden.');
      } else {
        setError(err.response?.data?.message || 'No se pudo iniciar sesión.');
      }
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-fondo">
      <header className="bg-marca text-sobre-marca rounded-b-[32px] seguro-arriba">
        <div className="px-6 pt-14 pb-10 text-center">
          <img src="/img/LogoCabra.jpg" alt="" className="w-20 h-20 rounded-[22px] object-cover mx-auto mb-4 ring-4 ring-sobre-marca/15" />
          <h1 className="font-titulo text-[34px] leading-[40px] font-extrabold tracking-tight">Capriva</h1>
          <p className="t-sub text-sobre-marca/85 mt-1">Gestión del hato caprino en el corral</p>
        </div>
      </header>

      <form onSubmit={entrar} className="px-6 pt-8 pb-10 space-y-4" noValidate={false}>
        <label className="block">
          <span className="block t-sub font-medium mb-1.5">Correo</span>
          <input className="campo" type="email" inputMode="email" autoComplete="username" autoCapitalize="none"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ufpso.edu.co" required />
        </label>
        <label className="block">
          <span className="block t-sub font-medium mb-1.5">Contraseña</span>
          <span className="relative block">
            <input className="campo pr-14" type={verClave ? 'text' : 'password'} autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Su contraseña" required />
            <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-0 top-0 w-14 h-[52px] flex items-center justify-center text-secundario active:opacity-60">
              {verClave ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </span>
        </label>

        {error && <p className="t-sub text-critico bg-critico/10 rounded-xl px-4 py-3" role="alert">{error}</p>}

        <Boton type="submit" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'}</Boton>

        <div className="rounded-xl bg-relleno">
          <button type="button" onClick={() => setVerServidor((v) => !v)} aria-expanded={verServidor}
            className="w-full min-h-[52px] flex items-center gap-2 px-4 t-sub text-secundario active:opacity-60">
            <Server className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left truncate">Servidor: {servidor.replace(/^https?:\/\//, '').replace(/\/api$/, '')}</span>
            <ChevronDown className={`w-[18px] h-[18px] transition-transform ${verServidor ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {verServidor && (
            <div className="px-4 pb-4">
              <input className="campo" inputMode="url" autoCapitalize="none" autoCorrect="off"
                value={servidor} onChange={(e) => setServidor(e.target.value)} aria-label="Dirección del servidor" />
              <p className="t-nota text-secundario mt-2">Opción avanzada: solo se cambia si el servidor se muda a otra dirección.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
