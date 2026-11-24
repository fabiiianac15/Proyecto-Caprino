/**
 * Textos y valores iniciales de las evaluaciones de bienestar (MEBA) y de
 * clasificación lineal. Los textos son los mismos de la versión web, en
 * lenguaje de corral.
 */

import { catalogoLocal, obtenerCatalogo } from './catalogos';
import { guardarBorrador, nuevoId } from './borradores';
import { confinamientoNoAplica } from './calculos';
import { hoyISO } from '@utilidades/formato';
import { docVacio } from '@utilidades/meba';

export const hoy = hoyISO;

/* ── Bienestar ────────────────────────────────────────────────────────────── */

export const GRUPOS = [
  { clave: 'RECURSOS', titulo: 'Recursos', peso: '35 %', ayuda: 'Instalaciones: agua, comida, comederos, sombra, corrales y piso. Se revisan recorriendo la granja.' },
  { clave: 'ANIMAL', titulo: 'Animal', peso: '55 %', ayuda: 'Se revisan una por una las cabras de la muestra: gordura, heridas, parásitos, cojeras. Es lo que más pesa.' },
  { clave: 'GESTION', titulo: 'Gestión', peso: '10 %', ayuda: 'Papeles y registros de la granja: mortalidad, medicamentos, plan sanitario. Se piden al encargado.' },
];

export const TIPOS_PRODUCTOR = [
  { valor: 'FAMILIAR', etiqueta: 'Familiar', ayuda: 'Hasta 30 animales, amarrados o sueltos cerca de la casa, con un corral pequeño para dormir.' },
  { valor: 'EXTENSIVO', etiqueta: 'Extensivo', ayuda: 'Pastan en potreros, orillas de caminos o lomas; hasta unos 300 animales.' },
  { valor: 'SEMI_INTENSIVO', etiqueta: 'Semi-intensivo', ayuda: 'Pastan de día y se encierran de noche; reciben concentrado o forraje.' },
  { valor: 'INTENSIVO', etiqueta: 'Intensivo', ayuda: 'Siempre encerradas (estabuladas), sin salir a pastorear.' },
];

export const NOMBRE_CLASIF = { EXCELENTE: 'Excelente', ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' };

/** Clase de color del texto según el puntaje del indicador. */
export const colorPuntaje = (p) => (p >= 100 ? 'text-acento' : p >= 55 ? 'text-texto' : p >= 20 ? 'text-aviso' : 'text-critico');

const aplicaPara = (ind, tipoProductor) => !(ind.soloConfinamiento && confinamientoNoAplica(tipoProductor));

export const valorVacio = (ind, tipoProductor) => ({
  puntaje: null, aplica: aplicaPara(ind, tipoProductor), soporteDoc: '', observacion: '', nEvaluados: '', nHallazgo: '', fotos: [],
});

/** Al cambiar el tipo de productor cambian los indicadores de encierro que aplican. */
export const reaplicar = (catalogo, valores, tipoProductor) => {
  const nuevo = { ...valores };
  catalogo.filter((i) => i.soloConfinamiento).forEach((i) => {
    const v = nuevo[i.idIndicador] || valorVacio(i, tipoProductor);
    nuevo[i.idIndicador] = { ...v, aplica: aplicaPara(i, tipoProductor) };
  });
  return nuevo;
};

/** Crea una evaluación de bienestar vacía. Devuelve null si no hay catálogo. */
export const nuevaBienestar = async (evaluador = '') => {
  let cat = catalogoLocal('bienestar');
  if (!cat.length) cat = await obtenerCatalogo('bienestar');
  if (!cat.length) return null;
  const tipoProductor = 'EXTENSIVO';
  const valores = {};
  cat.forEach((ind) => { valores[ind.idIndicador] = valorVacio(ind, tipoProductor); });
  return guardarBorrador({
    id: nuevoId(), tipo: 'bienestar',
    cab: {
      fechaEvaluacion: hoy(), tipoProductor, numAnimales: '', tamanoMuestra: '', evaluadores: evaluador, observaciones: '',
      inventario: { CRIAS: '', JOVENES: '', ADULTOS: '' }, porGrupo: { CRIAS: 0, JOVENES: 0, ADULTOS: 0 }, animalesMuestra: [],
      rspp: docVacio(), asi: docVacio(),
    },
    valores, fotosGenerales: [], fotosRspp: [], fotosAsi: [],
  });
};

/** RSPP y ASI de una visita (las guardadas antes solo tenían tieneRspp / tieneAsi). */
export const docsDe = (cab) => ({
  rspp: cab?.rspp || { ...docVacio(), estado: cab?.tieneRspp ? 'VIGENTE' : 'NO_SABE' },
  asi: cab?.asi || { ...docVacio(), estado: cab?.tieneAsi ? 'VIGENTE' : 'NO_SABE' },
});
export const vigentes = (cab) => {
  const d = docsDe(cab);
  return { rspp: d.rspp.estado === 'VIGENTE', asi: d.asi.estado === 'VIGENTE' };
};

/* ── Clasificación lineal ─────────────────────────────────────────────────── */

export const REGIONES = [
  { clave: 'APARIENCIA', titulo: 'Apariencia general', pts: 25 },
  { clave: 'ESTRUCTURA', titulo: 'Fortaleza lechera', pts: 15 },
  { clave: 'MAMARIO', titulo: 'Ubre y pezones', pts: 40 },
  { clave: 'PATAS', titulo: 'Patas y pezuñas', pts: 20 },
];
// Machos: sin sistema mamario; las patas y los testículos van en la apariencia
export const REGIONES_MACHO = [
  { clave: 'APARIENCIA', titulo: 'Apariencia, patas y testículos', pts: 55 },
  { clave: 'ESTRUCTURA', titulo: 'Fortaleza lechera', pts: 30 },
  { clave: 'CAPACIDAD', titulo: 'Capacidad corporal', pts: 15 },
];
export const regionesDe = (sexo) => (sexo === 'MACHO' ? REGIONES_MACHO : REGIONES);

export const VISTAS = [
  { clave: 'FRONTAL', etiqueta: 'De frente', ayuda: 'La cabra completa, de frente.' },
  { clave: 'LATERAL', etiqueta: 'De lado', ayuda: 'El cuerpo completo, de lado.' },
  { clave: 'POSTERIOR', etiqueta: 'Desde atrás', ayuda: 'El cuerpo completo, desde atrás.' },
  { clave: 'UBRE_POST', etiqueta: 'Ubre de atrás', ayuda: 'De cerca, la ubre vista desde atrás.', sexo: 'HEMBRA' },
  { clave: 'UBRE_LAT', etiqueta: 'Ubre de lado', ayuda: 'De cerca, la ubre vista de lado.', sexo: 'HEMBRA' },
  { clave: 'TESTICULOS', etiqueta: 'Testículos', ayuda: 'Desde atrás, la bolsa completa.', sexo: 'MACHO' },
  { clave: 'PATAS', etiqueta: 'Patas', ayuda: 'Las patas de atrás, parada en piso plano.' },
];
// Las vistas se toman a 2-3 m, celular horizontal, a la altura de la barriga y sin zoom,
// con el bastón parado junto a la cabra (sirve de referencia para comparar y para medir).


export const vistasDe = (sexo) => VISTAS.filter((v) => !v.sexo || v.sexo === sexo);

export const NIVEL = { 1: 'Bajo', 2: 'Medio', 3: 'Alto' };
export const NOMBRE_CATEGORIA = { EXCELENTE: 'Excelente', MUY_BUENO: 'Muy bueno', BUENO: 'Bueno', ACEPTABLE: 'Aceptable', REGULAR: 'Regular', POBRE: 'Pobre' };

// Rasgos con dibujo de referencia (Figura 1 del artículo, ADGA 2019)
export const CON_DIBUJO = new Set(['ANCPEC', 'ANGUL', 'ANGRU', 'ANCHGRU', 'PTVL', 'INAU', 'LSM', 'DIAPE', 'COLPE', 'AILPU', 'PROFUB']);

export const nuevaLineal = (animal = null, edadMeses = '', sexo = 'HEMBRA') => guardarBorrador({
  id: nuevoId(), tipo: 'lineal', sexo, manuales: {}, idAnimal: animal?.id ?? '', fechaEvaluacion: hoy(),
  edadMeses, numLactancia: '', observaciones: '', valores: {}, fotos: {}, paso: 0,
  // medidas: { CODIGO: { valor, metodo: 'INSTRUMENTO'|'FOTO', foto? } }
  medidas: {}, fotosMedicion: [], calibraciones: {},
});

// Medidas que se pueden estimar en una foto: distancias rectas en un plano.
// Los perímetros (cinta alrededor del cuerpo) y el peso no salen de una foto.
export const MEDIBLES_EN_FOTO = new Set([
  'ALZ_CRUZ', 'ALZ_GRUPA', 'LONG_CORP', 'PROF_PECHO', 'ANCH_PECHO', 'ANCH_GRUPA', 'LONG_GRUPA',
  'UBRE_PISO', 'LONG_PEZON', 'DIAM_PEZON', 'DIST_PEZONES',
]);
export const GRUPOS_MEDIDA = [
  { clave: 'CUERPO', titulo: 'Cuerpo', ayuda: 'Bastón zoométrico, cinta métrica y compás.' },
  { clave: 'UBRE', titulo: 'Ubre y pezones', ayuda: 'Cinta, regla y calibrador. Mejor antes del ordeño.' },
  { clave: 'TESTICULO', titulo: 'Testículos', ayuda: 'Cinta métrica, con los dos testículos al fondo de la bolsa.' },
  { clave: 'PESO', titulo: 'Peso', ayuda: 'Báscula.' },
];
