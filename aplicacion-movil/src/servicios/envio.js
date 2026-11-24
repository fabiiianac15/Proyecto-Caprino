/**
 * Envío de una evaluación guardada en el teléfono.
 *
 * Son varios pasos (crear la evaluación y luego subir cada foto). Después de
 * cada paso se anota el avance en el borrador: si la señal se cae a la mitad,
 * el siguiente intento continúa donde quedó y no duplica nada.
 */

import api, { esErrorDeRed } from './api';
import { estaConectado } from './conectividad';
import { leerFoto, borrarFotos } from './fotosLocales';
import { guardarBorrador, eliminarBorrador, obtenerBorrador, fotosDeBorrador } from './borradores';
import { docsDe } from './evaluaciones';

const entero = (v) => (v === '' || v == null ? null : Number(v));
const docsCuerpo = (cab) => {
  const { rspp, asi } = docsDe(cab);
  const uno = (p, d) => ({
    [`${p}Estado`]: d.estado, [`${p}Numero`]: d.numero || null, [`${p}Fecha`]: d.fecha || null,
    [`${p}Vence`]: d.vence || null, [`${p}Checks`]: d.checks || [], [`${p}Obs`]: d.obs || null,
  });
  return { ...uno('rspp', rspp), ...uno('asi', asi) };
};

const cuerpoBienestar = (b, estado) => ({
  especie: 'CAPRINO',
  estado,
  fechaEvaluacion: b.cab.fechaEvaluacion,
  tipoProductor: b.cab.tipoProductor,
  sistemaProductivo: null,
  numAnimales: b.cab.numAnimales !== '' ? Number(b.cab.numAnimales) : null,
  tamanoMuestra: b.cab.tamanoMuestra !== '' ? Number(b.cab.tamanoMuestra) : null,
  evaluadores: b.cab.evaluadores || null,
  ...docsCuerpo(b.cab),
  observaciones: b.cab.observaciones || null,
  invCrias: entero(b.cab.inventario?.CRIAS), invJovenes: entero(b.cab.inventario?.JOVENES), invAdultos: entero(b.cab.inventario?.ADULTOS),
  mueCrias: b.cab.porGrupo?.CRIAS ?? null, mueJovenes: b.cab.porGrupo?.JOVENES ?? null, mueAdultos: b.cab.porGrupo?.ADULTOS ?? null,
  animalesMuestra: b.cab.animalesMuestra || [],
  detalle: Object.entries(b.valores).map(([idIndicador, v]) => ({
    idIndicador: Number(idIndicador),
    puntaje: v.puntaje,
    aplica: v.aplica,
    soporteDoc: v.soporteDoc || null,
    observacion: v.observacion || null,
    nEvaluados: v.nEvaluados === '' || v.nEvaluados == null ? null : Number(v.nEvaluados),
    nHallazgo: v.nHallazgo === '' || v.nHallazgo == null ? null : Number(v.nHallazgo),
  })),
});

const cuerpoLineal = (b) => ({
  idAnimal: b.idAnimal,
  fechaEvaluacion: b.fechaEvaluacion,
  edadMeses: b.edadMeses !== '' && b.edadMeses != null ? Number(b.edadMeses) : null,
  numLactancia: b.numLactancia !== '' && b.numLactancia != null ? Number(b.numLactancia) : null,
  observaciones: b.observaciones || null,
  detalle: Object.entries(b.valores).map(([idRasgo, calificacion]) => ({
    idRasgo: Number(idRasgo), calificacion,
    // Calificado solo con la medida (y no cambiado a mano) = MEDIDA
    origen: b.automaticos?.[idRasgo] && !b.manuales?.[idRasgo] ? 'MEDIDA' : 'VISUAL',
  })),
  medidas: Object.entries(b.medidas || {})
    .filter(([, m]) => Number(m?.valor) > 0)
    .map(([codigo, m]) => ({ codigo, valor: Number(m.valor), metodo: m.metodo === 'FOTO' ? 'FOTO' : 'INSTRUMENTO' })),
});

/** Lista de fotos por subir: [{ clave, campos }] */
const fotosPorSubir = (b) => {
  const subidas = new Set(b.fotosSubidas || []);
  let lista;
  if (b.tipo === 'lineal') {
    lista = [
      ...Object.entries(b.fotos || {}).filter(([, c]) => c).map(([vista, clave]) => ({ clave, campos: { tipoVista: vista } })),
      // Fotos donde se midió (con la vara de referencia): vista MEDICION
      ...(b.fotosMedicion || []).map((clave) => ({
        clave,
        campos: {
          tipoVista: 'MEDICION',
          descripcion: Object.entries(b.medidas || {}).filter(([, m]) => m?.foto === clave).map(([c, m]) => `${c} ${m.valor} cm`).join(', ').slice(0, 190) || 'Foto de medición',
        },
      })),
    ];
  } else {
    lista = [
      ...(b.fotosGenerales || []).map((clave) => ({ clave, campos: {} })),
      ...(b.fotosRspp || []).map((clave) => ({ clave, campos: { documento: 'RSPP', descripcion: 'Certificado RSPP' } })),
      ...(b.fotosAsi || []).map((clave) => ({ clave, campos: { documento: 'ASI', descripcion: 'Documento ASI' } })),
      ...Object.entries(b.valores).flatMap(([idInd, v]) => (v.fotos || []).map((clave) => ({ clave, campos: { idIndicador: idInd } }))),
    ];
  }
  return lista.filter((f) => !subidas.has(f.clave));
};

const mensajeError = (e) => e.response?.data?.error || e.response?.data?.message || e.message || 'Error desconocido';

/**
 * Envía el borrador. `estado` solo aplica a bienestar: 'BORRADOR' o 'FINALIZADA'.
 * @param {(texto:string)=>void} [alAvanzar]
 * @returns {Promise<{estado:'enviado'|'encolado', idRemoto?:number}>}
 */
export const enviarBorrador = async (id, estado = 'FINALIZADA', alAvanzar = () => {}) => {
  let b = obtenerBorrador(id);
  if (!b) throw new Error('La evaluación ya no está en el teléfono.');
  const base = b.tipo === 'lineal' ? '/clasificacion-lineal' : '/bienestar';

  if (!(await estaConectado())) {
    guardarBorrador({ ...b, pendienteEnvio: estado, errorEnvio: null });
    return { estado: 'encolado' };
  }

  try {
    // 1. Crear (o actualizar) la evaluación
    alAvanzar('Enviando la evaluación…');
    if (!b.idRemoto) {
      const cuerpo = b.tipo === 'lineal' ? cuerpoLineal(b) : cuerpoBienestar(b, estado);
      const { data } = await api.post(base, cuerpo);
      b = guardarBorrador({ ...b, idRemoto: data.data?.idEvaluacion });
      if (!b.idRemoto) throw new Error('El servidor no devolvió el número de la evaluación.');
    } else if (b.tipo === 'bienestar') {
      await api.put(`${base}/${b.idRemoto}`, cuerpoBienestar(b, estado));
    }

    // 2. Subir las fotos una por una, anotando cada una
    const pendientes = fotosPorSubir(b);
    for (let i = 0; i < pendientes.length; i += 1) {
      alAvanzar(`Subiendo foto ${i + 1} de ${pendientes.length}…`);
      const { clave, campos } = pendientes[i];
      const blob = await leerFoto(clave);
      if (blob) {
        const fd = new FormData();
        fd.append('file', blob, `${clave}.jpg`);
        Object.entries(campos).forEach(([k, v]) => fd.append(k, v));
        await api.post(`${base}/${b.idRemoto}/foto`, fd, { timeout: 60000 });
      }
      b = guardarBorrador({ ...b, fotosSubidas: [...(b.fotosSubidas || []), clave] });
    }

    // 3. Todo arriba: se libera el espacio del teléfono
    const idRemoto = b.idRemoto;
    await borrarFotos(fotosDeBorrador(b));
    await eliminarBorrador(b.id);
    return { estado: 'enviado', idRemoto };
  } catch (e) {
    if (esErrorDeRed(e)) {
      guardarBorrador({ ...obtenerBorrador(id), pendienteEnvio: estado, errorEnvio: null });
      return { estado: 'encolado' };
    }
    // El servidor rechazó los datos: hay que corregir antes de reintentar
    guardarBorrador({ ...obtenerBorrador(id), pendienteEnvio: null, errorEnvio: mensajeError(e) });
    throw new Error(mensajeError(e));
  }
};
