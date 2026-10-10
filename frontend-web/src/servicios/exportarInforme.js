/**
 * Exportación de informes a Excel y PDF.
 *
 * Los dos formatos salen de la misma estructura que entrega el backend
 * (indicadores, gráficos y tabla), así que cualquier informe nuevo se exporta
 * sin escribir código adicional. Las librerías se cargan solo al exportar para
 * no hacer más pesada la página.
 */

const VERDE = '15803D';
const VERDE_CLARO = 'F0FDF4';
const GRIS_TEXTO = '636366';
const GRIS_BORDE = 'E5E5EA';
const CEBRA = 'F9F9FB';

// Colores de las series; la pantalla y el PDF usan los mismos
export const PALETA = ['#4f46e5', '#0d9488', '#ea580c', '#db2777', '#65a30d', '#0284c7', '#9333ea', '#ca8a04'];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/* ── Formato compartido con la pantalla ──────────────────────────────────── */

export const fechaLarga = (iso) => {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return d && m && a ? `${d}/${m}/${a}` : String(iso);
};

export const formatear = (valor, tipo = 'texto', unidad = '') => {
  if (valor === null || valor === undefined || valor === '') return '—';
  let texto;
  if (tipo === 'entero') texto = Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 });
  else if (tipo === 'decimal') texto = Number(valor).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  else if (tipo === 'porcentaje') texto = `${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
  else if (tipo === 'fecha') texto = fechaLarga(valor);
  else texto = String(valor);
  return unidad ? `${texto} ${unidad}` : texto;
};

export const textoPeriodo = (periodo) =>
  periodo ? `Del ${fechaLarga(periodo.desde)} al ${fechaLarga(periodo.hasta)}` : 'Situación al día de hoy';

const nombreArchivo = (informe, extension) => {
  const limpio = informe.titulo.replace(/[\\/:*?"<>|]/g, '').trim();
  const h = new Date();   // fecha local, no la de Londres
  const hoy = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
  return `Capriva - ${limpio} - ${hoy}.${extension}`;
};

const descargar = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

/**
 * Convierte los gráficos que están en pantalla (SVG de Recharts) en imágenes
 * PNG para pegarlas en el PDF y en el Excel.
 * @param {HTMLElement|null} contenedor  nodo que contiene los [data-grafico]
 * @returns {Promise<Array<{titulo:string, dataUrl:string, ancho:number, alto:number}>>}
 */
export const capturarGraficos = async (contenedor) => {
  if (!contenedor) return [];
  const nodos = [...contenedor.querySelectorAll('[data-grafico]')];
  const salida = [];
  for (const nodo of nodos) {
    const svg = nodo.querySelector('svg.recharts-surface');
    if (!svg) continue;
    const { width, height } = svg.getBoundingClientRect();
    if (!width || !height) continue;
    const copia = svg.cloneNode(true);
    copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copia.setAttribute('width', width);
    copia.setAttribute('height', height);
    copia.setAttribute('font-family', 'Helvetica, Arial, sans-serif');
    const datos = new XMLSerializer().serializeToString(copia);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(datos)}`;
    try {
      const dataUrl = await new Promise((resolver, rechazar) => {
        const img = new Image();
        img.onload = () => {
          const escala = 2;   // nitidez al imprimir
          const lienzo = document.createElement('canvas');
          lienzo.width = width * escala;
          lienzo.height = height * escala;
          const ctx = lienzo.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, lienzo.width, lienzo.height);
          ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
          resolver(lienzo.toDataURL('image/png'));
        };
        img.onerror = rechazar;
        img.src = url;
      });
      salida.push({ titulo: nodo.dataset.grafico, dataUrl, ancho: width, alto: height });
    } catch {
      // Si un gráfico no se puede convertir, el informe sale sin esa imagen
    }
  }
  return salida;
};

/* ── Excel ───────────────────────────────────────────────────────────────── */

const FORMATO_EXCEL = { entero: '#,##0', decimal: '#,##0.00', porcentaje: '0.0" %"', fecha: 'dd/mm/yyyy' };

const valorExcel = (v, tipo) => {
  if (v === null || v === undefined || v === '') return null;
  if (tipo === 'fecha') {
    const [a, m, d] = String(v).slice(0, 10).split('-').map(Number);
    return a && m && d ? new Date(Date.UTC(a, m - 1, d)) : String(v);
  }
  if (tipo === 'entero' || tipo === 'decimal' || tipo === 'porcentaje') return Number(v);
  return String(v);
};

const anchoColumna = (col, filas) => {
  let max = col.titulo.length;
  for (const f of filas.slice(0, 300)) {
    const largo = formatear(f[col.clave], col.tipo).length;
    if (largo > max) max = largo;
  }
  return Math.min(Math.max(max + 3, 10), 46);
};

export const exportarExcel = async (informe, { usuario = '', graficos = [] } = {}) => {
  const ExcelJS = (await import('exceljs')).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Capriva';
  libro.created = new Date();

  const { columnas, filas } = informe.tabla;
  const nCols = Math.max(columnas.length, informe.indicadores.length, 4);
  const hoja = libro.addWorksheet('Informe', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: columnas.length > 7 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });
  columnas.forEach((c, i) => { hoja.getColumn(i + 1).width = anchoColumna(c, filas); });
  for (let i = columnas.length; i < nCols; i += 1) hoja.getColumn(i + 1).width = 18;

  // Banda de marca y encabezado
  const banda = (fila, texto, fuente, relleno, alto) => {
    hoja.mergeCells(fila, 1, fila, nCols);
    const c = hoja.getCell(fila, 1);
    c.value = texto;
    c.font = fuente;
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
    if (relleno) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${relleno}` } };
    hoja.getRow(fila).height = alto;
  };
  banda(1, 'Capriva', { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }, VERDE, 30);
  banda(2, informe.titulo, { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1D1D1F' } }, null, 26);
  banda(3, informe.descripcion || '', { name: 'Calibri', size: 11, color: { argb: `FF${GRIS_TEXTO}` } }, null, 30);
  banda(4, `${textoPeriodo(informe.periodo)}   ·   Generado el ${fechaLarga(informe.generado)}${usuario ? ` por ${usuario}` : ''}`,
    { name: 'Calibri', size: 10, italic: true, color: { argb: `FF${GRIS_TEXTO}` } }, null, 18);

  // Indicadores: etiqueta arriba y valor grande debajo
  let fila = 6;
  if (informe.indicadores.length) {
    informe.indicadores.forEach((ind, i) => {
      const etiqueta = hoja.getCell(fila, i + 1);
      etiqueta.value = ind.etiqueta;
      etiqueta.font = { name: 'Calibri', size: 9, color: { argb: `FF${GRIS_TEXTO}` } };
      etiqueta.alignment = { wrapText: true, vertical: 'bottom' };
      const valor = hoja.getCell(fila + 1, i + 1);
      valor.value = ind.formato === 'texto' || ind.valor === null ? formatear(ind.valor, ind.formato) : Number(ind.valor);
      if (FORMATO_EXCEL[ind.formato] && ind.valor !== null) valor.numFmt = ind.unidad ? `${FORMATO_EXCEL[ind.formato]}" ${ind.unidad}"` : FORMATO_EXCEL[ind.formato];
      valor.font = { name: 'Calibri', size: 14, bold: true, color: { argb: `FF${VERDE}` } };
      valor.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      [etiqueta, valor].forEach((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${VERDE_CLARO}` } };
      });
    });
    hoja.getRow(fila).height = 26;
    hoja.getRow(fila + 1).height = 24;
    fila += 3;
  }

  // Tabla
  const filaCabecera = fila;
  if (columnas.length) {
    columnas.forEach((c, i) => {
      const celda = hoja.getCell(filaCabecera, i + 1);
      celda.value = c.titulo;
      celda.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${VERDE}` } };
      celda.alignment = { vertical: 'middle', horizontal: c.tipo === 'texto' ? 'left' : 'center', wrapText: true };
      celda.border = { bottom: { style: 'thin', color: { argb: `FF${VERDE}` } } };
    });
    hoja.getRow(filaCabecera).height = 30;

    filas.forEach((f, n) => {
      const r = filaCabecera + 1 + n;
      columnas.forEach((c, i) => {
        const celda = hoja.getCell(r, i + 1);
        celda.value = valorExcel(f[c.clave], c.tipo);
        if (FORMATO_EXCEL[c.tipo]) celda.numFmt = FORMATO_EXCEL[c.tipo];
        celda.font = { name: 'Calibri', size: 10.5 };
        celda.alignment = { vertical: 'top', horizontal: c.tipo === 'texto' ? 'left' : c.tipo === 'fecha' ? 'center' : 'right', wrapText: c.tipo === 'texto' };
        celda.border = { bottom: { style: 'hair', color: { argb: `FF${GRIS_BORDE}` } } };
        if (n % 2 === 1) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CEBRA}` } };
      });
    });

    if (!filas.length) {
      hoja.mergeCells(filaCabecera + 1, 1, filaCabecera + 1, columnas.length);
      const vacia = hoja.getCell(filaCabecera + 1, 1);
      vacia.value = 'No hay registros en este periodo.';
      vacia.font = { name: 'Calibri', size: 11, italic: true, color: { argb: `FF${GRIS_TEXTO}` } };
    } else {
      hoja.autoFilter = { from: { row: filaCabecera, column: 1 }, to: { row: filaCabecera + filas.length, column: columnas.length } };
    }
    hoja.views = [{ state: 'frozen', ySplit: filaCabecera, showGridLines: false }];
    hoja.pageSetup.printTitlesRow = `${filaCabecera}:${filaCabecera}`;
    fila = filaCabecera + Math.max(filas.length, 1) + 2;
  }

  // Notas
  (informe.notas || []).forEach((nota) => {
    hoja.mergeCells(fila, 1, fila, nCols);
    const c = hoja.getCell(fila, 1);
    c.value = `Nota: ${nota}`;
    c.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: `FF${GRIS_TEXTO}` } };
    c.alignment = { wrapText: true, vertical: 'top' };
    hoja.getRow(fila).height = 28;
    fila += 1;
  });
  hoja.headerFooter.oddFooter = `&L&8Capriva · ${informe.titulo}&R&8Página &P de &N`;

  // Segunda hoja: gráficos como imagen y sus datos al lado
  if (informe.graficos.some((g) => g.datos.length)) {
    const hg = libro.addWorksheet('Gráficos', { views: [{ showGridLines: false }] });
    hg.getColumn(1).width = 34;
    let r = 1;
    informe.graficos.filter((g) => g.datos.length).forEach((g) => {
      hg.mergeCells(r, 1, r, 1 + g.series.length);
      const t = hg.getCell(r, 1);
      t.value = g.titulo;
      t.font = { name: 'Calibri', size: 13, bold: true, color: { argb: `FF${VERDE}` } };
      r += 1;
      ['', ...g.series.map((s) => s.nombre)].forEach((titulo, i) => {
        const c = hg.getCell(r, i + 1);
        c.value = i === 0 ? 'Categoría' : titulo;
        c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${VERDE}` } };
        if (i > 0) hg.getColumn(i + 1).width = Math.max(hg.getColumn(i + 1).width || 0, 16);
      });
      const inicioDatos = r + 1;
      g.datos.forEach((d, n) => {
        hg.getCell(inicioDatos + n, 1).value = d.nombre;
        g.series.forEach((s, i) => {
          const c = hg.getCell(inicioDatos + n, i + 2);
          c.value = Number(d[s.clave] ?? 0);
          c.numFmt = '#,##0.##';
        });
      });
      const imagen = graficos.find((x) => x.titulo === g.titulo);
      let altoFilas = g.datos.length + 1;
      if (imagen) {
        const id = libro.addImage({ base64: imagen.dataUrl, extension: 'png' });
        const ancho = 520;
        const alto = Math.round((imagen.alto / imagen.ancho) * ancho);
        hg.addImage(id, { tl: { col: 2 + g.series.length, row: r - 1 }, ext: { width: ancho, height: alto } });
        altoFilas = Math.max(altoFilas, Math.ceil(alto / 20) + 1);
      }
      r += altoFilas + 2;
    });
  }

  const contenido = await libro.xlsx.writeBuffer();
  descargar(new Blob([contenido], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo(informe, 'xlsx'));
};

/* ── PDF ─────────────────────────────────────────────────────────────────── */

const RGB_VERDE = [21, 128, 61];
const RGB_TEXTO = [29, 29, 31];
const RGB_GRIS = [99, 99, 102];

export const exportarPDF = async (informe, { usuario = '', graficos = [] } = {}) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const { columnas, filas } = informe.tabla;
  const horizontal = columnas.length > 7;
  const doc = new jsPDF({ orientation: horizontal ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 12;
  const util = ancho - margen * 2;

  // Encabezado de la primera página
  doc.setFillColor(...RGB_VERDE);
  doc.rect(0, 0, ancho, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Capriva', margen, 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Los datos de tu hato, convertidos en decisiones', ancho - margen, 15, { align: 'right' });

  let y = 35;
  doc.setTextColor(...RGB_TEXTO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(informe.titulo, margen, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...RGB_GRIS);
  if (informe.descripcion) {
    const lineas = doc.splitTextToSize(informe.descripcion, util);
    doc.text(lineas, margen, y);
    y += lineas.length * 4.6;
  }
  doc.setFontSize(9);
  doc.text(`${textoPeriodo(informe.periodo)}  ·  Generado el ${fechaLarga(informe.generado)}${usuario ? ` por ${usuario}` : ''}`, margen, y + 1);
  y += 8;

  // Indicadores en tarjetas
  const inds = informe.indicadores;
  if (inds.length) {
    const porFila = Math.min(inds.length, horizontal ? 6 : 4);
    const sep = 3;
    const anchoTarjeta = (util - sep * (porFila - 1)) / porFila;
    const altoTarjeta = 17;
    inds.forEach((ind, i) => {
      const col = i % porFila;
      const fil = Math.floor(i / porFila);
      const x = margen + col * (anchoTarjeta + sep);
      const yy = y + fil * (altoTarjeta + sep);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(x, yy, anchoTarjeta, altoTarjeta, 2.5, 2.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...RGB_GRIS);
      doc.text(doc.splitTextToSize(ind.etiqueta, anchoTarjeta - 6)[0], x + 3, yy + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RGB_VERDE);
      const valor = formatear(ind.valor, ind.formato, ind.unidad);
      doc.setFontSize(valor.length > 16 ? 9 : 13);
      doc.text(doc.splitTextToSize(valor, anchoTarjeta - 6)[0], x + 3, yy + 13);
    });
    y += Math.ceil(inds.length / porFila) * (altoTarjeta + sep) + 3;
  }

  // Gráficos: dos por fila
  if (graficos.length) {
    const porFila = graficos.length === 1 ? 1 : 2;
    const sep = 5;
    const anchoImg = graficos.length === 1 ? Math.min(util, 150) : (util - sep) / 2;
    for (let i = 0; i < graficos.length; i += porFila) {
      const grupo = graficos.slice(i, i + porFila);
      // La leyenda de Recharts es HTML y no viaja en la imagen: se escribe aquí
      const leyendas = grupo.map((g) => {
        const def = informe.graficos.find((x) => x.titulo === g.titulo);
        if (!def) return [];
        if (def.tipo === 'torta') return def.datos.map((d, k) => ({ color: PALETA[k % PALETA.length], texto: `${d.nombre}: ${formatear(d[def.series[0].clave], 'decimal')}` }));
        return def.series.length > 1 ? def.series.map((s, k) => ({ color: PALETA[k % PALETA.length], texto: s.nombre })) : [];
      });
      const altoLeyenda = Math.max(...leyendas.map((l) => Math.ceil(l.length / 2) * 4.2));
      const altoFila = Math.max(...grupo.map((g) => (g.alto / g.ancho) * anchoImg)) + 8 + altoLeyenda;
      if (y + altoFila > alto - 16) { doc.addPage(); y = 16; }
      grupo.forEach((g, n) => {
        const x = margen + n * (anchoImg + sep);
        const altoImg = (g.alto / g.ancho) * anchoImg;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...RGB_TEXTO);
        doc.text(g.titulo, x, y + 3.5);
        doc.addImage(g.dataUrl, 'PNG', x, y + 6, anchoImg, altoImg, undefined, 'FAST');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        leyendas[n].forEach((l, k) => {
          const lx = x + 2 + (k % 2) * (anchoImg / 2);
          const ly = y + 6 + altoImg + 3.5 + Math.floor(k / 2) * 4.2;
          doc.setFillColor(...rgb(l.color));
          doc.circle(lx + 1, ly - 1, 1.1, 'F');
          doc.setTextColor(...RGB_TEXTO);
          doc.text(doc.splitTextToSize(l.texto, anchoImg / 2 - 6)[0], lx + 3.5, ly);
        });
      });
      y += altoFila + 3;
    }
  }

  // Tabla
  if (columnas.length) {
    if (y > alto - 40) { doc.addPage(); y = 16; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...RGB_TEXTO);
    doc.text(`Detalle (${filas.length} ${filas.length === 1 ? 'registro' : 'registros'})`, margen, y + 2);
    const estilos = {};
    columnas.forEach((c, i) => {
      estilos[i] = { halign: c.tipo === 'texto' ? 'left' : c.tipo === 'fecha' ? 'center' : 'right' };
    });
    autoTable(doc, {
      startY: y + 5,
      margin: { left: margen, right: margen, top: 16, bottom: 14 },
      head: [columnas.map((c) => c.titulo)],
      body: filas.length
        ? filas.map((f) => columnas.map((c) => (f[c.clave] === null || f[c.clave] === undefined ? '' : formatear(f[c.clave], c.tipo))))
        : [[{ content: 'No hay registros en este periodo.', colSpan: columnas.length, styles: { halign: 'center', fontStyle: 'italic', textColor: RGB_GRIS } }]],
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: columnas.length > 11 ? 6.8 : 8, cellPadding: { top: 1.8, bottom: 1.8, left: 1.8, right: 1.8 }, textColor: RGB_TEXTO, lineColor: [229, 229, 234], lineWidth: { bottom: 0.1 }, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: RGB_VERDE, textColor: [255, 255, 255], fontStyle: 'bold', valign: 'middle', lineWidth: 0 },
      alternateRowStyles: { fillColor: [249, 249, 251] },
      columnStyles: estilos,
      rowPageBreak: 'avoid',
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Notas
  if ((informe.notas || []).length) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...RGB_GRIS);
    informe.notas.forEach((nota) => {
      const lineas = doc.splitTextToSize(`Nota: ${nota}`, util);
      if (y + lineas.length * 3.8 > alto - 14) { doc.addPage(); y = 16; }
      doc.text(lineas, margen, y);
      y += lineas.length * 3.8 + 1.5;
    });
  }

  // Pie en todas las páginas
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(229, 229, 234);
    doc.setLineWidth(0.2);
    doc.line(margen, alto - 10, ancho - margen, alto - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...RGB_GRIS);
    doc.text(`Capriva · ${informe.titulo}`, margen, alto - 6);
    doc.text(`Página ${p} de ${paginas}`, ancho - margen, alto - 6, { align: 'right' });
  }

  doc.save(nombreArchivo(informe, 'pdf'));
};
