import React, { useState, useRef, useEffect } from 'react';
import {
  Save, X, Upload, Camera, AlertCircle, CheckCircle, CheckCircle2,
  User, Calendar, Tag, Weight, Info, Sparkles, Heart, Palette,
  Target, Moon, Mountain, Droplet, Beef, Baby, Users as UsersIcon,
  Activity, DollarSign, Skull, Gift, Milk, CloudOff,
  ChevronDown, Dna, FileText
} from 'lucide-react';
import SelectPersonalizado from './SelectPersonalizado';
import { animalesAPI, razasAPI, corralesAPI } from '../servicios/caprino-api';

// ── Estilos base ─────────────────────────────────────────────────────────────

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-50';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const TIPO_CORRAL_LABEL = {
  general: 'General', gestante: 'Gestantes', ordeno: 'Ordeño',
  lactancia: 'Lactancia', levante: 'Levante', machos: 'Machos',
};

const ErrMsg = ({ msg }) => msg ? (
  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
  </p>
) : null;

// ── Componente acordeón ───────────────────────────────────────────────────────

const Seccion = ({ id, titulo, icono, color = 'green', abierta, onToggle, completada, hayError, children }) => {
  const colores = {
    green:  { ring: 'border-green-200',  bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  txt: 'text-green-800'  },
    blue:   { ring: 'border-blue-200',   bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    txt: 'text-blue-800'   },
    violet: { ring: 'border-violet-200', bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600',txt: 'text-violet-800' },
    amber:  { ring: 'border-amber-200',  bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',  txt: 'text-amber-800'  },
    teal:   { ring: 'border-teal-200',   bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-600',    txt: 'text-teal-800'   },
    gray:   { ring: 'border-gray-200',   bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',    txt: 'text-gray-800'   },
  };
  const c = colores[color] || colores.green;

  return (
    <div className={`border-2 rounded-2xl transition-all ${
      hayError ? 'border-red-300' : abierta ? c.ring : 'border-gray-100'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors rounded-2xl ${
          abierta ? `${c.bg} rounded-b-none` : 'bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${abierta ? c.icon : 'bg-gray-100 text-gray-500'}`}>
            {icono}
          </div>
          <span className={`text-sm font-semibold ${abierta ? c.txt : 'text-gray-700'}`}>{titulo}</span>
          {hayError && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Revisar</span>}
          {completada && !abierta && !hayError && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${abierta ? 'rotate-180' : ''}`} />
      </button>
      {abierta && (
        <div className="px-5 pb-5 pt-4 bg-white border-t border-gray-100 rounded-b-2xl">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────

const RegistroCabra = ({ cabraEditar, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    chapetaNueva: cabraEditar?.chapetaNueva || '',
    chapetaVieja: cabraEditar?.chapetaVieja || cabraEditar?.codigo || cabraEditar?.identificacion || '',
    nombre: cabraEditar?.nombre || '',
    sexo: cabraEditar?.sexo || '',
    raza: cabraEditar?.idRaza || cabraEditar?.raza || '',
    fechaNacimiento: cabraEditar?.fechaNacimiento || '',
    fechaIngreso: cabraEditar?.fechaIngreso || new Date().toISOString().split('T')[0],
    color: cabraEditar?.colorPelaje || cabraEditar?.color || '',
    pesoNacimiento: cabraEditar?.pesoNacimiento || '',
    pesoActual: cabraEditar?.pesoActual || '',
    codigoPadre: cabraEditar?.codigoPadre || '',
    codigoMadre: cabraEditar?.codigoMadre || '',
    estado: cabraEditar?.estado || 'activo',
    motivoEstado: cabraEditar?.motivoEstado || '',
    idCorral: cabraEditar?.idCorral || '',
    estadoReproductivo: cabraEditar?.estadoReproductivo || '',
    proposito: cabraEditar?.proposito || '',
    observaciones: cabraEditar?.observaciones || '',
    foto: cabraEditar?.fotoUrl || cabraEditar?.foto || null,
  });

  const [imagenPreview, setImagenPreview] = useState(
    cabraEditar?.fotoUrl || cabraEditar?.foto || null
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [razasDisponibles, setRazasDisponibles] = useState([]);
  const [corralesDisponibles, setCorralesDisponibles] = useState([]);
  const [seccionAbierta, setSeccionAbierta] = useState('identidad');
  const inputFotoRef = useRef(null);

  useEffect(() => {
    razasAPI.getAll()
      .then(r => setRazasDisponibles(Array.isArray(r) ? r : (r.data || [])))
      .catch(() => {});
    corralesAPI.getAll()
      .then(r => setCorralesDisponibles(Array.isArray(r) ? r : (r.data || [])))
      .catch(() => {});
  }, []);

  const corralSeleccionado = corralesDisponibles.find(c => String(c.id) === String(formData.idCorral));

  // ── Opciones SelectPersonalizado ──────────────────────────────────────────

  const opcionesSexo = [
    { value: 'macho',  label: 'Macho',  icono: <User />,  colorFondo: 'bg-blue-100',  colorIcono: 'text-blue-600'  },
    { value: 'hembra', label: 'Hembra', icono: <Heart />, colorFondo: 'bg-pink-100',  colorIcono: 'text-pink-600'  },
  ];

  const opcionesColor = [
    { value: 'Blanco',     label: 'Blanco',     icono: <Palette />, colorFondo: 'bg-gray-50 border border-gray-200', colorIcono: 'text-gray-600' },
    { value: 'Negro',      label: 'Negro',      icono: <Palette />, colorFondo: 'bg-gray-800',    colorIcono: 'text-white'    },
    { value: 'Marrón',     label: 'Marrón',     icono: <Palette />, colorFondo: 'bg-amber-700',   colorIcono: 'text-white'    },
    { value: 'Beige',      label: 'Beige',      icono: <Palette />, colorFondo: 'bg-amber-100',   colorIcono: 'text-amber-700'},
    { value: 'Gris',       label: 'Gris',       icono: <Palette />, colorFondo: 'bg-gray-300',    colorIcono: 'text-gray-700' },
    { value: 'Manchado',   label: 'Manchado',   icono: <Palette />, colorFondo: 'bg-gradient-to-r from-white to-gray-800', colorIcono: 'text-gray-600' },
    { value: 'Multicolor', label: 'Multicolor', icono: <Palette />, colorFondo: 'bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200', colorIcono: 'text-gray-700' },
  ];

  const opcionesProposito = [
    { value: 'Leche',           label: 'Leche',           icono: <Droplet />, colorFondo: 'bg-cyan-100',   colorIcono: 'text-cyan-600'   },
    { value: 'Carne',           label: 'Carne',           icono: <Beef />,    colorFondo: 'bg-red-100',    colorIcono: 'text-red-600'    },
    { value: 'Doble propósito', label: 'Doble propósito', icono: <Target />,  colorFondo: 'bg-purple-100', colorIcono: 'text-purple-600' },
    { value: 'Reproducción',    label: 'Reproducción',    icono: <Heart />,   colorFondo: 'bg-pink-100',   colorIcono: 'text-pink-600'   },
    { value: 'Cría',            label: 'Cría',            icono: <Baby />,    colorFondo: 'bg-green-100',  colorIcono: 'text-green-600'  },
  ];

  const opcionesEstadoGeneral = [
    { value: 'activo',   label: 'Activo',   icono: <Activity />,   colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'vendido',  label: 'Vendido',  icono: <DollarSign />, colorFondo: 'bg-blue-100',  colorIcono: 'text-blue-600'  },
    { value: 'muerto',   label: 'Muerto',   icono: <Skull />,      colorFondo: 'bg-gray-100',  colorIcono: 'text-gray-600'  },
    { value: 'donado',   label: 'Donado',   icono: <Gift />,       colorFondo: 'bg-purple-100',colorIcono: 'text-purple-600'},
  ];

  const opcionesEstadoReproductivo = [
    { value: '',         label: 'No aplica',            icono: <CloudOff />,     colorFondo: 'bg-gray-100',  colorIcono: 'text-gray-500'  },
    { value: 'apta',     label: 'Apta para reproducción',icono: <CheckCircle />, colorFondo: 'bg-green-100', colorIcono: 'text-green-600' },
    { value: 'gestante', label: 'Gestante',              icono: <Heart />,       colorFondo: 'bg-pink-100',  colorIcono: 'text-pink-600'  },
    { value: 'lactante', label: 'Lactante',              icono: <Milk />,        colorFondo: 'bg-cyan-100',  colorIcono: 'text-cyan-600'  },
    { value: 'seca',     label: 'Seca',                  icono: <CloudOff />,    colorFondo: 'bg-orange-100',colorIcono: 'text-orange-600'},
    { value: 'joven',    label: 'Muy joven',             icono: <Baby />,        colorFondo: 'bg-yellow-100',colorIcono: 'text-yellow-600'},
  ];

  // ── Lógica ────────────────────────────────────────────────────────────────

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errores[name]) setErrores(p => ({ ...p, [name]: null }));
  };

  const cambiarImagen = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setMensaje({ tipo: 'error', texto: 'Selecciona una imagen válida (JPG, PNG).' }); return; }
    if (archivo.size > 5 * 1024 * 1024) { setMensaje({ tipo: 'error', texto: 'La imagen no debe superar los 5 MB.' }); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImagenPreview(reader.result); setFormData(p => ({ ...p, foto: archivo })); };
    reader.readAsDataURL(archivo);
  };

  const calcularEdad = () => {
    if (!formData.fechaNacimiento) return '';
    const dias = Math.ceil((new Date() - new Date(formData.fechaNacimiento)) / 86400000);
    if (dias < 30)  return `${dias} día${dias !== 1 ? 's' : ''}`;
    if (dias < 365) { const m = Math.floor(dias / 30); return `${m} mes${m !== 1 ? 'es' : ''}`; }
    const a = Math.floor(dias / 365); const m = Math.floor((dias % 365) / 30);
    return `${a} año${a !== 1 ? 's' : ''}${m > 0 ? ` y ${m} mes${m !== 1 ? 'es' : ''}` : ''}`;
  };

  const validar = () => {
    const errs = {};
    if (!formData.chapetaNueva.trim() && !formData.chapetaVieja.trim()) {
      errs.chapetas = 'Debe registrar al menos una chapeta (nueva o vieja)';
    }
    if (!formData.nombre.trim())    errs.nombre = 'El nombre es obligatorio';
    if (!formData.sexo)             errs.sexo = 'Selecciona el sexo';
    if (!formData.raza)             errs.raza = 'Selecciona la raza';
    // La fecha de nacimiento es opcional: hay cabras viejas sin fecha conocida.
    if (formData.estado === 'muerto' && !formData.motivoEstado.trim()) {
      errs.motivoEstado = 'Indica el motivo de muerte';
    }
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.chapetas || errs.nombre || errs.sexo || errs.raza) setSeccionAbierta('identidad');
      else if (errs.motivoEstado) setSeccionAbierta('estado');
      return false;
    }
    return true;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    if (!validar()) return;
    setGuardando(true);
    try {
      let fotoBase64 = null;
      if (formData.foto instanceof File) {
        fotoBase64 = await new Promise(res => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.readAsDataURL(formData.foto);
        });
      } else if (typeof formData.foto === 'string' && formData.foto) {
        fotoBase64 = formData.foto;
      }

      const chapetaNueva = formData.chapetaNueva.trim();
      const chapetaVieja = formData.chapetaVieja.trim();

      const payload = {
        // codigo_identificacion principal: la nueva si existe, si no la vieja
        identificacion: chapetaNueva || chapetaVieja,
        chapetaNueva: chapetaNueva || null,
        chapetaVieja: chapetaVieja || null,
        nombre: formData.nombre,
        sexo: formData.sexo,
        fechaNacimiento: formData.fechaNacimiento || null,
        razaId: formData.raza,
        colorPelaje: formData.color,
        pesoNacimiento: formData.pesoNacimiento ? parseFloat(formData.pesoNacimiento) : null,
        observaciones: formData.observaciones,
        fotoUrl: fotoBase64,
        estado: formData.estado,
        motivoEstado: formData.estado !== 'activo' ? (formData.motivoEstado || null) : null,
        idCorral: formData.idCorral || null,
      };

      let resp;
      if (cabraEditar) {
        resp = await animalesAPI.update(cabraEditar.id, payload);
        setMensaje({ tipo: 'success', texto: 'Cabra actualizada correctamente.' });
      } else {
        resp = await animalesAPI.create(payload);
        setMensaje({ tipo: 'success', texto: 'Cabra registrada correctamente.' });
      }
      setTimeout(() => onGuardar(resp), 1200);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  const toggle = (id) => setSeccionAbierta(p => p === id ? null : id);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl shadow-lg px-7 py-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {cabraEditar ? 'Editar cabra' : 'Registrar nueva cabra'}
            </h2>
            <p className="text-green-200 text-sm">Completa las secciones. Los campos marcados con * son obligatorios.</p>
          </div>
        </div>
        <button type="button" onClick={onCancelar} className="text-white/70 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={enviar}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna foto (sticky) ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24 space-y-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Camera className="w-4 h-4 text-green-600" /> Fotografía
              </h3>

              <div className="aspect-square w-full bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                {imagenPreview ? (
                  <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover"
                    onError={() => setImagenPreview(null)} />
                ) : (
                  <div className="text-center text-gray-300">
                    <Camera className="w-14 h-14 mx-auto mb-2" />
                    <p className="text-xs">Sin fotografía</p>
                  </div>
                )}
              </div>

              <input ref={inputFotoRef} type="file" accept="image/*" onChange={cambiarImagen} className="hidden" />

              <button type="button" onClick={() => inputFotoRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
                <Upload className="w-4 h-4" /> Subir foto
              </button>

              {imagenPreview && (
                <button type="button"
                  onClick={() => { setImagenPreview(null); setFormData(p => ({ ...p, foto: null })); if (inputFotoRef.current) inputFotoRef.current.value = ''; }}
                  className="w-full px-4 py-2 text-red-600 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors">
                  Eliminar foto
                </button>
              )}

              <p className="text-xs text-gray-400 text-center">JPG o PNG · máx. 5 MB</p>

              {formData.fechaNacimiento && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs text-green-700 font-medium">Edad actual</p>
                    <p className="text-base font-bold text-green-800">{calcularEdad()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Columna acordeón ── */}
          <div className="lg:col-span-2 space-y-3">

            {/* Mensaje global */}
            {mensaje.texto && (
              <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium border ${
                mensaje.tipo === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {mensaje.tipo === 'success'
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {mensaje.texto}
              </div>
            )}

            {/* 1 — Identidad básica */}
            <Seccion id="identidad" titulo="Identidad básica" icono={<Tag className="w-4 h-4" />}
              color="green" abierta={seccionAbierta === 'identidad'} onToggle={() => toggle('identidad')}
              completada={!!((formData.chapetaNueva || formData.chapetaVieja) && formData.nombre && formData.sexo && formData.raza)}
              hayError={!!(errores.chapetas || errores.nombre || errores.sexo || errores.raza)}>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-blue-700">
                  <strong>Chapetas:</strong> registra la chapeta nueva y/o la vieja. Las cabras nuevas
                  suelen tener solo la nueva; las viejas, solo la vieja. Debe haber <strong>al menos una</strong>.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Chapeta nueva</label>
                  <input name="chapetaNueva" value={formData.chapetaNueva} onChange={cambiar}
                    placeholder="Ej: CAB-2026-001"
                    className={`${inp} ${errores.chapetas ? 'border-red-300 focus:ring-red-400' : ''}`} />
                </div>
                <div>
                  <label className={lbl}>Chapeta vieja</label>
                  <input name="chapetaVieja" value={formData.chapetaVieja} onChange={cambiar}
                    placeholder="Ej: 045"
                    className={`${inp} ${errores.chapetas ? 'border-red-300 focus:ring-red-400' : ''}`} />
                </div>
                <div className="md:col-span-2 -mt-2">
                  <ErrMsg msg={errores.chapetas} />
                </div>
                <div>
                  <label className={lbl}>Nombre <span className="text-red-500">*</span></label>
                  <input name="nombre" value={formData.nombre} onChange={cambiar}
                    placeholder="Ej: Luna"
                    className={`${inp} ${errores.nombre ? 'border-red-300 focus:ring-red-400' : ''}`} />
                  <ErrMsg msg={errores.nombre} />
                </div>
                <div>
                  <label className={lbl}>Sexo <span className="text-red-500">*</span></label>
                  <SelectPersonalizado valor={formData.sexo}
                    onChange={v => cambiar({ target: { name: 'sexo', value: v } })}
                    opciones={opcionesSexo} placeholder="Seleccionar sexo..." error={!!errores.sexo} requerido />
                  <ErrMsg msg={errores.sexo} />
                </div>
                <div>
                  <label className={lbl}>Raza <span className="text-red-500">*</span></label>
                  <SelectPersonalizado valor={formData.raza}
                    onChange={v => cambiar({ target: { name: 'raza', value: v } })}
                    opciones={razasDisponibles.map(r => ({
                      value: r.id_raza || r.id,
                      label: r.nombre_raza || r.nombre,
                      icono: <Sparkles />,
                      colorFondo: 'bg-purple-100',
                      colorIcono: 'text-purple-600',
                    }))}
                    placeholder={razasDisponibles.length === 0 ? 'Cargando razas...' : 'Seleccionar raza...'}
                    error={!!errores.raza} requerido />
                  <ErrMsg msg={errores.raza} />
                </div>
              </div>
            </Seccion>

            {/* 2 — Fechas */}
            <Seccion id="fechas" titulo="Fechas importantes" icono={<Calendar className="w-4 h-4" />}
              color="blue" abierta={seccionAbierta === 'fechas'} onToggle={() => toggle('fechas')}
              completada={!!formData.fechaNacimiento}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Fecha de nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={cambiar}
                    max={new Date().toISOString().split('T')[0]}
                    className={inp} />
                  <p className="text-xs text-amber-600 mt-1.5">Opcional: hay cabras viejas sin fecha de nacimiento conocida.</p>
                </div>
                <div>
                  <label className={lbl}>Fecha de ingreso al rebaño</label>
                  <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={cambiar} className={inp} />
                  <p className="text-xs text-amber-600 mt-1.5">Solo referencia, no se almacena en BD.</p>
                </div>
              </div>
            </Seccion>

            {/* 3 — Características físicas */}
            <Seccion id="fisico" titulo="Características físicas" icono={<Weight className="w-4 h-4" />}
              color="violet" abierta={seccionAbierta === 'fisico'} onToggle={() => toggle('fisico')}
              completada={!!(formData.color || formData.pesoNacimiento || formData.proposito)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Color de pelaje</label>
                  <SelectPersonalizado valor={formData.color}
                    onChange={v => cambiar({ target: { name: 'color', value: v } })}
                    opciones={opcionesColor} placeholder="Seleccionar color..." />
                </div>
                <div>
                  <label className={lbl}>Propósito</label>
                  <SelectPersonalizado valor={formData.proposito}
                    onChange={v => cambiar({ target: { name: 'proposito', value: v } })}
                    opciones={opcionesProposito} placeholder="Seleccionar propósito..." />
                  <p className="text-xs text-amber-600 mt-1.5">Solo referencia, no se almacena en BD.</p>
                </div>
                <div>
                  <label className={lbl}>Peso al nacimiento (kg)</label>
                  <input type="number" name="pesoNacimiento" value={formData.pesoNacimiento} onChange={cambiar}
                    step="0.1" min="0" placeholder="Ej: 3.5" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Peso actual (kg)</label>
                  <input type="number" name="pesoActual" value={formData.pesoActual} onChange={cambiar}
                    step="0.1" min="0" placeholder="Ej: 45.5" className={inp} />
                  <p className="text-xs text-amber-600 mt-1.5">Regístralo en el módulo de Pesaje.</p>
                </div>
              </div>
            </Seccion>

            {/* 3.5 — Ubicación: corral / lote */}
            <Seccion id="ubicacion" titulo="Ubicación (corral / lote)" icono={<Mountain className="w-4 h-4" />}
              color="teal" abierta={seccionAbierta === 'ubicacion'} onToggle={() => toggle('ubicacion')}
              completada={!!formData.idCorral}>
              <div>
                <label className={lbl}>Corral</label>
                <SelectPersonalizado valor={formData.idCorral}
                  onChange={v => cambiar({ target: { name: 'idCorral', value: v } })}
                  opciones={[
                    { value: '', label: 'Sin asignar', icono: <CloudOff />, colorFondo: 'bg-gray-100', colorIcono: 'text-gray-500' },
                    ...corralesDisponibles.filter(c => c.estado !== 'inactivo').map(c => ({
                      value: c.id,
                      label: `${c.nombre}${c.lote ? ' · ' + c.lote : ''} — ${TIPO_CORRAL_LABEL[c.tipo] || c.tipo}` +
                        (c.capacidadMaxima ? ` (${c.ocupacion}/${c.capacidadMaxima})` : ''),
                      icono: <Mountain />,
                      colorFondo: c.lleno ? 'bg-red-100' : 'bg-teal-100',
                      colorIcono: c.lleno ? 'text-red-600' : 'text-teal-600',
                    })),
                  ]}
                  placeholder={corralesDisponibles.length === 0 ? 'Sin corrales registrados' : 'Seleccionar corral...'} />
                <p className="text-xs text-gray-400 mt-1.5">
                  Según su peso, la cabra puede cambiar de corral. Hay corrales solo para gestantes o solo de ordeño.
                </p>

                {corralSeleccionado && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm text-teal-800 grid grid-cols-2 gap-2">
                      <div><span className="text-teal-600 text-xs">Tipo:</span> <strong>{TIPO_CORRAL_LABEL[corralSeleccionado.tipo] || corralSeleccionado.tipo}</strong></div>
                      <div><span className="text-teal-600 text-xs">Lote:</span> <strong>{corralSeleccionado.lote || '—'}</strong></div>
                      {corralSeleccionado.capacidadMaxima != null && (
                        <div><span className="text-teal-600 text-xs">Ocupación:</span> <strong>{corralSeleccionado.ocupacion}/{corralSeleccionado.capacidadMaxima}</strong></div>
                      )}
                      {(corralSeleccionado.pesoMinKg != null || corralSeleccionado.pesoMaxKg != null) && (
                        <div><span className="text-teal-600 text-xs">Rango peso:</span> <strong>{corralSeleccionado.pesoMinKg ?? 0}–{corralSeleccionado.pesoMaxKg ?? '∞'} kg</strong></div>
                      )}
                    </div>

                    {corralSeleccionado.lleno && (!cabraEditar || String(cabraEditar.idCorral) !== String(formData.idCorral)) && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Este corral está en su capacidad máxima.
                      </p>
                    )}
                    {corralSeleccionado.tipo === 'machos' && formData.sexo === 'hembra' && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Es un corral de machos y la cabra es hembra.
                      </p>
                    )}
                    {corralSeleccionado.tipo === 'gestante' && formData.sexo === 'macho' && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Es un corral de gestantes y el animal es macho.
                      </p>
                    )}
                    {formData.pesoActual && corralSeleccionado.pesoMaxKg != null && parseFloat(formData.pesoActual) > corralSeleccionado.pesoMaxKg && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> El peso supera el máximo recomendado del corral.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Seccion>

            {/* 4 — Estado */}
            <Seccion id="estado" titulo="Estado del animal" icono={<Activity className="w-4 h-4" />}
              color="amber" abierta={seccionAbierta === 'estado'} onToggle={() => toggle('estado')}
              completada={!!formData.estado}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Estado general</label>
                  <SelectPersonalizado valor={formData.estado}
                    onChange={v => cambiar({ target: { name: 'estado', value: v } })}
                    opciones={opcionesEstadoGeneral} placeholder="Seleccionar estado..." />
                </div>
                {formData.estado === 'muerto' && (
                  <div className="md:col-span-2">
                    <label className={lbl}>Motivo de muerte <span className="text-red-500">*</span></label>
                    <textarea name="motivoEstado" value={formData.motivoEstado} onChange={cambiar} rows="2"
                      placeholder="Ej: enfermedad, accidente, depredador, mortinato..."
                      className={`${inp} resize-none ${errores.motivoEstado ? 'border-red-300 focus:ring-red-400' : ''}`} />
                    <ErrMsg msg={errores.motivoEstado} />
                  </div>
                )}
                {(formData.estado === 'vendido' || formData.estado === 'donado' || formData.estado === 'descartado') && (
                  <div className="md:col-span-2">
                    <label className={lbl}>Motivo / detalle</label>
                    <textarea name="motivoEstado" value={formData.motivoEstado} onChange={cambiar} rows="2"
                      placeholder="Detalle del cambio de estado (comprador, motivo del descarte, etc.)"
                      className={`${inp} resize-none`} />
                  </div>
                )}
                {formData.sexo === 'hembra' && (
                  <div>
                    <label className={lbl}>Estado reproductivo</label>
                    <SelectPersonalizado valor={formData.estadoReproductivo}
                      onChange={v => cambiar({ target: { name: 'estadoReproductivo', value: v } })}
                      opciones={opcionesEstadoReproductivo} placeholder="Seleccionar..." />
                    <p className="text-xs text-amber-600 mt-1.5">Regístralo en el módulo de Reproducción.</p>
                  </div>
                )}
              </div>
            </Seccion>

            {/* 5 — Genealogía */}
            <Seccion id="genealogia" titulo="Genealogía" icono={<Dna className="w-4 h-4" />}
              color="teal" abierta={seccionAbierta === 'genealogia'} onToggle={() => toggle('genealogia')}
              completada={!!(formData.codigoPadre || formData.codigoMadre)}>
              <p className="text-xs text-amber-600 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Los vínculos padre/madre se gestionan en el módulo de <strong>Genealogía</strong> una vez guardado el animal. Aquí puedes anotar los códigos como referencia.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}><UsersIcon className="w-3.5 h-3.5 inline mr-1" />Código del padre</label>
                  <input name="codigoPadre" value={formData.codigoPadre} onChange={cambiar}
                    placeholder="Ej: CAB-M-001" className={inp} />
                </div>
                <div>
                  <label className={lbl}><UsersIcon className="w-3.5 h-3.5 inline mr-1" />Código de la madre</label>
                  <input name="codigoMadre" value={formData.codigoMadre} onChange={cambiar}
                    placeholder="Ej: CAB-H-002" className={inp} />
                </div>
              </div>
            </Seccion>

            {/* 6 — Observaciones */}
            <Seccion id="notas" titulo="Observaciones" icono={<FileText className="w-4 h-4" />}
              color="gray" abierta={seccionAbierta === 'notas'} onToggle={() => toggle('notas')}
              completada={!!formData.observaciones}>
              <textarea name="observaciones" value={formData.observaciones} onChange={cambiar} rows="4"
                placeholder="Características especiales, señas, comportamiento, antecedentes de salud..."
                className={`${inp} resize-none`} />
            </Seccion>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={onCancelar}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="flex-1 px-6 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                {guardando
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                  : <><Save className="w-4 h-4" /> {cabraEditar ? 'Guardar cambios' : 'Registrar cabra'}</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistroCabra;
