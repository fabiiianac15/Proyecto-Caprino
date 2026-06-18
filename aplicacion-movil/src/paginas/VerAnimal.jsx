/**
 * Ficha del animal (lectura). Lee de la caché local para funcionar offline.
 * Ofrece acceso directo a "Registrar salud" para ese animal.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Syringe, Weight, Milk } from 'lucide-react';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import Encabezado from '@componentes/comunes/Encabezado';

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="font-medium text-right text-gray-800">{valor ?? '—'}</span>
    </div>
  );
}

export default function VerAnimal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const animal = obtenerCacheAnimales().find((a) => String(a.id) === String(id));

  if (!animal) {
    return (
      <div>
        <Encabezado titulo="Animal" />
        <p className="text-center text-gray-500 py-10 px-4">
          No se encontró el animal en los datos locales. Conéctate y vuelve a
          buscar para descargarlo.
        </p>
      </div>
    );
  }

  const sexoTxt =
    animal.sexo === 'macho' ? '♂ Macho' : animal.sexo === 'hembra' ? '♀ Hembra' : '—';

  return (
    <div>
      <Encabezado titulo={animal.codigo || `Animal #${animal.id}`} />

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-5 flex items-center gap-4 border border-white shadow-sm">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm">
            🐐
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-800 truncate">
              {animal.codigo || `#${animal.id}`}
            </p>
            {animal.nombre && <p className="text-gray-600 truncate">{animal.nombre}</p>}
            <p className="text-sm text-gray-500">{sexoTxt}</p>
          </div>
        </div>

        <div className="tarjeta">
          <Dato etiqueta="Chapeta nueva" valor={animal.chapetaNueva} />
          <Dato etiqueta="Chapeta vieja" valor={animal.chapetaVieja} />
          <Dato etiqueta="Raza" valor={animal.nombreRaza} />
          <Dato etiqueta="Color" valor={animal.colorPelaje} />
          <Dato etiqueta="Corral" valor={animal.nombreCorral} />
          <Dato etiqueta="Estado" valor={animal.estado} />
          <Dato
            etiqueta="Nacimiento"
            valor={
              animal.fechaNacimiento
                ? new Date(animal.fechaNacimiento).toLocaleDateString('es-CO')
                : '—'
            }
          />
        </div>

        {/* Acciones rápidas para este animal */}
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Registrar</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { etiqueta: 'Salud', ruta: '/salud', Icono: Syringe, color: 'bg-blue-500' },
              { etiqueta: 'Pesaje', ruta: '/pesaje', Icono: Weight, color: 'bg-violet-500' },
              { etiqueta: 'Producción', ruta: '/produccion', Icono: Milk, color: 'bg-amber-500' },
            ].map(({ etiqueta, ruta, Icono, color }) => (
              <button
                key={ruta}
                onClick={() => navigate(`${ruta}?animal=${animal.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3
                           flex flex-col items-center gap-2 active:scale-[0.96] transition-transform"
              >
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icono className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                  {etiqueta}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
