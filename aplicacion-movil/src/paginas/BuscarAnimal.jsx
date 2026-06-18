/**
 * Buscar / escanear animal.
 *
 * - Botón de escaneo QR (solo en dispositivo nativo).
 * - Búsqueda por texto sobre la caché local (funciona offline).
 * - Carga inicial: refresca desde el backend cuando hay red.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, ChevronRight, RefreshCw } from 'lucide-react';
import {
  listarAnimales,
  filtrarAnimales,
  buscarPorCodigo,
} from '@servicios/animalesAPI';
import { fechaCacheAnimales } from '@servicios/almacenamientoLocal';
import { useEscaner } from '@hooks/useEscaner';
import { useConectividad } from '@hooks/useConectividad';
import Encabezado from '@componentes/comunes/Encabezado';
import BotonGrande from '@componentes/comunes/BotonGrande';

export default function BuscarAnimal() {
  const navigate = useNavigate();
  const enLinea = useConectividad();
  const { escanear, disponible: escanerDisponible } = useEscaner();

  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState('');

  // Carga inicial: refresca desde el backend si hay red, y muestra la caché.
  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const { desdeCache } = await listarAnimales();
        if (desdeCache) {
          setAviso('Mostrando datos guardados (sin conexión).');
        }
      } catch {
        setAviso('No se pudo actualizar la lista. Mostrando datos locales.');
      } finally {
        setResultados(filtrarAnimales(''));
        setCargando(false);
      }
    })();
  }, []);

  const alBuscar = (valor) => {
    setTexto(valor);
    setResultados(filtrarAnimales(valor));
  };

  const alEscanear = async () => {
    setAviso('');
    try {
      const codigo = await escanear();
      if (!codigo) return;
      const animal = buscarPorCodigo(codigo);
      if (animal) {
        navigate(`/animal/${animal.id}`);
      } else {
        setTexto(codigo);
        setResultados(filtrarAnimales(codigo));
        setAviso(`No se encontró ningún animal con el código "${codigo}".`);
      }
    } catch (err) {
      setAviso(err.message);
    }
  };

  const fecha = fechaCacheAnimales();

  const Sexo = ({ sexo }) => {
    if (sexo === 'macho')
      return <span className="text-blue-600 text-sm font-medium">♂ Macho</span>;
    if (sexo === 'hembra')
      return <span className="text-pink-600 text-sm font-medium">♀ Hembra</span>;
    return <span className="text-gray-400 text-sm">—</span>;
  };

  return (
    <div>
      <Encabezado titulo="Buscar animal" />

      <div className="px-4 py-4 space-y-3 max-w-md mx-auto">
        {escanerDisponible && (
          <BotonGrande Icono={Camera} onClick={alEscanear}>
            Escanear chapeta (QR)
          </BotonGrande>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="campo-grande pl-11"
            type="text"
            autoCapitalize="characters"
            placeholder="Código, chapeta o nombre…"
            value={texto}
            onChange={(e) => alBuscar(e.target.value)}
          />
        </div>

        {aviso && (
          <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
            {aviso}
          </p>
        )}

        {cargando && (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-6">
            <RefreshCw className="w-5 h-5 animate-spin" /> Cargando…
          </div>
        )}

        <ul className="space-y-2">
          {resultados.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => navigate(`/animal/${a.id}`)}
                className="tarjeta w-full text-left active:bg-gray-50 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center text-2xl shrink-0">
                  🐐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-800">
                    {a.codigo || a.chapetaNueva || `#${a.id}`}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {a.nombre ? `${a.nombre} · ` : ''}
                    <Sexo sexo={a.sexo} />
                    {a.nombreRaza ? ` · ${a.nombreRaza}` : ''}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </button>
            </li>
          ))}
          {!cargando && resultados.length === 0 && (
            <li className="text-center text-gray-500 py-8">
              {texto ? 'Sin coincidencias.' : 'No hay animales en la caché local.'}
            </li>
          )}
        </ul>

        {fecha && (
          <p className="text-center text-xs text-gray-400 pt-2">
            Datos actualizados: {new Date(fecha).toLocaleString('es-CO')}
            {!enLinea && ' (sin conexión)'}
          </p>
        )}
      </div>
    </div>
  );
}
