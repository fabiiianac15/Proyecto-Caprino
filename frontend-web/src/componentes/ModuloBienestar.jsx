import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart, Plus, ArrowLeft, ArrowRight, RefreshCw, Trash2, Eye, FileText, Edit2, Camera, X, ImageOff,
  Droplets, PawPrint, ClipboardList, CheckCircle, AlertTriangle, Sparkles, ChevronDown, Users, Save, Info,
  Image as ImageIcon, Home, Calculator, ShieldCheck, Flag, Shuffle, BadgeCheck, Scale,
} from 'lucide-react';
import { bienestarAPI } from '../servicios/caprino-api';
import ControlLetra from './ControlLetra';
import {
  TABLA_MUESTRA, filaTabla, muestraMinima, GRUPOS_EDAD, repartirMuestra, sortearMuestra,
  ESTADOS_DOC, DOCUMENTOS_ICA, docVacio, avisosDoc, TABLA_CLASIFICACION, clasificar,
} from '../utilidades/meba';

// Campos y textos con letra cómoda de leer en el campo
const inp = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const inpSm = 'w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const lbl = 'block text-base font-semibold text-gray-700 mb-2';
const tarjeta = 'bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm';

const PESOS = { RECURSOS: 0.35, ANIMAL: 0.55, GESTION: 0.10 };
const GRUPOS = [
  { key: 'RECURSOS', titulo: 'Recursos', peso: '35 %', icono: Droplets,      ayuda: 'Instalaciones: agua, comida, comederos, sombra, corrales y piso. Se revisan recorriendo toda la granja.' },
  { key: 'ANIMAL',   titulo: 'Animal',   peso: '55 %', icono: PawPrint,      ayuda: 'Se revisan las cabras de la muestra una por una: gordura, heridas, parásitos, cojeras… Es lo que más pesa en la nota.' },
  { key: 'GESTION',  titulo: 'Gestión',  peso: '10 %', icono: ClipboardList, ayuda: 'Papeles y registros de la granja: mortalidad, medicamentos, plan sanitario. Se piden al encargado.' },
];
const PASOS = [
  { key: 'GRANJA',   titulo: 'Granja',      icono: Home },
  { key: 'MUESTRA',  titulo: 'Muestra',     icono: Calculator },
  { key: 'DOCS',     titulo: 'RSPP y ASI',  icono: ShieldCheck },
  { key: 'RECURSOS', titulo: 'Recursos',    icono: Droplets },
  { key: 'ANIMAL',   titulo: 'Animal',      icono: PawPrint },
  { key: 'GESTION',  titulo: 'Gestión',     icono: ClipboardList },
  { key: 'CIERRE',   titulo: 'Cierre',      icono: Flag },
];
const TIPOS_PRODUCTOR = {
  FAMILIAR:       { label: 'Familiar',                    ayuda: 'Hasta 30 animales, amarrados o sueltos cerca de la casa, con un corral pequeño para dormir.' },
  EXTENSIVO:      { label: 'Extensivo (semi-estabulado)', ayuda: 'Pastan en potreros, orillas de caminos o lomas; hasta unos 300 animales.' },
  SEMI_INTENSIVO: { label: 'Semi-intensivo',              ayuda: 'Pastan de día y se encierran de noche; reciben concentrado o forraje.' },
  INTENSIVO:      { label: 'Intensivo',                   ayuda: 'Siempre encerradas (estabuladas), sin salir a pastorear.' },
};
const GLOSARIO = [
  ['Muestra', 'Las cabras que se revisan una por una. El sistema dice cuántas según el total del hato (Tabla 1 del ICA).'],
  ['Condición corporal', 'Qué tan gorda o flaca está la cabra, de 1 (muy flaca) a 5 (muy gorda). Lo ideal es 3 o 4.'],
  ['FAMACHA', 'Se baja el párpado de abajo y se mira el color: rosado fuerte (1-2) está bien; pálido indica anemia por parásitos.'],
  ['Ectoparásitos', 'Bichos por fuera del cuerpo: garrapatas, nuches, tábanos, piojos.'],
  ['Nuche', 'Larva de mosca que vive debajo de la piel y forma un bulto con un huequito.'],
  ['Miasis', 'Gusanera: herida con gusanos.'],
  ['Mastitis clínica', 'Ubre inflamada, caliente o dura, o leche con grumos, sangre o pus.'],
  ['Estrés térmico', 'Calor: jadea, babea, come menos. Frío: se amontonan unas contra otras.'],
  ['Topizado / descorne', 'Quitar o impedir que crezcan los cuernos.'],
  ['Confinamiento', 'Cuando las cabras están encerradas en corral o establo.'],
  ['MV / MVZ', 'Médico veterinario / médico veterinario zootecnista con tarjeta profesional.'],
  ['BPUMV', 'Buenas prácticas en el uso de medicamentos: con registro ICA, recetados por veterinario, no vencidos y bien guardados.'],
  ['RSPP', 'Registro Sanitario de Predio Pecuario: la inscripción de la granja ante el ICA.'],
  ['ASI', 'Autorización Sanitaria y de Inocuidad: permiso del ICA que garantiza que la leche o la carne de la granja son seguras.'],
];
const PUNTAJES = [100, 55, 20, 0];
const SIGNIFICADO_PUNTAJE = { 100: 'Muy bien', 55: 'Aceptable', 20: 'Con fallas', 0: 'Mal' };

const COLOR_CLASIF = {
  EXCELENTE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  ALTO:      'bg-sky-100 text-sky-800 border-sky-300',
  MEDIO:     'bg-amber-100 text-amber-800 border-amber-300',
  BAJO:      'bg-red-100 text-red-800 border-red-300',
};
const COLOR_PUNTAJE = {
  100: 'bg-emerald-100 text-emerald-800', 55: 'bg-sky-100 text-sky-800',
  20: 'bg-amber-100 text-amber-800', 0: 'bg-red-100 text-red-800',
};
const COLOR_ESTADO = {
  emerald: 'bg-emerald-600 text-white border-emerald-600',
  amber: 'bg-amber-500 text-white border-amber-500',
  red: 'bg-red-600 text-white border-red-600',
  gray: 'bg-gray-600 text-white border-gray-600',
};

const hoy = () => new Date().toISOString().slice(0, 10);
const cabVacia = () => ({
  fechaEvaluacion: hoy(), tipoProductor: 'EXTENSIVO', numAnimales: '', tamanoMuestra: '',
  evaluadores: '', observaciones: '',
  inventario: { CRIAS: '', JOVENES: '', ADULTOS: '' },
  porGrupo: { CRIAS: 0, JOVENES: 0, ADULTOS: 0 },
  animalesMuestra: [],
  rspp: docVacio(), asi: docVacio(),
});

const nivelesDe = (ind) => {
  const n = PUNTAJES.filter((p) => ind.criterios?.[p]);
  return n.length ? n : PUNTAJES;
};

const porcentaje = (v) => (v.nEvaluados > 0 && v.nHallazgo !== '' && v.nHallazgo != null
  ? Math.round((Number(v.nHallazgo) / Number(v.nEvaluados)) * 1000) / 10 : null);

// Puntaje según el conteo y los cortes de la tabla del PDF:
//  CUMPLE   -> % que cumple:   100 si % > corte100 (corte 100 = todos), luego 55, 20, si no 0
//  HALLAZGO -> % con problema: 100 si % < corte100 (corte 0 = ninguno), luego 55, 20, si no 0
const puntajeMuestreo = (ind, v) => {
  const pct = porcentaje(v);
  if (!ind.medicion || pct === null || pct > 100) return null;
  for (const p of [100, 55, 20]) {
    const c = ind.cortes?.[p];
    if (c == null) continue;
    const ok = ind.medicion === 'CUMPLE'
      ? (c >= 100 ? pct >= 100 : pct > c)
      : (c <= 0 ? pct <= 0 : pct < c);
    if (ok) return p;
  }
  return 0;
};

// Cálculo en vivo (mismo modelo que BienestarService del backend)
const calcular = (catalogo, valores, rspp, asi) => {
  const sumas = { RECURSOS: 0, ANIMAL: 0, GESTION: 0 };
  const conteo = { RECURSOS: 0, ANIMAL: 0, GESTION: 0 };
  let sinCalificar = 0;
  catalogo.forEach((ind) => {
    const v = valores[ind.idIndicador];
    if (!v || !v.aplica) return;
    if (v.puntaje == null) { sinCalificar += 1; return; }
    sumas[ind.tipoMedida] += v.puntaje;
    conteo[ind.tipoMedida] += 1;
  });
  const prom = {};
  Object.keys(sumas).forEach((g) => {
    prom[g] = conteo[g] > 0 ? Math.round((sumas[g] / conteo[g]) * 100) / 100 : null;
  });
  let acum = 0, pesoUsado = 0;
  Object.entries(PESOS).forEach(([g, p]) => {
    if (prom[g] !== null) { acum += prom[g] * p; pesoUsado += p; }
  });
  const total = pesoUsado > 0 ? Math.round((acum / pesoUsado) * 100) / 100 : 0;
  const pendientes = catalogo.filter((ind) => {
    const v = valores[ind.idIndicador];
    return v && v.aplica && v.puntaje != null && v.puntaje < 100;
  });
  return { prom, total, clasificacion: clasificar(total, rspp, asi), pendientes, sinCalificar };
};

// Imagen protegida: se descarga con el token y se muestra como blob.
const FotoProtegida = ({ idFoto, alt, className = 'w-20 h-20', onClick }) => {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let url;
    const token = localStorage.getItem('token');
    fetch(bienestarAPI.urlFoto(idFoto), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => { url = URL.createObjectURL(b); setSrc(url); })
      .catch(() => setErr(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [idFoto]);
  if (err) return <div className={`${className} flex items-center justify-center bg-gray-50 rounded-xl text-gray-300`}><ImageOff className="w-5 h-5" /></div>;
  if (!src) return <div className={`${className} flex items-center justify-center bg-gray-50 rounded-xl`}><RefreshCw className="w-4 h-4 animate-spin text-gray-300" /></div>;
  return <img src={src} alt={alt} onClick={() => onClick?.(src)} className={`${className} object-cover rounded-xl ${onClick ? 'cursor-zoom-in' : ''}`} />;
};

const GaleriaFotos = ({ guardadas = [], pendientes = [], onAgregar, onQuitarPendiente, onEliminarGuardada, onVer }) => (
  <div className="flex items-center gap-3 flex-wrap">
    {guardadas.map((f) => (
      <div key={f.idFoto} className="relative group">
        <FotoProtegida idFoto={f.idFoto} alt={f.descripcion || 'Evidencia'} className="w-20 h-20" onClick={onVer} />
        {onEliminarGuardada && (
          <button type="button" onClick={() => onEliminarGuardada(f)} title="Eliminar foto"
            className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    ))}
    {pendientes.map((p, i) => (
      <div key={p.url} className="relative">
        <img src={p.url} alt="Pendiente" className="w-20 h-20 object-cover rounded-xl ring-2 ring-amber-300" title="Se subirá al guardar" />
        <button type="button" onClick={() => onQuitarPendiente(i)} title="Quitar"
          className="absolute -top-2 -right-2 w-7 h-7 bg-gray-700 text-white rounded-full flex items-center justify-center shadow">
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
    {onAgregar && (
      <>
        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer text-sm">
          <Camera className="w-6 h-6" />
          Cámara
          <input type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { onAgregar(Array.from(e.target.files || [])); e.target.value = ''; }} />
        </label>
        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer text-sm">
          <ImageIcon className="w-6 h-6" />
          Galería
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { onAgregar(Array.from(e.target.files || [])); e.target.value = ''; }} />
        </label>
      </>
    )}
  </div>
);

const Visor = ({ src, onCerrar }) => src ? (
  <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
    <img src={src} alt="Evidencia" className="max-w-full max-h-full rounded-lg" />
    <button onClick={onCerrar} className="absolute top-4 right-4 text-white"><X className="w-8 h-8" /></button>
  </div>
) : null;

// Tabla 1 del ICA con la fila que aplica resaltada
const TablaMuestra = ({ total, compacta = false }) => {
  const fila = filaTabla(total);
  return (
    <div className="overflow-hidden rounded-xl border-2 border-gray-200">
      <table className={`w-full ${compacta ? 'text-sm' : 'text-base'}`}>
        <thead className="bg-emerald-700 text-white">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Número total de cabras en la granja</th>
            <th className="text-left px-4 py-3 font-semibold">Cabras a revisar (muestra)</th>
          </tr>
        </thead>
        <tbody>
          {TABLA_MUESTRA.map((f, k) => (
            <tr key={f.texto} className={k === fila ? 'bg-emerald-100 font-bold text-emerald-900' : k % 2 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-4 py-2.5">{k === fila && <span className="mr-2" aria-hidden="true">▶</span>}{f.texto}</td>
              <td className="px-4 py-2.5">{f.muestra}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2 border-t border-gray-200">Tabla 1 de la guía MEBA del ICA (v3.0, 2026), numeral 4.4.</p>
    </div>
  );
};

const NombreAnimal = ({ a }) => (a ? <>{a.codigo}{a.nombre ? ` · ${a.nombre}` : ''}</> : null);

const ModuloBienestar = () => {
  const [vista, setVista] = useState('lista'); // lista | form | detalle
  const [cargando, setCargando] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visor, setVisor] = useState(null);

  // estado del formulario
  const [paso, setPaso] = useState(0);
  const [idEditando, setIdEditando] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [valores, setValores] = useState({});
  const [cab, setCab] = useState(cabVacia());
  const [inventarioSis, setInventarioSis] = useState(null); // {totalAnimales, grupos, sinFecha, animales}
  const [fotosGuardadas, setFotosGuardadas] = useState([]);
  const [fotosGenerales, setFotosGenerales] = useState([]);
  const [fotosDocs, setFotosDocs] = useState({ RSPP: [], ASI: [] }); // pendientes del certificado
  const [abiertos, setAbiertos] = useState({});
  const [guardando, setGuardando] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => { cargarLista(); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [paso, vista]);

  const cargarLista = async () => {
    setCargando(true);
    try {
      const r = await bienestarAPI.getAll();
      setEvaluaciones(r.data);
    } catch (e) { setError(e.message || 'No se pudo cargar la lista'); }
    finally { setCargando(false); }
  };

  const animalesPorId = useMemo(
    () => Object.fromEntries((inventarioSis?.animales || []).map((a) => [a.id, a])),
    [inventarioSis]
  );

  const confinamientoNoAplica = (tipoProd) => tipoProd === 'FAMILIAR' || tipoProd === 'EXTENSIVO';

  const valorVacio = (ind, tipoProd, sug) => {
    const v = {
      puntaje: null,
      aplica: !(ind.soloConfinamiento && confinamientoNoAplica(tipoProd)),
      soporteDoc: '', observacion: '',
      nEvaluados: sug?.nEvaluados ?? '', nHallazgo: sug?.nHallazgo ?? '',
      info: sug?.info || null, pendientes: [],
    };
    v.puntaje = puntajeMuestreo(ind, v);
    return v;
  };

  const limpiarFormulario = () => {
    setFotosGuardadas([]); setFotosGenerales([]); setFotosDocs({ RSPP: [], ASI: [] });
    setAbiertos({}); setPaso(0); setError(''); setAviso('');
  };

  const iniciarNueva = async () => {
    setCargando(true);
    try {
      const [cat, sug] = await Promise.all([
        bienestarAPI.getCatalogo('CAPRINO'),
        bienestarAPI.getSugerencias().catch(() => ({})),
      ]);
      const nueva = cabVacia();
      const inv = sug._INVENTARIO;
      if (inv?.totalAnimales > 0) {
        nueva.numAnimales = String(inv.totalAnimales);
        nueva.tamanoMuestra = String(muestraMinima(inv.totalAnimales));
        nueva.inventario = Object.fromEntries(GRUPOS_EDAD.map((g) => [g.key, String(inv.grupos?.[g.key] ?? 0)]));
        nueva.porGrupo = repartirMuestra(nueva.inventario, nueva.tamanoMuestra);
      }
      const init = {};
      cat.forEach((ind) => { init[ind.idIndicador] = valorVacio(ind, nueva.tipoProductor, sug[ind.codigo]); });
      limpiarFormulario();
      setInventarioSis(inv || null);
      setCatalogo(cat); setValores(init); setCab(nueva);
      setIdEditando(null);
      setVista('form');
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
    finally { setCargando(false); }
  };

  const editar = async (id, pasoInicial = 0) => {
    setCargando(true);
    try {
      const [cat, d, sug] = await Promise.all([
        bienestarAPI.getCatalogo('CAPRINO'),
        bienestarAPI.getById(id),
        bienestarAPI.getSugerencias().catch(() => ({})),
      ]);
      const porInd = Object.fromEntries((d.detalle || []).map((x) => [x.idIndicador, x]));
      const init = {};
      cat.forEach((ind) => {
        const x = porInd[ind.idIndicador];
        init[ind.idIndicador] = x ? {
          puntaje: x.aplica ? x.puntaje : null,
          aplica: x.aplica,
          soporteDoc: x.soporteDoc || '', observacion: x.observacion || '',
          nEvaluados: x.nEvaluados ?? '', nHallazgo: x.nHallazgo ?? '',
          info: sug[ind.codigo]?.info || null, pendientes: [],
        } : valorVacio(ind, d.tipoProductor, sug[ind.codigo]);
      });
      const docDe = (x) => ({ ...docVacio(), ...x, numero: x?.numero || '', fecha: x?.fecha || '', vence: x?.vence || '', obs: x?.obs || '', checks: x?.checks || [] });
      const inv = d.grupos?.inventario || {};
      limpiarFormulario();
      setInventarioSis(sug._INVENTARIO || null);
      setCatalogo(cat); setValores(init);
      setCab({
        fechaEvaluacion: d.fechaEvaluacion?.slice(0, 10) || hoy(),
        tipoProductor: d.tipoProductor || 'EXTENSIVO',
        numAnimales: d.numAnimales ?? '', tamanoMuestra: d.tamanoMuestra ?? '',
        evaluadores: d.evaluadores || '', observaciones: d.observaciones || '',
        inventario: Object.fromEntries(GRUPOS_EDAD.map((g) => [g.key, inv[g.key] != null ? String(inv[g.key]) : ''])),
        porGrupo: { CRIAS: 0, JOVENES: 0, ADULTOS: 0, ...Object.fromEntries(Object.entries(d.grupos?.muestra || {}).map(([k, v]) => [k, v ?? 0])) },
        animalesMuestra: d.animalesMuestra || [],
        rspp: docDe(d.rspp), asi: docDe(d.asi),
      });
      setIdEditando(id); setFotosGuardadas(d.fotos || []);
      setPaso(pasoInicial);
      setVista('form');
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); }
    finally { setCargando(false); }
  };

  const setValor = (id, cambios) => setValores((v) => ({ ...v, [id]: { ...v[id], ...cambios } }));
  const setDoc = (sigla, cambios) => setCab((c) => ({ ...c, [sigla.toLowerCase()]: { ...c[sigla.toLowerCase()], ...cambios } }));

  const setConteo = (ind, campo, valor) => setValores((vs) => {
    const v = { ...vs[ind.idIndicador], [campo]: valor };
    const p = puntajeMuestreo(ind, v);
    if (p !== null) v.puntaje = p;
    return { ...vs, [ind.idIndicador]: v };
  });

  const agregarFotos = (idInd, files) => {
    const nuevas = files.filter((f) => f.type.startsWith('image/')).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (idInd === null) setFotosGenerales((p) => [...p, ...nuevas]);
    else if (idInd === 'RSPP' || idInd === 'ASI') setFotosDocs((p) => ({ ...p, [idInd]: [...p[idInd], ...nuevas] }));
    else setValores((v) => ({ ...v, [idInd]: { ...v[idInd], pendientes: [...v[idInd].pendientes, ...nuevas] } }));
  };
  const quitarPendiente = (idInd, i) => {
    if (idInd === null) setFotosGenerales((p) => p.filter((_, k) => k !== i));
    else if (idInd === 'RSPP' || idInd === 'ASI') setFotosDocs((p) => ({ ...p, [idInd]: p[idInd].filter((_, k) => k !== i) }));
    else setValores((v) => ({ ...v, [idInd]: { ...v[idInd], pendientes: v[idInd].pendientes.filter((_, k) => k !== i) } }));
  };
  const eliminarGuardada = async (foto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await bienestarAPI.eliminarFoto(foto.idFoto);
      setFotosGuardadas((p) => p.filter((f) => f.idFoto !== foto.idFoto));
    } catch (e) { setError(e.message || 'No se pudo eliminar la foto'); }
  };

  const onTipoProductor = (tp) => {
    setCab((c) => ({ ...c, tipoProductor: tp }));
    setValores((v) => {
      const nv = { ...v };
      catalogo.forEach((ind) => {
        if (ind.soloConfinamiento) nv[ind.idIndicador] = { ...nv[ind.idIndicador], aplica: !confinamientoNoAplica(tp) };
      });
      return nv;
    });
  };

  // Muestra: total -> tamaño (Tabla 1) -> reparto por grupo
  const onNumAnimales = (n) => setCab((c) => {
    const tam = muestraMinima(n);
    return { ...c, numAnimales: n, tamanoMuestra: tam ? String(tam) : '', porGrupo: repartirMuestra(c.inventario, tam), animalesMuestra: [] };
  });
  const onTamano = (t) => setCab((c) => ({ ...c, tamanoMuestra: t, porGrupo: repartirMuestra(c.inventario, t), animalesMuestra: [] }));
  const onInventario = (g, n) => setCab((c) => {
    const inventario = { ...c.inventario, [g]: n };
    const suma = GRUPOS_EDAD.reduce((a, x) => a + (Number(inventario[x.key]) || 0), 0);
    const total = suma || Number(c.numAnimales) || 0;
    const tam = muestraMinima(total);
    return { ...c, inventario, numAnimales: suma ? String(suma) : c.numAnimales, tamanoMuestra: tam ? String(tam) : '', porGrupo: repartirMuestra(inventario, tam), animalesMuestra: [] };
  });
  const sortear = () => {
    if (!inventarioSis?.animales?.length) return;
    setCab((c) => ({ ...c, animalesMuestra: sortearMuestra(inventarioSis.animales, c.porGrupo) }));
  };
  const usarMuestraEnConteos = () => {
    const n = Number(cab.tamanoMuestra);
    if (!n) return;
    setValores((vs) => {
      const nv = { ...vs };
      catalogo.filter((ind) => ind.tipoMedida === 'ANIMAL' && ind.medicion && /animal/i.test(ind.unidad || '')).forEach((ind) => {
        if (nv[ind.idIndicador].nEvaluados === '' || nv[ind.idIndicador].nEvaluados == null) {
          const v = { ...nv[ind.idIndicador], nEvaluados: String(n) };
          const p = puntajeMuestreo(ind, v);
          if (p !== null) v.puntaje = p;
          nv[ind.idIndicador] = v;
        }
      });
      return nv;
    });
  };

  const rsppVigente = cab.rspp.estado === 'VIGENTE';
  const asiVigente = cab.asi.estado === 'VIGENTE';
  const resultado = useMemo(
    () => calcular(catalogo, valores, rsppVigente, asiVigente),
    [catalogo, valores, rsppVigente, asiVigente]
  );

  const guardar = async (estado) => {
    setError(''); setAviso('');
    if (estado === 'FINALIZADA' && resultado.sinCalificar > 0) {
      setError(`Faltan ${resultado.sinCalificar} punto(s) por calificar. Guarde como borrador o márquelos como "No aplica".`);
      return;
    }
    const conteoMal = catalogo.find((ind) => {
      const v = valores[ind.idIndicador];
      return v.nEvaluados !== '' && v.nHallazgo !== '' && Number(v.nHallazgo) > Number(v.nEvaluados);
    });
    if (conteoMal) { setError(`En «${conteoMal.nombre}» el conteo no puede superar el total revisado.`); return; }

    setGuardando('Guardando evaluación…');
    try {
      const doc = (d) => ({ Estado: d.estado, Numero: d.numero || null, Fecha: d.fecha || null, Vence: d.vence || null, Checks: d.checks, Obs: d.obs || null });
      const prefijo = (p, o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [p + k, v]));
      const entero = (v) => (v === '' || v == null ? null : Number(v));
      const payload = {
        especie: 'CAPRINO',
        estado,
        fechaEvaluacion: cab.fechaEvaluacion,
        tipoProductor: cab.tipoProductor,
        sistemaProductivo: null,
        numAnimales: entero(cab.numAnimales),
        tamanoMuestra: entero(cab.tamanoMuestra),
        evaluadores: cab.evaluadores || null,
        observaciones: cab.observaciones || null,
        invCrias: entero(cab.inventario.CRIAS), invJovenes: entero(cab.inventario.JOVENES), invAdultos: entero(cab.inventario.ADULTOS),
        mueCrias: cab.porGrupo.CRIAS, mueJovenes: cab.porGrupo.JOVENES, mueAdultos: cab.porGrupo.ADULTOS,
        animalesMuestra: cab.animalesMuestra,
        ...prefijo('rspp', doc(cab.rspp)),
        ...prefijo('asi', doc(cab.asi)),
        detalle: catalogo.map((ind) => {
          const v = valores[ind.idIndicador];
          return {
            idIndicador: ind.idIndicador,
            puntaje: v.puntaje,
            aplica: v.aplica,
            soporteDoc: v.soporteDoc || null,
            observacion: v.observacion || null,
            nEvaluados: v.nEvaluados === '' ? null : Number(v.nEvaluados),
            nHallazgo: v.nHallazgo === '' ? null : Number(v.nHallazgo),
          };
        }),
      };
      const r = idEditando ? await bienestarAPI.update(idEditando, payload) : await bienestarAPI.create(payload);
      const id = idEditando || r.data?.idEvaluacion;
      setIdEditando(id);

      const cola = [
        ...fotosGenerales.map((p) => ({ idInd: null, file: p.file })),
        ...['RSPP', 'ASI'].flatMap((d) => fotosDocs[d].map((p) => ({ idInd: null, doc: d, file: p.file }))),
        ...catalogo.flatMap((ind) => valores[ind.idIndicador].pendientes.map((p) => ({ idInd: ind.idIndicador, file: p.file }))),
      ];
      let fallidas = 0;
      for (let i = 0; i < cola.length; i++) {
        setGuardando(`Subiendo fotos ${i + 1} de ${cola.length}…`);
        try {
          await bienestarAPI.subirFoto(id, cola[i].file, cola[i].idInd, cola[i].doc ? `Certificado ${cola[i].doc}` : '', cola[i].doc || null);
          cola[i].ok = true;
        } catch { fallidas += 1; }
      }
      const subidas = new Set(cola.filter((c) => c.ok).map((c) => c.file));
      setFotosGenerales((p) => p.filter((x) => !subidas.has(x.file)));
      setFotosDocs((p) => ({ RSPP: p.RSPP.filter((x) => !subidas.has(x.file)), ASI: p.ASI.filter((x) => !subidas.has(x.file)) }));
      setValores((vs) => Object.fromEntries(Object.entries(vs).map(([k, v]) => [k, { ...v, pendientes: (v.pendientes || []).filter((x) => !subidas.has(x.file)) }])));

      await cargarLista();
      const d = await bienestarAPI.getById(id);
      setDetalle(d);
      setVista('detalle');
      if (fallidas) setAviso(`La evaluación se guardó, pero ${fallidas} foto(s) no se pudieron subir. Edite la evaluación para intentarlo de nuevo.`);
    } catch (e) { setError(e.message || 'Error al guardar'); }
    finally { setGuardando(''); }
  };

  const verDetalle = async (id) => {
    setCargando(true); setAviso('');
    try {
      const [d, sug] = await Promise.all([bienestarAPI.getById(id), bienestarAPI.getSugerencias().catch(() => ({}))]);
      setInventarioSis(sug._INVENTARIO || null);
      setDetalle(d);
      setVista('detalle');
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta evaluación de bienestar y sus fotos?')) return;
    try { await bienestarAPI.delete(id); await cargarLista(); }
    catch (e) { setError(e.message || 'No se pudo eliminar'); }
  };

  const AvisoError = () => error ? (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-base flex items-start gap-2"><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />{error}</div>
  ) : null;

  // ---------------- LISTA ----------------
  if (vista === 'lista') {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl shadow-lg p-6 sm:p-7 text-white mb-5 relative overflow-hidden">
          <Heart className="absolute -right-6 -bottom-10 w-48 h-48 text-white/10" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Heart className="w-7 h-7 text-white" /></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Bienestar Animal</h1>
                <p className="text-green-100 text-base">Evaluación de la granja con la guía MEBA del ICA (v3.0, 2026)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ControlLetra claro />
              <button onClick={iniciarNueva} className="flex items-center gap-2 px-5 py-3 bg-white text-green-700 hover:bg-green-50 rounded-xl text-base font-semibold transition-colors shadow-sm">
                <Plus className="w-5 h-5" /> Nueva evaluación
              </button>
            </div>
          </div>
        </div>

        <AvisoError />

        {cargando ? (
          <div className="text-center py-12 text-gray-400"><RefreshCw className="w-7 h-7 animate-spin mx-auto" /></div>
        ) : evaluaciones.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Heart className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">Aún no hay evaluaciones de bienestar.</p>
            <p className="text-gray-500 text-base mt-1">Toque <b>Nueva evaluación</b> para empezar.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {evaluaciones.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.estado === 'BORRADOR'
                      ? <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-gray-100 text-gray-700 border-gray-300">BORRADOR</span>
                      : <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${COLOR_CLASIF[e.clasificacion] || ''}`}>{e.clasificacion}</span>}
                    <span className="text-2xl font-bold text-gray-800">{e.puntTotal}%</span>
                    {e.numFotos > 0 && <span className="text-sm text-gray-500 flex items-center gap-1"><Camera className="w-4 h-4" />{e.numFotos}</span>}
                  </div>
                  <p className="text-base text-gray-600 mt-1">{e.fechaEvaluacion?.slice(0, 10)} · {TIPOS_PRODUCTOR[e.tipoProductor]?.label || e.tipoProductor} · {e.numAnimales || '—'} cabras · muestra {e.tamanoMuestra ?? '—'}</p>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span>RSPP: <b>{ESTADOS_DOC.find((x) => x.valor === e.rspp?.estado)?.texto || '—'}</b></span>
                    <span>ASI: <b>{ESTADOS_DOC.find((x) => x.valor === e.asi?.estado)?.texto || '—'}</b></span>
                    {e.evaluadores && <span className="flex items-center gap-1 truncate"><Users className="w-4 h-4" />{e.evaluadores}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => verDetalle(e.id)} title="Ver" className="p-3 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"><Eye className="w-5 h-5" /></button>
                  <button onClick={() => editar(e.id)} title="Editar / completar" className="p-3 text-gray-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => eliminar(e.id)} title="Eliminar" className="p-3 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------- DETALLE ----------------
  if (vista === 'detalle' && detalle) {
    const fotosDe = (idInd) => (detalle.fotos || []).filter((f) => f.idIndicador === idInd && !f.documento);
    const fotosDoc = (d) => (detalle.fotos || []).filter((f) => f.documento === d);
    const mejorar = (detalle.detalle || []).filter((d) => d.aplica && d.puntaje != null && d.puntaje < 100);
    const gInv = detalle.grupos?.inventario || {};
    const gMue = detalle.grupos?.muestra || {};
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Visor src={visor} onCerrar={() => setVisor(null)} />
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base"><ArrowLeft className="w-5 h-5" /> Volver</button>
          <div className="flex items-center gap-2">
            <ControlLetra />
            <button onClick={() => editar(detalle.id)} className="flex items-center gap-2 text-base px-4 py-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50"><Edit2 className="w-5 h-5" /> Editar</button>
          </div>
        </div>
        {aviso && <div className="mb-4 p-4 bg-amber-50 text-amber-800 rounded-xl text-base flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{aviso}</div>}

        <div className={`${tarjeta} mb-4`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-1.5 rounded-full text-base font-bold border ${COLOR_CLASIF[detalle.clasificacion] || ''}`}>{detalle.clasificacion}</span>
                {detalle.estado === 'BORRADOR' && <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-gray-100 text-gray-700">BORRADOR</span>}
              </div>
              <p className="text-4xl font-bold text-gray-800 mt-2">{detalle.puntTotal}%</p>
              <p className="text-base text-gray-600">{detalle.fechaEvaluacion?.slice(0, 10)} · {TIPOS_PRODUCTOR[detalle.tipoProductor]?.label || detalle.tipoProductor}</p>
              {detalle.evaluadores && <p className="text-base text-gray-600 mt-1 flex items-center gap-1"><Users className="w-4 h-4" /> {detalle.evaluadores}</p>}
            </div>
            <div className="text-right text-base text-gray-700 space-y-1">
              <p>Recursos (35 %): <b>{detalle.puntRecursos ?? '—'}</b></p>
              <p>Animal (55 %): <b>{detalle.puntAnimal ?? '—'}</b></p>
              <p>Gestión (10 %): <b>{detalle.puntGestion ?? '—'}</b></p>
            </div>
          </div>
          {detalle.observaciones && <p className="mt-4 text-base text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-line">{detalle.observaciones}</p>}
        </div>

        {/* Muestra */}
        <div className={`${tarjeta} mb-4`}>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-3"><Calculator className="w-6 h-6 text-emerald-600" /> Tamaño de la muestra</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <p className="text-base text-gray-700">Cabras en la granja: <b className="text-2xl">{detalle.numAnimales ?? '—'}</b></p>
              <p className="text-base text-gray-700">Cabras revisadas una por una: <b className="text-2xl text-emerald-700">{detalle.tamanoMuestra ?? '—'}</b></p>
              <table className="w-full mt-3 text-base">
                <thead><tr className="text-left text-gray-500 border-b"><th className="py-2">Grupo de edad</th><th>En la granja</th><th>Revisadas</th></tr></thead>
                <tbody>
                  {GRUPOS_EDAD.map((g) => (
                    <tr key={g.key} className="border-b border-gray-100"><td className="py-2 font-medium">{g.titulo}</td><td>{gInv[g.key] ?? '—'}</td><td className="font-bold">{gMue[g.key] ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
              {(detalle.animalesMuestra || []).length > 0 && (
                <div className="mt-3">
                  <p className="text-base font-semibold text-gray-700 mb-1.5">Cabras sorteadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detalle.animalesMuestra.map((id) => (
                      <span key={id} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-medium">{animalesPorId[id] ? <NombreAnimal a={animalesPorId[id]} /> : `#${id}`}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <TablaMuestra total={detalle.numAnimales} compacta />
          </div>
        </div>

        {/* RSPP y ASI */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {['RSPP', 'ASI'].map((sigla) => {
            const d = detalle[sigla.toLowerCase()] || docVacio();
            const info = DOCUMENTOS_ICA[sigla];
            const est = ESTADOS_DOC.find((x) => x.valor === d.estado);
            return (
              <div key={sigla} className={tarjeta}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xl font-bold text-gray-800">{sigla}</p>
                    <p className="text-sm text-gray-500">{info.nombre}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${COLOR_ESTADO[est?.color || 'gray']}`}>{est?.texto || '—'}</span>
                </div>
                <dl className="mt-3 text-base space-y-1">
                  {d.numero && <div><dt className="inline text-gray-500">Número: </dt><dd className="inline font-semibold">{d.numero}</dd></div>}
                  {d.fecha && <div><dt className="inline text-gray-500">Expedido: </dt><dd className="inline">{d.fecha}</dd></div>}
                  {d.vence && <div><dt className="inline text-gray-500">Vence: </dt><dd className="inline">{d.vence}</dd></div>}
                </dl>
                <ul className="mt-2 space-y-1 text-base">
                  {info.checks.map(([k, t]) => (
                    <li key={k} className={`flex items-start gap-2 ${d.checks?.includes(k) ? 'text-gray-800' : 'text-gray-400'}`}>
                      {d.checks?.includes(k) ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 mt-0.5" />}{t}
                    </li>
                  ))}
                </ul>
                {d.obs && <p className="mt-2 text-base text-gray-700 bg-gray-50 rounded-lg p-3">{d.obs}</p>}
                {fotosDoc(sigla).length > 0 && <div className="mt-3"><GaleriaFotos guardadas={fotosDoc(sigla)} onVer={setVisor} /></div>}
              </div>
            );
          })}
        </div>

        {fotosDe(null).length > 0 && (
          <div className={`${tarjeta} mb-4`}>
            <p className="text-base font-semibold text-gray-700 mb-2">Fotos generales de la visita</p>
            <GaleriaFotos guardadas={fotosDe(null)} onVer={setVisor} />
          </div>
        )}

        {mejorar.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
            <p className="text-lg font-bold text-amber-900 mb-2">Para mejorar ({mejorar.length} puntos por debajo de 100)</p>
            <ul className="text-base text-amber-900 space-y-1">
              {mejorar.map((d) => <li key={d.idDetalle}>• {d.nombre} — <b>{d.puntaje}</b></li>)}
            </ul>
          </div>
        )}

        {GRUPOS.map((g) => {
          const items = (detalle.detalle || []).filter((d) => d.tipoMedida === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className={`${tarjeta} mb-3`}>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{g.titulo} ({g.peso})</h3>
              <div className="divide-y divide-gray-100">
                {items.map((d) => {
                  const pct = porcentaje(d);
                  const fotos = fotosDe(d.idIndicador);
                  return (
                    <div key={d.idDetalle} className="py-3 text-base">
                      <div className="flex items-center justify-between gap-3">
                        <span className={d.aplica ? 'text-gray-800' : 'text-gray-400 line-through'}>{d.nombre}</span>
                        {!d.aplica ? <span className="text-sm text-gray-400">No aplica</span>
                          : d.puntaje == null ? <span className="text-sm text-gray-400 italic">Sin calificar</span>
                          : <span className={`px-3 py-1 rounded-lg text-base font-bold ${COLOR_PUNTAJE[d.puntaje]}`}>{d.puntaje}</span>}
                      </div>
                      {d.aplica && (pct !== null || d.observacion || d.soporteDoc || fotos.length > 0) && (
                        <div className="mt-2 space-y-2 text-sm text-gray-600">
                          {pct !== null && <p>Conteo: {d.nHallazgo} de {d.nEvaluados} {d.unidad || ''} {d.medicion === 'CUMPLE' ? 'están bien' : 'tienen el problema'} ({pct} %)</p>}
                          {d.observacion && <p className="text-gray-700">Observación: {d.observacion}</p>}
                          {d.soporteDoc && <p>Soporte: {d.soporteDoc}</p>}
                          {fotos.length > 0 && <GaleriaFotos guardadas={fotos} onVer={setVisor} />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------- FORMULARIO POR PASOS ----------------
  const pasoKey = PASOS[paso].key;
  const estadoPaso = (k) => {
    if (k === 'GRANJA') return !!(cab.fechaEvaluacion && cab.tipoProductor);
    if (k === 'MUESTRA') return Number(cab.numAnimales) > 0 && Number(cab.tamanoMuestra) > 0;
    if (k === 'DOCS') return cab.rspp.estado !== 'NO_SABE' && cab.asi.estado !== 'NO_SABE';
    if (['RECURSOS', 'ANIMAL', 'GESTION'].includes(k)) {
      const items = catalogo.filter((c) => c.tipoMedida === k && valores[c.idIndicador]?.aplica);
      return items.length > 0 && items.every((c) => valores[c.idIndicador]?.puntaje != null);
    }
    return false;
  };

  const renderIndicadores = (gKey) => {
    const g = GRUPOS.find((x) => x.key === gKey);
    const Icono = g.icono;
    const items = catalogo.filter((c) => c.tipoMedida === gKey);
    const aplicables = items.filter((c) => valores[c.idIndicador]?.aplica);
    const calificados = aplicables.filter((c) => valores[c.idIndicador]?.puntaje != null);
    return (
      <div className="space-y-4">
        <div className={`${tarjeta} flex items-start justify-between gap-3 flex-wrap`}>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Icono className="w-7 h-7 text-emerald-600" /> {g.titulo} <span className="text-lg font-semibold text-gray-500">· vale {g.peso} de la nota</span></h2>
            <p className="text-base text-gray-600 mt-1">{g.ayuda}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800">{calificados.length}<span className="text-lg text-gray-400">/{aplicables.length}</span></p>
            <p className="text-sm text-gray-500">calificados</p>
          </div>
        </div>
        {gKey === 'ANIMAL' && Number(cab.tamanoMuestra) > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap text-base text-emerald-900">
            <span>Muestra de esta visita: <b>{cab.tamanoMuestra} cabras</b>. Úselo como "¿cuántas revisó?" en los conteos que estén vacíos.</span>
            <button type="button" onClick={usarMuestraEnConteos} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Usar {cab.tamanoMuestra} en los conteos</button>
          </div>
        )}
        {items.map((ind, n) => {
          const v = valores[ind.idIndicador];
          if (!v) return null;
          const niveles = nivelesDe(ind);
          const pct = porcentaje(v);
          const sugerido = puntajeMuestreo(ind, v);
          const abierto = abiertos[ind.idIndicador];
          const guardadas = fotosGuardadas.filter((f) => f.idIndicador === ind.idIndicador && !f.documento);
          return (
            <div key={ind.idIndicador} className={`rounded-2xl border-2 p-5 bg-white ${v.aplica ? (v.puntaje == null ? 'border-amber-300' : 'border-emerald-200') : 'border-gray-200 bg-gray-50 opacity-75'}`}>
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold ${v.puntaje != null && v.aplica ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{n + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-800">{ind.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {ind.referencia && <span className="text-sm px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{ind.referencia}</span>}
                    {ind.esDocumental && <span className="text-sm px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">Revisar papeles</span>}
                    {ind.soloConfinamiento && <span className="text-sm px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">Solo si están encerradas</span>}
                    {ind.medicion && <span className="text-sm px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">Contar</span>}
                    {ind.fuenteModulo && <span className="text-sm px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Hay datos en {ind.fuenteModulo}</span>}
                  </div>
                  {ind.pregunta && <p className="text-base text-gray-800 mt-2 font-medium">{ind.pregunta}</p>}
                  {ind.metodo && <p className="text-base text-gray-500 mt-1">Cómo se revisa: {ind.metodo}</p>}
                  {v.info && <p className="text-base text-sky-700 mt-1">{v.info}</p>}
                </div>
              </div>

              <div className="mt-4 flex items-stretch gap-2 flex-wrap">
                {niveles.map((p) => (
                  <button key={p} type="button" disabled={!v.aplica} onClick={() => setValor(ind.idIndicador, { puntaje: p })}
                    title={ind.criterios?.[p] || ''}
                    className={`min-w-[5.5rem] px-3 py-2 rounded-xl border-2 transition text-center ${v.puntaje === p && v.aplica ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'} ${!v.aplica ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <span className="block text-xl font-bold leading-tight">{p}</span>
                    <span className="block text-sm leading-tight">{SIGNIFICADO_PUNTAJE[p]}</span>
                  </button>
                ))}
                <button type="button" onClick={() => setValor(ind.idIndicador, { aplica: !v.aplica })} title="Marcar si este punto no aplica en esta granja"
                  className={`px-4 rounded-xl text-base font-semibold border-2 ${!v.aplica ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                  No aplica
                </button>
              </div>

              {v.aplica && (
                <>
                  {ind.medicion && (
                    <div className="mt-4 grid sm:grid-cols-3 gap-3 items-end bg-emerald-50/70 rounded-xl p-4">
                      <label className="text-base text-gray-700">
                        ¿Cuántos {ind.unidad} revisó?
                        <input type="number" min="0" inputMode="numeric" className={`${inpSm} mt-1`} value={v.nEvaluados}
                          onChange={(e) => setConteo(ind, 'nEvaluados', e.target.value)} />
                      </label>
                      <label className="text-base text-gray-700">
                        {ind.medicion === 'CUMPLE' ? '¿Cuántos están bien?' : '¿Cuántos tienen el problema?'}
                        <input type="number" min="0" inputMode="numeric" className={`${inpSm} mt-1`} value={v.nHallazgo}
                          onChange={(e) => setConteo(ind, 'nHallazgo', e.target.value)} />
                      </label>
                      <div className="text-base">
                        {pct !== null ? (
                          <p className={pct > 100 ? 'text-red-700 font-semibold' : 'text-gray-800'}>
                            = <b className="text-2xl">{pct} %</b>{sugerido !== null && <> → puntaje <b className="text-2xl">{sugerido}</b></>}
                          </p>
                        ) : <p className="text-gray-500">Escriba los dos números y el puntaje sale solo.</p>}
                      </div>
                    </div>
                  )}

                  {v.puntaje != null && ind.criterios?.[v.puntaje] && (
                    <p className="mt-3 text-base text-emerald-900 bg-emerald-50 rounded-xl px-4 py-2.5"><b>{v.puntaje}:</b> {ind.criterios[v.puntaje]}</p>
                  )}
                  {ind.criterios?.[100] && (
                    <button type="button" onClick={() => setAbiertos((a) => ({ ...a, [ind.idIndicador]: !a[ind.idIndicador] }))}
                      className="mt-2 text-base font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                      <ChevronDown className={`w-5 h-5 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                      {abierto ? 'Ocultar qué significa cada puntaje' : 'Ver qué significa cada puntaje'}
                    </button>
                  )}
                  {abierto && (
                    <div className="mt-2 space-y-1.5">
                      {niveles.map((p) => (
                        <button key={p} type="button" onClick={() => setValor(ind.idIndicador, { puntaje: p })}
                          className={`w-full text-left text-base rounded-xl px-4 py-2.5 border-2 ${v.puntaje === p ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <span className={`inline-block w-12 text-center mr-2 rounded-md font-bold ${COLOR_PUNTAJE[p]}`}>{p}</span>
                          {ind.criterios[p]}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className={inpSm} placeholder="Observación: qué se vio, dónde, qué animales…"
                      value={v.observacion} onChange={(e) => setValor(ind.idIndicador, { observacion: e.target.value })} maxLength={500} />
                    {ind.esDocumental && (
                      <input className={inpSm} placeholder="Documento revisado (soporte)"
                        value={v.soporteDoc} onChange={(e) => setValor(ind.idIndicador, { soporteDoc: e.target.value })} />
                    )}
                  </div>
                  <div className="mt-3">
                    <GaleriaFotos guardadas={guardadas} pendientes={v.pendientes}
                      onAgregar={(files) => agregarFotos(ind.idIndicador, files)}
                      onQuitarPendiente={(i) => quitarPendiente(ind.idIndicador, i)}
                      onEliminarGuardada={eliminarGuardada} onVer={setVisor} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDoc = (sigla) => {
    const info = DOCUMENTOS_ICA[sigla];
    const d = cab[sigla.toLowerCase()];
    const avisos = avisosDoc(sigla, d, cab.fechaEvaluacion);
    const guardadas = fotosGuardadas.filter((f) => f.documento === sigla);
    const abierto = abiertos[`doc_${sigla}`];
    return (
      <div key={sigla} className={`${tarjeta} border-2 ${d.estado === 'VIGENTE' ? 'border-emerald-300' : d.estado === 'NO_SABE' ? 'border-amber-300' : 'border-red-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${d.estado === 'VIGENTE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            <BadgeCheck className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl font-bold text-gray-800">{info.sigla}</h3>
            <p className="text-base text-gray-600">{info.nombre}</p>
          </div>
        </div>

        <p className="mt-3 text-base text-gray-700">{info.que}</p>
        <button type="button" onClick={() => setAbiertos((a) => ({ ...a, [`doc_${sigla}`]: !a[`doc_${sigla}`] }))}
          className="mt-2 text-base font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
          <ChevronDown className={`w-5 h-5 transition-transform ${abierto ? 'rotate-180' : ''}`} /> Por qué importa, norma y cómo se obtiene
        </button>
        {abierto && (
          <dl className="mt-2 space-y-2 text-base bg-gray-50 rounded-xl p-4">
            <div><dt className="font-semibold text-gray-800">Por qué importa</dt><dd className="text-gray-700">{info.porque}</dd></div>
            <div><dt className="font-semibold text-gray-800">Norma</dt><dd className="text-gray-700">{info.norma}</dd></div>
            <div><dt className="font-semibold text-gray-800">Cómo se obtiene</dt><dd className="text-gray-700">{info.como}</dd></div>
          </dl>
        )}

        <p className={`${lbl} mt-5`}>¿La granja tiene el {info.sigla}?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ESTADOS_DOC.map((e) => (
            <button key={e.valor} type="button" onClick={() => setDoc(sigla, { estado: e.valor })}
              className={`px-3 py-3 rounded-xl border-2 text-base font-semibold transition ${d.estado === e.valor ? COLOR_ESTADO[e.color] : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
              {e.texto}
            </button>
          ))}
        </div>

        {d.estado !== 'NO_TIENE' && (
          <div className={`mt-4 grid gap-3 ${info.vence ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <label className="text-base font-medium text-gray-700">Número del {info.sigla}
              <input className={`${inpSm} mt-1`} value={d.numero} maxLength={60} placeholder="Como aparece en el documento" onChange={(e) => setDoc(sigla, { numero: e.target.value })} />
            </label>
            <label className="text-base font-medium text-gray-700">Fecha de expedición
              <input type="date" className={`${inpSm} mt-1`} value={d.fecha} onChange={(e) => setDoc(sigla, { fecha: e.target.value })} />
            </label>
            {info.vence && (
              <label className="text-base font-medium text-gray-700">Vence
                <input type="date" className={`${inpSm} mt-1`} value={d.vence} onChange={(e) => setDoc(sigla, { vence: e.target.value })} />
              </label>
            )}
          </div>
        )}

        <p className={`${lbl} mt-5`}>Qué verifiqué</p>
        <div className="space-y-2">
          {info.checks.map(([k, t]) => {
            const marcado = d.checks.includes(k);
            return (
              <label key={k} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer text-base ${marcado ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="checkbox" className="mt-1 w-5 h-5 accent-emerald-600 shrink-0" checked={marcado}
                  onChange={() => setDoc(sigla, { checks: marcado ? d.checks.filter((x) => x !== k) : [...d.checks, k] })} />
                <span className="text-gray-800">{t}</span>
              </label>
            );
          })}
        </div>

        {avisos.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {avisos.map((a) => <p key={a} className="text-base text-amber-800 bg-amber-50 rounded-xl px-4 py-2.5 flex items-start gap-2"><AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />{a}</p>)}
          </div>
        )}

        <label className="block mt-4 text-base font-medium text-gray-700">Observación
          <input className={`${inpSm} mt-1`} value={d.obs} maxLength={500} placeholder="Ej.: el dueño dice que lo tiene pero no lo encontró" onChange={(e) => setDoc(sigla, { obs: e.target.value })} />
        </label>
        <div className="mt-4">
          <p className="text-base font-medium text-gray-700 mb-2">Foto del documento</p>
          <GaleriaFotos guardadas={guardadas} pendientes={fotosDocs[sigla]}
            onAgregar={(files) => agregarFotos(sigla, files)} onQuitarPendiente={(i) => quitarPendiente(sigla, i)}
            onEliminarGuardada={eliminarGuardada} onVer={setVisor} />
        </div>
      </div>
    );
  };

  const totalInventario = GRUPOS_EDAD.reduce((a, g) => a + (Number(cab.inventario[g.key]) || 0), 0);
  const sumaPorGrupo = GRUPOS_EDAD.reduce((a, g) => a + (Number(cab.porGrupo[g.key]) || 0), 0);
  const conSi = clasificar(resultado.total, true, true);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-44">
      <Visor src={visor} onCerrar={() => setVisor(null)} />
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base"><ArrowLeft className="w-5 h-5" /> Salir sin guardar</button>
        <ControlLetra />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{idEditando ? 'Completar / editar evaluación' : 'Nueva evaluación de bienestar'}</h1>

      {/* Pasos */}
      <nav aria-label="Pasos de la evaluación" className="mb-5 overflow-x-auto">
        <ol className="flex gap-2 min-w-max">
          {PASOS.map((p, k) => {
            const Icono = p.icono;
            const hecho = estadoPaso(p.key);
            const actual = k === paso;
            return (
              <li key={p.key}>
                <button type="button" onClick={() => setPaso(k)} aria-current={actual ? 'step' : undefined}
                  className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-2xl border-2 transition text-base font-semibold ${actual ? 'bg-emerald-600 border-emerald-600 text-white shadow' : hecho ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${actual ? 'bg-white/20' : hecho ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
                    {hecho && !actual ? <CheckCircle className="w-5 h-5" /> : <Icono className="w-5 h-5" />}
                  </span>
                  <span className="whitespace-nowrap"><span className="opacity-70 mr-1">{k + 1}.</span>{p.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <AvisoError />

      <div key={pasoKey} className="animate-aparecer">
        {pasoKey === 'GRANJA' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-base text-emerald-900">
              <p className="text-lg font-bold flex items-center gap-2 mb-2"><Info className="w-5 h-5" /> Cómo llenar la evaluación (guía del ICA)</p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Llene los datos de la granja y del día de la visita.</li>
                <li>En <b>Muestra</b> el sistema dice <b>cuántas cabras revisar una por una</b> (Tabla 1 del ICA) y cuántas de cada edad.</li>
                <li>En <b>RSPP y ASI</b> verifique los dos documentos del ICA: sin ellos la granja no puede quedar en "Excelente".</li>
                <li>En <b>Recursos</b>, <b>Animal</b> y <b>Gestión</b> responda cada pregunta con <b>100, 55, 20 o 0</b>, o "No aplica".</li>
                <li>Puede <b>guardar como borrador</b> y seguir otro día. Al final, en <b>Cierre</b>, toque "Finalizar".</li>
              </ol>
              <button type="button" onClick={() => setAbiertos((a) => ({ ...a, _glosario: !a._glosario }))} className="mt-3 text-base font-medium text-emerald-800 flex items-center gap-1">
                <ChevronDown className={`w-5 h-5 transition-transform ${abiertos._glosario ? 'rotate-180' : ''}`} /> Palabras que quizá no conozca
              </button>
              {abiertos._glosario && (
                <dl className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                  {GLOSARIO.map(([t, d]) => <div key={t}><dt className="inline font-bold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
                </dl>
              )}
            </div>
            <div className={`${tarjeta} grid md:grid-cols-2 gap-5`}>
              <div>
                <label className={lbl} htmlFor="bien-fecha">Fecha de la visita</label>
                <input id="bien-fecha" type="date" className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
              </div>
              <div>
                <label className={lbl} htmlFor="bien-evs">Evaluadores</label>
                <input id="bien-evs" className={inp} placeholder="Ej.: Ana Pérez, Juan Gómez (estudiantes)" value={cab.evaluadores} onChange={(e) => setCab({ ...cab, evaluadores: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <p className={lbl}>Tipo de productor</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(TIPOS_PRODUCTOR).map(([k, t]) => (
                    <button key={k} type="button" onClick={() => onTipoProductor(k)}
                      className={`text-left p-4 rounded-2xl border-2 transition ${cab.tipoProductor === k ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-emerald-300 bg-white'}`}>
                      <span className="block text-lg font-bold text-gray-800">{t.label}</span>
                      <span className="block text-base text-gray-600 mt-1 leading-snug">{t.ayuda}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {pasoKey === 'MUESTRA' && (
          <div className="space-y-4">
            <div className={tarjeta}>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Calculator className="w-7 h-7 text-emerald-600" /> ¿Cuántas cabras revisar una por una?</h2>
              <p className="text-base text-gray-600 mt-1">El ICA fija un mínimo de cabras para revisar según el tamaño de la granja (Tabla 1). Esas cabras son la <b>muestra</b>: con ellas se califican los puntos del grupo "Animal".</p>
              <div className="mt-5 grid lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-5">
                  <div>
                    <label className={lbl} htmlFor="bien-total">1. ¿Cuántas cabras hay en total en la granja hoy?</label>
                    <input id="bien-total" type="number" min="0" inputMode="numeric" className={`${inp} text-2xl font-bold`} value={cab.numAnimales} onChange={(e) => onNumAnimales(e.target.value)} />
                    {inventarioSis && <p className="text-sm text-gray-500 mt-1">El sistema tiene registradas {inventarioSis.totalAnimales} cabras activas.</p>}
                  </div>
                  <div className="rounded-2xl bg-emerald-600 text-white p-5">
                    <p className="text-base text-emerald-100">2. Cabras a revisar (muestra mínima del ICA)</p>
                    <p className="text-5xl font-extrabold mt-1">{muestraMinima(cab.numAnimales) || '—'}</p>
                    {filaTabla(cab.numAnimales) >= 0 && <p className="text-base text-emerald-50 mt-1">Porque la granja está en la fila «{TABLA_MUESTRA[filaTabla(cab.numAnimales)].texto}» de la tabla.</p>}
                  </div>
                  <div>
                    <label className={lbl} htmlFor="bien-muestra">¿Va a revisar más? (puede subir el número, nunca bajarlo)</label>
                    <input id="bien-muestra" type="number" min="0" inputMode="numeric" className={inp} value={cab.tamanoMuestra} onChange={(e) => onTamano(e.target.value)} />
                    {Number(cab.tamanoMuestra) > 0 && Number(cab.tamanoMuestra) < muestraMinima(cab.numAnimales) && (
                      <p className="text-base text-red-700 mt-1 flex items-center gap-1"><AlertTriangle className="w-5 h-5" /> Es menos que el mínimo del ICA ({muestraMinima(cab.numAnimales)}).</p>
                    )}
                  </div>
                </div>
                <TablaMuestra total={cab.numAnimales} />
              </div>
            </div>

            <div className={tarjeta}>
              <h3 className="text-xl font-bold text-gray-800">3. Repartir la muestra por edades</h3>
              <p className="text-base text-gray-600 mt-1">El ICA pide que la muestra sea <b>proporcional</b> a cuántas crías, jóvenes y adultos hay. Escriba cuántas hay de cada grupo y el sistema calcula cuántas revisar de cada uno.</p>
              {inventarioSis?.sinFecha > 0 && (
                <p className="mt-3 text-base text-amber-800 bg-amber-50 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  {inventarioSis.sinFecha} de {inventarioSis.totalAnimales} cabras no tienen fecha de nacimiento en el sistema y se contaron como adultas. Corrija los números de cada grupo con lo que vea en la granja.
                </p>
              )}
              <div className="mt-4 grid sm:grid-cols-3 gap-4">
                {GRUPOS_EDAD.map((g) => (
                  <div key={g.key} className="rounded-2xl border-2 border-gray-200 p-4">
                    <p className="text-lg font-bold text-gray-800">{g.titulo}</p>
                    <p className="text-sm text-gray-500">{g.ayuda}</p>
                    <label className="block mt-3 text-base text-gray-700">Hay en la granja
                      <input type="number" min="0" inputMode="numeric" className={`${inpSm} mt-1`} value={cab.inventario[g.key]} onChange={(e) => onInventario(g.key, e.target.value)} />
                    </label>
                    <p className="mt-3 text-base text-gray-700">Revisar: <b className="text-3xl text-emerald-700 align-middle">{cab.porGrupo[g.key] || 0}</b></p>
                  </div>
                ))}
              </div>
              {totalInventario > 0 && Number(cab.numAnimales) !== totalInventario && (
                <p className="mt-3 text-base text-amber-800">La suma de los grupos ({totalInventario}) no es igual al total ({cab.numAnimales || 0}).</p>
              )}
              {sumaPorGrupo > 0 && <p className="mt-3 text-base text-gray-700">Total a revisar: <b>{sumaPorGrupo}</b> cabras.</p>}
            </div>

            <div className={tarjeta}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">4. ¿Cuáles cabras revisar? (opcional)</h3>
                  <p className="text-base text-gray-600 mt-1">El sistema puede sortear las cabras al azar, respetando cuántas van de cada grupo. Así nadie escoge solo las más bonitas.</p>
                </div>
                <button type="button" onClick={sortear} disabled={!inventarioSis?.animales?.length || !sumaPorGrupo}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-base font-semibold">
                  <Shuffle className="w-5 h-5" /> {cab.animalesMuestra.length ? 'Sortear de nuevo' : 'Sortear cabras'}
                </button>
              </div>
              {cab.animalesMuestra.length > 0 && (
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cab.animalesMuestra.map((id, k) => (
                    <div key={id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-base">
                      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">{k + 1}</span>
                      <span className="font-semibold text-gray-800">{animalesPorId[id] ? <NombreAnimal a={animalesPorId[id]} /> : `#${id}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {pasoKey === 'DOCS' && (
          <div className="space-y-4">
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-base text-sky-900">
              <p className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> Los dos documentos del ICA que definen el "Excelente"</p>
              <p className="mt-1">Según la guía MEBA, una granja solo queda en <b>Excelente</b> si saca <b>90 % o más</b> y además tiene <b>RSPP y ASI vigentes</b>. Si le falta alguno, aunque saque más de 90 %, queda en <b>Alto</b>. Pida los documentos al encargado, revíselos y tómeles una foto.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              {renderDoc('RSPP')}
              {renderDoc('ASI')}
            </div>
            <div className={tarjeta}>
              <p className="text-lg font-bold text-gray-800 flex items-center gap-2"><Scale className="w-6 h-6 text-emerald-600" /> Cómo afectan a la clasificación</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-3 text-base">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-gray-600">Con lo marcado ahora</p>
                  <p className="mt-1"><span className={`px-3 py-1 rounded-full font-bold border ${COLOR_CLASIF[resultado.clasificacion]}`}>{resultado.clasificacion}</span> <span className="ml-2 text-gray-700">({resultado.total} %)</span></p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-gray-600">Si tuviera RSPP y ASI vigentes</p>
                  <p className="mt-1"><span className={`px-3 py-1 rounded-full font-bold border ${COLOR_CLASIF[conSi]}`}>{conSi}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {['RECURSOS', 'ANIMAL', 'GESTION'].includes(pasoKey) && renderIndicadores(pasoKey)}

        {pasoKey === 'CIERRE' && (
          <div className="space-y-4">
            <div className={tarjeta}>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Flag className="w-7 h-7 text-emerald-600" /> Resultado de la visita</h2>
              <div className="mt-4 grid md:grid-cols-2 gap-6 items-start">
                <div>
                  <p className="text-6xl font-extrabold text-gray-800">{resultado.total}<span className="text-3xl text-gray-400"> %</span></p>
                  <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-lg font-bold border ${COLOR_CLASIF[resultado.clasificacion]}`}>{resultado.clasificacion}</span>
                  <div className="mt-4 space-y-2 text-base">
                    {GRUPOS.map((g) => (
                      <div key={g.key}>
                        <div className="flex justify-between"><span>{g.titulo} ({g.peso})</span><b>{resultado.prom[g.key] ?? '—'}</b></div>
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${resultado.prom[g.key] ?? 0}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  {resultado.sinCalificar > 0 && <p className="mt-3 text-base text-amber-800 flex items-center gap-1"><AlertTriangle className="w-5 h-5" /> Faltan {resultado.sinCalificar} punto(s) por calificar.</p>}
                  {resultado.total >= 90 && !(rsppVigente && asiVigente) && <p className="mt-2 text-base text-amber-800 flex items-center gap-1"><AlertTriangle className="w-5 h-5" /> Le falta RSPP o ASI vigente para "Excelente".</p>}
                </div>
                <table className="w-full text-base rounded-xl overflow-hidden border-2 border-gray-200">
                  <thead className="bg-gray-800 text-white"><tr><th className="text-left px-4 py-2.5">Nivel</th><th className="text-left px-4 py-2.5">Rango (Tabla 3 del ICA)</th></tr></thead>
                  <tbody>
                    {TABLA_CLASIFICACION.map((f) => (
                      <tr key={f.nivel} className={f.nivel === resultado.clasificacion ? 'bg-emerald-50 font-bold' : 'bg-white'}>
                        <td className="px-4 py-2.5"><span className={`px-2.5 py-0.5 rounded-full border text-sm ${COLOR_CLASIF[f.nivel]}`}>{f.nivel}</span></td>
                        <td className="px-4 py-2.5">{f.rango}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${tarjeta} space-y-4`}>
              <div>
                <label className={lbl} htmlFor="bien-obs">Observaciones generales de la visita</label>
                <textarea id="bien-obs" className={inp} rows={4} value={cab.observaciones} onChange={(e) => setCab({ ...cab, observaciones: e.target.value })} />
              </div>
              <div>
                <p className={lbl}>Fotos generales</p>
                <GaleriaFotos guardadas={fotosGuardadas.filter((f) => f.idIndicador === null && !f.documento)} pendientes={fotosGenerales}
                  onAgregar={(files) => agregarFotos(null, files)} onQuitarPendiente={(i) => quitarPendiente(null, i)}
                  onEliminarGuardada={eliminarGuardada} onVer={setVisor} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior: navegación + resultado + guardar */}
      <div className="vidrio-claro fixed bottom-0 left-0 right-0 border-t border-gray-200 p-3 sm:p-4 shadow-lg z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPaso((p) => Math.max(0, p - 1))} disabled={paso === 0}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30">
              <ArrowLeft className="w-5 h-5" /> Anterior
            </button>
            {paso < PASOS.length - 1 && (
              <button type="button" onClick={() => setPaso((p) => Math.min(PASOS.length - 1, p + 1))}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-base font-semibold">
                Siguiente: {PASOS[paso + 1].titulo} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-800">{resultado.total}%</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${COLOR_CLASIF[resultado.clasificacion]}`}>{resultado.clasificacion}</span>
            {resultado.sinCalificar > 0 && <span className="text-base text-amber-700 hidden md:inline">{resultado.sinCalificar} sin calificar</span>}
            {resultado.sinCalificar === 0 && resultado.pendientes.length === 0 && catalogo.length > 0 && <span className="text-base text-emerald-700 hidden md:flex items-center gap-1"><CheckCircle className="w-5 h-5" /> Todo en 100</span>}
          </div>
          <div className="flex items-center gap-2">
            {guardando && <span className="text-base text-gray-600">{guardando}</span>}
            <button onClick={() => guardar('BORRADOR')} disabled={!!guardando}
              className="flex items-center gap-1.5 border-2 border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50 px-4 py-3 rounded-xl text-base font-semibold">
              <Save className="w-5 h-5" /> Borrador
            </button>
            {pasoKey === 'CIERRE' && (
              <button onClick={() => guardar('FINALIZADA')} disabled={!!guardando}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-base font-bold flex items-center gap-1.5">
                <FileText className="w-5 h-5" /> Finalizar evaluación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloBienestar;
