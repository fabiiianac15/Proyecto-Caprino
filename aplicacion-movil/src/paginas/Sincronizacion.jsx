/**
 * Estado de la cola de sincronización: lista de registros pendientes y botón
 * para forzar el envío. Los registros se envían solos al recuperar la conexión;
 * esta pantalla da control y visibilidad manual.
 */

import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { obtenerCola, eliminarDeCola } from '@servicios/almacenamientoLocal';
import { useSincronizacion } from '@hooks/useSincronizacion';
import Encabezado from '@componentes/comunes/Encabezado';
import BotonGrande from '@componentes/comunes/BotonGrande';

export default function Sincronizacion() {
  const { enLinea, sincronizando, sincronizarAhora, ultimoResultado } =
    useSincronizacion();
  const [cola, setCola] = useState([]);

  const refrescarCola = () => setCola(obtenerCola());

  useEffect(() => {
    refrescarCola();
    window.addEventListener('cola-actualizada', refrescarCola);
    return () => window.removeEventListener('cola-actualizada', refrescarCola);
  }, []);

  const alSincronizar = async () => {
    await sincronizarAhora();
    refrescarCola();
  };

  const descartar = (id) => {
    eliminarDeCola(id);
    window.dispatchEvent(new Event('cola-actualizada'));
    refrescarCola();
  };

  return (
    <div>
      <Encabezado titulo="Sincronización" />

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <div className="tarjeta flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="font-bold text-lg flex items-center gap-1.5">
              {enLinea ? (
                <><Wifi className="w-5 h-5 text-green-600" /> En línea</>
              ) : (
                <><WifiOff className="w-5 h-5 text-amber-500" /> Sin conexión</>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="font-bold text-2xl">{cola.length}</p>
          </div>
        </div>

        <BotonGrande
          Icono={RefreshCw}
          onClick={alSincronizar}
          disabled={!enLinea || sincronizando || cola.length === 0}
        >
          {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
        </BotonGrande>

        {ultimoResultado && !sincronizando && (
          <p className="text-center text-sm text-gray-600">
            Último envío: {ultimoResultado.enviados} ok ·{' '}
            {ultimoResultado.fallidos} con error
          </p>
        )}

        <ul className="space-y-2">
          {cola.map((item) => (
            <li key={item.id} className="tarjeta">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold capitalize">{item.tipo}</p>
                  <p className="text-sm text-gray-500">{item.resumen}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.fechaCreacion).toLocaleString('es-CO')}
                  </p>
                  {item.estado === 'error' && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {item.ultimoError || 'Error al enviar'} ({item.intentos} intentos)
                    </p>
                  )}
                </div>
                <button
                  onClick={() => descartar(item.id)}
                  className="text-red-500 text-sm underline shrink-0"
                >
                  Descartar
                </button>
              </div>
            </li>
          ))}
          {cola.length === 0 && (
            <li className="flex flex-col items-center text-gray-500 py-10">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
              No hay registros pendientes.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
