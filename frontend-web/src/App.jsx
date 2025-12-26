import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { 
  LogOut,
  User,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { useAuth } from './contextos/AuthContext';

// Importar componentes
import LoginRegistro from './componentes/LoginRegistro';
import Dashboard from './componentes/Dashboard';
import ListaAnimales from './componentes/ListaAnimales';
import RegistroCabra from './componentes/RegistroCabra';
import RegistroProduccion from './componentes/RegistroProduccion';
import ModuloReproduccion from './componentes/ModuloReproduccion';
import Notificaciones from './componentes/Notificaciones';

function App() {
  const { estaAutenticado, usuario, cerrarSesion, cargando } = useAuth();
  const navigate = useNavigate();
  const [fechaHora, setFechaHora] = useState(new Date());
  const [animalEditar, setAnimalEditar] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFechaHora(new Date());
    }, 1000);
    
    return () => clearInterval(intervalo);
  }, []);

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatearHora = (fecha) => {
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
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
      {/* Barra de navegación superior - Rediseñada */}
      <nav className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div 
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <div className="text-3xl mr-3">🐐</div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Sistema Caprino
                </h1>
                <p className="text-xs text-green-100">
                  Gestión Integral del Rebaño
                </p>
              </div>
            </div>

            {/* Información central - Fecha y hora */}
            <div className="hidden lg:flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {formatearFecha(fechaHora)}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium font-mono">
                  {formatearHora(fechaHora)}
                </span>
              </div>
            </div>

            {/* Usuario y cerrar sesión */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {usuario?.nombre}
                  </p>
                  <p className="text-xs text-green-100 capitalize">
                    {usuario?.rol}
                  </p>
                </div>
              </div>
              
              <button
                onClick={cerrarSesion}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-white"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="pt-20 pb-8">
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
                <RegistroCabra
                  cabraEditar={animalEditar}
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
            element={<ModuloReproduccion />}
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
