import React, { useState, useEffect } from 'react';
import {
  Activity, Plus, Calendar, Search, Eye, Edit,
  AlertCircle, CheckCircle, Clock, Syringe, Pill,
  User, X, FileText, AlertTriangle, Zap, Wind, Smile,
  ArrowLeft, RefreshCw
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';
import { saludAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const ModuloSalud = () => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [tipoRegistro, setTipoRegistro] = useState('vacuna');
  const [eventoEditar, setEventoEditar] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [filtros, setFiltros] = useState({ busqueda: '', tipo: '', estado: '' });

  useEffect(() => { cargarEventos(); }, []);

  const cargarEventos = async () => {
    setCargando(true);
    try {
      const datos = await saludAPI.getAll();
      setEventos(datos.data || []);
    } catch { setEventos([]); } finally { setCargando(false); }
  };

  const colorTipo = (tipo) => ({
    vacuna: 'bg-blue-100 text-blue-700 border-blue-200',
    enfermedad: 'bg-red-100 text-red-700 border-red-200',
    tratamiento: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  })[tipo] || 'bg-gray-100 text-gray-700 border-gray-200';

  const colorEstado = (estado) => ({
    programada: 'bg-amber-100 text-amber-700',
    aplicada: 'bg-emerald-100 text-emerald-700',
    en_tratamiento: 'bg-blue-100 text-blue-700',
    recuperado: 'bg-emerald-100 text-emerald-700',
    activo: 'bg-red-100 text-red-700',
    completado: 'bg-gray-100 text-gray-700'
  })[estado] || 'bg-gray-100 text-gray-700';

  const fmtEstado = (e) => ({ programada:'Programada', aplicada:'Aplicada', en_tratamiento:'En Tratamiento', recuperado:'Recuperado', activo:'Activo', completado:'Completado' })[e] || e;

  const diasHasta = (fecha) => Math.ceil((new Date(fecha) - new Date()) / 86400000);

  const stats = {
    total: eventos.length,
    vacunas: eventos.filter(e => e.tipo === 'vacuna').length,
    enfermedades: eventos.filter(e => e.tipo === 'enfermedad').length,
    tratamientos: eventos.filter(e => e.tipo === 'tratamiento').length,
  };

  const eventosFiltrados = eventos.filter(ev => {
    const q = filtros.busqueda.toLowerCase();
    const matchQ = !q || ev.animal?.codigo?.toLowerCase().includes(q) || ev.animal?.nombre?.toLowerCase().includes(q);
    const matchT = !filtros.tipo || ev.tipo === filtros.tipo;
    return matchQ && matchT;
  });

  if (vistaActual === 'detalle') {
    return (
      <DetalleEvento
        evento={eventoDetalle}
        onCerrar={() => { setVistaActual('lista'); setEventoDetalle(null); }}
        onEditar={() => { setEventoEditar(eventoDetalle); setTipoRegistro(eventoDetalle.tipo); setVistaActual('registro'); }}
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <FormularioSalud
        tipo={tipoRegistro}
        eventoEditar={eventoEditar}
        onGuardar={() => { cargarEventos(); setVistaActual('lista'); setEventoEditar(null); }}
        onCancelar={() => { setVistaActual('lista'); setEventoEditar(null); }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Salud y Vacunas</h2>
              <p className="text-sm text-gray-500">Gestión integral de la salud del rebaño</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setTipoRegistro('vacuna'); setVistaActual('registro'); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Vacuna
            </button>
            <button onClick={() => { setTipoRegistro('enfermedad'); setVistaActual('registro'); }}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Enfermedad
            </button>
            <button onClick={() => { setTipoRegistro('tratamiento'); setVistaActual('registro'); }}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Tratamiento
            </button>
            <button onClick={cargarEventos} className="px-3 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', val: stats.total, color: 'bg-gray-50 border-gray-200', txt: 'text-gray-700' },
            { label: 'Vacunas', val: stats.vacunas, color: 'bg-blue-50 border-blue-100', txt: 'text-blue-700' },
            { label: 'Enfermedades', val: stats.enfermedades, color: 'bg-red-50 border-red-100', txt: 'text-red-700' },
            { label: 'Tratamientos', val: stats.tratamientos, color: 'bg-emerald-50 border-emerald-100', txt: 'text-emerald-700' },
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
            <input type="text" placeholder="Buscar por animal..." value={filtros.busqueda}
              onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex gap-2">
            {[['', 'Todos'], ['vacuna', 'Vacunas'], ['enfermedad', 'Enfermedades'], ['tratamiento', 'Tratamientos']].map(([v, l]) => (
              <button key={v} onClick={() => setFiltros({ ...filtros, tipo: v })}
                className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors ${filtros.tipo === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {eventosFiltrados.map(evento => (
          <TarjetaEvento key={evento.id} evento={evento} colorTipo={colorTipo} colorEstado={colorEstado}
            fmtEstado={fmtEstado} diasHasta={diasHasta}
            onEditar={() => { setEventoEditar(evento); setTipoRegistro(evento.tipo); setVistaActual('registro'); }}
            onDetalle={() => { setEventoDetalle(evento); setVistaActual('detalle'); }}
          />
        ))}
      </div>

      {eventosFiltrados.length === 0 && !cargando && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-16 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-10 h-10 text-blue-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">Sin eventos de salud</p>
          <p className="text-gray-400 text-sm mb-6">Comienza registrando una vacunación, enfermedad o tratamiento</p>
          <button onClick={() => { setTipoRegistro('vacuna'); setVistaActual('registro'); }}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Primer Evento
          </button>
        </div>
      )}
    </div>
  );
};

const TarjetaEvento = ({ evento, colorTipo, colorEstado, fmtEstado, diasHasta, onEditar, onDetalle }) => {
  const bandColor = evento.tipo === 'vacuna' ? 'bg-blue-50 border-blue-100' : evento.tipo === 'enfermedad' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100';
  const iconColor = evento.tipo === 'vacuna' ? 'text-blue-500' : evento.tipo === 'enfermedad' ? 'text-red-500' : 'text-emerald-500';
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`px-5 py-3 border-b ${bandColor} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {evento.tipo === 'vacuna' && <Syringe className={`w-5 h-5 ${iconColor}`} />}
          {evento.tipo === 'enfermedad' && <AlertTriangle className={`w-5 h-5 ${iconColor}`} />}
          {evento.tipo === 'tratamiento' && <Pill className={`w-5 h-5 ${iconColor}`} />}
          <div>
            <p className="text-sm font-semibold text-gray-800">{evento.animal?.codigo} — {evento.animal?.nombre}</p>
            <p className="text-xs text-gray-500 capitalize">{evento.tipo}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorTipo(evento.tipo)}`}>
          {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
        </span>
      </div>

      <div className="p-5 space-y-2">
        {evento.tipo === 'vacuna' && (
          <>
            <InfoRow label="Vacuna" value={evento.nombreVacuna} />
            <InfoRow label="Aplicación" value={evento.fechaAplicacion ? new Date(evento.fechaAplicacion).toLocaleDateString('es-ES') : '-'} />
            <InfoRow label="Lote" value={evento.lote} />
            {evento.proximaDosis && (
              <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Próx. dosis: {new Date(evento.proximaDosis).toLocaleDateString('es-ES')} · faltan {diasHasta(evento.proximaDosis)} días
              </div>
            )}
          </>
        )}
        {evento.tipo === 'enfermedad' && (
          <>
            <InfoRow label="Enfermedad" value={evento.nombreEnfermedad} />
            <InfoRow label="Detección" value={evento.fechaDeteccion ? new Date(evento.fechaDeteccion).toLocaleDateString('es-ES') : '-'} />
            {evento.gravedad && (
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${evento.gravedad === 'leve' ? 'bg-amber-100 text-amber-700' : evento.gravedad === 'moderada' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                {evento.gravedad.charAt(0).toUpperCase() + evento.gravedad.slice(1)}
              </span>
            )}
          </>
        )}
        {evento.tipo === 'tratamiento' && (
          <>
            <InfoRow label="Medicamento" value={evento.medicamento} />
            <InfoRow label="Dosis" value={evento.dosis} />
            <InfoRow label="Frecuencia" value={evento.frecuencia} />
          </>
        )}
        {evento.estado && (
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${colorEstado(evento.estado)}`}>{fmtEstado(evento.estado)}</span>
        )}
        {evento.observaciones && (
          <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 line-clamp-2">{evento.observaciones}</p>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
        <button onClick={onEditar} className="flex-1 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
          <Edit className="w-3.5 h-3.5" /> Editar
        </button>
        <button onClick={onDetalle} className="flex-1 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> Detalles
        </button>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center text-sm">
    <span className="text-gray-500 w-28 shrink-0">{label}:</span>
    <span className="text-gray-800 font-medium">{value || '—'}</span>
  </div>
);

const FormularioSalud = ({ tipo, eventoEditar, onGuardar, onCancelar }) => {
  const opcionesViaAdministracion = [
    { value: 'subcutanea', label: 'Subcutánea', icono: <Zap />, colorFondo: 'bg-blue-100', colorIcono: 'text-blue-600' },
    { value: 'intramuscular', label: 'Intramuscular', icono: <Activity />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
    { value: 'intranasal', label: 'Intranasal', icono: <Wind />, colorFondo: 'bg-cyan-100', colorIcono: 'text-cyan-600' },
    { value: 'oral', label: 'Oral', icono: <Smile />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
  ];
  const opcionesGravedad = [
    { value: 'leve', label: 'Leve', icono: <CheckCircle />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'moderada', label: 'Moderada', icono: <AlertCircle />, colorFondo: 'bg-yellow-100', colorIcono: 'text-yellow-600' },
    { value: 'grave', label: 'Grave', icono: <AlertTriangle />, colorFondo: 'bg-red-100', colorIcono: 'text-red-600' },
  ];

  const [formData, setFormData] = useState({
    animalId: eventoEditar?.animal?.codigo || '',
    observaciones: eventoEditar?.observaciones || '',
    nombreVacuna: eventoEditar?.nombreVacuna || '',
    fechaAplicacion: eventoEditar?.fechaAplicacion || new Date().toISOString().split('T')[0],
    lote: eventoEditar?.lote || '',
    laboratorio: eventoEditar?.laboratorio || '',
    viaAdministracion: eventoEditar?.viaAdministracion || 'subcutanea',
    dosis: eventoEditar?.dosis || '',
    veterinarioResponsable: eventoEditar?.veterinarioResponsable || '',
    proximaDosis: eventoEditar?.proximaDosis || '',
    nombreEnfermedad: eventoEditar?.nombreEnfermedad || '',
    fechaDeteccion: eventoEditar?.fechaDeteccion || new Date().toISOString().split('T')[0],
    sintomas: eventoEditar?.sintomas || '',
    diagnostico: eventoEditar?.diagnostico || '',
    gravedad: eventoEditar?.gravedad || 'leve',
    contagiosa: eventoEditar?.contagiosa || false,
    aislamiento: eventoEditar?.aislamiento || false,
    medicamento: eventoEditar?.medicamento || '',
    fechaInicio: eventoEditar?.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: eventoEditar?.fechaFin || '',
    dosisTratamiento: eventoEditar?.dosis || '',
    frecuencia: eventoEditar?.frecuencia || '',
    viaAdministracionTratamiento: eventoEditar?.viaAdministracion || 'oral',
    motivoTratamiento: eventoEditar?.motivoTratamiento || '',
    resultadoTratamiento: eventoEditar?.resultadoTratamiento || '',
  });

  const [guardando, setGuardando] = useState(false);

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setGuardando(true);
    await new Promise(r => setTimeout(r, 800));
    onGuardar(formData);
    setGuardando(false);
  };

  const colorHeader = tipo === 'vacuna' ? 'bg-blue-500' : tipo === 'enfermedad' ? 'bg-red-500' : 'bg-emerald-500';
  const colorSection = tipo === 'vacuna' ? 'bg-blue-50 border-blue-100' : tipo === 'enfermedad' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100';
  const colorFocus = tipo === 'vacuna' ? 'focus:ring-blue-500' : tipo === 'enfermedad' ? 'focus:ring-red-500' : 'focus:ring-emerald-500';
  const tituloForm = eventoEditar
    ? `Editar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`
    : tipo === 'vacuna' ? 'Registrar Vacunación' : tipo === 'enfermedad' ? 'Registrar Enfermedad' : 'Registrar Tratamiento';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        {/* Header */}
        <div className={`${colorHeader} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {tipo === 'vacuna' && <Syringe className="w-6 h-6 text-white" />}
            {tipo === 'enfermedad' && <AlertTriangle className="w-6 h-6 text-white" />}
            {tipo === 'tratamiento' && <Pill className="w-6 h-6 text-white" />}
            <h2 className="text-xl font-bold text-white">{tituloForm}</h2>
          </div>
          <button onClick={onCancelar} className="text-white/80 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-5">
          {/* Animal */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" /> Información del Animal
            </h3>
            <div>
              <label className={lbl}>Código del Animal <span className="text-red-500">*</span></label>
              <input type="text" name="animalId" value={formData.animalId} onChange={manejarCambio}
                placeholder="Ej: CAB-001" className={`${inp} ${colorFocus}`} required />
            </div>
          </div>

          {/* Vacuna */}
          {tipo === 'vacuna' && (
            <div className={`rounded-xl border p-5 ${colorSection}`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Syringe className="w-4 h-4 text-blue-500" /> Información de la Vacuna
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Nombre de la Vacuna <span className="text-red-500">*</span></label>
                    <input type="text" name="nombreVacuna" value={formData.nombreVacuna} onChange={manejarCambio}
                      placeholder="Ej: Triple viral caprina" className={`${inp} focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Fecha de Aplicación <span className="text-red-500">*</span></label>
                    <input type="date" name="fechaAplicacion" value={formData.fechaAplicacion} onChange={manejarCambio}
                      max={new Date().toISOString().split('T')[0]} className={`${inp} focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Número de Lote <span className="text-red-500">*</span></label>
                    <input type="text" name="lote" value={formData.lote} onChange={manejarCambio}
                      placeholder="Ej: LOT-2024-001" className={`${inp} focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Laboratorio</label>
                    <input type="text" name="laboratorio" value={formData.laboratorio} onChange={manejarCambio}
                      placeholder="Nombre del laboratorio" className={`${inp} focus:ring-blue-500`} />
                  </div>
                  <div>
                    <label className={lbl}>Vía de Administración <span className="text-red-500">*</span></label>
                    <SelectPersonalizado valor={formData.viaAdministracion}
                      onChange={v => manejarCambio({ target: { name: 'viaAdministracion', value: v } })}
                      opciones={opcionesViaAdministracion} placeholder="Seleccionar..." requerido />
                  </div>
                  <div>
                    <label className={lbl}>Dosis Aplicada <span className="text-red-500">*</span></label>
                    <input type="text" name="dosis" value={formData.dosis} onChange={manejarCambio}
                      placeholder="Ej: 2 ml" className={`${inp} focus:ring-blue-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Veterinario Responsable</label>
                    <input type="text" name="veterinarioResponsable" value={formData.veterinarioResponsable} onChange={manejarCambio}
                      placeholder="Nombre del veterinario" className={`${inp} focus:ring-blue-500`} />
                  </div>
                  <div>
                    <label className={lbl}>Próxima Dosis / Refuerzo</label>
                    <input type="date" name="proximaDosis" value={formData.proximaDosis} onChange={manejarCambio}
                      min={new Date().toISOString().split('T')[0]} className={`${inp} focus:ring-blue-500`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enfermedad */}
          {tipo === 'enfermedad' && (
            <div className={`rounded-xl border p-5 ${colorSection}`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Información de la Enfermedad
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Nombre de la Enfermedad <span className="text-red-500">*</span></label>
                    <input type="text" name="nombreEnfermedad" value={formData.nombreEnfermedad} onChange={manejarCambio}
                      placeholder="Ej: Neumonía" className={`${inp} focus:ring-red-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Fecha de Detección <span className="text-red-500">*</span></label>
                    <input type="date" name="fechaDeteccion" value={formData.fechaDeteccion} onChange={manejarCambio}
                      max={new Date().toISOString().split('T')[0]} className={`${inp} focus:ring-red-500`} required />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Síntomas Observados <span className="text-red-500">*</span></label>
                  <textarea name="sintomas" value={formData.sintomas} onChange={manejarCambio} rows="3"
                    placeholder="Describe los síntomas..." className={`${inp} focus:ring-red-500 resize-none`} required />
                </div>
                <div>
                  <label className={lbl}>Diagnóstico del Veterinario</label>
                  <textarea name="diagnostico" value={formData.diagnostico} onChange={manejarCambio} rows="2"
                    placeholder="Diagnóstico profesional..." className={`${inp} focus:ring-red-500 resize-none`} />
                </div>
                <div>
                  <label className={lbl}>Nivel de Gravedad <span className="text-red-500">*</span></label>
                  <SelectPersonalizado valor={formData.gravedad}
                    onChange={v => manejarCambio({ target: { name: 'gravedad', value: v } })}
                    opciones={opcionesGravedad} placeholder="Seleccionar gravedad..." requerido />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" name="contagiosa" checked={formData.contagiosa} onChange={manejarCambio}
                      className="w-4 h-4 text-red-600 rounded" /> Enfermedad contagiosa
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" name="aislamiento" checked={formData.aislamiento} onChange={manejarCambio}
                      className="w-4 h-4 text-red-600 rounded" /> Requiere aislamiento
                  </label>
                </div>
                {formData.contagiosa && (
                  <div className="px-4 py-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700"><strong>Atención:</strong> Enfermedad contagiosa. Monitorear otros animales.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tratamiento */}
          {tipo === 'tratamiento' && (
            <div className={`rounded-xl border p-5 ${colorSection}`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" /> Información del Tratamiento
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Motivo del Tratamiento <span className="text-red-500">*</span></label>
                  <input type="text" name="motivoTratamiento" value={formData.motivoTratamiento} onChange={manejarCambio}
                    placeholder="Ej: Infección respiratoria" className={`${inp} focus:ring-emerald-500`} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Medicamento <span className="text-red-500">*</span></label>
                    <input type="text" name="medicamento" value={formData.medicamento} onChange={manejarCambio}
                      placeholder="Nombre del medicamento" className={`${inp} focus:ring-emerald-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Dosis <span className="text-red-500">*</span></label>
                    <input type="text" name="dosisTratamiento" value={formData.dosisTratamiento} onChange={manejarCambio}
                      placeholder="Ej: 5 ml" className={`${inp} focus:ring-emerald-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Frecuencia <span className="text-red-500">*</span></label>
                    <input type="text" name="frecuencia" value={formData.frecuencia} onChange={manejarCambio}
                      placeholder="Ej: Cada 12 horas" className={`${inp} focus:ring-emerald-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Vía de Administración</label>
                    <SelectPersonalizado valor={formData.viaAdministracionTratamiento}
                      onChange={v => manejarCambio({ target: { name: 'viaAdministracionTratamiento', value: v } })}
                      opciones={opcionesViaAdministracion} placeholder="Seleccionar..." requerido />
                  </div>
                  <div>
                    <label className={lbl}>Fecha de Inicio <span className="text-red-500">*</span></label>
                    <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={manejarCambio}
                      className={`${inp} focus:ring-emerald-500`} required />
                  </div>
                  <div>
                    <label className={lbl}>Fecha Estimada de Fin</label>
                    <input type="date" name="fechaFin" value={formData.fechaFin} onChange={manejarCambio}
                      min={formData.fechaInicio} className={`${inp} focus:ring-emerald-500`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Resultado del Tratamiento</label>
                  <textarea name="resultadoTratamiento" value={formData.resultadoTratamiento} onChange={manejarCambio}
                    rows="2" placeholder="Evolución y resultado..." className={`${inp} focus:ring-emerald-500 resize-none`} />
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className={lbl}>Observaciones Adicionales</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={manejarCambio} rows="3"
              placeholder="Notas adicionales..." className={`${inp} focus:ring-blue-500 resize-none`} />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancelar}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className={`flex-1 px-5 py-3 ${colorHeader} text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50`}>
              {guardando ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Guardando...</> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetalleEvento = ({ evento, onCerrar, onEditar }) => {
  if (!evento) return null;
  const colorHeader = evento.tipo === 'vacuna' ? 'bg-blue-500' : evento.tipo === 'enfermedad' ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className={`${colorHeader} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {evento.tipo === 'vacuna' && <Syringe className="w-6 h-6 text-white" />}
            {evento.tipo === 'enfermedad' && <AlertTriangle className="w-6 h-6 text-white" />}
            {evento.tipo === 'tratamiento' && <Pill className="w-6 h-6 text-white" />}
            <div>
              <h2 className="text-xl font-bold text-white capitalize">
                {evento.tipo === 'vacuna' ? 'Vacunación' : evento.tipo === 'enfermedad' ? 'Enfermedad' : 'Tratamiento'}
              </h2>
              <p className="text-white/80 text-sm">ID #{evento.id}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/80 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Animal</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Código:</span> <span className="font-semibold text-gray-800">{evento.animal?.codigo}</span></div>
              <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold text-gray-800">{evento.animal?.nombre}</span></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalles</p>
            <div className="space-y-2">
              {Object.entries(evento).map(([k, v]) => {
                if (['id','tipo','animal','observaciones'].includes(k) || v === null || v === undefined || v === '') return null;
                return (
                  <div key={k} className="flex items-start text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-500 w-40 shrink-0 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-gray-800 font-medium">
                      {typeof v === 'boolean' ? (v ? 'Sí' : 'No') : k.toLowerCase().includes('fecha') ? new Date(v).toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' }) : v}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {evento.observaciones && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Observaciones</p>
              <p className="text-sm text-gray-700">{evento.observaciones}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onEditar}
              className={`flex-1 px-5 py-3 ${colorHeader} text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
              <Edit className="w-4 h-4" /> Editar Evento
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

export default ModuloSalud;
