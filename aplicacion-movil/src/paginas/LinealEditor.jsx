/**
 * Clasificación lineal (método ADGA) paso a paso: la cabra, las medidas (con
 * instrumento o estimadas sobre una foto con vara de referencia), un rasgo por
 * pantalla con su dibujo de referencia, las seis fotos y el resultado.
 */

import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Trash2, Ruler, ChevronDown, Image as IconoImagen, AlertTriangle, Scale, Wand2, Info, Eye } from 'lucide-react';
import { useBorrador } from '@hooks/useBorrador';
import { useBotonAtras } from '@hooks/useBotonAtras';
import { catalogoLocal, obtenerCatalogo, medidasLocal, tipoCatalogoLineal, medidasDeSexo, reglasLocal, referenciasDe } from '@servicios/catalogos';
import { indexarReferencias, calcularRasgos, limitesRegla, explicarRangos, compararMedida, anguloGrupa } from '@utilidades/morfometria';
import { eliminarBorrador } from '@servicios/borradores';
import { guardarFoto, borrarFoto } from '@servicios/fotosLocales';
import { tomarFoto } from '@servicios/camara';
import { calcularLineal, indicesLineal } from '@servicios/calculos';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { regionesDe, vistasDe, NIVEL, NOMBRE_CATEGORIA, CON_DIBUJO, MEDIBLES_EN_FOTO, GRUPOS_MEDIDA, hoy } from '@servicios/evaluaciones';
import Barra, { AccionBarra } from '@/ui/Barra';
import { Seccion, Fila, FilaCampo, EstadoVacio } from '@/ui/Lista';
import { Boton } from '@/ui/Controles';
import SelectorAnimal from '@/ui/SelectorAnimal';
import Confirmar from '@/ui/Confirmar';
import { Miniatura, Visor } from '@/ui/Fotos';
import MedidorFoto from '@/ui/MedidorFoto';
import { useEnvio, EnEspera } from '@/ui/Envio';
import { useAvisos } from '@/ui/Avisos';
import { edadMeses } from '@utilidades/formato';

export default function LinealEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const avisos = useAvisos();
  const [b, cambiar] = useBorrador(id);
  const envio = useEnvio(id);
  const sexo = b?.sexo === 'MACHO' ? 'MACHO' : 'HEMBRA';
  const macho = sexo === 'MACHO';
  const tipoCat = tipoCatalogoLineal(sexo);
  const REGIONES = regionesDe(sexo);
  const VISTAS = vistasDe(sexo);
  const [catalogo, setCatalogo] = useState(() => catalogoLocal(tipoCat));
  const [confirmar, setConfirmar] = useState(false);
  const [visor, setVisor] = useState(null);
  const [tomando, setTomando] = useState(null);
  const [medidasCat, setMedidasCat] = useState(() => medidasDeSexo(medidasLocal(), sexo));
  const [midiendo, setMidiendo] = useState(null);   // medida que se está midiendo en foto
  const [ayuda, setAyuda] = useState(null);         // código con "Cómo medir" abierto

  const n = catalogo.length;
  const PASO_MEDIDAS = 1;                            // rasgos: pasos 2 … n+1
  const PASO_FOTOS = n + 2;
  const PASO_RESUMEN = n + 3;
  const paso = Math.min(b?.paso || 0, PASO_RESUMEN);
  const irA = (p) => cambiar({ paso: Math.max(0, Math.min(PASO_RESUMEN, p)) });

  useEffect(() => {
    if (!n || !medidasCat.length) obtenerCatalogo(tipoCat).then((c) => { setCatalogo(c); setMedidasCat(medidasDeSexo(medidasLocal(), sexo)); });
  }, [n, medidasCat.length, tipoCat, sexo]);

  // Reglas morfométricas: las medidas se comparan con la raza y califican solas los rasgos medibles
  const animalB = obtenerCacheAnimales().find((a) => String(a.id) === String(b?.idAnimal));
  const refsLista = referenciasDe(animalB?.idRaza, sexo);
  const refs = indexarReferencias(refsLista);
  const reglas = reglasLocal();
  const reglaDe = Object.fromEntries(reglas.map((x) => [x.codigoRasgo, x]));
  const valoresMedidas = Object.fromEntries(Object.entries(b?.medidas || {}).map(([c, m]) => [c, Number(m?.valor) > 0 ? Number(m.valor) : null]));
  const auto = calcularRasgos(reglas, valoresMedidas, refs);
  const autoPorId = Object.fromEntries(catalogo.filter((x) => auto[x.codigo]).map((x) => [x.idRasgo, auto[x.codigo].calif]));
  const firmaAuto = JSON.stringify(autoPorId);
  useEffect(() => {
    if (!b || b.pendienteEnvio || b.idRemoto) return;
    const manuales = b.manuales || {};
    const nuevos = { ...b.valores };
    let cambio = JSON.stringify(b.automaticos || {}) !== firmaAuto;
    Object.entries(autoPorId).forEach(([idR, cal]) => {
      if (!manuales[idR] && nuevos[idR] !== cal) { nuevos[idR] = cal; cambio = true; }
    });
    if (cambio) cambiar((p) => ({ ...p, valores: nuevos, automaticos: autoPorId }));
  }, [firmaAuto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo(0, 0); }, [paso]);
  // El botón atrás del teléfono vuelve al paso anterior
  useBotonAtras(() => {
    if (midiendo) { setMidiendo(null); return true; }
    if (b && paso > 0 && !b.pendienteEnvio && !b.idRemoto) { irA(paso - 1); return true; }
    return false;
  });

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
  const medidas = b.medidas || {};
  const valorMedida = (c) => (Number(medidas[c]?.valor) > 0 ? Number(medidas[c].valor) : null);
  const numMedidas = medidasCat.filter((m) => valorMedida(m.codigo)).length;
  const fmt = (v) => String(v).replace('.', ',');
  const ponerMedida = (codigo, texto) => cambiar((p) => {
    const m = { ...(p.medidas || {}) };
    const limpio = texto.replace(/[^0-9.,]/g, '');
    if (limpio === '') delete m[codigo];
    else m[codigo] = { valor: limpio.replace(',', '.'), metodo: 'INSTRUMENTO' };   // escrita a mano = instrumento
    return { ...p, medidas: m, errorEnvio: null };
  });
  const guardarMedidaFoto = (codigo, { valor, clave, calibracion }) => {
    cambiar((p) => ({
      ...p,
      errorEnvio: null,
      medidas: { ...(p.medidas || {}), [codigo]: { valor: String(valor), metodo: 'FOTO', foto: clave } },
      fotosMedicion: (p.fotosMedicion || []).includes(clave) ? p.fotosMedicion : [...(p.fotosMedicion || []), clave],
      calibraciones: { ...(p.calibraciones || {}), [clave]: calibracion },
    }));
    setMidiendo(null);
    avisos.exito('Medida guardada', `${valor.toLocaleString('es-CO')} cm, estimada en foto.`);
  };
  const quitarFotoMedicion = (clave) => {
    borrarFoto(clave);
    cambiar((p) => {
      const m = { ...(p.medidas || {}) };
      Object.keys(m).forEach((c) => { if (m[c]?.foto === clave) m[c] = { ...m[c], foto: undefined }; });
      const cal = { ...(p.calibraciones || {}) }; delete cal[clave];
      return { ...p, medidas: m, calibraciones: cal, fotosMedicion: (p.fotosMedicion || []).filter((c) => c !== clave) };
    });
  };

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
          <h2 className="t-titulo">{macho ? '¿Qué macho va a calificar?' : '¿Qué cabra va a calificar?'}</h2>
          <p className="t-sub text-secundario mt-1">{macho
            ? 'Reproductores adultos, parados en piso plano. Se califican cuerpo, patas y testículos (100 puntos).'
            : 'Hembras adultas, mejor unos 45 días después del parto y paradas en piso plano.'}</p>
        </div>
        <Seccion className="mt-5">
          <SelectorAnimal valor={b.idAnimal} alCambiar={elegir} sexo={macho ? 'macho' : 'hembra'} etiqueta={macho ? 'Macho' : 'Cabra'} />
          {animalB && <Fila titulo="Raza" valor={animalB.nombreRaza || 'Sin raza'} flecha={false} />}
          <FilaCampo etiqueta="Fecha" type="date" value={b.fechaEvaluacion} max={hoy()} onChange={(e) => cambiar({ fechaEvaluacion: e.target.value })} />
          <FilaCampo etiqueta="Edad en meses" inputMode="numeric" value={b.edadMeses} onChange={(e) => cambiar({ edadMeses: e.target.value })} placeholder="Opcional" />
          {!macho && <FilaCampo etiqueta="Número de partos" inputMode="numeric" value={b.numLactancia} onChange={(e) => cambiar({ numLactancia: e.target.value })} placeholder="Opcional" />}
        </Seccion>
        {animalB && !refsLista.some((x) => x.idRaza != null) && (
          <p className="t-sub text-aviso px-5 mt-3">Esta raza no tiene medidas de referencia en el teléfono: los rasgos no se llenarán solos con las medidas. Conéctese para actualizar o pida al docente cargarlas.</p>
        )}
        {b.edadMeses !== '' && b.edadMeses != null && Number(b.edadMeses) < 24 && (
          <p className="t-sub text-aviso px-5 mt-2">Tiene menos de 2 años: las referencias son de adultos, es normal que salga "Bajo".</p>
        )}
        <div className="px-4 mt-6 space-y-3">
          <Boton onClick={() => irA(r.calificados > 0 && r.calificados < n ? r.calificados + 2 : PASO_MEDIDAS)} disabled={!b.idAnimal}>
            {r.calificados > 0 ? 'Continuar' : 'Empezar: medidas y rasgos'}
          </Boton>
          {r.calificados > 0 && <Boton variante="gris" onClick={() => irA(PASO_RESUMEN)}>Ver el resumen</Boton>}
          <Boton variante="critico" Icono={Trash2} onClick={() => setConfirmar(true)}>Eliminar</Boton>
        </div>
        <Confirmar abierta={confirmar} alCerrar={() => setConfirmar(false)} titulo="Eliminar clasificación" accion="Eliminar"
          texto="Se borran del teléfono las calificaciones y las fotos de esta cabra. No se puede deshacer." alConfirmar={eliminar} />
      </>
    );
  }

  /* ── Paso 1: medidas ──────────────────────────────────────────────────── */
  if (paso === PASO_MEDIDAS) {
    const indices = indicesLineal(Object.fromEntries(medidasCat.map((m) => [m.codigo, valorMedida(m.codigo)])));
    return (
      <>
        <Barra titulo="Medidas" atras alVolver={volver}
          accion={<AccionBarra alHacerClic={() => irA(PASO_MEDIDAS + 1)}>{numMedidas ? 'Siguiente' : 'Saltar'}</AccionBarra>} />
        <div className="px-4 pt-4">
          <h2 className="t-titulo">{macho ? 'Medidas del macho' : 'Medidas de la cabra'}</h2>
          <p className="t-sub text-secundario mt-1">
            Escriba lo que mida con el bastón, la cinta, el compás o el calibrador. Las distancias rectas también se pueden
            <b> medir en una foto</b> con una vara de referencia. Todas son opcionales.
          </p>
          <div className="tarjeta !bg-info/10 mt-3">
            <p className="t-encabezado flex items-center gap-1.5"><Info className="w-5 h-5 shrink-0" /> ¿Qué es Bajo, Medio y Alto?</p>
            <p className="t-sub mt-1">Cada medida se compara con {macho ? 'un macho adulto típico' : 'una hembra adulta típica'} de la raza <b>{animalB?.nombreRaza || 'del animal'}</b>:</p>
            <ul className="t-sub mt-1.5 space-y-1">
              <li><b>1 · Bajo:</b> por debajo de lo normal para su raza.</li>
              <li><b>2 · Medio:</b> dentro de lo normal (el promedio de la raza más o menos una desviación; ahí está cerca de 7 de cada 10 animales).</li>
              <li><b>3 · Alto:</b> por encima de lo normal.</li>
            </ul>
            <p className="t-nota text-secundario mt-1.5">Con las medidas, los rasgos medibles se califican solos. Los demás se eligen a la vista.</p>
          </div>
        </div>

        {!medidasCat.length ? (
          <EstadoVacio Icono={Ruler} titulo="Falta la lista de medidas" texto="Conéctese a internet una vez para descargarla." />
        ) : GRUPOS_MEDIDA.map((g) => {
          const items = medidasCat.filter((m) => m.grupo === g.clave);
          if (!items.length) return null;
          return (
            <section key={g.clave} className="px-4 mt-5">
              <h3 className="cabecera-seccion">{g.titulo}</h3>
              <p className="t-nota text-secundario px-1 -mt-1 mb-2">{g.ayuda}</p>
              <div className="space-y-2.5">
                {items.map((m) => {
                  const v = medidas[m.codigo];
                  const val = v?.valor ?? '';
                  const num = valorMedida(m.codigo);
                  const fuera = num != null && ((m.minNormal != null && num < m.minNormal) || (m.maxNormal != null && num > m.maxNormal));
                  const enFoto = MEDIBLES_EN_FOTO.has(m.codigo);
                  return (
                    <div key={m.codigo} className={`tarjeta !p-3 ${fuera ? 'ring-2 ring-aviso/60' : ''}`}>
                      <div className="flex items-center gap-3">
                        <label htmlFor={`m-${m.codigo}`} className="flex-1 min-w-0">
                          <span className="block t-encabezado leading-tight">{m.nombre}</span>
                          <span className="block t-nota text-secundario">{m.instrumento}</span>
                        </label>
                        <input id={`m-${m.codigo}`} inputMode="decimal" placeholder="—" value={fmt(val)}
                          onChange={(e) => ponerMedida(m.codigo, e.target.value)}
                          className="w-[84px] min-h-[48px] rounded-xl bg-relleno px-3 text-right t-titulo tabular-nums focus:outline-none focus:ring-2 focus:ring-acento" />
                        <span className="t-sub text-secundario w-6">{m.unidad}</span>
                      </div>
                      {refs[m.codigo] && (() => {
                        const ref = refs[m.codigo];
                        const comp = compararMedida(num, ref);
                        return (
                          <>
                            <div className="grid grid-cols-3 mt-2 rounded-xl overflow-hidden text-center t-nota">
                              {[1, 2, 3].map((k) => (
                                <span key={k} className={`py-1.5 ${comp?.nivel === k ? 'bg-acento text-sobre-acento font-bold' : 'bg-relleno text-secundario'}`}>
                                  <span className="block">{NIVEL[k]}</span>
                                  <span className="block tabular-nums">{k === 1 ? `< ${fmt(Math.round((ref.media - ref.de) * 10) / 10)}` : k === 2 ? `${fmt(Math.round((ref.media - ref.de) * 10) / 10)}–${fmt(Math.round((ref.media + ref.de) * 10) / 10)}` : `> ${fmt(Math.round((ref.media + ref.de) * 10) / 10)}`}</span>
                                </span>
                              ))}
                            </div>
                            <p className="t-nota text-secundario mt-1">Promedio {ref.idRaza == null ? 'general' : `de la ${ref.raza}`}: {fmt(ref.media)} {m.unidad}{comp ? ` · esta: ${comp.dif > 0 ? '+' : ''}${fmt(comp.dif)} ${m.unidad}` : ''}</p>
                          </>
                        );
                      })()}
                      {m.rasgoRel && <p className="t-nota text-acento mt-1 flex items-center gap-1"><Wand2 className="w-4 h-4 shrink-0" /> Califica «{catalogo.find((x) => x.codigo === m.rasgoRel)?.nombre || m.rasgoRel}»</p>}
                      {v?.metodo === 'FOTO' && num != null && (
                        <p className="t-nota text-info mt-2 flex items-center gap-1.5"><Camera className="w-4 h-4 shrink-0" /> Medida en foto (estimación). Si la mide con el instrumento, escríbala y queda como directa.</p>
                      )}
                      {fuera && <p className="t-nota text-aviso mt-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" /> Lo habitual es {fmt(m.minNormal)} a {fmt(m.maxNormal)} {m.unidad}. Revise la lectura.</p>}
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setAyuda(ayuda === m.codigo ? null : m.codigo)}
                          className="flex-1 min-h-[40px] rounded-lg bg-relleno t-nota font-medium flex items-center justify-center gap-1 active:opacity-70">
                          Cómo medir <ChevronDown className={`w-4 h-4 transition-transform ${ayuda === m.codigo ? 'rotate-180' : ''}`} />
                        </button>
                        {enFoto && (
                          <button type="button" onClick={() => setMidiendo(m)}
                            className="flex-1 min-h-[40px] rounded-lg bg-acento/10 text-acento t-nota font-semibold flex items-center justify-center gap-1 active:opacity-70">
                            <Camera className="w-4 h-4" /> Medir en foto
                          </button>
                        )}
                      </div>
                      {ayuda === m.codigo && (
                        <p className="t-sub text-secundario mt-2">{m.comoMedir}{!enFoto && m.grupo !== 'PESO' ? ' Esta medida rodea el cuerpo: no se puede sacar de una foto.' : ''}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {anguloGrupa(valoresMedidas) != null && (
          <p className="t-sub px-5 mt-4">Inclinación de la grupa calculada: <b>{fmt(anguloGrupa(valoresMedidas))}°</b></p>
        )}
        {Object.keys(autoPorId).length > 0 && (
          <div className="px-4 mt-4">
            <p className="tarjeta !bg-acento/10 t-sub flex items-center gap-2"><Wand2 className="w-5 h-5 text-acento shrink-0" /> Con estas medidas ya quedaron calificados {Object.keys(autoPorId).length} rasgo(s).</p>
          </div>
        )}

        {(b.fotosMedicion || []).length > 0 && (
          <section className="px-4 mt-6">
            <h3 className="cabecera-seccion">Fotos de medición</h3>
            <div className="flex gap-3 overflow-x-auto sin-barra py-2">
              {b.fotosMedicion.map((c) => <Miniatura key={c} clave={c} alVer={setVisor} alQuitar={() => quitarFotoMedicion(c)} />)}
            </div>
            <p className="pie-seccion">Se envían como evidencia (vista «Medición»).</p>
          </section>
        )}

        {indices.length > 0 && (
          <section className="px-4 mt-6">
            <h3 className="cabecera-seccion flex items-center gap-1.5"><Scale className="w-[18px] h-[18px]" /> Índices</h3>
            <div className="lista">
              {indices.map((i) => <Fila key={i.codigo} titulo={i.nombre} sub={i.lectura} valor={fmt(i.valor)} />)}
            </div>
          </section>
        )}

        <div className="px-4 mt-6">
          <Boton onClick={() => irA(PASO_MEDIDAS + 1)}>{numMedidas ? `Seguir con ${numMedidas} ${numMedidas === 1 ? 'medida' : 'medidas'}` : 'Seguir sin medidas'}</Boton>
        </div>
        <Visor url={visor} alCerrar={() => setVisor(null)} />
        {midiendo && (
          <MedidorFoto medida={midiendo} fotos={b.fotosMedicion || []} calibraciones={b.calibraciones || {}}
            alCerrar={() => setMidiendo(null)} alGuardar={(r2) => guardarMedidaFoto(midiendo.codigo, r2)} />
        )}
      </>
    );
  }

  /* ── Pasos 2..n+1: un rasgo por pantalla ──────────────────────────────── */
  if (paso <= n + 1) {
    const rasgo = catalogo[paso - 2];
    const relacionadas = medidasCat.filter((m) => m.rasgoRel === rasgo.codigo && valorMedida(m.codigo));
    const region = REGIONES.find((x) => x.clave === rasgo.region);
    const dibujo = rasgo.codigo.replace(/^M_/, '');
    const actual = b.valores[rasgo.idRasgo];
    const a = auto[rasgo.codigo];
    const regla = reglaDe[rasgo.codigo];
    const lim = regla ? limitesRegla(regla, refs) : null;
    const rangos = regla && lim ? explicarRangos(regla, lim, medidasCat.find((m) => m.codigo === regla.calculo)?.unidad || 'cm') : null;
    const porMedida = a && !b.manuales?.[rasgo.idRasgo];
    const unidadA = regla?.calculo === 'ANGULO_GRUPA' ? '°' : ` ${medidasCat.find((m) => m.codigo === regla?.calculo)?.unidad || 'cm'}`;
    const elegir = (cal) => {
      cambiar((p) => ({
        ...p, errorEnvio: null, valores: { ...p.valores, [rasgo.idRasgo]: cal },
        manuales: { ...(p.manuales || {}), [rasgo.idRasgo]: !!a && a.calif !== cal },
      }));
      setTimeout(() => irA(paso + 1), 220);   // deja ver la marca antes de pasar
    };
    return (
      <>
        <Barra titulo={`Rasgo ${paso - 1} de ${n}`} atras alVolver={volver}
          accion={<AccionBarra alHacerClic={() => irA(paso + 1)}>{actual ? 'Siguiente' : 'Saltar'}</AccionBarra>} />
        <div className="h-1 bg-relleno" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={r.calificados}>
          <div className="h-full bg-acento transition-all" style={{ width: `${(r.calificados / n) * 100}%` }} />
        </div>

        <div className="px-4 pt-4">
          <p className="t-nota text-secundario uppercase tracking-wide">{region?.titulo}{rasgo.vista ? ` · ${rasgo.vista}` : ''}</p>
          <h2 className="t-titulo mt-1">{rasgo.nombre}</h2>
          {rasgo.queMirar && <p className="t-cuerpo text-secundario mt-1">{rasgo.queMirar}</p>}
          <p className={`t-nota mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg ${regla ? 'bg-acento/10 text-acento' : 'bg-relleno text-secundario'}`}>
            {regla ? <><Ruler className="w-4 h-4" /> Se puede medir</> : <><Eye className="w-4 h-4" /> Se califica a la vista</>}
          </p>
          {a && (
            <div className={`t-sub rounded-xl px-3 py-2.5 mt-2 ${porMedida ? 'bg-acento/15' : 'bg-relleno'}`}>
              <p className="flex items-start gap-1.5"><Wand2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Medida: <b>{fmt(a.valor)}{unidadA}</b> → <b>{NIVEL[a.calif]}</b>. {porMedida ? 'Calificado automáticamente.' : 'Usted eligió otro valor a mano.'}</span></p>
              {!porMedida && (
                <button type="button" className="mt-1 t-sub font-semibold text-acento underline"
                  onClick={() => cambiar((p) => ({ ...p, valores: { ...p.valores, [rasgo.idRasgo]: a.calif }, manuales: { ...(p.manuales || {}), [rasgo.idRasgo]: false } }))}>
                  Usar la medida
                </button>
              )}
            </div>
          )}
          {regla?.explicacion && <p className="t-nota text-secundario mt-1.5">{regla.explicacion}</p>}
          {relacionadas.length > 0 && !a && (
            <p className="t-sub text-info bg-info/10 rounded-xl px-3 py-2 mt-2 flex items-start gap-1.5">
              <Ruler className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              Medida: {relacionadas.map((m) => `${m.nombre.toLowerCase()} ${fmt(valorMedida(m.codigo))} ${m.unidad}`).join(' · ')}
            </p>
          )}
        </div>

        {CON_DIBUJO.has(dibujo) && (
          <div className="px-4 mt-4">
            <img src={`/img/lineal/${dibujo}.jpg`} alt={`Dibujo de referencia: ${rasgo.nombre} bajo, intermedio y alto`}
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
                  <span className="block t-encabezado">{NIVEL[cal]}{rangos?.[cal] ? ` · ${rangos[cal]}` : ''}</span>
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
    const tomar = async (vista, origen = 'camara') => {
      setTomando(vista);
      try {
        const blob = await tomarFoto(origen);
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
          <h2 className="t-titulo">{macho ? 'Fotos del macho' : 'Fotos de la cabra'}</h2>
          <p className="t-sub text-secundario mt-1">Una por cada vista, a 2-3 m, agachado a la altura de la barriga, sin zoom y con el bastón parado junto al animal. Sirven para revisar la calificación después.</p>
        </div>
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {VISTAS.map((v) => {
            const clave = b.fotos?.[v.clave];
            return (
              <div key={v.clave} className="bg-tarjeta rounded-lista p-3">
                {clave ? (
                  <Miniatura clave={clave} className="w-full aspect-[4/3]" alVer={setVisor} alQuitar={() => quitar(v.clave)} />
                ) : (
                  <div className="w-full aspect-[4/3] grid grid-rows-[1fr_auto] gap-1.5">
                    <button type="button" onClick={() => tomar(v.clave)} disabled={!!tomando}
                      className="rounded-xl bg-acento/[0.12] text-acento flex flex-col items-center justify-center gap-1 active:opacity-60 disabled:opacity-40">
                      <Camera className="w-7 h-7" />
                      <span className="t-nota font-semibold">{tomando === v.clave ? 'Abriendo…' : 'Tomar foto'}</span>
                    </button>
                    <button type="button" onClick={() => tomar(v.clave, 'galeria')} disabled={!!tomando}
                      className="min-h-[36px] rounded-lg bg-relleno t-mini font-medium flex items-center justify-center gap-1 active:opacity-60 disabled:opacity-40">
                      <IconoImagen className="w-4 h-4" /> Galería
                    </button>
                  </div>
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
        <p className="t-sub text-secundario">{macho ? '♂ ' : '♀ '}{animal ? `${animal.nombre ? animal.nombre + ' · ' : 'Chapeta '}${animal.chapetaNueva || animal.chapetaVieja || animal.codigo}` : 'Sin elegir'}</p>
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
          <Fila key={x.idRasgo} titulo={x.nombre} alHacerClic={() => irA(i + 2)}
            sub={b.automaticos?.[x.idRasgo] && !b.manuales?.[x.idRasgo] ? 'Por medida' : undefined}
            valor={b.valores[x.idRasgo] ? NIVEL[b.valores[x.idRasgo]] : 'Sin calificar'} />
        ))}
        <Fila titulo="Fotos" valor={`${cuantasFotos} de ${VISTAS.length}`} alHacerClic={() => irA(PASO_FOTOS)} />
      </Seccion>

      <Seccion titulo="Medidas" className="mt-6" pie={numMedidas ? 'Las marcadas «foto» son estimaciones sobre la foto con vara de referencia.' : 'Opcionales: mejoran la evaluación.'}>
        {medidasCat.filter((m) => valorMedida(m.codigo)).map((m) => (
          <Fila key={m.codigo} titulo={m.nombre} sub={medidas[m.codigo]?.metodo === 'FOTO' ? 'Medida en foto' : m.instrumento}
            valor={`${fmt(valorMedida(m.codigo))} ${m.unidad}`} alHacerClic={() => irA(PASO_MEDIDAS)} />
        ))}
        {!numMedidas && <Fila titulo="Agregar medidas" alHacerClic={() => irA(PASO_MEDIDAS)} />}
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
