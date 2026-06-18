/**
 * Selector de animal reutilizable (lee de la caché local). Lo usan los
 * formularios de Salud, Pesaje y Producción.
 */

export default function SelectorAnimal({ animales, value, onChange }) {
  return (
    <div>
      <label className="etiqueta-campo">Animal</label>
      <select
        className="campo-grande"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">Selecciona un animal…</option>
        {animales.map((a) => (
          <option key={a.id} value={a.id}>
            {a.codigo || a.chapetaNueva || `#${a.id}`}
            {a.nombre ? ` — ${a.nombre}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
