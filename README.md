# 🐐 Sistema de Gestión Caprino

Sistema web completo para la gestión integral de hatos caprinos, incluyendo registro de animales, genealogía, producción de leche, reproducción, salud y reportes.

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: PHP 8.2+ con REST API
- **Base de datos**: Oracle 21c XE
- **Servidor**: PHP Built-in Server (desarrollo)

## 📋 Requisitos Previos

1. **PHP 8.2+** instalado en `C:\tools\php82`
2. **Node.js 18+** y npm
3. **Oracle 21c XE** corriendo en `192.168.101.20:1521/XEPDB1`
4. **Oracle Instant Client** para PHP (extensión oci8)
5. Usuario de BD: `caprino_user` / `CaprinoPass2025`

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <url-repo>
cd Proyecto-Caprino
```

### 2. Configurar Base de Datos

Conectarse a Oracle como `sys_local` y ejecutar:

```sql
-- Crear usuario
CREATE USER caprino_user IDENTIFIED BY CaprinoPass2025;
GRANT CONNECT, RESOURCE TO caprino_user;
GRANT CREATE VIEW TO caprino_user;
ALTER USER caprino_user QUOTA UNLIMITED ON USERS;
```

Conectarse como `caprino_user` y ejecutar scripts en orden:

```bash
@base-de-datos/00-init-database.sql
@base-de-datos/esquemas/01-tablas-principales.sql
@base-de-datos/esquemas/02-datos-iniciales-razas.sql
@base-de-datos/esquemas/03-datos-iniciales-usuarios.sql
@base-de-datos/esquemas/04-tabla-usuarios.sql
@base-de-datos/procedimientos/01-triggers-y-funciones.sql
@base-de-datos/vistas/01-vistas-reportes.sql
```

**IMPORTANTE:** Convertir columna `foto_url` a VARCHAR2:

```sql
ALTER TABLE ANIMAL ADD foto_url_new VARCHAR2(500);
UPDATE ANIMAL SET foto_url_new = SUBSTR(foto_url, 1, 500);
ALTER TABLE ANIMAL DROP COLUMN foto_url;
ALTER TABLE ANIMAL RENAME COLUMN foto_url_new TO foto_url;
COMMIT;
```

### 3. Configurar Backend

```bash
cd backend-symfony
```

Crear archivo `.env` (copiar de `.env.example`):
```
DATABASE_URL=oci8://caprino_user:CaprinoPass2025@192.168.101.20:1521/XEPDB1
```

### 4. Configurar Frontend

```bash
cd frontend-web
npm install
```

## ▶️ Iniciar el Proyecto

### Opción 1: Script PowerShell (Recomendado)
```powershell
.\iniciar-proyecto.ps1
```

Este script inicia automáticamente:
- Backend PHP en puerto 8000
- Frontend React en puerto 5173

### Opción 2: Manual

**Terminal 1 - Backend:**
```powershell
.\INICIAR-BACKEND-PHP82.bat
```

**Terminal 2 - Frontend:**
```bash
cd frontend-web
npm run dev
```

## 🌐 Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Health Check**: http://localhost:8000/api/health

### Credenciales de Prueba
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
