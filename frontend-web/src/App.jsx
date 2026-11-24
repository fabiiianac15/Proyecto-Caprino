import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogOut,
  User,
  Activity,
  Bell,
  Droplet,
  Heart,
  Users,
  TrendingUp,
  Shield,
  LayoutGrid,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from './contextos/AuthContext';

// Importar componentes
import LoginRegistro from './componentes/LoginRegistro';
import RutaProtegida from './componentes/RutaProtegida';
import Dashboard, { MODULOS } from './componentes/Dashboard';
import ListaAnimales from './componentes/ListaAnimales';
import RegistroCabra from './componentes/RegistroCabra';
import ModuloProduccion from './componentes/ModuloProduccion';
import ModuloReproduccion from './componentes/ModuloReproduccion';
import ModuloSalud from './componentes/ModuloSalud';
import ModuloPeso from './componentes/ModuloPeso';
import ModuloGenealogia from './componentes/ModuloGenealogia';
import ModuloCorrales from './componentes/ModuloCorrales';
import ModuloBienestar from './componentes/ModuloBienestar';
import ModuloClasificacionLineal from './componentes/ModuloClasificacionLineal';
import ModuloReportes from './componentes/ModuloReportes';
import ModuloAuditoria from './componentes/ModuloAuditoria';
import Notificaciones from './componentes/Notificaciones';
import PerfilUsuario from './componentes/PerfilUsuario';
import ControlLetra from './componentes/ControlLetra';
import ExpedienteAnimal from './componentes/ExpedienteAnimal';

function App() {
  const { estaAutenticado, usuario, cerrarSesion, cargando } = useAuth();
  const navigate = useNavigate();
  const [fechaHora, setFechaHora] = useState(new Date());
  const [animalEditar, setAnimalEditar] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista');
  const [reloadKey, setReloadKey] = useState(0);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);

  // Menú de módulos de la barra superior
  const { pathname } = useLocation();
  const [menuModulos, setMenuModulos] = useState(false);
  const refMenu = useRef(null);
  const moduloActual = MODULOS.find((m) => pathname === m.ruta || pathname.startsWith(m.ruta + '/'));
  useEffect(() => {
    if (!menuModulos) return undefined;
    const fuera = (e) => { if (refMenu.current && !refMenu.current.contains(e.target)) setMenuModulos(false); };
    const tecla = (e) => { if (e.key === 'Escape') setMenuModulos(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', tecla); };
  }, [menuModulos]);
  
  // Indicadores del rebaño (se cargarán desde la API)
  const [indicadores, setIndicadores] = useState({
    totalAnimales: 0,
    alertasPendientes: 0,
    produccionHoy: 0,
    gestantes: 0
  });

  // Helpers compartidos con Notificaciones.jsx para filtrar alertas leídas
  const leerLeidas = () => { try { return new Set(JSON.parse(localStorage.getItem('notif_leidas_v1')) || []); } catch { return new Set(); } };
  const idNotif = (n) => `${n.tipo}|${n.codigoAnimal || ''}|${n.fechaAlerta || ''}|${n.titulo || ''}`;

  // Cargar indicadores del rebaño desde /api/reportes/resumen
  useEffect(() => {
    if (!estaAutenticado()) return;

    const cargarIndicadores = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const [resumen, resNotif] = await Promise.allSettled([
          fetch(`${base}/reportes/resumen`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${base}/notificaciones`,   { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        let totalAnimales = 0, produccionHoy = 0, gestantes = 0, alertasPendientes = 0;

        if (resumen.status === 'fulfilled' && resumen.value.ok) {
          const { data } = await resumen.value.json();
          totalAnimales  = data.totalAnimales         ?? 0;
          produccionHoy  = data.produccionLitrosMes   ?? 0;
          gestantes      = data.gestacionesPendientes ?? 0;
          alertasPendientes = data.alertasPendientes  ?? 0;
        }

        // Recalcular badge descontando alertas ya marcadas como leídas
        if (resNotif.status === 'fulfilled' && resNotif.value.ok) {
          const notifData = await resNotif.value.json();
          const leidas = leerLeidas();
          alertasPendientes = (notifData.data || []).filter(n => !leidas.has(idNotif(n))).length;
        }

        setIndicadores({ totalAnimales, alertasPendientes, produccionHoy, gestantes });
      } catch {
        // No interrumpir la UI si el fetch falla
      }
    };

    cargarIndicadores();
    const intervalo = setInterval(cargarIndicadores, 300000);

    // Recalcular badge inmediatamente cuando el usuario marca una alerta como leída
    window.addEventListener('notif-leidas-changed', cargarIndicadores);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('notif-leidas-changed', cargarIndicadores);
    };
  }, [usuario]);

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
    // Forzar recarga actualizando el key del componente
    setReloadKey(prev => prev + 1);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!estaAutenticado()) {
    return <LoginRegistro />;
  }

  return (
    <div className="min-h-screen relative">
      {/* Fondo fijo: la foto del rebaño bajo un velo claro */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <img src="/img/AtrasCabra.jpeg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gray-100/[0.93]" />
      </div>

      {/* Barra superior: capa flotante con desenfoque, en el verde de la marca */}
      <nav className="barra-superior vidrio-verde fixed w-full top-0 z-50 border-b border-white/10 shadow-sm" aria-label="Principal">
        <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            {/* Marca */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 rounded-xl pr-2 hover:opacity-85 transition-opacity shrink-0"
              aria-label="Capriva, ir al inicio"
            >
              <img src="/img/LogoCabra.jpg" alt="" className="w-9 h-9 rounded-[10px] object-cover ring-1 ring-white/30" />
              <span className="text-[19px] font-bold text-white tracking-tight">Capriva</span>
            </button>

            {/* Módulos: salto directo entre secciones sin volver al inicio */}
            <div className="relative" ref={refMenu}>
              <button
                type="button"
                onClick={() => setMenuModulos((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuModulos}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-white transition-colors
                            ${menuModulos ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline whitespace-nowrap truncate max-w-[11rem]">{moduloActual ? moduloActual.titulo : 'Módulos'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuModulos ? 'rotate-180' : ''}`} />
              </button>

              {menuModulos && (
                <div role="menu" className="bg-white animate-emerger absolute left-0 mt-2 w-[min(92vw,560px)] rounded-2xl shadow-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                  {MODULOS.map((m) => {
                    const activo = moduloActual?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        role="menuitem"
                        onClick={() => { setMenuModulos(false); navigate(m.ruta); }}
                        className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${activo ? 'bg-gray-900/[0.07]' : 'hover:bg-gray-900/[0.05]'}`}
                      >
                        <span className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center shrink-0`}>
                          <m.Icono className="w-[18px] h-[18px] text-white" />
                        </span>
                        <span className="text-sm font-medium text-gray-900 flex-1">{m.titulo}</span>
                        {activo && <Check className="w-4 h-4 text-green-700" aria-label="Módulo actual" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Indicadores del rebaño en tiempo real */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-white">
              {[
                { ruta: '/animales', Icono: Users, etiqueta: 'Animales', valor: indicadores.totalAnimales, titulo: 'Ver todos los animales' },
                { ruta: '/notificaciones', Icono: Bell, etiqueta: 'Alertas', valor: indicadores.alertasPendientes, titulo: 'Ver alertas', aviso: indicadores.alertasPendientes > 0 },
                { ruta: '/produccion', Icono: Droplet, etiqueta: 'Leche del mes', valor: `${Number(indicadores.produccionHoy).toFixed(1)} L`, titulo: 'Ver producción de leche' },
                { ruta: '/reproduccion', Icono: Heart, etiqueta: 'Gestantes', valor: indicadores.gestantes, titulo: 'Ver reproducción' },
              ].map((i) => (
                <button
                  key={i.ruta}
                  onClick={() => navigate(i.ruta)}
                  title={i.titulo}
                  className="relative flex items-center gap-2 h-10 pl-2.5 pr-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <i.Icono className="w-4 h-4 text-white/85" />
                  <span className="text-left leading-none">
                    <span className="block text-[10px] font-medium text-white/75 mb-0.5 whitespace-nowrap">{i.etiqueta}</span>
                    <span className="block text-sm font-bold tabular-nums whitespace-nowrap">{i.valor}</span>
                  </span>
                  {i.aviso && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-green-700" aria-hidden="true" />}
                </button>
              ))}
            </div>

            {/* Usuario, auditoría y salida */}
            <div className="flex items-center gap-1.5">
              <ControlLetra claro className="hidden sm:inline-flex mr-1 shrink-0" />
              <button
                onClick={() => setMostrarPerfil(true)}
                className="hidden md:flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Ver mi perfil"
              >
                <span className="flex items-center justify-center w-7 h-7 bg-white rounded-full">
                  <User className="w-4 h-4 text-green-700" />
                </span>
                <span className="text-left leading-none min-w-0">
                  <span className="block text-sm font-semibold text-white whitespace-nowrap truncate max-w-[9rem]">{usuario?.nombre || usuario?.nombre_completo}</span>
                  <span className="block text-[11px] text-white/75 mt-0.5 capitalize whitespace-nowrap truncate max-w-[9rem]">
                    {usuario?.rol === 'administrador' || usuario?.rol === 'administrador_granja' ? 'Administrador de granja' :
                     usuario?.rol === 'pasante'       ? 'Pasante' :
                     usuario?.rol === 'veterinario'   ? 'Veterinario' :
                     usuario?.rol === 'zootecnista'   ? 'Zootecnista' :
                     usuario?.rol || 'Usuario'}
                  </span>
                </span>
              </button>

              {usuario?.rol === 'administrador' && (
                <button
                  onClick={() => navigate('/auditoria')}
                  className="flex items-center gap-2 h-10 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                  title="Auditoría del sistema"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Auditoría</span>
                </button>
              )}

              <button
                onClick={() => {
                  cerrarSesion();
                  navigate('/login');
                }}
                className="flex items-center gap-2 h-10 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="pt-[72px] pb-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          <Route
            path="/animales"
            element={
              vistaActual === 'lista' ? (
                <ListaAnimales
                  key={reloadKey}
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
            element={<RutaProtegida><ModuloSalud /></RutaProtegida>}
          />
          
          <Route path="/notificaciones" element={<RutaProtegida><Notificaciones /></RutaProtegida>} />
          
          <Route path="/peso" element={<RutaProtegida><ModuloPeso /></RutaProtegida>} />
          
          <Route path="/genealogia" element={<RutaProtegida><ModuloGenealogia /></RutaProtegida>} />

          <Route path="/corrales" element={<RutaProtegida><ModuloCorrales /></RutaProtegida>} />

          <Route path="/bienestar" element={<RutaProtegida><ModuloBienestar /></RutaProtegida>} />

          <Route path="/clasificacion-lineal" element={<RutaProtegida><ModuloClasificacionLineal /></RutaProtegida>} />

          <Route path="/animales/:id" element={<RutaProtegida><ExpedienteAnimal /></RutaProtegida>} />
          
          <Route path="/reportes" element={<RutaProtegida><ModuloReportes /></RutaProtegida>} />

          <Route path="/auditoria" element={<RutaProtegida><ModuloAuditoria /></RutaProtegida>} />

          <Route
            path="*"
            element={
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Página no encontrada
                </h2>
                <Link
                  to="/"
                  className="text-green-700 hover:text-green-800 underline"
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
