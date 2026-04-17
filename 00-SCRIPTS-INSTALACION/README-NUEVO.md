# 📋 ORDEN DE INSTALACIÓN - Proyecto Caprino

## ⚠️ IMPORTANTE

Este directorio contiene **scripts en orden** para instalar y configurar el proyecto Caprino.

---

## 🚀 INSTALACIÓN RÁPIDA (RECOMENDADO)

### Opción 1️⃣: Instalación Automatizada Completa

```powershell
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
```

**Esto ejecutará TODOS los pasos en orden:**
- ✓ Instala Visual C++, PHP, Node.js
- ✓ Verifica requisitos  
- ✓ Configura Oracle
- ✓ Crea usuario y tablas en Oracle
- ✓ Instala OCI8 y Composer
- ✓ Instala dependencias backend y frontend
- ✓ Configura archivos .env

**Tiempo aproximado:** 15-25 minutos (depende de velocidad de internet)

---

## 📝 INSTALACIÓN MANUAL (Paso a Paso)

Si prefieres ejecutar manualmente cada paso:

### Paso 0️⃣ - Instalar Visual C++ Runtime
```powershell
powershell -ExecutionPolicy Bypass -File "00b-INSTALAR-VCRUNTIME.ps1"
```
- Prerequisito para PHP 8.2
- Ejecuta una sola vez

### Paso 1️⃣ - Instalar PHP 8.2
```powershell
powershell -ExecutionPolicy Bypass -File "00-INSTALAR-PHP-COMPATIBLE.ps1"
```
- Descarga e instala PHP 8.2 Thread Safe x64
- Configura automáticamente `PATH` y `php.ini`

### Paso 2️⃣ - Instalar Node.js (si no lo tienes)
```powershell
powershell -ExecutionPolicy Bypass -File "00c-INSTALAR-NODE.ps1"
```
- Descarga e instala Node.js v24+
- Verifica si ya lo tienes instalado

### Paso 3️⃣ - Verificar Requisitos
```powershell
powershell -ExecutionPolicy Bypass -File "01-VERIFICAR-REQUISITOS.ps1"
```
- Verifica que tienes PHP 8.2, Node.js, Oracle
- Te indica qué falta instalar

### Paso 4️⃣ - Configurar Oracle (REQUIERE ADMIN)
```powershell
powershell -ExecutionPolicy Bypass -File "02-CONFIGURAR-ORACLE-ENV.ps1"
```
- Configura variables de entorno para Oracle
- Requiere permisos de administrador

### Paso 5️⃣ - Crear Usuario Oracle (REQUIERE ADMIN)
```powershell
powershell -ExecutionPolicy Bypass -File "02b-CREAR-USUARIO-ORACLE.ps1"
```
- Crea usuario `caprino` en Oracle
- Crea tabla `USUARIO` y secuencia `SEQ_USUARIO`
- Otorga permisos necesarios

### Paso 6️⃣ - Instalar OCI8 (REQUIERE ADMIN)
```powershell
powershell -ExecutionPolicy Bypass -File "03-INSTALAR-OCI8.ps1"
```
- Instala extensión OCI8 para PHP
- Permite conexión a Oracle

### Paso 7️⃣ - Instalar Composer
```powershell
powershell -ExecutionPolicy Bypass -File "03b-INSTALAR-COMPOSER.ps1"
```
- Descarga e instala Composer (gestor de paquetes PHP)

### Paso 8️⃣ - Instalar Dependencias Backend
```powershell
powershell -ExecutionPolicy Bypass -File "04-INSTALAR-DEPENDENCIAS-BACKEND.ps1"
```
- Ejecuta `composer install`
- Descarga bibliotecas PHP (Symfony, API Platform, JWT, etc.)

### Paso 9️⃣ - Instalar Dependencias Frontend
```powershell
powershell -ExecutionPolicy Bypass -File "05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1"
```
- Ejecuta `npm install`
- Descarga librerías React, Tailwind, etc.

### Paso 🔟 - Configurar Archivos .env
```powershell
powershell -ExecutionPolicy Bypass -File "09-CONFIGURAR-ENV.ps1"
```
- Configura `.env` para backend
- Configura `.env.local` para frontend

---

## ▶️ DESPUÉS DE LA INSTALACIÓN: Iniciar Servidores

### Terminal 1️⃣ - Iniciar Oracle
```powershell
powershell -ExecutionPolicy Bypass -File "06-INICIAR-ORACLE.ps1"
```
- Inicia el servicio OracleServiceXE
- Verifica que Oracle está listo

### Terminal 2️⃣ - Iniciar Backend
```powershell
powershell -ExecutionPolicy Bypass -File "07-INICIAR-BACKEND.ps1"
```
O más simple:
```
07-INICIAR-BACKEND.bat
```
- Inicia PHP en puerto 8000
- Backend disponible en: **http://localhost:8000**

### Terminal 3️⃣ - Iniciar Frontend (EN UNA NUEVA TERMINAL DIFERENTE)
```powershell
powershell -ExecutionPolicy Bypass -File "08-INICIAR-FRONTEND.ps1"
```
O más simple:
```
08-INICIAR-FRONTEND.bat
```
- Inicia Vite en puerto 5173
- Frontend disponible en: **http://localhost:5173**

---

## 🔄 CICLO DE DESARROLLO

1. Mantén 3 terminales abiertas:
   - Terminal 1: Oracle (solo 1 vez)
   - Terminal 2: Backend (puede reiniciar)
   - Terminal 3: Frontend (puede reiniciar)

2. Frontend en port 5173 hace peticiones a http://localhost:8000/api/...
3. Backend en port 8000 conecta a Oracle en localhost:1521
4. Haz cambios en el código - se recargan automáticamente

---

## 🛑 DETENER SERVIDORES

- **Oracle**: Presiona `CTRL+C` 
- **Backend**: Presiona `CTRL+C` en Terminal 2
- **Frontend**: Presiona `CTRL+C` en Terminal 3

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
00-SCRIPTS-INSTALACION/
├── 00-INSTALACION-COMPLETA.ps1           # [NUEVO] Script maestro - ejecuta todo
├── 00b-INSTALAR-VCRUNTIME.ps1            # Instala Visual C++ Runtime
├── 00-INSTALAR-PHP-COMPATIBLE.ps1        # Instala PHP 8.2
├── 00-INSTALAR-PHP-COMPATIBLE.bat        # Ejecutable Windows
├── 00c-INSTALAR-NODE.ps1                 # [NUEVO] Instala Node.js
├── 01-VERIFICAR-REQUISITOS.ps1           # Verificar dependencias
├── 01-VERIFICAR-REQUISITOS.bat           # Ejecutable Windows
├── 02-CONFIGURAR-ORACLE-ENV.ps1          # Configurar variables Oracle
├── 02-CONFIGURAR-ORACLE-ENV.bat          # Ejecutable Windows
├── 02b-CREAR-USUARIO-ORACLE.ps1          # [NUEVO] Crea usuario y tablas
├── 03-INSTALAR-OCI8.ps1                  # Instalar extensión OCI8
├── 03b-INSTALAR-COMPOSER.ps1             # Instalar Composer
├── 04-INSTALAR-DEPENDENCIAS-BACKEND.ps1  # Instalar dependencias PHP
├── 04-INSTALAR-DEPENDENCIAS-BACKEND.bat  # Ejecutable Windows
├── 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1 # Instalar dependencias npm
├── 05-INSTALAR-DEPENDENCIAS-FRONTEND.bat # Ejecutable Windows
├── 06-INICIAR-ORACLE.ps1                 # Inicia Oracle
├── 07-INICIAR-BACKEND.ps1                # Inicia servidor PHP
├── 07-INICIAR-BACKEND.bat                # Ejecutable Windows
├── 08-INICIAR-FRONTEND.ps1               # Inicia servidor Vite
├── 08-INICIAR-FRONTEND.bat               # Ejecutable Windows
├── 09-CONFIGURAR-ENV.ps1                 # [NUEVO] Configura .env
└── README.md                             # Este archivo
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### "El script no se ejecuta en PowerShell"
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### "PHP no encuentra OCI8"
- Cierra PowerShell completamente y abre una nueva
- Verifica: `php -m | findstr oci8`

### "Error 500 al registrarse"
- Verifica que OCI8 está habilitado: `php -m | findstr oci8`
- Verifica que Oracle está corriendo: Services → OracleServiceXE
- Verifica que el usuario `caprino` existe en Oracle

### "Composer da error"
```powershell
cd backend-symfony
composer clear-cache
composer install --ignore-platform-req=php --ignore-platform-req=ext-sodium
```

### "npm no funciona"
```powershell
npm cache clean --force
npm install
```

### "Oracle no conecta"
- Services.msc → busca "OracleServiceXE"
- Debe estar en estado "Running"
- Ejecuta: `06-INICIAR-ORACLE.ps1`

---

## 📊 RESUMEN DE INSTALACIÓN

| Componente | Versión | Puerto | Ubicación |
|-----------|---------|--------|-----------|
| PHP | 8.2.29 | - | `C:\Users\[User]\AppData\Local\Programs\php82` |
| Node.js | 24.11.1 | - | Agregado a PATH |
| Composer | 2.9.7 | - | Agregado a PATH |
| Oracle | 21c Express | 1521 | `C:\app\[User]\product\21c\dbhomeXE` |
| Backend (Symfony) | 6.4 | 8000 | http://localhost:8000 |
| Frontend (React+Vite) | - | 5173 | http://localhost:5173 |
| API | REST | 8000 | http://localhost:8000/api |

---

## ✅ VERIFICACIÓN FINAL

Después de instalar, verifica que todo funciona:

```powershell
# Verificar instalaciones
php --version          # Debe mostrar PHP 8.2.29
node --version         # Debe mostrar v24.x
npm --version          # Debe mostrar version
composer --version     # Debe mostrar version 2.x
php -m | findstr oci8  # Debe encontrar oci8

# Verificar directorios
Test-Path "backend-symfony/vendor/autoload.php"      # Debe ser True
Test-Path "frontend-web/node_modules"                # Debe ser True
Test-Path "backend-symfony/.env"                     # Debe ser True
```

---

## 🚀 ¡LISTO PARA DESARROLLAR!

```
1. Abre 3 terminales
2. Terminal 1: 06-INICIAR-ORACLE.ps1
3. Terminal 2: 07-INICIAR-BACKEND.bat
4. Terminal 3: 08-INICIAR-FRONTEND.bat
5. Entra a http://localhost:5173
```

**¡Que disfrutes desarrollando!** 🐐
