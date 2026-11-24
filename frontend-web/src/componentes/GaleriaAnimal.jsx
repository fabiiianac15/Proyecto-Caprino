import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Camera, Image as ImageIcon, Star, Trash2, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { fotosAnimalAPI } from '../servicios/caprino-api';
import CarruselFotos from './CarruselFotos';

// Vistas de la galería de cada cabra (mismas claves que ANIMAL_FOTO.tipo_vista)
export const VISTAS_ANIMAL = [
  { key: 'LATERAL',    label: 'De lado',       ayuda: 'Cuerpo completo, lado izquierdo, a 2-3 m.' },
  { key: 'FRONTAL',    label: 'De frente',     ayuda: 'Pecho y patas delanteras.' },
  { key: 'POSTERIOR',  label: 'Desde atrás',   ayuda: 'Grupa y patas traseras.' },
  { key: 'CABEZA',     label: 'Cabeza',        ayuda: 'Perfil de la cabeza y orejas (rasgos de la raza).' },
  { key: 'UBRE',       label: 'Ubre',          ayuda: 'Ubre de lado o desde atrás.', sexo: 'hembra' },
  { key: 'TESTICULOS', label: 'Testículos',    ayuda: 'Desde atrás, bolsa completa.', sexo: 'macho' },
  { key: 'PATAS',      label: 'Patas',         ayuda: 'Patas y pezuñas en piso plano.' },
  { key: 'OTRA',       label: 'Otra',          ayuda: 'Marcas, lesiones o lo que quiera dejar registrado.' },
];
const etiqueta = (k) => VISTAS_ANIMAL.find((v) => v.key === k)?.label || 'Foto';

/**
 * Galería de fotos de una cabra con carrusel y botones por vista.
 * - Con idAnimal: las fotos se suben y borran en el momento.
 * - Sin idAnimal (cabra nueva): las fotos quedan pendientes y se suben con
 *   ref.subirPendientes(id) después de guardar la cabra.
 */
const GaleriaAnimal = forwardRef(({ idAnimal, sexo, editable = true, alto = 'h-72 sm:h-80', compacta = false, onCambio }, ref) => {
  const [fotos, setFotos] = useState([]);
  const [pendientes, setPendientes] = useState([]); // {key, vista, file, url}
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState('');
  const [error, setError] = useState('');
  const [vistaActiva, setVistaActiva] = useState('LATERAL');
  const cam = useRef(null);
  const gal = useRef(null);

  useEffect(() => {
    if (!idAnimal) { setFotos([]); return; }
    setCargando(true);
    fotosAnimalAPI.listar(idAnimal).then(setFotos).catch(() => setFotos([])).finally(() => setCargando(false));
  }, [idAnimal]);

  useEffect(() => () => pendientes.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = (lista) => { setFotos(lista); onCambio?.(lista); };

  useImperativeHandle(ref, () => ({
    hayPendientes: () => pendientes.length > 0,
    subirPendientes: async (id) => {
      let ultima = fotos;
      let fallidas = 0;
      for (const p of pendientes) {
        try { ultima = await fotosAnimalAPI.subir(id, p.file, p.vista); } catch { fallidas += 1; }
      }
      setPendientes([]);
      cambiar(ultima);
      return fallidas;
    },
  }));

  const vistas = VISTAS_ANIMAL.filter((v) => !v.sexo || !sexo || v.sexo === sexo);

  const agregar = async (file) => {
    if (!file) return;
    setError('');
    if (!idAnimal) {
      setPendientes((p) => [...p, { key: `p${Date.now()}`, vista: vistaActiva, file, url: URL.createObjectURL(file) }]);
      return;
    }
    setSubiendo(vistaActiva);
    try { cambiar(await fotosAnimalAPI.subir(idAnimal, file, vistaActiva)); }
    catch (e) { setError(e.message || 'No se pudo subir la foto'); }
    finally { setSubiendo(''); }
  };
  const elegirArchivo = (e) => { agregar(e.target.files?.[0]); e.target.value = ''; };

  const eliminar = async (f) => {
    if (f.pendiente) { setPendientes((p) => p.filter((x) => x.key !== f.key)); return; }
    if (!f.idFoto || !window.confirm('¿Eliminar esta foto de la cabra?')) return;
    try { cambiar(await fotosAnimalAPI.eliminar(f.idFoto)); } catch (e) { setError(e.message || 'No se pudo eliminar'); }
  };
  const principal = async (f) => {
    if (!f.idFoto) return;
    try { cambiar(await fotosAnimalAPI.hacerPrincipal(f.idFoto)); } catch (e) { setError(e.message || 'No se pudo cambiar'); }
  };

  const todas = [
    ...fotos.map((f) => ({ ...f, key: f.idFoto ?? `principal-${f.url}` })),
    ...pendientes.map((p) => ({ key: p.key, url: p.url, tipoVista: p.vista, pendiente: true })),
  ];
  const items = todas.map((f) => ({
    key: f.key,
    url: f.url,
    etiqueta: `${etiqueta(f.tipoVista)}${f.principal ? ' · principal' : ''}${f.pendiente ? ' · sin subir' : ''}`,
    descripcion: f.fecha ? `Tomada el ${f.fecha}` : null,
    extra: editable && (
      <>
        {f.idFoto && !f.principal && (
          <button type="button" onClick={() => principal(f)} title="Usar como foto principal" aria-label="Usar como foto principal"
            className="w-10 h-10 rounded-full bg-black/55 hover:bg-amber-500 text-white flex items-center justify-center"><Star className="w-5 h-5" /></button>
        )}
        {(f.idFoto || f.pendiente) && (
          <button type="button" onClick={() => eliminar(f)} title="Eliminar foto" aria-label="Eliminar foto"
            className="w-10 h-10 rounded-full bg-black/55 hover:bg-red-600 text-white flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>
        )}
      </>
    ),
  }));
  const cuantas = (k) => todas.filter((f) => f.tipoVista === k).length;

  return (
    <div>
      {cargando ? (
        <div className={`${alto} rounded-2xl bg-gray-50 flex items-center justify-center`}><RefreshCw className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : (
        <CarruselFotos items={items} alto={alto} vacio={editable ? 'Agregue fotos de la cabra desde varios ángulos' : 'Esta cabra no tiene fotos'} />
      )}
      {error && <p className="mt-2 text-base text-red-700">{error}</p>}

      {editable && (
        <div className="mt-4">
          <p className="text-base font-semibold text-gray-700 mb-2">1. ¿Qué foto va a tomar?</p>
          <div className={`grid gap-2 ${compacta ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {vistas.map((v) => (
              <button key={v.key} type="button" onClick={() => setVistaActiva(v.key)} title={v.ayuda}
                className={`relative text-left px-3 py-2.5 rounded-xl border-2 transition ${vistaActiva === v.key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-400 bg-white'}`}>
                <span className="block text-base font-semibold text-gray-800">{v.label}</span>
                {cuantas(v.key) > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-xs font-bold text-emerald-700">
                    {pendientes.some((p) => p.vista === v.key) ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}{cuantas(v.key)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1.5">{VISTAS_ANIMAL.find((v) => v.key === vistaActiva)?.ayuda}</p>
          <p className="text-base font-semibold text-gray-700 mt-3 mb-2">2. Tómela o elíjala</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!!subiendo} onClick={() => cam.current?.click()}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-base font-semibold">
              {subiendo ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />} Cámara
            </button>
            <button type="button" disabled={!!subiendo} onClick={() => gal.current?.click()}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-800 text-base font-semibold">
              <ImageIcon className="w-5 h-5" /> Galería
            </button>
          </div>
          <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={elegirArchivo} />
          <input ref={gal} type="file" accept="image/*" className="hidden" onChange={elegirArchivo} />
          {!idAnimal && pendientes.length > 0 && <p className="text-sm text-amber-700 mt-2">Las fotos se suben al guardar la cabra.</p>}
        </div>
      )}
    </div>
  );
});

export default GaleriaAnimal;
