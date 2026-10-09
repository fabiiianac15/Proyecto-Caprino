import React from 'react';

/**
 * Árbol genealógico horizontal genérico.
 *
 * La raíz queda a la izquierda y cada generación crece hacia la derecha:
 * padre arriba, madre abajo. Las líneas se dibujan con bordes CSS, así que el
 * árbol se adapta solo a cualquier tamaño de tarjeta.
 *
 * Props:
 *   nodo          nodo raíz { ..., padre, madre }
 *   maxNivel      generaciones a mostrar por encima de la raíz
 *   renderNodo    (nodo, ctx) => tarjeta     ctx = { nivel, rol, hijo, ruta }
 *   renderVacio   (ctx) => elemento | null   para progenitores desconocidos
 *   resaltar      (nodo) => bool             pinta en ámbar la línea hacia ese subárbol
 */
const contiene = (nodo, resaltar) =>
  !!nodo && (resaltar(nodo) || contiene(nodo.padre, resaltar) || contiene(nodo.madre, resaltar));

const ESPACIO = ['py-3', 'py-2', 'py-1.5', 'py-1', 'py-0.5'];

const Rama = ({ nodo, nivel, rol, hijo, ruta, maxNivel, renderNodo, renderVacio, resaltar }) => {
  const ctx = { nivel, rol, hijo, ruta };
  const tarjeta = nodo ? renderNodo(nodo, ctx) : renderVacio?.(ctx);
  if (!tarjeta) return null;

  const expandir = nodo && nivel < maxNivel;
  if (!expandir) return tarjeta;

  const nuevaRuta = [...ruta, nodo];
  const hijas = [
    { n: nodo.padre, rol: 'padre' },
    { n: nodo.madre, rol: 'madre' },
  ].map(({ n, rol: r }) => ({
    r, n,
    el: (
      <Rama nodo={n} nivel={nivel + 1} rol={r} hijo={nodo} ruta={nuevaRuta} maxNivel={maxNivel}
        renderNodo={renderNodo} renderVacio={renderVacio} resaltar={resaltar} />
    ),
  }));
  const visibles = hijas.filter((h) => h.n || renderVacio?.({ nivel: nivel + 1, rol: h.r, hijo: nodo, ruta: nuevaRuta }));
  if (!visibles.length) return tarjeta;

  const marcadoTronco = resaltar && (contiene(nodo.padre, resaltar) || contiene(nodo.madre, resaltar));
  const linea = (activo) => (activo ? 'bg-amber-400' : 'bg-gray-300');

  return (
    <div className="flex items-center">
      {tarjeta}
      <div className={`h-0.5 w-6 shrink-0 ${linea(marcadoTronco)}`} />
      <div className="flex flex-col">
        {visibles.map((h, i) => {
          const sola = visibles.length === 1;
          const marcado = resaltar && contiene(h.n, resaltar);
          const tramo = sola ? '' : i === 0 ? 'top-1/2 bottom-0' : 'top-0 bottom-1/2';
          return (
            <div key={h.r} className={`relative flex items-center pl-6 ${ESPACIO[Math.min(nivel, ESPACIO.length - 1)]}`}>
              {!sola && <div className={`absolute left-0 w-0.5 ${linea(marcado)} ${tramo}`} />}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-6 ${linea(marcado)}`} />
              {h.el}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ArbolHorizontal = ({ nodo, maxNivel = 3, renderNodo, renderVacio, resaltar }) => (
  <div className="overflow-x-auto pb-2">
    <div className="flex justify-start py-2 min-w-max">
      <Rama nodo={nodo} nivel={0} rol="principal" hijo={null} ruta={[]} maxNivel={maxNivel}
        renderNodo={renderNodo} renderVacio={renderVacio} resaltar={resaltar} />
    </div>
  </div>
);

export default ArbolHorizontal;
