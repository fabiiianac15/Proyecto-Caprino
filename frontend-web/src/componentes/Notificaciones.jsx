import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, Calendar, Syringe, Clock,
  Heart, Activity, Droplet, AlertCircle, CheckCircle,
  XCircle, Eye, X, Filter, TrendingUp, Thermometer,
  Baby, Pill, FileText, ChevronRight, RefreshCw
} from 'lucide-react';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [notificacionDetalle, setNotificacionDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);

  const categorias = [
    { id: 'todas', nombre: 'Todas', icono: Bell },
    { id: 'reproduccion', nombre: 'Reproducción', icono: Heart },
    { id: 'salud', nombre: 'Salud', icono: Activity },
    { id: 'produccion', nombre: 'Producción', icono: Droplet },
    { id: 'criticas', nombre: 'Críticas', icono: AlertTriangle },
  ];

  const colorPrioridad = (p) => ({
    critica: { card: 'border-l-red-500 bg-red-50/30', badge: 'bg-red-600 text-white', icon: 'bg-red-100 text-red-600' },
    alta: { card: 'border-l-orange-500 bg-orange-50/30', badge: 'bg-orange-600 text-white', icon: 'bg-orange-100 text-orange-600' },
    media: { card: 'border-l-amber-500 bg-amber-50/30', badge: 'bg-amber-500 text-white', icon: 'bg-amber-100 text-amber-600' },
    baja: { card: 'border-l-blue-500 bg-blue-50/30', badge: 'bg-blue-600 text-white', icon: 'bg-blue-100 text-blue-600' },
    info: { card: 'border-l-gray-400 bg-gray-50/30', badge: 'bg-gray-500 text-white', icon: 'bg-gray-100 text-gray-600' },
  })[p] || { card: 'border-l-gray-400', badge: 'bg-gray-500 text-white', icon: 'bg-gray-100 text-gray-600' };

  const iconoTipo = (tipo) => ({
    parto_proximo: Calendar, parto_atrasado: AlertTriangle, diagnostico_pendiente: Clock,
    vacuna_proxima: Syringe, vacuna_vencida: AlertCircle, tratamiento_finaliza: Pill,
    enfermedad_contagiosa: AlertTriangle, produccion_baja: TrendingUp, calidad_leche: Thermometer,
    peso_bajo: Activity, revision_sanitaria: FileText, cria_nacida: Baby,
  })[tipo] || Bell;

  const notificacionesFiltradas = notificaciones.filter(n => {
    const cat = filtroCategoria === 'todas' || n.categoria === filtroCategoria;
    const pri = filtroPrioridad === 'todas' || n.prioridad === filtroPrioridad;
    return cat && pri;
  });

  const contadores = {
    total: notificaciones.length,
    critica: notificaciones.filter(n => n.prioridad === 'critica').length,
    alta: notificaciones.filter(n => n.prioridad === 'alta').length,
    media: notificaciones.filter(n => n.prioridad === 'media').length,
    baja: notificaciones.filter(n => n.prioridad === 'baja').length,
  };

  const marcarComoLeida = (id) => console.log('Marcar leída:', id);
  const marcarTodasLeidas = () => console.log('Marcar todas leídas');

  if (notificacionDetalle) {
    return (
      <DetalleNotificacion notificacion={notificacionDetalle}
        onCerrar={() => setNotificacionDetalle(null)}
        onMarcarLeida={marcarComoLeida}
        colorPrioridad={colorPrioridad}
        iconoTipo={iconoTipo}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md relative">
              <Bell className="w-6 h-6 text-white" />
              {contadores.critica > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {contadores.critica > 9 ? '9+' : contadores.critica}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Notificaciones y Alertas</h2>
              <p className="text-sm text-gray-500">Sistema de alertas inteligentes del rebaño</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={marcarTodasLeidas}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-4 h-4" /> Marcar Todo Leído
            </button>
            <button onClick={() => setCargando(l => !l)} className="px-3 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total', val: contadores.total, color: 'bg-gray-50 border-gray-200', txt: 'text-gray-700', icon: <Bell className="w-5 h-5 text-gray-400" /> },
            { label: 'Críticas', val: contadores.critica, color: 'bg-red-50 border-red-100', txt: 'text-red-700', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
            { label: 'Alta', val: contadores.alta, color: 'bg-orange-50 border-orange-100', txt: 'text-orange-700', icon: <AlertCircle className="w-5 h-5 text-orange-400" /> },
            { label: 'Media', val: contadores.media, color: 'bg-amber-50 border-amber-100', txt: 'text-amber-700', icon: <Clock className="w-5 h-5 text-amber-400" /> },
            { label: 'Baja', val: contadores.baja, color: 'bg-blue-50 border-blue-100', txt: 'text-blue-700', icon: <CheckCircle className="w-5 h-5 text-blue-400" /> },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-xl p-3 flex items-center justify-between`}>
              <div>
                <p className={`text-2xl font-bold ${s.txt}`}>{s.val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
              {s.icon}
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Filtrar:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => {
              const Ic = cat.icono;
              const active = filtroCategoria === cat.id;
              return (
                <button key={cat.id} onClick={() => setFiltroCategoria(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Ic className="w-3.5 h-3.5" /> {cat.nombre}
                </button>
              );
            })}
          </div>
          <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white">
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
        {notificacionesFiltradas.map(notif => {
          const Icono = iconoTipo(notif.tipo);
          const clrs = colorPrioridad(notif.prioridad);
          return (
            <div key={notif.id}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${clrs.card} hover:shadow-md transition-all duration-200 p-4`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${clrs.icon}`}>
                  <Icono className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{notif.titulo}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.mensaje}</p>
                      {notif.animal && (
                        <div className="flex items-center flex-wrap gap-4 mt-2 text-xs">
                          <span className="text-gray-500">Animal: <span className="font-medium text-gray-700">{notif.animal}</span></span>
                          {notif.fecha && (
                            <span className="text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />{notif.fecha}
                            </span>
                          )}
                          {notif.diasRestantes !== undefined && (
                            <span className={`font-semibold ${notif.diasRestantes < 0 ? 'text-red-600' : notif.diasRestantes <= 3 ? 'text-orange-600' : 'text-emerald-600'}`}>
                              {notif.diasRestantes < 0 ? `Atrasado ${Math.abs(notif.diasRestantes)} días` : notif.diasRestantes === 0 ? 'Hoy' : `Faltan ${notif.diasRestantes} días`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${clrs.badge}`}>{notif.prioridad}</span>
                      <button onClick={() => setNotificacionDetalle(notif)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Ver Detalle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notificacionesFiltradas.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-16 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">
            {filtroCategoria !== 'todas' || filtroPrioridad !== 'todas' ? 'Sin notificaciones con estos filtros' : 'Sin notificaciones pendientes'}
          </p>
          <p className="text-gray-400 text-sm">
            {filtroCategoria !== 'todas' || filtroPrioridad !== 'todas' ? 'Prueba con otros filtros' : 'El rebaño está al día'}
          </p>
        </div>
      )}
    </div>
  );
};

const DetalleNotificacion = ({ notificacion, onCerrar, onMarcarLeida, colorPrioridad, iconoTipo }) => {
  const Icono = iconoTipo(notificacion.tipo);
  const clrs = colorPrioridad(notificacion.prioridad);
  const headerBg = { critica: 'bg-red-500', alta: 'bg-orange-500', media: 'bg-amber-500', baja: 'bg-blue-500', info: 'bg-gray-500' }[notificacion.prioridad] || 'bg-gray-500';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className={`${headerBg} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icono className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{notificacion.titulo}</h2>
              <p className="text-white/80 text-sm capitalize">{notificacion.categoria}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</p>
            <p className="text-sm text-gray-700 leading-relaxed">{notificacion.mensaje}</p>
          </div>

          {notificacion.animal && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Animal Relacionado</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Código:</span> <span className="font-semibold text-gray-800">{notificacion.animal}</span></div>
                {notificacion.nombreAnimal && <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold text-gray-800">{notificacion.nombreAnimal}</span></div>}
                {notificacion.raza && <div><span className="text-gray-500">Raza:</span> <span className="font-semibold text-gray-800">{notificacion.raza}</span></div>}
                {notificacion.edad && <div><span className="text-gray-500">Edad:</span> <span className="font-semibold text-gray-800">{notificacion.edad}</span></div>}
              </div>
            </div>
          )}

          {(notificacion.fecha || notificacion.diasRestantes !== undefined) && (
            <div className={`rounded-xl border-2 p-4 ${notificacion.diasRestantes < 0 ? 'bg-red-50 border-red-100' : notificacion.diasRestantes <= 3 ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fecha y Plazo</p>
              <div className="grid grid-cols-2 gap-4">
                {notificacion.fecha && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha programada</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-1.5"><Calendar className="w-4 h-4" />{notificacion.fecha}</p>
                  </div>
                )}
                {notificacion.diasRestantes !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estado</p>
                    <p className={`font-bold text-lg ${notificacion.diasRestantes < 0 ? 'text-red-700' : notificacion.diasRestantes <= 3 ? 'text-orange-700' : 'text-emerald-700'}`}>
                      {notificacion.diasRestantes < 0 ? `⚠️ Atrasado ${Math.abs(notificacion.diasRestantes)} días` : notificacion.diasRestantes === 0 ? '🔔 Hoy' : `✓ Faltan ${notificacion.diasRestantes} días`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {notificacion.detalles && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalles Adicionales</p>
              <ul className="space-y-1.5">
                {Object.entries(notificacion.detalles).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-600">{k}:</span>
                    <span className="text-gray-700">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notificacion.recomendaciones && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500" /> Recomendaciones
              </p>
              <ul className="space-y-2">
                {notificacion.recomendaciones.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => { onMarcarLeida(notificacion.id); onCerrar(); }}
              className="flex-1 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Marcar como Leída
            </button>
            <button onClick={onCerrar}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
