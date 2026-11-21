# Capriva: aplicación móvil

App Android para trabajar en el corral con el teléfono. Usa la misma API de `backend-symfony` y el mismo usuario y contraseña de la web. Está hecha con React 18, Vite, Tailwind y Capacitor 5.

## Qué hace

- **Rebaño.** Busca un animal por chapeta o nombre, o lee el código QR de la chapeta con la cámara. La lista queda guardada en el teléfono.
- **Registros rápidos.** Salud, pesaje, leche y FAMACHA, desde Inicio o desde la ficha del animal.
- **Bienestar animal (MEBA del ICA).** Los 35 indicadores agrupados, con la pregunta, cómo revisarlo y los criterios 100, 55, 20 y 0. En los indicadores de muestreo se cuentan los animales y la app elige la calificación con los cortes de la guía. Cada indicador admite fotos de evidencia tomadas con la cámara.
- **Clasificación lineal (ADGA).** Un rasgo por pantalla con su dibujo de referencia, las seis fotos por vista y el puntaje final por partes.
- **Sin señal.** Todo se guarda en el teléfono. Los registros y las evaluaciones se envían solos cuando vuelve la conexión, y también desde Ajustes, en Por enviar.

## Probarla en el teléfono

1. Instalar `Capriva.apk` (hay que permitir la instalación de orígenes desconocidos).
2. Entrar con el mismo correo y contraseña de la web.

La app se conecta por internet al servidor de AWS (`http://3.95.12.233/api`), así que funciona con wifi o con datos desde cualquier lugar. Si el servidor cambia de dirección se puede corregir en la pantalla de entrada o en Ajustes, en Servidor, sin reinstalar. Para que el cambio quede de fábrica se edita `VITE_API_URL` en `.env` y se vuelve a compilar.

El servidor debe aceptar el origen `http://localhost` en `CORS_ALLOW_ORIGIN`, que es desde donde hace las peticiones la app instalada.

## Compilar el APK

```bash
./compilar-apk.sh
```

El script usa el JDK 17 y el Android SDK de `~/android-dev` (plataforma 33 y build-tools 33.0.2). Compila la web, crea el proyecto Android si no existe con `preparar-android.sh` (permiso de cámara, tráfico http hacia el servidor e iconos) y deja el APK en `Capriva.apk`. La carpeta `android/` y el APK no se suben al repositorio.

La dirección por defecto del servidor sale de `VITE_API_URL` en `.env` al momento de compilar.

## Probarla en el navegador

```bash
npm install
cp .env.example .env
npm run dev
```

En el navegador no hay escáner QR, y la cámara se reemplaza por el selector de archivos.

## Estructura

```
src/
├── App.jsx              rutas, pestañas y botón atrás de Android
├── paginas/             Login, Inicio, Rebano, Animal, Registrar, Evaluar,
│                        BienestarEditor, BienestarIndicador, LinealEditor, Ajustes, Pendientes
├── ui/                  piezas de interfaz: Barra, Pestanas, Lista, Hoja, Controles, Chapeta, Fotos, Avisos
├── servicios/
│   ├── api.js           Axios con el token; la dirección del servidor se lee en cada petición
│   ├── config.js        dirección del servidor guardada en el teléfono
│   ├── registros.js     registros simples: se envían o van a la cola
│   ├── borradores.js    evaluaciones guardadas en el teléfono
│   ├── envio.js         crea la evaluación y sube sus fotos una por una, anotando el avance
│   ├── fotosLocales.js  fotos en IndexedDB
│   ├── camara.js        cámara de Capacitor, foto reducida para que pese menos de 800 KB
│   ├── catalogos.js     indicadores de bienestar y rasgos de lineal guardados para usar sin red
│   └── calculos.js      los mismos cálculos del backend, para mostrar el resultado sin red
└── hooks/               conectividad, sincronización, escáner, borrador, botón atrás
```

El diseño sigue las guías de interfaz de Apple. Los colores, la tipografía y las decisiones están en `DISENO.md`.

## Límites conocidos

- El nginx del servidor rechaza subidas de más de 1 MB (error 413). La app reduce cada foto por debajo de 800 KB. Para aceptar fotos más grandes, también desde la web, hay que subir `client_max_body_size` en nginx.
- La conexión con el servidor es http sin cifrar. Para uso real conviene ponerle un dominio con https.
- La cola y los borradores están en `localStorage` y las fotos en IndexedDB. Si se borran los datos de la app antes de enviar, se pierden.
- Si la app se cierra justo mientras el servidor está creando una evaluación, al reintentar puede quedar duplicada. Se borra desde la web.
- El APK es de depuración y no está firmado para publicarse en una tienda.
