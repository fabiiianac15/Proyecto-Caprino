/** Ficha del animal con los registros que se le pueden hacer. */

import { useNavigate, useParams } from 'react-router-dom';
import { Ruler, Tag } from 'lucide-react';
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

  return (
    <>
      <Barra titulo={animal.nombre || 'Animal'} atras />

      <div className="px-4 pt-5 pb-2 text-center">
        <Chapeta codigo={codigoDe(animal)} tamano="lg" />
        <h2 className="t-titulo mt-3">{animal.nombre || 'Sin nombre'}</h2>
        <p className="t-sub text-secundario">
          {[hembra ? 'Hembra' : 'Macho', animal.nombreRaza, edadTexto(animal.fechaNacimiento)].filter(Boolean).join(' · ')}
        </p>
      </div>

      <Seccion titulo="Registrar" className="mt-4">
        {registros.map((r) => (
          <Fila key={r.tipo} icono={<IconoFila Icono={r.Icono} color={r.color} />} titulo={r.titulo}
            alHacerClic={() => navigate(`/registrar/${r.tipo}?animal=${animal.id}`)} />
        ))}
        {hembra && (
          <Fila icono={<IconoFila Icono={Ruler} color="bg-[#5B4BC4]" />} titulo="Clasificación lineal"
            sub="Calificar el cuerpo y la ubre, con fotos" alHacerClic={clasificar} />
        )}
      </Seccion>

      <Seccion titulo="Datos" className="mt-6">
        {animal.chapetaNueva && <Fila titulo="Chapeta nueva" valor={animal.chapetaNueva} />}
        {animal.chapetaVieja && <Fila titulo="Chapeta vieja" valor={animal.chapetaVieja} />}
        {animal.codigo && <Fila titulo="Código" valor={animal.codigo} />}
        {animal.nombreCorral && <Fila titulo="Corral" valor={animal.nombreCorral} />}
        {hembra && animal.estadoProductivo && (
          <Fila titulo="Estado productivo" valor={ESTADOS_PRODUCTIVOS[animal.estadoProductivo] || animal.estadoProductivo} />
        )}
        {animal.fechaNacimiento && <Fila titulo="Nacimiento" valor={fechaCorta(animal.fechaNacimiento)} />}
      </Seccion>
    </>
  );
}
