import React, { useState } from 'react';
import {
  GitBranch, Plus, Search, Eye, Edit, AlertCircle,
  User, X, Users, Heart, Baby, ChevronRight, ChevronDown
} from 'lucide-react';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const ModuloGenealogia = () => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [registroEditar, setRegistroEditar] = useState(null);
  const [animalArbol, setAnimalArbol] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({ busqueda: '', tipoRelacion: '' });

  if (vistaActual === 'arbol') {
    return (
      <ArbolGenealogico animal={animalArbol}
        onCerrar={() => { setVistaActual('lista'); setAnimalArbol(null); }}
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <FormularioGenealogia registroEditar={registroEditar}
        onGuardar={(data) => { console.log('Guardar:', data); setVistaActual('lista'); setRegistroEditar(null); }}
        onCancelar={() => { setVistaActual('lista'); setRegistroEditar(null); }}
      />
    );
  }

  const registrosFiltrados = registros.filter(r => {
    const q = filtros.busqueda.toLowerCase();
    return !q || r.animal?.codigo?.toLowerCase().includes(q) || r.animal?.nombre?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Genealogía y Linaje</h2>
              <p className="text-sm text-gray-500">Árbol genealógico y trazabilidad genética</p>
            </div>
          </div>
          <button onClick={() => { setRegistroEditar(null); setVistaActual('registro'); }}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Registrar Relación
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Registros', val: registros.length, color: 'bg-gray-50 border-gray-200', txt: 'text-gray-700' },
            { label: 'Con Padre', val: registros.filter(r => r.padre).length, color: 'bg-blue-50 border-blue-100', txt: 'text-blue-700' },
            { label: 'Con Madre', val: registros.filter(r => r.madre).length, color: 'bg-pink-50 border-pink-100', txt: 'text-pink-700' },
            { label: 'Con Abuelos', val: registros.filter(r => r.abuelos).length, color: 'bg-teal-50 border-teal-100', txt: 'text-teal-700' },
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
            <input type="text" placeholder="Buscar animal por código o nombre..." value={filtros.busqueda}
              onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>
          <select value={filtros.tipoRelacion} onChange={e => setFiltros({ ...filtros, tipoRelacion: e.target.value })}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white">
            <option value="">Todas las relaciones</option>
            <option value="padres">Con Padres</option>
            <option value="hijos">Con Hijos</option>
            <option value="hermanos">Con Hermanos</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {registrosFiltrados.map(registro => (
          <div key={registro.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-teal-500" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{registro.animal?.codigo} — {registro.animal?.nombre}</p>
                <p className="text-xs text-gray-500">{registro.raza} · {registro.sexo === 'macho' ? 'Macho' : 'Hembra'}</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {(registro.padre || registro.madre) && (
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Padres</p>
                  {registro.padre && (
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-gray-500">Padre:</span>
                      <span className="font-medium text-gray-800">{registro.padre.codigo} - {registro.padre.nombre}</span>
                    </div>
                  )}
                  {registro.madre && (
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-3.5 h-3.5 text-pink-500" />
                      <span className="text-gray-500">Madre:</span>
                      <span className="font-medium text-gray-800">{registro.madre.codigo} - {registro.madre.nombre}</span>
                    </div>
                  )}
                </div>
              )}

              {registro.hijos?.length > 0 && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5" /> Descendencia ({registro.hijos.length})
                  </p>
                  {registro.hijos.slice(0, 3).map((hijo, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm text-gray-700">
                      <ChevronRight className="w-3 h-3 text-emerald-500" /> {hijo}
                    </div>
                  ))}
                  {registro.hijos.length > 3 && <p className="text-xs text-gray-400 mt-1">+ {registro.hijos.length - 3} más</p>}
                </div>
              )}

              {registro.coeficienteConsanguinidad !== undefined && (
                <div className={`rounded-xl p-3 border ${registro.coeficienteConsanguinidad > 12.5 ? 'bg-red-50 border-red-100' : registro.coeficienteConsanguinidad > 6.25 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Coef. Consanguinidad</span>
                    <span className={`text-lg font-bold ${registro.coeficienteConsanguinidad > 12.5 ? 'text-red-700' : registro.coeficienteConsanguinidad > 6.25 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {registro.coeficienteConsanguinidad}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
              <button onClick={() => { setAnimalArbol(registro); setVistaActual('arbol'); }}
                className="flex-1 py-2 bg-teal-50 text-teal-600 text-sm font-medium rounded-lg hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> Ver Árbol
              </button>
              <button onClick={() => { setRegistroEditar(registro); setVistaActual('registro'); }}
                className="flex-1 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {registrosFiltrados.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 p-16 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-10 h-10 text-teal-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">Sin registros genealógicos</p>
          <p className="text-gray-400 text-sm mb-6">Comienza registrando las relaciones de parentesco del rebaño</p>
          <button onClick={() => { setRegistroEditar(null); setVistaActual('registro'); }}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Primera Relación
          </button>
        </div>
      )}
    </div>
  );
};

const FormularioGenealogia = ({ registroEditar, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    animalId: registroEditar?.animal?.codigo || '',
    padreId: registroEditar?.padre?.codigo || '',
    madreId: registroEditar?.madre?.codigo || '',
    abueloPaternoId: registroEditar?.abuelos?.paterno?.padre || '',
    abuelaPaternaId: registroEditar?.abuelos?.paterno?.madre || '',
    abueloMaternoId: registroEditar?.abuelos?.materno?.padre || '',
    abuelaMaternaId: registroEditar?.abuelos?.materno?.madre || '',
    fechaNacimiento: registroEditar?.fechaNacimiento || '',
    numeroRegistroGenealogico: registroEditar?.numeroRegistroGenealogico || '',
    pureza: registroEditar?.pureza || '100',
    observaciones: registroEditar?.observaciones || '',
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [advertenciaConsanguinidad, setAdvertenciaConsanguinidad] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
    if ((name === 'padreId' || name === 'madreId') && formData.padreId && formData.madreId) {
      setAdvertenciaConsanguinidad(formData.padreId === formData.madreId);
    }
  };

  const validarFormulario = () => {
    const errs = {};
    if (!formData.animalId) errs.animalId = 'Requerido';
    if (!formData.padreId && !formData.madreId) errs.general = 'Debe registrar al menos un padre o madre';
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="bg-teal-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{registroEditar ? 'Editar Registro Genealógico' : 'Registrar Genealogía'}</h2>
          </div>
          <button onClick={onCancelar} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={manejarEnvio} className="p-6 space-y-5">
          {/* Animal Principal */}
          <Section color="bg-teal-50 border-teal-100" icon={<User className="w-4 h-4 text-teal-500" />} title="Animal Principal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Código del Animal <span className="text-red-500">*</span></label>
                <input type="text" name="animalId" value={formData.animalId} onChange={manejarCambio}
                  placeholder="CAB-001" className={`${inp} ${errores.animalId ? 'border-red-400' : ''}`} required />
                {errores.animalId && <p className="text-red-500 text-xs mt-1">{errores.animalId}</p>}
              </div>
              <div>
                <label className={lbl}>Fecha de Nacimiento</label>
                <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={manejarCambio}
                  max={new Date().toISOString().split('T')[0]} className={inp} />
              </div>
              <div>
                <label className={lbl}>Pureza Racial (%)</label>
                <input type="number" name="pureza" value={formData.pureza} onChange={manejarCambio} min="0" max="100" className={inp} />
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>Número de Registro Genealógico</label>
              <input type="text" name="numeroRegistroGenealogico" value={formData.numeroRegistroGenealogico} onChange={manejarCambio}
                placeholder="Ej: GEN-2024-001" className={inp} />
            </div>
          </Section>

          {/* Padres */}
          <Section color="bg-blue-50 border-blue-100" icon={<Users className="w-4 h-4 text-blue-500" />} title="Padres">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`${lbl} flex items-center gap-1.5`}><User className="w-3.5 h-3.5 text-blue-500" /> Padre (Macho Reproductor)</label>
                <input type="text" name="padreId" value={formData.padreId} onChange={manejarCambio}
                  placeholder="CAB-M-001" className={`${inp} focus:ring-blue-500`} />
              </div>
              <div>
                <label className={`${lbl} flex items-center gap-1.5`}><Heart className="w-3.5 h-3.5 text-pink-500" /> Madre (Hembra)</label>
                <input type="text" name="madreId" value={formData.madreId} onChange={manejarCambio}
                  placeholder="CAB-002" className={`${inp} focus:ring-pink-500`} />
              </div>
            </div>
            {advertenciaConsanguinidad && (
              <div className="mt-4 px-4 py-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700"><strong>Advertencia:</strong> Posible relación de consanguinidad detectada.</p>
              </div>
            )}
          </Section>

          {/* Abuelos Paternos */}
          <Section color="bg-indigo-50 border-indigo-100" icon={<Users className="w-4 h-4 text-indigo-500" />} title="Abuelos Paternos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Abuelo Paterno (Padre del Padre)</label>
                <input type="text" name="abueloPaternoId" value={formData.abueloPaternoId} onChange={manejarCambio}
                  placeholder="CAB-M-003" className={`${inp} focus:ring-indigo-500`} />
              </div>
              <div>
                <label className={lbl}>Abuela Paterna (Madre del Padre)</label>
                <input type="text" name="abuelaPaternaId" value={formData.abuelaPaternaId} onChange={manejarCambio}
                  placeholder="CAB-004" className={`${inp} focus:ring-indigo-500`} />
              </div>
            </div>
          </Section>

          {/* Abuelos Maternos */}
          <Section color="bg-rose-50 border-rose-100" icon={<Users className="w-4 h-4 text-rose-500" />} title="Abuelos Maternos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Abuelo Materno (Padre de la Madre)</label>
                <input type="text" name="abueloMaternoId" value={formData.abueloMaternoId} onChange={manejarCambio}
                  placeholder="CAB-M-005" className={`${inp} focus:ring-rose-500`} />
              </div>
              <div>
                <label className={lbl}>Abuela Materna (Madre de la Madre)</label>
                <input type="text" name="abuelaMaternaId" value={formData.abuelaMaternaId} onChange={manejarCambio}
                  placeholder="CAB-006" className={`${inp} focus:ring-rose-500`} />
              </div>
            </div>
          </Section>

          <div>
            <label className={lbl}>Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={manejarCambio} rows="3"
              placeholder="Notas sobre el linaje, características heredadas, premios..." className={`${inp} resize-none`} />
          </div>

          {errores.general && (
            <div className="px-4 py-3 bg-red-100 border border-red-200 rounded-lg text-sm text-red-700">{errores.general}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancelar}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 px-5 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {guardando ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Guardando...</> : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ArbolGenealogico = ({ animal, onCerrar }) => {
  if (!animal) return null;

  const NodoAnimal = ({ datos, nivel = 0, tipo = 'principal' }) => {
    const [expandido, setExpandido] = useState(nivel < 2);
    if (!datos) return null;

    const estilos = {
      principal: 'bg-teal-100 border-teal-400 text-teal-900',
      padre: 'bg-blue-100 border-blue-400 text-blue-900',
      madre: 'bg-pink-100 border-pink-400 text-pink-900',
      abuelo: 'bg-indigo-50 border-indigo-300 text-indigo-800',
      abuela: 'bg-rose-50 border-rose-300 text-rose-800',
    };

    return (
      <div className="flex flex-col items-center">
        <div
          className={`border-2 rounded-xl p-4 ${estilos[tipo]} shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[180px]`}
          onClick={() => setExpandido(!expandido)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {(tipo === 'padre' || tipo === 'abuelo') && <User className="w-4 h-4" />}
              {(tipo === 'madre' || tipo === 'abuela') && <Heart className="w-4 h-4" />}
              {tipo === 'principal' && <Baby className="w-4 h-4" />}
              <span className="font-bold text-sm">{datos.codigo}</span>
            </div>
            {(datos.padre || datos.madre) && (
              expandido ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
            )}
          </div>
          <p className="text-sm font-semibold">{datos.nombre}</p>
          {datos.raza && <p className="text-xs mt-1 opacity-70">{datos.raza}</p>}
          {datos.fechaNacimiento && <p className="text-xs mt-0.5 opacity-70">Nac: {new Date(datos.fechaNacimiento).getFullYear()}</p>}
        </div>

        {expandido && (datos.padre || datos.madre) && (
          <div className="relative mt-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
            <div className="flex gap-8 mt-8">
              {datos.padre && (
                <div className="relative">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
                  <div className="absolute bottom-full left-1/2 w-24 h-0.5 bg-gray-300" />
                  <NodoAnimal datos={datos.padre} nivel={nivel + 1} tipo={nivel === 0 ? 'padre' : 'abuelo'} />
                </div>
              )}
              {datos.madre && (
                <div className="relative">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
                  <div className="absolute bottom-full right-1/2 w-24 h-0.5 bg-gray-300" />
                  <NodoAnimal datos={datos.madre} nivel={nivel + 1} tipo={nivel === 0 ? 'madre' : 'abuela'} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="bg-teal-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Árbol Genealógico</h2>
              <p className="text-white/80 text-sm">Linaje de {animal.animal?.codigo} — {animal.animal?.nombre}</p>
            </div>
          </div>
          <button onClick={onCerrar}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5">
            <X className="w-4 h-4" /> Cerrar
          </button>
        </div>

        <div className="p-6">
          {/* Leyenda */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Leyenda</p>
            <div className="flex flex-wrap gap-4 text-xs">
              {[
                ['bg-teal-100 border-teal-400', 'Animal Principal'],
                ['bg-blue-100 border-blue-400', 'Padre'],
                ['bg-pink-100 border-pink-400', 'Madre'],
                ['bg-indigo-50 border-indigo-300', 'Abuelos'],
              ].map(([cls, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 border-2 rounded ${cls}`} />
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Haz clic en cualquier nodo para expandir o contraer su línea genealógica</p>
          </div>

          <div className="overflow-x-auto pb-8">
            <div className="flex justify-center min-w-max">
              <NodoAnimal
                datos={{
                  codigo: animal.animal?.codigo,
                  nombre: animal.animal?.nombre,
                  raza: animal.raza,
                  fechaNacimiento: animal.fechaNacimiento,
                  padre: animal.padre ? {
                    codigo: animal.padre.codigo, nombre: animal.padre.nombre, raza: animal.padre.raza,
                    padre: animal.abuelos?.paterno?.padre ? { codigo: 'ABP-P', nombre: animal.abuelos.paterno.padre } : null,
                    madre: animal.abuelos?.paterno?.madre ? { codigo: 'ABP-M', nombre: animal.abuelos.paterno.madre } : null,
                  } : null,
                  madre: animal.madre ? {
                    codigo: animal.madre.codigo, nombre: animal.madre.nombre, raza: animal.madre.raza,
                    padre: animal.abuelos?.materno?.padre ? { codigo: 'ABM-P', nombre: animal.abuelos.materno.padre } : null,
                    madre: animal.abuelos?.materno?.madre ? { codigo: 'ABM-M', nombre: animal.abuelos.materno.madre } : null,
                  } : null,
                }}
                nivel={0} tipo="principal"
              />
            </div>
          </div>

          {animal.coeficienteConsanguinidad !== undefined && (
            <div className={`mt-4 p-4 rounded-xl border ${animal.coeficienteConsanguinidad > 12.5 ? 'bg-red-50 border-red-100' : animal.coeficienteConsanguinidad > 6.25 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Coeficiente de Consanguinidad:</span>
                <span className={`text-xl font-bold ${animal.coeficienteConsanguinidad > 12.5 ? 'text-red-700' : animal.coeficienteConsanguinidad > 6.25 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {animal.coeficienteConsanguinidad}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {animal.coeficienteConsanguinidad > 12.5 ? '⚠️ Alto nivel de consanguinidad. Se recomienda evitar cruces adicionales.' :
                  animal.coeficienteConsanguinidad > 6.25 ? '⚠️ Nivel moderado. Monitorear en futuros cruces.' :
                    '✓ Nivel aceptable de consanguinidad.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuloGenealogia;
