/**
 * Evaluar: las dos evaluaciones largas que se hacen en el corral. Lo que se
 * empieza queda guardado en el teléfono hasta que se envía.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Ruler, Plus, UploadCloud, AlertTriangle } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { listarBorradores, fotosDeBorrador } from '@servicios/borradores';
import { catalogoLocal } from '@servicios/catalogos';
import { calcularBienestar, calcularLineal } from '@servicios/calculos';
import { nuevaBienestar, nuevaLineal } from '@servicios/evaluaciones';
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
    Icono: HeartPulse, color: 'bg-[#0F766E]', titulo: 'Bienestar animal',
    texto: 'Revisión de la granja según la guía del ICA: instalaciones, animales y registros, con fotos de lo que se encuentre.',
  },
  lineal: {
    Icono: Ruler, color: 'bg-[#5B4BC4]', titulo: 'Clasificación lineal',
    texto: 'Calificar el cuerpo, la ubre y las patas de una cabra, rasgo por rasgo, con las fotos de cada vista.',
  },
};

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

  const nueva = async () => {
    if (tipo === 'lineal') { navigate(`/lineal/${nuevaLineal().id}`); return; }
    const b = await nuevaBienestar(usuario?.nombre || '');
    if (!b) { avisos.error('Falta la lista de indicadores', 'Conéctese a internet una vez para descargarla.'); return; }
    navigate(`/bienestar/${b.id}`);
  };

  const resumen = (b) => {
    const fotos = fotosDeBorrador(b).length;
    const partes = [];
    if (b.tipo === 'bienestar') {
      const r = calcularBienestar(catalogo, b.valores, b.cab.tieneRspp, b.cab.tieneAsi);
      partes.push(`${r.calificados} de ${r.aplicables} indicadores`);
    } else {
      const r = calcularLineal(catalogo, b.valores);
      partes.push(`${r.calificados} de ${r.total} rasgos`);
    }
    partes.push(`${fotos} ${fotos === 1 ? 'foto' : 'fotos'}`);
    return partes.join(' · ');
  };

  const titulo = (b) => {
    if (b.tipo === 'bienestar') return `Visita del ${fechaCorta(b.cab.fechaEvaluacion)}`;
    const a = animales.find((x) => String(x.id) === String(b.idAnimal));
    return a ? `${codigoDe(a)} · ${a.nombre || 'Sin nombre'}` : 'Cabra sin elegir';
  };

  return (
    <>
      <Barra titulo="Evaluar" grande />
      <div className="px-4 pb-4">
        <Segmentado opciones={TIPOS} valor={tipo} alCambiar={cambiar} etiqueta="Tipo de evaluación" />
      </div>

      {borradores.length === 0 ? (
        <EstadoVacio Icono={info.Icono} titulo={info.titulo} texto={info.texto}>
          <Boton Icono={Plus} onClick={nueva}>Empezar una evaluación</Boton>
        </EstadoVacio>
      ) : (
        <>
          <Seccion titulo="En este teléfono" pie="Se guardan solas mientras las llena. Al enviarlas quedan en el sistema y salen de esta lista.">
            {borradores.map((b) => (
              <Fila key={b.id}
                icono={<IconoFila Icono={b.errorEnvio ? AlertTriangle : b.pendienteEnvio ? UploadCloud : info.Icono}
                  color={b.errorEnvio ? 'bg-[#C62828]' : b.pendienteEnvio ? 'bg-[#B45309]' : info.color} />}
                titulo={titulo(b)}
                sub={b.errorEnvio ? `No se pudo enviar: ${b.errorEnvio}` : b.pendienteEnvio ? 'Esperando conexión para enviarse' : resumen(b)}
                alHacerClic={() => navigate(`/${b.tipo}/${b.id}`)} />
            ))}
          </Seccion>
          <div className="px-4 mt-5">
            <Boton variante="tintado" Icono={Plus} onClick={nueva}>Nueva evaluación</Boton>
          </div>
        </>
      )}
    </>
  );
}
