import React from 'react';
import { Bell, AlertTriangle, Calendar, Syringe, Clock } from 'lucide-react';

/**
 * Componente de Notificaciones
 * 
 * Muestra alertas y notificaciones importantes del sistema
 */
const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mostrarSoloUrgentes, setMostrarSoloUrgentes] = React.useState(false);

  React.useEffect(() => {
    cargarNotificaciones();
  }, [mostrarSoloUrgentes]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const endpoint = mostrarSoloUrgentes 
        ? '/api/notificaciones/urgentes'
        : '/api/notificaciones';
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      setNotificaciones(data.data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconoPorTipo = (tipo) => {
    switch (tipo) {
      case 'parto_proximo':
        return <Calendar className="w-5 h-5" />;
      case 'diagnostico_pendiente':
        return <Clock className="w-5 h-5" />;
      case 'vacunacion':
        return <Syringe className="w-5 h-5" />;
      case 'seguimiento_sanitario':
        return <AlertTriangle className="w-5 h-5" />;
      case 'retiro':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'media':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'baja':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const renderNotificacion = (notificacion, index) => {
    const colorClass = getColorPrioridad(notificacion.prioridad);
    
    return (
      <div 
        key={index} 
        className={`p-4 border-l-4 rounded-lg mb-3 ${colorClass}`}
      >
        <div className="flex items-start">
          <div className="mr-3 mt-1">
            {getIconoPorTipo(notificacion.tipo)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">
                  {notificacion.identificacion} - {notificacion.nombre}
                </h4>
                <p className="text-sm mt-1">{notificacion.mensaje}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white">
                {notificacion.prioridad?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoria = (titulo, alertas) => {
    if (!alertas || alertas.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          {titulo}
          <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
            {alertas.length}
          </span>
        </h3>
        {alertas.map((alerta, index) => renderNotificacion(alerta, index))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Notificaciones y Alertas</h2>
          <button
            onClick={() => setMostrarSoloUrgentes(!mostrarSoloUrgentes)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mostrarSoloUrgentes
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {mostrarSoloUrgentes ? 'Ver Todas' : 'Solo Urgentes'}
          </button>
        </div>

        {notificaciones?.contadores && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-800">
                {notificaciones.contadores.total}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
              <div className="text-sm text-gray-600">Alta Prioridad</div>
              <div className="text-2xl font-bold text-red-600">
                {notificaciones.contadores.alta}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
              <div className="text-sm text-gray-600">Media Prioridad</div>
              <div className="text-2xl font-bold text-yellow-600">
                {notificaciones.contadores.media}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
              <div className="text-sm text-gray-600">Baja Prioridad</div>
              <div className="text-2xl font-bold text-blue-600">
                {notificaciones.contadores.baja}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {mostrarSoloUrgentes ? (
          <>
            <h3 className="text-xl font-semibold mb-4 text-red-600">
              Notificaciones Urgentes
            </h3>
            {notificaciones && notificaciones.length > 0 ? (
              notificaciones.map((notif, index) => renderNotificacion(notif, index))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay notificaciones urgentes en este momento
              </p>
            )}
          </>
        ) : (
          <>
            {renderCategoria('Partos Próximos', notificaciones?.partos_proximos)}
            {renderCategoria('Diagnósticos Pendientes', notificaciones?.diagnosticos_pendientes)}
            {renderCategoria('Vacunaciones', notificaciones?.vacunaciones_proximas)}
            {renderCategoria('Seguimiento Sanitario', notificaciones?.seguimiento_sanitario)}
            {renderCategoria('Animales en Retiro', notificaciones?.animales_en_retiro)}
            
            {(!notificaciones || Object.keys(notificaciones).length === 0) && (
              <p className="text-gray-500 text-center py-8">
                No hay notificaciones pendientes
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
