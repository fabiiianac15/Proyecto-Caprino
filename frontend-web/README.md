# Frontend web de Capriva

Aplicación de una sola página en React 18 + Vite. Consume la API de `backend-symfony` con JWT y es la interfaz principal del sistema.

## Requisitos

- Node.js 18 o superior
- El backend corriendo (por defecto en `http://localhost:8000/api`)

## Instalación y uso

```bash
npm install
cp .env.example .env       # VITE_API_URL apunta al backend
npm run dev                # http://localhost:5173
npm run build              # genera dist/
```

Para probar contra otro backend sin tocar `.env`:

```bash
VITE_API_URL=http://127.0.0.1:8099/api npx vite --port 5199
```

## Estructura

```
src/
├── App.jsx                rutas y barra superior: marca, menú de módulos e indicadores del rebaño
├── contextos/AuthContext.jsx   sesión: token y usuario en localStorage
├── servicios/
│   ├── api.js             Axios con el token y apiHelpers (get, post, postStream para la IA)
│   ├── caprino-api.js     funciones por módulo (animalesAPI, bienestarAPI, clasificacionLinealAPI…)
│   └── exportarInforme.js informes a Excel (exceljs) y PDF (jspdf), con los gráficos como imagen
├── utilidades/            formateo (incluye ESTADOS_PRODUCTIVOS) y validaciones
└── componentes/
    ├── ListaAnimales, RegistroCabra, ExpedienteAnimal   Mis cabras
    ├── ModuloReproduccion, ModuloSalud, ModuloProduccion, ModuloPeso, ModuloCorrales
    ├── ModuloBienestar             evaluación MEBA del ICA con fotos y borradores
    ├── ModuloClasificacionLineal   método ADGA con guía y dibujos de referencia
    ├── ModuloReportes              panel del hato y 17 informes descargables
    ├── ModuloGenealogia            contenedor del módulo de genética e IA
    └── genealogia/
        ├── ArbolHorizontal.jsx     árbol genérico; resalta en ámbar los ancestros comunes
        ├── VistaArbol.jsx          árbol editable de 4 generaciones
        ├── VistaCruce.jsx          evaluación de un cruce y árbol de la futura cría
        ├── VistaRanking.jsx        mejor pareja: podio, tabla y gráfico
        ├── PanelModelo.jsx         precisión del modelo y botón de reentrenar
        └── comun.jsx               formato, colores de clasificación y panel de la IA
```

Los archivos `RegistroAnimal.jsx`, `RegistroReproduccion.jsx`, `RegistroProduccion.jsx` y los servicios `animalService.js`, `reproduccionService.js` y `produccionService.js` son de una versión anterior y no los carga ninguna ruta.

## Diseño

El sistema visual está en dos archivos y se aplica a toda la web:

- `tailwind.config.js` redefine la tipografía (la del sistema operativo), los grises neutros, los radios y las sombras. Los grises 400 y 500 son más oscuros que los de Tailwind para que el texto secundario pequeño cumpla 4,5:1 de contraste sobre blanco.
- `src/index.css` define el foco de teclado visible, las listas desplegables, las barras con desenfoque (`vidrio-verde`, `vidrio-claro`) y respeta las preferencias de menos movimiento y menos transparencia.

El verde de la marca y el color propio de cada módulo se mantienen. La barra superior tiene un menú para pasar de un módulo a otro sin volver al inicio. Las ilustraciones del tablero son SVG generados con `ilustraciones-modulos.py`.

## Reportes

`ModuloReportes.jsx` tiene un periodo común (este mes, 3 meses, 12 meses, este año, todo o fechas a mano), un panel con indicadores y gráficos, y 17 informes agrupados en Hato, Leche, Reproducción, Salud, Peso y Evaluaciones.

Todos los informes llegan del backend con la misma estructura (indicadores, gráficos y tabla), así que una sola vista los muestra y `exportarInforme.js` los convierte a Excel o PDF. Para agregar un informe basta con escribir su consulta en `InformeService.php` y sumarlo al catálogo `GRUPOS` de `ModuloReportes.jsx`.

- El Excel lleva encabezado de marca, indicadores, tabla con filtros y cabecera fija, formatos de número y fecha, y una segunda hoja con los gráficos y sus datos.
- El PDF lleva encabezado, tarjetas de indicadores, gráficos con leyenda, tabla con cabecera repetida en cada página y pie con numeración. Pasa a horizontal cuando la tabla tiene más de siete columnas.
- Las librerías de exportación se cargan solo al pulsar el botón.

## Convenciones

- Estilos con Tailwind. El módulo de genealogía usa verde azulado (teal) como color principal y violeta para todo lo que viene de la IA.
- Los gráficos usan Recharts. En los factores de la IA, verde azulado `#0d9488` significa que el factor sube la probabilidad y naranja `#ea580c` que la baja; los dos colores pasan la validación de daltonismo y contraste.
- Las imágenes protegidas (fotos de evidencia) se descargan con `fetch` y el token, y se muestran como `blob`.
- El texto dirigido al personal de la granja va en español sencillo. Los términos técnicos se explican en pantalla o en el glosario del módulo.
