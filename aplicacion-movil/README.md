# Aplicación Móvil - Sistema de Gestión Zootécnica Caprina

## Descripción

Aplicación móvil desarrollada con Capacitor y React para el registro de datos zootécnicos en campo. Diseñada para uso en corrales con funcionalidad offline-first.

## Tecnologías

- Capacitor 5.x
- React 18.x
- Ionic Components
- SQLite (almacenamiento local)
- React Query
- Tailwind CSS

## Características Principales

### Funcionalidad Offline-First
- Almacenamiento local con SQLite
- Cola de sincronización automática
- Detección de conectividad
- Sincronización al recuperar conexión

### Optimizado para Campo
- Interfaz simple y grande
- Funciona con una mano
- Resistente a luz solar directa
- Minimiza escritura de texto

### Plugins de Capacitor
- Camera: Captura de fotos de animales
- Barcode Scanner: Escaneo de códigos QR/crotal
- Network: Detección de conectividad
- Storage: Almacenamiento seguro

## Requisitos Previos

- Node.js 18.x o superior
- Android Studio (para Android)
- Xcode (para iOS, solo macOS)
- Backend API ejecutándose

## Instalación

### 1. Instalar dependencias

```bash
cd aplicacion-movil
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
VITE_API_URL=https://api.tudominio.com/api
VITE_APP_NAME=Gestión Caprino Móvil
```

### 3. Construir proyecto web

```bash
npm run build
```

### 4. Sincronizar con plataformas nativas

```bash
# Android
npx cap add android
npx cap sync android

# iOS (solo macOS)
npx cap add ios
npx cap sync ios
```

## Desarrollo

### Modo Web (Desarrollo Rápido)

```bash
npm run dev
```

Abre en navegador: `http://localhost:5173`

### Modo Android

```bash
# Sincronizar cambios
npx cap sync android

# Abrir Android Studio
npx cap open android
```

Ejecutar desde Android Studio o dispositivo conectado.

### Modo iOS

```bash
# Sincronizar cambios
npx cap sync ios

# Abrir Xcode
npx cap open ios
```

Ejecutar desde Xcode.

## Estructura del Proyecto

```
aplicacion-movil/
├── android/                     # Proyecto Android nativo
├── ios/                        # Proyecto iOS nativo
├── public/
├── src/
│   ├── componentes/
│   │   ├── comunes/
│   │   │   ├── BotonGrande.jsx     # Botón optimizado para táctil
│   │   │   ├── InputGrande.jsx     # Input con teclado numérico
│   │   │   ├── Cargando.jsx
│   │   │   └── Alerta.jsx
│   │   ├── escaner/
│   │   │   ├── EscanerQR.jsx       # Componente de escaneo
│   │   │   └── VisorCodigo.jsx
│   │   ├── camara/
│   │   │   ├── CapturarFoto.jsx
│   │   │   └── VisorFoto.jsx
│   │   └── formularios/
│   │       ├── FormularioPesaje.jsx
│   │       ├── FormularioProduccion.jsx
│   │       └── FormularioSalud.jsx
│   ├── paginas/
│   │   ├── Inicio.jsx              # Pantalla principal con menú
│   │   ├── EscanearAnimal.jsx      # Escaneo de QR
│   │   ├── RegistrarPesaje.jsx     # Registro rápido de peso
│   │   ├── RegistrarProduccion.jsx # Registro de producción
│   │   ├── RegistrarSalud.jsx      # Registro sanitario
│   │   ├── VerAnimal.jsx           # Consulta de animal
│   │   └── Sincronizacion.jsx      # Estado de sincronización
│   ├── servicios/
│   │   ├── api.js                  # Cliente HTTP con lógica offline
│   │   ├── almacenamientoLocal.js  # Wrapper de SQLite
│   │   ├── sincronizacion.js       # Lógica de sincronización
│   │   └── conectividad.js         # Detección de red
│   ├── hooks/
│   │   ├── useOffline.js           # Hook para modo offline
│   │   ├── useSincronizacion.js    # Hook de sincronización
│   │   ├── useEscaner.js           # Hook de escaneo QR
│   │   └── useCamara.js            # Hook de cámara
│   ├── utilidades/
│   │   ├── validacion.js
│   │   ├── formateo.js
│   │   └── constantes.js
│   ├── App.jsx
│   └── main.jsx
├── capacitor.config.ts          # Configuración de Capacitor
├── package.json
├── vite.config.js
└── README.md
```

## Funciones Principales

### 1. Escaneo de Animal

```jsx
// Escanear código QR o crotal
const { escanear } = useEscaner();

const manejarEscaneo = async () => {
  const codigo = await escanear();
  const animal = await buscarAnimalPorCodigo(codigo);
  navegarADetalleAnimal(animal.id);
};
```

### 2. Registro de Pesaje

```jsx
// Formulario simple de pesaje
<FormularioPesaje
  idAnimal={animalId}
  onGuardar={(datos) => {
    if (estaOnline) {
      enviarAPI(datos);
    } else {
      guardarLocal(datos);
    }
  }}
/>
```

### 3. Sincronización Automática

```jsx
// Hook de sincronización
const { 
  pendientes, 
  sincronizando, 
  sincronizarTodo 
} = useSincronizacion();

// Se ejecuta automáticamente al recuperar conexión
useEffect(() => {
  if (estaOnline && pendientes > 0) {
    sincronizarTodo();
  }
}, [estaOnline]);
```

## Almacenamiento Local (SQLite)

### Estructura de Tablas

```sql
-- Tabla de registros pendientes de sincronización
CREATE TABLE IF NOT EXISTS cola_sincronizacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  metodo TEXT NOT NULL,
  datos TEXT NOT NULL,
  fecha_creacion INTEGER NOT NULL,
  intentos INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'pendiente'
);

-- Tabla de caché de animales consultados
CREATE TABLE IF NOT EXISTS cache_animales (
  id_animal INTEGER PRIMARY KEY,
  datos TEXT NOT NULL,
  fecha_actualizacion INTEGER NOT NULL
);
```

### Uso de SQLite

```javascript
import { almacenamientoLocal } from '@/servicios/almacenamientoLocal';

// Guardar en cola de sincronización
await almacenamientoLocal.agregarACola({
  tipo: 'pesaje',
  endpoint: '/api/pesajes',
  metodo: 'POST',
  datos: { idAnimal: 123, peso: 45.5, fecha: '2025-01-15' }
});

// Obtener registros pendientes
const pendientes = await almacenamientoLocal.obtenerPendientes();
```

## Plugins de Capacitor

### Camera

```javascript
import { Camera, CameraResultType } from '@capacitor/camera';

const tomarFoto = async () => {
  const foto = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    quality: 80
  });
  
  return foto.webPath;
};
```

### Barcode Scanner

```javascript
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

const escanearQR = async () => {
  const resultado = await BarcodeScanner.startScan();
  
  if (resultado.hasContent) {
    return resultado.content;
  }
  
  return null;
};
```

### Network

```javascript
import { Network } from '@capacitor/network';

// Obtener estado actual
const estado = await Network.getStatus();
console.log('Conectado:', estado.connected);

// Escuchar cambios
Network.addListener('networkStatusChange', (estado) => {
  if (estado.connected) {
    console.log('Conexión recuperada');
    iniciarSincronizacion();
  }
});
```

## Optimizaciones para Móvil

### Interfaz Táctil

```jsx
// Botones grandes (mínimo 48x48px)
<button className="min-h-[48px] min-w-[48px] text-lg">
  Registrar
</button>

// Inputs grandes con teclado numérico
<input 
  type="number" 
  inputMode="decimal"
  className="text-2xl h-16"
/>
```

### Modo Offline Visual

```jsx
// Indicador de estado de conexión
{!estaOnline && (
  <div className="bg-yellow-500 text-white p-2 text-center">
    Modo sin conexión - Los datos se sincronizarán automáticamente
  </div>
)}

// Contador de registros pendientes
{pendientes > 0 && (
  <span className="badge bg-red-500">
    {pendientes} pendientes
  </span>
)}
```

## Build para Producción

### Android APK

```bash
# Build de producción
npm run build

# Sincronizar con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android

# Generar APK/AAB desde Android Studio:
# Build > Generate Signed Bundle / APK
```

### iOS App Store

```bash
# Build de producción
npm run build

# Sincronizar con iOS
npx cap sync ios

# Abrir en Xcode
npx cap open ios

# Configurar certificados y provisioning
# Archivar y subir a App Store Connect
```

## Permisos Requeridos

### Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### iOS (ios/App/Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>La aplicación necesita acceso a la cámara para escanear códigos QR y tomar fotos de los animales</string>
```

## Testing en Dispositivos

### Android

```bash
# Habilitar depuración USB en el dispositivo
# Conectar dispositivo por USB
adb devices

# Ejecutar desde Android Studio o:
npx cap run android
```

### iOS

```bash
# Conectar dispositivo iOS
# Ejecutar desde Xcode
```

## Troubleshooting

### Error de sincronización de Capacitor

```bash
rm -rf node_modules
rm -rf android/app/build
npm install
npx cap sync
```

### Error de permisos

Verificar que los permisos estén declarados en AndroidManifest.xml o Info.plist

### Base de datos SQLite no funciona

```bash
npm install @capacitor-community/sqlite
npx cap sync
```

## Mejores Prácticas

1. **Validar datos antes de guardar localmente**
2. **Mostrar feedback visual inmediato al usuario**
3. **Sincronizar en background sin bloquear UI**
4. **Manejar errores de sincronización con reintentos**
5. **Mantener caché de datos consultados frecuentemente**
6. **Optimizar tamaño de imágenes antes de subir**
7. **Implementar límite de reintentos de sincronización**

## Licencia

Proyecto académico - Universidad [Nombre]
