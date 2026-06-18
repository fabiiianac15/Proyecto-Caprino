/**
 * Registrar producción de leche. Offline-first: si no hay red, se encola y
 * sincroniza al volver el internet. Animal preseleccionable con ?animal=<id>.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { registrarProduccion, TURNOS } from '@servicios/produccionAPI';
import { useConectividad } from '@hooks/useConectividad';
import { useToast } from '@componentes/comunes/Toast';
import Encabezado from '@componentes/comunes/Encabezado';
import BotonGrande from '@componentes/comunes/BotonGrande';
import SelectorAnimal from '@componentes/comunes/SelectorAnimal';

const hoy = () => new Date().toISOString().slice(0, 10);

export default function RegistrarProduccion() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const enLinea = useConectividad();
  const toast = useToast();

  const animales = useMemo(() => obtenerCacheAnimales(), []);

  const [idAnimal, setIdAnimal] = useState(params.get('animal') || '');
  const [fechaProduccion, setFecha] = useState(hoy());
  const [litros, setLitros] = useState('');
  const [turno, setTurno] = useState('total_dia');
  const [grasaPorcentaje, setGrasa] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const animalSel = animales.find((a) => String(a.id) === String(idAnimal));

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!idAnimal) {
      toast.aviso('Falta el animal', 'Selecciona un animal para continuar.');
      return;
    }
    if (!litros) {
      toast.aviso('Faltan los litros', 'Ingresa los litros producidos.');
      return;
    }

    const datos = {
      idAnimal: Number(idAnimal),
      fechaProduccion,
      litros: Number(litros),
      turno,
      grasaPorcentaje: grasaPorcentaje ? Number(grasaPorcentaje) : null,
      observaciones: observaciones || null,
    };
    const resumen = `Producción ${litros} L · ${animalSel?.codigo || `#${idAnimal}`} · ${fechaProduccion}`;

    setGuardando(true);
    try {
      const { estado } = await registrarProduccion(datos, resumen);
      window.dispatchEvent(new Event('cola-actualizada'));
      if (estado === 'enviado') {
        toast.exito('Producción guardada', 'Se envió al servidor correctamente.');
      } else {
        toast.info('Guardado sin conexión', 'Se enviará automáticamente al volver el internet.');
      }
      setLitros('');
      setGrasa('');
      setObservaciones('');
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      toast.error(
        'No se pudo registrar',
        err.response?.data?.error || err.response?.data?.message || 'Revisa los datos.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <Encabezado titulo="Registrar producción" />

      <form onSubmit={manejarSubmit} className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <SelectorAnimal animales={animales} value={idAnimal} onChange={setIdAnimal} />

        <div>
          <label className="etiqueta-campo">Litros</label>
          <input
            className="campo-grande text-2xl font-semibold"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            placeholder="0.0"
            required
          />
        </div>

        <div>
          <label className="etiqueta-campo">Turno</label>
          <div className="grid grid-cols-2 gap-2">
            {TURNOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTurno(t.valor)}
                className={`min-h-[52px] rounded-xl border-2 font-semibold transition-colors ${
                  turno === t.valor
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="etiqueta-campo">% Grasa (opcional)</label>
          <input
            className="campo-grande"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={grasaPorcentaje}
            onChange={(e) => setGrasa(e.target.value)}
            placeholder="Ej. 3.5"
          />
        </div>

        <div>
          <label className="etiqueta-campo">Observaciones (opcional)</label>
          <textarea
            className="campo-grande py-3"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <BotonGrande type="submit" disabled={guardando} Icono={Save}>
          {guardando ? 'Guardando…' : enLinea ? 'Guardar producción' : 'Guardar (sin conexión)'}
        </BotonGrande>
      </form>
    </div>
  );
}
