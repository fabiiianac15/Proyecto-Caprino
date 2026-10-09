import React, { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, Loader2, CheckCircle2, AlertTriangle, Database, Info } from 'lucide-react';
import { apiHelpers } from '../../servicios/api';

const FUENTE = {
  conocimiento_previo: { texto: 'Conocimiento zootécnico', detalle: 'Todavía no hay suficientes partos registrados: el modelo usa reglas de la literatura caprina.' },
  mixta: { texto: 'Mixto: granja + conocimiento previo', detalle: 'Combina los partos reales de la granja con el conocimiento previo; los reales pesan cada vez más.' },
  granja: { texto: 'Aprendido de la granja', detalle: 'Con suficientes partos registrados, el modelo aprende sobre todo de la propia granja.' },
};

/** Estado del modelo predictivo: de dónde aprende, qué tan preciso es y reentrenar. */
const PanelModelo = ({ compacto = false }) => {
  const [estado, setEstado] = useState(null);
  const [entrenando, setEntrenando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargar = useCallback(async () => {
    try { setEstado(await apiHelpers.get('/genealogia/modelo')); }
    catch { setEstado({ disponible: false }); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const entrenar = async () => {
    setEntrenando(true); setMensaje(null);
    try {
      const r = await apiHelpers.post('/genealogia/modelo/entrenar');
      const n = r?.metricas?.n_reales ?? 0;
      setMensaje({ ok: true, texto: `Modelo reentrenado con ${n} servicio(s) reales de la granja.` });
      await cargar();
    } catch (e) {
      setMensaje({ ok: false, texto: e?.response?.data?.error || 'No se pudo reentrenar el modelo.' });
    } finally {
      setEntrenando(false);
    }
  };

  if (!estado) return null;
  if (!estado.disponible) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        El servicio de inteligencia artificial no está encendido. El árbol funciona, pero la evaluación de cruces necesita el microservicio ML (puerto 8001).
      </div>
    );
  }

  const m = estado.metricas || {};
  const v = m.validacion_real;
  const fuente = FUENTE[m.fuente] || FUENTE.conocimiento_previo;
  const mejora = v?.mejora_vs_tasa_media;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><Brain className="w-5 h-5 text-violet-600" /></div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800">Modelo de predicción de partos</p>
            <p className="text-xs text-gray-500 mt-0.5"><b className="text-gray-700">{fuente.texto}.</b> {fuente.detalle}</p>
            {!compacto && (
              <p className="text-[11px] text-gray-400 mt-1.5 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                La consanguinidad y los valores genéticos se calculan exactos con el pedigrí y la producción. El modelo solo estima la probabilidad de parto exitoso, y ningún modelo puede acertarla al 100 %: cada preñez tiene un componente de azar.
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 shrink-0 text-center">
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-lg font-black text-gray-800">{m.n_reales ?? 0}</p>
            <p className="text-[10px] text-gray-500 leading-tight">partos reales<br />usados</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2" title="AUC: capacidad de distinguir cruces que terminan en parto de los que no (0,5 = azar)">
            <p className="text-lg font-black text-gray-800">{v ? v.auc : '—'}</p>
            <p className="text-[10px] text-gray-500 leading-tight">AUC con datos<br />de la granja</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2" title="Cuánto mejora el error de las probabilidades frente a usar el promedio de la granja">
            <p className={`text-lg font-black ${mejora > 0 ? 'text-emerald-600' : 'text-gray-800'}`}>{mejora != null ? `${mejora > 0 ? '+' : ''}${Math.round(mejora * 100)} %` : '—'}</p>
            <p className="text-[10px] text-gray-500 leading-tight">mejora frente<br />al promedio</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          {estado.serviciosNuevos > 0
            ? <>Hay <b className="text-violet-700">{estado.serviciosNuevos}</b> parto(s) registrados que el modelo aún no conoce.</>
            : 'El modelo está al día con los partos registrados.'}
          {!v && ' Se valida con datos reales a partir de 30 partos.'}
        </p>
        <button onClick={entrenar} disabled={entrenando}
          className={`ml-auto px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
            estado.serviciosNuevos > 0 ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
          {entrenando ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Entrenando…</> : <><RefreshCw className="w-3.5 h-3.5" /> Reentrenar con los datos de la granja</>}
        </button>
      </div>
      {mensaje && (
        <p className={`text-xs mt-2 flex items-center gap-1.5 ${mensaje.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {mensaje.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {mensaje.texto}
        </p>
      )}
    </div>
  );
};

export default PanelModelo;
