/**
 * Ficha del animal: foto, identidad, datos generales e historial (salud,
 * pesos, leche) traído del servidor. Lo último descargado se guarda en el
 * teléfono para poder consultarlo sin señal.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Ruler, Tag, ChevronLeft, Syringe, Weight, Milk, Eye, CalendarDays, RefreshCw, WifiOff,
} from 'lucide-react';
import api, { esErrorDeRed } from '@servicios/api';
import { obtenerCacheAnimales, leerLocal } from '@servicios/almacenamientoLocal';
import { nuevaLineal } from '@servicios/evaluaciones';
import Barra from '@/ui/Barra';
import Chapeta, { codigoDe } from '@/ui/Chapeta';
import FotoAnimal from '@/ui/FotoAnimal';
import EstadoProductivo from '@/ui/EstadoProductivo';
import { Seccion, Fila, IconoFila, EstadoVacio } from '@/ui/Lista';
import { REGISTROS } from './Inicio';
import { edadTexto, edadMeses, fechaCorta, haceCuanto } from '@utilidades/formato';

const CLAVE = (id) => `caprino_ficha_${id}`;
const TIPO_SALUD = {
  vacuna: 'Vacuna', tratamiento: 'Tratamiento', diagnostico: 'Diagnóstico', cirugia: 'Cirugía', desparasitacion: 'Desparasitación',
};

async function descargarHistorial(id) {
  const pedir = (ruta) => api.get(ruta, { timeout: 15000 }).then((r) => r.data?.data ?? []);
  const [salud, pesos, leche, famacha, gen] = await Promise.allSettled([
    pedir(`/salud?animal=${id}`), pedir(`/pesaje?animal=${id}`), pedir(`/produccion?animal=${id}`),
    pedir(`/famacha?idAnimal=${id}`), pedir(`/genealogia/${id}`),
  ]);
  const sinRed = [salud, pesos, leche, famacha].every((r) => r.status === 'rejected' && esErrorDeRed(r.reason));
  if (sinRed) throw Object.assign(new Error('sin red'), { sinRed: true });
  const val = (r) => (r.status === 'fulfilled' ? r.value : []);
  const deEste = (lista) => (Array.isArray(lista) ? lista.filter((x) => String(x.idAnimal ?? id) === String(id)) : []);
  const datos = {
    salud: deEste(val(salud)), pesos: deEste(val(pesos)), leche: deEste(val(leche)), famacha: deEste(val(famacha)),
    madre: gen.status === 'fulfilled' ? gen.value?.madre ?? null : null,
    padre: gen.status === 'fulfilled' ? gen.value?.padre ?? null : null,
  };
  try { localStorage.setItem(CLAVE(id), JSON.stringify({ fecha: Date.now(), datos })); } catch { /* espacio lleno: no es grave */ }
  return { fecha: Date.now(), datos };
}

const TURNO = { manana: 'mañana', 'mañana': 'mañana', tarde: 'tarde', noche: 'noche' };
const num = (v) => Number(v).toLocaleString('es-CO', { maximumFractionDigits: 2 });
const porFecha = (campo) => (a, b) => String(b[campo] || '').localeCompare(String(a[campo] || ''));
const nombrePariente = (p) => (p ? (p.nombre ? `${p.codigo} · ${p.nombre}` : p.codigo) : null);

export default function Animal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const animal = obtenerCacheAnimales().find((a) => String(a.id) === String(id));
  const [pestana, setPestana] = useState('info');
  const [historial, setHistorial] = useState(() => leerLocal(CLAVE(id), null));
  const [cargando, setCargando] = useState(false);
  const [sinRed, setSinRed] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try { setHistorial(await descargarHistorial(id)); setSinRed(false); }
    catch (e) { if (e.sinRed) setSinRed(true); }
    finally { setCargando(false); }
  };
  useEffect(() => { if (animal) cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if (!animal) {
    return (
      <>
        <Barra titulo="Animal" atras />
        <EstadoVacio Icono={Tag} titulo="No se encontró el animal" texto="Puede que la lista del teléfono esté desactualizada." />
      </>
    );
  }

  const hembra = animal.sexo === 'hembra';
  const registros = REGISTROS.filter((r) => hembra || r.tipo !== 'produccion');
  const d = historial?.datos;
  const PESTANAS = [['info', 'Información'], ['salud', 'Salud'], ['pesos', 'Pesos'], ...(hembra ? [['leche', 'Leche']] : [])];

  const clasificar = () => {
    const b = nuevaLineal(animal, edadMeses(animal.fechaNacimiento) ?? '');
    navigate(`/lineal/${b.id}`);
  };

  const faltante = <span className="text-terciario">Sin registrar</span>;

  // Últimos movimientos de todos los registros, para "Historial reciente"
  const recientes = d ? [
    ...d.salud.map((x) => ({ fecha: x.fechaAplicacion, Icono: Syringe, tono: 'bg-critico/15 text-critico', titulo: TIPO_SALUD[x.tipoRegistro] || x.tipoRegistro, det: x.medicamentoProducto || x.enfermedadDiagnostico })),
    ...d.pesos.map((x) => ({ fecha: x.fechaPesaje, Icono: Weight, tono: 'bg-info/15 text-info', titulo: `Pesaje: ${num(x.pesoKg)} kg`, det: x.condicionCorporal ? `Condición corporal ${x.condicionCorporal}` : null })),
    ...d.famacha.map((x) => ({ fecha: x.fechaEvaluacion, Icono: Eye, tono: 'bg-aviso/15 text-aviso', titulo: `FAMACHA ${x.puntuacion}`, det: x.ojoEvaluado ? `Ojo ${x.ojoEvaluado}` : null })),
    ...d.leche.map((x) => ({ fecha: x.fechaProduccion, Icono: Milk, tono: 'bg-exito/15 text-exito', titulo: `Leche: ${num(x.litros)} L`, det: x.turno ? `Ordeño de la ${TURNO[x.turno] || x.turno}` : null })),
  ].sort(porFecha('fecha')) : [];

  const Linea = ({ item }) => (
    <div className="fila">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.tono}`} aria-hidden="true"><item.Icono className="w-[18px] h-[18px]" /></span>
      <span className="flex-1 min-w-0">
        <span className="block t-cuerpo truncate">{item.titulo}</span>
        {item.det && <span className="block t-nota text-secundario truncate">{item.det}</span>}
      </span>
      <span className="t-nota text-secundario shrink-0">{fechaCorta(item.fecha)}</span>
    </div>
  );

  const listaDe = (items, vacio) => (!d ? null : items.length === 0
    ? <p className="tarjeta t-sub text-secundario text-center">{vacio}</p>
    : <div className="lista">{items.map((it, i) => <Linea key={i} item={it} />)}</div>);

  return (
    <>
      {/* Foto grande */}
      <div className="relative h-[300px] bg-relleno">
        <FotoAnimal animal={animal} className="absolute inset-0 w-full h-full" iconoClase="w-24 h-24" alt={`Foto de ${animal.nombre || 'la chapeta ' + codigoDe(animal)}`} />
        <span className="absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(180deg, rgb(0 0 0 / 0.35), transparent)' }} aria-hidden="true" />
        <button onClick={() => navigate(-1)} aria-label="Atrás"
          className="absolute left-3 seguro-arriba mt-3 w-11 h-11 rounded-full bg-black/35 text-white flex items-center justify-center active:opacity-70">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.4} />
        </button>
      </div>

      {/* Identidad */}
      <div className="relative -mt-8 rounded-t-[24px] bg-fondo px-4 pt-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Chapeta codigo={codigoDe(animal)} tamano="md" vieja={!animal.chapetaNueva && !!animal.chapetaVieja} />
          {hembra && <EstadoProductivo estado={animal.estadoProductivo} />}
        </div>
        {animal.nombre && <h1 className="t-grande mt-2">{animal.nombre}</h1>}
        <p className={`t-sub text-secundario ${animal.nombre ? 'mt-0.5' : 'mt-2'}`}>
          {[hembra ? 'Hembra' : 'Macho', animal.nombreRaza, edadTexto(animal.fechaNacimiento)].filter(Boolean).join(' · ')}
        </p>

        {/* Pestañas */}
        <div className="flex gap-1 mt-4 border-b border-separador -mx-4 px-4 overflow-x-auto sin-barra" role="tablist">
          {PESTANAS.map(([k, t]) => (
            <button key={k} role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}
              className={`shrink-0 min-h-[44px] px-3 t-sub font-semibold border-b-[3px] -mb-px transition-colors
                          ${pestana === k ? 'border-acento text-acento' : 'border-transparent text-secundario'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de la descarga */}
      <div className="px-4 pt-3">
        {cargando && !d && <p className="t-sub text-secundario flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Cargando historial…</p>}
        {sinRed && (
          <p className="t-nota text-secundario flex items-center gap-1.5">
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            {d ? `Sin conexión: historial guardado ${haceCuanto(historial.fecha)}.` : 'Sin conexión: el historial se ve cuando haya señal.'}
          </p>
        )}
      </div>

      {pestana === 'info' && (
        <>
          <Seccion titulo="Datos generales" className="mt-2">
            <Fila titulo="Nacimiento" valor={animal.fechaNacimiento ? fechaCorta(animal.fechaNacimiento) : faltante} />
            {d && <Fila titulo="Madre" valor={nombrePariente(d.madre) || faltante} />}
            {d && <Fila titulo="Padre" valor={nombrePariente(d.padre) || faltante} />}
            <Fila titulo="Raza" valor={animal.nombreRaza || faltante} />
            <Fila titulo="Corral" valor={animal.nombreCorral || faltante} />
            {animal.colorPelaje && <Fila titulo="Color" valor={animal.colorPelaje} />}
            {animal.chapetaNueva && <Fila titulo="Chapeta nueva" valor={animal.chapetaNueva} />}
            {animal.chapetaVieja && <Fila titulo="Chapeta vieja" valor={animal.chapetaVieja} />}
          </Seccion>

          {d && (
            <section className="px-4 mt-6">
              <h2 className="cabecera-seccion flex items-center gap-1.5"><CalendarDays className="w-[18px] h-[18px]" aria-hidden="true" /> Historial reciente</h2>
              {listaDe(recientes.slice(0, 4), 'Todavía no hay registros de este animal.')}
            </section>
          )}

          <Seccion titulo="Registrar" className="mt-6">
            {registros.map((r) => (
              <Fila key={r.tipo} icono={<IconoFila Icono={r.Icono} tono={r.tono} />} titulo={r.titulo} sub={r.sub}
                alHacerClic={() => navigate(`/registrar/${r.tipo}?animal=${animal.id}`)} />
            ))}
            {hembra && (
              <Fila icono={<IconoFila Icono={Ruler} tono="salvia" />} titulo="Clasificación lineal"
                sub="Calificar el cuerpo y la ubre, con medidas y fotos" alHacerClic={clasificar} />
            )}
          </Seccion>
        </>
      )}

      {pestana === 'salud' && (
        <section className="px-4 mt-2 space-y-5">
          <div>
            <h2 className="cabecera-seccion">Vacunas, tratamientos y diagnósticos</h2>
            {listaDe(recientes.filter((x) => x.Icono === Syringe), 'Sin registros de salud.')}
          </div>
          <div>
            <h2 className="cabecera-seccion">FAMACHA</h2>
            {listaDe(recientes.filter((x) => x.Icono === Eye), 'Sin evaluaciones FAMACHA.')}
          </div>
        </section>
      )}

      {pestana === 'pesos' && (
        <section className="px-4 mt-2">
          <h2 className="cabecera-seccion">Pesajes</h2>
          {listaDe(recientes.filter((x) => x.Icono === Weight), 'Sin pesajes registrados.')}
        </section>
      )}

      {pestana === 'leche' && (
        <section className="px-4 mt-2">
          <h2 className="cabecera-seccion">Producción de leche</h2>
          {listaDe(recientes.filter((x) => x.Icono === Milk), 'Sin producción registrada.')}
        </section>
      )}

      <p className="t-nota text-secundario px-5 mt-5">El expediente completo (partos, genealogía y reportes) está en la web.</p>
    </>
  );
}
