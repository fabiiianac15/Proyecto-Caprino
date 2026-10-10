/** Rebaño: buscar un animal por chapeta o nombre, o leer el código QR. */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanLine, Tag, X } from 'lucide-react';
import { listarAnimales, buscarPorCodigo } from '@servicios/animalesAPI';
import { obtenerCacheAnimales, fechaCacheAnimales } from '@servicios/almacenamientoLocal';
import { useEscaner } from '@hooks/useEscaner';
import Barra from '@/ui/Barra';
import { EstadoVacio } from '@/ui/Lista';
import { FilaAnimal, filtrar } from '@/ui/SelectorAnimal';
import { useAvisos } from '@/ui/Avisos';
import { haceCuanto } from '@utilidades/formato';

export default function Rebano() {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { escanear, escaneando, disponible } = useEscaner();
  const [animales, setAnimales] = useState(() => obtenerCacheAnimales());
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [desdeCache, setDesdeCache] = useState(false);

  useEffect(() => {
    let vivo = true;
    listarAnimales()
      .then((r) => { if (vivo) { setAnimales(r.animales); setDesdeCache(r.desdeCache); } })
      .catch(() => { if (vivo) setDesdeCache(true); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const leerCodigo = async () => {
    try {
      const codigo = await escanear();
      if (!codigo) return;
      const animal = buscarPorCodigo(codigo);
      if (animal) navigate(`/animal/${animal.id}`);
      else { setTexto(codigo); avisos.aviso('No está en la lista', `Ningún animal tiene el código ${codigo}.`); }
    } catch (e) {
      avisos.error('No se pudo leer', e.message);
    }
  };

  // Mientras la cámara lee, la página debe quedar transparente
  if (escaneando) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-end pb-16">
        <div className="w-64 h-64 border-4 border-white rounded-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <p className="text-white t-encabezado drop-shadow">Apunte al código de la chapeta</p>
      </div>
    );
  }

  const activos = animales.filter((a) => !a.estado || a.estado === 'activo');
  const lista = filtrar(activos, texto);
  const fecha = fechaCacheAnimales();

  return (
    <>
      <Barra titulo="Rebaño" grande
        subtitulo={cargando ? 'Actualizando…' : `${activos.length} animales activos`}
        accion={disponible && (
          <button onClick={leerCodigo} className="w-11 h-11 flex items-center justify-center text-acento active:opacity-60" aria-label="Leer código QR">
            <ScanLine className="w-6 h-6" />
          </button>
        )} />

      <div className="px-4 pb-3 sticky top-[44px] z-10 bg-fondo">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secundario" aria-hidden="true" />
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Chapeta o nombre" aria-label="Buscar animal"
            className="w-full min-h-[44px] rounded-xl bg-relleno pl-10 pr-11 placeholder:text-secundario focus:outline-none" />
          {texto && (
            <button onClick={() => setTexto('')} className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-secundario" aria-label="Borrar búsqueda">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {lista.length === 0 ? (
        <EstadoVacio Icono={Tag}
          titulo={activos.length === 0 ? 'Aún no hay animales en el teléfono' : 'Ningún animal coincide'}
          texto={activos.length === 0 ? 'Conéctese a internet una vez para descargar la lista.' : 'Revise la chapeta o busque por el nombre.'} />
      ) : (
        <div className="px-4">
          <div className="lista">
            {lista.slice(0, 150).map((a) => (
              <FilaAnimal key={a.id} animal={a} alHacerClic={() => navigate(`/animal/${a.id}`)} />
            ))}
          </div>
          <p className="pie-seccion">
            {lista.length > 150 ? `Se muestran 150 de ${lista.length}. Escriba para afinar la búsqueda. ` : ''}
            {desdeCache && fecha ? `Sin conexión: lista guardada ${haceCuanto(fecha)}.` : ''}
          </p>
        </div>
      )}
    </>
  );
}
