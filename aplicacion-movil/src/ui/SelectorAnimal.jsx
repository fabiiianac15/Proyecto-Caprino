/**
 * Elegir un animal de la lista guardada en el teléfono (funciona sin red).
 * Se busca por chapeta o nombre; elegir de una lista evita errores de digitación.
 */

import { useMemo, useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import Hoja from './Hoja';
import Chapeta, { codigoDe } from './Chapeta';

export function FilaAnimal({ animal, alHacerClic, derecha }) {
  const Etiqueta = alHacerClic ? 'button' : 'div';
  return (
    <Etiqueta onClick={alHacerClic} className="fila">
      <Chapeta codigo={codigoDe(animal)} tamano="sm" vieja={!animal.chapetaNueva && !!animal.chapetaVieja} />
      <span className="flex-1 min-w-0">
        {animal.nombre && <span className="block t-encabezado truncate">{animal.nombre}</span>}
        <span className="block t-sub text-secundario truncate">
          {[animal.sexo === 'macho' ? 'Macho' : 'Hembra', animal.nombreRaza, animal.nombreCorral].filter(Boolean).join(' · ')}
        </span>
      </span>
      {derecha}
    </Etiqueta>
  );
}

export const filtrar = (animales, texto) => {
  const t = String(texto || '').trim().toUpperCase();
  if (!t) return animales;
  return animales.filter((a) =>
    [a.codigo, a.chapetaNueva, a.chapetaVieja, a.nombre].some((v) => String(v ?? '').toUpperCase().includes(t)));
};

export default function SelectorAnimal({ valor, alCambiar, soloHembras = false, etiqueta = 'Animal' }) {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState('');
  const animales = useMemo(() => {
    const todos = obtenerCacheAnimales().filter((a) => a.estado === 'activo' || !a.estado);
    return soloHembras ? todos.filter((a) => a.sexo === 'hembra') : todos;
  }, [soloHembras, abierta]);
  const elegido = animales.find((a) => String(a.id) === String(valor));
  const lista = filtrar(animales, texto);

  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className="fila">
        <span className="t-cuerpo shrink-0">{etiqueta}</span>
        <span className="flex-1 flex items-center justify-end gap-2 min-w-0">
          {elegido ? (
            <>
              {elegido.nombre && <span className="t-cuerpo text-secundario truncate">{elegido.nombre}</span>}
              <Chapeta codigo={codigoDe(elegido)} tamano="sm" />
            </>
          ) : <span className="t-cuerpo text-acento font-medium">Elegir</span>}
        </span>
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo={soloHembras ? 'Elegir hembra' : 'Elegir animal'} alta>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-terciario" aria-hidden="true" />
            <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Chapeta o nombre"
              className="w-full min-h-[44px] rounded-xl bg-relleno pl-10 pr-3 placeholder:text-secundario focus:outline-none" aria-label="Buscar animal" />
          </div>
        </div>
        <div className="px-4">
          {lista.length === 0 ? (
            <p className="t-sub text-secundario text-center py-10">
              {animales.length === 0 ? 'Aún no hay animales guardados en el teléfono. Abra la pestaña Rebaño con conexión.' : 'Ningún animal coincide.'}
            </p>
          ) : (
            <div className="lista">
              {lista.slice(0, 80).map((a) => (
                <FilaAnimal key={a.id} animal={a} alHacerClic={() => { alCambiar(String(a.id)); setAbierta(false); setTexto(''); }}
                  derecha={String(a.id) === String(valor) ? <CheckCircle2 className="w-5 h-5 text-acento shrink-0" aria-label="Elegido" /> : null} />
              ))}
            </div>
          )}
        </div>
      </Hoja>
    </>
  );
}
