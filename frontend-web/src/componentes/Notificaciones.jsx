/**
 * Módulo Completo de Notificaciones y Alertas
 * Sistema inteligente de notificaciones para gestión proactiva del rebaño
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Syringe, 
  Clock,
  Heart,
  Activity,
  Droplet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Filter,
  TrendingUp,
  Thermometer,
  Baby,
  Pill,
  FileText,
  ChevronRight
} from 'lucide-react';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [notificacionDetalle, setNotificacionDetalle] = useState(null);

  // Categorías de notificaciones
  const categorias = [
    { id: 'todas', nombre: 'Todas', icono: Bell, color: 'gray' },
    { id: 'reproduccion', nombre: 'Reproducción', icono: Heart, color: 'pink' },
    { id: 'salud', nombre: 'Salud', icono: Activity, color: 'red' },
    { id: 'produccion', nombre: 'Producción', icono: Droplet, color: 'cyan' },
    { id: 'criticas', nombre: 'Críticas', icono: AlertTriangle, color: 'orange' }
  ];

  // Obtener color según prioridad
  const obtenerColorPrioridad = (prioridad) => {
    const colores = {
      critica: 'bg-red-100 border-red-500 text-red-900',
      alta: 'bg-orange-100 border-orange-500 text-orange-900',
      media: 'bg-yellow-100 border-yellow-500 text-yellow-900',
      baja: 'bg-blue-100 border-blue-500 text-blue-900',
      info: 'bg-gray-100 border-gray-500 text-gray-900'
    };
    return colores[prioridad] || colores.info;
  };

  // Obtener icono según tipo de notificación
  const obtenerIconoNotificacion = (tipo) => {
    const iconos = {
      parto_proximo: Calendar,
      parto_atrasado: AlertTriangle,
      diagnostico_pendiente: Clock,
      vacuna_proxima: Syringe,
      vacuna_vencida: AlertCircle,
      tratamiento_finaliza: Pill,
      enfermedad_contagiosa: AlertTriangle,
      produccion_baja: TrendingUp,
      calidad_leche: Thermometer,
      peso_bajo: Activity,
      revision_sanitaria: FileText,
      cria_nacida: Baby
    };
    return iconos[tipo] || Bell;
  };

  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones.filter(notif => {
    const cumpleCategoria = filtroCategoria === 'todas' || notif.categoria === filtroCategoria;
    const cumplePrioridad = filtroPrioridad === 'todas' || notif.prioridad === filtroPrioridad;
    return cumpleCategoria && cumplePrioridad;
  });

  // Contar por prioridad
  const contadores = {
    total: notificaciones.length,
    critica: notificaciones.filter(n => n.prioridad === 'critica').length,
    alta: notificaciones.filter(n => n.prioridad === 'alta').length,
    media: notificaciones.filter(n => n.prioridad === 'media').length,
    baja: notificaciones.filter(n => n.prioridad === 'baja').length
  };

  // Marcar como leída
  const marcarComoLeida = (id) => {
    console.log('Marcar como leída:', id);
    // TODO: Llamada a API
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = () => {
    console.log('Marcar todas como leídas');
    // TODO: Llamada a API
  };

  if (notificacionDetalle) {
    return (
      <DetalleNotificacion
        notificacion={notificacionDetalle}
        onCerrar={() => setNotificacionDetalle(null)}
        onMarcarLeida={marcarComoLeida}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <Bell className="w-8 h-8 mr-3 text-blue-600" />
              Notificaciones y Alertas
            </h2>
            <p className="text-gray-600 mt-1">
              Sistema de alertas inteligentes para gestión proactiva del rebaño
            </p>
          </div>
          
          <button
            onClick={marcarTodasLeidas}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar Todas Leídas
          </button>
        </div>

        {/* Contadores de prioridad */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-l-4 border-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-800">{contadores.total}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Críticas</p>
                <p className="text-3xl font-bold text-red-700">{contadores.critica}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Alta</p>
                <p className="text-3xl font-bold text-orange-700">{contadores.alta}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Media</p>
                <p className="text-3xl font-bold text-yellow-700">{contadores.media}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Baja</p>
                <p className="text-3xl font-bold text-blue-700">{contadores.baja}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          {/* Filtro por categoría */}
          <div className="flex gap-2">
            {categorias.map(cat => {
              const IconoCat = cat.icono;
              const isActive = filtroCategoria === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFiltroCategoria(cat.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    isActive
                      ? `bg-${cat.color}-600 text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconoCat className="w-4 h-4 mr-1" />
                  {cat.nombre}
                </button>
              );
            })}
          </div>

          {/* Filtro por prioridad */}
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas las prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {notificacionesFiltradas.map((notificacion) => {
          const IconoNotif = obtenerIconoNotificacion(notificacion.tipo);
          const colorPrioridad = obtenerColorPrioridad(notificacion.prioridad);

          return (
            <div
              key={notificacion.id}
              className={`bg-white rounded-lg shadow-md border-l-4 p-4 hover:shadow-lg transition-shadow ${colorPrioridad}`}
            >
              <div className="flex items-start gap-4">
                {/* Icono */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  notificacion.prioridad === 'critica' ? 'bg-red-200' :
                  notificacion.prioridad === 'alta' ? 'bg-orange-200' :
                  notificacion.prioridad === 'media' ? 'bg-yellow-200' :
                  'bg-blue-200'
                }`}>
                  <IconoNotif className="w-6 h-6" />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {notificacion.titulo}
                      </h3>
                      <p className="text-gray-700 mt-1">
                        {notificacion.mensaje}
                      </p>
                      
                      {/* Información adicional */}
                      {notificacion.animal && (
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="font-medium text-gray-600">
                            Animal: <span className="text-gray-800">{notificacion.animal}</span>
                          </span>
                          {notificacion.fecha && (
                            <span className="text-gray-600">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {notificacion.fecha}
                            </span>
                          )}
                          {notificacion.diasRestantes !== undefined && (
                            <span className={`font-medium ${
                              notificacion.diasRestantes < 0 ? 'text-red-600' :
                              notificacion.diasRestantes <= 3 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {notificacion.diasRestantes < 0 
                                ? `Atrasado ${Math.abs(notificacion.diasRestantes)} días`
                                : notificacion.diasRestantes === 0
                                ? 'Hoy'
                                : `Faltan ${notificacion.diasRestantes} días`
                              }
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Badges y acciones */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        notificacion.prioridad === 'critica' ? 'bg-red-600 text-white' :
                        notificacion.prioridad === 'alta' ? 'bg-orange-600 text-white' :
                        notificacion.prioridad === 'media' ? 'bg-yellow-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {notificacion.prioridad}
                      </span>
                      
                      <button
                        onClick={() => setNotificacionDetalle(notificacion)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje cuando no hay notificaciones */}
      {notificacionesFiltradas.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {filtroCategoria !== 'todas' || filtroPrioridad !== 'todas'
              ? 'No hay notificaciones que coincidan con los filtros seleccionados'
              : 'No hay notificaciones pendientes'
            }
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Detalle de Notificación
 */
const DetalleNotificacion = ({ notificacion, onCerrar, onMarcarLeida }) => {
  const IconoNotif = {
    parto_proximo: Calendar,
    parto_atrasado: AlertTriangle,
    diagnostico_pendiente: Clock,
    vacuna_proxima: Syringe,
    vacuna_vencida: AlertCircle,
    tratamiento_finaliza: Pill,
    enfermedad_contagiosa: AlertTriangle,
    produccion_baja: TrendingUp,
    calidad_leche: Thermometer,
    peso_bajo: Activity,
    revision_sanitaria: FileText,
    cria_nacida: Baby
  }[notificacion.tipo] || Bell;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          notificacion.prioridad === 'critica' ? 'bg-red-50 border-red-200' :
          notificacion.prioridad === 'alta' ? 'bg-orange-50 border-orange-200' :
          notificacion.prioridad === 'media' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconoNotif className={`w-8 h-8 mr-3 ${
                notificacion.prioridad === 'critica' ? 'text-red-600' :
                notificacion.prioridad === 'alta' ? 'text-orange-600' :
                notificacion.prioridad === 'media' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{notificacion.titulo}</h2>
                <p className="text-sm text-gray-600 mt-1">{notificacion.categoria}</p>
              </div>
            </div>
            <button onClick={onCerrar} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Mensaje principal */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Descripción</h3>
              <p className="text-gray-700 leading-relaxed">{notificacion.mensaje}</p>
            </div>

            {/* Información del animal */}
            {notificacion.animal && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Información del Animal</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Código:</span>
                    <span className="ml-2 text-gray-800">{notificacion.animal}</span>
                  </div>
                  {notificacion.nombreAnimal && (
                    <div>
                      <span className="font-medium text-gray-600">Nombre:</span>
                      <span className="ml-2 text-gray-800">{notificacion.nombreAnimal}</span>
                    </div>
                  )}
                  {notificacion.raza && (
                    <div>
                      <span className="font-medium text-gray-600">Raza:</span>
                      <span className="ml-2 text-gray-800">{notificacion.raza}</span>
                    </div>
                  )}
                  {notificacion.edad && (
                    <div>
                      <span className="font-medium text-gray-600">Edad:</span>
                      <span className="ml-2 text-gray-800">{notificacion.edad}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fechas y plazos */}
            {(notificacion.fecha || notificacion.diasRestantes !== undefined) && (
              <div className={`rounded-lg p-4 border-2 ${
                notificacion.diasRestantes < 0 ? 'bg-red-50 border-red-300' :
                notificacion.diasRestantes <= 3 ? 'bg-orange-50 border-orange-300' :
                'bg-green-50 border-green-300'
              }`}>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Fecha y Plazo</h3>
                <div className="grid grid-cols-2 gap-4">
                  {notificacion.fecha && (
                    <div>
                      <span className="font-medium text-gray-700">Fecha programada:</span>
                      <p className="text-lg font-bold text-gray-800 mt-1">
                        <Calendar className="w-5 h-5 inline mr-2" />
                        {notificacion.fecha}
                      </p>
                    </div>
                  )}
                  {notificacion.diasRestantes !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Estado:</span>
                      <p className={`text-lg font-bold mt-1 ${
                        notificacion.diasRestantes < 0 ? 'text-red-700' :
                        notificacion.diasRestantes <= 3 ? 'text-orange-700' :
                        'text-green-700'
                      }`}>
                        {notificacion.diasRestantes < 0 
                          ? `⚠️ Atrasado ${Math.abs(notificacion.diasRestantes)} días`
                          : notificacion.diasRestantes === 0
                          ? '🔔 Hoy'
                          : `✓ Faltan ${notificacion.diasRestantes} días`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detalles adicionales */}
            {notificacion.detalles && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Detalles Adicionales</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {Object.entries(notificacion.detalles).map(([key, value]) => (
                      <li key={key} className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium">{key}:</span>
                        <span className="ml-2">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {notificacion.recomendaciones && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                  Recomendaciones
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {notificacion.recomendaciones.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            notificacion.prioridad === 'critica' ? 'bg-red-600 text-white' :
            notificacion.prioridad === 'alta' ? 'bg-orange-600 text-white' :
            notificacion.prioridad === 'media' ? 'bg-yellow-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            Prioridad: {notificacion.prioridad}
          </span>

          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onMarcarLeida(notificacion.id);
                onCerrar();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como Leída
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
