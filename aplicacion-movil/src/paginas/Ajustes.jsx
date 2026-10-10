/** Ajustes: cuenta, dirección del servidor y datos guardados en el teléfono. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, UploadCloud, RefreshCw, LogOut, Users } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { useSincronizacion } from '@hooks/useSincronizacion';
import api from '@servicios/api';
import { obtenerServidor, guardarServidor } from '@servicios/config';
import { listarAnimales } from '@servicios/animalesAPI';
import { refrescarCatalogos, fechaCatalogo } from '@servicios/catalogos';
import { fechaCacheAnimales, obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import Barra from '@/ui/Barra';
import { Seccion, Fila, IconoFila } from '@/ui/Lista';
import { Boton } from '@/ui/Controles';
import Hoja from '@/ui/Hoja';
import Confirmar from '@/ui/Confirmar';
import { useAvisos } from '@/ui/Avisos';
import { haceCuanto } from '@utilidades/formato';

const ROLES = { administrador_granja: 'Administrador', zootecnista: 'Zootecnista', veterinario: 'Veterinario', pasante: 'Pasante', tecnico: 'Técnico' };

export default function Ajustes() {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { usuario, logout } = useAuth();
  const { pendientes } = useSincronizacion();
  const [servidor, setServidor] = useState(obtenerServidor());
  const [hojaServidor, setHojaServidor] = useState(false);
  const [borradorServidor, setBorradorServidor] = useState(servidor);
  const [probando, setProbando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [salir, setSalir] = useState(false);
  const [, pintar] = useState(0);

  const probar = async () => {
    setProbando(true);
    const url = guardarServidor(borradorServidor);
    setServidor(url);
    setBorradorServidor(url);
    try {
      await api.get('/health', { timeout: 8000 });
      avisos.exito('El servidor responde', url);
      setHojaServidor(false);
    } catch {
      avisos.error('No responde', 'Revise que el teléfono tenga internet y que la dirección esté bien escrita.');
    } finally {
      setProbando(false);
    }
  };

  const actualizar = async () => {
    setActualizando(true);
    try {
      const [r] = await Promise.all([listarAnimales(), refrescarCatalogos()]);
      if (r.desdeCache) avisos.info('Sin conexión', 'Se conserva lo que ya estaba guardado.');
      else avisos.exito('Datos actualizados', `${r.animales.length} animales en el teléfono.`);
    } catch (e) {
      avisos.error('No se pudo actualizar', e.response?.data?.message || e.message);
    } finally {
      setActualizando(false);
      pintar((n) => n + 1);
    }
  };

  const fechaCat = Math.min(fechaCatalogo('bienestar') || 0, fechaCatalogo('lineal') || 0);

  return (
    <>
      <Barra titulo="Ajustes" grande />

      <Seccion titulo="Cuenta" className="mt-2">
        <Fila icono={<IconoFila Icono={Users} color="bg-[#1D5FA8]" />} titulo={usuario?.nombre || 'Usuario'}
          sub={[usuario?.email, ROLES[usuario?.rol] || usuario?.rol].filter(Boolean).join(' · ')} />
      </Seccion>

      <Seccion titulo="Conexión" className="mt-6" pie="La app se conecta por internet, con wifi o con datos. La dirección solo se cambia si el servidor se muda.">
        <Fila icono={<IconoFila Icono={Server} color="bg-[#6E6E73]" />} titulo="Servidor" sub={servidor.replace(/^https?:\/\//, '').replace(/\/api$/, '')}
          alHacerClic={() => { setBorradorServidor(servidor); setHojaServidor(true); }} />
        <Fila icono={<IconoFila Icono={UploadCloud} color="bg-[#B45309]" />} titulo="Por enviar" valor={String(pendientes)}
          alHacerClic={() => navigate('/ajustes/pendientes')} />
      </Seccion>

      <Seccion titulo="Guardado en el teléfono" className="mt-6" pie="Con estos datos la app funciona sin señal en el corral.">
        <Fila titulo="Animales" valor={`${obtenerCacheAnimales().length} · ${haceCuanto(fechaCacheAnimales())}`} />
        <Fila titulo="Guías de evaluación" valor={fechaCat ? haceCuanto(fechaCat) : 'sin descargar'} />
      </Seccion>
      <div className="px-4 mt-3">
        <Boton variante="tintado" Icono={RefreshCw} onClick={actualizar} disabled={actualizando}>
          {actualizando ? 'Actualizando…' : 'Actualizar datos'}
        </Boton>
      </div>

      <Seccion className="mt-8">
        <Fila icono={<IconoFila Icono={LogOut} color="bg-[#C62828]" />} titulo="Cerrar sesión" critico flecha={false} alHacerClic={() => setSalir(true)} />
      </Seccion>
      <p className="t-nota text-secundario text-center mt-6">Capriva 2.1 · UFPSO</p>

      <Hoja abierta={hojaServidor} alCerrar={() => setHojaServidor(false)} titulo="Servidor">
        <div className="px-4 space-y-4">
          <input className="campo" inputMode="url" autoCapitalize="none" autoCorrect="off" value={borradorServidor}
            onChange={(e) => setBorradorServidor(e.target.value)} placeholder="3.84.187.243" aria-label="Dirección del servidor" />
          <p className="t-nota text-secundario px-1">Escriba la dirección del servidor. La app completa el resto.</p>
          <Boton onClick={probar} disabled={probando}>{probando ? 'Probando…' : 'Guardar y probar'}</Boton>
        </div>
      </Hoja>

      <Confirmar abierta={salir} alCerrar={() => setSalir(false)} titulo="Cerrar sesión" accion="Cerrar sesión" alConfirmar={logout}
        texto={pendientes > 0
          ? `Hay ${pendientes} registros sin enviar. Siguen guardados en el teléfono y se envían cuando vuelva a entrar.`
          : 'Para volver a entrar necesita conexión con el servidor.'} />
    </>
  );
}
