/**
 * Avisos breves dentro de la interfaz (no alertas modales): confirman que algo
 * se guardó o explican por qué no. Cada aviso lleva icono y texto, nunca solo
 * color, y se anuncia a los lectores de pantalla.
 */

import { createContext, useContext, useCallback, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, CloudOff } from 'lucide-react';

const Contexto = createContext(null);

const TIPOS = {
  exito: { Icono: CheckCircle2, color: 'text-acento' },
  error: { Icono: XCircle, color: 'text-critico' },
  aviso: { Icono: AlertTriangle, color: 'text-aviso' },
  info: { Icono: CloudOff, color: 'text-secundario' },
};

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);

  const mostrar = useCallback((tipo, titulo, mensaje = '', duracion = 3600) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setAvisos((p) => [...p.slice(-1), { id, tipo, titulo, mensaje }]);
    setTimeout(() => setAvisos((p) => p.filter((a) => a.id !== id)), duracion);
  }, []);

  const api = {
    exito: (t, m) => mostrar('exito', t, m),
    error: (t, m) => mostrar('error', t, m, 5200),
    aviso: (t, m) => mostrar('aviso', t, m, 4600),
    info: (t, m) => mostrar('info', t, m),
  };

  return (
    <Contexto.Provider value={api}>
      {children}
      <div className="fixed inset-x-0 top-0 z-50 px-4 seguro-arriba pointer-events-none" aria-live="polite">
        <div className="max-w-md mx-auto pt-2 space-y-2">
          {avisos.map((a) => {
            const { Icono, color } = TIPOS[a.tipo];
            return (
              <div key={a.id} role="status" className="pointer-events-auto bg-elevado rounded-2xl shadow-lg border border-separador/60 px-4 py-3 flex gap-3 animar-entrada">
                <Icono className={`w-6 h-6 shrink-0 ${color}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="t-encabezado">{a.titulo}</p>
                  {a.mensaje && <p className="t-sub text-secundario">{a.mensaje}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Contexto.Provider>
  );
}

export const useAvisos = () => {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <ProveedorAvisos>');
  return ctx;
};
