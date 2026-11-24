/**
 * Evaluar: las dos evaluaciones largas que se hacen en el corral. Lo que se
 * empieza queda guardado en el teléfono hasta que se envía.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Ruler, Plus, UploadCloud, AlertTriangle } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { listarBorradores, fotosDeBorrador } from '@servicios/borradores';
import { catalogoLocal, tipoCatalogoLineal } from '@servicios/catalogos';
import { calcularBienestar, calcularLineal } from '@servicios/calculos';
import { nuevaBienestar, nuevaLineal, vigentes } from '@servicios/evaluaciones';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import Barra from '@/ui/Barra';
import { Seccion, Fila, IconoFila, EstadoVacio } from '@/ui/Lista';
import { Boton, Segmentado } from '@/ui/Controles';
import { codigoDe } from '@/ui/Chapeta';
import { useAvisos } from '@/ui/Avisos';
import { fechaCorta } from '@utilidades/formato';

const TIPOS = [
  { valor: 'bienestar', etiqueta: 'Bienestar' },
  { valor: 'lineal', etiqueta: 'Clasificación lineal' },
];

const TEXTO = {
  bienestar: {
    Icono: HeartPulse, tono: 'exito', titulo: 'Bienestar animal',
    texto: 'Revisión de la granja según la guía del ICA: instalaciones, animales y registros, con fotos de lo que se encuentre.',
  },
  lineal: {
    Icono: Ruler, tono: 'salvia', titulo: 'Clasificación lineal',
    texto: 'Medir el animal, compararlo con su raza y calificar su forma rasgo por rasgo. Hembras y machos tienen su propia evaluación.',
  },
};

/** Dos botones grandes: cada sexo tiene su propia clasificación lineal. */
function BotonesSexo({ alElegir }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[['HEMBRA', '♀', 'Hembra', 'Cuerpo, ubre y patas'], ['MACHO', '♂', 'Macho', 'Cuerpo, patas y testículos']].map(([s, simbolo, t, sub]) => (
        <button key={s} type="button" onClick={() => alElegir(s)}
          className={`min-h-[120px] rounded-2xl p-4 text-left flex flex-col justify-between active:scale-[0.98] transition
                      ${s === 'MACHO' ? 'bg-[#4f46e5] text-white' : 'bg-acento text-sobre-acento'}`}>
          <span className="text-[40px] leading-none font-black" aria-hidden="true">{simbolo}</span>
          <span>
            <span className="block t-titulo">Evaluar {t.toLowerCase()}</span>
            <span className="block t-nota opacity-90">{sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default function Evaluar() {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState(() => sessionStorage.getItem('evaluar_tipo') || 'bienestar');
  const [, refrescar] = useState(0);

  useEffect(() => {
    const f = () => refrescar((n) => n + 1);
    window.addEventListener('cola-actualizada', f);
    return () => window.removeEventListener('cola-actualizada', f);
  }, []);

  const cambiar = (t) => { sessionStorage.setItem('evaluar_tipo', t); setTipo(t); };
  const borradores = listarBorradores(tipo);
  const catalogo = catalogoLocal(tipo);
  const animales = obtenerCacheAnimales();
  const info = TEXTO[tipo];

  const nueva = async (sexo = 'HEMBRA') => {
    if (tipo === 'lineal') { navigate(`/lineal/${nuevaLineal(null, '', sexo).id}`); return; }
    const b = await nuevaBienestar(usuario?.nombre || '');
    if (!b) { avisos.error('Falta la lista de indicadores', 'Conéctese a internet una vez para descargarla.'); return; }
    navigate(`/bienestar/${b.id}`);
  };

  const resumen = (b) => {
    const fotos = fotosDeBorrador(b).length;
    const partes = [];
    if (b.tipo === 'bienestar') {
      const v = vigentes(b.cab);
      const r = calcularBienestar(catalogo, b.valores, v.rspp, v.asi);
      partes.push(`${r.calificados} de ${r.aplicables} indicadores`);
    } else {
      const r = calcularLineal(catalogoLocal(tipoCatalogoLineal(b.sexo)), b.valores);
      partes.push(`${r.calificados} de ${r.total} rasgos`);
    }
    partes.push(`${fotos} ${fotos === 1 ? 'foto' : 'fotos'}`);
    return partes.join(' · ');
  };

  const titulo = (b) => {
    if (b.tipo === 'bienestar') return `Visita del ${fechaCorta(b.cab.fechaEvaluacion)}`;
    const a = animales.find((x) => String(x.id) === String(b.idAnimal));
    const s = b.sexo === 'MACHO' ? '♂ ' : '♀ ';
    return s + (a ? (a.nombre ? `${codigoDe(a)} · ${a.nombre}` : `Chapeta ${codigoDe(a)}`) : (b.sexo === 'MACHO' ? 'Macho sin elegir' : 'Cabra sin elegir'));
  };

  return (
    <>
      <Barra titulo="Evaluar" grande subtitulo="Bienestar del hato y clasificación lineal de cada cabra" />
      <div className="px-4 pb-4">
        <Segmentado opciones={TIPOS} valor={tipo} alCambiar={cambiar} etiqueta="Tipo de evaluación" />
      </div>

      {borradores.length === 0 ? (
        <div className="px-4">
          <div className="tarjeta text-center !py-8">
            <span className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${tipo === 'bienestar' ? 'bg-exito/15 text-exito' : 'bg-salvia/20 text-acento'}`} aria-hidden="true">
              <info.Icono className="w-8 h-8" />
            </span>
            <p className="t-titulo">{info.titulo}</p>
            <p className="t-sub text-secundario mt-1.5 mb-6">{info.texto}</p>
            {tipo === 'lineal' ? <BotonesSexo alElegir={nueva} /> : <Boton Icono={Plus} onClick={() => nueva()}>Empezar una evaluación</Boton>}
          </div>
        </div>
      ) : (
        <>
          <Seccion titulo="En este teléfono" pie="Se guardan solas mientras las llena. Al enviarlas quedan en el sistema y salen de esta lista.">
            {borradores.map((b) => (
              <Fila key={b.id}
                icono={<IconoFila Icono={b.errorEnvio ? AlertTriangle : b.pendienteEnvio ? UploadCloud : info.Icono}
                  tono={b.errorEnvio ? 'critico' : b.pendienteEnvio ? 'aviso' : info.tono} />}
                titulo={titulo(b)}
                sub={b.errorEnvio ? `No se pudo enviar: ${b.errorEnvio}` : b.pendienteEnvio ? 'Esperando conexión para enviarse' : resumen(b)}
                alHacerClic={() => navigate(`/${b.tipo}/${b.id}`)} />
            ))}
          </Seccion>
          <div className="px-4 mt-5">
            {tipo === 'lineal' ? <BotonesSexo alElegir={nueva} /> : <Boton variante="tintado" Icono={Plus} onClick={() => nueva()}>Nueva evaluación</Boton>}
          </div>
        </>
      )}
    </>
  );
}
