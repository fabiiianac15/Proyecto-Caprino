/**
 * Banner superior fijo que informa el estado de conexión y los registros
 * pendientes de sincronizar. Es la pista visual principal del modo offline.
 */

import { WifiOff, RefreshCw, UploadCloud } from 'lucide-react';
import { useSincronizacion } from '@hooks/useSincronizacion';

export default function BannerEstado() {
  const { enLinea, pendientes, sincronizando } = useSincronizacion();

  if (enLinea && pendientes === 0 && !sincronizando) {
    return null; // Todo en orden y conectado: no estorbar.
  }

  let texto;
  let color;
  let Icono;

  if (!enLinea) {
    color = 'bg-amber-400 text-amber-900';
    Icono = WifiOff;
    texto =
      pendientes > 0
        ? `Sin conexión · ${pendientes} registro(s) se enviarán al volver el internet`
        : 'Sin conexión · los datos se guardarán en el dispositivo';
  } else if (sincronizando) {
    color = 'bg-green-600 text-white';
    Icono = RefreshCw;
    texto = 'Sincronizando…';
  } else {
    color = 'bg-green-100 text-green-800';
    Icono = UploadCloud;
    texto = `${pendientes} registro(s) pendiente(s) de sincronizar`;
  }

  return (
    <div
      className={`${color} flex items-center justify-center gap-2 text-center text-sm font-medium px-3 py-2`}
    >
      <Icono className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
      {texto}
    </div>
  );
}
