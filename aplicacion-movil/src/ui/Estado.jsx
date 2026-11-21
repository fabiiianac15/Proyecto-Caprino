/**
 * Etiqueta de estado: siempre ícono + texto (nunca solo color).
 * Tipos: conectado, sinConexion, pendiente, error, info.
 */

import { CheckCircle2, WifiOff, UploadCloud, AlertTriangle, Info } from 'lucide-react';

const TIPOS = {
  conectado: { Icono: CheckCircle2, clase: 'bg-exito/15 text-exito' },
  sinConexion: { Icono: WifiOff, clase: 'bg-relleno text-secundario' },
  pendiente: { Icono: UploadCloud, clase: 'bg-aviso/15 text-aviso' },
  error: { Icono: AlertTriangle, clase: 'bg-critico/15 text-critico' },
  info: { Icono: Info, clase: 'bg-info/15 text-info' },
};

export default function Estado({ tipo = 'info', children, sobreMarca = false, className = '' }) {
  const t = TIPOS[tipo] || TIPOS.info;
  // Sobre el encabezado verde se usa una píldora clara para mantener el contraste
  const clase = sobreMarca ? 'bg-sobre-marca/15 text-sobre-marca' : t.clase;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1 t-nota font-medium ${clase} ${className}`}>
      <t.Icono className="w-4 h-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  );
}
