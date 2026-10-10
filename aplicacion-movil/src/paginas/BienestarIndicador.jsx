/**
 * Un indicador de bienestar: la pregunta, cómo revisarlo, la calificación
 * (contando animales o eligiendo la descripción que más se parece) y las
 * fotos de evidencia.
 */

import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useBorrador } from '@hooks/useBorrador';
import { catalogoLocal } from '@servicios/catalogos';
import { borrarFotos } from '@servicios/fotosLocales';
import { nivelesDe, porcentaje, puntajeMuestreo } from '@servicios/calculos';
import { GRUPOS, colorPuntaje, valorVacio } from '@servicios/evaluaciones';
import Barra, { AccionBarra } from '@/ui/Barra';
import { Seccion, FilaInterruptor } from '@/ui/Lista';
import { Boton, Contador } from '@/ui/Controles';
import { GaleriaFotos } from '@/ui/Fotos';

export default function BienestarIndicador() {
  const { id, idIndicador } = useParams();
  const navigate = useNavigate();
  const [b, cambiar] = useBorrador(id);
  const catalogo = catalogoLocal('bienestar');
  const pos = catalogo.findIndex((i) => String(i.idIndicador) === String(idIndicador));
  const ind = catalogo[pos];

  useEffect(() => { window.scrollTo(0, 0); }, [idIndicador]);

  if (!b || !ind) return <Navigate to="/evaluar" replace />;

  const v = b.valores[ind.idIndicador] || valorVacio(ind, b.cab.tipoProductor);
  const grupo = GRUPOS.find((g) => g.clave === ind.tipoMedida);
  const siguiente = catalogo[pos + 1];
  const muestra = b.cab.tamanoMuestra;

  const poner = (cambios) => cambiar((p) => ({
    ...p, errorEnvio: null,
    valores: { ...p.valores, [ind.idIndicador]: { ...(p.valores[ind.idIndicador] || v), ...cambios } },
  }));

  // El conteo decide el puntaje con los cortes de la tabla del ICA
  const ponerConteo = (campo, valor) => {
    const nuevo = { ...v, [campo]: valor };
    const p = puntajeMuestreo(ind, nuevo);
    poner({ [campo]: valor, ...(p !== null ? { puntaje: p } : {}) });
  };
  const ponerFotos = (claves) => {
    borrarFotos((v.fotos || []).filter((c) => !claves.includes(c)));
    poner({ fotos: claves });
  };
  const irSiguiente = () => {
    if (siguiente) navigate(`/bienestar/${id}/indicador/${siguiente.idIndicador}`, { replace: true });
    else navigate(-1);
  };

  const pct = porcentaje(v);
  const conteoPasado = v.nEvaluados !== '' && v.nHallazgo !== '' && Number(v.nHallazgo) > Number(v.nEvaluados);
  const unidad = ind.unidad || 'animales';

  return (
    <>
      <Barra titulo={`${pos + 1} de ${catalogo.length}`} atras
        accion={<AccionBarra alHacerClic={irSiguiente} fuerte>{siguiente ? 'Siguiente' : 'Listo'}</AccionBarra>} />

      <div className="px-4 pt-4">
        <p className="t-nota text-secundario uppercase tracking-wide">{grupo?.titulo}{ind.esDocumental ? ' · Revisar papeles' : ''}</p>
        <h2 className="t-titulo mt-1">{ind.nombre}</h2>
        {ind.pregunta && <p className="t-cuerpo mt-2">{ind.pregunta}</p>}
        {ind.metodo && <p className="t-sub text-secundario mt-2"><span className="font-semibold text-texto">Cómo revisarlo. </span>{ind.metodo}</p>}
      </div>

      <Seccion className="mt-5">
        <FilaInterruptor titulo="No aplica en esta granja" valor={!v.aplica}
          sub={ind.soloConfinamiento ? 'Solo se califica cuando las cabras están encerradas.' : undefined}
          alCambiar={(no) => poner({ aplica: !no, ...(no ? { puntaje: null } : {}) })} />
      </Seccion>

      {v.aplica && (
        <>
          {ind.medicion && (
            <Seccion titulo="Contar" className="mt-6"
              pie={conteoPasado ? undefined : pct !== null ? `Eso es el ${String(pct).replace('.', ',')} %. La calificación se elige sola con ese número.` : 'Con el conteo la app elige la calificación. También puede elegirla abajo.'}>
              <div className="fila">
                <span className="flex-1 t-cuerpo">{unidad.charAt(0).toUpperCase() + unidad.slice(1)} que revisó</span>
                <Contador valor={v.nEvaluados} alCambiar={(n) => ponerConteo('nEvaluados', n)} etiqueta={`${unidad} revisados`} />
              </div>
              <div className="fila">
                <span className="flex-1 t-cuerpo">{ind.medicion === 'CUMPLE' ? 'Están bien' : 'Tienen el problema'}</span>
                <Contador valor={v.nHallazgo} alCambiar={(n) => ponerConteo('nHallazgo', n)}
                  etiqueta={ind.medicion === 'CUMPLE' ? 'Están bien' : 'Tienen el problema'} />
              </div>
            </Seccion>
          )}
          {ind.medicion && conteoPasado && <p className="pie-seccion px-8 text-critico" role="alert">No pueden ser más que los revisados.</p>}
          {ind.medicion && v.nEvaluados === '' && muestra !== '' && muestra != null && (
            <div className="px-4 mt-3">
              <Boton variante="gris" onClick={() => ponerConteo('nEvaluados', Number(muestra))}>Usar la muestra: {muestra}</Boton>
            </div>
          )}

          <Seccion titulo="Calificación" className="mt-6" pie="Elija la descripción que más se parece a lo que vio.">
            {nivelesDe(ind).map((p) => {
              const elegido = v.puntaje === p;
              return (
                <button key={p} type="button" role="radio" aria-checked={elegido} onClick={() => poner({ puntaje: p })}
                  className={`fila items-start ${elegido ? 'bg-acento/10' : ''}`} style={{ '--sangria': '68px' }}>
                  <span className={`w-10 shrink-0 t-titulo tabular-nums ${colorPuntaje(p)}`}>{p}</span>
                  <span className="flex-1 t-sub">{ind.criterios?.[p] || (p === 100 ? 'Cumple del todo.' : p === 0 ? 'No cumple.' : 'Cumple a medias.')}</span>
                  {elegido && <CheckCircle2 className="w-6 h-6 text-acento shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </Seccion>

          {ind.esDocumental && (
            <Seccion titulo="Qué papel le mostraron" className="mt-6">
              <input className="campo" value={v.soporteDoc || ''} onChange={(e) => poner({ soporteDoc: e.target.value })}
                placeholder="Ej. registro de tratamientos de 2026" aria-label="Soporte documental" />
            </Seccion>
          )}

          <div className="px-4 mt-6">
            <h2 className="cabecera-seccion">Fotos de evidencia</h2>
            <GaleriaFotos claves={v.fotos || []} alCambiar={ponerFotos} maximo={4} />
          </div>

          <Seccion titulo="Observación" className="mt-4">
            <textarea className="campo min-h-[72px]" value={v.observacion || ''} onChange={(e) => poner({ observacion: e.target.value })}
              placeholder="Opcional" aria-label="Observación" />
          </Seccion>
        </>
      )}

      <div className="px-4 mt-6">
        <Boton onClick={irSiguiente}>{siguiente ? 'Siguiente indicador' : 'Volver a la evaluación'}</Boton>
      </div>
    </>
  );
}
