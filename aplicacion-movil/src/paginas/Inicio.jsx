/** Inicio: qué falta por enviar y los registros que más se hacen en el corral. */

import { useNavigate } from 'react-router-dom';
import { Syringe, Weight, Milk, Eye, Wifi, WifiOff, UploadCloud, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { useSincronizacion } from '@hooks/useSincronizacion';
import { listarBorradores } from '@servicios/borradores';
import Barra from '@/ui/Barra';
import { Seccion, Fila, IconoFila } from '@/ui/Lista';
import { Boton } from '@/ui/Controles';
import { useAvisos } from '@/ui/Avisos';

export const REGISTROS = [
  { tipo: 'salud', titulo: 'Salud', sub: 'Vacuna, tratamiento o enfermedad', Icono: Syringe, color: 'bg-[#C62828]' },
  { tipo: 'pesaje', titulo: 'Pesaje', sub: 'Peso y condición corporal', Icono: Weight, color: 'bg-[#1D5FA8]' },
  { tipo: 'produccion', titulo: 'Leche', sub: 'Litros del ordeño', Icono: Milk, color: 'bg-[#0F766E]' },
  { tipo: 'famacha', titulo: 'FAMACHA', sub: 'Color del ojo para detectar anemia', Icono: Eye, color: 'bg-[#B45309]' },
];

export default function Inicio() {
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { usuario } = useAuth();
  const { enLinea, pendientes, sincronizando, sincronizarAhora } = useSincronizacion();
  const borradores = listarBorradores().filter((b) => !b.pendienteEnvio);
  const nombre = (usuario?.nombre || '').split(' ')[0];

  const enviar = async () => {
    const r = await sincronizarAhora();
    if (r.omitido) avisos.info('Sin conexión', 'Se enviará cuando vuelva la señal.');
    else if (r.fallidos > 0) avisos.aviso(`${r.fallidos} sin enviar`, 'Revise el detalle en Ajustes.');
    else avisos.exito('Todo enviado', `${r.enviados} ${r.enviados === 1 ? 'registro' : 'registros'}.`);
  };

  return (
    <>
      <Barra titulo="Inicio" grande subtitulo={nombre ? `Hola, ${nombre}` : undefined} />

      <Seccion className="mt-2">
        <Fila
          icono={<IconoFila Icono={enLinea ? Wifi : WifiOff} color={enLinea ? 'bg-[#1E7B45]' : 'bg-[#6E6E73]'} />}
          titulo={enLinea ? 'Con conexión' : 'Sin conexión'}
          sub={enLinea ? 'Lo que registre se envía de una vez.' : 'Puede seguir trabajando. Todo queda guardado en el teléfono.'}
        />
        {pendientes > 0 && (
          <Fila
            icono={<IconoFila Icono={UploadCloud} color="bg-[#B45309]" />}
            titulo={`${pendientes} por enviar`}
            sub="Guardados en este teléfono"
            alHacerClic={() => navigate('/ajustes/pendientes')}
          />
        )}
      </Seccion>
      {pendientes > 0 && enLinea && (
        <div className="px-4 mt-3">
          <Boton variante="tintado" Icono={UploadCloud} onClick={enviar} disabled={sincronizando}>
            {sincronizando ? 'Enviando…' : 'Enviar ahora'}
          </Boton>
        </div>
      )}

      <Seccion titulo="Registrar" className="mt-6">
        {REGISTROS.map((r) => (
          <Fila key={r.tipo} icono={<IconoFila Icono={r.Icono} color={r.color} />} titulo={r.titulo} sub={r.sub}
            alHacerClic={() => navigate(`/registrar/${r.tipo}`)} />
        ))}
      </Seccion>

      {borradores.length > 0 && (
        <Seccion titulo="Evaluaciones sin terminar" className="mt-6">
          <Fila icono={<IconoFila Icono={ClipboardCheck} color="bg-[#5B4BC4]" />}
            titulo={`${borradores.length} ${borradores.length === 1 ? 'evaluación' : 'evaluaciones'}`}
            sub="Bienestar o clasificación lineal" alHacerClic={() => navigate('/evaluar')} />
        </Seccion>
      )}
    </>
  );
}
