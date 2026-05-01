import React, { useState, useEffect } from 'react';
import {
  Droplet, Plus, Calendar, Search, Eye, Edit,
  AlertCircle, TrendingUp, TrendingDown, Clock, User, X,
  Activity, BarChart3, Thermometer, Sunrise, Sunset, Moon,
  Star, ThumbsUp, Smile, Frown, Meh, CheckCircle, XCircle,
  RefreshCw
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';
import { produccionAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const ModuloProduccion = () => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [registroEditar, setRegistroEditar] = useState(null);
  const [registroDetalle, setRegistroDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({ busqueda: '', fechaInicio: '', fechaFin: '', calidadLeche: '' });

  useEffect(() => { cargarRegistros(); }, []);

  const cargarRegistros = async () => {
    setCargando(true);
    try {
      const datos = await produccionAPI.getAll();
      setRegistros(datos.data || []);
    } catch { setRegistros([]); } finally { setCargando(false); }
  };

  const colorCalidad = (c) => ({
    excelente: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    buena: 'bg-blue-100 text-blue-700 border-blue-200',
    regular: 'bg-amber-100 text-amber-700 border-amber-200',
    mala: 'bg-red-100 text-red-700 border-red-200',
  })[c] || 'bg-gray-100 text-gray-700 border-gray-200';

  const totalLitros = registros.reduce((s, r) => s + (parseFloat(r.cantidadLitros) || 0), 0);
  const promedioLitros = registros.length ? (totalLitros / registros.length).toFixed(1) : 0;

  const registrosFiltrados = registros.filter(r => {
    const q = filtros.busqueda.toLowerCase();
    const matchQ = !q || r.hembra?.codigo?.toLowerCase().includes(q) || r.hembra?.nombre?.toLowerCase().includes(q);
    const matchC = !filtros.calidadLeche || r.calidadLeche === filtros.calidadLeche;
    return matchQ && matchC;
  });

  if (vistaActual === 'detalle') {
    return (
      <DetalleRegistro registro={registroDetalle}
        onCerrar={() => { setVistaActual('lista'); setRegistroDetalle(null); }}
        onEditar={() => { setRegistroEditar(registroDetalle); setVistaActual('registro'); }}
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <FormularioProduccion registroEditar={registroEditar}
        onGuardar={() => { cargarRegistros(); setVistaActual('lista'); setRegistroEditar(null); }}
        onCancelar={() => { setVistaActual('lista'); setRegistroEditar(null); }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Producción de Leche</h2>
              <p className="text-sm text-gray-500">Control diario de la producción lechera</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setRegistroEditar(null); setVistaActual('registro'); }}
              className="px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Registrar Producción
            </button>
            <button onClick={cargarRegistros} className="px-3 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Registros', val: registros.length, color: 'bg-gray-50 border-gray-200', txt: 'text-gray-700' },
            { label: 'Litros Totales', val: `${totalLitros.toFixed(1)} L`, color: 'bg-cyan-50 border-cyan-100', txt: 'text-cyan-700' },
            { label: 'Promedio/Ordeño', val: `${promedioLitros} L`, color: 'bg-blue-50 border-blue-100', txt: 'text-blue-700' },
            { label: 'Calidad Excelente', val: registros.filter(r => r.calidadLeche === 'excelente').length, color: 'bg-emerald-50 border-emerald-100', txt: 'text-emerald-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.txt}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar por hembra..." value={filtros.busqueda}
              onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
          </div>
          <select value={filtros.calidadLeche} onChange={e => setFiltros({ ...filtros, calidadLeche: e.target.value })}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white">
            <option value="">Todas las calidades</option>
            <option value="excelente">Excelente</option>
            <option value="buena">Buena</option>
            <option value="regular">Regular</option>
            <option value="mala">Mala</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {registrosFiltrados.map(registro => (
          <div key={registro.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="px-5 py-3 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplet className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{registro.hembra?.codigo} — {registro.hembra?.nombre}</p>
                  <p className="text-xs text-gray-500">Ordeño #{registro.numeroOrdenio} · {registro.fecha ? new Date(registro.fecha).toLocaleDateString('es-ES') : '-'}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorCalidad(registro.calidadLeche)}`}>
                {registro.calidadLeche?.charAt(0).toUpperCase()}{registro.calidadLeche?.slice(1)}
              </span>
            </div>
            <div className="p-5">
              <div className="bg-cyan-50 rounded-xl border border-cyan-100 p-4 flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Producción</p>
                  <p className="text-3xl font-bold text-cyan-700">{registro.cantidadLitros} L</p>
                </div>
                <Droplet className="w-10 h-10 text-cyan-200" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">% Grasa</p>
                  <p className="text-lg font-bold text-gray-800">{registro.porcentajeGrasa || '—'}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">% Proteína</p>
                  <p className="text-lg font-bold text-gray-800">{registro.porcentajeProteina || '—'}%</p>
                </div>
              </div>
              {(registro.temperatura || registro.ph) && (
                <div className="flex gap-4 text-sm mb-3">
                  {registro.temperatura && <span className="text-gray-600"><Thermometer className="w-3.5 h-3.5 inline mr-1 text-gray-400" />{registro.temperatura}°C</span>}
                  {registro.ph && <span className="text-gray-600"><BarChart3 className="w-3.5 h-3.5 inline mr-1 text-gray-400" />pH {registro.ph}</span>}
                </div>
              )}
              {registro.observaciones && <p className="text-xs text-gray-500 border-t border-gray-100 pt-3 line-clamp-2">{registro.observaciones}</p>}
            </div>
            <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
              <button onClick={() => { setRegistroEditar(registro); setVistaActual('registro'); }}
                className="flex-1 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => { setRegistroDetalle(registro); setVistaActual('detalle'); }}
                className="flex-1 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {registrosFiltrados.length === 0 && !cargando && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-16 text-center">
          <div className="w-20 h-20 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Droplet className="w-10 h-10 text-cyan-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">Sin registros de producción</p>
          <p className="text-gray-400 text-sm mb-6">Comienza registrando la producción de leche del rebaño</p>
          <button onClick={() => { setRegistroEditar(null); setVistaActual('registro'); }}
            className="px-5 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Primera Producción
          </button>
        </div>
      )}
    </div>
  );
};

const FormularioProduccion = ({ registroEditar, onGuardar, onCancelar }) => {
  const opcionesNumeroOrdenio = [
    { value: '1', label: 'Primer ordeño (mañana)', icono: <Sunrise />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: '2', label: 'Segundo ordeño (tarde)', icono: <Sunset />, colorFondo: 'bg-orange-100', colorIcono: 'text-orange-600' },
    { value: '3', label: 'Tercer ordeño (noche)', icono: <Moon />, colorFondo: 'bg-indigo-100', colorIcono: 'text-indigo-600' },
  ];
  const opcionesCalidadLeche = [
    { value: 'excelente', label: 'Excelente', icono: <Star />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'buena', label: 'Buena', icono: <ThumbsUp />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
    { value: 'regular', label: 'Regular', icono: <Meh />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'mala', label: 'Mala', icono: <Frown />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
  ];
  const opcionesEstadoAnimal = [
    { value: 'normal', label: 'Normal', icono: <Smile />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'estresado', label: 'Estresado', icono: <AlertCircle />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'enfermo', label: 'Enfermo', icono: <XCircle />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
    { value: 'en_recuperacion', label: 'En recuperación', icono: <TrendingUp />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
  ];
  const opcionesCondicionesOrdenio = [
    { value: 'optimas', label: 'Óptimas', icono: <CheckCircle />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'buenas', label: 'Buenas', icono: <ThumbsUp />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
    { value: 'regulares', label: 'Regulares', icono: <Meh />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'deficientes', label: 'Deficientes', icono: <TrendingDown />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
  ];

  const [formData, setFormData] = useState({
    hembraId: registroEditar?.hembra?.codigo || '',
    fecha: registroEditar?.fecha || new Date().toISOString().split('T')[0],
    numeroOrdenio: registroEditar?.numeroOrdenio || 1,
    horaOrdenio: registroEditar?.horaOrdenio || '',
    duracionOrdenio: registroEditar?.duracionOrdenio || '',
    cantidadLitros: registroEditar?.cantidadLitros || '',
    calidadLeche: registroEditar?.calidadLeche || 'buena',
    porcentajeGrasa: registroEditar?.porcentajeGrasa || '',
    porcentajeProteina: registroEditar?.porcentajeProteina || '',
    porcentajeLactosa: registroEditar?.porcentajeLactosa || '',
    temperatura: registroEditar?.temperatura || '',
    ph: registroEditar?.ph || '',
    densidad: registroEditar?.densidad || '',
    recuentoCelulas: registroEditar?.recuentoCelulas || '',
    presenciaAntibioticos: registroEditar?.presenciaAntibioticos || false,
    estadoAnimal: registroEditar?.estadoAnimal || 'normal',
    condicionesOrdenio: registroEditar?.condicionesOrdenio || 'optimas',
    observaciones: registroEditar?.observaciones || '',
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  };

  const validarFormulario = () => {
    const errs = {};
    if (!formData.hembraId) errs.hembraId = 'Requerido';
    if (!formData.fecha) errs.fecha = 'Requerida';
    if (!formData.cantidadLitros || parseFloat(formData.cantidadLitros) <= 0) errs.cantidadLitros = 'Ingresa una cantidad válida';
    if (formData.porcentajeGrasa && (parseFloat(formData.porcentajeGrasa) < 0 || parseFloat(formData.porcentajeGrasa) > 100)) errs.porcentajeGrasa = '0-100%';
    if (formData.porcentajeProteina && (parseFloat(formData.porcentajeProteina) < 0 || parseFloat(formData.porcentajeProteina) > 100)) errs.porcentajeProteina = '0-100%';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setGuardando(true);
    try {
      await produccionAPI.create(formData);
      onGuardar(formData);
    } catch { alert('Error al guardar el registro'); } finally { setGuardando(false); }
  };

  const Section = ({ color, icon, title, children }) => (
    <div className={`rounded-xl border p-5 ${color}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="bg-cyan-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplet className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              {registroEditar ? 'Editar Registro de Producción' : 'Registrar Producción de Leche'}
            </h2>
          </div>
          <button onClick={onCancelar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-5">
          {/* Básica */}
          <Section color="bg-gray-50 border-gray-100" icon={<User className="w-4 h-4 text-gray-500" />} title="Información Básica">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Hembra Productora <span className="text-red-500">*</span></label>
                <input type="text" name="hembraId" value={formData.hembraId} onChange={manejarCambio}
                  placeholder="Código de la hembra" className={`${inp} ${errores.hembraId ? 'border-red-400' : ''}`} required />
                {errores.hembraId && <p className="text-red-500 text-xs mt-1">{errores.hembraId}</p>}
              </div>
              <div>
                <label className={lbl}>Fecha de Ordeño <span className="text-red-500">*</span></label>
                <input type="date" name="fecha" value={formData.fecha} onChange={manejarCambio}
                  max={new Date().toISOString().split('T')[0]} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Número de Ordeño <span className="text-red-500">*</span></label>
                <SelectPersonalizado valor={formData.numeroOrdenio}
                  onChange={v => manejarCambio({ target: { name: 'numeroOrdenio', value: v } })}
                  opciones={opcionesNumeroOrdenio} placeholder="Seleccionar ordeño..." requerido />
              </div>
              <div>
                <label className={lbl}>Hora de Ordeño</label>
                <input type="time" name="horaOrdenio" value={formData.horaOrdenio} onChange={manejarCambio} className={inp} />
              </div>
              <div>
                <label className={lbl}>Duración (minutos)</label>
                <input type="number" name="duracionOrdenio" value={formData.duracionOrdenio} onChange={manejarCambio}
                  placeholder="15" min="1" max="120" className={inp} />
              </div>
            </div>
          </Section>

          {/* Producción */}
          <Section color="bg-cyan-50 border-cyan-100" icon={<Droplet className="w-4 h-4 text-cyan-500" />} title="Cantidad Producida">
            <div>
              <label className={lbl}>Cantidad de Leche (litros) <span className="text-red-500">*</span></label>
              <input type="number" name="cantidadLitros" value={formData.cantidadLitros} onChange={manejarCambio}
                placeholder="2.5" step="0.01" min="0"
                className={`${inp} text-lg font-semibold ${errores.cantidadLitros ? 'border-red-400' : ''}`} required />
              {errores.cantidadLitros && <p className="text-red-500 text-xs mt-1">{errores.cantidadLitros}</p>}
              <p className="text-xs text-gray-400 mt-1.5">Ingresa la cantidad en litros con hasta 2 decimales</p>
            </div>
          </Section>

          {/* Calidad */}
          <Section color="bg-blue-50 border-blue-100" icon={<Activity className="w-4 h-4 text-blue-500" />} title="Composición y Calidad">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Calidad de la Leche <span className="text-red-500">*</span></label>
                <SelectPersonalizado valor={formData.calidadLeche}
                  onChange={v => manejarCambio({ target: { name: 'calidadLeche', value: v } })}
                  opciones={opcionesCalidadLeche} placeholder="Seleccionar calidad..." requerido />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[['porcentajeGrasa','% Grasa','3.5','Rango: 3.0-5.0%'],['porcentajeProteina','% Proteína','3.2','Rango: 2.8-3.8%'],['porcentajeLactosa','% Lactosa','4.5','Rango: 4.2-4.8%']].map(([name,label,ph,hint]) => (
                  <div key={name}>
                    <label className={lbl}>{label}</label>
                    <input type="number" name={name} value={formData[name]} onChange={manejarCambio}
                      placeholder={ph} step="0.1" min="0" max="100"
                      className={`${inp} ${errores[name] ? 'border-red-400' : ''}`} />
                    {errores[name] ? <p className="text-red-500 text-xs mt-1">{errores[name]}</p> : <p className="text-xs text-gray-400 mt-1">{hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Físico-Químicos */}
          <Section color="bg-purple-50 border-purple-100" icon={<BarChart3 className="w-4 h-4 text-purple-500" />} title="Parámetros Físico-Químicos">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[['temperatura','Temperatura (°C)','4','Óptimo: 2-6°C'],['ph','pH','6.7','Rango: 6.5-6.8'],['densidad','Densidad (g/ml)','1.030','Rango: 1.028-1.034']].map(([name,label,ph,hint]) => (
                <div key={name}>
                  <label className={lbl}>{label}</label>
                  <input type="number" name={name} value={formData[name]} onChange={manejarCambio} placeholder={ph} step="0.1" className={inp} />
                  <p className="text-xs text-gray-400 mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Sanitario */}
          <Section color="bg-amber-50 border-amber-100" icon={<AlertCircle className="w-4 h-4 text-amber-500" />} title="Control Sanitario">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Recuento de Células Somáticas (células/ml)</label>
                <input type="number" name="recuentoCelulas" value={formData.recuentoCelulas} onChange={manejarCambio}
                  placeholder="200000" className={inp} />
                <p className="text-xs text-gray-400 mt-1">Óptimo: {'<'} 400,000 células/ml</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="presenciaAntibioticos" checked={formData.presenciaAntibioticos} onChange={manejarCambio}
                  className="w-4 h-4 text-amber-600 rounded" />
                Presencia de antibióticos detectada
              </label>
              {formData.presenciaAntibioticos && (
                <div className="px-4 py-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700"><strong>Advertencia:</strong> Esta leche no debe comercializarse. Descartar según protocolo.</p>
                </div>
              )}
            </div>
          </Section>

          {/* Condiciones */}
          <Section color="bg-emerald-50 border-emerald-100" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} title="Condiciones">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Estado del Animal</label>
                <SelectPersonalizado valor={formData.estadoAnimal}
                  onChange={v => manejarCambio({ target: { name: 'estadoAnimal', value: v } })}
                  opciones={opcionesEstadoAnimal} placeholder="Seleccionar estado..." />
              </div>
              <div>
                <label className={lbl}>Condiciones de Ordeño</label>
                <SelectPersonalizado valor={formData.condicionesOrdenio}
                  onChange={v => manejarCambio({ target: { name: 'condicionesOrdenio', value: v } })}
                  opciones={opcionesCondicionesOrdenio} placeholder="Seleccionar condiciones..." />
              </div>
            </div>
          </Section>

          <div>
            <label className={lbl}>Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={manejarCambio} rows="3"
              placeholder="Notas adicionales sobre la producción, comportamiento del animal..." className={`${inp} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancelar}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-5 py-3 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {guardando ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Guardando...</> : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetalleRegistro = ({ registro, onCerrar, onEditar }) => {
  if (!registro) return null;
  const colorCalidad = {
    excelente: 'bg-emerald-100 text-emerald-700',
    buena: 'bg-blue-100 text-blue-700',
    regular: 'bg-amber-100 text-amber-700',
    mala: 'bg-red-100 text-red-700',
  }[registro.calidadLeche] || 'bg-gray-100 text-gray-700';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="bg-cyan-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplet className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Registro de Producción</h2>
              <p className="text-white/80 text-sm">ID #{registro.id} · Ordeño #{registro.numeroOrdenio}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Animal</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Código:</span> <span className="font-semibold text-gray-800">{registro.hembra?.codigo}</span></div>
              <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold text-gray-800">{registro.hembra?.nombre}</span></div>
            </div>
          </div>

          <div className="bg-cyan-50 rounded-xl border border-cyan-100 p-4 text-center">
            <p className="text-5xl font-bold text-cyan-700 mb-1">{registro.cantidadLitros} L</p>
            <p className="text-sm text-gray-500">{registro.fecha ? new Date(registro.fecha).toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) : '-'}</p>
            <span className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full ${colorCalidad}`}>
              Calidad: {registro.calidadLeche?.charAt(0).toUpperCase()}{registro.calidadLeche?.slice(1)}
            </span>
          </div>

          {(registro.porcentajeGrasa || registro.porcentajeProteina || registro.porcentajeLactosa) && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Composición</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {registro.porcentajeGrasa && <div><p className="text-2xl font-bold text-blue-700">{registro.porcentajeGrasa}%</p><p className="text-xs text-gray-500">Grasa</p></div>}
                {registro.porcentajeProteina && <div><p className="text-2xl font-bold text-blue-700">{registro.porcentajeProteina}%</p><p className="text-xs text-gray-500">Proteína</p></div>}
                {registro.porcentajeLactosa && <div><p className="text-2xl font-bold text-blue-700">{registro.porcentajeLactosa}%</p><p className="text-xs text-gray-500">Lactosa</p></div>}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Adicional</p>
            <div className="space-y-2">
              {Object.entries(registro).map(([k, v]) => {
                const skip = ['id','hembra','observaciones','fecha','cantidadLitros','calidadLeche','porcentajeGrasa','porcentajeProteina','porcentajeLactosa','horaOrdenio','duracionOrdenio','numeroOrdenio'];
                if (skip.includes(k) || v === null || v === undefined || v === '') return null;
                return (
                  <div key={k} className="flex text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-500 w-40 shrink-0 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-gray-800 font-medium">{typeof v === 'boolean' ? (v ? 'Sí' : 'No') : v}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {registro.observaciones && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Observaciones</p>
              <p className="text-sm text-gray-700">{registro.observaciones}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onEditar} className="flex-1 px-5 py-3 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2">
              <Edit className="w-4 h-4" /> Editar Registro
            </button>
            <button onClick={onCerrar} className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloProduccion;
