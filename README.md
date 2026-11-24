# Capriva

Plataforma inteligente que transforma los datos de tu hato en decisiones productivas.

Sistema web para la gestión zootécnica del hato caprino de la Granja Experimental de la UFPSO. Registra cada animal desde su nacimiento (genealogía, reproducción, salud, producción de leche, pesajes, corrales) y suma dos capas de análisis: la evaluación de bienestar animal con la metodología MEBA del ICA y la selección de cruces con genética cuantitativa e inteligencia artificial.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Recharts |
| Backend | Symfony 6.4 LTS con Doctrine DBAL (SQL directo, sin ORM) |
| Autenticación | LexikJWT (HS256, token de 24 h) |
| Base de datos | Oracle Autonomous Database `DBCaprino` en la nube, conexión por wallet TNS |
| Microservicio ML | FastAPI, scikit-learn, SciPy, SHAP (Python 3.11) |
| IA generativa | Ollama, local y en streaming (`qwen2.5:3b-instruct` en desarrollo, `qwen2.5:1.5b-instruct` en el servidor) |
| App móvil | Capacitor 5 + React, Android, con trabajo sin conexión |
| Producción | AWS EC2 (Ubuntu 24.04, nginx, PHP 8.2-FPM) |

## Arquitectura

```
┌──────────────┐  HTTPS/JWT  ┌────────────────────┐  wallet TNS  ┌─────────────────────┐
│  Frontend    │ ──────────► │  Backend Symfony   │ ───────────► │  Oracle Autonomous  │
│  React (SPA) │ ◄────────── │  API REST (8000)   │ ◄─────────── │  DBCaprino          │
└──────────────┘  JSON/texto └─────────┬──────────┘              └─────────────────────┘
                                       │ instantánea del rebaño (7 consultas)
                                       ▼
                            ┌────────────────────┐   HTTP   ┌────────────────────┐
                            │  ml-service (8001) │ ───────► │  Ollama (11434)    │
                            │  genética + modelo │ ◄─────── │  qwen2.5:3b        │
                            └────────────────────┘  stream  └────────────────────┘
```

El backend arma una instantánea de todo el rebaño (pedigrí, producción por lactancia, servicios, salud, condición corporal, FAMACHA y clasificación lineal) y se la envía al microservicio. Ahí se calculan la consanguinidad exacta, los valores genéticos por BLUP y la probabilidad de parto. La IA local solo redacta lo que el motor ya calculó y un validador marca cualquier cifra que no esté en el informe. El detalle está en [`ml-service/IA-GENERATIVA.md`](ml-service/IA-GENERATIVA.md).

## Módulos

- **Mis cabras**: registro con galería de fotos (una principal y carrusel), doble chapeta (nueva y vieja), estado general (activo, vendido, muerto, donado, descartado) y, en hembras, tipo de estado (producción, seca, preñada, cabretona, cabrita). Expediente individual con todo su historial. Las cabras sin nombre se identifican por la chapeta.
- **Genealogía y mejoramiento genético**: árbol horizontal de 4 generaciones editable. Consanguinidad exacta con todo el pedigrí, leche esperada de las hijas por BLUP, probabilidad de parto con un modelo que aprende de la granja, árbol de la futura cría, ranking de la mejor pareja y análisis narrativo con IA.
- **Reproducción**: monta o servicio, diagnóstico de gestación y parto (sencillo, gemelar o trillizo). Cada cría queda registrada como animal con su genealogía y el tipo de estado de la madre se actualiza solo.
- **Salud y FAMACHA**: vacunas, tratamientos, diagnósticos y control de parásitos por color de mucosa.
- **Producción de leche**: registros por ordeño con grasa, proteína y células somáticas.
- **Pesajes**: peso y condición corporal con tendencias.
- **Corrales**: capacidad, tipo (gestantes, ordeño, levante…) y asignación de animales.
- **Bienestar animal**: evaluación MEBA del ICA (v3.0, 2026) por pasos, con los criterios de cada puntaje en pantalla. El tamaño de muestra sale de la tabla del ICA según el grupo de edad, y en los indicadores de muestreo basta escribir cuántos animales se revisaron y cuántos cumplen para que el puntaje salga solo. Incluye RSPP/ASI, documentos del ICA, fotos de evidencia por indicador y borradores.
- **Clasificación lineal**: hembras (17 rasgos del método ADGA, Cedeño et al., 2024) y machos (escala de reproductores, con testículos y sin sistema mamario). Se toman medidas zoométricas con bastón, cinta y compás, o se estiman sobre una foto en la app, y cada medida se compara con el promedio de la raza y el sexo para calificar sola los rasgos medibles. Los demás se califican a la vista con los dibujos del artículo. Guarda fotos de evidencia por vista.
- **Medidas de referencia por raza**: el promedio y la desviación de cada medida para 13 razas, con la fuente de cada valor (publicado, aproximado o ajustado por el docente). Muestra los estudios publicados por edad, los estándares ADGA, ANGBA y CAPRIGRAN, la ficha técnica de cada medida y la bibliografía. Los datos salen de `documentacion/24-11-26 Parametros morfometricos caprinos APP.xlsx`.
- **Reportes**: panel con indicadores del periodo y 17 informes (hato, leche, reproducción, salud, peso, bienestar y clasificación lineal) que se descargan en Excel o PDF.
- **Notificaciones, auditoría y perfil de usuario**.

La web tiene tres tamaños de letra (A, A+ y A++) para leer en el corral o en pantallas pequeñas.

## Requisitos

- PHP 8.1 o superior con la extensión `oci8`
- Composer 2
- Node.js 18 o superior
- Oracle Instant Client y el wallet del Autonomous Database (carpeta `~/Caprino-Wallet` en Linux, `C:\Caprino-Wallet` en Windows)
- Python 3.11 para el microservicio ML
- Ollama, o Docker para levantar la capa de IA con `docker-compose.ia.yml`

## Instalación

Los scripts automatizan todo el proceso. En Linux:

```bash
bash 01-SCRIPTS-LINUX/00-INSTALACION-COMPLETA.sh
```

En Windows, desde PowerShell como administrador:

```powershell
cd 00-SCRIPTS-INSTALACION
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
```

Cada carpeta de scripts tiene su README con el paso a paso. Para instalar a mano:

```bash
cd backend-symfony && composer install
cd ../frontend-web && npm install
cd ../ml-service && python -m venv venv && venv/bin/pip install -r requirements.txt
```

## Base de datos

La base `DBCaprino` vive en Oracle Autonomous Database. El orden completo de los scripts está en `base-de-datos/INSTALAR-BASE-DATOS.sql`. Los parches de `base-de-datos/esquemas/` se ejecutan como `caprino_user`, en orden, y se pueden correr varias veces sin error:

| Script | Contenido |
|--------|-----------|
| `01-tablas-principales.sql` | Tablas núcleo (ANIMAL, RAZA, GENEALOGIA, REPRODUCCION, SALUD…) |
| `02-datos-iniciales-razas.sql` | Catálogo de razas |
| `03` y `04` | Usuarios y perfil |
| `05-tabla-famacha.sql` | Control FAMACHA |
| `06-parche-columnas-faltantes.sql` | Columnas de auditoría y perfil |
| `07-reformas-granja.sql` | Doble chapeta, corrales, trazabilidad de crías, estado "donado" |
| `08-limpieza-entrega.sql` | Opcional: deja la base vacía para una entrega |
| `09-bienestar.sql` | Módulo de bienestar animal (catálogo MEBA) |
| `10-clasificacion-lineal.sql` | Módulo de clasificación lineal |
| `11-estado-productivo-y-raza-alpina.sql` | Tipo de estado de la hembra y raza "Alpina" |
| `12-bienestar-evidencias.sql` | Criterios del ICA, conteos de muestreo, fotos y borradores |
| `13-clasificacion-lineal-guia.sql` | Guía en lenguaje sencillo y puntos por rasgo |
| `14-clasificacion-lineal-medidas.sql` | Catálogo de medidas zoométricas y fotos de la medición |
| `15-cabras-sin-nombre.sql` | Cabras identificadas por la chapeta cuando no tienen nombre |
| `16-medidas-metodo.sql` | Método de cada medida (instrumento o foto) |
| `17-bienestar-muestra-y-documentos-ica.sql` | Muestra por grupo de edad, RSPP/ASI y documentos del ICA |
| `18-lineal-machos-razas-reglas.sql` | Lineal de machos, referencias por raza y reglas morfométricas |
| `19-fotos-animal.sql` | Galería de fotos de cada cabra |
| `20-morfometria-publicada.sql` | Base morfométrica publicada: estudios, estándares, ficha técnica y bibliografía |

El parche 20 lo genera `base-de-datos/herramientas/gen20_morfometria.py` a partir del Excel de parámetros morfométricos. Si el Excel cambia, se vuelve a generar en lugar de editar el `.sql` a mano.

## Configuración

`backend-symfony/.env.local` (no se sube al repositorio):

```dotenv
DATABASE_TNS_NAME=dbcaprino_high          # alias del tnsnames.ora del wallet
DATABASE_USER=caprino_user
DATABASE_PASSWORD=...
DATABASE_WALLET_PATH=/ruta/a/Caprino-Wallet
JWT_SECRET=...                            # cadena aleatoria larga
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
ML_SERVICE_URL=http://localhost:8001
APP_UPLOADS_DIR=/var/www/caprino-uploads  # opcional: fotos fuera del código
```

`ml-service/.env`:

```dotenv
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b-instruct
OLLAMA_TIMEOUT=120
```

El backend necesita la variable `TNS_ADMIN` apuntando al wallet. Los scripts de inicio la configuran; si arrancas PHP a mano y no está definida, el backend se queda esperando al conectar con Oracle.

## Ejecución en desarrollo

Se necesitan cuatro procesos. Con los scripts de Linux:

```bash
bash 01-SCRIPTS-LINUX/07-INICIAR-BACKEND.sh      # http://localhost:8000
bash 01-SCRIPTS-LINUX/08-INICIAR-FRONTEND.sh     # http://localhost:5173
```

La capa de IA se levanta con Docker:

```bash
docker compose -f docker-compose.ia.yml up -d
docker compose -f docker-compose.ia.yml exec ollama ollama pull qwen2.5:3b-instruct   # solo la primera vez
```

O sin Docker:

```bash
ollama serve &
cd ml-service && venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001
```

El servidor integrado de PHP atiende una petición a la vez, y el análisis de la IA puede tardar unos 3 minutos en CPU. Para que las demás pantallas no se bloqueen mientras tanto, arráncalo con varios procesos:

```bash
cd backend-symfony
PHP_CLI_SERVER_WORKERS=4 TNS_ADMIN=~/Caprino-Wallet php -S localhost:8000 -t public
```

## Servidor de producción (AWS)

La web, la API, el microservicio ML y Ollama corren en una instancia EC2 de AWS con nginx y PHP 8.2-FPM. La base sigue en Oracle Autonomous. Los scripts de `01-SCRIPTS-LINUX/aws/` se ejecutan desde el equipo de desarrollo:

```bash
cd 01-SCRIPTS-LINUX/aws
./ejecutar-sql.sh ../../base-de-datos/esquemas/20-morfometria-publicada.sql   # aplica un parche
./desplegar-backend.sh    # sube backend-symfony/src, limpia la caché y recarga PHP
./desplegar-web.sh        # compila frontend-web y lo publica
./desplegar-ml.sh         # sube ml-service y lo reinicia
```

Antes de cada despliegue los scripts dejan un respaldo en el servidor. La llave SSH no está en el repositorio. Las rutas, la configuración de nginx, PHP y systemd, y los costos están en [`01-SCRIPTS-LINUX/aws/README.md`](01-SCRIPTS-LINUX/aws/README.md).

## App móvil

`aplicacion-movil/` es la app Android para trabajar en el corral. Usa la misma API y el mismo usuario de la web, guarda los datos en el teléfono y los envía cuando vuelve la señal. Cubre el rebaño (con lectura del QR de la chapeta), registros rápidos de salud, pesaje, leche y FAMACHA, bienestar animal y clasificación lineal de hembras y machos, con medición sobre la foto. El APK se compila con `./compilar-apk.sh`. El paso a paso está en [`aplicacion-movil/README.md`](aplicacion-movil/README.md).

## Estructura

```
Proyecto-Caprino/
├── backend-symfony/        API REST (Symfony 6.4)
│   └── src/
│       ├── Controller/     un controlador por módulo
│       ├── Service/        lógica compartida (RebanoService, MlService, BienestarService…)
│       └── Doctrine/       conexión a Oracle por alias TNS
├── frontend-web/           SPA en React
│   ├── src/componentes/    módulos de la interfaz (genealogia/ agrupa el módulo de IA)
│   └── public/img/lineal/  dibujos de referencia de la clasificación lineal
├── ml-service/             microservicio de genética e IA (FastAPI)
├── aplicacion-movil/       app Android de campo con Capacitor
├── base-de-datos/          esquemas, parches, vistas y el generador del parche 20
├── documentacion/          reglas de negocio, manual de usuario, PDF de MEBA y del artículo ADGA, Excel morfométrico
├── 00-SCRIPTS-INSTALACION/ instalación en Windows
├── 01-SCRIPTS-LINUX/       instalación en Linux y despliegue en AWS (aws/)
└── docker-compose.ia.yml   ml-service + Ollama
```

## API

Todas las rutas, salvo login y registro, piden el encabezado `Authorization: Bearer <token>`.

| Prefijo | Rutas principales |
|---------|-------------------|
| `/api/auth` | `POST login`, `POST register` |
| `/api/me`, `/api/perfil` | datos del usuario, actualizar perfil y contraseña |
| `/api/animales` | listar (filtros `sexo`, `estado`), detalle, crear, actualizar, dar de baja, galería de fotos (`{id}/fotos`) |
| `/api/genealogia` | padres, vincular, `GET arbol/{id}`, `POST compatibilidad`, `POST analisis-ia`, `POST ranking`, `POST ranking/analisis-ia`, `GET modelo`, `POST modelo/entrenar` |
| `/api/reproduccion` | listar, servicio, `POST {id}/parto`, actualizar (diagnóstico) |
| `/api/salud`, `/api/famacha` | registros sanitarios y FAMACHA |
| `/api/produccion`, `/api/pesaje` | producción de leche y pesajes |
| `/api/corrales` | CRUD de corrales |
| `/api/bienestar` | catálogo, sugerencias, evaluaciones (crear, editar, borrar) y fotos |
| `/api/clasificacion-lineal` | catálogo por sexo, `medidas/catalogo`, `referencias` (leer y guardar), `morfometria` (base publicada), evaluaciones y fotos |
| `/api/reportes` | resumen, panel del periodo e informes con estructura común (`/informe/{clave}`) |
| `/api/notificaciones`, `/api/auditoria`, `/api/razas`, `/api/health` | |

## Roles

La tabla `USUARIO` admite cuatro roles: `administrador`, `zootecnista`, `veterinario` y `tecnico`. En el registro la web ofrece "Pasante", que por ahora se guarda como `tecnico`. Solo los tres primeros roles pueden reentrenar el modelo de predicción de partos y cambiar las medidas de referencia por raza. Los permisos del rol pasante se van a revisar (ver Pendiente).

## Solución de problemas

**El backend no responde o tarda indefinidamente.** Falta `TNS_ADMIN`. Verifica que apunte a la carpeta del wallet y que exista `tnsnames.ora`.

**`Call to undefined function oci_connect()`.** La extensión no está cargada: `php -m | grep oci8`. Si no aparece, ejecuta `03-INSTALAR-OCI8`.

**Error 401.** El token venció (dura 24 h) o cambió `JWT_SECRET`. Vuelve a iniciar sesión.

**La genealogía dice que el servicio de IA no está encendido.** Comprueba `curl http://localhost:8001/ml/health` y `curl http://localhost:8001/ml/ia-health`, y que `ML_SERVICE_URL` del backend apunte al microservicio.

**Cambios en el código PHP que no se notan.** Con `opcache.revalidate_freq` alto, PHP guarda el código hasta 3 minutos. Reinicia el servidor.

**No se ven las fotos.** La carpeta de subidas (`var/uploads` o `APP_UPLOADS_DIR`) y `public/uploads/animales/` deben tener permisos de escritura.

## Pendiente

- Cambiar las contraseñas por defecto del usuario de Oracle y de las cuentas iniciales antes de entregar.
- Programar respaldos de la base (Data Pump o los respaldos automáticos del Autonomous Database).
- Crear el rol pasante en el backend y definir sus permisos (agregar y modificar datos, sin eliminar), y revisar qué roles se pueden elegir al registrarse.
- Llevar a la app móvil la base morfométrica publicada (estudios por edad, estándares, ficha técnica y bibliografía).
- Reentrenar el modelo de partos cuando se acumulen servicios nuevos: el botón está en la portada de Genealogía.

## Información del proyecto

- **Institución**: Universidad Francisco de Paula Santander Ocaña (UFPSO)
- **Versión**: 3.3.0
- **Última actualización**: noviembre de 2026
