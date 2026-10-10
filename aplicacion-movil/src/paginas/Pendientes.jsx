/** Lo que está guardado en el teléfono esperando enviarse al sistema. */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { useSincronizacion } from '@hooks/useSincronizacion';
import { obtenerCola, eliminarDeCola } from '@servicios/almacenamientoLocal';
import { borradoresPorEnviar } from '@servicios/borradores';
import Barra from '@/ui/Barra';
import { Seccion, Fila, IconoFila, EstadoVacio } from '@/ui/Lista';
import { Boton } from '@/ui/Controles';
import Confirmar from '@/ui/Confirmar';
import { useAvisos } from '@/ui/Avisos';
import { haceCuanto } from '@utilidades/formato';

const NOMBRE = { bienestar: 'Evaluación de bienestar', lineal: 'Clasificación lineal' };

export default function Pendientes() {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { enLinea, sincronizando, sincronizarAhora } = useSincronizacion();
  const [, pintar] = useState(0);
  const [quitar, setQuitar] = useState(null);

  useEffect(() => {
    const f = () => pintar((n) => n + 1);
    window.addEventListener('cola-actualizada', f);
    return () => window.removeEventListener('cola-actualizada', f);
  }, []);

  const cola = obtenerCola();
  const evaluaciones = borradoresPorEnviar();

  const enviar = async () => {
    const r = await sincronizarAhora();
    if (r.omitido) avisos.info('Sin conexión', 'Se enviará cuando vuelva la señal.');
    else if (r.fallidos > 0) avisos.aviso(`${r.fallidos} sin enviar`, 'Mire el motivo en cada registro.');
    else avisos.exito('Todo enviado', `${r.enviados} ${r.enviados === 1 ? 'registro' : 'registros'}.`);
    pintar((n) => n + 1);
  };

  const eliminar = () => {
    eliminarDeCola(quitar.id);
    window.dispatchEvent(new Event('cola-actualizada'));
  };

  return (
    <>
      <Barra titulo="Por enviar" atras />

      {cola.length + evaluaciones.length === 0 ? (
        <EstadoVacio Icono={CheckCircle2} titulo="Todo está en el sistema" texto="No hay registros esperando en este teléfono." />
      ) : (
        <>
          <div className="px-4 pt-4">
            <Boton Icono={UploadCloud} onClick={enviar} disabled={sincronizando || !enLinea}>
              {sincronizando ? 'Enviando…' : enLinea ? 'Enviar ahora' : 'Sin conexión'}
            </Boton>
          </div>

          {cola.length > 0 && (
            <Seccion titulo="Registros" className="mt-6" pie="Si el servidor rechazó un registro, tóquelo para quitarlo y vuelva a hacerlo con los datos corregidos.">
              {cola.map((i) => (
                <Fila key={i.id}
                  icono={<IconoFila Icono={i.estado === 'error' ? AlertTriangle : UploadCloud} color={i.estado === 'error' ? 'bg-[#C62828]' : 'bg-[#B45309]'} />}
                  titulo={i.resumen || i.tipo}
                  sub={i.estado === 'error' ? `Rechazado: ${i.ultimoError}` : `Guardado ${haceCuanto(i.fechaCreacion)}`}
                  flecha={false} derecha={<Trash2 className="w-5 h-5 text-secundario shrink-0" aria-label="Quitar" />}
                  alHacerClic={() => setQuitar(i)} />
              ))}
            </Seccion>
          )}

          {evaluaciones.length > 0 && (
            <Seccion titulo="Evaluaciones" className="mt-6">
              {evaluaciones.map((b) => (
                <Fila key={b.id} icono={<IconoFila Icono={UploadCloud} color="bg-[#B45309]" />} titulo={NOMBRE[b.tipo]}
                  sub={`Guardada ${haceCuanto(b.modificado)}`} alHacerClic={() => navigate(`/${b.tipo}/${b.id}`)} />
              ))}
            </Seccion>
          )}
        </>
      )}

      <Confirmar abierta={!!quitar} alCerrar={() => setQuitar(null)} titulo="Quitar registro" accion="Quitar"
        texto={`Se borra del teléfono "${quitar?.resumen || ''}" sin enviarlo. No se puede deshacer.`} alConfirmar={eliminar} />
    </>
  );
}
