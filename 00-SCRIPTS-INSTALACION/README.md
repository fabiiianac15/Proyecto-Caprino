# 📋 ORDEN DE INSTALACIÓN - Proyecto Caprino

## ⚠️ IMPORTANTE

Este directorio contiene **scripts en orden** para instalar y configurar el proyecto Caprino.

**EJECUTA LOS SCRIPTS EN ORDEN NUMÉRICO (01, 02, 03, 04...)**

---

## 📝 INSTRUCCIONES

### **PRIMERA VEZ: Instalación Completa**

#### Paso 0️⃣ - Instalar Visual C++ Runtime (EJECUTAR PRIMERO)
```
00b-INSTALAR-VCRUNTIME.ps1
```
- Descarga e instala Visual C++ 2015-2022 Runtime (prerequisito para PHP 8.2)
- Sin esto, PHP mostrará warnings de incompatibilidad
- Ejecuta una sola vez

#### Paso 0️⃣ (b) - Instalar PHP compatible automáticamente
```
00-INSTALAR-PHP-COMPATIBLE.bat
```
- Descarga e instala PHP 8.2 Thread Safe x64 compatible con este proyecto
- Configura `PHP_HOME`, `PATH` y `php.ini` de forma automática
- Si ya tienes PHP en otro lugar, puedes usar el `.ps1` con parámetros para cambiar versión/ruta

#### Paso 1️⃣ - Verificar Requisitos
```
01-VERIFICAR-REQUISITOS.bat
```
- Verifica que tienes PHP 8.2, Composer, Node.js, Oracle
- Si algo falta, el script te indicará qué instalar

#### Paso 2️⃣ - Configurar Oracle (EJECUTAR COMO ADMINISTRADOR)
```
Clic derecho en 02-CONFIGURAR-ORACLE-ENV.bat → Ejecutar como administrador
```
- Configura variables de entorno para Oracle
- **Importantes después de ejecutar**: Cierra y reabre PowerShell

#### Paso 3️⃣ - Instalar OCI8 (EJECUTAR COMO ADMINISTRADOR)
```
Clic derecho en 03-INSTALAR-OCI8.ps1 → Run with PowerShell
(O: powershell -ExecutionPolicy Bypass -File "03-INSTALAR-OCI8.ps1")
```
- Descarga e instala la extensión OCI8 para PHP
- Permite que PHP se conecte a Oracle

#### Paso 4️⃣ - Instalar Dependencias Backend
```
04-INSTALAR-DEPENDENCIAS-BACKEND.bat
```
- Ejecuta `composer install`
- Descarga bibliotecas PHP necesarias (Symfony, JWT, etc.)

#### Paso 5️⃣ - Instalar Dependencias Frontend
```
05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
```
- Ejecuta `npm install`
- Descarga librerías de React, Tailwind, etc.

#### Paso 6️⃣ - Iniciar Oracle (EJECUTAR COMO ADMINISTRADOR)
```
Clic derecho en 06-INICIAR-ORACLE.ps1 → Run with PowerShell
```
- Inicia el servicio OracleServiceXE
- Verifica que Oracle está listo

---

### **DESPUÉS DE INSTALACIÓN: Iniciar el Proyecto**

#### Terminal 1️⃣ - Iniciar Backend
```
07-INICIAR-BACKEND.bat
```
- Inicia PHP en puerto 8000
- Backend disponible en: http://localhost:8000

#### Terminal 2️⃣ - Iniciar Frontend (EN UNA NUEVA TERMINAL DIFERENTE)
```
08-INICIAR-FRONTEND.bat
```
- Inicia Vite en puerto 5173
- Frontend disponible en: http://localhost:5173

---

## 🔄 CICLO DE DESARROLLO

1. Mantén ambos servidores corriendo (Backend en Terminal 1, Frontend en Terminal 2)
2. Frontend hace peticiones a http://localhost:8000/api/...
3. Backend conecta a Oracle en localhost:1521
4. Haz cambios en el código - se recargan automáticamente

---

## 🛑 DETENER SERVIDORES

- **Backend**: Presiona `CTRL+C` en Terminal 1
- **Frontend**: Presiona `CTRL+C` en Terminal 2

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
00-SCRIPTS-INSTALACION/
├── 00b-INSTALAR-VCRUNTIME.ps1       # Instala Visual C++ Runtime
├── 00-INSTALAR-PHP-COMPATIBLE.ps1    # Instala y configura PHP 8.2
├── 00-INSTALAR-PHP-COMPATIBLE.bat    # Ejecutable Windows
├── 01-VERIFICAR-REQUISITOS.ps1      # Verificar dependencias
├── 01-VERIFICAR-REQUISITOS.bat      # Ejecutable Windows
├── 02-CONFIGURAR-ORACLE-ENV.ps1     # Configurar variables
├── 02-CONFIGURAR-ORACLE-ENV.bat     # Ejecutable Windows
├── 03-INSTALAR-OCI8.ps1             # Instalar extensión OCI8
├── 04-INSTALAR-DEPENDENCIAS-BACKEND.ps1
├── 04-INSTALAR-DEPENDENCIAS-BACKEND.bat
├── 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1
├── 05-INSTALAR-DEPENDENCIAS-FRONTEND.bat
├── 06-INICIAR-ORACLE.ps1
├── 07-INICIAR-BACKEND.ps1
├── 07-INICIAR-BACKEND.bat           # Ejecutable Windows
├── 08-INICIAR-FRONTEND.ps1
├── 08-INICIAR-FRONTEND.bat          # Ejecutable Windows
├── logs/                            # Registro de ejecuciones
└── README.md                        # Este archivo
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "El script no se ejecuta en PowerShell"
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### "PHP no encuentra OCI8"
- Cierra PowerShell completamente y abre una nueva
- Verifica: `php -m | findstr oci8`

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
- Verifica el servicio: Services.msc → busca "OracleServiceXE"
- Debe estar en estado "Running"

---

## 📞 CONTACTO / SOPORTE

Si tienes problemas:
1. Revisa los logs en carpeta `logs/`
2. Ejecuta de nuevo el script que falla
3. Verifica los mensajes de error en consola

---

**¡Proyecto listo para desarrollar!** 🚀
