/**
 * Rutas de la app. Las cuatro pestañas son las secciones raíz; los
 * formularios y editores se abren encima y ocultan las pestañas para dejar
 * toda la pantalla a la tarea.
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@contextos/AuthContext';
import Pestanas, { ALTO_PESTANAS } from '@/ui/Pestanas';
import { refrescarCatalogos } from '@servicios/catalogos';
import { useConectividad } from '@hooks/useConectividad';

import Login from '@paginas/Login';
import Inicio from '@paginas/Inicio';
import Rebano from '@paginas/Rebano';
import Animal from '@paginas/Animal';
import Registrar from '@paginas/Registrar';
import Evaluar from '@paginas/Evaluar';
import BienestarEditor from '@paginas/BienestarEditor';
import BienestarIndicador from '@paginas/BienestarIndicador';
import LinealEditor from '@paginas/LinealEditor';
import Ajustes from '@paginas/Ajustes';
import Pendientes from '@paginas/Pendientes';

const RAICES = ['/', '/rebano', '/evaluar', '/ajustes'];

export default function App() {
  const { autenticado } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const enLinea = useConectividad();

  // Botón atrás de Android: retrocede; en una pestaña raíz sale de la app.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let manejador;
    import('@capacitor/app').then(({ App: Nativa }) => {
      Nativa.addListener('backButton', () => {
        if (!window.dispatchEvent(new Event('boton-atras', { cancelable: true }))) return;   // la pantalla lo atendió
        if (RAICES.includes(window.location.pathname) || window.location.pathname === '/login') Nativa.exitApp();
        else navigate(-1);
      }).then((h) => { manejador = h; });
    });
    return () => manejador?.remove?.();
  }, [navigate]);

  // Con sesión y red: dejar los catálogos listos para trabajar sin señal.
  useEffect(() => {
    if (autenticado && enLinea) refrescarCatalogos();
  }, [autenticado, enLinea]);

  if (!autenticado) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const conPestanas = RAICES.includes(pathname) || pathname.startsWith('/animal/');

  return (
    <div className="min-h-screen max-w-md mx-auto">
      <div style={{ paddingBottom: conPestanas ? `calc(${ALTO_PESTANAS + 24}px + env(safe-area-inset-bottom))` : '32px' }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/rebano" element={<Rebano />} />
          <Route path="/animal/:id" element={<Animal />} />
          <Route path="/registrar/:tipo" element={<Registrar />} />
          <Route path="/evaluar" element={<Evaluar />} />
          <Route path="/bienestar/:id" element={<BienestarEditor />} />
          <Route path="/bienestar/:id/indicador/:idIndicador" element={<BienestarIndicador />} />
          <Route path="/lineal/:id" element={<LinealEditor />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/ajustes/pendientes" element={<Pendientes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {conPestanas && <Pestanas />}
    </div>
  );
}
