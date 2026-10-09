# Frontend web de GRANME

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
├── App.jsx                rutas y barra superior con los indicadores del rebaño
├── contextos/AuthContext.jsx   sesión: token y usuario en localStorage
├── servicios/
│   ├── api.js             Axios con el token y apiHelpers (get, post, postStream para la IA)
│   └── caprino-api.js     funciones por módulo (animalesAPI, bienestarAPI, clasificacionLinealAPI…)
├── utilidades/            formateo (incluye ESTADOS_PRODUCTIVOS) y validaciones
└── componentes/
    ├── ListaAnimales, RegistroCabra, ExpedienteAnimal   Mis cabras
    ├── ModuloReproduccion, ModuloSalud, ModuloProduccion, ModuloPeso, ModuloCorrales
    ├── ModuloBienestar             evaluación MEBA del ICA con fotos y borradores
    ├── ModuloClasificacionLineal   método ADGA con guía y dibujos de referencia
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

## Convenciones

- Estilos con Tailwind. El módulo de genealogía usa verde azulado (teal) como color principal y violeta para todo lo que viene de la IA.
- Los gráficos usan Recharts. En los factores de la IA, verde azulado `#0d9488` significa que el factor sube la probabilidad y naranja `#ea580c` que la baja; los dos colores pasan la validación de daltonismo y contraste.
- Las imágenes protegidas (fotos de evidencia) se descargan con `fetch` y el token, y se muestran como `blob`.
- El texto dirigido al personal de la granja va en español sencillo. Los términos técnicos se explican en pantalla o en el glosario del módulo.
