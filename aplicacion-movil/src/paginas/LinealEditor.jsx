/**
 * Clasificación lineal (método ADGA) paso a paso: datos de la cabra, un rasgo
 * por pantalla con su dibujo de referencia, las seis fotos y el resultado.
 */

import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Trash2 } from 'lucide-react';
import { useBorrador } from '@hooks/useBorrador';
import { useBotonAtras } from '@hooks/useBotonAtras';
import { catalogoLocal, obtenerCatalogo } from '@servicios/catalogos';
import { eliminarBorrador } from '@servicios/borradores';
import { guardarFoto, borrarFoto } from '@servicios/fotosLocales';
import { tomarFoto } from '@servicios/camara';
import { calcularLineal } from '@servicios/calculos';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { REGIONES, VISTAS, NIVEL, NOMBRE_CATEGORIA, CON_DIBUJO, hoy } from '@servicios/evaluaciones';
import Barra, { AccionBarra } from '@/ui/Barra';
import { Seccion, Fila, FilaCampo, EstadoVacio } from '@/ui/Lista';
import { Boton } from '@/ui/Controles';
import SelectorAnimal from '@/ui/SelectorAnimal';
import Confirmar from '@/ui/Confirmar';
import { Miniatura, Visor } from '@/ui/Fotos';
import { useEnvio, EnEspera } from '@/ui/Envio';
import { useAvisos } from '@/ui/Avisos';
import { edadMeses } from '@utilidades/formato';

export default function LinealEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const avisos = useAvisos();
  const [b, cambiar] = useBorrador(id);
  const envio = useEnvio(id);
  const [catalogo, setCatalogo] = useState(() => catalogoLocal('lineal'));
  const [confirmar, setConfirmar] = useState(false);
  const [visor, setVisor] = useState(null);
  const [tomando, setTomando] = useState(null);

  const n = catalogo.length;
  const PASO_FOTOS = n + 1;
  const PASO_RESUMEN = n + 2;
  const paso = Math.min(b?.paso || 0, PASO_RESUMEN);
  const irA = (p) => cambiar({ paso: Math.max(0, Math.min(PASO_RESUMEN, p)) });

  useEffect(() => { if (!n) obtenerCatalogo('lineal').then(setCatalogo); }, [n]);
  useEffect(() => { window.scrollTo(0, 0); }, [paso]);
  // El botón atrás del teléfono vuelve al paso anterior
  useBotonAtras(() => { if (b && paso > 0 && !b.pendienteEnvio && !b.idRemoto) { irA(paso - 1); return true; } return false; });

  if (!b || b.tipo !== 'lineal') return <Navigate to="/evaluar" replace />;

  if (b.pendienteEnvio || b.idRemoto) {
    return (
      <>
        <Barra titulo="Clasificación lineal" atras />
        <EnEspera borrador={b} envio={envio} alEditar={() => cambiar({ pendienteEnvio: null })} />
      </>
    );
  }
  if (!n) {
    return (
      <>
        <Barra titulo="Clasificación lineal" atras />
        <EstadoVacio Icono={Camera} titulo="Falta la lista de rasgos" texto="Conéctese a internet una vez para descargarla." />
      </>
    );
  }

  const volver = () => (paso > 0 ? irA(paso - 1) : navigate(-1));
  const r = calcularLineal(catalogo, b.valores);
  const animal = obtenerCacheAnimales().find((a) => String(a.id) === String(b.idAnimal));
  const eliminar = async () => { await eliminarBorrador(id); navigate('/evaluar', { replace: true }); };

  /* ── Paso 0: la cabra ─────────────────────────────────────────────────── */
  if (paso === 0) {
    const elegir = (idAnimal) => {
      const a = obtenerCacheAnimales().find((x) => String(x.id) === String(idAnimal));
      cambiar({ idAnimal: Number(idAnimal), edadMeses: edadMeses(a?.fechaNacimiento) ?? b.edadMeses });
    };
    return (
      <>
        <Barra titulo="Clasificación lineal" atras alVolver={volver} />
        <div className="px-4 pt-4">
          <h2 className="t-titulo">¿Qué cabra va a calificar?</h2>
          <p className="t-sub text-secundario mt-1">Se califican hembras, mejor si están en ordeño y paradas en piso plano.</p>
        </div>
        <Seccion className="mt-5">
          <SelectorAnimal valor={b.idAnimal} alCambiar={elegir} soloHembras etiqueta="Cabra" />
          <FilaCampo etiqueta="Fecha" type="date" value={b.fechaEvaluacion} max={hoy()} onChange={(e) => cambiar({ fechaEvaluacion: e.target.value })} />
          <FilaCampo etiqueta="Edad en meses" inputMode="numeric" value={b.edadMeses} onChange={(e) => cambiar({ edadMeses: e.target.value })} placeholder="Opcional" />
          <FilaCampo etiqueta="Número de partos" inputMode="numeric" value={b.numLactancia} onChange={(e) => cambiar({ numLactancia: e.target.value })} placeholder="Opcional" />
        </Seccion>
        <div className="px-4 mt-6 space-y-3">
          <Boton onClick={() => irA(r.calificados > 0 && r.calificados < n ? r.calificados + 1 : 1)} disabled={!b.idAnimal}>
            {r.calificados > 0 ? 'Continuar' : `Empezar: ${n} rasgos`}
          </Boton>
          {r.calificados > 0 && <Boton variante="gris" onClick={() => irA(PASO_RESUMEN)}>Ver el resumen</Boton>}
          <Boton variante="critico" Icono={Trash2} onClick={() => setConfirmar(true)}>Eliminar</Boton>
        </div>
        <Confirmar abierta={confirmar} alCerrar={() => setConfirmar(false)} titulo="Eliminar clasificación" accion="Eliminar"
          texto="Se borran del teléfono las calificaciones y las fotos de esta cabra. No se puede deshacer." alConfirmar={eliminar} />
      </>
    );
  }

  /* ── Pasos 1..n: un rasgo por pantalla ────────────────────────────────── */
  if (paso <= n) {
    const rasgo = catalogo[paso - 1];
    const region = REGIONES.find((x) => x.clave === rasgo.region);
    const actual = b.valores[rasgo.idRasgo];
    const elegir = (cal) => {
      cambiar((p) => ({ ...p, errorEnvio: null, valores: { ...p.valores, [rasgo.idRasgo]: cal } }));
      setTimeout(() => irA(paso + 1), 220);   // deja ver la marca antes de pasar
    };
    return (
      <>
        <Barra titulo={`Rasgo ${paso} de ${n}`} atras alVolver={volver}
          accion={<AccionBarra alHacerClic={() => irA(paso + 1)}>{actual ? 'Siguiente' : 'Saltar'}</AccionBarra>} />
        <div className="h-1 bg-relleno" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={r.calificados}>
          <div className="h-full bg-acento transition-all" style={{ width: `${(r.calificados / n) * 100}%` }} />
        </div>

        <div className="px-4 pt-4">
          <p className="t-nota text-secundario uppercase tracking-wide">{region?.titulo}{rasgo.vista ? ` · ${rasgo.vista}` : ''}</p>
          <h2 className="t-titulo mt-1">{rasgo.nombre}</h2>
          {rasgo.queMirar && <p className="t-cuerpo text-secundario mt-1">{rasgo.queMirar}</p>}
        </div>

        {CON_DIBUJO.has(rasgo.codigo) && (
          <div className="px-4 mt-4">
            <img src={`/img/lineal/${rasgo.codigo}.jpg`} alt={`Dibujo de referencia: ${rasgo.nombre} bajo, intermedio y alto`}
              className="w-full rounded-lista bg-white" />
          </div>
        )}

        <div className="px-4 mt-4 space-y-3" role="radiogroup" aria-label={`Calificación de ${rasgo.nombre}`}>
          {[1, 2, 3].map((cal) => {
            const elegido = actual === cal;
            return (
              <button key={cal} type="button" role="radio" aria-checked={elegido} onClick={() => elegir(cal)}
                className={`w-full min-h-[64px] rounded-lista px-4 py-3 flex items-center gap-3 text-left active:opacity-70
                            ${elegido ? 'bg-acento text-sobre-acento' : 'bg-tarjeta'}`}>
                <span className={`w-9 h-9 rounded-full flex items-center justify-center t-encabezado shrink-0 ${elegido ? 'bg-white/25' : 'bg-relleno'}`}>{cal}</span>
                <span className="flex-1 min-w-0">
                  <span className="block t-encabezado">{NIVEL[cal]}</span>
                  {rasgo.niveles?.[cal] && <span className={`block t-sub ${elegido ? '' : 'text-secundario'}`}>{rasgo.niveles[cal]}</span>}
                </span>
                {elegido && <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  /* ── Fotos de las seis vistas ─────────────────────────────────────────── */
  if (paso === PASO_FOTOS) {
    const tomar = async (vista) => {
      setTomando(vista);
      try {
        const blob = await tomarFoto('camara');
        if (!blob) return;
        const clave = await guardarFoto(blob);
        if (b.fotos?.[vista]) borrarFoto(b.fotos[vista]);
        cambiar((p) => ({ ...p, fotos: { ...p.fotos, [vista]: clave } }));
      } catch (e) {
        avisos.error('No se tomó la foto', e.message);
      } finally {
        setTomando(null);
      }
    };
    const quitar = (vista) => {
      borrarFoto(b.fotos[vista]);
      cambiar((p) => ({ ...p, fotos: { ...p.fotos, [vista]: null } }));
    };
    const cuantas = Object.values(b.fotos || {}).filter(Boolean).length;
    return (
      <>
        <Barra titulo="Fotos" atras alVolver={volver} />
        <div className="px-4 pt-4">
          <h2 className="t-titulo">Fotos de la cabra</h2>
          <p className="t-sub text-secundario mt-1">Una por cada vista. Sirven para revisar la calificación después. Puede tomar solo las que alcance.</p>
        </div>
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {VISTAS.map((v) => {
            const clave = b.fotos?.[v.clave];
            return (
              <div key={v.clave} className="bg-tarjeta rounded-lista p-3">
                {clave ? (
                  <Miniatura clave={clave} className="w-full aspect-[4/3]" alVer={setVisor} alQuitar={() => quitar(v.clave)} />
                ) : (
                  <button type="button" onClick={() => tomar(v.clave)} disabled={!!tomando}
                    className="w-full aspect-[4/3] rounded-xl bg-acento/[0.12] text-acento flex flex-col items-center justify-center gap-1 active:opacity-60 disabled:opacity-40">
                    <Camera className="w-7 h-7" />
                    <span className="t-nota font-semibold">{tomando === v.clave ? 'Abriendo…' : 'Tomar foto'}</span>
                  </button>
                )}
                <p className="t-sub font-semibold mt-2">{v.etiqueta}</p>
                <p className="t-nota text-secundario">{v.ayuda}</p>
              </div>
            );
          })}
        </div>
        <div className="px-4 mt-6">
          <Boton onClick={() => irA(PASO_RESUMEN)}>{cuantas ? `Seguir con ${cuantas} ${cuantas === 1 ? 'foto' : 'fotos'}` : 'Seguir sin fotos'}</Boton>
        </div>
        <Visor url={visor} alCerrar={() => setVisor(null)} />
      </>
    );
  }

  /* ── Resumen y envío ──────────────────────────────────────────────────── */
  const faltan = n - r.calificados;
  const cuantasFotos = Object.values(b.fotos || {}).filter(Boolean).length;
  return (
    <>
      <Barra titulo="Resultado" atras alVolver={volver} />
      <div className="px-4 pt-5 text-center">
        <p className="t-sub text-secundario">{animal ? `${animal.nombre || 'Sin nombre'} · ${animal.chapetaNueva || animal.chapetaVieja || animal.codigo}` : 'Cabra sin elegir'}</p>
        <p className="text-[56px] leading-[60px] font-bold tabular-nums mt-1">{String(Math.round(r.puntFinal * 10) / 10).replace('.', ',')}</p>
        <p className="t-encabezado">{faltan ? `Faltan ${faltan} rasgos` : NOMBRE_CATEGORIA[r.categoria]}</p>
        <p className="t-nota text-secundario">puntos de 100</p>
      </div>

      <Seccion titulo="Por partes" className="mt-5">
        {REGIONES.map((g) => (
          <Fila key={g.clave} titulo={g.titulo}
            valor={`${String(r.subtotales[g.clave]).replace('.', ',')} de ${g.pts}`} />
        ))}
      </Seccion>

      <Seccion titulo="Rasgos" className="mt-6" pie="Toque un rasgo para cambiar la calificación.">
        {catalogo.map((x, i) => (
          <Fila key={x.idRasgo} titulo={x.nombre} alHacerClic={() => irA(i + 1)}
            valor={b.valores[x.idRasgo] ? NIVEL[b.valores[x.idRasgo]] : 'Sin calificar'} />
        ))}
        <Fila titulo="Fotos" valor={`${cuantasFotos} de ${VISTAS.length}`} alHacerClic={() => irA(PASO_FOTOS)} />
      </Seccion>

      <Seccion titulo="Observaciones" className="mt-6">
        <textarea className="campo min-h-[72px]" value={b.observaciones || ''} onChange={(e) => cambiar({ observaciones: e.target.value })}
          placeholder="Opcional" aria-label="Observaciones" />
      </Seccion>

      <div className="px-4 mt-6 space-y-3">
        {b.errorEnvio && <p className="t-sub text-critico" role="alert">No se pudo enviar: {b.errorEnvio}</p>}
        <Boton onClick={() => envio.enviar()} disabled={!!envio.avance || faltan > 0 || !b.idAnimal}>
          {envio.avance || (faltan ? `Faltan ${faltan} rasgos` : 'Guardar en el sistema')}
        </Boton>
      </div>
    </>
  );
}
