/**
 * Rutas de la app móvil + banner de estado de conexión + barra inferior.
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contextos/AuthContext';
import RutaProtegida from '@componentes/RutaProtegida';
import BannerEstado from '@componentes/comunes/BannerEstado';
import BarraInferior from '@componentes/comunes/BarraInferior';

import Login from '@paginas/Login';
import Inicio from '@paginas/Inicio';
import BuscarAnimal from '@paginas/BuscarAnimal';
import VerAnimal from '@paginas/VerAnimal';
import RegistrarSalud from '@paginas/RegistrarSalud';
import RegistrarPesaje from '@paginas/RegistrarPesaje';
import RegistrarProduccion from '@paginas/RegistrarProduccion';
import Sincronizacion from '@paginas/Sincronizacion';

export default function App() {
  const { autenticado } = useAuth();
  const location = useLocation();

  // La barra inferior solo aparece con sesión y fuera del login.
  const mostrarBarra = autenticado && location.pathname !== '/login';

  return (
    <div className="min-h-screen">
      {autenticado && <BannerEstado />}

      {/* Padding inferior para que la barra fija no tape el contenido */}
      <div className={mostrarBarra ? 'pb-20' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RutaProtegida>
                <Inicio />
              </RutaProtegida>
            }
          />
          <Route
            path="/buscar"
            element={
              <RutaProtegida>
                <BuscarAnimal />
              </RutaProtegida>
            }
          />
          <Route
            path="/animal/:id"
            element={
              <RutaProtegida>
                <VerAnimal />
              </RutaProtegida>
            }
          />
          <Route
            path="/salud"
            element={
              <RutaProtegida>
                <RegistrarSalud />
              </RutaProtegida>
            }
          />
          <Route
            path="/pesaje"
            element={
              <RutaProtegida>
                <RegistrarPesaje />
              </RutaProtegida>
            }
          />
          <Route
            path="/produccion"
            element={
              <RutaProtegida>
                <RegistrarProduccion />
              </RutaProtegida>
            }
          />
          <Route
            path="/sincronizacion"
            element={
              <RutaProtegida>
                <Sincronizacion />
              </RutaProtegida>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {mostrarBarra && <BarraInferior />}
    </div>
  );
}
