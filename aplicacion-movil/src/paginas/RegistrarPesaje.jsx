/**
 * Registrar pesaje. Offline-first: si no hay red, se encola y sincroniza al
 * volver el internet. Animal preseleccionable con ?animal=<id>.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { registrarPesaje, METODOS_PESAJE } from '@servicios/pesajeAPI';
import { useConectividad } from '@hooks/useConectividad';
import { useToast } from '@componentes/comunes/Toast';
import Encabezado from '@componentes/comunes/Encabezado';
import BotonGrande from '@componentes/comunes/BotonGrande';
import SelectorAnimal from '@componentes/comunes/SelectorAnimal';

const hoy = () => new Date().toISOString().slice(0, 10);

export default function RegistrarPesaje() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const enLinea = useConectividad();
  const toast = useToast();

  const animales = useMemo(() => obtenerCacheAnimales(), []);

  const [idAnimal, setIdAnimal] = useState(params.get('animal') || '');
  const [fechaPesaje, setFecha] = useState(hoy());
  const [pesoKg, setPeso] = useState('');
  const [condicionCorporal, setCondicion] = useState('');
  const [metodoPesaje, setMetodo] = useState('bascula');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const animalSel = animales.find((a) => String(a.id) === String(idAnimal));

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!idAnimal) {
      toast.aviso('Falta el animal', 'Selecciona un animal para continuar.');
      return;
    }
    if (!pesoKg) {
      toast.aviso('Falta el peso', 'Ingresa el peso en kilogramos.');
      return;
    }

    const datos = {
      idAnimal: Number(idAnimal),
      fechaPesaje,
      pesoKg: Number(pesoKg),
      condicionCorporal: condicionCorporal ? Number(condicionCorporal) : null,
      metodoPesaje: metodoPesaje || null,
      observaciones: observaciones || null,
    };
    const resumen = `Pesaje ${pesoKg} kg · ${animalSel?.codigo || `#${idAnimal}`} · ${fechaPesaje}`;

    setGuardando(true);
    try {
      const { estado } = await registrarPesaje(datos, resumen);
      window.dispatchEvent(new Event('cola-actualizada'));
      if (estado === 'enviado') {
        toast.exito('Pesaje guardado', 'Se envió al servidor correctamente.');
      } else {
        toast.info('Guardado sin conexión', 'Se enviará automáticamente al volver el internet.');
      }
      setPeso('');
      setCondicion('');
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
      <Encabezado titulo="Registrar pesaje" />

      <form onSubmit={manejarSubmit} className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <SelectorAnimal animales={animales} value={idAnimal} onChange={setIdAnimal} />

        <div>
          <label className="etiqueta-campo">Peso (kg)</label>
          <input
            className="campo-grande text-2xl font-semibold"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={pesoKg}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="0.0"
            required
          />
        </div>

        <div>
          <label className="etiqueta-campo">Condición corporal (1–5, opcional)</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCondicion(condicionCorporal === String(n) ? '' : String(n))}
                className={`min-h-[52px] rounded-xl border-2 text-lg font-bold transition-colors ${
                  condicionCorporal === String(n)
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="etiqueta-campo">Método</label>
          <select
            className="campo-grande"
            value={metodoPesaje}
            onChange={(e) => setMetodo(e.target.value)}
          >
            {METODOS_PESAJE.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
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
          {guardando ? 'Guardando…' : enLinea ? 'Guardar pesaje' : 'Guardar (sin conexión)'}
        </BotonGrande>
      </form>
    </div>
  );
}
