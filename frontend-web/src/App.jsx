import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Droplet, 
  Heart, 
  Activity, 
  Bell,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from './contextos/AuthContext';

// Importar componentes
import LoginRegistro from './componentes/LoginRegistro';
import Dashboard from './componentes/Dashboard';
import ListaAnimales from './componentes/ListaAnimales';
import RegistroAnimal from './componentes/RegistroAnimal';
import RegistroProduccion from './componentes/RegistroProduccion';
import RegistroReproduccion from './componentes/RegistroReproduccion';
import Notificaciones from './componentes/Notificaciones';

function App() {
  const { estaAutenticado, usuario, cerrarSesion, cargando } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [animalEditar, setAnimalEditar] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');
  const location = useLocation();

  const navegacion = [
    { nombre: 'Dashboard', ruta: '/', icono: Home },
    { nombre: 'Animales', ruta: '/animales', icono: Users },
    { nombre: 'Producción', ruta: '/produccion', icono: Droplet },
    { nombre: 'Reproducción', ruta: '/reproduccion', icono: Heart },
    { nombre: 'Salud', ruta: '/salud', icono: Activity },
    { nombre: 'Notificaciones', ruta: '/notificaciones', icono: Bell },
  ];

  const estaActivo = (ruta) => {
    return location.pathname === ruta;
  };

  const manejarNuevoAnimal = () => {
    setAnimalEditar(null);
    setVistaActual('registro');
  };

  const manejarEditarAnimal = (animal) => {
    setAnimalEditar(animal);
    setVistaActual('registro');
  };

  const manejarGuardarAnimal = () => {
    setVistaActual('lista');
    setAnimalEditar(null);
  };

  const manejarCancelar = () => {
    setVistaActual('lista');
    setAnimalEditar(null);
  };

  // Mostrar loading mientras verifica autenticación
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!estaAutenticado) {
    return <LoginRegistro />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegación superior */}
      <nav className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                🐐 Sistema Caprino
              </h1>
            </div>

            {/* Menú desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 mr-2">
                {usuario?.nombre}
              </span>
              {navegacion.map((item) => {
                const Icono = item.icono;
                return (
                  <Link
                    key={item.ruta}
                    to={item.ruta}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      estaActivo(item.ruta)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icono className="w-4 h-4 mr-2" />
                    {item.nombre}
                  </Link>
                );
              })}
              <button
                onClick={cerrarSesion}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </button>
            </div>

            {/* Botón menú móvil */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {menuAbierto ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {menuAbierto && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navegacion.map((item) => {
                const Icono = item.icono;
                return (
                  <Link
                    key={item.ruta}
                    to={item.ruta}
                    onClick={() => setMenuAbierto(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      estaActivo(item.ruta)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icono className="w-5 h-5 mr-3" />
                    {item.nombre}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMenuAbierto(false);
                  cerrarSesion();
                }}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Contenido principal */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          <Route
            path="/animales"
            element={
              vistaActual === 'lista' ? (
                <ListaAnimales
                  onEditar={manejarEditarAnimal}
                  onNuevo={manejarNuevoAnimal}
                />
              ) : (
                <RegistroAnimal
                  animalEditar={animalEditar}
                  onGuardar={manejarGuardarAnimal}
                  onCancelar={manejarCancelar}
                />
              )
            }
          />
          
          <Route
            path="/produccion"
            element={
              <RegistroProduccion
                onGuardar={() => {}}
                onCancelar={() => {}}
              />
            }
          />
          
          <Route
            path="/reproduccion"
            element={
              <RegistroReproduccion
                onGuardar={() => {}}
                onCancelar={() => {}}
              />
            }
          />
          
          <Route
            path="/salud"
            element={
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Módulo de Salud
                </h2>
                <p className="text-gray-600">
                  En desarrollo. Próximamente podrás registrar vacunaciones,
                  enfermedades y tratamientos.
                </p>
              </div>
            }
          />
          
          <Route path="/notificaciones" element={<Notificaciones />} />
          
          <Route
            path="*"
            element={
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Página no encontrada
                </h2>
                <Link
                  to="/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
