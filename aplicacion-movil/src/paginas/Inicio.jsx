/**
 * Pantalla principal optimizada para teléfono:
 *  - Encabezado con saludo y logo.
 *  - Acción principal (Buscar / Escanear) destacada.
 *  - Cuadrícula 2×2 de módulos (Salud, Pesaje, Producción, Sincronización).
 */

import { useNavigate } from 'react-router-dom';
import {
  Search, Syringe, Weight, Milk, RefreshCw, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@contextos/AuthContext';
import { useSincronizacion } from '@hooks/useSincronizacion';

export default function Inicio() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { pendientes } = useSincronizacion();

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (usuario?.nombre || usuario?.nombre_completo || 'Usuario').split(' ')[0];

  const tiles = [
    { titulo: 'Salud', sub: 'Vacunas y tratamientos', ruta: '/salud', Icono: Syringe, color: 'bg-blue-500', grad: 'from-blue-50 to-cyan-50' },
    { titulo: 'Pesaje', sub: 'Peso y condición', ruta: '/pesaje', Icono: Weight, color: 'bg-violet-500', grad: 'from-violet-50 to-purple-50' },
    { titulo: 'Producción', sub: 'Litros de leche', ruta: '/produccion', Icono: Milk, color: 'bg-amber-500', grad: 'from-amber-50 to-yellow-50' },
    { titulo: 'Sincronizar', sub: pendientes > 0 ? `${pendientes} pendiente(s)` : 'Todo al día', ruta: '/sincronizacion', Icono: RefreshCw, color: 'bg-emerald-500', grad: 'from-emerald-50 to-green-50', badge: pendientes },
  ];

  return (
    <div className="px-5 py-6 space-y-6 max-w-md mx-auto">
      {/* Encabezado */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/img/LogoCabra.jpg"
            alt=""
            className="w-12 h-12 rounded-full object-cover ring-2 ring-green-200"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <p className="text-sm text-gray-500">{saludo},</p>
            <h1 className="text-xl font-bold leading-tight text-gray-800">{nombre}</h1>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-500 active:text-gray-700 px-2 py-1"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      {/* Acción principal: Buscar / Escanear */}
      <button
        onClick={() => navigate('/buscar')}
        className="w-full text-left rounded-2xl p-5 bg-gradient-to-br from-green-600 to-emerald-500
                   text-white shadow-md flex items-center gap-4 active:scale-[0.98] transition-transform"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Search className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">Buscar / Escanear</h2>
          <p className="text-green-50 text-sm">Encuentra un animal por chapeta o QR</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/70 shrink-0" />
      </button>

      {/* Cuadrícula de módulos */}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3 px-1">Registrar en campo</p>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => {
            const { Icono } = t;
            return (
              <button
                key={t.ruta}
                onClick={() => navigate(t.ruta)}
                className={`relative bg-gradient-to-br ${t.grad} rounded-2xl border border-white
                            shadow-sm p-4 flex flex-col gap-3 min-h-[120px] text-left
                            active:scale-[0.97] transition-transform`}
              >
                <div className={`w-12 h-12 ${t.color} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icono className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{t.titulo}</h3>
                  <p className="text-xs text-gray-500 leading-snug">{t.sub}</p>
                </div>
                {t.badge > 0 && (
                  <span className="absolute top-3 right-3 min-w-[22px] h-[22px] px-1 rounded-full
                                   bg-red-600 text-white text-xs font-bold flex items-center
                                   justify-center ring-2 ring-white">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs pt-2">
        Sistema de Gestión Caprina · UFPSO
      </p>
    </div>
  );
}
