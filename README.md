# GRANME — Sistema de Gestión Caprina

**GRANME** es un sistema web integral para la gestión zootécnica de hatos caprinos.
Cubre el ciclo completo del animal —registro, genealogía, reproducción, salud,
producción de leche, pesajes, corrales, auditoría y notificaciones— y suma una
capa de **Inteligencia Artificial** que evalúa la compatibilidad de cruces y la
explica en lenguaje natural.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + Recharts |
| Backend | Symfony 6.4 LTS + Doctrine DBAL |
| Autenticación | LexikJWT (HS256) |
| Base de datos | Oracle Autonomous Database `DBCaprino` (cloud, wallet TNS) |
| Microservicio ML | FastAPI + scikit-learn (RandomForest) · Python 3.11 |
| IA generativa | Ollama (LLM local `qwen2.5:3b-instruct`) en streaming |
| Orquestación IA | Docker Compose (`docker-compose.ia.yml`) |
| App móvil | Capacitor (en desarrollo) |

---

## Arquitectura

```
┌──────────────┐   HTTPS/JWT   ┌────────────────────┐   wallet TNS   ┌──────────────────────┐
│  Frontend    │ ────────────► │  Backend Symfony   │ ─────────────► │  Oracle Autonomous   │
│  React (SPA) │ ◄──────────── │  API REST (8000)   │ ◄───────────── │  DBCaprino           │
└──────────────┘   JSON/stream └─────────┬──────────┘                └──────────────────────┘
                                         │  HTTP (ML_SERVICE_URL)
                                         ▼
                              ┌────────────────────┐   HTTP   ┌─────────────────────┐
                              │  ml-service (8001) │ ───────► │  Ollama (11434)     │
                              │  FastAPI + sklearn │ ◄─────── │  qwen2.5:3b (LLM)   │
                              └────────────────────┘  stream  └─────────────────────┘
```

- El **backend** recolecta los datos reales de las cabras (producción, salud,
  reproducción, pedigrí, raza, pesaje) y los envía al microservicio ML.
- El **ml-service** evalúa el cruce con un modelo `RandomForest` y un motor
  multidimensional fundamentado (`evaluador.py`); cada dimensión incluye su
  evidencia y nivel de confianza.
- La **IA generativa local** (Ollama) interpreta ese resultado y redacta un
  análisis profesional token a token. La IA **no** calcula ni inventa: solo
  reescribe los hechos que produce el modelo.

> Detalle completo en [`ml-service/IA-GENERATIVA.md`](ml-service/IA-GENERATIVA.md).

---

## Módulos Implementados

- **Animales** — CRUD con fotos, doble chapeta (vieja/nueva), filtros avanzados y expediente individual
- **Genealogía** — Árbol genealógico **horizontal** (padre arriba, madre abajo) de 3 generaciones, con vinculación de progenitores y abuelos
- **Compatibilidad de cruces (IA)** — Evaluación ML multidimensional + análisis narrativo generado por IA local; ranking del "mejor cruce"
- **Reproducción y Montas** — Ciclos reproductivos, servicios, partos y trazabilidad de las crías nacidas en cada parto
- **Salud** — Vacunas, tratamientos, enfermedades y control **FAMACHA** (parasitismo)
- **Producción de Leche** — Registros por ordeño con indicadores físico-químicos
- **Pesajes** — Control de peso periódico con tendencias
- **Corrales** — Gestión de corrales y asignación de animales
- **Reportes** — Fichas por categoría (producción, salud, auditoría, financiero…)
- **Notificaciones** — Centro de alertas por prioridad
- **Auditoría** — Trazabilidad de acciones del sistema
- **Perfil de usuario** — Edición de datos y cambio de contraseña

---

## Requisitos Previos

- **PHP 8.1+** con extensión `oci8`
- **Composer 2+**
- **Node.js 18+** y npm
- **Oracle Instant Client** (para la extensión OCI8)
- **Wallet TNS** de Oracle Autonomous Database (carpeta `~/Caprino-Wallet`)
- **Python 3.11+** *(solo para el microservicio ML)*
- **Docker + Docker Compose** *(recomendado para la capa de IA: ml-service + Ollama)*

---

## Instalación

### Linux (recomendado)

```bash
cd 01-SCRIPTS-LINUX/

# Primera instalación completa (instala PHP, Node, OCI8, Composer, etc.)
bash 00-INSTALACION-COMPLETA.sh

# O paso a paso:
bash 01-VERIFICAR-REQUISITOS.sh
bash 02-INSTALAR-INSTANT-CLIENT.sh
bash 03-INSTALAR-OCI8.sh
bash 03b-INSTALAR-COMPOSER.sh
bash 04-INSTALAR-DEPENDENCIAS-BACKEND.sh
bash 05-INSTALAR-DEPENDENCIAS-FRONTEND.sh
```

### Windows

Abre PowerShell como administrador:

```powershell
cd 00-SCRIPTS-INSTALACION\

# Instalación automática completa
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
```

El script instala: Visual C++ Runtime, PHP 8.2, Node.js, Composer, extensión OCI8, y todas las dependencias del proyecto.

### Manual

```bash
# Backend
cd backend-symfony
composer install
cp .env .env.local   # ajusta credenciales Oracle, JWT_SECRET y ML_SERVICE_URL

# Frontend
cd frontend-web
npm install
```

---

## Variables de Entorno

Archivo `backend-symfony/.env.local`:

```dotenv
DATABASE_TNS_NAME=dbcaprino_high          # alias del tnsnames.ora del wallet
DATABASE_USER=caprino_user
DATABASE_PASSWORD=tu_password
DATABASE_WALLET_PATH=/ruta/a/Caprino-Wallet
JWT_SECRET=clave_secreta_larga
APP_TIMEZONE=America/Bogota
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
ML_SERVICE_URL=http://localhost:8001      # microservicio de IA (genealogía)
```

El microservicio ML lee su configuración por variables de entorno:

```dotenv
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b-instruct
OLLAMA_TIMEOUT=120
```

---

## Ejecución en Desarrollo

### Backend + Frontend (Linux)

```bash
# Terminal 1 — Backend (puerto 8000)
bash 01-SCRIPTS-LINUX/07-INICIAR-BACKEND.sh

# Terminal 2 — Frontend (puerto 5173)
bash 01-SCRIPTS-LINUX/08-INICIAR-FRONTEND.sh
```

### Backend + Frontend (manual)

```bash
# Backend
cd backend-symfony && php -S localhost:8000 -t public/

# Frontend
cd frontend-web && npm run dev
```

### Capa de IA (microservicio ML + Ollama)

La forma recomendada es Docker Compose. El stack de IA es independiente de Oracle
y de Symfony:

```bash
# Levantar ml-service (8001) + Ollama (11434)
docker compose -f docker-compose.ia.yml up -d

# Descargar el modelo LLM la primera vez
docker compose -f docker-compose.ia.yml exec ollama ollama pull qwen2.5:3b-instruct
```

Alternativa sin Docker (solo el microservicio ML):

```bash
cd ml-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

**Acceso:**
- Frontend: http://localhost:5173
- API: http://localhost:8000/api
- Microservicio ML: http://localhost:8001 (`/ml/health`)

**Credenciales de prueba:**
- Email: `admin@caprino.com`
- Contraseña: `Admin123!`

---

## Estructura del Proyecto

```
Proyecto-Caprino/
│
├── backend-symfony/              # API REST — Symfony 6.4 (Doctrine DBAL + JWT)
│   ├── src/
│   │   ├── Controller/           # Endpoints (un controller por módulo)
│   │   ├── Security/             # JWT authenticator
│   │   └── Service/              # Lógica de negocio (MlService, Auditoría…)
│   ├── config/packages/          # lexik_jwt.yaml, security.yaml, cors…
│   ├── public/uploads/animales/  # Fotos de animales
│   └── .env                      # Variables de entorno
│
├── frontend-web/                 # SPA — React 18 + Vite
│   └── src/
│       ├── componentes/          # Todos los módulos visuales
│       ├── servicios/            # Clientes Axios por módulo
│       ├── contextos/            # AuthContext (sesión JWT)
│       └── utilidades/           # Validaciones, helpers
│
├── ml-service/                   # Microservicio de IA — FastAPI + scikit-learn
│   ├── main.py                   # API FastAPI (endpoints /ml/*)
│   ├── modelo.py                 # Entrenamiento/carga del RandomForest
│   ├── evaluador.py              # Motor de evaluación multidimensional
│   ├── ia_generativa.py          # Cliente Ollama (narrativa en streaming)
│   ├── data_generator.py         # Generación de datos de entrenamiento
│   ├── Dockerfile · start.sh
│   └── IA-GENERATIVA.md          # Documentación de la capa de IA
│
├── aplicacion-movil/             # App Capacitor (en desarrollo)
│
├── base-de-datos/
│   ├── esquemas/                 # DDL de tablas Oracle (incluye parches 04-07)
│   ├── procedimientos/           # Triggers y funciones PL/SQL
│   └── vistas/                   # Vistas para reportes
│
├── 01-SCRIPTS-LINUX/             # Scripts de instalación Linux/macOS
├── 00-SCRIPTS-INSTALACION/       # Scripts de instalación Windows (PowerShell)
├── 00-DOCS-CONFIGURACION/        # Documentación técnica detallada
├── documentacion/                # Arquitectura y reglas de negocio
│
├── docker-compose.ia.yml         # Stack de IA: ml-service + Ollama
├── INICIO-RAPIDO.md              # Guía resumida de puesta en marcha
└── README.md                     # Este archivo
```

---

## Endpoints de la API

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión → devuelve JWT |
| `POST` | `/api/auth/register` | Registrar nuevo usuario |
| `GET`  | `/api/me` | Datos del usuario autenticado |

### Animales
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`    | `/api/animales` | Listar (acepta filtros por query) |
| `POST`   | `/api/animales` | Crear con foto |
| `PUT`    | `/api/animales/{id}` | Actualizar |
| `DELETE` | `/api/animales/{id}` | Eliminar |

### Genealogía e IA
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/genealogia/{id}` | Padres del animal |
| `POST` | `/api/genealogia` | Vincular/actualizar progenitores |
| `POST` | `/api/genealogia/compatibilidad` | Evaluación ML del cruce (score + dimensiones) |
| `POST` | `/api/genealogia/analisis-ia` | Análisis narrativo IA (streaming) |
| `POST` | `/api/genealogia/ranking` | Ranking del mejor cruce |
| `POST` | `/api/genealogia/ranking/analisis-ia` | Análisis IA del ranking (streaming) |

### Módulos Productivos y de Manejo
| Módulo | Prefijo |
|--------|---------|
| Salud | `/api/salud` |
| FAMACHA | `/api/famacha` |
| Producción | `/api/produccion` |
| Pesaje | `/api/pesaje` |
| Reproducción | `/api/reproduccion` |
| Corrales | `/api/corrales` |
| Notificaciones | `/api/notificaciones` |
| Auditoría | `/api/auditoria` |
| Reportes | `/api/reportes` |
| Perfil | `/api/perfil` |
| Razas | `/api/razas` |

> Todos los endpoints (salvo login y register) requieren el header:
> `Authorization: Bearer <token>`

### Microservicio ML (interno, puerto 8001)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/ml/health` · `/ml/ia-health` | Estado del modelo y de Ollama |
| `POST` | `/ml/evaluar` · `/ml/evaluar-batch` | Evaluación multidimensional del cruce |
| `POST` | `/ml/compatibilidad` · `/ml/compatibilidad-batch` | Predicción del RandomForest |
| `POST` | `/ml/analisis-ia` · `/ml/analisis-ranking` | Narrativa generada por la IA (streaming) |
| `POST` | `/ml/train` | Reentrenar el modelo |

---

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `administrador_granja` | Acceso completo: CRUD, auditoría, reportes, gestión de usuarios |
| `pasante` | Lectura y registro de datos productivos; sin acceso a auditoría ni eliminación |

---

## Base de Datos

La base de datos `DBCaprino` corre en **Oracle Autonomous Database** (nube). Los
esquemas y parches están en `base-de-datos/esquemas/` y deben ejecutarse como
`caprino_user` en orden:

| Script | Contenido |
|--------|-----------|
| `01-tablas-principales.sql` | Tablas núcleo (ANIMAL, RAZA, REPRODUCCION, SALUD…) |
| `02-datos-iniciales-razas.sql` | Catálogo de razas |
| `03/04-*usuarios / perfil` | Usuarios y perfil |
| `05-tabla-famacha.sql` | Control FAMACHA |
| `06-parche-columnas-faltantes.sql` | Correcciones de auditoría y perfil |
| `07-reformas-granja.sql` | Doble chapeta, corrales, trazabilidad de crías, razas renombradas (idempotente) |

---

## Troubleshooting

**No se puede conectar a Oracle**
```bash
ls ~/Caprino-Wallet/tnsnames.ora     # el wallet debe estar en la ruta del .env
tnsping dbcaprino_high               # probar conectividad
```

**`Call to undefined function oci_connect()`**
```bash
php -m | grep oci8                    # verificar extensión activa
bash 01-SCRIPTS-LINUX/03-INSTALAR-OCI8.sh   # si falta
```

**Error 401 en la API**
- El token JWT expiró (duración: 1 h). Volver a iniciar sesión.
- Verificar que `JWT_SECRET` sea consistente.

**La genealogía no muestra el análisis de IA**
- Comprobar que el microservicio responda: `curl http://localhost:8001/ml/health`
- Comprobar Ollama: `curl http://localhost:8001/ml/ia-health`
- La primera vez hay que descargar el modelo: `ollama pull qwen2.5:3b-instruct`
- Verificar que `ML_SERVICE_URL` en el backend apunte al microservicio.

**Las fotos no se muestran**
- Verificar permisos de escritura en `backend-symfony/public/uploads/animales/`
- La columna `foto_url` debe ser `VARCHAR2(500)`.

**CORS bloqueado en el navegador**
- El backend solo acepta orígenes `localhost` / `127.0.0.1`.
- Ajustar `CORS_ALLOW_ORIGIN` en `.env` si usas otro host.

---

## Información del Proyecto

- **Nombre**: GRANME — Sistema de Gestión Caprina
- **Institución**: UFPSO — Universidad Francisco de Paula Santander Ocaña
- **Versión**: 2.0.0
- **Última actualización**: Junio 2026
