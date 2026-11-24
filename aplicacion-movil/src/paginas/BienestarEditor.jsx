/**
 * Evaluación de bienestar animal (MEBA del ICA) en el teléfono.
 *
 * Esta pantalla es el índice de la visita: datos generales, los indicadores
 * agrupados y el resultado que se va calculando. Cada indicador se abre en su
 * propia pantalla.
 */

import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, UploadCloud, Trash2 } from 'lucide-react';
import { useBorrador } from '@hooks/useBorrador';
import { catalogoLocal } from '@servicios/catalogos';
import { eliminarBorrador } from '@servicios/borradores';
import { borrarFotos } from '@servicios/fotosLocales';
import { calcularBienestar } from '@servicios/calculos';
import { GRUPOS, TIPOS_PRODUCTOR, NOMBRE_CLASIF, colorPuntaje, reaplicar, hoy, docsDe } from '@servicios/evaluaciones';
import { SeccionMuestra, FilasDocumentos, HojaDocumento } from '@/ui/BienestarICA';
import Barra from '@/ui/Barra';
import { Seccion, Fila, FilaCampo } from '@/ui/Lista';
import { Boton } from '@/ui/Controles';
import Hoja from '@/ui/Hoja';
import Confirmar from '@/ui/Confirmar';
import { GaleriaFotos } from '@/ui/Fotos';
import { useEnvio, EnEspera } from '@/ui/Envio';

export default function BienestarEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, cambiar] = useBorrador(id);
  const envio = useEnvio(id);
  const [hojaTipo, setHojaTipo] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [hojaDoc, setHojaDoc] = useState(null); // 'RSPP' | 'ASI'
  const catalogo = catalogoLocal('bienestar');

  if (!b || b.tipo !== 'bienestar') return <Navigate to="/evaluar" replace />;

  if (b.pendienteEnvio || b.idRemoto) {
    return (
      <>
        <Barra titulo="Bienestar" atras />
        <EnEspera borrador={b} envio={envio} alEditar={() => cambiar({ pendienteEnvio: null })} />
      </>
    );
  }

  const { cab, valores } = b;
  const docs = docsDe(cab);
  const r = calcularBienestar(catalogo, valores, docs.rspp.estado === 'VIGENTE', docs.asi.estado === 'VIGENTE');
  const cambiarCab = (f) => cambiar((p) => ({ ...p, errorEnvio: null, cab: f(p.cab) }));
  const ponerDoc = (sigla, d) => cambiarCab((c) => ({ ...c, ...docsDe(c), [sigla.toLowerCase()]: d }));
  const claveFotosDoc = (sigla) => (sigla === 'RSPP' ? 'fotosRspp' : 'fotosAsi');
  const ponerFotosDoc = (sigla, claves) => {
    borrarFotos((b[claveFotosDoc(sigla)] || []).filter((c) => !claves.includes(c)));
    cambiar({ [claveFotosDoc(sigla)]: claves });
  };
  const ponerCab = (campo) => (e) => cambiar((p) => ({ ...p, errorEnvio: null, cab: { ...p.cab, [campo]: e?.target ? e.target.value : e } }));
  const tipo = TIPOS_PRODUCTOR.find((t) => t.valor === cab.tipoProductor);

  const ponerTipo = (valor) => {
    cambiar((p) => ({ ...p, cab: { ...p.cab, tipoProductor: valor }, valores: reaplicar(catalogo, p.valores, valor) }));
    setHojaTipo(false);
  };
  const ponerFotos = (claves) => {
    borrarFotos((b.fotosGenerales || []).filter((c) => !claves.includes(c)));
    cambiar({ fotosGenerales: claves });
  };
  const eliminar = async () => { await eliminarBorrador(id); navigate('/evaluar', { replace: true }); };

  const estadoDe = (ind) => {
    const v = valores[ind.idIndicador];
    if (!v || !v.aplica) return { sub: 'No aplica', derecha: null };
    const fotos = v.fotos?.length ? ` · ${v.fotos.length} ${v.fotos.length === 1 ? 'foto' : 'fotos'}` : '';
    if (v.puntaje == null) return { sub: `Sin calificar${fotos}`, derecha: null };
    return {
      sub: `Calificado${fotos}`,
      derecha: <span className={`t-encabezado tabular-nums shrink-0 ${colorPuntaje(v.puntaje)}`}>{v.puntaje}</span>,
    };
  };

  return (
    <>
      <Barra titulo="Bienestar" atras />

      {/* Resultado, se actualiza con cada indicador */}
      <div className="px-4 pt-4">
        <div className="bg-tarjeta rounded-lista p-4 flex items-center gap-4">
          <div className="text-center shrink-0 w-[92px]">
            <p className="text-[40px] leading-[44px] font-bold tabular-nums">{r.calificados ? Math.round(r.total) : '–'}</p>
            <p className="t-nota text-secundario">de 100</p>
          </div>
          <div className="min-w-0">
            <p className="t-encabezado">{r.calificados ? `Bienestar ${NOMBRE_CLASIF[r.clasificacion].toLowerCase()}` : 'Aún sin resultado'}</p>
            <p className="t-sub text-secundario">{r.calificados} de {r.aplicables} indicadores calificados</p>
            <div className="h-1.5 rounded-full bg-relleno mt-2 overflow-hidden" aria-hidden="true">
              <div className="h-full bg-acento rounded-full" style={{ width: `${r.aplicables ? (r.calificados / r.aplicables) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
        {b.errorEnvio && <p className="t-sub text-critico mt-3 px-1" role="alert">No se pudo enviar: {b.errorEnvio}</p>}
      </div>

      <Seccion titulo="1. La visita" className="mt-6">
        <FilaCampo etiqueta="Fecha" type="date" value={cab.fechaEvaluacion} max={hoy()} onChange={ponerCab('fechaEvaluacion')} />
        <Fila titulo="Tipo de granja" valor={tipo?.etiqueta} alHacerClic={() => setHojaTipo(true)} />
        <FilaCampo etiqueta="Quién evalúa" value={cab.evaluadores} onChange={ponerCab('evaluadores')} placeholder="Nombres" />
      </Seccion>

      <SeccionMuestra cab={cab} cambiarCab={cambiarCab} />

      <FilasDocumentos docs={docs} total={r.total} alAbrir={setHojaDoc} />

      {GRUPOS.map((g) => {
        const inds = catalogo.filter((i) => i.tipoMedida === g.clave);
        if (!inds.length) return null;
        return (
          <Seccion key={g.clave} className="mt-6" pie={g.ayuda}
            titulo={`${g.titulo} · vale ${g.peso}${r.prom[g.clave] != null ? ` · va en ${Math.round(r.prom[g.clave])}` : ''}`}>
            {inds.map((ind) => {
              const e = estadoDe(ind);
              return (
                <Fila key={ind.idIndicador} titulo={ind.nombre} sub={e.sub} derecha={e.derecha}
                  alHacerClic={() => navigate(`/bienestar/${id}/indicador/${ind.idIndicador}`)} />
              );
            })}
          </Seccion>
        );
      })}


      <div className="px-4 mt-6">
        <h2 className="cabecera-seccion">Fotos generales de la granja</h2>
        <GaleriaFotos claves={b.fotosGenerales || []} alCambiar={ponerFotos} maximo={8} />
      </div>

      <Seccion titulo="Observaciones" className="mt-4">
        <textarea className="campo min-h-[88px]" value={cab.observaciones} onChange={ponerCab('observaciones')}
          placeholder="Lo que quiera dejar anotado de la visita" aria-label="Observaciones" />
      </Seccion>

      <div className="px-4 mt-6 space-y-3">
        <Boton Icono={r.sinCalificar === 0 ? CheckCircle2 : undefined} onClick={() => envio.enviar('FINALIZADA')}
          disabled={!!envio.avance || r.sinCalificar > 0 || r.aplicables === 0}>
          {envio.avance || (r.sinCalificar > 0 ? `Faltan ${r.sinCalificar} indicadores` : 'Terminar y enviar')}
        </Boton>
        {r.sinCalificar > 0 && (
          <>
            <Boton variante="tintado" Icono={UploadCloud} onClick={() => envio.enviar('BORRADOR')} disabled={!!envio.avance}>
              Enviar sin terminar
            </Boton>
            <p className="t-nota text-secundario px-1">Queda como borrador en el sistema para terminarla después en el computador.</p>
          </>
        )}
        <Boton variante="critico" Icono={Trash2} onClick={() => setConfirmar(true)} disabled={!!envio.avance}>Eliminar evaluación</Boton>
      </div>

      <Hoja abierta={hojaTipo} alCerrar={() => setHojaTipo(false)} titulo="Tipo de granja">
        <div className="px-4">
          <div className="lista">
            {TIPOS_PRODUCTOR.map((t) => (
              <Fila key={t.valor} titulo={t.etiqueta} sub={t.ayuda} flecha={false} alHacerClic={() => ponerTipo(t.valor)}
                derecha={t.valor === cab.tipoProductor ? <CheckCircle2 className="w-6 h-6 text-acento shrink-0" aria-label="Elegido" /> : null} />
            ))}
          </div>
          <p className="pie-seccion">En granjas familiares y extensivas no se califican los indicadores de encierro.</p>
        </div>
      </Hoja>

      <HojaDocumento sigla={hojaDoc} doc={hojaDoc ? docs[hojaDoc.toLowerCase()] : null} fechaVisita={cab.fechaEvaluacion}
        fotos={hojaDoc ? b[claveFotosDoc(hojaDoc)] || [] : []}
        alCambiar={(d) => ponerDoc(hojaDoc, d)} alCambiarFotos={(c) => ponerFotosDoc(hojaDoc, c)} alCerrar={() => setHojaDoc(null)} />

      <Confirmar abierta={confirmar} alCerrar={() => setConfirmar(false)} titulo="Eliminar evaluación" accion="Eliminar"
        texto="Se borran del teléfono las calificaciones y las fotos de esta visita. No se puede deshacer." alConfirmar={eliminar} />
    </>
  );
}
