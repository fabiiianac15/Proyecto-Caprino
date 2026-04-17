# 📝 RESUMEN DE MODIFICACIONES Y NUEVOS SCRIPTS

## 🎯 OBJETIVO
Automatizar completamente la instalación del proyecto Caprino en cualquier computadora, de modo que solo sea necesario ejecutar scripts.

---

## ✅ NUEVOS SCRIPTS CREADOS

### 1. **00-INSTALACION-COMPLETA.ps1** (SCRIPT MAESTRO)
**Ubicación:** `00-SCRIPTS-INSTALACION/`

**Qué hace:**
- Ejecuta TODOS los pasos de instalación en orden automáticamente
- Muestra una lista de pasos que ejecutará
- Pide confirmación antes de comenzar
- Ejecuta scripts que requieren admin (abre nuevas ventanas si es necesario)
- Resume el progreso (paso X de Y)

**Uso:**
```powershell
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
```

**Tiempo:** 15-25 minutos (depende de velocidad de internet)

---

### 2. **00c-INSTALAR-NODE.ps1** (NUEVO)
**Ubicación:** `00-SCRIPTS-INSTALACION/`

**Qué hace:**
- Verifica si Node.js está instalado
- Si no está, descarga e instala Node.js v24.11.1
- Verifica la instalación (node --version, npm --version)
- Actualiza PATH en la sesión actual

**Modificaciones a otros scripts necesarias:**
- Ya se ejecuta en el flujo de instalación completa

---

### 3. **02b-CREAR-USUARIO-ORACLE.ps1** (NUEVO)
**Ubicación:** `00-SCRIPTS-INSTALACION/`

**Qué hace:**
- Crea usuario `caprino` en Oracle con contraseña `CaprinoPass2025`
- Otorga privilegios CONNECT y RESOURCE
- Otorga acceso ilimitado al tablespace USERS
- Crea tabla USUARIO con estructura completa
- Crea secuencia SEQ_USUARIO para generar IDs automáticos

**Estructura de tabla creada:**
```sql
CREATE TABLE USUARIO (
  ID_USUARIO NUMBER PRIMARY KEY,
  NOMBRE_COMPLETO VARCHAR2(200) NOT NULL,
  EMAIL VARCHAR2(200) NOT NULL UNIQUE,
  PASSWORD_HASH VARCHAR2(500) NOT NULL,
  ROL VARCHAR2(50) DEFAULT 'tecnico',
  ESTADO VARCHAR2(50) DEFAULT 'activo',
  FECHA_CREACION TIMESTAMP DEFAULT SYSDATE
)
```

---

### 4. **09-CONFIGURAR-ENV.ps1** (NUEVO)
**Ubicación:** `00-SCRIPTS-INSTALACION/`

**Qué hace:**
- Configura `backend-symfony/.env` con valores correctos:
  - DATABASE_HOST=127.0.0.1
  - DATABASE_PORT=1521
  - DATABASE_NAME=XEPDB1
  - DATABASE_USER=caprino
  - DATABASE_PASSWORD=CaprinoPass2025
- Genera APP_SECRET aleatorio (32 caracteres) si usa valor por defecto
- Crea `frontend-web/.env.local` con:
  - VITE_API_URL=http://localhost:8000/api
  - VITE_APP_NAME=Sistema Caprino
  - VITE_DEBUG=true

**Beneficio:** No hay que configurar nada manualmente, los archivos .env están listos

---

## 📋 MODIFICACIONES A SCRIPTS EXISTENTES

### Archivos modificados:

1. **backend-symfony/public/api.php**
   - Arreglado: Lectura de `php://input` solo una vez (antes se leía dos veces)
   - Mejorado: Manejo de UTF-8 para caracteres acentuados
   - Arreglado: USE de secuencia para generar IDs en INSERT

2. **backend-symfony/.env**
   - Cambio: DATABASE_USER de `C##caprino` a `caprino`

3. **C:\Users\[User]\AppData\Local\Programs\php82\php.ini**
   - Habilitada extensión: `extension=oci8_19`

---

## 🔄 ORDEN DE EJECUCIÓN (Flujo Automático)

El script maestro `00-INSTALACION-COMPLETA.ps1` ejecuta en este orden:

```
1. 00b-INSTALAR-VCRUNTIME.ps1         → Visual C++ Runtime
2. 00-INSTALAR-PHP-COMPATIBLE.ps1     → PHP 8.2
3. 00c-INSTALAR-NODE.ps1              → Node.js v24 (NUEVO)
4. 01-VERIFICAR-REQUISITOS.ps1        → Validar prereqs
5. 02-CONFIGURAR-ORACLE-ENV.ps1       → Variables de entorno (ADMIN)
6. 02b-CREAR-USUARIO-ORACLE.ps1       → Usuario y tablas (NUEVO)
7. 03-INSTALAR-OCI8.ps1               → Extensión OCI8 (ADMIN)
8. 03b-INSTALAR-COMPOSER.ps1          → Composer
9. 04-INSTALAR-DEPENDENCIAS-BACKEND.ps1 → Composer install
10. 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1 → npm install
11. 09-CONFIGURAR-ENV.ps1             → Archivos .env (NUEVO)
```

---

## 🔧 CAMBIOS EN CREDENCIALES Y CONFIGURACIÓN

### Oracle
| Parámetro | Antes | Ahora |
|-----------|-------|-------|
| Usuario | No existía | caprino |
| Contraseña | - | CaprinoPass2025 |
| BD | XEPDB1 | XEPDB1 (sin cambios) |
| Host | - | 127.0.0.1:1521 |

### PHP/OCI8
| Parámetro | Antes | Ahora |
|-----------|-------|-------|
| Extensión | Deshabilitada | `extension=oci8_19` habilitada |
| php.ini | No configurado | Configurado automáticamente |

### Archivos .env
| Archivo | Antes | Ahora |
|---------|-------|-------|
| backend-symfony/.env | VALUES_PLACEHOLDER | VALORES REALES |
| frontend-web/.env.local | No existía | Creado automáticamente |

---

## 📊 QUÉ HACE CADA COMPONENTE

```
00-INSTALACION-COMPLETA.ps1 (Script Orquestador)
    ├─ Verifica permisos de admin cuando necesita
    ├─ Ejecuta scripts en orden
    ├─ Maneja errores
    └─ Muestra progreso

00c-INSTALAR-NODE.ps1 (Instalador Node.js)
    ├─ Detecta si existe
    ├─ Si no existe → descarga e instala
    └─ Verifica instalación

02b-CREAR-USUARIO-ORACLE.ps1 (Configurador BD)
    ├─ Crea usuario caprino
    ├─ Otorga permisos
    ├─ Crea tabla USUARIO
    └─ Crea secuencia SEQ_USUARIO

09-CONFIGURAR-ENV.ps1 (Configurador Entorno)
    ├─ Lee archivos .env
    ├─ Sustituye valores placeholders
    ├─ Genera secretos aleatorios
    └─ Crea archivos faltantes
```

---

## ✨ BENEFICIOS DE ESTOS CAMBIOS

### Para Usuarios Nuevos:
1. **Instalación 1-click:** Solo ejecutar `00-INSTALACION-COMPLETA.ps1`
2. **Sin preocupaciones de config:** Archivos .env se crean automáticamente
3. **BD lista:** Usuario y tablas se crean automáticamente
4. **Tiempo:** 15-25 min de automatización completa

### Para Desarrollo:
1. **Reproducibilidad:** Mismo orden en cualquier máquina
2. **Sin errores manuales:** Scripts verifican y ajustan automáticamente
3. **Mantenible:** Scripts reutilizables para futuros proyectos
4. **Escalable:** Fácil agregar más pasos si es necesario

---

## 🚨 REQUISITOS PREVIOS (SIN CAMBIOS)

Antes de ejecutar los scripts, necesitas:

1. **Windows 10/11** (los scripts están optimizados para Windows)
2. **PowerShell 5.0+** (viene con Windows)
3. **Internet activo** (para descargar componentes)
4. **Oracle 21c Express ya instalado** en la máquina
   - Los scripts configuran el usuario y tablas
   - Pero Oracle debe estar pre-instalado
5. **Permisos de Administrador** (para algunos pasos)

---

## 📥 INSTALACIÓN EN NUEVA MÁQUINA: PASOS

### Antes de empezar:
1. Clona o descarga el proyecto Caprino
2. Instala Oracle 21c Express (si no lo tienes)
3. Navega a `00-SCRIPTS-INSTALACION/`

### Ejecución:
```powershell
# Abre PowerShell
# Navega a: C:\ruta\del\Proyecto-Caprino\00-SCRIPTS-INSTALACION\

# Ejecuta:
powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"

# Sigue las instrucciones que aparecen
# Responde "s" cuando pida confirmación
```

### Después:
1. Abre 3 terminales
2. En Terminal 1: `06-INICIAR-ORACLE.ps1`
3. En Terminal 2: `07-INICIAR-BACKEND.bat`
4. En Terminal 3: `08-INICIAR-FRONTEND.bat`
5. Abre: **http://localhost:5173**

---

## 🔍 VERIFICACIÓN RÁPIDA

Después de ejecutar todo, verifica en PowerShell:

```powershell
# Verificar herramientas
php --version                          # = PHP 8.2.29
node --version                         # = v24.x.x
npm --version                          # = 11.x.x
composer --version                     # = v2.9.7
php -m | findstr oci8                  # = oci8 (debe aparecer)

# Verificar directorios
Test-Path backend-symfony/vendor       # = True
Test-Path frontend-web/node_modules    # = True
Test-Path backend-symfony/.env         # = True
Test-Path frontend-web/.env.local      # = True

# Verificar BD
# Intenta registrarte en la aplicación
# Si funciona → ¡TODO ESTÁ BIEN!
```

---

## 📚 DOCUMENTACIÓN ACTUALIZADA

- **README.md**: Actualizado con instrucciones nuevas de instalación rápida
- **Este archivo**: Detalla todos los cambios
- **Scripts**: Cada script tiene comentarios explicativos

---

## 🎓 EJEMPLO DE FLUJO PARA 2ª MÁQUINA

```
Usuario abre PowerShell en máquina nueva
    ↓
Navega a: 00-SCRIPTS-INSTALACION/
    ↓
Ejecuta: powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
    ↓
Script instala: VC++, PHP, Node, Composer, OCI8
    ↓
Script crea: Usuario Oracle, Tabla USUARIO
    ↓
Script configura: backend/.env, frontend/.env.local
    ↓
Todo listo en ~20 minutos
    ↓
Usuario inicia 3 servidores
    ↓
Abre http://localhost:5173
    ↓
¡A DESARROLLAR! 🚀
```

---

## 💾 CAMBIOS EN ARCHIVOS DE CÓDIGO

### api.php (Backend)
```diff
- Ahora le archivo php://input solo UNA VEZ
- Mejor manejo de UTF-8 (caracteres acentuados)
- INSERT usa SEQ_USUARIO.NEXTVAL para generar IDs
```

### .env (Backend)
```diff
- DATABASE_USER: C##caprino → caprino
```

### php.ini (PHP)
```diff
+ extension=oci8_19
```

---

## ⚡ OPTIMIZACIONES REALIZADAS

1. **Sin lecturas dobles:** api.php lee php://input una sola vez
2. **Encoding UTF-8:** Manejo correcto de caracteres acentuados
3. **IDs automáticos:** Secuencia Oracle genera IDs sin intervención
4. **Tablas automáticas:** 02b-CREAR-USUARIO-ORACLE.ps1 crea estructura
5. **Config automática:** 09-CONFIGURAR-ENV.ps1 configura todo

---

## 🔐 INFORMACIÓN SENSIBLE (CAMBIAR EN PRODUCCIÓN)

Los scripts usan credenciales por defecto para DESARROLLO:

```
Oracle:
  Usuario: caprino
  Contraseña: CaprinoPass2025

Backend .env:
  APP_SECRET: Generado aleatorio
  JWT_PASSPHRASE: cambiar_passphrase_en_produccion
```

**⚠️ EN PRODUCCIÓN:** Cambiar todas las contraseñas y valores secretos

---

## 📞 SOPORTE

Si algo falla:

1. Revisa el mensaje de error en la consola
2. Ejecuta solo el script que falló (no necesitas ejecutar todo de nuevo)
3. Verifica que tienes las herramientas requeridas (php, node, Oracle)
4. Intenta de nuevo

Los scripts son idempotentes (pueden ejecutarse múltiples veces sin problemas).

---

**¡Proyecto listo para desarrollo en cualquier máquina!** 🐐
