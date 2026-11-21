/**
 * Inicio: estado de la conexión, resumen del hato, lo que falta por enviar y
 * los registros que más se hacen en el corral.
 */

import { useNavigate } from 'react-router-dom';
import { Syringe, Weight, Milk, Eye, UploadCloud, ClipboardCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { useSincronizacion } from '@hooks/useSincronizacion';
import { listarBorradores } from '@servicios/borradores';
import { obtenerCacheAnimales, fechaCacheAnimales } from '@servicios/almacenamientoLocal';
import Barra from '@/ui/Barra';
import Estado from '@/ui/Estado';
import { useAvisos } from '@/ui/Avisos';
import { haceCuanto } from '@utilidades/formato';

export const REGISTROS = [
  { tipo: 'salud', titulo: 'Salud', sub: 'Vacuna, tratamiento o enfermedad', Icono: Syringe, tono: 'critico' },
  { tipo: 'pesaje', titulo: 'Pesaje', sub: 'Peso y condición corporal', Icono: Weight, tono: 'info' },
  { tipo: 'produccion', titulo: 'Leche', sub: 'Litros del ordeño', Icono: Milk, tono: 'exito' },
  { tipo: 'famacha', titulo: 'FAMACHA', sub: 'Color del ojo para detectar anemia', Icono: Eye, tono: 'aviso' },
];

const TONO_ACCESO = {
  critico: 'bg-critico/15 text-critico', info: 'bg-info/15 text-info',
  exito: 'bg-exito/15 text-exito', aviso: 'bg-aviso/15 text-aviso',
};

const fechaLarga = () => {
  const t = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function Inicio() {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { usuario } = useAuth();
  const { enLinea, pendientes, sincronizando, sincronizarAhora } = useSincronizacion();
  const borradores = listarBorradores().filter((b) => !b.pendienteEnvio);
  const nombre = (usuario?.nombre || '').split(' ')[0];

  const animales = obtenerCacheAnimales().filter((a) => !a.estado || a.estado === 'activo');
  const hembras = animales.filter((a) => a.sexo === 'hembra').length;
  const fechaLista = fechaCacheAnimales();

  const enviar = async () => {
    const r = await sincronizarAhora();
    if (r.omitido) avisos.info('Sin conexión', 'Se enviará cuando vuelva la señal.');
    else if (r.fallidos > 0) avisos.aviso(`${r.fallidos} sin enviar`, 'Revise el detalle en Ajustes.');
    else avisos.exito('Todo enviado', `${r.enviados} ${r.enviados === 1 ? 'registro' : 'registros'}.`);
  };

  return (
    <>
      <Barra titulo={nombre ? `¡Hola, ${nombre}!` : 'Inicio'} grande subtitulo={fechaLarga()}>
        <Estado tipo={enLinea ? 'conectado' : 'sinConexion'} sobreMarca>
          {enLinea ? 'Conectado: lo que registre se envía de una vez' : 'Sin conexión: todo queda guardado en el teléfono'}
        </Estado>
      </Barra>

      <div className="px-4 space-y-4">
        {/* Resumen del hato (de la lista guardada en el teléfono) */}
        <button onClick={() => navigate('/rebano')} className="tarjeta w-full text-left active:opacity-80" aria-label="Ver el rebaño">
          <div className="flex items-center justify-between mb-2">
            <p className="t-seccion">Hato</p>
            <ChevronRight className="w-5 h-5 text-terciario" aria-hidden="true" />
          </div>
          {animales.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <div><p className="t-cifra text-acento">{animales.length}</p><p className="t-sub text-secundario">Activos</p></div>
              <div><p className="t-cifra">{hembras}</p><p className="t-sub text-secundario">Hembras</p></div>
              <div><p className="t-cifra">{animales.length - hembras}</p><p className="t-sub text-secundario">Machos</p></div>
            </div>
          ) : (
            <p className="t-sub text-secundario">Abra Rebaño con conexión para descargar la lista de animales.</p>
          )}
          {fechaLista ? <p className="t-nota text-secundario mt-2">Lista actualizada {haceCuanto(fechaLista)}</p> : null}
        </button>

        {/* Pendientes por enviar */}
        {pendientes > 0 && (
          <div className="rounded-2xl bg-aviso/15 text-aviso flex items-center gap-3 pl-4 pr-2 py-3">
            <UploadCloud className="w-6 h-6 shrink-0" aria-hidden="true" />
            <button onClick={() => navigate('/ajustes/pendientes')} className="flex-1 min-w-0 text-left">
              <p className="t-encabezado">{pendientes} {pendientes === 1 ? 'registro' : 'registros'} por enviar</p>
              <p className="t-sub">Guardados en el teléfono, no en el servidor</p>
            </button>
            {enLinea && (
              <button onClick={enviar} disabled={sincronizando}
                className="shrink-0 min-h-[44px] px-3 rounded-xl t-encabezado active:bg-aviso/15 disabled:opacity-50">
                {sincronizando ? 'Enviando…' : 'Enviar'}
              </button>
            )}
          </div>
        )}

        {/* Accesos rápidos */}
        <section>
          <h2 className="cabecera-seccion">Registrar</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {REGISTROS.map((r) => (
              <button key={r.tipo} onClick={() => navigate(`/registrar/${r.tipo}`)}
                className="tarjeta !p-0 h-[100px] flex flex-col items-center justify-center gap-2 active:opacity-75">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center ${TONO_ACCESO[r.tono]}`} aria-hidden="true">
                  <r.Icono className="w-[22px] h-[22px]" strokeWidth={2.1} />
                </span>
                <span className="t-nota font-medium text-texto">{r.titulo}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Evaluaciones a medias */}
        {borradores.length > 0 && (
          <section>
            <h2 className="cabecera-seccion">Evaluaciones sin terminar</h2>
            <button onClick={() => navigate('/evaluar')} className="tarjeta w-full flex items-center gap-3 text-left active:opacity-80">
              <span className="w-10 h-10 rounded-xl bg-acento/10 text-acento flex items-center justify-center shrink-0" aria-hidden="true">
                <ClipboardCheck className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block t-encabezado">{borradores.length} {borradores.length === 1 ? 'evaluación' : 'evaluaciones'} en borrador</span>
                <span className="block t-sub text-secundario">Bienestar o clasificación lineal</span>
              </span>
              <ChevronRight className="w-5 h-5 text-terciario shrink-0" aria-hidden="true" />
            </button>
          </section>
        )}
      </div>
    </>
  );
}
