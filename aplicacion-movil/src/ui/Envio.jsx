/**
 * Envío de una evaluación guardada en el teléfono: botón con el avance y la
 * pantalla que se muestra cuando la evaluación quedó esperando conexión.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { enviarBorrador } from '@servicios/envio';
import { useAvisos } from './Avisos';
import { Boton } from './Controles';
import { EstadoVacio } from './Lista';

/** Devuelve { enviar, avance } para enviar un borrador y volver a Evaluar. */
export function useEnvio(id) {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const [avance, setAvance] = useState('');

  const enviar = async (estado = 'FINALIZADA') => {
    setAvance('Preparando…');
    try {
      const r = await enviarBorrador(id, estado, setAvance);
      if (r.estado === 'enviado') avisos.exito('Evaluación enviada', 'Ya está en el sistema con sus fotos.');
      else avisos.info('Guardada en el teléfono', 'Se enviará sola cuando haya conexión.');
      navigate('/evaluar', { replace: true });
    } catch (e) {
      avisos.error('El servidor no la aceptó', e.message);
    } finally {
      setAvance('');
    }
  };

  return { enviar, avance };
}

/** Pantalla para una evaluación que ya se mandó a enviar y espera la red. */
export function EnEspera({ borrador, alEditar, envio }) {
  return (
    <EstadoVacio Icono={UploadCloud} titulo="Lista para enviarse"
      texto={borrador.idRemoto
        ? 'La evaluación ya llegó al sistema. Faltan fotos por subir y se enviarán cuando haya conexión.'
        : 'Se enviará sola cuando el teléfono tenga conexión con el servidor.'}>
      <div className="space-y-3">
        <Boton Icono={UploadCloud} onClick={() => envio.enviar(borrador.pendienteEnvio || 'FINALIZADA')} disabled={!!envio.avance}>
          {envio.avance || 'Enviar ahora'}
        </Boton>
        {!borrador.idRemoto && <Boton variante="gris" onClick={alEditar}>Seguir editando</Boton>}
      </div>
    </EstadoVacio>
  );
}
