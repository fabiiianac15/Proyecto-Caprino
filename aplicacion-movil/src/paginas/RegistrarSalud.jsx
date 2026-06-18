/**
 * Registrar evento de salud (vacuna / tratamiento / etc.).
 *
 * Funciona offline: si no hay red, registrarSalud() encola la operación y se
 * sincroniza al volver el internet. El animal se puede preseleccionar con
 * ?animal=<id> (al venir desde la ficha del animal).
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { obtenerCacheAnimales } from '@servicios/almacenamientoLocal';
import { registrarSalud, TIPOS_SALUD } from '@servicios/saludAPI';
import { useConectividad } from '@hooks/useConectividad';
import { useToast } from '@componentes/comunes/Toast';
import Encabezado from '@componentes/comunes/Encabezado';
import BotonGrande from '@componentes/comunes/BotonGrande';
import SelectorAnimal from '@componentes/comunes/SelectorAnimal';

const hoy = () => new Date().toISOString().slice(0, 10);

export default function RegistrarSalud() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const enLinea = useConectividad();
  const toast = useToast();

  const animales = useMemo(() => obtenerCacheAnimales(), []);

  const [idAnimal, setIdAnimal] = useState(params.get('animal') || '');
  const [tipoRegistro, setTipoRegistro] = useState('vacuna');
  const [fechaAplicacion, setFecha] = useState(hoy());
  const [medicamentoProducto, setMedicamento] = useState('');
  const [dosis, setDosis] = useState('');
  const [enfermedadDiagnostico, setDiagnostico] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [guardando, setGuardando] = useState(false);

  const animalSel = animales.find((a) => String(a.id) === String(idAnimal));
  const esDiagnostico = tipoRegistro === 'diagnostico';

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!idAnimal) {
      toast.aviso('Falta el animal', 'Selecciona un animal para continuar.');
      return;
    }

    const datos = {
      idAnimal: Number(idAnimal),
      tipoRegistro,
      fechaAplicacion,
      medicamentoProducto: medicamentoProducto || null,
      dosis: dosis || null,
      enfermedadDiagnostico: enfermedadDiagnostico || null,
      veterinario: veterinario || null,
      observaciones: observaciones || null,
    };

    const etiquetaTipo =
      TIPOS_SALUD.find((t) => t.valor === tipoRegistro)?.etiqueta || tipoRegistro;
    const resumen = `${etiquetaTipo} · ${
      animalSel?.codigo || `#${idAnimal}`
    } · ${fechaAplicacion}`;

    setGuardando(true);
    try {
      const { estado } = await registrarSalud(datos, resumen);

      // Avisar al contador de pendientes que la cola pudo cambiar.
      window.dispatchEvent(new Event('cola-actualizada'));

      if (estado === 'enviado') {
        toast.exito('Registro guardado', 'Se envió al servidor correctamente.');
      } else {
        toast.info('Guardado sin conexión', 'Se enviará automáticamente al volver el internet.');
      }

      // Reiniciar campos del registro (mantener animal y tipo para registros en serie).
      setMedicamento('');
      setDosis('');
      setDiagnostico('');
      setObservaciones('');

      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      toast.error(
        'No se pudo registrar',
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Revisa los datos e intenta de nuevo.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <Encabezado titulo="Registrar salud" />

      <form
        onSubmit={manejarSubmit}
        className="px-4 py-4 space-y-4 max-w-md mx-auto"
      >
        <SelectorAnimal animales={animales} value={idAnimal} onChange={setIdAnimal} />

        <div>
          <label className="etiqueta-campo">Tipo de registro</label>
          <select
            className="campo-grande"
            value={tipoRegistro}
            onChange={(e) => setTipoRegistro(e.target.value)}
          >
            {TIPOS_SALUD.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="etiqueta-campo">Fecha</label>
          <input
            className="campo-grande"
            type="date"
            value={fechaAplicacion}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        {esDiagnostico ? (
          <div>
            <label className="etiqueta-campo">Enfermedad / diagnóstico</label>
            <input
              className="campo-grande"
              type="text"
              value={enfermedadDiagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Ej. Mastitis"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="etiqueta-campo">Medicamento / producto</label>
              <input
                className="campo-grande"
                type="text"
                value={medicamentoProducto}
                onChange={(e) => setMedicamento(e.target.value)}
                placeholder="Ej. Ivermectina"
              />
            </div>
            <div>
              <label className="etiqueta-campo">Dosis</label>
              <input
                className="campo-grande"
                type="text"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
                placeholder="Ej. 1 ml / 50 kg"
              />
            </div>
          </>
        )}

        <div>
          <label className="etiqueta-campo">Veterinario (opcional)</label>
          <input
            className="campo-grande"
            type="text"
            value={veterinario}
            onChange={(e) => setVeterinario(e.target.value)}
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
          {guardando
            ? 'Guardando…'
            : enLinea
            ? 'Guardar registro'
            : 'Guardar (sin conexión)'}
        </BotonGrande>
      </form>
    </div>
  );
}
