/** Estado productivo de una hembra como etiqueta con ícono y texto (dato real del sistema). */
import { Milk, Baby, Moon, Sprout } from 'lucide-react';

const ESTADOS = {
  produccion: { texto: 'En producción', Icono: Milk, clase: 'bg-exito/15 text-exito' },
  prenada: { texto: 'Preñada', Icono: Baby, clase: 'bg-info/15 text-info' },
  seca: { texto: 'Seca', Icono: Moon, clase: 'bg-relleno text-secundario' },
  cabretona: { texto: 'Cabretona', Icono: Sprout, clase: 'bg-salvia/20 text-acento' },
  cabrita: { texto: 'Cabrita', Icono: Sprout, clase: 'bg-salvia/20 text-acento' },
};

export default function EstadoProductivo({ estado, className = '' }) {
  const e = ESTADOS[estado];
  if (!e) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full pl-2 pr-2.5 py-0.5 t-mini font-semibold ${e.clase} ${className}`}>
      <e.Icono className="w-3.5 h-3.5" strokeWidth={2.2} aria-hidden="true" />
      {e.texto}
    </span>
  );
}
