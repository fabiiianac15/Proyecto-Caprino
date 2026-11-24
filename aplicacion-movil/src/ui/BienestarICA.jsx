/**
 * Piezas de la evaluación de bienestar que pidió el docente:
 *  - SeccionMuestra: la Tabla 1 del ICA a la vista, cuántas cabras revisar,
 *    el reparto por edades y el sorteo de las cabras.
 *  - FilasDocumentos + HojaDocumento: el RSPP y la ASI con estado, número,
 *    fechas, lo que se verificó, avisos y foto del documento.
 */

import { useState } from 'react';
import { Shuffle, AlertTriangle, CheckCircle2, ChevronDown, BadgeCheck } from 'lucide-react';
import {
  TABLA_MUESTRA, filaTabla, muestraMinima, GRUPOS_EDAD, repartirMuestra, sortearMuestra,
  ESTADOS_DOC, DOCUMENTOS_ICA, avisosDoc, clasificar,
} from '@utilidades/meba';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { edadMeses } from '@utilidades/formato';
import { codigoDe } from './Chapeta';
import { Seccion, Fila, FilaCampo } from './Lista';
import { Boton } from './Controles';
import Hoja from './Hoja';
import { GaleriaFotos } from './Fotos';

/** Cabras activas del teléfono con su grupo de edad. */
const animalesConGrupo = () => obtenerCacheAnimales()
  .filter((a) => a.estado === 'activo' || !a.estado)
  .map((a) => {
    const meses = edadMeses(a.fechaNacimiento);
    const grupo = meses == null ? 'ADULTOS' : meses < 3 ? 'CRIAS' : meses <= 12 ? 'JOVENES' : 'ADULTOS';
    return { id: a.id, codigo: codigoDe(a), nombre: a.nombre, meses, grupo };
  });

export function SeccionMuestra({ cab, cambiarCab }) {
  const [verTabla, setVerTabla] = useState(true);
  const animales = animalesConGrupo();
  const sinFecha = animales.filter((a) => a.meses == null).length;
  const fila = filaTabla(cab.numAnimales);
  const minimo = muestraMinima(cab.numAnimales);
  const inventario = cab.inventario || { CRIAS: '', JOVENES: '', ADULTOS: '' };
  const porGrupo = cab.porGrupo || { CRIAS: 0, JOVENES: 0, ADULTOS: 0 };
  const elegidos = cab.animalesMuestra || [];
  const porId = Object.fromEntries(animales.map((a) => [a.id, a]));

  const ponerTotal = (n) => cambiarCab((c) => {
    const tam = muestraMinima(n);
    return { ...c, numAnimales: n, tamanoMuestra: tam || '', porGrupo: repartirMuestra(c.inventario, tam), animalesMuestra: [] };
  });
  const ponerTamano = (t) => cambiarCab((c) => ({ ...c, tamanoMuestra: t, porGrupo: repartirMuestra(c.inventario, t), animalesMuestra: [] }));
  const ponerGrupo = (g, n) => cambiarCab((c) => {
    const inv = { ...(c.inventario || {}), [g]: n };
    const suma = GRUPOS_EDAD.reduce((a, x) => a + (Number(inv[x.key]) || 0), 0);
    const tam = muestraMinima(suma || c.numAnimales);
    return { ...c, inventario: inv, numAnimales: suma ? String(suma) : c.numAnimales, tamanoMuestra: tam || '', porGrupo: repartirMuestra(inv, tam), animalesMuestra: [] };
  });
  const usarRegistradas = () => cambiarCab((c) => {
    const inv = Object.fromEntries(GRUPOS_EDAD.map((g) => [g.key, String(animales.filter((a) => a.grupo === g.key).length)]));
    const tam = muestraMinima(animales.length);
    return { ...c, inventario: inv, numAnimales: String(animales.length), tamanoMuestra: tam, porGrupo: repartirMuestra(inv, tam), animalesMuestra: [] };
  });
  const sortear = () => cambiarCab((c) => ({ ...c, animalesMuestra: sortearMuestra(animales, c.porGrupo) }));

  return (
    <>
      <section className="px-4 mt-6">
        <h2 className="cabecera-seccion">¿Cuántas cabras revisar una por una?</h2>
        <div className="tarjeta">
          <p className="t-sub text-secundario">El ICA fija un mínimo según el tamaño de la granja (Tabla 1 de la guía MEBA). Esas cabras son la <b>muestra</b>.</p>
          <button type="button" onClick={() => setVerTabla(!verTabla)} className="mt-2 t-sub font-semibold text-acento flex items-center gap-1">
            <ChevronDown className={`w-5 h-5 transition-transform ${verTabla ? 'rotate-180' : ''}`} /> {verTabla ? 'Ocultar la tabla del ICA' : 'Ver la tabla del ICA'}
          </button>
          {verTabla && (
            <div className="mt-2 rounded-xl overflow-hidden border border-separador">
              <div className="grid grid-cols-2 bg-acento text-sobre-acento t-nota font-semibold">
                <span className="px-3 py-2">Cabras en la granja</span><span className="px-3 py-2">Revisar</span>
              </div>
              {TABLA_MUESTRA.map((f, k) => (
                <div key={f.texto} className={`grid grid-cols-2 t-sub ${k === fila ? 'bg-acento/15 font-bold' : k % 2 ? 'bg-relleno/60' : ''}`}>
                  <span className="px-3 py-2">{k === fila ? '▶ ' : ''}{f.texto}</span><span className="px-3 py-2">{f.muestra}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Seccion className="mt-4" pie={animales.length ? `En el teléfono hay ${animales.length} cabras activas registradas.` : null}>
        <FilaCampo etiqueta="Cabras en total" inputMode="numeric" value={cab.numAnimales} onChange={(e) => ponerTotal(e.target.value)} placeholder="0" />
        {animales.length > 0 && <Fila titulo="Usar las cabras registradas" sub="Llena el total y los grupos de edad" alHacerClic={usarRegistradas} />}
      </Seccion>

      {minimo > 0 && (
        <div className="px-4 mt-4">
          <div className="rounded-2xl bg-acento text-sobre-acento p-4">
            <p className="t-sub opacity-90">Muestra mínima del ICA</p>
            <p className="text-[48px] leading-[52px] font-extrabold tabular-nums">{minimo}</p>
            {fila >= 0 && <p className="t-sub opacity-90">La granja está en la fila «{TABLA_MUESTRA[fila].texto}».</p>}
          </div>
        </div>
      )}

      <Seccion className="mt-4" pie={Number(cab.tamanoMuestra) < minimo ? `Es menos que el mínimo del ICA (${minimo}).` : 'Puede revisar más cabras, nunca menos.'}>
        <FilaCampo etiqueta="Voy a revisar" inputMode="numeric" value={cab.tamanoMuestra} onChange={(e) => ponerTamano(e.target.value)} placeholder="0" />
      </Seccion>

      <Seccion titulo="Repartir por edades" className="mt-6"
        pie={sinFecha ? `${sinFecha} cabras no tienen fecha de nacimiento y se cuentan como adultas. Corrija los números con lo que vea.` : 'La muestra debe ser proporcional a cuántas hay de cada edad.'}>
        {GRUPOS_EDAD.map((g) => (
          <div key={g.key} className="fila">
            <span className="flex-1 min-w-0">
              <span className="block t-encabezado">{g.titulo}</span>
              <span className="block t-nota text-secundario">{g.ayuda} Revisar: <b className="text-acento">{porGrupo[g.key] || 0}</b></span>
            </span>
            <input className="campo-fila !w-[72px] text-right" inputMode="numeric" aria-label={`${g.titulo} en la granja`}
              value={inventario[g.key] ?? ''} onChange={(e) => ponerGrupo(g.key, e.target.value)} placeholder="0" />
          </div>
        ))}
      </Seccion>

      {Number(cab.tamanoMuestra) > 0 && animales.length > 0 && (
        <section className="px-4 mt-4">
          <Boton variante="tintado" Icono={Shuffle} onClick={sortear}>{elegidos.length ? 'Sortear de nuevo' : 'Sortear qué cabras revisar'}</Boton>
          {elegidos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {elegidos.map((id, k) => (
                <span key={id} className="px-3 py-1.5 rounded-xl bg-acento/10 t-sub font-semibold">
                  {k + 1}. {porId[id] ? `${porId[id].codigo}${porId[id].nombre ? ` · ${porId[id].nombre}` : ''}` : `#${id}`}
                </span>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

const textoEstado = (d) => ESTADOS_DOC.find((x) => x.valor === d.estado)?.texto || 'Sin revisar';
const colorEstado = (d) => (d.estado === 'VIGENTE' ? 'text-acento' : d.estado === 'NO_SABE' ? 'text-aviso' : 'text-critico');

export function FilasDocumentos({ docs, total, alAbrir }) {
  const conSi = clasificar(total, true, true);
  const ahora = clasificar(total, docs.rspp.estado === 'VIGENTE', docs.asi.estado === 'VIGENTE');
  return (
    <Seccion titulo="RSPP y ASI (documentos del ICA)" className="mt-6"
      pie={`Sin los dos vigentes la granja no puede quedar en "Excelente". Con lo marcado queda en ${ahora.toLowerCase()}; con los dos quedaría en ${conSi.toLowerCase()}.`}>
      {['RSPP', 'ASI'].map((s) => {
        const d = docs[s.toLowerCase()];
        return (
          <Fila key={s} icono={<BadgeCheck className={`w-7 h-7 shrink-0 ${colorEstado(d)}`} />} titulo={`${s} · ${DOCUMENTOS_ICA[s].nombre}`}
            sub={<span className={`font-semibold ${colorEstado(d)}`}>{textoEstado(d)}{d.numero ? ` · N.º ${d.numero}` : ''}</span>}
            alHacerClic={() => alAbrir(s)} />
        );
      })}
    </Seccion>
  );
}

export function HojaDocumento({ sigla, doc, fotos, fechaVisita, alCambiar, alCambiarFotos, alCerrar }) {
  const [verInfo, setVerInfo] = useState(false);
  if (!sigla) return null;
  const info = DOCUMENTOS_ICA[sigla];
  const avisos = avisosDoc(sigla, doc, fechaVisita);
  const poner = (c) => alCambiar({ ...doc, ...c });
  return (
    <Hoja abierta={!!sigla} alCerrar={alCerrar} titulo={`${info.sigla}: ${info.nombre}`} alta>
      <div className="px-4 pb-8 space-y-5">
        <div>
          <p className="t-cuerpo">{info.que}</p>
          <button type="button" onClick={() => setVerInfo(!verInfo)} className="mt-2 t-sub font-semibold text-acento flex items-center gap-1">
            <ChevronDown className={`w-5 h-5 transition-transform ${verInfo ? 'rotate-180' : ''}`} /> Por qué importa, norma y cómo se obtiene
          </button>
          {verInfo && (
            <div className="mt-2 tarjeta !bg-relleno space-y-2 t-sub">
              <p><b>Por qué importa:</b> {info.porque}</p>
              <p><b>Norma:</b> {info.norma}</p>
              <p><b>Cómo se obtiene:</b> {info.como}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="cabecera-seccion">¿La granja tiene el {info.sigla}?</h3>
          <div className="grid grid-cols-2 gap-2">
            {ESTADOS_DOC.map((e) => (
              <button key={e.valor} type="button" onClick={() => poner({ estado: e.valor })}
                className={`min-h-[52px] rounded-xl px-3 t-encabezado ${doc.estado === e.valor
                  ? (e.valor === 'VIGENTE' ? 'bg-acento text-sobre-acento' : e.valor === 'NO_SABE' ? 'bg-aviso text-white' : 'bg-critico text-white')
                  : 'bg-relleno'}`}>
                {e.texto}
              </button>
            ))}
          </div>
        </div>

        {doc.estado !== 'NO_TIENE' && (
          <div className="lista">
            <FilaCampo etiqueta="Número" value={doc.numero || ''} maxLength={60} placeholder="Como sale en el papel" onChange={(e) => poner({ numero: e.target.value })} />
            <FilaCampo etiqueta="Expedido" type="date" value={doc.fecha || ''} onChange={(e) => poner({ fecha: e.target.value })} />
            {info.vence && <FilaCampo etiqueta="Vence" type="date" value={doc.vence || ''} onChange={(e) => poner({ vence: e.target.value })} />}
          </div>
        )}

        <div>
          <h3 className="cabecera-seccion">Qué verifiqué</h3>
          <div className="space-y-2">
            {info.checks.map(([k, t]) => {
              const marcado = (doc.checks || []).includes(k);
              return (
                <button key={k} type="button" role="checkbox" aria-checked={marcado}
                  onClick={() => poner({ checks: marcado ? doc.checks.filter((x) => x !== k) : [...(doc.checks || []), k] })}
                  className={`w-full min-h-[56px] rounded-xl px-3 py-2.5 flex items-start gap-3 text-left ${marcado ? 'bg-acento/10 ring-2 ring-acento/40' : 'bg-relleno'}`}>
                  {marcado ? <CheckCircle2 className="w-6 h-6 text-acento shrink-0" /> : <span className="w-6 h-6 rounded-full border-2 border-terciario shrink-0" />}
                  <span className="t-cuerpo">{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {avisos.length > 0 && (
          <div className="space-y-2">
            {avisos.map((a) => <p key={a} className="t-sub text-aviso bg-aviso/10 rounded-xl px-3 py-2.5 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{a}</p>)}
          </div>
        )}

        <div className="lista">
          <FilaCampo etiqueta="Observación" value={doc.obs || ''} maxLength={500} placeholder="Opcional" onChange={(e) => poner({ obs: e.target.value })} />
        </div>

        <div>
          <h3 className="cabecera-seccion">Foto del documento</h3>
          <GaleriaFotos claves={fotos} alCambiar={alCambiarFotos} maximo={4} />
        </div>

        <Boton onClick={alCerrar}>Listo</Boton>
      </div>
    </Hoja>
  );
}
