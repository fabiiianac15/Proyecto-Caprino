# Frontend Web - Sistema de Gestión Zootécnica Caprina

## Descripción

Aplicación web administrativa desarrollada con React para la gestión integral de datos zootécnicos de ganado caprino. Interfaz moderna y responsive para visualización de dashboards, análisis de datos y generación de reportes.

## Tecnologías

- React 18.x
- React Router v6
- React Query (TanStack Query)
- Tailwind CSS
- Recharts (gráficos)
- Axios (HTTP client)
- Vite (build tool)

## Requisitos Previos

- Node.js 18.x o superior
- npm 9.x o superior
- Backend API ejecutándose

## Instalación

### 1. Instalar dependencias

```bash
cd frontend-web
npm install
```

### 2. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000
VITE_APP_NAME=Sistema de Gestión Zootécnica Caprina
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo con hot reload

# Producción
npm run build            # Construye la aplicación para producción
npm run preview          # Previsualiza el build de producción

# Calidad de código
npm run lint             # Ejecuta ESLint
npm run lint:fix         # Corrige errores de ESLint automáticamente
npm run format           # Formatea código con Prettier

# Testing (cuando se implemente)
npm run test             # Ejecuta pruebas
npm run test:coverage    # Ejecuta pruebas con coverage
```

## Estructura del Proyecto

```
frontend-web/
├── public/                      # Archivos estáticos
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── componentes/             # Componentes React reutilizables
│   │   ├── comunes/             # Componentes genéricos
│   │   │   ├── Boton.jsx
│   │   │   ├── Tabla.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Formulario.jsx
│   │   │   ├── Cargando.jsx
│   │   │   ├── Alerta.jsx
│   │   │   └── Paginacion.jsx
│   │   ├── layout/              # Componentes de estructura
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   ├── animales/            # Componentes de animales
│   │   │   ├── ListaAnimales.jsx
│   │   │   ├── FormularioAnimal.jsx
│   │   │   ├── DetalleAnimal.jsx
│   │   │   ├── TarjetaAnimal.jsx
│   │   │   └── FiltrosAnimales.jsx
│   │   ├── produccion/          # Componentes de producción
│   │   │   ├── GraficoProduccion.jsx
│   │   │   ├── TablaProduccion.jsx
│   │   │   └── FormularioProduccion.jsx
│   │   ├── reproduccion/        # Componentes de reproducción
│   │   │   ├── CalendarioReproductivo.jsx
│   │   │   ├── FormularioServicio.jsx
│   │   │   └── HistorialReproductivo.jsx
│   │   ├── salud/               # Componentes sanitarios
│   │   │   ├── HistorialSanitario.jsx
│   │   │   ├── FormularioVacuna.jsx
│   │   │   └── CalendarioVacunas.jsx
│   │   └── reportes/            # Componentes de reportes
│   │       ├── Dashboard.jsx
│   │       ├── GraficoCrecimiento.jsx
│   │       └── ReporteProduccion.jsx
│   ├── paginas/                 # Páginas principales de la aplicación
│   │   ├── InicioSesion.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Animales/
│   │   │   ├── ListaAnimales.jsx
│   │   │   ├── NuevoAnimal.jsx
│   │   │   ├── EditarAnimal.jsx
│   │   │   └── DetalleAnimal.jsx
│   │   ├── Produccion/
│   │   │   ├── RegistroProduccion.jsx
│   │   │   └── EstadisticasProduccion.jsx
│   │   ├── Reproduccion/
│   │   │   ├── GestionReproduccion.jsx
│   │   │   └── CalendarioPartos.jsx
│   │   ├── Salud/
│   │   │   ├── RegistroSanitario.jsx
│   │   │   └── PlanVacunacion.jsx
│   │   └── Reportes/
│   │       ├── ReporteGeneral.jsx
│   │       ├── ReporteProduccion.jsx
│   │       └── ReporteCrecimiento.jsx
│   ├── servicios/               # Servicios para comunicación con API
│   │   ├── api.js               # Cliente HTTP base (Axios)
│   │   ├── authAPI.js           # Autenticación
│   │   ├── animalesAPI.js       # Endpoints de animales
│   │   ├── produccionAPI.js     # Endpoints de producción
│   │   ├── reproduccionAPI.js   # Endpoints de reproducción
│   │   ├── saludAPI.js          # Endpoints de salud
│   │   └── reportesAPI.js       # Endpoints de reportes
│   ├── contextos/               # Context API de React
│   │   ├── AuthContext.jsx      # Contexto de autenticación
│   │   ├── ConfigContext.jsx    # Configuración global
│   │   └── NotificacionContext.jsx  # Sistema de notificaciones
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.js           # Hook de autenticación
│   │   ├── useAnimales.js       # Hook para gestión de animales
│   │   ├── usePaginacion.js     # Hook de paginación
│   │   └── useNotificacion.js   # Hook de notificaciones
│   ├── utilidades/              # Funciones auxiliares
│   │   ├── formateo.js          # Formateo de fechas, números
│   │   ├── validacion.js        # Validaciones del lado del cliente
│   │   ├── constantes.js        # Constantes de la aplicación
│   │   └── ayudantes.js         # Funciones helper generales
│   ├── estilos/                 # Estilos globales
│   │   ├── index.css            # Estilos base y Tailwind
│   │   └── variables.css        # Variables CSS personalizadas
│   ├── App.jsx                  # Componente principal
│   ├── main.jsx                 # Punto de entrada
│   └── rutas.jsx                # Configuración de rutas
├── .env.example                 # Ejemplo de variables de entorno
├── .eslintrc.json               # Configuración ESLint
├── .prettierrc                  # Configuración Prettier
├── index.html                   # HTML principal
├── package.json                 # Dependencias y scripts
├── postcss.config.js            # Configuración PostCSS
├── tailwind.config.js           # Configuración Tailwind
└── vite.config.js               # Configuración Vite
```

## Características Principales

### 1. Dashboard Interactivo
- Indicadores clave (KPIs) del rebaño
- Gráficos de producción lechera
- Calendario de eventos próximos
- Alertas y notificaciones

### 2. Gestión de Animales
- Lista completa con filtros avanzados
- Registro de nuevos animales
- Edición de información
- Visualización de historial completo
- Árbol genealógico

### 3. Control de Producción
- Registro diario de producción lechera
- Gráficos de curvas de lactancia
- Comparación entre animales
- Estadísticas por raza y periodo

### 4. Gestión Reproductiva
- Registro de servicios y partos
- Calendario de partos próximos
- Indicadores de eficiencia reproductiva
- Historial reproductivo por hembra

### 5. Control Sanitario
- Registro de vacunas y tratamientos
- Calendario de vacunación
- Control de períodos de retiro
- Historial sanitario completo

### 6. Reportes y Análisis
- Reportes de producción
- Reportes de crecimiento
- Reportes reproductivos
- Exportación a PDF/Excel (futuro)

## Convenciones de Código

### Nomenclatura

- **Componentes**: PascalCase (Ej: `ListaAnimales.jsx`)
- **Funciones y variables**: camelCase (Ej: `obtenerAnimales`)
- **Constantes**: UPPER_SNAKE_CASE (Ej: `API_URL`)
- **Archivos de utilidades**: camelCase (Ej: `formateo.js`)

### Estructura de Componentes

```jsx
/**
 * Descripción del componente
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element}
 */
const NombreComponente = ({ prop1, prop2 }) => {
  // 1. Hooks de estado
  const [estado, setEstado] = useState(null);
  
  // 2. Hooks de efectos
  useEffect(() => {
    // Lógica de efecto
  }, []);
  
  // 3. Funciones del componente
  const manejarClick = () => {
    // Lógica
  };
  
  // 4. Renderizado condicional temprano
  if (!datos) return <Cargando />;
  
  // 5. Retorno del JSX
  return (
    <div className="contenedor">
      {/* Contenido */}
    </div>
  );
};

export default NombreComponente;
```

### Estilos con Tailwind

- Utilizar clases de utilidad de Tailwind
- Componentes responsive: mobile-first
- Tema de colores consistente
- Espaciado uniforme

```jsx
<div className="container mx-auto px-4">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Contenido */}
  </div>
</div>
```

## Gestión de Estado

### React Query

Se utiliza React Query para gestión de estado del servidor:

```javascript
// Hook personalizado con React Query
export const useAnimales = () => {
  return useQuery({
    queryKey: ['animales'],
    queryFn: obtenerAnimales,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
```

### Context API

Para estado global de la aplicación:

```javascript
// AuthContext para autenticación
const { usuario, iniciarSesion, cerrarSesion } = useAuth();

// NotificacionContext para mensajes
const { mostrarExito, mostrarError } = useNotificacion();
```

## Comunicación con API

### Cliente HTTP Base

```javascript
// servicios/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Servicios Específicos

```javascript
// servicios/animalesAPI.js
import api from './api';

export const obtenerAnimales = async (filtros = {}) => {
  const response = await api.get('/animales', { params: filtros });
  return response.data;
};

export const crearAnimal = async (datos) => {
  const response = await api.post('/animales', datos);
  return response.data;
};
```

## Manejo de Errores

```javascript
try {
  const datos = await crearAnimal(nuevoAnimal);
  mostrarExito('Animal registrado exitosamente');
} catch (error) {
  if (error.response?.status === 400) {
    mostrarError('Datos inválidos. Verifica el formulario');
  } else if (error.response?.status === 401) {
    mostrarError('Sesión expirada. Inicia sesión nuevamente');
    cerrarSesion();
  } else {
    mostrarError('Error al registrar animal');
  }
}
```

## Optimización

### Code Splitting

```javascript
// Carga diferida de páginas
const Dashboard = lazy(() => import('./paginas/Dashboard'));
const ListaAnimales = lazy(() => import('./paginas/Animales/ListaAnimales'));
```

### Memoización

```javascript
// Memoizar componentes pesados
const TablaAnimales = memo(({ animales }) => {
  // Renderizado de tabla
});

// Memoizar cálculos costosos
const estadisticas = useMemo(() => {
  return calcularEstadisticas(datos);
}, [datos]);
```

## Testing (A Implementar)

```bash
# Instalar dependencias de testing
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

```javascript
// Ejemplo de test
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import ListaAnimales from './ListaAnimales';

test('renderiza lista de animales', () => {
  render(<ListaAnimales />);
  expect(screen.getByText('Lista de Animales')).toBeInTheDocument();
});
```

## Despliegue

### Build de Producción

```bash
npm run build
```

Genera archivos optimizados en `/dist`

### Variables de Entorno para Producción

```env
VITE_API_URL=https://api.tudominio.com/api
VITE_API_TIMEOUT=15000
VITE_APP_NAME=Sistema de Gestión Zootécnica Caprina
```

### Servir con Nginx

```nginx
server {
    listen 80;
    server_name tudominio.com;
    
    root /var/www/frontend-web/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Troubleshooting

### Error de CORS

Verificar configuración del backend en `config/packages/nelmio_cors.yaml`

### Error de conexión a API

```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:8000/api

# Verificar variable de entorno
echo $VITE_API_URL
```

### Problemas de caché

```bash
# Limpiar caché de Vite
rm -rf node_modules/.vite
npm run dev
```

## Soporte

Para dudas o problemas:
1. Revisar documentación en `/documentacion/`
2. Revisar consola del navegador para errores
3. Contactar al equipo de desarrollo

## Licencia

Proyecto académico - Universidad [Nombre]
