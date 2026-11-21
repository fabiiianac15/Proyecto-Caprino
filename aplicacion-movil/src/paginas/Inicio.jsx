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
import IconoCabra from '@/ui/IconoCabra';
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
        {/* Resumen del hato: foto del corral con la cifra de activos, y hembras / machos */}
        <button onClick={() => navigate('/rebano')} aria-label={`Ver el rebaño: ${animales.length} animales activos`}
          className="relative w-full h-[168px] rounded-2xl overflow-hidden text-left active:opacity-90 bg-marca"
          style={{ boxShadow: '0 4px 14px rgb(36 75 58 / 0.18)' }}>
          <img src="/img/hato-inicio.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-right" />
          <span className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgb(27 54 42 / 0.92) 0%, rgb(27 54 42 / 0.7) 42%, rgb(27 54 42 / 0) 78%)' }} aria-hidden="true" />
          <span className="relative h-full flex flex-col justify-end p-4 text-white">
            <span className="font-titulo text-[44px] leading-[46px] font-extrabold tabular-nums tracking-tight">{animales.length || '—'}</span>
            <span className="t-encabezado">Animales activos</span>
            <span className="t-nota text-white/80 mt-0.5">
              {fechaLista ? `Lista actualizada ${haceCuanto(fechaLista)}` : 'Abra Rebaño con conexión para descargarla'}
            </span>
          </span>
        </button>
        <div className="grid grid-cols-2 gap-3 -mt-1">
          {[['hembra', 'Hembras', hembras], ['macho', 'Machos', animales.length - hembras]].map(([sexo, etiqueta, n]) => (
            <button key={sexo} onClick={() => navigate(`/rebano?sexo=${sexo}`)} className="tarjeta !py-3 flex items-center gap-3 text-left active:opacity-80">
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sexo === 'hembra' ? 'bg-salvia/20 text-acento' : 'bg-ocre/25 text-aviso'}`}>
                <IconoCabra sexo={sexo} className="w-8 h-8" />
              </span>
              <span>
                <span className="block t-cifra !text-[28px] !leading-[32px]">{n}</span>
                <span className="block t-sub text-secundario">{etiqueta}</span>
              </span>
            </button>
          ))}
        </div>

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
