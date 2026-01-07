# 🚀 Guía: Deployment para Producción (Usuario Final)

Esta guía explica cómo instalar el sistema en la granja para que el director pueda usarlo **sin instalar herramientas de desarrollo**.

## 🎯 Escenarios Disponibles

### Opción 1: Servidor Centralizado (RECOMENDADO) ⭐
**Descripción**: Una PC/servidor con todo instalado, usuarios acceden por navegador.

**Ventajas**:
- ✅ Director no necesita instalar NADA en su PC
- ✅ Acceso desde cualquier dispositivo (PC, tablet, celular)
- ✅ Datos centralizados y fáciles de respaldar
- ✅ Múltiples usuarios simultáneos

**Desventajas**:
- ❌ Requiere una PC siempre encendida
- ❌ Requiere configurar red local

**Ideal para**: Granjas medianas/grandes con oficina o PC disponible.

---

### Opción 2: Aplicación Portable (ALTERNATIVA)
**Descripción**: USB con todo incluido, ejecutar sin instalar.

**Ventajas**:
- ✅ No requiere instalación
- ✅ Portable (USB)
- ✅ Funciona offline

**Desventajas**:
- ❌ Base de datos limitada (SQLite)
- ❌ Solo un usuario a la vez
- ❌ Requiere cambiar código (Oracle → SQLite)

**Ideal para**: Granjas pequeñas, uso personal.

---

### Opción 3: Cloud/VPS (AVANZADO)
**Descripción**: Hospedar en internet, acceso desde cualquier lugar.

**Ventajas**:
- ✅ Acceso desde cualquier lugar con internet
- ✅ No requiere PC local
- ✅ Backups automáticos

**Desventajas**:
- ❌ Costo mensual ($5-20 USD)
- ❌ Requiere internet
- ❌ Requiere dominio y SSL

**Ideal para**: Múltiples granjas o acceso remoto.

---

## 📘 OPCIÓN 1: Servidor Centralizado (Paso a Paso)

### Requisitos Mínimos

**Servidor (Una PC en la granja)**:
- Windows 10/11
- Intel i5 o AMD Ryzen 5
- 8GB RAM
- 50GB espacio libre
- Conexión a red local (LAN/WiFi)

**Clientes (PC del director)**:
- Cualquier PC con navegador web (Chrome, Edge, Firefox)
- Conexión a la misma red local que el servidor

### Paso 1: Preparar el Servidor

#### 1.1 Instalar Requisitos (Solo en el servidor)

```powershell
# Descargar e instalar en orden:
# 1. PHP 8.2+ (https://windows.php.net/download/)
# 2. Oracle 21c XE (https://www.oracle.com/database/technologies/xe-downloads.html)
# 3. Oracle Instant Client
# 4. Node.js 18+ (solo para compilar el frontend)

# Verificar instalaciones
php -v
sqlplus /nolog
node -v
```

#### 1.2 Configurar Base de Datos

```sql
-- Conectar como SYS
sqlplus sys/<password>@localhost:1521/XEPDB1 as sysdba

-- Crear usuario
CREATE USER caprino_user IDENTIFIED BY CaprinoPass2025;
GRANT CONNECT, RESOURCE TO caprino_user;
GRANT CREATE VIEW TO caprino_user;
ALTER USER caprino_user QUOTA UNLIMITED ON USERS;
EXIT;

-- Conectar como caprino_user y ejecutar scripts
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1
@ruta\base-de-datos\00-init-database.sql
@ruta\base-de-datos\esquemas\01-tablas-principales.sql
@ruta\base-de-datos\esquemas\02-datos-iniciales-razas.sql
@ruta\base-de-datos\esquemas\03-datos-iniciales-usuarios.sql
@ruta\base-de-datos\esquemas\04-tabla-usuarios.sql
@ruta\base-de-datos\procedimientos\01-triggers-y-funciones.sql
@ruta\base-de-datos\vistas\01-vistas-reportes.sql
EXIT;
```

#### 1.3 Preparar el Proyecto

```powershell
# Copiar proyecto a ubicación permanente
Copy-Item -Recurse C:\Users\...\Proyecto-Caprino C:\Caprino-Produccion

cd C:\Caprino-Produccion
```

#### 1.4 Compilar Frontend para Producción

```powershell
cd frontend-web

# Modificar configuración para producción
# Editar src/servicios/caprino-api.js
# Cambiar:
# const API_URL = 'http://localhost:8000/api'
# Por:
# const API_URL = window.location.origin + '/api'

# Compilar
npm run build
# Esto crea la carpeta 'dist' con archivos optimizados
```

#### 1.5 Copiar Frontend Compilado al Backend

```powershell
# Copiar archivos compilados a public del backend
Copy-Item -Recurse frontend-web\dist\* backend-symfony\public\
```

### Paso 2: Configurar Servidor de Producción

#### Opción A: Con XAMPP (MÁS FÁCIL) ⭐

```powershell
# Descargar XAMPP para Windows
# https://www.apachefriends.org/download.html

# Instalar XAMPP en C:\xampp

# Copiar proyecto a htdocs
Copy-Item -Recurse C:\Caprino-Produccion\backend-symfony\public\* C:\xampp\htdocs\caprino\

# Configurar PHP en XAMPP
# Editar C:\xampp\php\php.ini:
extension=pdo_oci
extension=oci8_12c
extension_dir = "C:\xampp\php\ext"

# Iniciar XAMPP Control Panel
C:\xampp\xampp-control.exe

# Iniciar Apache (no MySQL)
```

Acceso:
- Desde servidor: `http://localhost/caprino`
- Desde otros PCs: `http://192.168.1.X/caprino` (donde X es la IP del servidor)

#### Opción B: Con IIS (Más profesional)

```powershell
# Habilitar IIS en Windows
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer, IIS-CGI

# Instalar PHP Manager para IIS
# https://www.iis.net/downloads/community/2018/05/php-manager-150-for-iis-10

# Crear sitio en IIS:
# 1. Abrir IIS Manager
# 2. Agregar sitio web
# 3. Ruta física: C:\Caprino-Produccion\backend-symfony\public
# 4. Puerto: 80
# 5. Configurar PHP Handler
```

### Paso 3: Configurar Red Local

#### 3.1 Obtener IP del Servidor

```powershell
ipconfig | findstr IPv4
# Ejemplo: 192.168.1.100
```

#### 3.2 Configurar Firewall

```powershell
# Permitir puerto 80 (HTTP)
New-NetFirewallRule -DisplayName "Caprino Web Server" `
  -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Si usas Oracle desde otros PCs (opcional)
New-NetFirewallRule -DisplayName "Oracle Database" `
  -Direction Inbound -LocalPort 1521 -Protocol TCP -Action Allow
```

#### 3.3 Configurar IP Estática (Recomendado)

```powershell
# En Configuración de Red de Windows:
# Panel de Control → Red → Adaptador → IPv4
# Establecer IP fija: 192.168.1.100 (ejemplo)
# Máscara: 255.255.255.0
# Gateway: 192.168.1.1 (tu router)
# DNS: 8.8.8.8
```

### Paso 4: Acceso desde PC del Director

#### 4.1 Crear Acceso Directo

En el escritorio del director:

```
Nombre: Sistema Caprino
Destino: http://192.168.1.100/caprino
Icono: (Puedes crear un ícono personalizado)
```

#### 4.2 Agregar a Favoritos del Navegador

1. Abrir navegador (Chrome/Edge recomendado)
2. Ir a `http://192.168.1.100/caprino`
3. Agregar a favoritos
4. (Opcional) Fijar en barra de tareas

#### 4.3 Modo Kiosko (Opcional)

Para que parezca una aplicación nativa:

```powershell
# Crear acceso directo con Chrome en modo app:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://192.168.1.100/caprino
```

### Paso 5: Configuración Final de Seguridad

#### 5.1 Cambiar Contraseñas

```sql
-- Conectar a Oracle
sqlplus caprino_user/CaprinoPass2025@localhost:1521/XEPDB1

-- Cambiar password del usuario BD
ALTER USER caprino_user IDENTIFIED BY <nueva-contraseña-fuerte>;

-- Cambiar password del usuario admin de la aplicación
-- (Primero crear hash en PHP)
```

```php
<?php
// Generar hash en PHP
echo password_hash('NuevaContraseñaSegura123!', PASSWORD_BCRYPT);
?>
```

```sql
-- Actualizar en BD
UPDATE USUARIO 
SET password_hash = '<hash-generado>' 
WHERE email = 'admin@caprino.local';
COMMIT;
```

#### 5.2 Backup Automático

Crear script de backup diario:

```powershell
# backup-caprino.ps1

$fecha = Get-Date -Format "yyyy-MM-dd"
$backupDir = "C:\Backups-Caprino\$fecha"

# Crear directorio
New-Item -ItemType Directory -Force -Path $backupDir

# Backup de base de datos
expdp caprino_user/CaprinoPass2025@XEPDB1 `
  directory=DATA_PUMP_DIR `
  dumpfile=caprino_$fecha.dmp `
  schemas=CAPRINO_USER

# Copiar fotos
Copy-Item -Recurse C:\xampp\htdocs\caprino\uploads $backupDir\uploads

# Comprimir
Compress-Archive -Path $backupDir -DestinationPath "C:\Backups-Caprino\caprino_$fecha.zip"

# Borrar backup mayor a 30 días
Get-ChildItem C:\Backups-Caprino -Filter *.zip | 
  Where-Object {$_.CreationTime -lt (Get-Date).AddDays(-30)} | 
  Remove-Item
```

Programar con Task Scheduler:

```powershell
# Ejecutar diariamente a las 2 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-File C:\Caprino-Produccion\backup-caprino.ps1"
Register-ScheduledTask -TaskName "Backup Caprino" `
  -Trigger $trigger -Action $action -RunLevel Highest
```

### Paso 6: Manual para el Director

Crear un documento simple:

```markdown
# Manual de Usuario - Sistema Caprino

## Acceso al Sistema

1. Encender la computadora del servidor (PC de la oficina)
2. Esperar 5 minutos a que inicie completamente
3. En tu computadora, hacer doble clic en "Sistema Caprino" del escritorio
4. O abrir navegador y escribir: http://192.168.1.100/caprino

## Credenciales

- Usuario: admin@caprino.local
- Contraseña: [CAMBIAR POR LA QUE CONFIGURES]

## Funciones Principales

### Registrar Animal Nuevo
1. Click en "Registrar Animal"
2. Llenar formulario (código y nombre obligatorios)
3. Subir foto (opcional)
4. Click en "Guardar"

### Buscar Animal
1. Ir a "Inventario de Animales"
2. Usar barra de búsqueda
3. Filtrar por sexo, raza o estado

### Ver Detalles
1. En la lista de animales
2. Click en "Ver Detalles"
3. Ver toda la información

### Editar Animal
1. Click en "Editar"
2. Modificar campos
3. Click en "Guardar"

### Eliminar Animal
1. Click en "Eliminar"
2. Confirmar eliminación

## Problemas Comunes

**No carga la página**
- Verificar que el servidor esté encendido
- Verificar conexión a red local
- Reiniciar navegador

**Olvidé mi contraseña**
- Contactar al administrador del sistema

**Error al guardar**
- Verificar conexión a internet
- Recargar página (F5)
- Contactar soporte si persiste

## Contacto de Soporte

Nombre: [TU NOMBRE]
Teléfono: [TU TELÉFONO]
Email: [TU EMAIL]
```

## 📱 Acceso desde Dispositivos Móviles

El sistema es responsive, funciona en tablets y celulares:

```
http://192.168.1.100/caprino
```

(La misma URL que en PC)

## ✅ Checklist de Deployment

- [ ] Servidor configurado y probado
- [ ] Oracle instalado y corriendo
- [ ] Base de datos creada con todos los scripts
- [ ] Frontend compilado (`npm run build`)
- [ ] Archivos copiados a servidor web
- [ ] XAMPP/IIS configurado y corriendo
- [ ] Firewall configurado
- [ ] IP estática asignada al servidor
- [ ] Contraseñas cambiadas
- [ ] Backup automático configurado
- [ ] Acceso directo creado en PC del director
- [ ] Manual de usuario entregado
- [ ] Prueba completa realizada
- [ ] Capacitación al director realizada

## 🆘 Mantenimiento

### Tareas Diarias (Automáticas)
- ✅ Backup de BD y fotos (2 AM)

### Tareas Semanales
- Verificar espacio en disco
- Revisar logs de errores
- Probar acceso desde todos los dispositivos

### Tareas Mensuales
- Actualizar Windows (servidor)
- Verificar backups (restaurar uno de prueba)
- Revisar rendimiento de BD

### Tareas Anuales
- Cambiar contraseñas
- Limpiar backups antiguos
- Actualizar PHP/Oracle si es necesario

## 💰 Costos de Operación

**Opción 1: Servidor Local (Esta guía)**
- Hardware: $400-800 USD (una vez)
- Electricidad: ~$10-20 USD/mes
- Internet: Incluido en plan actual
- **Total**: $10-20 USD/mes

**Opción 3: Cloud VPS**
- VPS: $10-20 USD/mes
- Dominio: $12 USD/año
- SSL: Gratis (Let's Encrypt)
- **Total**: $11-21 USD/mes

## 📞 Soporte Post-Deployment

Considera ofrecer:
- 1 mes de soporte gratuito
- Capacitación presencial (2-3 horas)
- Manual de usuario
- Contacto para emergencias
- Actualizaciones menores incluidas

---

**Próximo documento**: `04-deployment-portable.md` (para granjas pequeñas sin servidor)
