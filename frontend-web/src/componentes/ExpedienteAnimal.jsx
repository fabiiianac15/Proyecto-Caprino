import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, User, Heart, Syringe, Weight, Droplet, GitBranch,
  Plus, RefreshCw, AlertCircle, Calendar, Tag, TrendingUp, TrendingDown,
  Minus, Clock, Pill, AlertTriangle, X, Edit2, Eye, Trash2, Check,
  ChevronDown, ShieldAlert
} from 'lucide-react';
import {
  animalesAPI, produccionAPI, saludAPI, pesajeAPI, reproduccionAPI, genealogiaAPI, famachaAPI
} from '../servicios/caprino-api';
import { FormularioProduccion } from './ModuloProduccion';
import { FormularioSalud } from './ModuloSalud';
import { FormularioPeso } from './ModuloPeso';
import { FormMonta } from './ModuloReproduccion';

// ── Helpers ─────────────────────────────────────────────────────────────────

const calcEdad = (fecha) => {
  if (!fecha) return '—';
  const meses = Math.max(0,
    (new Date().getFullYear() - new Date(fecha).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(fecha).getMonth())
  );
  const años = Math.floor(meses / 12);
  const m = meses % 12;
  if (años === 0) return `${meses} mes${meses !== 1 ? 'es' : ''}`;
  return m > 0 ? `${años}a ${m}m` : `${años} año${años !== 1 ? 's' : ''}`;
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const turnoLabel = (t) => {
  const lower = (t || '').toLowerCase().trim();
  if (lower === 'tarde') return '2° ordeño · Tarde';
  if (lower === 'noche') return '3° ordeño · Noche';
  if (lower === 'total_dia') return 'Día completo';
  return '1° ordeño · Mañana';
};

// ── Componentes de UI compartidos ────────────────────────────────────────────

const TabBtn = ({ activo, onClick, color, icono, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
      ${activo ? `${color.text} ${color.border} bg-white` : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200'}`}
  >
    {icono}
    {label}
    {badge > 0 && (
      <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${activo ? color.badge : 'bg-gray-400'}`}>
        {badge}
      </span>
    )}
  </button>
);

const EstadoPanel = ({ cargando, error, vacio, iconoVacio, mensajeVacio, onReintentar, onNuevo, labelNuevo, colorNuevo, children }) => {
  if (cargando) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
      <span className="text-gray-500">Cargando...</span>
    </div>
  );
  if (error) return (
    <div className="text-center py-12">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="text-gray-600 mb-4">{error}</p>
      <button onClick={onReintentar} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">Reintentar</button>
    </div>
  );
  if (vacio) return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">{iconoVacio}</div>
      <p className="text-gray-500 font-medium mb-1">{mensajeVacio}</p>
      {onNuevo && (
        <button onClick={onNuevo}
          className={`mt-4 inline-flex items-center gap-2 px-4 py-2 ${colorNuevo} text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity`}>
          <Plus className="w-4 h-4" /> {labelNuevo}
        </button>
      )}
    </div>
  );
  return children;
};

const ModalForm = ({ titulo, onCerrar, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 relative">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">{titulo}</h3>
        <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[80vh]">{children}</div>
    </div>
  </div>
);

// ── Tab: Producción ──────────────────────────────────────────────────────────

const TabProduccion = ({ animal }) => {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const res = await produccionAPI.getByAnimal(animal.id);
      setDatos(res.data || []);
    } catch { setError('No se pudo cargar la producción.'); }
    finally { setCargando(false); }
  }, [animal.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalL = datos.reduce((s, r) => s + (parseFloat(r.litros) || 0), 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500"><span className="font-bold text-cyan-700 text-lg">{datos.length}</span> registros</span>
          <span className="text-gray-500"><span className="font-bold text-cyan-700 text-lg">{totalL.toFixed(1)}</span> L totales</span>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          {animal.sexo?.toLowerCase() === 'hembra' && (
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 shadow-sm">
              <Plus className="w-4 h-4" /> Nuevo ordeño
            </button>
          )}
        </div>
      </div>

      <EstadoPanel cargando={cargando} error={error} vacio={datos.length === 0}
        iconoVacio={<Droplet className="w-8 h-8 text-cyan-300" />}
        mensajeVacio="Sin registros de producción"
        onReintentar={cargar}
        onNuevo={animal.sexo?.toLowerCase() === 'hembra' ? () => setMostrarForm(true) : null}
        labelNuevo="Registrar primer ordeño" colorNuevo="bg-cyan-600">
        <div className="space-y-2">
          {datos.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3 bg-cyan-50 border border-cyan-100 rounded-xl">
              <Droplet className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{turnoLabel(r.turno)}</p>
                <p className="text-xs text-gray-500">{fmt(r.fechaProduccion)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-700">{parseFloat(r.litros).toFixed(2)} L</p>
                {r.grasaPorcentaje && <p className="text-xs text-gray-400">{r.grasaPorcentaje}% grasa</p>}
              </div>
            </div>
          ))}
        </div>
      </EstadoPanel>

      {mostrarForm && (
        <ModalForm titulo="Registrar Producción de Leche" onCerrar={() => setMostrarForm(false)}>
          <FormularioProduccion
            animalPreseleccionado={animal}
            onGuardar={() => { setMostrarForm(false); cargar(); }}
            onCancelar={() => setMostrarForm(false)}
          />
        </ModalForm>
      )}
    </>
  );
};

// ── Tab: Salud ───────────────────────────────────────────────────────────────

const colorTipoSalud = (tipo) => ({
  vacuna: 'bg-blue-100 text-blue-700',
  enfermedad: 'bg-red-100 text-red-700',
  tratamiento: 'bg-emerald-100 text-emerald-700',
})[tipo] || 'bg-gray-100 text-gray-700';

const TabSalud = ({ animal }) => {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoForm, setTipoForm] = useState('vacuna');

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const res = await saludAPI.getByAnimal(animal.id);
      const raw = res.data || [];
      setDatos(raw.map(r => ({
        id: r.id,
        tipo: r.tipoRegistro === 'diagnostico' ? 'enfermedad' : r.tipoRegistro,
        nombre: r.enfermedadDiagnostico || r.medicamentoProducto || '—',
        fecha: r.fechaAplicacion,
        proximaDosis: r.fechaProximaAplicacion,
        veterinario: r.veterinario,
        observaciones: r.observaciones,
      })));
    } catch { setError('No se pudo cargar la salud.'); }
    finally { setCargando(false); }
  }, [animal.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirForm = (tipo) => { setTipoForm(tipo); setMostrarForm(true); };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm"><span className="font-bold text-blue-700 text-lg">{datos.length}</span> eventos</span>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => abrirForm('vacuna')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> Vacuna
          </button>
          <button onClick={() => abrirForm('tratamiento')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm">
            <Plus className="w-4 h-4" /> Tratamiento
          </button>
          <button onClick={() => abrirForm('enfermedad')}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 shadow-sm">
            <Plus className="w-4 h-4" /> Enfermedad
          </button>
        </div>
      </div>

      <EstadoPanel cargando={cargando} error={error} vacio={datos.length === 0}
        iconoVacio={<Syringe className="w-8 h-8 text-blue-300" />}
        mensajeVacio="Sin eventos de salud registrados"
        onReintentar={cargar} onNuevo={() => abrirForm('vacuna')}
        labelNuevo="Registrar vacuna" colorNuevo="bg-blue-600">
        <div className="space-y-2">
          {datos.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.tipo === 'vacuna' ? 'bg-blue-100' : r.tipo === 'enfermedad' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {r.tipo === 'vacuna' ? <Syringe className="w-4 h-4 text-blue-500" /> :
                 r.tipo === 'enfermedad' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                 <Pill className="w-4 h-4 text-emerald-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colorTipoSalud(r.tipo)}`}>{r.tipo}</span>
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.nombre}</p>
                </div>
                <p className="text-xs text-gray-500">{fmt(r.fecha)}</p>
                {r.proximaDosis && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Próx. dosis: {fmt(r.proximaDosis)}
                  </p>
                )}
              </div>
              {r.veterinario && <p className="text-xs text-gray-400 shrink-0">{r.veterinario}</p>}
            </div>
          ))}
        </div>
      </EstadoPanel>

      {mostrarForm && (
        <ModalForm titulo={`Registrar ${tipoForm === 'vacuna' ? 'Vacuna' : tipoForm === 'tratamiento' ? 'Tratamiento' : 'Enfermedad'}`}
          onCerrar={() => setMostrarForm(false)}>
          <FormularioSalud
            tipo={tipoForm}
            animalPreseleccionado={animal}
            onGuardar={() => { setMostrarForm(false); cargar(); }}
            onCancelar={() => setMostrarForm(false)}
          />
        </ModalForm>
      )}
    </>
  );
};

// ── Tab: Pesaje ──────────────────────────────────────────────────────────────

const TabPesaje = ({ animal }) => {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const res = await pesajeAPI.getByAnimal(animal.id);
      setDatos(res.data || []);
    } catch { setError('No se pudo cargar los pesajes.'); }
    finally { setCargando(false); }
  }, [animal.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const ultimo = datos[0];
  const penultimo = datos[1];
  const delta = ultimo && penultimo
    ? parseFloat((parseFloat(ultimo.pesoKg) - parseFloat(penultimo.pesoKg)).toFixed(2))
    : null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          {ultimo && (
            <span className="text-gray-500">
              Último: <span className="font-bold text-violet-700 text-lg">{parseFloat(ultimo.pesoKg).toFixed(1)} kg</span>
            </span>
          )}
          {delta !== null && (
            <span className={`flex items-center gap-1 text-sm font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {delta > 0 ? <TrendingUp className="w-4 h-4" /> : delta < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {delta > 0 ? '+' : ''}{delta} kg vs anterior
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 shadow-sm">
            <Plus className="w-4 h-4" /> Registrar pesaje
          </button>
        </div>
      </div>

      <EstadoPanel cargando={cargando} error={error} vacio={datos.length === 0}
        iconoVacio={<Weight className="w-8 h-8 text-violet-300" />}
        mensajeVacio="Sin registros de peso"
        onReintentar={cargar} onNuevo={() => setMostrarForm(true)}
        labelNuevo="Registrar primer pesaje" colorNuevo="bg-violet-600">
        <div className="space-y-2">
          {datos.map((r, i) => {
            const prev = datos[i + 1];
            const dif = prev ? parseFloat((parseFloat(r.pesoKg) - parseFloat(prev.pesoKg)).toFixed(2)) : null;
            return (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl">
                <Weight className="w-5 h-5 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{fmt(r.fechaPesaje)}</p>
                  {r.condicionCorporal && <p className="text-xs text-gray-400">CC: {r.condicionCorporal}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-violet-700">{parseFloat(r.pesoKg).toFixed(1)} kg</p>
                  {dif !== null && (
                    <p className={`text-xs font-semibold ${dif > 0 ? 'text-emerald-600' : dif < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {dif > 0 ? '+' : ''}{dif} kg
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </EstadoPanel>

      {mostrarForm && (
        <ModalForm titulo="Registrar Pesaje" onCerrar={() => setMostrarForm(false)}>
          <FormularioPeso
            animalPreseleccionado={animal}
            onGuardar={() => { setMostrarForm(false); cargar(); }}
            onCancelar={() => setMostrarForm(false)}
          />
        </ModalForm>
      )}
    </>
  );
};

// ── Tab: Reproducción ────────────────────────────────────────────────────────

const TabReproduccion = ({ animal }) => {
  const [datos, setDatos] = useState([]);
  const [machos, setMachos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const [res, animRes] = await Promise.allSettled([
        reproduccionAPI.getByAnimal(animal.id),
        animalesAPI.getAll(),
      ]);
      if (res.status === 'fulfilled') setDatos(res.value.data || []);
      if (animRes.status === 'fulfilled') {
        setMachos((animRes.value.data || []).filter(a => a.sexo === 'macho'));
      }
    } catch { setError('No se pudo cargar la reproducción.'); }
    finally { setCargando(false); }
  }, [animal.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const resultadoColor = { gestacion: 'bg-pink-100 text-pink-700', vacio: 'bg-gray-100 text-gray-600', parto: 'bg-emerald-100 text-emerald-700', perdida: 'bg-red-100 text-red-700' };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm"><span className="font-bold text-pink-700 text-lg">{datos.length}</span> servicios</span>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          {animal.sexo === 'hembra' && (
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700 shadow-sm">
              <Plus className="w-4 h-4" /> Registrar monta
            </button>
          )}
        </div>
      </div>

      <EstadoPanel cargando={cargando} error={error} vacio={datos.length === 0}
        iconoVacio={<Heart className="w-8 h-8 text-pink-300" />}
        mensajeVacio={animal.sexo === 'hembra' ? 'Sin servicios reproductivos' : 'Sin eventos de reproducción'}
        onReintentar={cargar}
        onNuevo={animal.sexo === 'hembra' ? () => setMostrarForm(true) : null}
        labelNuevo="Registrar primera monta" colorNuevo="bg-pink-600">
        <div className="space-y-2">
          {datos.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl">
              <Heart className="w-5 h-5 text-pink-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{r.tipoServicio?.replace('_', ' ') || 'Servicio'}</p>
                <p className="text-xs text-gray-500">{fmt(r.fechaServicio)}</p>
                {r.codigoMacho && <p className="text-xs text-gray-400">Macho: {r.nombreMacho || r.codigoMacho}</p>}
              </div>
              <div className="text-right space-y-1">
                {r.resultado && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${resultadoColor[r.resultado] || 'bg-gray-100 text-gray-600'}`}>
                    {r.resultado}
                  </span>
                )}
                {r.fechaPartoEstimada && <p className="text-xs text-gray-400">Parto est.: {fmt(r.fechaPartoEstimada)}</p>}
                {r.fechaPartoReal && <p className="text-xs text-emerald-600 font-medium">Parto: {fmt(r.fechaPartoReal)}</p>}
              </div>
            </div>
          ))}
        </div>
      </EstadoPanel>

      {mostrarForm && (
        <ModalForm titulo="Registrar Monta / Servicio" onCerrar={() => setMostrarForm(false)}>
          <FormMonta
            hembras={[]}
            machos={machos}
            animalPreseleccionado={animal}
            onGuardar={() => { setMostrarForm(false); cargar(); }}
            onCancelar={() => setMostrarForm(false)}
          />
        </ModalForm>
      )}
    </>
  );
};

// ── Tab: Genealogía ──────────────────────────────────────────────────────────

const NodoGen = ({ animal: nodo, rol, color }) => {
  if (!nodo) return (
    <div className={`border-2 border-dashed rounded-xl p-3 min-w-[140px] flex flex-col items-center justify-center opacity-40 ${color.border}`}>
      <User className={`w-5 h-5 ${color.icon} mb-1`} />
      <span className={`text-[10px] font-semibold uppercase ${color.text}`}>{rol} no registrado</span>
    </div>
  );
  return (
    <div className={`border-2 ${color.border} ${color.bg} rounded-xl p-3 min-w-[140px]`}>
      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white ${color.badge} mb-1.5 block w-fit`}>{rol}</span>
      <p className={`text-xs font-bold ${color.text}`}>{nodo.codigo}</p>
      <p className="text-xs text-gray-600 truncate">{nodo.nombre}</p>
      {nodo.raza && <p className="text-[10px] text-gray-400 truncate">{nodo.raza || ''}</p>}
    </div>
  );
};

const TabGenealogia = ({ animal }) => {
  const [gen, setGen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const res = await genealogiaAPI.getByAnimal(animal.id);
      setGen(res?.data ?? null);
    } catch { setError('No se pudo cargar la genealogía.'); }
    finally { setCargando(false); }
  }, [animal.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const padre = gen?.padre;
  const madre = gen?.madre;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm">Árbol genealógico (1 generación)</span>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/genealogia')}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 shadow-sm">
            <GitBranch className="w-4 h-4" /> Ver árbol completo
          </button>
        </div>
      </div>

      <EstadoPanel cargando={cargando} error={error} vacio={false} onReintentar={cargar}>
        <div className="flex flex-col items-center gap-4">
          {/* Generación 1: Padre y Madre */}
          <div className="flex gap-8 justify-center">
            <NodoGen animal={padre} rol="Padre"
              color={{ border: 'border-blue-300', bg: 'bg-blue-50', badge: 'bg-blue-500', text: 'text-blue-800', icon: 'text-blue-300' }} />
            <NodoGen animal={madre} rol="Madre"
              color={{ border: 'border-pink-300', bg: 'bg-pink-50', badge: 'bg-pink-500', text: 'text-pink-800', icon: 'text-pink-300' }} />
          </div>
          {/* Conector */}
          <div className="w-0.5 h-6 bg-gray-200" />
          {/* Generación 0: Animal principal */}
          <div className="border-2 border-teal-400 bg-teal-50 rounded-xl p-4 min-w-[160px] text-center">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white bg-teal-500 mb-1.5 block w-fit mx-auto">Animal</span>
            <p className="text-sm font-bold text-teal-800">{animal.codigo}</p>
            <p className="text-xs text-gray-600">{animal.nombre}</p>
          </div>
          {(!padre && !madre) && (
            <p className="text-sm text-gray-400 text-center mt-2">
              Sin progenitores registrados. Usa el módulo{' '}
              <button onClick={() => navigate('/genealogia')} className="text-teal-600 underline font-medium">Genealogía</button>
              {' '}para vincularlos.
            </p>
          )}
        </div>
      </EstadoPanel>
    </>
  );
};

// ── Tab: FAMACHA ─────────────────────────────────────────────────────────────

const FAMACHA_INFO = [
  { score: 1, label: 'Rojo',         bg: 'bg-red-600',    text: 'text-white',      accion: 'Sin tratamiento',       nivel: 'ok'      },
  { score: 2, label: 'Rojo-Rosa',    bg: 'bg-rose-400',   text: 'text-white',      accion: 'Sin tratamiento',       nivel: 'ok'      },
  { score: 3, label: 'Rosa',         bg: 'bg-pink-400',   text: 'text-white',      accion: 'Monitorear',            nivel: 'warn'    },
  { score: 4, label: 'Rosa-Blanco',  bg: 'bg-pink-200',   text: 'text-pink-900',   accion: 'Desparasitar',          nivel: 'danger'  },
  { score: 5, label: 'Blanco',       bg: 'bg-gray-100',   text: 'text-gray-700',   accion: 'Tratar urgentemente',   nivel: 'urgent'  },
];

const famachaColor = (score) => FAMACHA_INFO.find(f => f.score === score) || FAMACHA_INFO[0];

const nivelBadge = (nivel) => ({
  ok:     'bg-emerald-100 text-emerald-700',
  warn:   'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  urgent: 'bg-red-200 text-red-900 font-bold',
})[nivel] || 'bg-gray-100 text-gray-700';

const FormFamacha = ({ animal, onGuardar, onCancelar }) => {
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    fechaEvaluacion: hoy,
    puntuacion: '',
    ojoEvaluado: 'ambos',
    tratamientoAplicado: false,
    medicamento: '',
    proximaEvaluacion: '',
    observaciones: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const info = form.puntuacion ? famachaColor(Number(form.puntuacion)) : null;

  const proximaSugerida = (score) => {
    const d = new Date();
    d.setDate(d.getDate() + (score >= 4 ? 14 : 28));
    return d.toISOString().split('T')[0];
  };

  const seleccionarScore = (s) => {
    setForm(p => ({
      ...p,
      puntuacion: s,
      proximaEvaluacion: proximaSugerida(s),
      tratamientoAplicado: s >= 4,
    }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.puntuacion) { setError('Selecciona una puntuación FAMACHA.'); return; }
    setGuardando(true); setError('');
    try {
      await famachaAPI.create({
        idAnimal: animal.id,
        fechaEvaluacion: form.fechaEvaluacion,
        puntuacion: Number(form.puntuacion),
        ojoEvaluado: form.ojoEvaluado,
        tratamientoAplicado: form.tratamientoAplicado,
        medicamento: form.medicamento || null,
        proximaEvaluacion: form.proximaEvaluacion || null,
        observaciones: form.observaciones || null,
      });
      onGuardar();
    } catch (err) {
      setError(err.message || 'Error al guardar.');
    } finally { setGuardando(false); }
  };

  const inp2 = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white';
  const lbl2 = 'block text-sm font-medium text-gray-600 mb-1.5';

  return (
    <form onSubmit={enviar} className="space-y-5">
      {/* Selector de puntuación visual */}
      <div>
        <label className={lbl2}>Puntuación FAMACHA <span className="text-red-500">*</span></label>
        <p className="text-xs text-gray-400 mb-3">Observa el color de la conjuntiva ocular del animal y selecciona el que más se asemeje.</p>
        <div className="grid grid-cols-5 gap-2">
          {FAMACHA_INFO.map(f => (
            <button key={f.score} type="button" onClick={() => seleccionarScore(f.score)}
              className={`relative rounded-xl border-2 p-2.5 transition-all cursor-pointer ${
                form.puntuacion === f.score
                  ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'}`}>
              <div className={`w-full h-9 rounded-lg ${f.bg} mb-2 flex items-center justify-center border border-black/10 shadow-inner`}>
                {form.puntuacion === f.score
                  ? <Check className={`w-5 h-5 drop-shadow ${f.score >= 4 ? 'text-gray-700' : 'text-white'}`} />
                  : null}
              </div>
              <p className="text-xs font-black text-gray-800 text-center leading-none">{f.score}</p>
              <p className="text-[10px] text-gray-500 text-center leading-tight mt-0.5">{f.label}</p>
            </button>
          ))}
        </div>
        {info && (
          <div className={`mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold ${nivelBadge(info.nivel)}`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Score {info.score} · {info.label} → <span className="font-bold">{info.accion}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl2}>Fecha de evaluación</label>
          <input type="date" value={form.fechaEvaluacion} max={hoy}
            onChange={e => setForm(p => ({ ...p, fechaEvaluacion: e.target.value }))} className={inp2} />
        </div>
        <div>
          <label className={lbl2}>Ojo evaluado</label>
          <select value={form.ojoEvaluado} onChange={e => setForm(p => ({ ...p, ojoEvaluado: e.target.value }))} className={inp2}>
            <option value="ambos">Ambos ojos</option>
            <option value="derecho">Ojo derecho</option>
            <option value="izquierdo">Ojo izquierdo</option>
          </select>
        </div>
        <div>
          <label className={lbl2}>Próxima evaluación sugerida</label>
          <input type="date" value={form.proximaEvaluacion}
            onChange={e => setForm(p => ({ ...p, proximaEvaluacion: e.target.value }))} className={inp2} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.tratamientoAplicado}
              onChange={e => setForm(p => ({ ...p, tratamientoAplicado: e.target.checked }))}
              className="w-4 h-4 text-orange-500 rounded" />
            <span>¿Se aplicó tratamiento?</span>
          </label>
        </div>
      </div>

      {form.tratamientoAplicado && (
        <div>
          <label className={lbl2}>Medicamento / Antihelmíntico aplicado</label>
          <input type="text" value={form.medicamento} placeholder="Ej: Ivermectina 1%, Albendazol..."
            onChange={e => setForm(p => ({ ...p, medicamento: e.target.value }))} className={inp2} />
        </div>
      )}

      <div>
        <label className={lbl2}>Observaciones</label>
        <textarea value={form.observaciones} rows="2" placeholder="Condición general, signos adicionales..."
          onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
          className={`${inp2} resize-none`} />
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancelar}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="flex-1 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Registrar evaluación'}
        </button>
      </div>
    </form>
  );
};

const TabFamacha = ({ animal }) => {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const res = await famachaAPI.getByAnimal(animal.id);
      setDatos(res.data || []);
    } catch {
      setDatos([]);
    }
    finally { setCargando(false); }
  }, [animal.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const ultimo = datos[0];
  const ultimoInfo = ultimo ? famachaColor(Number(ultimo.puntuacion)) : null;

  return (
    <>
      {/* Guía de referencia FAMACHA */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5">
        <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> Guía de referencia — Color conjuntiva ocular
        </p>
        <div className="grid grid-cols-5 gap-2">
          {FAMACHA_INFO.map(f => (
            <div key={f.score} className="text-center">
              <div className={`h-6 rounded-lg ${f.bg} mb-1.5 border border-black/10`} />
              <p className="text-xs font-black text-gray-700">{f.score}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{f.label}</p>
              <p className={`text-[9px] font-semibold mt-0.5 px-1 py-0.5 rounded-full ${nivelBadge(f.nivel)}`}>{f.accion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Header con último score y botón */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {!cargando && ultimoInfo ? (
            <>
              <div className={`w-10 h-10 rounded-xl ${ultimoInfo.bg} flex items-center justify-center border border-black/10`}>
                <span className={`text-lg font-black ${ultimoInfo.text}`}>{ultimoInfo.score}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Último: {ultimoInfo.label}</p>
                <p className="text-xs text-gray-500">{fmt(ultimo.fechaEvaluacion)} · {datos.length} evaluaciones</p>
              </div>
            </>
          ) : !cargando ? (
            <p className="text-sm text-gray-500">{datos.length} evaluaciones registradas</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 shadow-sm">
            <Plus className="w-4 h-4" /> Nueva evaluación
          </button>
        </div>
      </div>

      <EstadoPanel cargando={cargando} error={error} vacio={datos.length === 0}
        iconoVacio={<Eye className="w-8 h-8 text-orange-300" />}
        mensajeVacio="Sin evaluaciones FAMACHA registradas"
        onReintentar={cargar} onNuevo={() => setMostrarForm(true)}
        labelNuevo="Primera evaluación" colorNuevo="bg-orange-500">
        <div className="space-y-2">
          {datos.map(r => {
            const info = famachaColor(Number(r.puntuacion));
            return (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className={`w-9 h-9 rounded-xl ${info.bg} flex items-center justify-center shrink-0 border border-black/10`}>
                  <span className={`text-base font-black ${info.text}`}>{info.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{info.label}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${nivelBadge(info.nivel)}`}>{info.accion}</span>
                  </div>
                  <p className="text-xs text-gray-500">{fmt(r.fechaEvaluacion)}{r.ojoEvaluado ? ` · Ojo ${r.ojoEvaluado}` : ''}</p>
                  {r.tratamientoAplicado && <p className="text-xs text-emerald-600 font-medium mt-0.5">✓ Tratamiento aplicado{r.medicamento ? `: ${r.medicamento}` : ''}</p>}
                  {r.proximaEvaluacion && <p className="text-xs text-amber-600 mt-0.5">Próx. evaluación: {fmt(r.proximaEvaluacion)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </EstadoPanel>

      {mostrarForm && (
        <ModalForm titulo="Nueva Evaluación FAMACHA" onCerrar={() => setMostrarForm(false)}>
          <FormFamacha
            animal={animal}
            onGuardar={() => { setMostrarForm(false); cargar(); }}
            onCancelar={() => setMostrarForm(false)}
          />
        </ModalForm>
      )}
    </>
  );
};

// ── Componente principal: ExpedienteAnimal ───────────────────────────────────

const TABS = [
  { id: 'produccion',  label: 'Producción',  icono: <Droplet className="w-4 h-4" />,      color: { text: 'text-cyan-700',   border: 'border-cyan-500',   badge: 'bg-cyan-500'   } },
  { id: 'salud',       label: 'Salud',        icono: <Syringe className="w-4 h-4" />,      color: { text: 'text-blue-700',   border: 'border-blue-500',   badge: 'bg-blue-500'   } },
  { id: 'pesaje',      label: 'Pesaje',       icono: <Weight className="w-4 h-4" />,       color: { text: 'text-violet-700', border: 'border-violet-500', badge: 'bg-violet-500' } },
  { id: 'reproduccion',label: 'Reproducción', icono: <Heart className="w-4 h-4" />,       color: { text: 'text-pink-700',   border: 'border-pink-500',   badge: 'bg-pink-500'   } },
  { id: 'famacha',     label: 'FAMACHA',      icono: <Eye className="w-4 h-4" />,         color: { text: 'text-orange-700', border: 'border-orange-500', badge: 'bg-orange-500' } },
  { id: 'genealogia',  label: 'Genealogía',   icono: <GitBranch className="w-4 h-4" />,   color: { text: 'text-teal-700',   border: 'border-teal-500',   badge: 'bg-teal-500'   } },
];

const ExpedienteAnimal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [cargandoAnimal, setCargandoAnimal] = useState(true);
  const [errorAnimal, setErrorAnimal] = useState(null);
  const [tabActivo, setTabActivo] = useState('produccion');

  useEffect(() => {
    const cargar = async () => {
      setCargandoAnimal(true); setErrorAnimal(null);
      try {
        const res = await animalesAPI.getById(id);
        const data = res.data || res;
        setAnimal(data);
      } catch { setErrorAnimal('No se pudo cargar el animal.'); }
      finally { setCargandoAnimal(false); }
    };
    cargar();
  }, [id]);

  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/animales');
  };

  if (cargandoAnimal) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mr-3" />
      <span className="text-gray-500">Cargando expediente...</span>
    </div>
  );

  if (errorAnimal || !animal) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="text-gray-700 mb-4">{errorAnimal || 'Animal no encontrado.'}</p>
      <button onClick={volver} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Volver</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ── Cabecera del expediente ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
        {/* Banda de color según sexo */}
        <div className={`h-2 ${animal.sexo === 'macho' ? 'bg-blue-400' : 'bg-pink-400'}`} />

        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Foto */}
          <div className="w-full md:w-36 h-36 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
            {animal.fotoUrl ? (
              <img src={animal.fotoUrl} alt={animal.nombre} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <User className="w-14 h-14 text-gray-300" />
            )}
          </div>

          {/* Datos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{animal.nombre || <span className="text-gray-400 italic font-normal">Sin nombre</span>}</h1>
                <p className="text-sm font-mono text-gray-500 mt-0.5">{animal.codigo || animal.codigoIdentificacion}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${animal.sexo === 'macho' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                  {animal.sexo === 'macho' ? '♂ Macho' : '♀ Hembra'}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${animal.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {animal.estado || 'activo'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: <Tag className="w-3.5 h-3.5" />, label: 'Raza', value: animal.nombreRaza || animal.raza || '—' },
                { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Edad', value: calcEdad(animal.fechaNacimiento) },
                { icon: <Weight className="w-3.5 h-3.5" />, label: 'Peso nac.', value: animal.pesoNacimiento ? `${animal.pesoNacimiento} kg` : '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex md:flex-col gap-2 shrink-0">
            <button onClick={volver}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <button onClick={() => navigate(`/animales?editar=${id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors">
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>

        {animal.observaciones && (
          <div className="px-6 pb-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              <span className="font-semibold text-amber-700">Observaciones: </span>{animal.observaciones}
            </div>
          </div>
        )}
      </div>

      {/* ── Pestañas ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Barra de pestañas */}
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max px-2">
            {TABS.map(tab => (
              <TabBtn key={tab.id} activo={tabActivo === tab.id}
                onClick={() => setTabActivo(tab.id)}
                color={tab.color} icono={tab.icono} label={tab.label} />
            ))}
          </div>
        </div>

        {/* Contenido del panel activo */}
        <div className="p-6">
          {tabActivo === 'produccion'   && <TabProduccion   animal={animal} />}
          {tabActivo === 'salud'        && <TabSalud        animal={animal} />}
          {tabActivo === 'pesaje'       && <TabPesaje       animal={animal} />}
          {tabActivo === 'reproduccion' && <TabReproduccion animal={animal} />}
          {tabActivo === 'famacha'      && <TabFamacha      animal={animal} />}
          {tabActivo === 'genealogia'   && <TabGenealogia   animal={animal} />}
        </div>
      </div>
    </div>
  );
};

export default ExpedienteAnimal;
