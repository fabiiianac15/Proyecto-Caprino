/** Confirmación para acciones que no se pueden deshacer. */

import Hoja from './Hoja';
import { Boton } from './Controles';

export default function Confirmar({ abierta, alCerrar, titulo, texto, accion, alConfirmar }) {
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo={titulo}>
      <div className="px-4 space-y-4">
        <p className="t-cuerpo text-secundario">{texto}</p>
        <Boton variante="critico" onClick={() => { alCerrar(); alConfirmar(); }}>{accion}</Boton>
        <Boton variante="gris" onClick={alCerrar}>Cancelar</Boton>
      </div>
    </Hoja>
  );
}
