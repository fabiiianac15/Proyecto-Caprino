import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { 
  LogOut,
  User,
  Activity,
  Bell,
  Droplet,
  Heart,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAuth } from './contextos/AuthContext';

// Importar componentes
import LoginRegistro from './componentes/LoginRegistro';
import Dashboard from './componentes/Dashboard';
import ListaAnimales from './componentes/ListaAnimales';
import RegistroCabra from './componentes/RegistroCabra';
import ModuloProduccion from './componentes/ModuloProduccion';
import ModuloReproduccion from './componentes/ModuloReproduccion';
import ModuloSalud from './componentes/ModuloSalud';
import ModuloPeso from './componentes/ModuloPeso';
import ModuloGenealogia from './componentes/ModuloGenealogia';
import ModuloReportes from './componentes/ModuloReportes';
import Notificaciones from './componentes/Notificaciones';
import PerfilUsuario from './componentes/PerfilUsuario';

function App() {
  const { estaAutenticado, usuario, cerrarSesion, cargando } = useAuth();
  const navigate = useNavigate();
  const [fechaHora, setFechaHora] = useState(new Date());
  const [animalEditar, setAnimalEditar] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  
  // Indicadores del rebaño (se cargarán desde la API)
  const [indicadores, setIndicadores] = useState({
    totalAnimales: 0,
    alertasPendientes: 0,
    produccionHoy: 0,
    gestantes: 0
  });

  // Cargar indicadores del rebaño
  useEffect(() => {
    // TODO: Reemplazar con llamada real a la API
    const cargarIndicadores = async () => {
      // Simulación de datos - reemplazar con fetch real
      setIndicadores({
        totalAnimales: 0,
        alertasPendientes: 0,
        produccionHoy: 0,
        gestantes: 0
      });
    };
    
    cargarIndicadores();
    // Actualizar cada 5 minutos
    const intervalo = setInterval(cargarIndicadores, 300000);
    return () => clearInterval(intervalo);
  }, []);

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
              <img 
                src="/img/LogoCabra.jpg" 
                alt="Logo Caprino" 
                className="w-12 h-12 mr-3 rounded-full object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Sistema Caprino
                </h1>
                <p className="text-xs text-green-100">
                  Gestión Integral del Rebaño
                </p>
              </div>
            </div>

            {/* Indicadores en tiempo real del rebaño */}
            <div className="hidden lg:flex items-center space-x-3 text-white">
              {/* Total de Animales */}
              <button
                onClick={() => navigate('/animales')}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/20 transition-all cursor-pointer group"
                title="Ver todos los animales"
              >
                <Users className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-xs text-green-200">Animales</p>
                  <p className="text-lg font-bold leading-none">{indicadores.totalAnimales}</p>
                </div>
              </button>

              {/* Alertas Pendientes */}
              <button
                onClick={() => navigate('/notificaciones')}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/20 transition-all cursor-pointer group relative"
                title="Ver notificaciones"
              >
                <Bell className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-xs text-green-200">Alertas</p>
                  <p className="text-lg font-bold leading-none">{indicadores.alertasPendientes}</p>
                </div>
                {indicadores.alertasPendientes > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {indicadores.alertasPendientes > 9 ? '9+' : indicadores.alertasPendientes}
                  </span>
                )}
              </button>

              {/* Producción del Día */}
              <button
                onClick={() => navigate('/produccion')}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/20 transition-all cursor-pointer group"
                title="Ver producción de leche"
              >
                <Droplet className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-xs text-green-200">Producción</p>
                  <p className="text-lg font-bold leading-none">{indicadores.produccionHoy} L</p>
                </div>
              </button>

              {/* Animales Gestantes */}
              <button
                onClick={() => navigate('/reproduccion')}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/20 transition-all cursor-pointer group"
                title="Ver reproducción"
              >
                <Heart className="w-5 h-5 text-pink-300 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-xs text-green-200">Gestantes</p>
                  <p className="text-lg font-bold leading-none">{indicadores.gestantes}</p>
                </div>
              </button>
            </div>

            {/* Usuario y cerrar sesión */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMostrarPerfil(true)}
                className="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
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
              </button>
              
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
            element={<ModuloProduccion />}
          />
          
          <Route
            path="/reproduccion"
            element={<ModuloReproduccion />}
          />
          
          <Route
            path="/salud"
            element={<ModuloSalud />}
          />
          
          <Route path="/notificaciones" element={<Notificaciones />} />
          
          <Route path="/peso" element={<ModuloPeso />} />
          
          <Route path="/genealogia" element={<ModuloGenealogia />} />
          
          <Route path="/reportes" element={<ModuloReportes />} />
          
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

      {/* Modal de Perfil */}
      {mostrarPerfil && (
        <PerfilUsuario onCerrar={() => setMostrarPerfil(false)} />
      )}
    </div>
  );
}

export default App;
