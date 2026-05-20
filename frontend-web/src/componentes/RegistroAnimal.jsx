import React, { useState, useEffect } from 'react';
import {
  Save, X, AlertCircle, Calendar, Tag, Users, ChevronDown,
  Dna, FileText, Leaf, CheckCircle2
} from 'lucide-react';
import { animalesAPI, razasAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const ErrorMsg = ({ msg }) => msg ? (
  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
  </p>
) : null;

const Seccion = ({ titulo, icono, abierta, onToggle, children, completada }) => (
  <div className={`border rounded-2xl overflow-hidden transition-all ${abierta ? 'border-green-200 shadow-sm' : 'border-gray-100'}`}>
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${abierta ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${abierta ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
          {icono}
        </div>
        <span className={`text-sm font-semibold ${abierta ? 'text-green-800' : 'text-gray-700'}`}>{titulo}</span>
        {completada && !abierta && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
      </div>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abierta ? 'rotate-180' : ''}`} />
    </button>
    {abierta && (
      <div className="px-5 pb-5 pt-4 bg-white">
        {children}
      </div>
    )}
  </div>
);

const RegistroAnimal = ({ animalEditar = null, onGuardar, onCancelar }) => {
  const inicial = {
    identificacion: '',
    nombre: '',
    sexo: 'hembra',
    fechaNacimiento: '',
    razaId: '',
    colorPelaje: '',
    padreId: '',
    madreId: '',
    pesoNacimiento: '',
    numeroPartos: 0,
    estado: 'activo',
    observaciones: '',
  };

  const [formulario, setFormulario] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [razas, setRazas] = useState([]);
  const [machos, setMachos] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState('');
  const [errorGlobal, setErrorGlobal] = useState('');

  const [seccionAbierta, setSeccionAbierta] = useState('identidad');

  useEffect(() => {
    if (animalEditar) setFormulario({ ...inicial, ...animalEditar });
    razasAPI.getAll()
      .then(r => setRazas(Array.isArray(r) ? r : (r.data || [])))
      .catch(() => {});
    animalesAPI.getAll()
      .then(r => {
        const lista = r.data || [];
        setMachos(lista.filter(a => a.sexo?.toLowerCase() === 'macho'));
        setHembras(lista.filter(a => a.sexo?.toLowerCase() === 'hembra'));
      })
      .catch(() => {});
  }, []);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFormulario(p => ({ ...p, [name]: value }));
    if (errores[name]) setErrores(p => ({ ...p, [name]: null }));
  };

  const validar = () => {
    const errs = {};
    if (!formulario.identificacion?.trim()) errs.identificacion = 'La identificación es obligatoria';
    if (!['macho', 'hembra'].includes(formulario.sexo)) errs.sexo = 'Sexo no válido';
    if (!formulario.fechaNacimiento) errs.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    if (!formulario.razaId) errs.razaId = 'Selecciona una raza';
    if (formulario.pesoNacimiento && parseFloat(formulario.pesoNacimiento) <= 0) errs.pesoNacimiento = 'El peso debe ser mayor a 0';
    if (formulario.sexo === 'hembra' && formulario.numeroPartos < 0) errs.numeroPartos = 'No puede ser negativo';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGlobal(''); setExito('');
    if (!validar()) {
      if (errores.identificacion || errores.sexo || errores.estado) setSeccionAbierta('identidad');
      else if (errores.fechaNacimiento || errores.razaId || errores.pesoNacimiento) setSeccionAbierta('fisico');
      return;
    }
    setCargando(true);
    try {
      const payload = {
        ...formulario,
        padreId: formulario.padreId || null,
        madreId: formulario.madreId || null,
        pesoNacimiento: formulario.pesoNacimiento ? parseFloat(formulario.pesoNacimiento) : null,
        numeroPartos: formulario.sexo === 'hembra' ? parseInt(formulario.numeroPartos) || 0 : 0,
      };
      let resp;
      if (animalEditar) {
        resp = await animalesAPI.update(animalEditar.id, payload);
        setExito('Animal actualizado correctamente.');
      } else {
        resp = await animalesAPI.create(payload);
        setExito('Animal registrado correctamente.');
        setFormulario(inicial);
        setSeccionAbierta('identidad');
      }
      if (onGuardar) onGuardar(resp);
    } catch (err) {
      setErrorGlobal(err.message || 'Error al guardar. Revisa los datos e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const toggle = (id) => setSeccionAbierta(p => p === id ? null : id);

  const identidadCompleta = formulario.identificacion && formulario.sexo && formulario.estado;
  const fisicoCompleto = formulario.fechaNacimiento && formulario.razaId;
  const genealogiaCompleta = formulario.padreId || formulario.madreId;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {animalEditar ? 'Editar animal' : 'Registrar nueva cabra'}
            </h2>
            <p className="text-green-200 text-xs">Completa las secciones obligatorias (*)</p>
          </div>
        </div>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={enviar} className="p-5 space-y-3">

        {/* Feedback global */}
        {exito && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {exito}
          </div>
        )}
        {errorGlobal && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {errorGlobal}
          </div>
        )}

        {/* ── Sección 1: Identidad básica ── */}
        <Seccion
          titulo="Identidad básica"
          icono={<Tag className="w-4 h-4" />}
          abierta={seccionAbierta === 'identidad'}
          onToggle={() => toggle('identidad')}
          completada={identidadCompleta}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Código / Identificación <span className="text-red-500">*</span></label>
              <input name="identificacion" value={formulario.identificacion} onChange={cambiar}
                placeholder="Ej: CAP-001" className={`${inp} ${errores.identificacion ? 'border-red-300' : ''}`}
                disabled={cargando} />
              <ErrorMsg msg={errores.identificacion} />
            </div>
            <div>
              <label className={lbl}>Nombre</label>
              <input name="nombre" value={formulario.nombre} onChange={cambiar}
                placeholder="Nombre del animal (opcional)" className={inp} disabled={cargando} />
            </div>
            <div>
              <label className={lbl}>Sexo <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {['hembra', 'macho'].map(s => (
                  <button key={s} type="button" disabled={cargando}
                    onClick={() => cambiar({ target: { name: 'sexo', value: s } })}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${formulario.sexo === s
                      ? s === 'hembra' ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {s === 'hembra' ? '♀ Hembra' : '♂ Macho'}
                  </button>
                ))}
              </div>
              <ErrorMsg msg={errores.sexo} />
            </div>
            <div>
              <label className={lbl}>Estado</label>
              <select name="estado" value={formulario.estado} onChange={cambiar} className={inp} disabled={cargando}>
                <option value="activo">Activo</option>
                <option value="vendido">Vendido</option>
                <option value="muerto">Muerto</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
          </div>
        </Seccion>

        {/* ── Sección 2: Nacimiento y características físicas ── */}
        <Seccion
          titulo="Nacimiento y características"
          icono={<Calendar className="w-4 h-4" />}
          abierta={seccionAbierta === 'fisico'}
          onToggle={() => toggle('fisico')}
          completada={fisicoCompleto}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Fecha de nacimiento <span className="text-red-500">*</span></label>
              <input type="date" name="fechaNacimiento" value={formulario.fechaNacimiento} onChange={cambiar}
                max={new Date().toISOString().split('T')[0]}
                className={`${inp} ${errores.fechaNacimiento ? 'border-red-300' : ''}`} disabled={cargando} />
              <ErrorMsg msg={errores.fechaNacimiento} />
            </div>
            <div>
              <label className={lbl}>Raza <span className="text-red-500">*</span></label>
              <select name="razaId" value={formulario.razaId} onChange={cambiar}
                className={`${inp} ${errores.razaId ? 'border-red-300' : ''}`} disabled={cargando}>
                <option value="">Seleccionar raza...</option>
                {razas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              <ErrorMsg msg={errores.razaId} />
            </div>
            <div>
              <label className={lbl}>Color de pelaje</label>
              <input name="colorPelaje" value={formulario.colorPelaje} onChange={cambiar}
                placeholder="Ej: Blanco, Café, Negro con blanco" className={inp} disabled={cargando} />
            </div>
            <div>
              <label className={lbl}>Peso al nacimiento (kg)</label>
              <input type="number" name="pesoNacimiento" value={formulario.pesoNacimiento} onChange={cambiar}
                step="0.1" min="0" placeholder="Ej: 2.5"
                className={`${inp} ${errores.pesoNacimiento ? 'border-red-300' : ''}`} disabled={cargando} />
              <ErrorMsg msg={errores.pesoNacimiento} />
            </div>
          </div>
        </Seccion>

        {/* ── Sección 3: Genealogía ── */}
        <Seccion
          titulo="Genealogía"
          icono={<Dna className="w-4 h-4" />}
          abierta={seccionAbierta === 'genealogia'}
          onToggle={() => toggle('genealogia')}
          completada={genealogiaCompleta}
        >
          <p className="text-xs text-gray-400 mb-4">Opcional. Asigna el padre y la madre si están registrados en el sistema.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}><Users className="w-3.5 h-3.5 inline mr-1" />Padre (Macho)</label>
              <select name="padreId" value={formulario.padreId || ''} onChange={cambiar} className={inp} disabled={cargando}>
                <option value="">Sin padre registrado</option>
                {machos.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.codigo || m.identificacion} {m.nombre ? `— ${m.nombre}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}><Users className="w-3.5 h-3.5 inline mr-1" />Madre (Hembra)</label>
              <select name="madreId" value={formulario.madreId || ''} onChange={cambiar} className={inp} disabled={cargando}>
                <option value="">Sin madre registrada</option>
                {hembras.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.codigo || h.identificacion} {h.nombre ? `— ${h.nombre}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Seccion>

        {/* ── Sección 4: Información adicional ── */}
        <Seccion
          titulo="Información adicional"
          icono={<FileText className="w-4 h-4" />}
          abierta={seccionAbierta === 'notas'}
          onToggle={() => toggle('notas')}
          completada={false}
        >
          <div className="space-y-4">
            {formulario.sexo === 'hembra' && (
              <div>
                <label className={lbl}>Número de partos</label>
                <input type="number" name="numeroPartos" value={formulario.numeroPartos} onChange={cambiar}
                  min="0" placeholder="0" className={`${inp} ${errores.numeroPartos ? 'border-red-300' : ''}`} disabled={cargando} />
                <ErrorMsg msg={errores.numeroPartos} />
              </div>
            )}
            <div>
              <label className={lbl}>Observaciones</label>
              <textarea name="observaciones" value={formulario.observaciones} onChange={cambiar}
                rows="3" placeholder="Información adicional, notas de salud, comportamiento..."
                className={`${inp} resize-none`} disabled={cargando} />
            </div>
          </div>
        </Seccion>

        {/* ── Botones ── */}
        <div className="flex gap-3 pt-2">
          {onCancelar && (
            <button type="button" onClick={onCancelar} disabled={cargando}
              className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
          <button type="submit" disabled={cargando}
            className="flex-1 px-5 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
            <Save className="w-4 h-4" />
            {cargando ? 'Guardando...' : animalEditar ? 'Guardar cambios' : 'Registrar animal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroAnimal;
