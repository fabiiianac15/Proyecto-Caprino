import React, { useState, useEffect } from 'react';
import {
  Weight, Plus, Search, Eye, Edit, AlertCircle,
  TrendingUp, TrendingDown, Minus, User, X, Activity,
  BarChart3, Scale, Baby, Milk, DollarSign, Stethoscope,
  Clock, Smile, Frown, Meh, CheckCircle, XCircle, AlertTriangle,
  Ruler, Zap, Calendar, RefreshCw
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';
import { pesajeAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const ModuloPeso = () => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [registroEditar, setRegistroEditar] = useState(null);
  const [registroDetalle, setRegistroDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({ busqueda: '', fechaInicio: '', tipoPesaje: '' });

  useEffect(() => { cargarRegistros(); }, []);

  const cargarRegistros = async () => {
    setCargando(true);
    try {
      const datos = await pesajeAPI.getAll();
      setRegistros(datos.data || []);
    } catch { setRegistros([]); } finally { setCargando(false); }
  };

  const colorTipo = (t) => ({
    nacimiento: 'bg-pink-100 text-pink-700 border-pink-200',
    destete: 'bg-blue-100 text-blue-700 border-blue-200',
    periodico: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    venta: 'bg-purple-100 text-purple-700 border-purple-200',
    enfermedad: 'bg-red-100 text-red-700 border-red-200',
  })[t] || 'bg-gray-100 text-gray-700 border-gray-200';

  const fmtTipo = (t) => ({ nacimiento:'Nacimiento', destete:'Destete', periodico:'Periódico', venta:'Pre-venta', enfermedad:'Control Enfermedad' })[t] || t;
  const colorTend = (v) => v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-600' : 'text-gray-600';

  const pesoPromedio = registros.length
    ? (registros.reduce((s, r) => s + (parseFloat(r.pesoActual) || 0), 0) / registros.length).toFixed(1)
    : 0;

  const registrosFiltrados = registros.filter(r => {
    const q = filtros.busqueda.toLowerCase();
    const matchQ = !q || r.animal?.codigo?.toLowerCase().includes(q) || r.animal?.nombre?.toLowerCase().includes(q);
    const matchT = !filtros.tipoPesaje || r.tipoPesaje === filtros.tipoPesaje;
    return matchQ && matchT;
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
      <FormularioPeso registroEditar={registroEditar}
        onGuardar={() => { cargarRegistros(); setVistaActual('lista'); setRegistroEditar(null); }}
        onCancelar={() => { setVistaActual('lista'); setRegistroEditar(null); }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center shadow-md">
              <Weight className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Control de Peso</h2>
              <p className="text-sm text-gray-500">Seguimiento del crecimiento y desarrollo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setRegistroEditar(null); setVistaActual('registro'); }}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Registrar Pesaje
            </button>
            <button onClick={cargarRegistros} className="px-3 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Pesajes', val: registros.length, color: 'bg-gray-50 border-gray-200', txt: 'text-gray-700' },
            { label: 'Peso Promedio', val: `${pesoPromedio} kg`, color: 'bg-violet-50 border-violet-100', txt: 'text-violet-700' },
            { label: 'Periódicos', val: registros.filter(r => r.tipoPesaje === 'periodico').length, color: 'bg-emerald-50 border-emerald-100', txt: 'text-emerald-700' },
            { label: 'Nacimiento', val: registros.filter(r => r.tipoPesaje === 'nacimiento').length, color: 'bg-pink-50 border-pink-100', txt: 'text-pink-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.txt}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar por animal..." value={filtros.busqueda}
              onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <select value={filtros.tipoPesaje} onChange={e => setFiltros({ ...filtros, tipoPesaje: e.target.value })}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white">
            <option value="">Todos los tipos</option>
            <option value="nacimiento">Nacimiento</option>
            <option value="destete">Destete</option>
            <option value="periodico">Periódico</option>
            <option value="venta">Pre-venta</option>
            <option value="enfermedad">Control Enfermedad</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {registrosFiltrados.map(registro => (
          <div key={registro.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Weight className="w-5 h-5 text-violet-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{registro.animal?.codigo} — {registro.animal?.nombre}</p>
                  <p className="text-xs text-gray-500">{registro.fechaPesaje ? new Date(registro.fechaPesaje).toLocaleDateString('es-ES') : '-'}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorTipo(registro.tipoPesaje)}`}>
                {fmtTipo(registro.tipoPesaje)}
              </span>
            </div>

            <div className="p-5">
              <div className="bg-violet-50 rounded-xl border border-violet-100 p-4 flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Peso Actual</p>
                  <p className="text-3xl font-bold text-violet-700">{registro.pesoActual} kg</p>
                </div>
                <Scale className="w-10 h-10 text-violet-200" />
              </div>

              {registro.pesoAnterior && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Peso Anterior</p>
                    <p className="text-xl font-bold text-gray-800">{registro.pesoAnterior} kg</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Variación</p>
                    <div className={`flex items-center gap-1 ${colorTend(registro.variacionPeso)}`}>
                      {registro.variacionPeso > 0 ? <TrendingUp className="w-4 h-4" /> : registro.variacionPeso < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      <p className="text-xl font-bold">{registro.variacionPeso > 0 ? '+' : ''}{registro.variacionPeso} kg</p>
                    </div>
                  </div>
                </div>
              )}

              {(registro.gananciaPromedioDiaria || registro.condicionCorporal) && (
                <div className="flex gap-4 text-sm mb-3">
                  {registro.gananciaPromedioDiaria && <span className="text-gray-600"><TrendingUp className="w-3.5 h-3.5 inline mr-1 text-gray-400" />GPD: {registro.gananciaPromedioDiaria} kg/día</span>}
                  {registro.condicionCorporal && <span className="text-gray-600"><Activity className="w-3.5 h-3.5 inline mr-1 text-gray-400" />Condición: {registro.condicionCorporal}/5</span>}
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
          <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Weight className="w-10 h-10 text-violet-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">Sin registros de peso</p>
          <p className="text-gray-400 text-sm mb-6">Comienza registrando el peso de los animales del rebaño</p>
          <button onClick={() => { setRegistroEditar(null); setVistaActual('registro'); }}
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Primer Pesaje
          </button>
        </div>
      )}
    </div>
  );
};

const FormularioPeso = ({ registroEditar, onGuardar, onCancelar }) => {
  const opcionesTipoPesaje = [
    { value: 'periodico', label: 'Pesaje Periódico', icono: <Clock />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
    { value: 'nacimiento', label: 'Nacimiento', icono: <Baby />, colorFondo: 'bg-pink-100', colorIcono: 'text-pink-600' },
    { value: 'destete', label: 'Destete', icono: <Milk />, colorFondo: 'bg-cyan-100', colorIcono: 'text-cyan-600' },
    { value: 'venta', label: 'Pre-venta', icono: <DollarSign />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'enfermedad', label: 'Control Enfermedad', icono: <Stethoscope />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
  ];
  const opcionesEstadoNutricional = [
    { value: 'desnutrido', label: 'Desnutrido', icono: <TrendingDown />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
    { value: 'bajo_peso', label: 'Bajo Peso', icono: <Frown />, colorFondo: 'bg-orange-100', colorIcono: 'text-orange-600' },
    { value: 'normal', label: 'Normal', icono: <CheckCircle />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'sobrepeso', label: 'Sobrepeso', icono: <AlertCircle />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'obeso', label: 'Obeso', icono: <AlertTriangle />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
  ];
  const opcionesEstadoSalud = [
    { value: 'sano', label: 'Sano', icono: <Smile />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'en_observacion', label: 'En Observación', icono: <Eye />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'enfermo', label: 'Enfermo', icono: <XCircle />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
    { value: 'en_recuperacion', label: 'En Recuperación', icono: <TrendingUp />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
  ];
  const opcionesMetodoPesaje = [
    { value: 'bascula', label: 'Báscula Electrónica', icono: <Scale />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
    { value: 'romana', label: 'Romana Mecánica', icono: <Weight />, colorFondo: 'bg-gray-100', colorIcono: 'text-gray-600' },
    { value: 'cinta', label: 'Cinta Métrica (estimado)', icono: <Ruler />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'dinamometro', label: 'Dinamómetro', icono: <Zap />, colorFondo: 'bg-purple-100', colorIcono: 'text-purple-600' },
  ];
  const opcionesMomentoAlimentacion = [
    { value: 'antes', label: 'Antes de alimentar', icono: <Clock />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'despues', label: 'Después de alimentar', icono: <CheckCircle />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'intermedio', label: 'Intermedio', icono: <Meh />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
  ];

  const [formData, setFormData] = useState({
    animalId: registroEditar?.animal?.codigo || '',
    fechaPesaje: registroEditar?.fechaPesaje || new Date().toISOString().split('T')[0],
    horaPesaje: registroEditar?.horaPesaje || '',
    tipoPesaje: registroEditar?.tipoPesaje || 'periodico',
    pesoActual: registroEditar?.pesoActual || '',
    pesoAnterior: registroEditar?.pesoAnterior || '',
    circunferenciaPecho: registroEditar?.circunferenciaPecho || '',
    alturaCruz: registroEditar?.alturaCruz || '',
    longitudCuerpo: registroEditar?.longitudCuerpo || '',
    circunferenciaAbdomen: registroEditar?.circunferenciaAbdomen || '',
    condicionCorporal: registroEditar?.condicionCorporal || '',
    estadoNutricional: registroEditar?.estadoNutricional || 'normal',
    estadoSalud: registroEditar?.estadoSalud || 'sano',
    ayunas: registroEditar?.ayunas || false,
    momentoAlimentacion: registroEditar?.momentoAlimentacion || 'antes',
    metodoPesaje: registroEditar?.metodoPesaje || 'bascula',
    edadDias: registroEditar?.edadDias || '',
    edadMeses: registroEditar?.edadMeses || '',
    pesoEsperado: registroEditar?.pesoEsperado || '',
    desviacionEstandar: registroEditar?.desviacionEstandar || '',
    responsablePesaje: registroEditar?.responsablePesaje || '',
    observaciones: registroEditar?.observaciones || '',
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [variacionCalculada, setVariacionCalculada] = useState(0);

  React.useEffect(() => {
    if (formData.pesoActual && formData.pesoAnterior) {
      setVariacionCalculada(parseFloat((parseFloat(formData.pesoActual) - parseFloat(formData.pesoAnterior)).toFixed(2)));
    }
  }, [formData.pesoActual, formData.pesoAnterior]);

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  };

  const validarFormulario = () => {
    const errs = {};
    if (!formData.animalId) errs.animalId = 'Requerido';
    if (!formData.fechaPesaje) errs.fechaPesaje = 'Requerida';
    if (!formData.pesoActual || parseFloat(formData.pesoActual) <= 0) errs.pesoActual = 'Ingresa un peso válido';
    if (formData.condicionCorporal && (parseFloat(formData.condicionCorporal) < 1 || parseFloat(formData.condicionCorporal) > 5)) errs.condicionCorporal = 'Debe estar entre 1 y 5';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setGuardando(true);
    await new Promise(r => setTimeout(r, 800));
    onGuardar(formData);
    setGuardando(false);
  };

  const Section = ({ color, icon, title, children }) => (
    <div className={`rounded-xl border p-5 ${color}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );

  const colorTend = (v) => v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="bg-violet-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Weight className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{registroEditar ? 'Editar Registro de Peso' : 'Registrar Pesaje'}</h2>
          </div>
          <button onClick={onCancelar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-5">
          <Section color="bg-gray-50 border-gray-100" icon={<User className="w-4 h-4 text-gray-500" />} title="Información Básica">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Animal <span className="text-red-500">*</span></label>
                <input type="text" name="animalId" value={formData.animalId} onChange={manejarCambio}
                  placeholder="Código del animal" className={`${inp} ${errores.animalId ? 'border-red-400' : ''}`} required />
                {errores.animalId && <p className="text-red-500 text-xs mt-1">{errores.animalId}</p>}
              </div>
              <div>
                <label className={lbl}>Tipo de Pesaje <span className="text-red-500">*</span></label>
                <SelectPersonalizado valor={formData.tipoPesaje}
                  onChange={v => manejarCambio({ target: { name: 'tipoPesaje', value: v } })}
                  opciones={opcionesTipoPesaje} placeholder="Seleccionar tipo..." requerido />
              </div>
              <div>
                <label className={lbl}>Fecha de Pesaje <span className="text-red-500">*</span></label>
                <input type="date" name="fechaPesaje" value={formData.fechaPesaje} onChange={manejarCambio}
                  max={new Date().toISOString().split('T')[0]} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Hora de Pesaje</label>
                <input type="time" name="horaPesaje" value={formData.horaPesaje} onChange={manejarCambio} className={inp} />
              </div>
            </div>
          </Section>

          <Section color="bg-violet-50 border-violet-100" icon={<Weight className="w-4 h-4 text-violet-500" />} title="Peso del Animal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Peso Actual (kg) <span className="text-red-500">*</span></label>
                <input type="number" name="pesoActual" value={formData.pesoActual} onChange={manejarCambio}
                  placeholder="25.5" step="0.1" min="0"
                  className={`${inp} text-lg font-semibold ${errores.pesoActual ? 'border-red-400' : ''}`} required />
                {errores.pesoActual && <p className="text-red-500 text-xs mt-1">{errores.pesoActual}</p>}
              </div>
              <div>
                <label className={lbl}>Peso Anterior (kg)</label>
                <input type="number" name="pesoAnterior" value={formData.pesoAnterior} onChange={manejarCambio}
                  placeholder="23.0" step="0.1" min="0" className={inp} />
              </div>
              {variacionCalculada !== 0 && (
                <div>
                  <label className={lbl}>Variación (calculada)</label>
                  <div className={`flex items-center gap-2 px-3 py-2.5 bg-gray-100 rounded-lg border border-gray-200 ${colorTend(variacionCalculada)}`}>
                    {variacionCalculada > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-bold text-sm">{variacionCalculada > 0 ? '+' : ''}{variacionCalculada} kg</span>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section color="bg-blue-50 border-blue-100" icon={<BarChart3 className="w-4 h-4 text-blue-500" />} title="Medidas Corporales (Morfometría)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['circunferenciaPecho','Circunferencia de Pecho (cm)','75','Detrás de patas delanteras'],
                ['alturaCruz','Altura a la Cruz (cm)','65','Punto más alto del hombro'],
                ['longitudCuerpo','Longitud del Cuerpo (cm)','70','Desde hombro hasta nalga'],
                ['circunferenciaAbdomen','Circunferencia de Abdomen (cm)','80','Parte más ancha'],
              ].map(([name,label,ph,hint]) => (
                <div key={name}>
                  <label className={lbl}>{label}</label>
                  <input type="number" name={name} value={formData[name]} onChange={manejarCambio}
                    placeholder={ph} step="0.1" min="0" className={inp} />
                  <p className="text-xs text-gray-400 mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section color="bg-emerald-50 border-emerald-100" icon={<Activity className="w-4 h-4 text-emerald-500" />} title="Condición y Estado">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Condición Corporal (1-5)</label>
                <input type="number" name="condicionCorporal" value={formData.condicionCorporal} onChange={manejarCambio}
                  placeholder="3" step="0.5" min="1" max="5"
                  className={`${inp} ${errores.condicionCorporal ? 'border-red-400' : ''}`} />
                {errores.condicionCorporal ? <p className="text-red-500 text-xs mt-1">{errores.condicionCorporal}</p> : <p className="text-xs text-gray-400 mt-1">1=Muy delgado, 5=Obeso</p>}
              </div>
              <div>
                <label className={lbl}>Estado Nutricional</label>
                <SelectPersonalizado valor={formData.estadoNutricional}
                  onChange={v => manejarCambio({ target: { name: 'estadoNutricional', value: v } })}
                  opciones={opcionesEstadoNutricional} placeholder="Seleccionar..." />
              </div>
              <div>
                <label className={lbl}>Estado de Salud</label>
                <SelectPersonalizado valor={formData.estadoSalud}
                  onChange={v => manejarCambio({ target: { name: 'estadoSalud', value: v } })}
                  opciones={opcionesEstadoSalud} placeholder="Seleccionar..." />
              </div>
            </div>
          </Section>

          <Section color="bg-amber-50 border-amber-100" icon={<AlertCircle className="w-4 h-4 text-amber-500" />} title="Contexto del Pesaje">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Método de Pesaje</label>
                <SelectPersonalizado valor={formData.metodoPesaje}
                  onChange={v => manejarCambio({ target: { name: 'metodoPesaje', value: v } })}
                  opciones={opcionesMetodoPesaje} placeholder="Seleccionar..." />
              </div>
              <div>
                <label className={lbl}>Momento Alimentación</label>
                <SelectPersonalizado valor={formData.momentoAlimentacion}
                  onChange={v => manejarCambio({ target: { name: 'momentoAlimentacion', value: v } })}
                  opciones={opcionesMomentoAlimentacion} placeholder="Seleccionar..." />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="ayunas" checked={formData.ayunas} onChange={manejarCambio} className="w-4 h-4 text-amber-600 rounded" />
                  Animal en ayunas
                </label>
              </div>
            </div>
          </Section>

          <Section color="bg-purple-50 border-purple-100" icon={<Calendar className="w-4 h-4 text-purple-500" />} title="Edad y Análisis">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>Edad en Días</label>
                <input type="number" name="edadDias" value={formData.edadDias} onChange={manejarCambio} placeholder="90" min="0" className={inp} />
              </div>
              <div>
                <label className={lbl}>Edad en Meses</label>
                <input type="number" name="edadMeses" value={formData.edadMeses} onChange={manejarCambio} placeholder="3" step="0.1" min="0" className={inp} />
              </div>
              <div>
                <label className={lbl}>Peso Esperado (kg)</label>
                <input type="number" name="pesoEsperado" value={formData.pesoEsperado} onChange={manejarCambio} placeholder="26.0" step="0.1" min="0" className={inp} />
                <p className="text-xs text-gray-400 mt-1">Según raza y edad</p>
              </div>
              <div>
                <label className={lbl}>Desviación Estándar</label>
                <input type="number" name="desviacionEstandar" value={formData.desviacionEstandar} onChange={manejarCambio} placeholder="±2.5" step="0.1" className={inp} />
              </div>
            </div>
          </Section>

          <div>
            <label className={lbl}>Responsable del Pesaje</label>
            <input type="text" name="responsablePesaje" value={formData.responsablePesaje} onChange={manejarCambio}
              placeholder="Nombre del encargado" className={inp} />
          </div>

          <div>
            <label className={lbl}>Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={manejarCambio} rows="3"
              placeholder="Notas adicionales sobre el pesaje..." className={`${inp} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancelar}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-5 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
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
  const colorTend = (v) => v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="bg-violet-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Weight className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Registro de Peso</h2>
              <p className="text-white/80 text-sm">ID #{registro.id}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Animal</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Código:</span> <span className="font-semibold text-gray-800">{registro.animal?.codigo}</span></div>
              <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold text-gray-800">{registro.animal?.nombre}</span></div>
            </div>
          </div>

          <div className="bg-violet-50 rounded-xl border border-violet-100 p-4 text-center">
            <p className="text-5xl font-bold text-violet-700 mb-1">{registro.pesoActual} kg</p>
            <p className="text-sm text-gray-500">{registro.fechaPesaje ? new Date(registro.fechaPesaje).toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) : '-'}</p>
            {registro.pesoAnterior && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Peso Anterior</p>
                  <p className="text-2xl font-bold text-gray-800">{registro.pesoAnterior} kg</p>
                </div>
                <div className={`text-center ${colorTend(registro.variacionPeso)}`}>
                  <p className="text-sm text-gray-500">Variación</p>
                  <div className="flex items-center justify-center gap-1">
                    {registro.variacionPeso > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <p className="text-2xl font-bold">{registro.variacionPeso > 0 ? '+' : ''}{registro.variacionPeso} kg</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información Adicional</p>
            <div className="space-y-2">
              {Object.entries(registro).map(([k, v]) => {
                const skip = ['id','animal','observaciones','fechaPesaje','pesoActual','pesoAnterior','variacionPeso'];
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
            <button onClick={onEditar} className="flex-1 px-5 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
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

export default ModuloPeso;
