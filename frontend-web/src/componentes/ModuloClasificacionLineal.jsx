import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Ruler, Plus, ArrowLeft, ArrowRight, RefreshCw, Trash2, Eye, Camera, Edit2, Image as ImageIcon,
  CheckCircle, AlertTriangle, Info, X, ChevronDown, Scale, Wand2, Hand, Save, BookOpen, Flag, PawPrint,
} from 'lucide-react';
import { clasificacionLinealAPI, animalesAPI, reproduccionAPI, razasAPI } from '../servicios/caprino-api';
import SelectAnimal from './SelectAnimal';
import CarruselFotos from './CarruselFotos';
import ControlLetra from './ControlLetra';
import {
  NIVELES, aNumero, fmt, indexarReferencias, calcularRasgos, limitesRegla, explicarRangos, compararMedida, anguloGrupa,
  etapaPorEdad, origenReferencia, deDeValor, textoFuentePerfil, perfilParaEdad,
} from '../utilidades/morfometria';
import { CriteriosUso, EstandaresRaza, DatosPublicados, FichaTecnica, Bibliografia } from './ReferenciasPublicadas';

const inp = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white';
const lbl = 'block text-base font-semibold text-gray-700 mb-2';
const tarjeta = 'bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm';

const FACTOR = { 1: 0.10, 2: 0.50, 3: 1.00 };
const SEXOS = {
  HEMBRA: {
    titulo: 'Hembras', singular: 'hembra', articulo: 'la cabra', color: 'rose',
    descripcion: 'Cabras adultas, idealmente unos 45 días después del parto. 100 puntos: apariencia, fortaleza lechera, sistema mamario y patas.',
    regiones: [
      { key: 'APARIENCIA', titulo: 'Apariencia general y capacidad', ayuda: 'Tamaño y forma del cuerpo.', pts: 25 },
      { key: 'ESTRUCTURA', titulo: 'Estructura y fortaleza lechera', ayuda: 'Qué tanto "se ve lechera": fina, angulosa y con buen hueso.', pts: 15 },
      { key: 'MAMARIO',    titulo: 'Sistema mamario',                ayuda: 'La ubre y los pezones. Es lo que más puntos da.', pts: 40 },
      { key: 'PATAS',      titulo: 'Patas y pezuñas',                ayuda: 'Cómo son las patas y cómo camina.', pts: 20 },
    ],
  },
  MACHO: {
    titulo: 'Machos', singular: 'macho', articulo: 'el macho', color: 'indigo',
    descripcion: 'Reproductores adultos. 100 puntos: apariencia general con patas y testículos, fortaleza lechera y capacidad corporal (sin sistema mamario).',
    regiones: [
      { key: 'APARIENCIA', titulo: 'Apariencia general, patas y testículos', ayuda: 'Tamaño, grupa, aplomos, cómo camina y testículos. En un macho las patas pesan mucho: debe poder montar sin dolor.', pts: 55 },
      { key: 'ESTRUCTURA', titulo: 'Fortaleza lechera',                       ayuda: 'Que transmita carácter lechero a sus hijas: anguloso, limpio, sin aspecto de "carnudo".', pts: 30 },
      { key: 'CAPACIDAD',  titulo: 'Capacidad corporal',                      ayuda: 'Pecho y cuerpo amplios: fuerza y vigor.', pts: 15 },
    ],
  },
};
const GRUPOS_MEDIDA = [
  { key: 'CUERPO',    titulo: 'Cuerpo',         ayuda: 'Con bastón zoométrico, cinta métrica y compás.' },
  { key: 'UBRE',      titulo: 'Ubre y pezones', ayuda: 'Con cinta, regla y calibrador. Mejor antes del ordeño, siempre a la misma hora.' },
  { key: 'TESTICULO', titulo: 'Testículos',     ayuda: 'Con cinta métrica, bajando los dos testículos al fondo de la bolsa.' },
  { key: 'PESO',      titulo: 'Peso',           ayuda: 'Con báscula.' },
];
const VISTAS = [
  { key: 'LATERAL',    label: 'De lado',        ayuda: 'Lado izquierdo, a 2-3 m, celular a la altura de la barriga. Que se vea completa.' },
  { key: 'POSTERIOR',  label: 'Desde atrás',    ayuda: 'Centrado en la cola, a 2 m: grupa y patas traseras.' },
  { key: 'FRONTAL',    label: 'De frente',      ayuda: 'A 2 m, centrado en el pecho: las dos patas delanteras.' },
  { key: 'UBRE_LAT',   label: 'Ubre de lado',   ayuda: 'De cerca, que se vea el corvejón para comparar.', sexo: 'HEMBRA' },
  { key: 'UBRE_POST',  label: 'Ubre de atrás',  ayuda: 'Desde atrás, de la vulva a la punta de los pezones.', sexo: 'HEMBRA' },
  { key: 'TESTICULOS', label: 'Testículos',     ayuda: 'Desde atrás, con la bolsa completa a la vista.', sexo: 'MACHO' },
  { key: 'PATAS',      label: 'Patas',          ayuda: 'Patas traseras en piso plano, a la altura del corvejón.' },
  { key: 'MEDICION',   label: 'Medición',       ayuda: 'La cinta o el bastón marcando la lectura. Puede subir varias.', varias: true },
];
const PROTOCOLO = [
  ['Piso', 'Plano y firme. En pendiente cambian la alzada y los aplomos.'],
  ['Postura', 'Parada, tranquila, con las cuatro patas derechas y la cabeza en posición normal.'],
  ['Fondo', 'Pared o lona lisa que contraste con el animal, sin otros animales detrás.'],
  ['Cámara', 'Celular horizontal, sin zoom, a la mitad del cuerpo y perpendicular al animal.'],
  ['Referencia', 'Una vara marcada cada 10 cm parada junto al animal, en la misma línea del cuerpo.'],
  ['Luz', 'De día, con el sol a la espalda de quien toma la foto o en sombra pareja.'],
];
const CON_DIBUJO = new Set(['ANCPEC', 'ANGUL', 'ANGRU', 'ANCHGRU', 'PTVL', 'INAU', 'LSM', 'DIAPE', 'COLPE', 'AILPU', 'PROFUB']);
const dibujoDe = (codigo) => { const base = codigo.replace(/^M_/, ''); return CON_DIBUJO.has(base) ? base : null; };
const COLOR_CAT = {
  EXCELENTE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  MUY_BUENO: 'bg-teal-100 text-teal-800 border-teal-300',
  BUENO:     'bg-sky-100 text-sky-800 border-sky-300',
  ACEPTABLE: 'bg-amber-100 text-amber-800 border-amber-300',
  REGULAR:   'bg-orange-100 text-orange-800 border-orange-300',
  POBRE:     'bg-red-100 text-red-800 border-red-300',
};
const CATEGORIAS = [['EXCELENTE', '90 a 100'], ['MUY_BUENO', '85 a 89'], ['BUENO', '80 a 84'], ['ACEPTABLE', '70 a 79'], ['REGULAR', '60 a 69'], ['POBRE', 'menos de 60']];
const GLOSARIO = [
  ['Cruz', 'La parte más alta de la espalda, encima de las patas delanteras.'],
  ['Grupa', 'La cadera: la parte de atrás, arriba de la cola.'],
  ['Encuentro', 'La punta del hombro, adelante del pecho.'],
  ['Isquion', 'La punta de la nalga: el hueso que sobresale a cada lado de la cola.'],
  ['Ilíacos', 'Los dos huesos salientes de la cadera, arriba.'],
  ['Corvejón', 'La articulación que dobla en la pata de atrás.'],
  ['Caña', 'La parte delgada de la pata, entre la rodilla y el menudillo.'],
  ['Bastón zoométrico', 'Regla vertical con un brazo que se desliza; mide alturas y largos rectos.'],
  ['Compás de brazos', 'Compás grande para medir anchos (pecho, grupa).'],
  ['Calibrador (pie de rey)', 'Regla con mordazas para medir cosas pequeñas como los pezones.'],
  ['Desviación', 'Cuánto varían normalmente los animales de una raza alrededor del promedio.'],
];
const PASOS = [
  { key: 'ANIMAL', titulo: 'Animal', icono: PawPrint },
  { key: 'MEDIDAS', titulo: 'Medidas', icono: Ruler },
  { key: 'RASGOS', titulo: 'Rasgos', icono: Scale },
  { key: 'RESUMEN', titulo: 'Resumen', icono: Flag },
];

const hoy = () => new Date().toISOString().slice(0, 10);
const cabVacia = () => ({ idAnimal: null, fechaEvaluacion: hoy(), edadMeses: '', numLactancia: '', observaciones: '' });
const nombreCabra = (codigo, nombre) => (nombre ? `${codigo} — ${nombre}` : codigo);
const mesesDesde = (fecha) => {
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  return Math.max(0, Math.floor((Date.now() - d) / (30.44 * 86400000)));
};

const calcular = (catalogo, valores) => {
  const subtotales = {};
  catalogo.forEach((r) => {
    subtotales[r.region] = subtotales[r.region] || 0;
    const cal = valores[r.idRasgo];
    if (cal) subtotales[r.region] += r.ptsRasgo * (FACTOR[cal] || 0);
  });
  Object.keys(subtotales).forEach((k) => { subtotales[k] = Math.round(subtotales[k] * 100) / 100; });
  const puntFinal = Math.round(Object.values(subtotales).reduce((a, b) => a + b, 0) * 100) / 100;
  let categoria = 'POBRE';
  if (puntFinal >= 90) categoria = 'EXCELENTE';
  else if (puntFinal >= 85) categoria = 'MUY_BUENO';
  else if (puntFinal >= 80) categoria = 'BUENO';
  else if (puntFinal >= 70) categoria = 'ACEPTABLE';
  else if (puntFinal >= 60) categoria = 'REGULAR';
  return { subtotales, puntFinal, categoria };
};

const Visor = ({ src, onCerrar }) => src ? (
  <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
    <img src={src} alt="Ampliada" className="max-w-full max-h-full rounded-lg bg-white" />
    <button onClick={onCerrar} aria-label="Cerrar" className="absolute top-4 right-4 text-white"><X className="w-8 h-8" /></button>
  </div>
) : null;

const BotonesFoto = ({ onArchivo, compacto = false }) => {
  const cam = useRef(null);
  const gal = useRef(null);
  const elegir = (e) => { const f = e.target.files?.[0]; if (f) onArchivo(f); e.target.value = ''; };
  const cls = `flex-1 flex flex-col items-center justify-center bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-700 rounded-xl border-2 border-dashed border-gray-300 ${compacto ? 'h-16' : 'h-20'}`;
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => cam.current?.click()} className={cls}><Camera className="w-6 h-6" /><span className="text-sm">Cámara</span></button>
      <button type="button" onClick={() => gal.current?.click()} className={cls}><ImageIcon className="w-6 h-6" /><span className="text-sm">Galería</span></button>
      <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={elegir} />
      <input ref={gal} type="file" accept="image/*" className="hidden" onChange={elegir} />
    </div>
  );
};

const MORFO_VACIA = { perfiles: [], estandares: [], fuentes: [] };

// Etiqueta: la referencia es publicada (con su código de fuente), aproximada o ajustada por el docente
const OrigenRef = ({ fuente }) => {
  const o = origenReferencia(fuente);
  if (o.tipo === 'PUBLICADA') return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300" title={fuente}>Publicada · {o.codigo}</span>;
  if (o.tipo === 'APROXIMADA') return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300" title="Valor inicial aproximado: validar con el docente">Aproximada</span>;
  return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300" title={fuente}>Ajustada por el docente</span>;
};

// Recuadro que explica qué significan Bajo / Medio / Alto
const QueSignifica = ({ raza, sexo }) => (
  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-base text-sky-950">
    <p className="text-lg font-bold flex items-center gap-2"><Info className="w-5 h-5" /> ¿Qué significan Bajo, Medio y Alto?</p>
    <p className="mt-1">Cada medida se compara con la de {sexo === 'MACHO' ? 'un macho' : 'una hembra'} adult{sexo === 'MACHO' ? 'o' : 'a'} típic{sexo === 'MACHO' ? 'o' : 'a'} de la raza <b>{raza || 'del animal'}</b>:</p>
    <ul className="mt-2 grid sm:grid-cols-3 gap-2">
      <li className={`rounded-xl border px-3 py-2 ${NIVELES[1].color}`}><b>1 · Bajo:</b> por debajo de lo normal para su raza (más pequeño, más angosto).</li>
      <li className={`rounded-xl border px-3 py-2 ${NIVELES[2].color}`}><b>2 · Medio:</b> dentro de lo normal: el promedio de la raza más o menos una desviación. Ahí está cerca de 7 de cada 10 animales.</li>
      <li className={`rounded-xl border px-3 py-2 ${NIVELES[3].color}`}><b>3 · Alto:</b> por encima de lo normal (más grande, más ancho).</li>
    </ul>
    <p className="mt-2 text-sm text-sky-800">"Alto" no siempre quiere decir "mejor" en todo: cada rasgo dice qué se busca. Los rasgos que no se pueden medir con cinta o bastón (ubre, aplomos, angulosidad) se califican a la vista con el dibujo.</p>
  </div>
);

const ModuloClasificacionLineal = () => {
  const [params, setParams] = useSearchParams();
  const seccion = params.get('seccion'); // null | hembras | machos | referencias
  const sexoSeccion = seccion === 'machos' ? 'MACHO' : 'HEMBRA';
  const irSeccion = (s) => { setParams(s ? { seccion: s } : {}); setVista('lista'); };

  const [vista, setVista] = useState('lista'); // lista | form | detalle
  const [cargando, setCargando] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visor, setVisor] = useState(null);
  const [razas, setRazas] = useState([]);

  const [animales, setAnimales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sexoForm, setSexoForm] = useState('HEMBRA');
  const [catalogo, setCatalogo] = useState([]);
  const [medidasCat, setMedidasCat] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [referencias, setReferencias] = useState([]);
  const [valores, setValores] = useState({});
  const [manuales, setManuales] = useState({}); // idRasgo -> true si se eligió a mano
  const [medidas, setMedidas] = useState({});
  const [metodos, setMetodos] = useState({});
  const [cab, setCab] = useState(cabVacia());
  const [idEditando, setIdEditando] = useState(null);
  const [partoInfo, setPartoInfo] = useState(null);
  const [abiertos, setAbiertos] = useState({});
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState('');
  const [error, setError] = useState('');

  // Editor de referencias
  const [refRaza, setRefRaza] = useState('');
  const [refSexo, setRefSexo] = useState('HEMBRA');
  const [refFilas, setRefFilas] = useState({});
  const [refMensaje, setRefMensaje] = useState('');
  const [medidasTodas, setMedidasTodas] = useState([]);
  const [refOrigen, setRefOrigen] = useState({}); // codigo -> fuente guardada
  // Base morfométrica publicada de la raza (editor de referencias y formulario)
  const [morfo, setMorfo] = useState(MORFO_VACIA);

  useEffect(() => {
    cargarLista();
    animalesAPI.getAll().then((r) => setAnimales(r.data || [])).catch(() => setAnimales([]));
    razasAPI.getAll().then((r) => setRazas(r.data || [])).catch(() => setRazas([]));
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [paso, vista, seccion]);

  const cargarLista = async () => {
    setCargando(true);
    try { const r = await clasificacionLinealAPI.getAll(); setEvaluaciones(r.data); }
    catch (e) { setError(e.message || 'No se pudo cargar la lista'); } finally { setCargando(false); }
  };

  const conf = SEXOS[sexoForm];
  const delSexo = useMemo(
    () => animales.filter((a) => a.sexo?.toLowerCase() === sexoForm.toLowerCase() && (a.estado || 'activo') === 'activo'),
    [animales, sexoForm]
  );
  const animalElegido = animales.find((a) => a.id === cab.idAnimal);
  const refsIdx = useMemo(() => indexarReferencias(referencias), [referencias]);
  const autoRasgos = useMemo(() => calcularRasgos(reglas, medidas, refsIdx), [reglas, medidas, refsIdx]);
  const reglaPorRasgo = useMemo(() => Object.fromEntries(reglas.map((r) => [r.codigoRasgo, r])), [reglas]);
  const toggle = (k) => setAbiertos((a) => ({ ...a, [k]: !a[k] }));

  // Las calificaciones calculadas con medidas se aplican solas, salvo las que el evaluador cambió a mano
  useEffect(() => {
    if (!catalogo.length) return;
    setValores((v) => {
      const nv = { ...v };
      let cambio = false;
      catalogo.forEach((r) => {
        const a = autoRasgos[r.codigo];
        if (a && !manuales[r.idRasgo] && nv[r.idRasgo] !== a.calif) { nv[r.idRasgo] = a.calif; cambio = true; }
      });
      return cambio ? nv : v;
    });
  }, [autoRasgos, catalogo, manuales]);

  const cargarCatalogo = async (sexo) => {
    const { rasgos, medidas: med, reglas: rg } = await clasificacionLinealAPI.getCatalogoCompleto(sexo);
    setCatalogo(rasgos); setMedidasCat(med); setReglas(rg);
  };
  const cargarMorfo = async (idRaza) => {
    try { setMorfo(await clasificacionLinealAPI.getMorfometria(idRaza)); } catch { setMorfo(MORFO_VACIA); }
  };
  const cargarReferencias = async (idRaza, sexo) => {
    if (!idRaza) { setReferencias([]); setMorfo(MORFO_VACIA); return; }
    cargarMorfo(idRaza);
    try { setReferencias(await clasificacionLinealAPI.getReferencias({ idRaza, sexo })); } catch { setReferencias([]); }
  };

  const iniciarNueva = async (sexo) => {
    setError(''); setCargando(true);
    try {
      await cargarCatalogo(sexo);
      setSexoForm(sexo);
      setValores({}); setManuales({}); setMedidas({}); setMetodos({}); setReferencias([]);
      setCab(cabVacia()); setIdEditando(null); setPartoInfo(null);
      setAbiertos({}); setPaso(0);
      setVista('form');
    } catch (e) { setError(e.message || 'No se pudo cargar el catálogo'); }
    finally { setCargando(false); }
  };

  const editar = async (id) => {
    setError(''); setCargando(true);
    try {
      const d = await clasificacionLinealAPI.getById(id);
      const sexo = d.sexo === 'MACHO' ? 'MACHO' : 'HEMBRA';
      await cargarCatalogo(sexo);
      await cargarReferencias(d.idRaza, sexo);
      setSexoForm(sexo);
      setValores(Object.fromEntries((d.detalle || []).map((x) => [x.idRasgo, x.calificacion])));
      setManuales(Object.fromEntries((d.detalle || []).filter((x) => x.origen !== 'MEDIDA').map((x) => [x.idRasgo, true])));
      setMedidas(Object.fromEntries((d.medidas || []).map((m) => [m.codigo, String(m.valor)])));
      setMetodos(Object.fromEntries((d.medidas || []).map((m) => [m.codigo, m.metodo || 'INSTRUMENTO'])));
      setCab({
        idAnimal: d.idAnimal, fechaEvaluacion: d.fechaEvaluacion?.slice(0, 10) || hoy(),
        edadMeses: d.edadMeses ?? '', numLactancia: d.numLactancia ?? '', observaciones: d.observaciones || '',
      });
      setIdEditando(id); setPartoInfo(null); setAbiertos({}); setPaso(1);
      setVista('form');
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); }
    finally { setCargando(false); }
  };

  const elegirAnimal = async (id) => {
    const a = animales.find((x) => x.id === id);
    setCab((c) => ({ ...c, idAnimal: id, edadMeses: a?.fechaNacimiento ? String(mesesDesde(a.fechaNacimiento)) : c.edadMeses }));
    setPartoInfo(null);
    cargarReferencias(a?.idRaza, sexoForm);
    if (sexoForm !== 'HEMBRA') return;
    try {
      const r = await reproduccionAPI.getAll({ idHembra: id });
      const partos = (r.data || []).filter((x) => x.fechaPartoReal).sort((x, y) => new Date(y.fechaPartoReal) - new Date(x.fechaPartoReal));
      const dias = partos.length ? Math.floor((Date.now() - new Date(partos[0].fechaPartoReal)) / 86400000) : null;
      setPartoInfo({ dias, partos: partos.length });
      if (partos.length) setCab((c) => ({ ...c, numLactancia: c.numLactancia || String(partos.length) }));
    } catch { /* orientación opcional */ }
  };

  const elegirCalif = (r, c) => {
    setValores((v) => ({ ...v, [r.idRasgo]: c }));
    setManuales((m) => ({ ...m, [r.idRasgo]: !(autoRasgos[r.codigo]?.calif === c) }));
  };
  const volverAMedida = (r) => setManuales((m) => ({ ...m, [r.idRasgo]: false }));

  const resultado = useMemo(() => calcular(catalogo, valores), [catalogo, valores]);
  const faltantes = catalogo.filter((r) => !valores[r.idRasgo]);
  const medidasMal = medidasCat.filter((m) => medidas[m.codigo] !== undefined && medidas[m.codigo] !== '' && !(aNumero(medidas[m.codigo]) > 0 && aNumero(medidas[m.codigo]) < 300));
  const numMedidas = medidasCat.filter((m) => aNumero(medidas[m.codigo]) > 0).length;
  const numAuto = catalogo.filter((r) => autoRasgos[r.codigo] && !manuales[r.idRasgo]).length;
  const nombreRaza = animalElegido?.nombreRaza || detalle?.nombreRaza || '';

  const guardar = async () => {
    if (!cab.idAnimal) { setError(`Primero elija ${conf.articulo} que va a evaluar.`); setPaso(0); return; }
    if (faltantes.length) { setError(`Faltan ${faltantes.length} rasgo(s) por calificar: ${faltantes.map((f) => f.nombre).join(', ')}.`); setPaso(2); return; }
    if (medidasMal.length) { setError(`Revise el valor de: ${medidasMal.map((m) => m.nombre).join(', ')}. Escriba solo el número (por ejemplo 72 o 72,5).`); setPaso(1); return; }
    setGuardando(true); setError('');
    try {
      const payload = {
        idAnimal: cab.idAnimal,
        fechaEvaluacion: cab.fechaEvaluacion,
        edadMeses: cab.edadMeses !== '' ? Number(cab.edadMeses) : null,
        numLactancia: cab.numLactancia !== '' ? Number(cab.numLactancia) : null,
        observaciones: cab.observaciones || null,
        detalle: catalogo.map((r) => ({
          idRasgo: r.idRasgo, calificacion: valores[r.idRasgo],
          origen: autoRasgos[r.codigo] && !manuales[r.idRasgo] ? 'MEDIDA' : 'VISUAL',
        })),
        medidas: medidasCat
          .filter((m) => aNumero(medidas[m.codigo]) > 0)
          .map((m) => ({ codigo: m.codigo, valor: aNumero(medidas[m.codigo]), metodo: metodos[m.codigo] || 'INSTRUMENTO' })),
      };
      const res = idEditando ? await clasificacionLinealAPI.update(idEditando, payload) : await clasificacionLinealAPI.create(payload);
      const id = idEditando || res.data.idEvaluacion;
      setIdEditando(id);
      await cargarLista();
      await verDetalle(id);
    } catch (e) { setError(e.message || 'Error al guardar'); }
    finally { setGuardando(false); }
  };

  const verDetalle = async (id) => {
    setCargando(true); setError('');
    try {
      const d = await clasificacionLinealAPI.getById(id);
      setDetalle(d);
      setVista('detalle');
    } catch (e) { setError(e.message || 'No se pudo abrir la evaluación'); } finally { setCargando(false); }
  };
  const recargarDetalle = async () => setDetalle(await clasificacionLinealAPI.getById(detalle.id));

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta clasificación lineal, sus medidas y sus fotos?')) return;
    try { await clasificacionLinealAPI.delete(id); await cargarLista(); }
    catch (e) { setError(e.message || 'No se pudo eliminar'); }
  };
  const subirFoto = async (tipoVista, file) => {
    if (!file || !detalle) return;
    setSubiendo(tipoVista); setError('');
    try { await clasificacionLinealAPI.subirFoto(detalle.id, file, tipoVista); await recargarDetalle(); }
    catch (e) { setError(e.message || 'Error al subir la foto'); }
    finally { setSubiendo(''); }
  };
  const borrarFoto = async (foto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try { await clasificacionLinealAPI.eliminarFoto(foto.idFoto); await recargarDetalle(); }
    catch (e) { setError(e.message || 'No se pudo eliminar la foto'); }
  };

  // ---------- Editor de referencias ----------
  const abrirReferencias = async (idRaza = refRaza, sexo = refSexo) => {
    setRefMensaje('');
    if (!medidasTodas.length) {
      try { setMedidasTodas(await clasificacionLinealAPI.getMedidas()); } catch { /* */ }
    }
    if (!idRaza) { setRefFilas({}); setRefOrigen({}); cargarMorfo(); return; }
    cargarMorfo(idRaza);
    try {
      const refs = (await clasificacionLinealAPI.getReferencias({ idRaza, sexo })).filter((r) => r.idRaza === Number(idRaza));
      setRefFilas(Object.fromEntries(refs.map((r) => [r.codigo, { media: String(r.media).replace('.', ','), de: String(r.de).replace('.', ','), fuente: r.fuente || '' }])));
      setRefOrigen(Object.fromEntries(refs.map((r) => [r.codigo, r.fuente || ''])));
    } catch (e) { setRefMensaje(e.message); }
  };

  // Copia un estudio publicado a la tabla de referencias (queda sin guardar hasta "Guardar referencias")
  const usarPerfil = (p) => {
    const base = textoFuentePerfil(p, morfo.fuentes);
    const nuevas = {};
    p.valores.forEach((v) => {
      const de = deDeValor(v, p.n);
      if (de == null || !(de > 0)) return;
      const como = v.tipoDispersion === 'DE' ? 'media ± DE' : `DE = EE × √n (${v.dispersion} × √${p.n})`;
      nuevas[v.codigo] = { media: String(Math.round(v.media * 100) / 100).replace('.', ','), de: String(de).replace('.', ','), fuente: `${base} · ${como}`.slice(0, 400) };
    });
    setRefFilas((x) => ({ ...x, ...nuevas }));
    setRefMensaje(`Se copiaron ${Object.keys(nuevas).length} medida(s) de ${p.fuente} (${p.edadPublicada}). Revise y pulse "Guardar referencias".`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => { if (seccion === 'referencias') abrirReferencias(); }, [seccion, refRaza, refSexo]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardarReferencias = async () => {
    setRefMensaje('');
    try {
      const lista = Object.entries(refFilas)
        .filter(([, f]) => aNumero(f.media) > 0 && aNumero(f.de) > 0)
        .map(([codigo, f]) => ({ idRaza: Number(refRaza), sexo: refSexo, codigo, media: aNumero(f.media), de: aNumero(f.de), fuente: f.fuente || null }));
      const r = await clasificacionLinealAPI.guardarReferencias(lista);
      setRefMensaje(r.message || 'Guardado');
      setRefOrigen(Object.fromEntries(lista.map((x) => [x.codigo, x.fuente || refOrigen[x.codigo] || ''])));
    } catch (e) { setRefMensaje(`Error: ${e.message}`); }
  };

  const AvisoError = () => error ? (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-base flex items-start gap-2"><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />{error}</div>
  ) : null;

  // =====================================================================
  // PORTADA: elegir Hembras / Machos / Referencias
  // =====================================================================
  if (vista === 'lista' && !seccion) {
    const cuenta = (s) => evaluaciones.filter((e) => (e.sexo || 'HEMBRA') === s).length;
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-lg p-6 sm:p-7 text-white mb-6 relative overflow-hidden">
          <Ruler className="absolute -right-6 -bottom-10 w-48 h-48 text-white/10" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Ruler className="w-7 h-7 text-white" /></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Clasificación Lineal</h1>
                <p className="text-rose-100 text-base">Medidas del animal comparadas con su raza y calificación de la forma del cuerpo</p>
              </div>
            </div>
            <ControlLetra claro />
          </div>
        </div>
        <AvisoError />
        <p className="text-lg text-gray-700 mb-4">¿A quién va a evaluar?</p>
        <div className="grid md:grid-cols-2 gap-5">
          {['HEMBRA', 'MACHO'].map((s) => {
            const c = SEXOS[s];
            return (
              <button key={s} type="button" onClick={() => irSeccion(s === 'MACHO' ? 'machos' : 'hembras')}
                className={`group text-left rounded-3xl p-7 border-2 transition hover:-translate-y-1 hover:shadow-xl ${s === 'MACHO' ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:border-indigo-400' : 'border-rose-200 bg-gradient-to-br from-rose-50 to-white hover:border-rose-400'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-5xl font-black ${s === 'MACHO' ? 'text-indigo-600' : 'text-rose-600'}`}>{s === 'MACHO' ? '♂' : '♀'}</span>
                  <span className="text-base text-gray-500">{cuenta(s)} evaluacion(es)</span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mt-3">{c.titulo}</p>
                <p className="text-base text-gray-600 mt-2 leading-relaxed">{c.descripcion}</p>
                <span className={`mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-base font-semibold ${s === 'MACHO' ? 'bg-indigo-600 group-hover:bg-indigo-700' : 'bg-rose-600 group-hover:bg-rose-700'}`}>
                  Entrar a {c.titulo.toLowerCase()} <ArrowRight className="w-5 h-5 transition group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => irSeccion('referencias')}
          className="mt-5 w-full text-left rounded-2xl p-5 border-2 border-gray-200 bg-white hover:border-gray-400 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-gray-700" /></div>
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-800">Medidas de referencia por raza</p>
            <p className="text-base text-gray-600">El promedio de cada medida para hembras y machos adultos de cada raza. Es la base con la que se comparan las mediciones.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </button>
      </div>
    );
  }

  // =====================================================================
  // EDITOR DE REFERENCIAS POR RAZA
  // =====================================================================
  if (vista === 'lista' && seccion === 'referencias') {
    const razaSel = razas.find((r) => String(r.id_raza ?? r.id) === String(refRaza));
    const meds = medidasTodas.filter((m) => m.grupo !== 'UBRE' && (m.sexo === 'AMBOS' || m.sexo === refSexo));
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <button onClick={() => irSeccion(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base"><ArrowLeft className="w-5 h-5" /> Volver</button>
          <ControlLetra />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="w-8 h-8 text-rose-600" /> Medidas de referencia por raza</h1>
        <p className="text-base text-gray-600 mt-2">Cada raza tiene medidas propias. Por ejemplo, una cabra Spanish adulta es más pequeña que una Saanen: si se mide una Spanish, se compara con el promedio de las Spanish, no con el de todas las cabras. Aquí el docente revisa y ajusta esos promedios.</p>
        <div className="mt-4 p-4 rounded-xl bg-sky-50 border border-sky-200 text-base text-sky-950 flex items-start gap-2">
          <Info className="w-5 h-5 mt-0.5 shrink-0" />
          <span>Cada valor dice de dónde viene: <OrigenRef fuente="S01 " /> sale de un estudio publicado (media ± desviación estándar), <OrigenRef fuente="" /> es un valor inicial que debe validar el docente y <OrigenRef fuente="docente" /> lo cambió el docente. Abajo están los estudios publicados de la raza: el botón <b>Usar como referencia</b> copia sus valores a la tabla.</span>
        </div>
        <div className={`${tarjeta} mt-4 grid sm:grid-cols-2 gap-4`}>
          <label className="text-base font-semibold text-gray-700">Raza
            <select className={`${inp} mt-1`} value={refRaza} onChange={(e) => setRefRaza(e.target.value)}>
              <option value="">Elija una raza…</option>
              {razas.map((r) => <option key={r.id_raza ?? r.id} value={r.id_raza ?? r.id}>{r.nombre_raza ?? r.nombre}</option>)}
            </select>
          </label>
          <div>
            <p className="text-base font-semibold text-gray-700">Sexo</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {['HEMBRA', 'MACHO'].map((s) => (
                <button key={s} type="button" onClick={() => setRefSexo(s)}
                  className={`py-3 rounded-xl border-2 text-base font-semibold ${refSexo === s ? (s === 'MACHO' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'border-gray-200 text-gray-700'}`}>
                  {s === 'MACHO' ? '♂ Machos' : '♀ Hembras'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {refRaza && (
          <div className={`${tarjeta} mt-4`}>
            <p className="text-lg font-bold text-gray-800 mb-3">{razaSel?.nombre_raza ?? razaSel?.nombre} · {refSexo === 'MACHO' ? 'machos' : 'hembras'} adultos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead><tr className="text-left text-gray-600 border-b-2"><th className="py-2 pr-2">Medida y origen</th><th className="pr-2">Promedio</th><th className="pr-2">Desviación</th><th>Bajo · Medio · Alto</th></tr></thead>
                <tbody>
                  {meds.map((m) => {
                    const f = refFilas[m.codigo] || { media: '', de: '', fuente: '' };
                    const me = aNumero(f.media); const de = aNumero(f.de);
                    // Si el docente escribe un número a mano, la fuente pasa a ser "ajustada por el docente"
                    const set = (k, v) => setRefFilas((x) => ({ ...x, [m.codigo]: { ...f, [k]: v.replace(/[^0-9.,]/g, ''), fuente: 'Ajustado por el docente' } }));
                    const fuenteVista = f.fuente || refOrigen[m.codigo] || '';
                    const sinCambios = fuenteVista === (refOrigen[m.codigo] || '');
                    return (
                      <tr key={m.codigo} className="border-b border-gray-100 align-top">
                        <td className="py-2 pr-2 font-medium text-gray-800">
                          {m.nombre} <span className="text-gray-400 text-sm">({m.unidad})</span>
                          {(me || de) ? <span className="block mt-1"><OrigenRef fuente={fuenteVista} />{!sinCambios && <span className="ml-1 text-xs text-gray-500">sin guardar</span>}</span> : null}
                          {origenReferencia(fuenteVista).tipo === 'PUBLICADA' && <span className="block text-xs font-normal text-gray-500 mt-0.5 max-w-xs">{fuenteVista}</span>}
                        </td>
                        <td className="pr-2"><input className="w-24 border-2 border-gray-200 rounded-lg px-2 py-2 text-base text-right" inputMode="decimal" value={f.media} onChange={(e) => set('media', e.target.value)} /></td>
                        <td className="pr-2"><input className="w-20 border-2 border-gray-200 rounded-lg px-2 py-2 text-base text-right" inputMode="decimal" value={f.de} onChange={(e) => set('de', e.target.value)} /></td>
                        <td className="text-sm text-gray-700">{me && de ? <>menos de <b>{fmt(me - de)}</b> · <b>{fmt(me - de)}–{fmt(me + de)}</b> · más de <b>{fmt(me + de)}</b></> : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button type="button" onClick={guardarReferencias} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-base font-semibold"><Save className="w-5 h-5" /> Guardar referencias</button>
              {refMensaje && <span className={`text-base ${refMensaje.startsWith('Error') ? 'text-red-700' : 'text-emerald-700'}`}>{refMensaje}</span>}
            </div>
          </div>
        )}
        {refRaza && (
          <>
            <EstandaresRaza estandares={morfo.estandares} sexo={refSexo} medidas={medidasTodas} fuentes={morfo.fuentes} />
            <DatosPublicados perfiles={morfo.perfiles} sexo={refSexo} medidas={medidasTodas} fuentes={morfo.fuentes} onUsar={usarPerfil} puedeEditar />
          </>
        )}
        <CriteriosUso />
        <FichaTecnica medidas={medidasTodas} fuentes={morfo.fuentes} />
        <Bibliografia fuentes={morfo.fuentes} />
      </div>
    );
  }

  // =====================================================================
  // LISTA DE UNA SECCIÓN (hembras o machos)
  // =====================================================================
  if (vista === 'lista') {
    const c = SEXOS[sexoSeccion];
    const lista = evaluaciones.filter((e) => (e.sexo || 'HEMBRA') === sexoSeccion);
    const macho = sexoSeccion === 'MACHO';
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <button onClick={() => irSeccion(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base mb-3"><ArrowLeft className="w-5 h-5" /> Hembras / Machos</button>
        <div className={`rounded-2xl shadow-lg p-6 sm:p-7 text-white mb-5 relative overflow-hidden bg-gradient-to-br ${macho ? 'from-indigo-500 to-indigo-800' : 'from-rose-500 to-rose-700'}`}>
          <span className="absolute right-4 -bottom-8 text-[10rem] leading-none font-black text-white/10" aria-hidden="true">{macho ? '♂' : '♀'}</span>
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Clasificación lineal · {c.titulo}</h1>
              <p className="text-white/85 text-base mt-1 max-w-2xl">{c.descripcion}</p>
            </div>
            <div className="flex items-center gap-2">
              <ControlLetra claro />
              <button onClick={() => iniciarNueva(sexoSeccion)} className={`flex items-center gap-2 px-5 py-3 bg-white rounded-xl text-base font-semibold shadow-sm ${macho ? 'text-indigo-700 hover:bg-indigo-50' : 'text-rose-700 hover:bg-rose-50'}`}>
                <Plus className="w-5 h-5" /> Evaluar {c.singular}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {['hembras', 'machos'].map((s) => (
            <button key={s} type="button" onClick={() => irSeccion(s)}
              className={`px-5 py-2.5 rounded-xl text-base font-semibold border-2 ${seccion === s ? (s === 'machos' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-rose-600 text-white border-rose-600') : 'bg-white text-gray-700 border-gray-200'}`}>
              {s === 'machos' ? '♂ Machos' : '♀ Hembras'}
            </button>
          ))}
        </div>
        <AvisoError />
        {cargando ? (
          <div className="text-center py-12 text-gray-400"><RefreshCw className="w-7 h-7 animate-spin mx-auto" /></div>
        ) : lista.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Ruler className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">Aún no hay {c.titulo.toLowerCase()} evaluad{macho ? 'o' : 'a'}s.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {lista.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg"><span className="font-mono font-bold text-gray-800">{e.codigoAnimal}</span>{e.nombreAnimal && <span className="text-gray-600"> — {e.nombreAnimal}</span>}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${COLOR_CAT[e.categoria] || ''}`}>{e.categoria?.replace('_', ' ')}</span>
                    <span className="text-2xl font-bold text-gray-800">{e.puntFinal} pts</span>
                    <span className="text-base text-gray-500">{e.fechaEvaluacion?.slice(0, 10)}</span>
                    {e.numMedidas > 0 && <span className="text-sm text-gray-500 flex items-center gap-1"><Ruler className="w-4 h-4" />{e.numMedidas}</span>}
                    {e.numFotos > 0 && <span className="text-sm text-gray-500 flex items-center gap-1"><Camera className="w-4 h-4" />{e.numFotos}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => verDetalle(e.id)} title="Ver" aria-label="Ver" className="p-3 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"><Eye className="w-5 h-5" /></button>
                  <button onClick={() => editar(e.id)} title="Editar" aria-label="Editar" className="p-3 text-gray-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => eliminar(e.id)} title="Eliminar" aria-label="Eliminar" className="p-3 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // DETALLE
  // =====================================================================
  if (vista === 'detalle' && detalle) {
    const sexoD = detalle.sexo === 'MACHO' ? 'MACHO' : 'HEMBRA';
    const cD = SEXOS[sexoD];
    const vistas = VISTAS.filter((v) => !v.sexo || v.sexo === sexoD);
    const etiqueta = (k) => VISTAS.find((v) => v.key === k)?.label || k;
    const items = (detalle.fotos || []).map((f) => ({
      key: f.idFoto, url: clasificacionLinealAPI.urlFoto(f.idFoto), protegida: true, etiqueta: etiqueta(f.tipoVista),
      extra: (
        <button type="button" onClick={() => borrarFoto(f)} aria-label="Eliminar foto" title="Eliminar foto"
          className="w-10 h-10 rounded-full bg-black/55 hover:bg-red-600 text-white flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>
      ),
    }));
    const medGrupo = (g) => (detalle.medidas || []).filter((m) => m.grupo === g);
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Visor src={visor} onCerrar={() => setVisor(null)} />
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <button onClick={() => { setVista('lista'); setParams({ seccion: sexoD === 'MACHO' ? 'machos' : 'hembras' }); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base"><ArrowLeft className="w-5 h-5" /> Volver a {cD.titulo.toLowerCase()}</button>
          <div className="flex items-center gap-2">
            <ControlLetra />
            <button onClick={() => editar(detalle.id)} className="flex items-center gap-2 text-base px-4 py-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-50"><Edit2 className="w-5 h-5" /> Editar</button>
          </div>
        </div>
        <AvisoError />

        <div className={`${tarjeta} mb-4 flex items-center justify-between flex-wrap gap-4`}>
          <div>
            <p className="text-lg"><span className="mr-2 text-2xl">{sexoD === 'MACHO' ? '♂' : '♀'}</span><b className="font-mono">{nombreCabra(detalle.codigoAnimal, detalle.nombreAnimal)}</b> {detalle.nombreRaza && <span className="text-gray-500">· {detalle.nombreRaza}</span>}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-4 py-1.5 rounded-full text-base font-bold border ${COLOR_CAT[detalle.categoria] || ''}`}>{detalle.categoria?.replace('_', ' ')}</span>
              <span className="text-4xl font-bold text-gray-800">{detalle.puntFinal} <span className="text-lg font-normal text-gray-400">/ 100</span></span>
            </div>
            <p className="text-base text-gray-500 mt-1">
              {detalle.fechaEvaluacion?.slice(0, 10)}{detalle.edadMeses != null && ` · ${detalle.edadMeses} meses`}{detalle.numLactancia != null && sexoD === 'HEMBRA' && ` · ${detalle.numLactancia} parto(s)`}
            </p>
          </div>
          <div className="text-right text-base text-gray-700 space-y-1">
            {cD.regiones.map((g) => {
              const v = { APARIENCIA: detalle.puntApariencia, ESTRUCTURA: detalle.puntEstructura, MAMARIO: detalle.puntMamario, PATAS: detalle.puntPatas,
                CAPACIDAD: (detalle.detalle || []).filter((d) => d.region === 'CAPACIDAD').reduce((a, d) => a + (d.puntaje || 0), 0) }[g.key];
              return <p key={g.key}>{g.titulo.split(' ')[0]}: <b>{Math.round((v ?? 0) * 100) / 100}</b> / {g.pts}</p>;
            })}
          </div>
        </div>
        {detalle.observaciones && <p className="mb-4 text-base text-gray-700 bg-white border border-gray-200 rounded-2xl p-4 whitespace-pre-line">{detalle.observaciones}</p>}

        {/* Fotos en carrusel */}
        <div className={`${tarjeta} mb-4`}>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-3"><Camera className="w-6 h-6" /> Fotos de la evaluación</h3>
          <CarruselFotos items={items} vacio="Todavía no hay fotos. Agréguelas abajo, una por cada vista." />
          <p className="text-base font-semibold text-gray-700 mt-5 mb-2">Agregar fotos por vista</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {vistas.map((v) => {
              const n = (detalle.fotos || []).filter((f) => f.tipoVista === v.key).length;
              const puede = v.varias || n === 0;
              return (
                <div key={v.key} className={`rounded-xl border-2 p-3 ${n ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200'}`}>
                  <p className="text-base font-bold text-gray-800 flex items-center gap-1.5">{n > 0 && <CheckCircle className="w-5 h-5 text-emerald-600" />}{v.label}</p>
                  <p className="text-sm text-gray-500 mb-2 leading-snug">{v.ayuda}</p>
                  {subiendo === v.key ? <div className="h-16 flex items-center justify-center text-base text-gray-600 gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Subiendo…</div>
                    : puede ? <BotonesFoto compacto onArchivo={(f) => subirFoto(v.key, f)} />
                    : <p className="text-sm text-gray-500">Ya tiene foto. Para cambiarla, elimínela en el carrusel.</p>}
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => toggle('_protocolo')} className="mt-4 text-base font-medium text-rose-700 flex items-center gap-1">
            <ChevronDown className={`w-5 h-5 transition-transform ${abiertos._protocolo ? 'rotate-180' : ''}`} /> Cómo tomar las fotos para que sirvan
          </button>
          {abiertos._protocolo && (
            <dl className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-base text-gray-700">
              {PROTOCOLO.map(([t, d]) => <div key={t}><dt className="inline font-semibold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
            </dl>
          )}
        </div>

        {/* Medidas */}
        <div className={`${tarjeta} mb-4`}>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Ruler className="w-6 h-6" /> Medidas</h3>
          {(detalle.medidas || []).length === 0 ? <p className="text-base text-gray-500 mt-2">No se registraron medidas.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-3">
              {GRUPOS_MEDIDA.map((g) => medGrupo(g.key).length > 0 && (
                <div key={g.key}>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{g.titulo}</p>
                  <dl className="text-base divide-y divide-gray-100">
                    {medGrupo(g.key).map((m) => (
                      <div key={m.codigo} className="flex justify-between gap-2 py-1.5">
                        <dt className="text-gray-700">{m.nombre}</dt>
                        <dd className="font-bold tabular-nums text-gray-900">{fmt(m.valor)} {m.unidad}{m.metodo === 'FOTO' && <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">foto</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
          {(detalle.indices || []).length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {detalle.indices.map((i) => (
                <div key={i.codigo} className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-500">{i.nombre}</p>
                  <p className="text-xl font-bold text-gray-800 tabular-nums">{fmt(i.valor)}</p>
                  <p className="text-base text-gray-700">{i.lectura}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {cD.regiones.map((g) => {
          const its = (detalle.detalle || []).filter((d) => d.region === g.key);
          if (!its.length) return null;
          return (
            <div key={g.key} className={`${tarjeta} mb-3`}>
              <h3 className="text-lg font-bold text-gray-800">{g.titulo}</h3>
              <div className="divide-y divide-gray-100 mt-1">
                {its.map((d) => (
                  <div key={d.idDetalle} className="py-2.5 text-base">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-gray-800">{d.nombre}</span>
                      <span className="flex items-center gap-2">
                        {d.origen === 'MEDIDA' && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold flex items-center gap-1"><Wand2 className="w-3.5 h-3.5" />por medida</span>}
                        <span className={`px-2.5 py-0.5 rounded-full border text-sm font-bold ${NIVELES[d.calificacion]?.color}`}>{d.calificacion} · {NIVELES[d.calificacion]?.texto}</span>
                        <b className="text-gray-900">{d.puntaje} pts</b>
                      </span>
                    </div>
                    {d.nivelTexto && <p className="text-sm text-gray-500 mt-0.5">{d.nivelTexto}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // =====================================================================
  // FORMULARIO POR PASOS
  // =====================================================================
  const pasoKey = PASOS[paso].key;
  const macho = sexoForm === 'MACHO';
  const acento = macho ? 'indigo' : 'rose';
  const btnAcento = macho ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600' : 'bg-rose-600 hover:bg-rose-700 border-rose-600';
  const listaSel = animalElegido && !delSexo.some((h) => h.id === animalElegido.id) ? [animalElegido, ...delSexo] : delSexo;
  const sinRefRaza = cab.idAnimal && !referencias.some((r) => r.idRaza != null);
  const joven = cab.edadMeses !== '' && Number(cab.edadMeses) < 24;
  const etapa = etapaPorEdad(cab.edadMeses);
  const perfilEdad = joven ? perfilParaEdad(morfo.perfiles, sexoForm, cab.edadMeses) : null;
  const estandarDe = (codigo) => morfo.estandares.filter((e) => e.codigo === codigo && (e.sexo === sexoForm || e.sexo === 'AMBOS'));
  const angulo = anguloGrupa(medidas);
  const hechoPaso = (k) => ({
    ANIMAL: !!cab.idAnimal, MEDIDAS: numMedidas > 0, RASGOS: catalogo.length > 0 && faltantes.length === 0, RESUMEN: false,
  }[k]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-44">
      <Visor src={visor} onCerrar={() => setVisor(null)} />
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <button onClick={() => (idEditando ? verDetalle(idEditando) : setVista('lista'))} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-base"><ArrowLeft className="w-5 h-5" /> Salir sin guardar</button>
        <ControlLetra />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4"><span className={`mr-2 ${macho ? 'text-indigo-600' : 'text-rose-600'}`}>{macho ? '♂' : '♀'}</span>{idEditando ? 'Editar' : 'Nueva'} clasificación lineal · {conf.titulo}</h1>

      <nav aria-label="Pasos" className="mb-5">
        <ol className="grid grid-cols-4 gap-2">
          {PASOS.map((p, k) => {
            const Icono = p.icono;
            const actual = k === paso;
            const hecho = hechoPaso(p.key);
            return (
              <li key={p.key}>
                <button type="button" onClick={() => setPaso(k)} aria-current={actual ? 'step' : undefined}
                  className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 rounded-2xl border-2 text-base font-semibold transition ${actual ? `${btnAcento} text-white shadow` : hecho ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {hecho && !actual ? <CheckCircle className="w-5 h-5" /> : <Icono className="w-5 h-5" />}
                  <span><span className="opacity-70">{k + 1}.</span> {p.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <AvisoError />

      <div key={pasoKey} className="animate-aparecer space-y-4">
        {pasoKey === 'ANIMAL' && (
          <>
            <div className={`${tarjeta} grid grid-cols-1 md:grid-cols-2 gap-5`}>
              <div className="md:col-span-2">
                <label className={lbl}>{macho ? 'Macho' : 'Cabra'} a evaluar <span className="text-red-500">*</span></label>
                <SelectAnimal animales={listaSel} value={cab.idAnimal} onChange={elegirAnimal} busqueda={busqueda} onBusqueda={setBusqueda} colorFocus={`focus:ring-${acento}-500`} />
                <p className="text-base text-gray-500 mt-1">Solo aparecen {conf.titulo.toLowerCase()} activ{macho ? 'o' : 'a'}s. Busque por chapeta o nombre.</p>
                {animalElegido && (
                  <p className="mt-2 text-base text-gray-800">Raza: <b>{animalElegido.nombreRaza || 'sin raza'}</b>
                    {sinRefRaza && <span className="block text-amber-800 mt-1">Esta raza no tiene medidas de referencia: los rasgos no se podrán llenar solos con las medidas (solo los de ubre). Pida al docente cargarlas en "Medidas de referencia por raza".</span>}
                  </p>
                )}
                {partoInfo && (partoInfo.dias === null
                  ? <p className="text-base text-amber-700 mt-1">No tiene partos registrados. El método está pensado para cabras que ya han parido.</p>
                  : <p className={`text-base mt-1 ${partoInfo.dias < 30 || partoInfo.dias > 90 ? 'text-amber-700' : 'text-emerald-700'}`}>Último parto hace {partoInfo.dias} días.{partoInfo.dias < 30 ? ' Es pronto: lo ideal es cerca de 45 días.' : partoInfo.dias > 90 ? ' Lo ideal es cerca de 45 días después del parto.' : ' Buen momento para evaluarla.'}</p>)}
              </div>
              <div>
                <label className={lbl} htmlFor="lin-fecha">Fecha</label>
                <input id="lin-fecha" type="date" max={hoy()} className={inp} value={cab.fechaEvaluacion} onChange={(e) => setCab({ ...cab, fechaEvaluacion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl} htmlFor="lin-edad">Edad (meses)</label>
                  <input id="lin-edad" type="number" min="0" inputMode="numeric" className={inp} value={cab.edadMeses} onChange={(e) => setCab({ ...cab, edadMeses: e.target.value })} />
                </div>
                {!macho && (
                  <div>
                    <label className={lbl} htmlFor="lin-partos">N.º de partos</label>
                    <input id="lin-partos" type="number" min="0" inputMode="numeric" className={inp} value={cab.numLactancia} onChange={(e) => setCab({ ...cab, numLactancia: e.target.value })} />
                  </div>
                )}
              </div>
              {etapa && <p className="md:col-span-2 text-base text-gray-800 bg-gray-50 rounded-xl px-4 py-3">Etapa: <b>{etapa.texto}</b> ({etapa.rango}).</p>}
              {joven && <p className="md:col-span-2 text-base text-amber-800 bg-amber-50 rounded-xl px-4 py-3">Tiene menos de 2 años. Las medidas de referencia son de adultos, así que es normal que salga "Bajo" por la edad.{perfilEdad && <> En Medidas verá también lo publicado para {macho ? 'machos' : 'hembras'} de su raza a los <b>{fmt(perfilEdad.edadMeses)} meses</b> ({perfilEdad.fuente}), solo como guía.</>}</p>}
            </div>
            <div className={`rounded-2xl p-5 text-base border ${macho ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
              <p className="text-lg font-bold flex items-center gap-2"><Info className="w-5 h-5" /> Cómo se hace</p>
              <ol className="list-decimal ml-6 mt-1 space-y-1">
                <li>Ponga {conf.articulo} <b>parad{macho ? 'o' : 'a'} en piso plano</b>, tranquil{macho ? 'o' : 'a'}.</li>
                <li>En <b>Medidas</b> mida con bastón, cinta y compás. El sistema compara cada medida con el promedio de su raza y dice si es <b>Bajo, Medio o Alto</b>.</li>
                <li>Con esas medidas, los rasgos medibles <b>se califican solos</b>. Los que no se miden (ubre, aplomos, angulosidad) se eligen a la vista con el dibujo.</li>
                <li>Al guardar se abre la evaluación para tomar las <b>fotos</b>.</li>
              </ol>
              <button type="button" onClick={() => toggle('_glosario')} className="mt-2 font-medium flex items-center gap-1">
                <ChevronDown className={`w-5 h-5 transition-transform ${abiertos._glosario ? 'rotate-180' : ''}`} /> Palabras que quizá no conozca
              </button>
              {abiertos._glosario && (
                <dl className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                  {GLOSARIO.map(([t, d]) => <div key={t}><dt className="inline font-bold">{t}:</dt> <dd className="inline">{d}</dd></div>)}
                </dl>
              )}
            </div>
          </>
        )}

        {pasoKey === 'MEDIDAS' && (
          <>
            <QueSignifica raza={nombreRaza} sexo={sexoForm} />
            {GRUPOS_MEDIDA.map((g) => {
              const its = medidasCat.filter((m) => m.grupo === g.key);
              if (!its.length) return null;
              return (
                <div key={g.key} className={tarjeta}>
                  <h3 className="text-xl font-bold text-gray-800">{g.titulo}</h3>
                  <p className="text-base text-gray-500 mb-3">{g.ayuda}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {its.map((m) => {
                      const val = medidas[m.codigo] ?? '';
                      const n = aNumero(val);
                      const invalido = val !== '' && !(n > 0 && n < 300);
                      const ref = refsIdx[m.codigo];
                      const comp = !invalido ? compararMedida(n, ref) : null;
                      const ayuda = abiertos[`m_${m.codigo}`];
                      return (
                        <div key={m.codigo} className={`rounded-2xl border-2 p-4 ${invalido ? 'border-red-300' : comp ? 'border-gray-200' : 'border-gray-100'}`}>
                          <div className="flex items-start gap-3">
                            <label htmlFor={`med-${m.codigo}`} className="flex-1 text-base font-semibold text-gray-800 leading-tight">
                              {m.nombre}
                              <span className="block text-sm font-normal text-gray-500 mt-0.5">{m.instrumento}</span>
                            </label>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input id={`med-${m.codigo}`} type="text" inputMode="decimal" placeholder="—"
                                className={`w-24 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xl font-bold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-${acento}-500`}
                                value={val} onChange={(e) => { setMedidas((x) => ({ ...x, [m.codigo]: e.target.value.replace(/[^0-9.,]/g, '') })); setMetodos((x) => ({ ...x, [m.codigo]: 'INSTRUMENTO' })); }} />
                              <span className="text-base text-gray-500 w-6">{m.unidad}</span>
                            </div>
                          </div>
                          {ref && (
                            <div className="mt-3 grid grid-cols-3 text-center text-sm rounded-xl overflow-hidden border border-gray-200">
                              {[1, 2, 3].map((k) => (
                                <div key={k} className={`py-1.5 ${comp?.nivel === k ? `${NIVELES[k].color} font-bold` : 'bg-gray-50 text-gray-500'}`}>
                                  <span className="block">{NIVELES[k].texto}</span>
                                  <span className="block tabular-nums">{k === 1 ? `< ${fmt(ref.media - ref.de)}` : k === 2 ? `${fmt(ref.media - ref.de)}–${fmt(ref.media + ref.de)}` : `> ${fmt(ref.media + ref.de)}`}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {ref && <p className="text-sm text-gray-500 mt-1.5">Promedio {ref.idRaza == null ? 'general' : `de la raza ${ref.raza}`}: <b>{fmt(ref.media)} {m.unidad}</b> <OrigenRef fuente={ref.fuente} />{comp && <> · esta medida está {comp.dif === 0 ? 'en el promedio' : <b>{comp.dif > 0 ? '+' : ''}{fmt(comp.dif)} {m.unidad} ({comp.pct > 0 ? '+' : ''}{comp.pct} %)</b>}</>}</p>}
                          {!joven && estandarDe(m.codigo).map((e, i) => {
                            const bajoMin = n != null && !invalido && e.minimo != null && e.maximo == null && n < e.minimo;
                            return (
                              <p key={i} className={`text-sm mt-1 ${bajoMin ? 'text-amber-800 font-semibold' : 'text-gray-500'}`}>
                                {e.tipo}{e.grupo && !/no informada/.test(e.grupo) ? ` (${e.grupo.toLowerCase()})` : ''}: {e.maximo == null ? `mínimo ${fmt(e.minimo)}` : `${fmt(e.minimo)}–${fmt(e.maximo)}`} {m.unidad}{e.optimo != null && `, óptimo ${fmt(e.optimo)}`}
                                {bajoMin && ' · está por debajo del mínimo de la raza'}
                              </p>
                            );
                          })}
                          {perfilEdad && (() => {
                            const v = perfilEdad.valores.find((x) => x.codigo === m.codigo);
                            return v ? <p className="text-sm mt-1 text-teal-700">Publicado a los {fmt(perfilEdad.edadMeses)} meses: <b>{fmt(v.media)} {m.unidad}</b> (n={perfilEdad.n}, {perfilEdad.pais}, {perfilEdad.fuente}{perfilEdad.preliminar ? ', preliminar' : ''})</p> : null;
                          })()}
                          {metodos[m.codigo] === 'FOTO' && val !== '' && <p className="text-sm mt-1 text-sky-700">Estimada en la app sobre una foto. Si la mide con el instrumento, escriba el valor.</p>}
                          {invalido && <p className="text-sm mt-1 text-red-700">Escriba solo el número.</p>}
                          {m.rasgoRel && <p className="text-sm mt-1 text-violet-700 flex items-center gap-1"><Wand2 className="w-4 h-4" /> Califica el rasgo «{catalogo.find((r) => r.codigo === m.rasgoRel)?.nombre || m.rasgoRel}»</p>}
                          <button type="button" onClick={() => toggle(`m_${m.codigo}`)} className={`mt-1 text-sm font-medium text-${acento}-700 flex items-center gap-1`}>
                            <ChevronDown className={`w-4 h-4 transition-transform ${ayuda ? 'rotate-180' : ''}`} /> Cómo medir
                          </button>
                          {ayuda && <p className="text-base text-gray-700 mt-1 leading-snug">{m.comoMedir}</p>}
                          {ayuda && m.definicion && <p className="text-sm text-gray-500 mt-1">Definición técnica: {m.definicion}{m.advertencia && <span className="block text-amber-800">{m.advertencia}</span>}</p>}
                        </div>
                      );
                    })}
                  </div>
                  {g.key === 'CUERPO' && angulo != null && (
                    <p className="mt-3 text-base text-gray-800 bg-gray-50 rounded-xl px-4 py-3">Inclinación de la grupa calculada: <b>{fmt(angulo)}°</b> (con alzada a la grupa, altura a la nalga y largo de la grupa).</p>
                  )}
                </div>
              );
            })}
            {numAuto > 0 && (
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-base text-violet-900 flex items-center justify-between gap-3 flex-wrap">
                <span className="flex items-center gap-2"><Wand2 className="w-5 h-5" /> Con estas medidas ya quedaron calificados <b>{numAuto}</b> rasgo(s).</span>
                <button type="button" onClick={() => setPaso(2)} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold">Ver los rasgos</button>
              </div>
            )}
          </>
        )}

        {pasoKey === 'RASGOS' && (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-violet-50 border border-violet-200 p-4"><p className="text-3xl font-bold text-violet-800">{numAuto}</p><p className="text-base text-violet-900">calificados con las medidas</p></div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4"><p className="text-3xl font-bold text-gray-800">{catalogo.length - faltantes.length - numAuto}</p><p className="text-base text-gray-700">calificados a la vista</p></div>
              <div className={`rounded-2xl border p-4 ${faltantes.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}><p className="text-3xl font-bold text-gray-800">{faltantes.length}</p><p className="text-base text-gray-700">por calificar</p></div>
            </div>
            {conf.regiones.map((g) => {
              const its = catalogo.filter((c) => c.region === g.key);
              const hechos = its.filter((r) => valores[r.idRasgo]).length;
              return (
                <div key={g.key} className={tarjeta}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{g.titulo} <span className="text-base font-normal text-gray-500">({g.pts} pts)</span></h3>
                      <p className="text-base text-gray-600">{g.ayuda}</p>
                    </div>
                    <span className="text-base text-gray-500 shrink-0 text-right">{hechos}/{its.length}<br />subtotal <b>{resultado.subtotales[g.key] ?? 0}</b></span>
                  </div>
                  <div className="space-y-4">
                    {its.map((r) => {
                      const sel = valores[r.idRasgo];
                      const auto = autoRasgos[r.codigo];
                      const regla = reglaPorRasgo[r.codigo];
                      const lim = regla ? limitesRegla(regla, refsIdx) : null;
                      const rangos = regla && lim ? explicarRangos(regla, lim, medidasCat.find((m) => m.codigo === regla.calculo)?.unidad || 'cm') : null;
                      const porMedida = auto && !manuales[r.idRasgo];
                      const dib = dibujoDe(r.codigo);
                      return (
                        <div key={r.idRasgo} className={`rounded-2xl border-2 p-4 ${!sel ? 'border-amber-300' : porMedida ? 'border-violet-300 bg-violet-50/30' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-lg font-bold text-gray-800">{r.nombre}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {r.vista && <span className={`text-sm px-2 py-0.5 rounded-md bg-${acento}-50 text-${acento}-700`}>Mírel{macho ? 'o' : 'a'}: {r.vista}</span>}
                                {regla ? <span className="text-sm px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />Se puede medir</span>
                                  : <span className="text-sm px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Se califica a la vista</span>}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">hasta {Math.round(r.ptsRasgo * 100) / 100} pts</span>
                          </div>
                          {r.queMirar && <p className="text-base text-gray-700 mt-2">{r.queMirar}</p>}
                          {auto && (
                            <div className={`mt-2 rounded-xl px-4 py-2.5 text-base flex items-start justify-between gap-2 flex-wrap ${porMedida ? 'bg-violet-100 text-violet-950' : 'bg-gray-100 text-gray-700'}`}>
                              <span className="flex items-start gap-2"><Wand2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>Medida: <b>{fmt(auto.valor)}{regla.calculo === 'ANGULO_GRUPA' ? '°' : ` ${medidasCat.find((m) => m.codigo === regla.calculo)?.unidad || 'cm'}`}</b> → <b>{NIVELES[auto.calif].texto}</b> ({auto.calif}).
                                  {porMedida ? ' Calificado automáticamente.' : ' Usted eligió otro valor a mano.'}</span>
                              </span>
                              {!porMedida && <button type="button" onClick={() => volverAMedida(r)} className="text-sm font-semibold underline">Usar la medida</button>}
                            </div>
                          )}
                          {regla && !auto && <p className="mt-2 text-base text-gray-500">{lim ? 'Escriba la medida en el paso 2 y este rasgo se califica solo.' : 'Falta la referencia de la raza para calcularlo; califíquelo a la vista.'}</p>}
                          {dib && (
                            <img src={`/img/lineal/${dib}.jpg`} alt={`Referencia ${r.nombre}`} onClick={() => setVisor(`/img/lineal/${dib}.jpg`)}
                              className="mt-3 w-full max-w-md rounded-xl border border-gray-200 cursor-zoom-in" />
                          )}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[1, 2, 3].map((c) => (
                              <button key={c} type="button" onClick={() => elegirCalif(r, c)}
                                className={`text-left rounded-xl border-2 px-4 py-3 transition ${sel === c ? `${NIVELES[c].color} border-current ring-2 ring-offset-1 ring-current` : 'border-gray-200 hover:border-gray-400 bg-white'}`}>
                                <span className="text-lg font-bold flex items-center gap-1.5">{c} · {NIVELES[c].texto}{sel === c && (porMedida ? <Wand2 className="w-4 h-4" /> : <Hand className="w-4 h-4" />)}</span>
                                {rangos?.[c] && <span className="block text-sm font-semibold mt-0.5">{rangos[c]}</span>}
                                {r.niveles?.[c] && <span className="block text-sm text-gray-700 leading-snug mt-0.5">{r.niveles[c]}</span>}
                              </button>
                            ))}
                          </div>
                          {regla?.explicacion && <p className="mt-2 text-sm text-gray-500">{regla.explicacion}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {pasoKey === 'RESUMEN' && (
          <div className={tarjeta}>
            <h2 className="text-2xl font-bold text-gray-800">Resumen</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-6 items-start">
              <div>
                <p className="text-6xl font-extrabold text-gray-800">{resultado.puntFinal}<span className="text-2xl text-gray-400"> / 100</span></p>
                <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-lg font-bold border ${COLOR_CAT[resultado.categoria]}`}>{resultado.categoria.replace('_', ' ')}</span>
                <div className="mt-4 space-y-2 text-base">
                  {conf.regiones.map((g) => (
                    <div key={g.key}>
                      <div className="flex justify-between"><span>{g.titulo}</span><b>{resultado.subtotales[g.key] ?? 0} / {g.pts}</b></div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full transition-all duration-700 ${macho ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${((resultado.subtotales[g.key] ?? 0) / g.pts) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
                {faltantes.length > 0 && <p className="mt-3 text-base text-amber-800 flex items-center gap-1"><AlertTriangle className="w-5 h-5" /> Faltan {faltantes.length} rasgo(s).</p>}
              </div>
              <table className="w-full text-base rounded-xl overflow-hidden border-2 border-gray-200">
                <thead className="bg-gray-800 text-white"><tr><th className="text-left px-4 py-2.5">Categoría</th><th className="text-left px-4 py-2.5">Puntos</th></tr></thead>
                <tbody>
                  {CATEGORIAS.map(([c, r]) => (
                    <tr key={c} className={c === resultado.categoria ? 'bg-emerald-50 font-bold' : ''}>
                      <td className="px-4 py-2"><span className={`px-2.5 py-0.5 rounded-full border text-sm ${COLOR_CAT[c]}`}>{c.replace('_', ' ')}</span></td><td className="px-4 py-2">{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className={`${lbl} mt-6`} htmlFor="lin-obs">Observaciones</label>
            <textarea id="lin-obs" className={inp} rows={3} placeholder="Algo que llame la atención: cojera, ubre desigual, una lesión…" value={cab.observaciones} onChange={(e) => setCab({ ...cab, observaciones: e.target.value })} />
          </div>
        )}
      </div>

      <div className="vidrio-claro fixed bottom-0 left-0 right-0 border-t border-gray-200 p-3 sm:p-4 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPaso((p) => Math.max(0, p - 1))} disabled={paso === 0}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30">
              <ArrowLeft className="w-5 h-5" /> Anterior
            </button>
            {paso < PASOS.length - 1 && (
              <button type="button" onClick={() => setPaso((p) => p + 1)} className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-base font-semibold">
                Siguiente: {PASOS[paso + 1].titulo} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-800">{resultado.puntFinal}<span className="text-base text-gray-400"> /100</span></span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${COLOR_CAT[resultado.categoria]}`}>{resultado.categoria.replace('_', ' ')}</span>
            {faltantes.length > 0 && <span className="text-base text-amber-700 hidden md:inline">faltan {faltantes.length}</span>}
          </div>
          <button onClick={guardar} disabled={guardando} className={`${btnAcento} disabled:opacity-50 text-white px-6 py-3 rounded-xl text-base font-bold flex items-center gap-2`}>
            <Save className="w-5 h-5" /> {guardando ? 'Guardando…' : idEditando ? 'Guardar cambios' : 'Guardar y tomar fotos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuloClasificacionLineal;
