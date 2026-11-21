/** Ficha del animal: identidad, datos básicos y los registros que se le pueden hacer. */

import { useNavigate, useParams } from 'react-router-dom';
import { Ruler, Tag, ChevronLeft } from 'lucide-react';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { nuevaLineal } from '@servicios/evaluaciones';
import Barra from '@/ui/Barra';
import Chapeta, { codigoDe } from '@/ui/Chapeta';
import { Seccion, Fila, IconoFila, EstadoVacio } from '@/ui/Lista';
import { REGISTROS } from './Inicio';
import { edadTexto, edadMeses, fechaCorta, ESTADOS_PRODUCTIVOS } from '@utilidades/formato';

export default function Animal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const animal = obtenerCacheAnimales().find((a) => String(a.id) === String(id));

  if (!animal) {
    return (
      <>
        <Barra titulo="Animal" atras />
        <EstadoVacio Icono={Tag} titulo="No se encontró el animal" texto="Puede que la lista del teléfono esté desactualizada." />
      </>
    );
  }

  const hembra = animal.sexo === 'hembra';
  const registros = REGISTROS.filter((r) => hembra || r.tipo !== 'produccion');

  const clasificar = () => {
    const b = nuevaLineal(animal, edadMeses(animal.fechaNacimiento) ?? '');
    navigate(`/lineal/${b.id}`);
  };

  // "—" = dato que falta; las filas que no aplican (p. ej. estado productivo en machos) no se muestran
  const faltante = <span className="text-terciario">Sin registrar</span>;

  return (
    <>
      <header className="bg-marca text-sobre-marca rounded-b-[24px] seguro-arriba mb-4">
        <div className="px-2 pt-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-0.5 min-h-[44px] pr-3 active:opacity-60" aria-label="Atrás">
            <ChevronLeft className="w-6 h-6" strokeWidth={2.4} />
            <span className="t-cuerpo font-medium">Rebaño</span>
          </button>
        </div>
        <div className="px-5 pb-5 pt-1">
          <Chapeta codigo={codigoDe(animal)} tamano="lg" vieja={!animal.chapetaNueva && !!animal.chapetaVieja} />
          {animal.nombre && <h1 className="t-grande mt-3">{animal.nombre}</h1>}
          <p className={`t-sub text-sobre-marca/85 ${animal.nombre ? 'mt-0.5' : 'mt-3'}`}>
            {[hembra ? 'Hembra' : 'Macho', animal.nombreRaza, edadTexto(animal.fechaNacimiento)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      <Seccion titulo="Registrar">
        {registros.map((r) => (
          <Fila key={r.tipo} icono={<IconoFila Icono={r.Icono} tono={r.tono} />} titulo={r.titulo} sub={r.sub}
            alHacerClic={() => navigate(`/registrar/${r.tipo}?animal=${animal.id}`)} />
        ))}
        {hembra && (
          <Fila icono={<IconoFila Icono={Ruler} tono="salvia" />} titulo="Clasificación lineal"
            sub="Calificar el cuerpo y la ubre, con fotos" alHacerClic={clasificar} />
        )}
      </Seccion>

      <Seccion titulo="Información" className="mt-6">
        {animal.chapetaNueva && <Fila titulo="Chapeta nueva" valor={animal.chapetaNueva} />}
        {animal.chapetaVieja && <Fila titulo="Chapeta vieja" valor={animal.chapetaVieja} />}
        <Fila titulo="Nombre" valor={animal.nombre || faltante} />
        <Fila titulo="Raza" valor={animal.nombreRaza || faltante} />
        <Fila titulo="Nacimiento" valor={animal.fechaNacimiento ? fechaCorta(animal.fechaNacimiento) : faltante} />
        <Fila titulo="Corral" valor={animal.nombreCorral || faltante} />
        {hembra && (
          <Fila titulo="Estado productivo" valor={ESTADOS_PRODUCTIVOS[animal.estadoProductivo] || animal.estadoProductivo || faltante} />
        )}
      </Seccion>
      <p className="t-nota text-secundario px-5 mt-2">El historial completo (salud, partos, producción y genealogía) está en la web, en el expediente del animal.</p>
    </>
  );
}
