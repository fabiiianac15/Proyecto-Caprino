# 📇 ÍNDICE COMPLETO - Proyecto Caprino

## 📋 Este archivo te dice DÓNDE está todo

---

## 🚀 EMPEZAR RÁPIDO

**Lee primero**: [`00-DOCS-CONFIGURACION/GUIA-RAPIDA.md`](../00-DOCS-CONFIGURACION/GUIA-RAPIDA.md)
- ✅ Cómo instalar
- ✅ Cómo ejecutar
- ✅ Solucionar problemas comunes

---

## 📂 ESTRUCTURA DE CARPETAS

### `00-SCRIPTS-INSTALACION/`
Scripts **ejecutables** en orden numérico

```
01-VERIFICAR-REQUISITOS.bat    ← Empieza aquí
02-CONFIGURAR-ORACLE-ENV.bat
03-INSTALAR-OCI8.ps1
04-INSTALAR-DEPENDENCIAS-BACKEND.bat
05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
06-INICIAR-ORACLE.ps1
07-INICIAR-BACKEND.bat         ← Para trabajar diariamente
08-INICIAR-FRONTEND.bat        ← Para trabajar diariamente
logs/                          ← Historial de ejecuciones
README.md                      ← Instrucciones detalladas
```

**¿Qué hacer?**:
- PRIMERA VEZ: Ejecuta 01 a 06 en orden
- CADA DÍA: Ejecuta 06, 07, 08

---

### `00-DOCS-CONFIGURACION/`
Documentación técnica y solución de problemas

```
GUIA-RAPIDA.md                         ← 👈 Leer primero
 - Instrucciones paso a paso
 - Troubleshooting rápido
 - URLs y puertos

CONFIGURACION-COMPLETA.md             ← Detalles técnicos
 - Arquitectura del sistema
 - Requisitos
 - Estructura de base de datos
 - Endpoints API
 - JWT tokens

PROBLEMA-GET-VS-POST.md               ← Investigación
 - Estado del problema POST/GET
 - Hipótesis
 - Timeline
 - Próximas acciones

SOLUCION-RAPIDA-GET-VS-POST.md       ← Para resolver
 - Solución inmediata
 - Verificar que funciona
 - Alternativas

README.md                             ← Este archivo
```

---

### `backend-symfony/`
Código del servidor PHP

```
public/api.php                 ← API principal (336 líneas)
  GET /api/health
  POST /api/auth/register
  POST /api/auth/login
  POST /api/animales
  GET /api/animales
  GET /api/razas

.env                            ← Configuración de base datos
  DATABASE_HOST = 127.0.0.1
  DATABASE_PORT = 1521
  DATABASE_NAME = XEPDB1
  DATABASE_USER = C##caprino

composer.json                   ← Dependencias PHP
vendor/                         ← Librerías PHP (generado)
```

---

### `frontend-web/`
Código del navegador React

```
src/
  App.jsx                      ← Componente principal
  contextos/
    AuthContext.jsx            ← Autenticación JWT
  componentes/
    LoginRegistro.jsx          ← Formulario login/registro ← AQUÍ ESTÁ EL PROBLEMA
    Dashboard.jsx
    ListaAnimales.jsx
    ModuloProduccion.jsx
    ModuloReproduccion.jsx
    ModuloSalud.jsx
    ...otros módulos

vite.config.js                 ← Configuración Vite
package.json                   ← Dependencias npm
node_modules/                  ← Librerías JavaScript (generado)
```

---

### `base-de-datos/`
Scripts SQL para Oracle

```
esquemas/
  01-tablas-principales.sql    ← Crea tablas USUARIO, ANIMAL, etc.
  02-datos-iniciales-razas.sql ← Inserta razas
  03-datos-iniciales-usuarios.sql

procedimientos/
  01-triggers-y-funciones.sql  ← Triggers y funciones Oracle

vistas/
  01-vistas-reportes.sql       ← Vistas para reportes
```

---

## 🔗 REFERENCIAS CRUZADAS

### Si quieres...

**Instalar por primera vez**
→ `00-SCRIPTS-INSTALACION/` inicio con `01-VERIFICAR-REQUISITOS.bat`

**Iniciar los servidores diariamente**
→ Ejecuta `07-INICIAR-BACKEND.bat` + `08-INICIAR-FRONTEND.bat`

**Entender la arquitectura**
→ `00-DOCS-CONFIGURACION/CONFIGURACION-COMPLETA.md`

**Resolver error de registro**
→ `00-DOCS-CONFIGURACION/SOLUCION-RAPIDA-GET-VS-POST.md`

**Saber qué endpoints tiene el API**
→ `backend-symfony/public/api.php` (líneas 95-430)

**Ver formulario de login/registro**
→ `frontend-web/src/componentes/LoginRegistro.jsx`

**Entender autenticación JWT**
→ `frontend-web/src/contextos/AuthContext.jsx`

---

## 📊 ESTADO DEL PROYECTO

### ✅ Completado
- [x] Base de datos Oracle
- [x] Backend PHP con API
- [x] Frontend React
- [x] Autenticación JWT
- [x] Endpoints principales
- [x] Scripts de instalación
- [x] Documentación

### 🔴 Bloqueador Actual
- [ ] **Registro de usuarios no funciona** (problema POST/GET en navegador)
  - Backend: ✅ funciona
  - Frontend: ❌ envía GET en lugar de POST
  - Causa probable: Brave Browser bloqueando POST

### ⏳ Por Hacer
- [ ] Resolver problema POST/GET
- [ ] Implementar otros módulos (peso, producción, reproducción)
- [ ] Agregar validaciones avanzadas
- [ ] Mejorar seguridad
- [ ] Desplegar a producción

---

## 🎯 MAPA DE NAVEGACIÓN

```
┌─ Instalación
│  ├─ 01. Verificar requisitos
│  ├─ 02. Configurar Oracle
│  ├─ 03. Instalar OCI8
│  ├─ 04. Backend (Composer)
│  ├─ 05. Frontend (npm)
│  ├─ 06. Iniciar Oracle
│  └─ ✅ Instalación completa
│
├─ Desarrollo Diario
│  ├─ 07. Iniciar Backend (Terminal 1)
│  ├─ 08. Iniciar Frontend (Terminal 2)
│  ├─ Navegador: http://localhost:5173/
│  └─ Código en: frontend-web/src/ + backend-symfony/public/
│
├─ Problemas
│  ├─ Registro no funciona?
│  │  └─ Lee: SOLUCION-RAPIDA-GET-VS-POST.md
│  ├─ Oracle no conecta?
│  │  └─ Ejecuta: 06-INICIAR-ORACLE.ps1
│  ├─ npm error?
│  │  └─ Ejecuta: 05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
│  └─ Otros problemas?
│     └─ Ve a: CONFIGURACION-COMPLETA.md
│
└─ Documentación Técnica
   ├─ Arquitectura → CONFIGURACION-COMPLETA.md
   ├─ API endpoints → backend-symfony/public/api.php
   ├─ Autenticación → frontend-web/src/contextos/AuthContext.jsx
   └─ Base de datos → base-de-datos/esquemas/
```

---

## 🔑 CREDENCIALES IMPORTANTES

### Base de Datos Oracle
```
Usuario: C##caprino
Contraseña: CaprinoPass2025
Host: 127.0.0.1:1521/XEPDB1
```

### Frontend
```
URL: http://localhost:5173/
Reset: F5 o CTRL+R
DevTools: F12
```

### Backend
```
URL: http://localhost:8000
API: http://localhost:8000/api/health
Logs: 00-SCRIPTS-INSTALACION/logs/
```

---

## ⏱️ DURACIÓN ESTIMADA

| Tarea | Tiempo |
|-------|--------|
| Lectura de GUIA-RAPIDA.md | 5 min |
| Instalación (scripts 01-06) | 25 min |
| Verificación (Health check) | 2 min |
| Resolver problema GET/POST | 5-10 min |
| Prueba completa | 5 min |
| **TOTAL** | ~45-60 min |

---

## 📞 ARCHIVOS CRÍTICOS

Si algo falla, revisa estos archivos:

1. **backend-symfony/public/api.php** → Motor del API
2. **frontend-web/src/App.jsx** → Rutas del frontend
3. **frontend-web/src/contextos/AuthContext.jsx** → Tokens JWT
4. **.env** → Configuración de base de datos
5. **00-DOCS-CONFIGURACION/PROBLEMA-GET-VS-POST.md** → Investigación actual

---

## ✨ SIGUIENTE PASO

**Abre ahora**: [`00-DOCS-CONFIGURACION/GUIA-RAPIDA.md`](../00-DOCS-CONFIGURACION/GUIA-RAPIDA.md)

---

**Documentación actualizada**: 10 de abril de 2026
**Versión**: 2.0 (después de reescribir api.php)
