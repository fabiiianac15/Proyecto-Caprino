/**
 * Inicio de sesión. La dirección del servidor se puede cambiar aquí porque el
 * teléfono llega al backend por la red local. La contraseña nunca se rellena.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-md mx-auto seguro-arriba">
      <div className="text-center mb-8">
        <img src="/img/LogoCabra.jpg" alt="" className="w-24 h-24 rounded-[22px] object-cover mx-auto mb-4" />
        <h1 className="t-grande">Capriva</h1>
        <p className="t-sub text-secundario mt-1">Registro del hato caprino en el corral</p>
      </div>

      <form onSubmit={entrar} className="space-y-3">
        <div className="lista">
          <label className="fila">
            <span className="t-cuerpo w-28 shrink-0">Correo</span>
            <input className="campo-fila !text-left" type="email" inputMode="email" autoComplete="username" autoCapitalize="none"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ufpso.edu.co" required />
          </label>
          <label className="fila">
            <span className="t-cuerpo w-28 shrink-0">Contraseña</span>
            <input className="campo-fila !text-left" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Obligatoria" required />
          </label>
        </div>

        {error && <p className="t-sub text-critico px-4" role="alert">{error}</p>}

        <Boton type="submit" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'}</Boton>

        <button type="button" onClick={() => setVerServidor((v) => !v)}
          className="w-full min-h-[44px] flex items-center justify-center gap-1 t-sub text-acento active:opacity-60">
          Servidor <ChevronDown className={`w-4 h-4 transition-transform ${verServidor ? 'rotate-180' : ''}`} />
        </button>
        {verServidor && (
          <div>
            <div className="lista">
              <label className="fila">
                <input className="campo-fila !text-left" inputMode="url" autoCapitalize="none" autoCorrect="off"
                  value={servidor} onChange={(e) => setServidor(e.target.value)} aria-label="Dirección del servidor" />
              </label>
            </div>
            <p className="pie-seccion">Solo se cambia si el servidor se muda a otra dirección.</p>
          </div>
        )}
      </form>
    </div>
  );
}
