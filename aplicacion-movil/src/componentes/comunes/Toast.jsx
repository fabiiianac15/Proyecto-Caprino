/**
 * Sistema de notificaciones tipo "toast", acoplado al estilo de la web.
 *
 * Uso:
 *   const toast = useToast();
 *   toast.exito('Título', 'Mensaje opcional');
 *   toast.error('Título', 'Mensaje');
 *   toast.info(...); toast.aviso(...);
 *
 * Envolver la app con <ProveedorToast> (ya hecho en main.jsx).
 */

import { createContext, useContext, useCallback, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ESTILOS = {
  exito: { Icono: CheckCircle2, barra: 'bg-green-500', icono: 'text-green-500' },
  error: { Icono: XCircle, barra: 'bg-red-500', icono: 'text-red-500' },
  aviso: { Icono: AlertTriangle, barra: 'bg-amber-500', icono: 'text-amber-500' },
  info: { Icono: Info, barra: 'bg-blue-500', icono: 'text-blue-500' },
};

export function ProveedorToast({ children }) {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, titulo, mensaje = '', duracion = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, tipo, titulo, mensaje }]);
      if (duracion > 0) {
        setTimeout(() => quitar(id), duracion);
      }
      return id;
    },
    [quitar]
  );

  // API cómoda por tipo
  const api = {
    exito: (t, m, d) => mostrar('exito', t, m, d),
    error: (t, m, d) => mostrar('error', t, m, d),
    aviso: (t, m, d) => mostrar('aviso', t, m, d),
    info: (t, m, d) => mostrar('info', t, m, d),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Contenedor de toasts (arriba, sobre todo el contenido) */}
      <div className="fixed top-0 inset-x-0 z-50 flex flex-col items-center gap-2 px-3 pt-3 pointer-events-none">
        {toasts.map((t) => {
          const { Icono, barra, icono } = ESTILOS[t.tipo] || ESTILOS.info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto w-full max-w-md bg-white rounded-xl shadow-lg
                         border border-gray-100 overflow-hidden flex animate-aparecer"
            >
              <div className={`w-1.5 shrink-0 ${barra}`} />
              <div className="flex items-start gap-3 p-3 flex-1 min-w-0">
                <Icono className={`w-6 h-6 shrink-0 ${icono}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{t.titulo}</p>
                  {t.mensaje && (
                    <p className="text-sm text-gray-500 leading-snug">{t.mensaje}</p>
                  )}
                </div>
                <button
                  onClick={() => quitar(t.id)}
                  className="text-gray-300 active:text-gray-500 shrink-0"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ProveedorToast>');
  return ctx;
};
