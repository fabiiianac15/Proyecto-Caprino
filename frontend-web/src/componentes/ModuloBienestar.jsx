import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart, Plus, ArrowLeft, RefreshCw, Trash2, Eye, FileText, Edit2, Camera, X, ImageOff,
  Droplets, PawPrint, ClipboardList, CheckCircle, AlertTriangle, Sparkles, ChevronDown, Users, Save, Info,
} from 'lucide-react';
import { bienestarAPI } from '../servicios/caprino-api';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const inpSm = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const lbl = 'block text-sm font-medium text-gray-600 mb-1.5';

const PESOS = { RECURSOS: 0.35, ANIMAL: 0.55, GESTION: 0.10 };
const GRUPOS = [
  { key: 'RECURSOS', titulo: 'Recursos (35%)', icono: Droplets,      ayuda: 'Instalaciones: agua, comida, comederos, sombra, corrales y piso. Se revisan recorriendo la granja.' },
  { key: 'ANIMAL',   titulo: 'Animal (55%)',   icono: PawPrint,      ayuda: 'Revisar a las cabras de la muestra una por una: gordura, heridas, parásitos, cojeras… Es lo que más pesa.' },
  { key: 'GESTION',  titulo: 'Gestión (10%)',  icono: ClipboardList, ayuda: 'Papeles y registros de la granja: mortalidad, medicamentos, plan sanitario. Se piden al encargado.' },
];
const TIPOS_PRODUCTOR = {
  FAMILIAR:       { label: 'Familiar',                     ayuda: 'Hasta 30 animales, amarrados o sueltos cerca de la casa, con un corral pequeño para dormir.' },
  EXTENSIVO:      { label: 'Extensivo (semi-estabulado)',  ayuda: 'Pastan en potreros, orillas de caminos o lomas; hasta unos 300 animales.' },
  SEMI_INTENSIVO: { label: 'Semi-intensivo',               ayuda: 'Pastan de día y se encierran de noche; reciben concentrado o forraje.' },
  INTENSIVO:      { label: 'Intensivo',                    ayuda: 'Siempre encerradas (estabuladas), sin salir a pastorear.' },
};
const GLOSARIO = [
  ['Muestra', 'Las cabras que se revisan una por una. El sistema dice cuántas según el total del hato.'],
  ['Condición corporal', 'Qué tan gorda o flaca está la cabra, de 1 (muy flaca) a 5 (muy gorda). Lo ideal es 3 o 4.'],
  ['FAMACHA', 'Se baja el párpado de abajo y se mira el color: rosado fuerte (1-2) está bien; pálido indica anemia por parásitos.'],
  ['Ectoparásitos', 'Bichos por fuera del cuerpo: garrapatas, nuches, tábanos, piojos.'],
  ['Nuche', 'Larva de mosca que vive debajo de la piel y forma un bulto con un huequito.'],
  ['Miasis', 'Gusanera: herida con gusanos.'],
  ['Alopecia', 'Parche o zona sin pelo.'],
  ['Mastitis clínica', 'Ubre inflamada, caliente o dura, o leche con grumos, sangre o pus.'],
  ['Estrés térmico', 'Calor: jadea, babea, come menos. Frío: se amontonan unas contra otras.'],
  ['Topizado / descorne', 'Quitar o impedir que crezcan los cuernos.'],
  ['Cama', 'Material en el piso del corral para que se echen (viruta, paja, cascarilla).'],
  ['Confinamiento', 'Cuando las cabras están encerradas en corral o establo.'],
  ['Enriquecimiento ambiental', 'Cosas para que se entretengan: rascaderos, plataformas, troncos, o salir a un potrero.'],
  ['MV / MVZ', 'Médico veterinario / médico veterinario zootecnista con tarjeta profesional.'],
  ['BPUMV', 'Buenas prácticas en el uso de medicamentos: con registro ICA, recetados por veterinario, no vencidos y bien guardados.'],
  ['RSPP / ASI', 'Registros oficiales del ICA para la granja. Pregunte al encargado si los tiene.'],
];
const PUNTAJES = [100, 55, 20, 0];

const COLOR_CLASIF = {
  EXCELENTE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ALTO:      'bg-sky-100 text-sky-700 border-sky-200',
  MEDIO:     'bg-amber-100 text-amber-700 border-amber-200',
  BAJO:      'bg-red-100 text-red-700 border-red-200',
};
const COLOR_PUNTAJE = {
  100: 'bg-emerald-100 text-emerald-700', 55: 'bg-sky-100 text-sky-700',
  20: 'bg-amber-100 text-amber-700', 0: 'bg-red-100 text-red-700',
};

const hoy = () => new Date().toISOString().slice(0, 10);
const cabVacia = () => ({
  fechaEvaluacion: hoy(), tipoProductor: 'EXTENSIVO', numAnimales: '', tamanoMuestra: '',
  evaluadores: '', tieneRspp: false, tieneAsi: false, observaciones: '',
});

// Tabla 1 MEBA: tamaño de muestra mínimo según el número de animales del predio
const muestraMinima = (n) => {
  n = Number(n);
  if (!n || n < 1) return '';
  if (n <= 10) return n;
  if (n <= 50) return 10;
  if (n <= 100) return 20;
  if (n <= 500) return 35;
  if (n <= 1000) return 45;
  return Math.ceil(n * 0.04);
};

// Niveles que existen para el indicador según el PDF (p. ej. Enriquecimiento no tiene 20)
const nivelesDe = (ind) => {
  const n = PUNTAJES.filter((p) => ind.criterios?.[p]);
  return n.length ? n : PUNTAJES;
};

const porcentaje = (v) => (v.nEvaluados > 0 && v.nHallazgo !== '' && v.nHallazgo != null
  ? Math.round((Number(v.nHallazgo) / Number(v.nEvaluados)) * 1000) / 10 : null);

// Puntaje según el conteo del muestreo y los cortes de la tabla del PDF:
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
  let clasificacion = 'BAJO';
  if (total >= 90 && rspp && asi) clasificacion = 'EXCELENTE';
  else if (total >= 75) clasificacion = 'ALTO';
  else if (total >= 50) clasificacion = 'MEDIO';
  const pendientes = catalogo.filter((ind) => {
    const v = valores[ind.idIndicador];
    return v && v.aplica && v.puntaje != null && v.puntaje < 100;
  });
  return { prom, total, clasificacion, pendientes, sinCalificar };
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
  if (err) return <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg text-gray-300`}><ImageOff className="w-5 h-5" /></div>;
  if (!src) return <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg`}><RefreshCw className="w-4 h-4 animate-spin text-gray-300" /></div>;
  return <img src={src} alt={alt} onClick={() => onClick?.(src)} className={`${className} object-cover rounded-lg ${onClick ? 'cursor-zoom-in' : ''}`} />;
};

// Fotos guardadas + pendientes de subir, con botón de cámara/galería
const GaleriaFotos = ({ guardadas = [], pendientes = [], onAgregar, onQuitarPendiente, onEliminarGuardada, onVer, etiqueta = 'Foto' }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {guardadas.map((f) => (
      <div key={f.idFoto} className="relative group">
        <FotoProtegida idFoto={f.idFoto} alt={f.descripcion || 'Evidencia'} className="w-16 h-16" onClick={onVer} />
        {onEliminarGuardada && (
          <button type="button" onClick={() => onEliminarGuardada(f)} title="Eliminar foto"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    ))}
    {pendientes.map((p, i) => (
      <div key={p.url} className="relative">
        <img src={p.url} alt="Pendiente" className="w-16 h-16 object-cover rounded-lg ring-2 ring-amber-300" title="Se subirá al guardar" />
        <button type="button" onClick={() => onQuitarPendiente(i)} title="Quitar"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center">
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
    {onAgregar && (
      <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer text-[10px]">
        <Camera className="w-4 h-4" />
        {etiqueta}
        <input type="file" accept="image/*" capture="environment" multiple className="hidden"
          onChange={(e) => { onAgregar(Array.from(e.target.files || [])); e.target.value = ''; }} />
      </label>
    )}
  </div>
);

const Visor = ({ src, onCerrar }) => src ? (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
    <img src={src} alt="Evidencia" className="max-w-full max-h-full rounded-lg" />
    <button onClick={onCerrar} className="absolute top-4 right-4 text-white"><X className="w-7 h-7" /></button>
  </div>
) : null;

const ModuloBienestar = () => {
  const [vista, setVista] = useState('lista'); // lista | form | detalle
  const [cargando, setCargando] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visor, setVisor] = useState(null);

  // estado del formulario
  const [idEditando, setIdEditando] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [valores, setValores] = useState({});
  const [cab, setCab] = useState(cabVacia());
  const [fotosGuardadas, setFotosGuardadas] = useState([]);
  const [fotosGenerales, setFotosGenerales] = useState([]); // pendientes generales
  const [abiertos, setAbiertos] = useState({}); // criterios desplegados por indicador
  const [guardando, setGuardando] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => { cargarLista(); }, []);

  const cargarLista = async () => {
    setCargando(true);
    try {
      const r = await bienestarAPI.getAll();
      setEvaluaciones(r.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

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

  const iniciarNueva = async () => {
    setError(''); setAviso('');
    setCargando(true);
    try {
      const [cat, sug] = await Promise.all([
        bienestarAPI.getCatalogo('CAPRINO'),
        bienestarAPI.getSugerencias().catch(() => ({})),
      ]);
      const nueva = cabVacia();
      const total = sug._INVENTARIO?.totalAnimales;
      if (total > 0) { nueva.numAnimales = String(total); nueva.tamanoMuestra = String(muestraMinima(total)); }
      const init = {};
      cat.forEach((ind) => { init[ind.idIndicador] = valorVacio(ind, nueva.tipoProductor, sug[ind.codigo]); });
      setCatalogo(cat); setValores(init); setCab(nueva);
      setIdEditando(null); setFotosGuardadas([]); setFotosGenerales([]); setAbiertos({});
      setVista('form');
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
    finally { setCargando(false); }
  };

  const editar = async (id) => {
    setError(''); setAviso('');
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
      setCatalogo(cat); setValores(init);
      setCab({
        fechaEvaluacion: d.fechaEvaluacion?.slice(0, 10) || hoy(),
        tipoProductor: d.tipoProductor || 'EXTENSIVO',
        numAnimales: d.numAnimales ?? '', tamanoMuestra: d.tamanoMuestra ?? '',
        evaluadores: d.evaluadores || '', tieneRspp: d.tieneRspp, tieneAsi: d.tieneAsi,
        observaciones: d.observaciones || '',
      });
      setIdEditando(id); setFotosGuardadas(d.fotos || []); setFotosGenerales([]); setAbiertos({});
      setVista('form');
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); }
    finally { setCargando(false); }
  };

  const setValor = (id, cambios) => setValores((v) => ({ ...v, [id]: { ...v[id], ...cambios } }));

  const setConteo = (ind, campo, valor) => setValores((vs) => {
    const v = { ...vs[ind.idIndicador], [campo]: valor };
    const p = puntajeMuestreo(ind, v);
    if (p !== null) v.puntaje = p;
    return { ...vs, [ind.idIndicador]: v };
  });

  const agregarFotos = (idInd, files) => {
    const nuevas = files.filter((f) => f.type.startsWith('image/')).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (idInd === null) setFotosGenerales((p) => [...p, ...nuevas]);
    else setValores((v) => ({ ...v, [idInd]: { ...v[idInd], pendientes: [...v[idInd].pendientes, ...nuevas] } }));
  };
  const quitarPendiente = (idInd, i) => {
    if (idInd === null) setFotosGenerales((p) => p.filter((_, k) => k !== i));
    else setValores((v) => ({ ...v, [idInd]: { ...v[idInd], pendientes: v[idInd].pendientes.filter((_, k) => k !== i) } }));
  };
  const eliminarGuardada = async (foto) => {
    if (!window.confirm('¿Eliminar esta foto de evidencia?')) return;
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

  const onNumAnimales = (n) => setCab((c) => ({ ...c, numAnimales: n, tamanoMuestra: String(muestraMinima(n)) }));

  const resultado = useMemo(
    () => calcular(catalogo, valores, cab.tieneRspp, cab.tieneAsi),
    [catalogo, valores, cab.tieneRspp, cab.tieneAsi]
  );

  const guardar = async (estado) => {
    setError(''); setAviso('');
    if (estado === 'FINALIZADA' && resultado.sinCalificar > 0) {
      setError(`Faltan ${resultado.sinCalificar} indicador(es) por calificar. Guarda como borrador o márcalos como N/A.`);
      return;
    }
    const conteoMal = catalogo.find((ind) => {
      const v = valores[ind.idIndicador];
      return v.nEvaluados !== '' && v.nHallazgo !== '' && Number(v.nHallazgo) > Number(v.nEvaluados);
    });
    if (conteoMal) { setError(`En «${conteoMal.nombre}» el conteo no puede superar el total evaluado.`); return; }

    setGuardando('Guardando evaluación…');
    try {
      const payload = {
        especie: 'CAPRINO',
        estado,
        fechaEvaluacion: cab.fechaEvaluacion,
        tipoProductor: cab.tipoProductor,
        sistemaProductivo: null,
        numAnimales: cab.numAnimales !== '' ? Number(cab.numAnimales) : null,
        tamanoMuestra: cab.tamanoMuestra !== '' ? Number(cab.tamanoMuestra) : null,
        evaluadores: cab.evaluadores || null,
        tieneRspp: cab.tieneRspp,
        tieneAsi: cab.tieneAsi,
        observaciones: cab.observaciones || null,
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

      // Subir las fotos pendientes (por indicador y generales)
      const cola = [
        ...fotosGenerales.map((p) => ({ idInd: null, file: p.file })),
        ...catalogo.flatMap((ind) => valores[ind.idIndicador].pendientes.map((p) => ({ idInd: ind.idIndicador, file: p.file }))),
      ];
      let fallidas = 0;
      for (let i = 0; i < cola.length; i++) {
        setGuardando(`Subiendo fotos ${i + 1} de ${cola.length}…`);
        try { await bienestarAPI.subirFoto(id, cola[i].file, cola[i].idInd); }
        catch { fallidas += 1; }
      }

      await cargarLista();
      const d = await bienestarAPI.getById(id);
      setDetalle(d);
      setVista('detalle');
      if (fallidas) setAviso(`La evaluación se guardó, pero ${fallidas} foto(s) no se pudieron subir. Edita la evaluación para intentarlo de nuevo.`);
    } catch (e) { setError(e.message || 'Error al guardar'); }
    finally { setGuardando(''); }
  };

  const verDetalle = async (id) => {
    setCargando(true); setAviso('');
    try {
      const d = await bienestarAPI.getById(id);
      setDetalle(d);
      setVista('detalle');
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta evaluación de bienestar y sus fotos?')) return;
    try { await bienestarAPI.delete(id); await cargarLista(); }
    catch (e) { alert(e.message); }
  };

  // ---------------- LISTA ----------------
  if (vista === 'lista') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl shadow-lg p-7 text-white mb-5 relative overflow-hidden">
          <Heart className="absolute -right-6 -bottom-10 w-48 h-48 text-white/10" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><Heart className="w-6 h-6 text-white" /></div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Bienestar Animal</h1>
                <p className="text-green-100 text-sm">Evaluación del hato con la guía MEBA del ICA (v3.0, 2026)</p>
              </div>
            </div>
            <button onClick={iniciarNueva} className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 hover:bg-green-50 rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Nueva evaluación
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

        {cargando ? (
          <div className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : evaluaciones.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aún no hay evaluaciones de bienestar registradas.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {evaluaciones.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.estado === 'BORRADOR'
                      ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">BORRADOR</span>
                      : <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CLASIF[e.clasificacion] || ''}`}>{e.clasificacion}</span>}
                    <span className="text-lg font-bold text-gray-800">{e.puntTotal}%</span>
                    {e.numFotos > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{e.numFotos}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{e.fechaEvaluacion?.slice(0, 10)} · {TIPOS_PRODUCTOR[e.tipoProductor]?.label || e.tipoProductor} · {e.numAnimales || '—'} animales</p>
                  {e.evaluadores && <p className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1"><Users className="w-3 h-3" />{e.evaluadores}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => verDetalle(e.id)} title="Ver" className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => editar(e.id)} title="Editar / completar" className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(e.id)} title="Eliminar" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
    const fotosDe = (idInd) => (detalle.fotos || []).filter((f) => f.idIndicador === idInd);
    const mejorar = (detalle.detalle || []).filter((d) => d.aplica && d.puntaje != null && d.puntaje < 100);
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Visor src={visor} onCerrar={() => setVisor(null)} />
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"><ArrowLeft className="w-4 h-4" /> Volver</button>
          <button onClick={() => editar(detalle.id)} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"><Edit2 className="w-4 h-4" /> Editar</button>
        </div>
        {aviso && <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{aviso}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${COLOR_CLASIF[detalle.clasificacion] || ''}`}>{detalle.clasificacion}</span>
                {detalle.estado === 'BORRADOR' && <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600">BORRADOR</span>}
              </div>
              <p className="text-3xl font-bold text-gray-800 mt-2">{detalle.puntTotal}%</p>
              <p className="text-sm text-gray-500">{detalle.fechaEvaluacion?.slice(0, 10)} · {TIPOS_PRODUCTOR[detalle.tipoProductor]?.label || detalle.tipoProductor} · {detalle.numAnimales ?? '—'} animales · muestra {detalle.tamanoMuestra ?? '—'}</p>
              {detalle.evaluadores && <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {detalle.evaluadores}</p>}
              <p className="text-xs text-gray-400 mt-1">RSPP: {detalle.tieneRspp ? 'Sí' : 'No'} · ASI: {detalle.tieneAsi ? 'Sí' : 'No'}</p>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p>Recursos: <b>{detalle.puntRecursos ?? '—'}</b></p>
              <p>Animal: <b>{detalle.puntAnimal ?? '—'}</b></p>
              <p>Gestión: <b>{detalle.puntGestion ?? '—'}</b></p>
            </div>
          </div>
          {detalle.observaciones && <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{detalle.observaciones}</p>}
          {fotosDe(null).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Fotos generales de la visita</p>
              <GaleriaFotos guardadas={fotosDe(null)} onVer={setVisor} />
            </div>
          )}
        </div>

        {mejorar.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">Para mejorar ({mejorar.length} indicadores por debajo de 100)</p>
            <ul className="text-sm text-amber-700 space-y-0.5">
              {mejorar.map((d) => <li key={d.idDetalle}>• {d.nombre} — <b>{d.puntaje}</b></li>)}
            </ul>
          </div>
        )}

        {GRUPOS.map((g) => {
          const items = (detalle.detalle || []).filter((d) => d.tipoMedida === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
              <h3 className="font-semibold text-gray-700 mb-2">{g.titulo}</h3>
              <div className="divide-y divide-gray-50">
                {items.map((d) => {
                  const pct = porcentaje(d);
                  const fotos = fotosDe(d.idIndicador);
                  return (
                    <div key={d.idDetalle} className="py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className={d.aplica ? 'text-gray-700' : 'text-gray-400 line-through'}>{d.nombre}</span>
                        {!d.aplica ? <span className="text-xs text-gray-400">N/A</span>
                          : d.puntaje == null ? <span className="text-xs text-gray-400 italic">Sin calificar</span>
                          : <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${COLOR_PUNTAJE[d.puntaje]}`}>{d.puntaje}</span>}
                      </div>
                      {d.aplica && (pct !== null || d.observacion || d.soporteDoc || fotos.length > 0) && (
                        <div className="mt-1.5 space-y-1.5 text-xs text-gray-500">
                          {pct !== null && (
                            <p>Conteo: {d.nHallazgo} de {d.nEvaluados} {d.unidad || ''} {d.medicion === 'CUMPLE' ? 'están bien' : 'tienen el problema'} ({pct}%)</p>
                          )}
                          {d.observacion && <p className="text-gray-600">Obs.: {d.observacion}</p>}
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

  // ---------------- FORMULARIO (nueva / editar) ----------------
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-40">
      <Visor src={visor} onCerrar={() => setVisor(null)} />
      <button onClick={() => setVista('lista')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Cancelar</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{idEditando ? 'Completar / editar evaluación' : 'Nueva evaluación de bienestar'}</h1>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 text-sm text-emerald-900">
        <p className="font-semibold flex items-center gap-1.5 mb-1.5"><Info className="w-4 h-4" /> Cómo llenar la evaluación (guía del ICA)</p>
        <ol className="list-decimal ml-5 space-y-0.5 text-emerald-800">
          <li>Llene los datos de la granja. El sistema dice <b>cuántas cabras revisar una por una</b>.</li>
          <li>Cada punto tiene una <b>pregunta</b>. Lea "Ver qué significa cada puntaje" y elija <b>100, 55, 20 o 0</b> (100 = está muy bien, 0 = está mal).</li>
          <li>En los puntos marcados <b>"Contar"</b>, escriba cuántos revisó y cuántos están bien (o tienen el problema): el puntaje sale solo.</li>
          <li>Si un punto no corresponde a esta granja, toque <b>"No aplica"</b>.</li>
          <li>Tome <b>fotos</b> de lo que vea y escriba una observación corta.</li>
          <li>Puede <b>guardar como borrador</b> y seguir otro día. Al terminar todo, toque <b>"Finalizar evaluación"</b>.</li>
        </ol>
        <button type="button" onClick={() => setAbiertos((a) => ({ ...a, _glosario: !a._glosario }))} className="mt-2 text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
          <ChevronDown className={`w-3 h-3 transition-transform ${abiertos._glosario ? 'rotate-180' : ''}`} /> Palabras que quizá no conozca
        </button>
        {abiertos._glosario && (
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {GLOSARIO.map(([t, d]) => <div key={t}><dt className="inline font-semibold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
          </dl>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      {/* Datos del predio / visita */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Tipo de productor</label>
          <select className={inp} value={cab.tipoProductor} onChange={(e) => onTipoProductor(e.target.value)}>
            {Object.entries(TIPOS_PRODUCTOR).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">{TIPOS_PRODUCTOR[cab.tipoProductor]?.ayuda}</p>
        </div>
        <div>
          <label className={lbl}>¿Cuántas cabras hay en total?</label>
          <input type="number" min="0" className={inp} value={cab.numAnimales} onChange={(e) => onNumAnimales(e.target.value)} />
        </div>
        <div>
          <label className={lbl}>¿Cuántas revisar una por una?</label>
          <input type="number" min="0" className={inp} value={cab.tamanoMuestra} onChange={(e) => setCab({ ...cab, tamanoMuestra: e.target.value })} />
          {cab.numAnimales !== '' && <p className="text-[11px] text-gray-400 mt-1">Mínimo que pide el ICA: {muestraMinima(cab.numAnimales)}. Escójalas de varias edades (crías, jóvenes y adultas).</p>}
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className={lbl}>Evaluadores</label>
          <input className={inp} placeholder="Ej: Ana Pérez, Juan Gómez (estudiantes) — Prof. ..." value={cab.evaluadores} onChange={(e) => setCab({ ...cab, evaluadores: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
          <input type="checkbox" checked={cab.tieneRspp} onChange={(e) => setCab({ ...cab, tieneRspp: e.target.checked })} />
          La granja tiene el RSPP (Registro Sanitario de Predio Pecuario del ICA)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
          <input type="checkbox" checked={cab.tieneAsi} onChange={(e) => setCab({ ...cab, tieneAsi: e.target.checked })} />
          La granja tiene la ASI (Autorización Sanitaria y de Inocuidad del ICA)
        </label>
        <p className="col-span-2 md:col-span-4 text-[11px] text-gray-400 -mt-1">Si no sabe, pregunte al encargado. Sin estos dos registros la granja no puede quedar en "Excelente".</p>
      </div>

      {/* Indicadores por grupo */}
      {GRUPOS.map((g) => {
        const Icono = g.icono;
        const items = catalogo.filter((c) => c.tipoMedida === g.key);
        const aplicables = items.filter((c) => valores[c.idIndicador]?.aplica);
        const calificados = aplicables.filter((c) => valores[c.idIndicador]?.puntaje != null);
        return (
          <div key={g.key} className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h3 className="flex items-center justify-between gap-2 font-semibold text-gray-700 mb-3">
              <span className="flex items-center gap-2"><Icono className="w-4 h-4" /> {g.titulo}</span>
              <span className="text-xs font-normal text-gray-400">{calificados.length}/{aplicables.length} calificados</span>
            </h3>
            <p className="text-xs text-gray-500 -mt-2 mb-3">{g.ayuda}</p>
            <div className="space-y-3">
              {items.map((ind) => {
                const v = valores[ind.idIndicador];
                if (!v) return null;
                const niveles = nivelesDe(ind);
                const pct = porcentaje(v);
                const sugerido = puntajeMuestreo(ind, v);
                const abierto = abiertos[ind.idIndicador];
                const guardadas = fotosGuardadas.filter((f) => f.idIndicador === ind.idIndicador);
                return (
                  <div key={ind.idIndicador} className={`rounded-lg border p-3 ${v.aplica ? (v.puntaje == null ? 'border-amber-200' : 'border-gray-100') : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <p className="text-sm font-medium text-gray-700">{ind.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {ind.referencia && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{ind.referencia}</span>}
                          {ind.esDocumental && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">Revisar papeles</span>}
                          {ind.soloConfinamiento && <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">Solo si están encerradas</span>}
                          {ind.medicion && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">Contar</span>}
                          {ind.fuenteModulo && <span className="text-[10px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />Hay datos en {ind.fuenteModulo}</span>}
                        </div>
                        {ind.pregunta && <p className="text-xs text-gray-600 mt-1.5">{ind.pregunta}</p>}
                        {ind.metodo && <p className="text-[11px] text-gray-400 mt-0.5">Cómo se revisa: {ind.metodo}</p>}
                        {v.info && <p className="text-[11px] text-sky-600 mt-0.5">{v.info}</p>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {niveles.map((p) => (
                          <button key={p} type="button" disabled={!v.aplica} onClick={() => setValor(ind.idIndicador, { puntaje: p })}
                            title={ind.criterios?.[p] || ''}
                            className={`w-10 h-9 rounded-lg text-xs font-semibold border transition ${v.puntaje === p && v.aplica ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'} ${!v.aplica ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            {p}
                          </button>
                        ))}
                        <button type="button" onClick={() => setValor(ind.idIndicador, { aplica: !v.aplica })} title="Marcar si este punto no aplica en esta granja"
                          className={`ml-1 px-2 h-9 rounded-lg text-xs border ${!v.aplica ? 'bg-gray-200 text-gray-600 border-gray-300' : 'bg-white text-gray-400 border-gray-200'}`}>
                          No aplica
                        </button>
                      </div>
                    </div>

                    {v.aplica && (
                      <>
                        {/* Muestreo: conteo -> % -> puntaje */}
                        {ind.medicion && (
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs text-gray-600 bg-emerald-50/60 rounded-lg px-3 py-2">
                            <span>¿Cuántos {ind.unidad} revisó?</span>
                            <input type="number" min="0" className={`${inpSm} w-20`} value={v.nEvaluados}
                              onChange={(e) => setConteo(ind, 'nEvaluados', e.target.value)} />
                            <span>{ind.medicion === 'CUMPLE' ? '¿Cuántos están bien?' : '¿Cuántos tienen el problema?'}</span>
                            <input type="number" min="0" className={`${inpSm} w-20`} value={v.nHallazgo}
                              onChange={(e) => setConteo(ind, 'nHallazgo', e.target.value)} />
                            {pct !== null && (
                              <span className={pct > 100 ? 'text-red-600 font-medium' : 'font-medium'}>
                                = {pct}% {sugerido !== null && <>→ puntaje <b>{sugerido}</b></>}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Criterio del nivel elegido + todos los criterios */}
                        {v.puntaje != null && ind.criterios?.[v.puntaje] && (
                          <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-1.5"><b>{v.puntaje}:</b> {ind.criterios[v.puntaje]}</p>
                        )}
                        {ind.criterios?.[100] && (
                          <button type="button" onClick={() => setAbiertos((a) => ({ ...a, [ind.idIndicador]: !a[ind.idIndicador] }))}
                            className="mt-1.5 text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                            <ChevronDown className={`w-3 h-3 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                            {abierto ? 'Ocultar qué significa cada puntaje' : 'Ver qué significa cada puntaje'}
                          </button>
                        )}
                        {abierto && (
                          <div className="mt-1.5 space-y-1">
                            {niveles.map((p) => (
                              <button key={p} type="button" onClick={() => setValor(ind.idIndicador, { puntaje: p })}
                                className={`w-full text-left text-xs rounded-lg px-3 py-1.5 border ${v.puntaje === p ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <span className={`inline-block w-9 text-center mr-2 rounded font-bold ${COLOR_PUNTAJE[p]}`}>{p}</span>
                                {ind.criterios[p]}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input className={inpSm} placeholder="Observación (qué se vio, dónde, animales afectados…)"
                            value={v.observacion} onChange={(e) => setValor(ind.idIndicador, { observacion: e.target.value })} maxLength={500} />
                          {ind.esDocumental && (
                            <input className={inpSm} placeholder="Soporte / documento revisado"
                              value={v.soporteDoc} onChange={(e) => setValor(ind.idIndicador, { soporteDoc: e.target.value })} />
                          )}
                        </div>
                        <div className="mt-2.5">
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
          </div>
        );
      })}

      {/* Observaciones y fotos generales */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
        <div>
          <label className={lbl}>Observaciones generales de la visita</label>
          <textarea className={inp} rows={3} value={cab.observaciones} onChange={(e) => setCab({ ...cab, observaciones: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Fotos generales</label>
          <GaleriaFotos guardadas={fotosGuardadas.filter((f) => f.idIndicador === null)} pendientes={fotosGenerales}
            onAgregar={(files) => agregarFotos(null, files)} onQuitarPendiente={(i) => quitarPendiente(null, i)}
            onEliminarGuardada={eliminarGuardada} onVer={setVisor} />
        </div>
      </div>

      {/* Barra de resultado fija */}
      <div className="vidrio-claro fixed bottom-0 left-0 right-0 border-t border-gray-200 p-3 sm:p-4 shadow-lg z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Resultado</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{resultado.total}%</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CLASIF[resultado.clasificacion]}`}>{resultado.clasificacion}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              Recursos {resultado.prom.RECURSOS ?? '—'} · Animal {resultado.prom.ANIMAL ?? '—'} · Gestión {resultado.prom.GESTION ?? '—'}
            </div>
            {resultado.sinCalificar > 0 && (
              <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {resultado.sinCalificar} sin calificar</span>
            )}
            {resultado.total >= 90 && !(cab.tieneRspp && cab.tieneAsi) && (
              <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Falta RSPP/ASI para "Excelente"</span>
            )}
            {resultado.sinCalificar === 0 && resultado.pendientes.length > 0 && (
              <span className="text-xs text-gray-400 hidden md:flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {resultado.pendientes.length} indicador(es) por debajo de 100</span>
            )}
            {resultado.sinCalificar === 0 && resultado.pendientes.length === 0 && catalogo.length > 0 && (
              <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Todos los indicadores en 100</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {guardando && <span className="text-xs text-gray-500">{guardando}</span>}
            <button onClick={() => guardar('BORRADOR')} disabled={!!guardando}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-medium">
              <Save className="w-4 h-4" /> Borrador
            </button>
            <button onClick={() => guardar('FINALIZADA')} disabled={!!guardando}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
              Finalizar evaluación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloBienestar;
