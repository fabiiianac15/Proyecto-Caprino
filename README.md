# 🐐 Sistema de Gestión Caprino

Sistema web completo para la gestión integral de hatos caprinos, incluyendo registro de animales, genealogía, producción de leche, reproducción, salud y reportes.

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: PHP 8.2 + API Simple (sin Symfony)
- **Base de datos**: Oracle Database 21c Express Edition
- **Servidor**: PHP Built-in Server (puerto 8000)

---

## 📚 DOCUMENTACIÓN Y SCRIPTS

**TODO está organizado en 2 carpetas principales:**

### 1. 📁 `00-SCRIPTS-INSTALACION/`
Scripts ejecutables en **orden numérico**:
```
01-VERIFICAR-REQUISITOS.bat    ← Comienza aquí
02-CONFIGURAR-ORACLE-ENV.bat
03-INSTALAR-OCI8.ps1
04-INSTALAR-DEPENDENCIAS-BACKEND.bat
05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
06-INICIAR-ORACLE.ps1
07-INICIAR-BACKEND.bat         ← Para trabajar diariamente
08-INICIAR-FRONTEND.bat        ← Para trabajar diariamente
```

### 2. 📁 `00-DOCS-CONFIGURACION/`
Documentación técnica:
- **GUIA-RAPIDA.md** ← **Lee esto primero** ⭐
- CONFIGURACION-COMPLETA.md (detalles técnicos)
- PROBLEMA-GET-VS-POST.md (investigación del bug)
- SOLUCION-RAPIDA-GET-VS-POST.md (soluciones)

---

## ⚡ INICIO RÁPIDO

### 📖 Lee primero:
```
📂 00-DOCS-CONFIGURACION/ → GUIA-RAPIDA.md
```

### 🚀 Flujo de instalación (PRIMERA VEZ):
```powershell
# Abre Explorer
C:\Users\USUARIO\Downloads\Proyecto-Caprino\00-SCRIPTS-INSTALACION\

# Ejecuta en orden:
1. 01-VERIFICAR-REQUISITOS.bat
2. 02-CONFIGURAR-ORACLE-ENV.bat (Como Administrador)
3. 03-INSTALAR-OCI8.ps1
4. 04-INSTALAR-DEPENDENCIAS-BACKEND.bat
5. 05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
6. 06-INICIAR-ORACLE.ps1 (Como Administrador)
```

### 💻 Desarrollo DIARIO:
```powershell
# Terminal 1: Backend
07-INICIAR-BACKEND.bat

# Terminal 2: Frontend (en NUEVA terminal)
08-INICIAR-FRONTEND.bat

# Navegador:
http://localhost:5173/
```

---

## 📋 Requisitos Previos

- **PHP 8.2+** (con extensión OCI8 para Oracle)
- **Composer** (gestor de dependencias PHP)
- **Node.js 18+** y npm
- **Oracle 21c XE** (Express Edition)

---
---

## 🆘 Problemas Comunes

### "El registro no funciona (GET vs POST)"
Lee: `00-DOCS-CONFIGURACION/SOLUCION-RAPIDA-GET-VS-POST.md`

### "No puedo conectar a Oracle"
Ejecuta: `00-SCRIPTS-INSTALACION/06-INICIAR-ORACLE.ps1`

### Otros problemas
Ve a: `00-DOCS-CONFIGURACION/CONFIGURACION-COMPLETA.md`

---

## 📊 Contenido del Proyecto

```
Proyecto-Caprino/
├── 00-SCRIPTS-INSTALACION/      ← Scripts ejecutables
│   ├── 01-08 *.bat/*.ps1        ← En orden numérico
│   └── README.md
│
├── 00-DOCS-CONFIGURACION/       ← Documentación
│   ├── GUIA-RAPIDA.md           ← ⭐ Lee primero
│   ├── CONFIGURACION-COMPLETA.md
│   └── ...más documentación
│
├── backend-symfony/              ← Backend PHP
│   └── public/api.php           ← API principal
│
├── frontend-web/                ← Frontend React
│   └── src/                     ← Código del navegador
│
├── base-de-datos/               ← Scripts SQL
│
└── README.md                    ← Este archivo
```

---

## 🔗 Enlaces Importantes

- **Inicio**: `00-DOCS-CONFIGURACION/GUIA-RAPIDA.md`
- **Scripts**: `00-SCRIPTS-INSTALACION/README.md`
- **Técnico**: `00-DOCS-CONFIGURACION/CONFIGURACION-COMPLETA.md`
- **API**: `backend-symfony/public/api.php`

---

## ✅ Verificar Que Funciona

1. **Backend**: http://localhost:8000/api/health
2. **Frontend**: http://localhost:5173/
3. **Base de datos**: Conecta correctamente

---

**¿Listo?** Abre: `00-DOCS-CONFIGURACION/GUIA-RAPIDA.md` 🚀

El script `Setup-Oracle.ps1` hace esto automáticamente, pero si lo haces manualmente:

```powershell
cd backend-symfony
composer install
```

### 2. Configurar Base de Datos Oracle

El script `Setup-Oracle.ps1` crea automáticamente lo siguiente:

```sql
-- Usuario Oracle (crear una sola vez como admin)
CREATE USER caprino_user IDENTIFIED BY CaprinoPass2025;
GRANT CREATE SESSION TO caprino_user;
GRANT RESOURCE TO caprino_user;
GRANT UNLIMITED TABLESPACE TO caprino_user;
GRANT CREATE TABLE TO caprino_user;
GRANT CREATE SEQUENCE TO caprino_user;
GRANT CREATE TRIGGER TO caprino_user;
```

### 3. Crear Tablas con Migraciones

El script `Setup-Oracle.ps1` genera y ejecuta las migraciones automáticamente:

```powershell
# Manual (si lo prefieres):
cd backend-symfony
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

### 4. Configurar Frontend

```bash
cd frontend-web
npm install
```

## ▶️ Iniciar el Proyecto

### Después de ejecutar Setup-Oracle.ps1:

**Terminal 1 - Backend Symfony:**
```powershell
cd backend-symfony
php -S localhost:8000 -t public/
```

**Terminal 2 - Frontend React:**
```bash
cd frontend-web
npm run dev
```

## 🌐 Acceso

- **Frontend**: http://localhost:3000 (ver puerto en terminal npm)
- **Backend API**: http://localhost:8000
- **API Platform Docs**: http://localhost:8000/api (si está configurado)

### Credenciales por Defecto
- **Email**: admin@caprino.local
- **Password**: Admin123!

## 📁 Estructura del Proyecto

```
Proyecto-Caprino/
├── backend-symfony/
│   ├── public/
│   │   ├── api.php              # REST API
│   │   └── uploads/animales/    # Fotos de animales
│   ├── src/                     # Código Symfony (futuro)
│   └── .env                     # Configuración BD
│
├── frontend-web/
│   ├── src/
│   │   ├── componentes/         # Componentes React
│   │   ├── servicios/           # Clientes API
│   │   └── contextos/           # Context API
│   └── package.json
│
├── base-de-datos/
│   ├── esquemas/                # DDL de tablas
│   ├── procedimientos/          # Triggers y funciones
│   └── vistas/                  # Vistas de reportes
│
└── documentacion/
    ├── 01-arquitectura-del-sistema.md
    └── 02-reglas-de-negocio-zootecnicas.md
```

## 🔑 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/me` - Datos del usuario autenticado

### Animales (CRUD Completo)
- `GET /api/animales` - Listar animales (con filtros opcionales)
- `POST /api/animales` - Crear animal con foto
- `PUT /api/animales/{id}` - Actualizar animal
- `DELETE /api/animales/{id}` - Eliminar animal

### Catálogos
- `GET /api/razas` - Listar razas de caprinos
- `GET /api/usuarios` - Listar usuarios del sistema

## 📸 Gestión de Fotos

Las fotos de animales se guardan como **archivos en el servidor**:

- **Ubicación**: `backend-symfony/public/uploads/animales/`
- **Formato**: Las imágenes base64 se convierten a archivos JPG/PNG
- **Base de datos**: Guarda solo la ruta relativa (`/uploads/animales/animal_xxx.jpg`)
- **Ventajas**: Mejor rendimiento, fácil respaldo, sin límites de tamaño CLOB

## 🐛 Troubleshooting

### Error: "No se puede conectar a la base de datos"
- Verificar que Oracle esté corriendo
- Comprobar credenciales en archivo `.env`
- Probar conectividad: `tnsping XEPDB1`

### Error: "Call to undefined function oci_connect"
- Instalar Oracle Instant Client
- Habilitar extensión `oci8` en `php.ini`:
  ```ini
  extension=oci8_12c
  ```
- Reiniciar servidor PHP

### Las fotos no se muestran
- Verificar que exista: `backend-symfony/public/uploads/animales/`
- Verificar permisos de escritura en la carpeta
- Verificar que la columna `foto_url` sea VARCHAR2(500), no CLOB

### Error CORS en el navegador
- Verificar que el backend esté corriendo en puerto 8000
- Verificar headers CORS en `api.php`

## 📦 Características Implementadas

- ✅ **Autenticación**: Login y registro de usuarios
- ✅ **Gestión de Animales**: CRUD completo con fotos
- ✅ **Filtros**: Búsqueda por código, nombre, sexo, raza, estado
- ✅ **Catálogos**: Razas predefinidas
- ✅ **Validaciones**: Campos requeridos y formato de datos
- ✅ **UI/UX**: Diseño responsivo con Tailwind CSS
- ✅ **Fotos**: Subida y visualización de imágenes

## 🚧 Características Pendientes

- [ ] Módulo de Pesaje (registro de peso periódico)
- [ ] Módulo de Salud (vacunas, tratamientos, diagnósticos)
- [ ] Módulo de Reproducción (ciclos, partos, servicios)
- [ ] Módulo de Producción de Leche
- [ ] Módulo de Genealogía (árbol genealógico)
- [ ] Reportes y gráficas estadísticas
- [ ] Notificaciones automáticas
- [ ] Exportación a PDF/Excel
- [ ] Aplicación móvil con Capacitor

## 📝 Notas de Desarrollo

- El archivo `api.php` es una API REST temporal
- Las fotos se guardan como archivos (mejor práctica web)
- CORS configurado para desarrollo local
- Diseño mobile-first con Tailwind

## 📄 Licencia

Este proyecto es de uso privado para gestión de hatos caprinos.

## 👨‍💻 Autor

Sistema desarrollado para la gestión profesional de explotaciones caprinas.

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026
