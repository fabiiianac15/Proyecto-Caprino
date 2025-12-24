import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Heart, 
  Milk, 
  Activity,
  AlertCircle 
} from 'lucide-react';

/**
 * Componente Dashboard Principal
 * 
 * Muestra resumen general del sistema con KPIs y alertas
 */
const Dashboard = () => {
  const [estadisticas, setEstadisticas] = React.useState(null);
  const [notificaciones, setNotificaciones] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas y notificaciones en paralelo
      const [statsResponse, notifsResponse] = await Promise.all([
        fetch('/api/animals/estadisticas'),
        fetch('/api/notificaciones/contadores')
      ]);

      const stats = await statsResponse.json();
      const notifs = await notifsResponse.json();

      setEstadisticas(stats.data);
      setNotificaciones(notifs.data);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const TarjetaKPI = ({ titulo, valor, icono: Icono, color, tendencia, subtexto }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icono className="w-6 h-6 text-white" />
        </div>
        {tendencia && (
          <div className={`text-sm font-semibold ${
            tendencia > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {tendencia > 0 ? '↑' : '↓'} {Math.abs(tendencia)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{titulo}</h3>
      <p className="text-3xl font-bold text-gray-800 mb-2">{valor}</p>
      {subtexto && <p className="text-sm text-gray-500">{subtexto}</p>}
    </div>
  );

  const AlertaResumen = ({ tipo, cantidad, color }) => {
    if (!cantidad || cantidad === 0) return null;
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg ${color} mb-2`}>
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">{tipo}</span>
        </div>
        <span className="font-bold text-lg">{cantidad}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema de Gestión Caprina
          </h1>
          <p className="text-gray-600">
            Panel de control y monitoreo del rebaño
          </p>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <TarjetaKPI
            titulo="Total Animales"
            valor={estadisticas?.total_animales || 0}
            icono={Users}
            color="bg-blue-500"
            subtexto={`${estadisticas?.activos || 0} activos`}
          />
          <TarjetaKPI
            titulo="Producción Diaria"
            valor={`${estadisticas?.produccion_diaria || 0}L`}
            icono={Milk}
            color="bg-green-500"
            tendencia={5.2}
            subtexto="Promedio últimos 7 días"
          />
          <TarjetaKPI
            titulo="Hembras Gestantes"
            valor={estadisticas?.gestantes || 0}
            icono={Heart}
            color="bg-pink-500"
            subtexto={`${estadisticas?.partos_proximos || 0} partos próximos`}
          />
          <TarjetaKPI
            titulo="Tasa Natalidad"
            valor={`${estadisticas?.tasa_natalidad || 0}%`}
            icono={TrendingUp}
            color="bg-purple-500"
            subtexto="Últimos 12 meses"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alertas y Notificaciones */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Alertas</h2>
                {notificaciones?.total > 0 && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {notificaciones.total}
                  </span>
                )}
              </div>

              {notificaciones && notificaciones.total > 0 ? (
                <>
                  <AlertaResumen
                    tipo="Alta Prioridad"
                    cantidad={notificaciones.alta}
                    color="bg-red-100 text-red-800"
                  />
                  <AlertaResumen
                    tipo="Media Prioridad"
                    cantidad={notificaciones.media}
                    color="bg-yellow-100 text-yellow-800"
                  />
                  <AlertaResumen
                    tipo="Baja Prioridad"
                    cantidad={notificaciones.baja}
                    color="bg-blue-100 text-blue-800"
                  />
                  <button
                    onClick={() => window.location.href = '/notificaciones'}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Ver Todas las Notificaciones
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Distribución del Rebaño */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Distribución del Rebaño
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Machos</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {estadisticas?.machos || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {estadisticas?.machos_reproductores || 0} reproductores
                  </p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <p className="text-sm text-gray-600">Hembras</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {estadisticas?.hembras || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {estadisticas?.hembras_reproductoras || 0} en reproducción
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Adultos</span>
                  <span className="font-bold text-gray-800">
                    {estadisticas?.adultos || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Jóvenes</span>
                  <span className="font-bold text-gray-800">
                    {estadisticas?.jovenes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Cabritos</span>
                  <span className="font-bold text-gray-800">
                    {estadisticas?.cabritos || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Registrar Animal
              </span>
            </button>
            <button className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <Milk className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Registrar Ordeño
              </span>
            </button>
            <button className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
              <span className="text-sm font-medium text-gray-700">
                Registrar Servicio
              </span>
            </button>
            <button className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                Evento Sanitario
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
