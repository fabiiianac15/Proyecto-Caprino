import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ─── Estilos por tipo ─── */
const TIPOS = {
  success: {
    bg: 'bg-white', border: 'border-green-200', bar: 'bg-green-500',
    band: 'bg-green-500', Icon: CheckCircle, iconColor: 'text-white',
    title: 'text-gray-800', text: 'text-gray-500',
  },
  error: {
    bg: 'bg-white', border: 'border-red-200', bar: 'bg-red-500',
    band: 'bg-red-500', Icon: XCircle, iconColor: 'text-white',
    title: 'text-gray-800', text: 'text-gray-500',
  },
  warning: {
    bg: 'bg-white', border: 'border-amber-200', bar: 'bg-amber-500',
    band: 'bg-amber-500', Icon: AlertTriangle, iconColor: 'text-white',
    title: 'text-gray-800', text: 'text-gray-500',
  },
  info: {
    bg: 'bg-white', border: 'border-blue-200', bar: 'bg-blue-500',
    band: 'bg-blue-500', Icon: Info, iconColor: 'text-white',
    title: 'text-gray-800', text: 'text-gray-500',
  },
};

/* ─── Item individual ─── */
function ToastItem({ toast, onClose }) {
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState(100);
  const { tipo = 'info', titulo, mensaje, duracion = 4200 } = toast;
  const e = TIPOS[tipo] ?? TIPOS.info;
  const { Icon } = e;
  const intervalRef = useRef(null);

  const cerrar = useCallback(() => {
    setVisible(false);
    setTimeout(() => onClose(toast.id), 320);
  }, [onClose, toast.id]);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 20);

    const step = 100 / (duracion / 50);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p - step <= 0) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return p - step;
      });
    }, 50);

    const t2 = setTimeout(cerrar, duracion);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(intervalRef.current);
    };
  }, [duracion, cerrar]);

  return (
    <div
      className={`
        pointer-events-auto w-80 rounded-2xl border shadow-xl overflow-hidden
        transition-all duration-300 ease-out
        ${e.bg} ${e.border}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <div className="flex items-start gap-0">
        {/* Banda lateral de color con icono */}
        <div className={`${e.band} w-12 shrink-0 flex flex-col items-center justify-start pt-4 gap-1.5 self-stretch`}>
          <Icon className={`w-5 h-5 ${e.iconColor}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 px-4 py-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Cabrita */}
              <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-100 shadow-sm">
                <img
                  src="/img/LogoCabra.jpg"
                  alt="cabrita"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-tight ${e.title}`}>{titulo}</p>
                <p className={`text-xs mt-0.5 leading-snug ${e.text}`}>{mensaje}</p>
              </div>
            </div>
            <button
              onClick={cerrar}
              className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-0.5 bg-gray-100">
        <div
          className={`h-full ${e.bar} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Contenedor de toasts ─── */
export default function ToastNotificacion({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}

/* ─── Hook helper ─── */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const agregar = useCallback((tipo, titulo, mensaje, duracion) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, tipo, titulo, mensaje, duracion }]);
  }, []);

  const quitar = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return { toasts, agregar, quitar };
}
