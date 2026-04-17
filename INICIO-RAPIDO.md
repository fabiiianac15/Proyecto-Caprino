# 🚀 INICIO RÁPIDO - Sistema Caprino

## ⚡ Instalación RÁPIDA (Recomendado)

Si es la **primera vez** instalando el proyecto, sigue estos pasos:

### 1️⃣ Requisitos Previos

Necesitas tener instalado:
- **Windows 10 o 11**
- **Oracle 21c Express Edition** (ya instalado)
- **Internet activo**

### 2️⃣ Ejecutar Script de Instalación Automática

Abre **PowerShell** como administrador y copia esto:

```powershell
cd "C:\ruta\donde\esta\Proyecto-Caprino\00-SCRIPTS-INSTALACION"
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
```

**Listo.** El script instalará:
- ✅ Visual C++ Runtime
- ✅ PHP 8.2 (con extensión OCI8)
- ✅ Node.js v24
- ✅ Composer
- ✅ Usuario y tablas en Oracle
- ✅ Dependencias del Backend (Symfony)
- ✅ Dependencias del Frontend (React)
- ✅ Archivos de configuración (.env)

⏱️ **Tiempo:** 15-25 minutos aproximadamente

---

## 🎯 Después de la Instalación

### Inicio en 3 pasos:

Abre **3 terminales** (PowerShell o CMD) en la carpeta `00-SCRIPTS-INSTALACION/`:

```powershell
# TERMINAL 1: Inicia Oracle (espera el mensaje "Database ready")
06-INICIAR-ORACLE.ps1

# TERMINAL 2: Inicia Backend (espera "listening on 8000")
07-INICIAR-BACKEND.bat

# TERMINAL 3: Inicia Frontend  
08-INICIAR-FRONTEND.bat
```

### Accede a la aplicación:
Abre tu navegador en: **http://localhost:5173**

---

## 📋 Verificación Rápida

Después de instalar, verifica que todo está bien:

```powershell
# Abre una terminal en la raíz del proyecto y corre:

# Contar archivos del backend
(Get-ChildItem backend-symfony/vendor -Recurse).Count    # Debe ser > 500

# Contar dependencias del frontend  
(Get-ChildItem frontend-web/node_modules -Recurse).Count # Debe ser > 1000

# Verificar PHP + OCI8
php -m | findstr oci8                                     # Debe mostrar: oci8

# Verificar Node.js
node --version                                            # Debe mostrar: v24.x.x
```

---

## 🔧 Si algo falla

### Error: "Permission denied" o "no tienes permisos"
→ Abre PowerShell **como administrador** (clic derecho → "Run as administrator")

### Error: "OCI8 extension not loaded"
→ Ejecuta: `03-INSTALAR-OCI8.ps1` manualmente como admin

### Error: "Cannot connect to Oracle"
→ Verifica que Oracle está corriendo: `06-INICIAR-ORACLE.ps1`

### Error: "Port 8000 already in use"
→ Cierra otros servidores o usa puerto diferente en backend

### La BD está vacía o sin datos
→ Ejecuta: `02b-CREAR-USUARIO-ORACLE.ps1` manualmente como admin

---

## 📚 Documentación

Para más detalles, consulta:
- **CAMBIOS-Y-MODIFICACIONES.md** → Qué se agregó / modificó
- **README.md** → Instrucciones completas paso a paso
- **cada script** → Tiene comentarios explicativos adentro

---

## 🆘 Necesitas ayuda?

Revisa estos archivos en `00-DOCS-CONFIGURACION/`:
1. **GUIA-RAPIDA.md** → FAQ y troubleshooting
2. **README.md** → Documentación completa

---

## ✅ Está todo correctamente instalado si:

- [ ] PowerShell sin errores al ejecutar instalación
- [ ] `php -m | findstr oci8` muestra "oci8"
- [ ] Los 3 servidores inician sin errores
- [ ] http://localhost:5173 carga la aplicación
- [ ] Puedes registrarte en la app

---

**¡Listo para desarrollar!** 🐐

Próximas cosas que puedes hacer:
1. Registra un usuario en http://localhost:5173
2. Inicia sesión
3. Explora las funcionalidades
4. Revisa el código en `backend-symfony/` y `frontend-web/`

