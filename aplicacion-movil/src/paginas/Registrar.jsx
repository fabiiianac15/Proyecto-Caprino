/**
 * Registros rápidos: salud, pesaje, leche y FAMACHA. Un solo formulario
 * corto por tipo. Sin red, el registro queda guardado y se envía después.
 */

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { registrar, TIPOS_SALUD, METODOS_PESAJE, TURNOS, FAMACHA } from '@servicios/registros';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import Barra from '@/ui/Barra';
import { Seccion, FilaCampo, FilaInterruptor } from '@/ui/Lista';
import { Boton, Segmentado } from '@/ui/Controles';
import SelectorAnimal from '@/ui/SelectorAnimal';
import { codigoDe } from '@/ui/Chapeta';
import { useAvisos } from '@/ui/Avisos';
import { hoyISO } from '@utilidades/formato';

const TITULOS = { salud: 'Salud', pesaje: 'Pesaje', produccion: 'Leche', famacha: 'FAMACHA' };

const INICIAL = {
  salud: { tipoRegistro: 'vacuna', fecha: hoyISO(), medicamentoProducto: '', dosis: '', enfermedadDiagnostico: '', veterinario: '', observaciones: '' },
  pesaje: { fecha: hoyISO(), pesoKg: '', condicionCorporal: '', metodoPesaje: 'bascula', observaciones: '' },
  produccion: { fecha: hoyISO(), litros: '', turno: 'mañana', grasaPorcentaje: '', observaciones: '' },
  famacha: { fecha: hoyISO(), puntuacion: null, ojoEvaluado: 'ambos', tratamientoAplicado: false, medicamento: '', observaciones: '' },
};

const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

/** Arma el cuerpo de la petición o devuelve el motivo por el que no se puede. */
const preparar = (tipo, idAnimal, f) => {
  const base = { idAnimal: Number(idAnimal), observaciones: f.observaciones || null };
  if (tipo === 'salud') {
    return { endpoint: '/salud', datos: { ...base, tipoRegistro: f.tipoRegistro, fechaAplicacion: f.fecha,
      medicamentoProducto: f.medicamentoProducto || null, dosis: f.dosis || null,
      enfermedadDiagnostico: f.enfermedadDiagnostico || null, veterinario: f.veterinario || null } };
  }
  if (tipo === 'pesaje') {
    const peso = num(f.pesoKg);
    if (!(peso > 0 && peso < 200)) return { error: 'Escriba el peso en kilos (entre 0 y 200).' };
    const cc = num(f.condicionCorporal);
    if (cc != null && !(cc >= 1 && cc <= 5)) return { error: 'La condición corporal va de 1 a 5.' };
    return { endpoint: '/pesaje', datos: { ...base, fechaPesaje: f.fecha, pesoKg: peso, condicionCorporal: cc, metodoPesaje: f.metodoPesaje } };
  }
  if (tipo === 'produccion') {
    const litros = num(f.litros);
    if (!(litros > 0 && litros <= 15)) return { error: 'Escriba los litros (entre 0 y 15).' };
    return { endpoint: '/produccion', datos: { ...base, fechaProduccion: f.fecha, litros, turno: f.turno, grasaPorcentaje: num(f.grasaPorcentaje) } };
  }
  if (!f.puntuacion) return { error: 'Elija el color que más se parece al del ojo.' };
  return { endpoint: '/famacha', datos: { ...base, fechaEvaluacion: f.fecha, puntuacion: f.puntuacion, ojoEvaluado: f.ojoEvaluado,
    tratamientoAplicado: !!f.tratamientoAplicado, medicamento: f.tratamientoAplicado ? (f.medicamento || null) : null, proximaEvaluacion: null } };
};

export default function Registrar() {
  const { tipo } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const avisos = useAvisos();
  const [idAnimal, setIdAnimal] = useState(params.get('animal') || '');
  const [f, setF] = useState(() => ({ ...INICIAL[tipo] }));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!TITULOS[tipo]) return <Navigate to="/" replace />;
  const poner = (campo) => (e) => setF((p) => ({ ...p, [campo]: e?.target ? e.target.value : e }));

  const guardar = async () => {
    setError('');
    if (!idAnimal) { setError('Elija el animal.'); return; }
    const p = preparar(tipo, idAnimal, f);
    if (p.error) { setError(p.error); return; }
    const animal = obtenerCacheAnimales().find((a) => String(a.id) === String(idAnimal));
    setGuardando(true);
    try {
      const r = await registrar(tipo, p.endpoint, p.datos, `${TITULOS[tipo]} · ${codigoDe(animal) || idAnimal}`);
      if (r.estado === 'enviado') avisos.exito('Guardado', `${TITULOS[tipo]} de ${animal?.nombre || 'el animal'}.`);
      else avisos.info('Guardado en el teléfono', 'Se enviará cuando haya conexión.');
      navigate(-1);
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'El servidor no aceptó el registro.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Barra titulo={TITULOS[tipo]} atras />

      <Seccion className="mt-4">
        <SelectorAnimal valor={idAnimal} alCambiar={setIdAnimal} soloHembras={tipo === 'produccion'} />
        <FilaCampo etiqueta="Fecha" type="date" value={f.fecha} max={hoyISO()} onChange={poner('fecha')} />
      </Seccion>

      {tipo === 'salud' && (
        <>
          <div className="px-4 mt-6">
            <h2 className="cabecera-seccion">Qué se hizo</h2>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SALUD.map((t) => (
                <button key={t.valor} type="button" onClick={() => poner('tipoRegistro')(t.valor)} aria-pressed={f.tipoRegistro === t.valor}
                  className={`min-h-[44px] px-4 rounded-full t-sub font-medium ${f.tipoRegistro === t.valor ? 'bg-acento text-sobre-acento' : 'bg-tarjeta text-texto'}`}>
                  {t.etiqueta}
                </button>
              ))}
            </div>
          </div>
          <Seccion className="mt-4">
            <FilaCampo etiqueta="Producto" value={f.medicamentoProducto} onChange={poner('medicamentoProducto')} placeholder="Nombre del medicamento" />
            <FilaCampo etiqueta="Dosis" value={f.dosis} onChange={poner('dosis')} placeholder="Ej. 2 ml" />
            <FilaCampo etiqueta="Enfermedad" value={f.enfermedadDiagnostico} onChange={poner('enfermedadDiagnostico')} placeholder="Si aplica" />
            <FilaCampo etiqueta="Veterinario" value={f.veterinario} onChange={poner('veterinario')} placeholder="Quién lo aplicó" />
          </Seccion>
        </>
      )}

      {tipo === 'pesaje' && (
        <>
          <Seccion className="mt-6" pie="La condición corporal dice qué tan flaca o gorda está: 1 muy flaca, 3 ideal, 5 muy gorda.">
            <FilaCampo etiqueta="Peso (kg)" inputMode="decimal" value={f.pesoKg} onChange={poner('pesoKg')} placeholder="0,0" />
            <FilaCampo etiqueta="Condición corporal" inputMode="decimal" value={f.condicionCorporal} onChange={poner('condicionCorporal')} placeholder="1 a 5" />
          </Seccion>
          <div className="px-4 mt-6">
            <h2 className="cabecera-seccion">Cómo se pesó</h2>
            <Segmentado opciones={METODOS_PESAJE} valor={f.metodoPesaje} alCambiar={poner('metodoPesaje')} etiqueta="Método de pesaje" />
          </div>
        </>
      )}

      {tipo === 'produccion' && (
        <>
          <div className="px-4 mt-6">
            <h2 className="cabecera-seccion">Ordeño</h2>
            <Segmentado opciones={TURNOS} valor={f.turno} alCambiar={poner('turno')} etiqueta="Turno de ordeño" />
          </div>
          <Seccion className="mt-4">
            <FilaCampo etiqueta="Litros" inputMode="decimal" value={f.litros} onChange={poner('litros')} placeholder="0,0" />
            <FilaCampo etiqueta="Grasa (%)" inputMode="decimal" value={f.grasaPorcentaje} onChange={poner('grasaPorcentaje')} placeholder="Opcional" />
          </Seccion>
        </>
      )}

      {tipo === 'famacha' && (
        <>
          <Seccion titulo="Color de adentro del párpado" className="mt-6"
            pie="Baje el párpado de abajo con el pulgar y compare el color a la luz del día.">
            {FAMACHA.map((n) => (
              <button key={n.valor} type="button" onClick={() => poner('puntuacion')(n.valor)} className="fila" style={{ '--sangria': '68px' }}
                role="radio" aria-checked={f.puntuacion === n.valor}>
                <span className="w-10 h-10 rounded-full border border-separador shrink-0" style={{ background: n.color }} aria-hidden="true" />
                <span className="flex-1">
                  <span className="block t-cuerpo">{n.valor} · {n.nombre}</span>
                  <span className="block t-nota text-secundario">{n.lectura}</span>
                </span>
                {f.puntuacion === n.valor && <CheckCircle2 className="w-6 h-6 text-acento shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </Seccion>
          <Seccion className="mt-6">
            <FilaInterruptor titulo="Se desparasitó" valor={f.tratamientoAplicado} alCambiar={poner('tratamientoAplicado')} />
            {f.tratamientoAplicado && <FilaCampo etiqueta="Producto" value={f.medicamento} onChange={poner('medicamento')} placeholder="Nombre" />}
          </Seccion>
        </>
      )}

      <Seccion titulo="Observaciones" className="mt-6">
        <textarea className="campo min-h-[88px]" value={f.observaciones} onChange={poner('observaciones')} placeholder="Opcional" aria-label="Observaciones" />
      </Seccion>

      <div className="px-4 mt-6 space-y-3">
        {error && <p className="t-sub text-critico" role="alert">{error}</p>}
        <Boton onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
      </div>
    </>
  );
}
