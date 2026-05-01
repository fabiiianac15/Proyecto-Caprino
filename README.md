# Sistema de Gestión Zootécnica Caprina

Sistema web integral para la gestión de hatos caprinos. Cubre el ciclo completo del animal: registro, genealogía, reproducción, salud, producción de leche, pesajes, auditoría y notificaciones.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Backend | Symfony 6.4 LTS + Doctrine ORM |
| Autenticación | LexikJWT (HS256) |
| Base de datos | Oracle Autonomous Database (cloud, wallet TNS) |
| Gráficas | Recharts |
| App móvil | Capacitor (en desarrollo) |

---

## Módulos Implementados

- **Animales** — CRUD completo con fotos y filtros avanzados
- **Reproducción y Montas** — Ciclos reproductivos, servicios y partos
- **Salud** — Vacunas, tratamientos y enfermedades
- **Producción de Leche** — Registros por ordeño con indicadores físico-químicos
- **Pesajes** — Control de peso periódico con tendencias
- **Genealogía** — Árbol genealógico por animal
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
cp .env .env.local   # ajusta credenciales Oracle y JWT_SECRET

# Frontend
cd frontend-web
npm install
```

---

## Variables de Entorno

Archivo `backend-symfony/.env.local`:

```dotenv
DATABASE_TNS_NAME=caprinodb_high          # nombre de servicio en tnsnames.ora
DATABASE_USER=caprino_user
DATABASE_PASSWORD=tu_password
DATABASE_WALLET_PATH=/ruta/a/Caprino-Wallet
JWT_SECRET=clave_secreta_larga
APP_TIMEZONE=America/Bogota
```

---

## Ejecución en Desarrollo

### Linux

```bash
# Terminal 1 — Backend (puerto 8000)
bash 01-SCRIPTS-LINUX/07-INICIAR-BACKEND.sh

# Terminal 2 — Frontend (puerto 5173)
bash 01-SCRIPTS-LINUX/08-INICIAR-FRONTEND.sh
```

### Manual

```bash
# Backend
cd backend-symfony
php -S localhost:8000 -t public/

# Frontend
cd frontend-web
npm run dev
```

**Acceso:**
- Frontend: http://localhost:5173
- API: http://localhost:8000/api

**Credenciales de prueba:**
- Email: `admin@caprino.com`
- Contraseña: `Admin123!`

---

## Estructura del Proyecto

```
Proyecto-Caprino/
│
├── backend-symfony/              # API REST — Symfony 6.4
│   ├── src/
│   │   ├── Controller/           # Endpoints (un controller por módulo)
│   │   ├── Security/             # JWT authenticator
│   │   └── Service/              # Lógica de negocio (auditoría, etc.)
│   ├── config/
│   │   └── packages/
│   │       ├── lexik_jwt.yaml    # Configuración JWT
│   │       └── security.yaml     # Firewall y roles
│   ├── public/
│   │   └── uploads/animales/     # Fotos de animales
│   └── .env                      # Variables de entorno
│
├── frontend-web/                 # SPA — React 18 + Vite
│   └── src/
│       ├── componentes/          # Todos los módulos visuales
│       ├── servicios/            # Clientes Axios por módulo
│       ├── contextos/            # AuthContext (sesión JWT)
│       └── utilidades/           # Validaciones, helpers
│
├── aplicacion-movil/             # App Capacitor (en desarrollo)
│
├── base-de-datos/
│   ├── esquemas/                 # DDL de tablas Oracle
│   ├── procedimientos/           # Triggers y funciones PL/SQL
│   └── vistas/                   # Vistas para reportes
│
├── 01-SCRIPTS-LINUX/             # Scripts de instalación Linux/macOS
├── 00-SCRIPTS-INSTALACION/       # Scripts de instalación Windows (PowerShell)
├── 00-DOCS-CONFIGURACION/        # Documentación técnica detallada
├── documentacion/                # Arquitectura y reglas de negocio
│
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

### Módulos Productivos
| Módulo | Prefijo |
|--------|---------|
| Salud | `/api/salud` |
| Producción | `/api/produccion` |
| Pesajes | `/api/pesajes` |
| Reproducción | `/api/reproduccion` |
| Genealogía | `/api/genealogia` |
| Notificaciones | `/api/notificaciones` |
| Auditoría | `/api/auditoria` |
| Reportes | `/api/reportes` |
| Perfil | `/api/perfil` |
| Razas | `/api/razas` |

> Todos los endpoints (salvo login y register) requieren el header:
> `Authorization: Bearer <token>`

---

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `administrador_granja` | Acceso completo: CRUD, auditoría, reportes, gestión de usuarios |
| `pasante` | Lectura y registro de datos productivos; sin acceso a auditoría ni eliminación |

---

## Troubleshooting

**No se puede conectar a Oracle**
```bash
# Verificar que el wallet esté en la ruta configurada en .env
ls ~/Caprino-Wallet/tnsnames.ora

# Probar conectividad
tnsping caprinodb_high
```

**`Call to undefined function oci_connect()`**
```bash
# Linux: verificar que la extensión esté activa
php -m | grep oci8

# Si falta, ejecutar:
bash 01-SCRIPTS-LINUX/03-INSTALAR-OCI8.sh
```

**Error 401 en la API**
- El token JWT expiró (duración: 1 h). Volver a iniciar sesión.
- Verificar que `JWT_SECRET` en `.env` sea consistente.

**Las fotos no se muestran**
- Verificar permisos de escritura en `backend-symfony/public/uploads/animales/`
- La columna `foto_url` debe ser `VARCHAR2(500)`.

**CORS bloqueado en el navegador**
- El backend solo acepta orígenes `localhost` / `127.0.0.1`.
- Ajustar `CORS_ALLOW_ORIGIN` en `.env` si usas otro host.

---

## Información del Proyecto

- **Institución**: UFPSO — Universidad Francisco de Paula Santander Ocaña
- **Versión**: 1.1.0
- **Última actualización**: Mayo 2026
