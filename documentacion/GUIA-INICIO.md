# Guía de Inicio — Sistema de Gestión Caprina

**Fecha de actualización:** Abril 2026  
**Stack:** React 18 + Vite · PHP 8.2 + OCI8 · Oracle XE 21c

---

## Cómo funciona el sistema

```
[Navegador / React]  →  petición HTTP  →  [PHP api.php]  →  consulta SQL  →  [Oracle XE]
    puerto 5173 (dev)                       puerto 8000                       puerto 1521
```

El sistema tiene tres piezas que deben estar corriendo al mismo tiempo:

| Pieza | Qué hace | Puerto |
|---|---|---|
| Oracle XE | Base de datos (cabras, usuarios, producción…) | 1521 |
| PHP (`api.php`) | Backend REST — recibe peticiones del frontend y consulta Oracle | 8000 |
| Vite (React) | Interfaz de usuario — solo en desarrollo | 5173 |

---

## Requisitos de la máquina

Antes de instalar, la máquina debe tener:

- Windows 10/11 x64
- Oracle XE 21c instalado (el servicio `OracleServiceXE` debe existir)
- Conexión a internet para la primera instalación

---

## Instalación desde cero (primera vez en un equipo nuevo)

Abrir PowerShell **como usuario normal** y ejecutar el script maestro:

```powershell
powershell -ExecutionPolicy Bypass -File "00-SCRIPTS-INSTALACION\00-INSTALACION-COMPLETA.ps1"
```

El script instala y configura en este orden:

| Paso | Script | Qué hace |
|---|---|---|
| 00b | `00b-INSTALAR-VCRUNTIME.ps1` | Visual C++ Runtime (necesario para PHP) |
| 00 | `00-INSTALAR-PHP-COMPATIBLE.ps1` | PHP 8.2 TS x64 en `%LOCALAPPDATA%\Programs\php82` |
| 00c | `00c-INSTALAR-NODE.ps1` | Node.js 24 LTS |
| 01 | `01-VERIFICAR-REQUISITOS.ps1` | Comprueba que todo está listo |
| 02 | `02-CONFIGURAR-ORACLE-ENV.ps1` | Detecta Oracle y configura ORACLE_HOME en el sistema (**se abre ventana de Admin**) |
| 02b | `02b-CREAR-USUARIO-ORACLE.ps1` | Crea el usuario `caprino_user` en Oracle y ejecuta los scripts SQL |
| 03 | `03-INSTALAR-OCI8.ps1` | Descarga e instala la extensión OCI8 para PHP |
| 03b | `03b-INSTALAR-COMPOSER.ps1` | Instala Composer |
| 04 | `04-INSTALAR-DEPENDENCIAS-BACKEND.ps1` | `composer install` en `backend-symfony/` |
| 05 | `05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1` | `npm install` en `frontend-web/` |
| 09 | `09-CONFIGURAR-ENV.ps1` | Genera los archivos `.env` con las variables correctas |

> El paso 02 (Oracle ENV) requiere permisos de Administrador. Se abrirá una ventana elevada automáticamente; espera a que termine antes de continuar.

---

## Iniciar el sistema cada vez que lo uses

Se necesitan **tres terminales** (o ventanas) abiertas en este orden:

### Terminal 1 — Iniciar Oracle (solo si no está corriendo)

```powershell
powershell -ExecutionPolicy Bypass -File "00-SCRIPTS-INSTALACION\06-INICIAR-ORACLE.ps1"
```

> Si el servicio `OracleServiceXE` ya estaba corriendo, este script lo detecta y no hace nada.  
> Si necesita iniciarlo, requiere ser **Administrador**.

### Terminal 2 — Backend PHP

```
doble clic en: 00-SCRIPTS-INSTALACION\07-INICIAR-BACKEND.bat
```

O desde PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "00-SCRIPTS-INSTALACION\07-INICIAR-BACKEND.ps1"
```

El servidor quedará corriendo en `http://localhost:8000`. No cerrar esta ventana.

### Terminal 3 — Frontend React (solo en desarrollo)

```
doble clic en: 00-SCRIPTS-INSTALACION\08-INICIAR-FRONTEND.bat
```

O desde PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "00-SCRIPTS-INSTALACION\08-INICIAR-FRONTEND.ps1"
```

El frontend estará en `http://localhost:5173`. No cerrar esta ventana.

### Abrir el sistema

Abrir Chrome y navegar a: **http://localhost:5173**

---

## Credenciales de acceso

### Sistema (usuarios del frontend)

| Email | Contraseña | Rol |
|---|---|---|
| `admin@caprino.com` | `Admin123!` | Administrador |
| `zootecnista@caprino.com` | `Zoot123!` | Zootecnista |
| `tecnico@caprino.com` | `Tecnico123!` | Técnico |
| `veterinario@caprino.com` | `Vet123!` | Veterinario |

### Base de datos Oracle

| Campo | Valor |
|---|---|
| Usuario app | `caprino_user` |
| Contraseña app | `CaprinoPass2025` |
| Host | `127.0.0.1:1521/XEPDB1` |

Para conectarse con SQL*Plus:

```
sqlplus caprino_user/CaprinoPass2025@127.0.0.1:1521/XEPDB1
```

---

## Módulos disponibles y sus endpoints

| Módulo | Frontend | Endpoint backend |
|---|---|---|
| Login / Registro | `LoginRegistro.jsx` | `POST /api/login`, `POST /api/registro` |
| Animales | `ListaAnimales.jsx`, `RegistroAnimal.jsx` | `GET/POST/PUT/DELETE /api/animales` |
| Producción de leche | `ModuloProduccion.jsx` | `GET/POST/DELETE /api/produccion` |
| Salud y vacunas | `ModuloSalud.jsx` | `GET/POST/DELETE /api/salud` |
| Reproducción | `ModuloReproduccion.jsx` | `GET/POST/PUT /api/reproduccion` |
| Control de peso | `ModuloPeso.jsx` | `GET/POST/DELETE /api/pesaje` |
| Genealogía | `ModuloGenealogia.jsx` | `GET/POST/PUT /api/genealogia/{id}` |
| Notificaciones | `Notificaciones.jsx` | `GET /api/notificaciones` |
| Reportes | `ModuloReportes.jsx` | `GET /api/reportes/resumen`, `GET /api/reportes/produccion` |
| Perfil | `PerfilUsuario.jsx` | `GET /api/me` |

---

## Verificar que el backend funciona

Abrir el navegador y entrar a:

```
http://localhost:8000/api/animales
```

Debe responder JSON con `{"data": [...]}`. Si da error, revisar:

1. ¿Está corriendo Oracle? → `Get-Service OracleServiceXE` en PowerShell
2. ¿Está corriendo PHP? → revisar la Terminal 2
3. ¿OCI8 cargado? → `php -m | findstr oci8` en PowerShell

---

## Estructura de archivos clave

```
Proyecto-Caprino/
├── backend-symfony/
│   ├── public/
│   │   └── api.php          ← TODO el backend en un solo archivo (v3.0)
│   └── .env                 ← Configuración de BD y JWT_SECRET
├── frontend-web/
│   ├── src/
│   │   ├── componentes/     ← Todos los módulos React (.jsx)
│   │   ├── contextos/
│   │   │   └── AuthContext.jsx   ← Manejo de sesión JWT
│   │   └── servicios/
│   │       └── api.js       ← Cliente HTTP hacia el backend
│   └── .env                 ← VITE_API_URL=http://localhost:8000/api
├── base-de-datos/
│   └── esquemas/
│       ├── 01-tablas-principales.sql    ← Todas las tablas
│       ├── 02-datos-iniciales-razas.sql ← Razas caprinas
│       └── 03-datos-iniciales-usuarios.sql ← 4 usuarios con hashes bcrypt reales
└── 00-SCRIPTS-INSTALACION/  ← Scripts PowerShell de instalación
```

---

## Solución rápida de problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `OCI8 no cargado` en php -m | ORACLE_HOME no está en PATH | Abrir nueva terminal o ejecutar 02-CONFIGURAR-ORACLE-ENV.ps1 de nuevo |
| Login da "credenciales incorrectas" | Hashes bcrypt del SQL no válidos | Verificar que se ejecutó `03-datos-iniciales-usuarios.sql` (no el obsoleto `05-usuarios-iniciales.sql`) |
| Frontend no conecta al backend | URL incorrecta o backend parado | Revisar que `VITE_API_URL=http://localhost:8000/api` en `frontend-web/.env` y que PHP está corriendo |
| `ORA-01950` al insertar | Sin cuota en tablespace | Ejecutar `GRANT UNLIMITED TABLESPACE TO caprino_user` como SYS |
| Puerto 8000 ocupado | Otro proceso usa el puerto | `netstat -an | findstr 8000` para identificarlo y cerrarlo |
| Sesión se cierra al recargar | Endpoint `/api/me` fallando | Verificar que api.php v3.0 está en uso (tiene el endpoint `/api/me`) |
