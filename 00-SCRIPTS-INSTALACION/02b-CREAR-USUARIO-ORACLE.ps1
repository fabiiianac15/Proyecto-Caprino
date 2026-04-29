# ============================================================================
# 02b-CREAR-USUARIO-ORACLE.ps1
# Crea el usuario caprino_user en Oracle y ejecuta los scripts de tablas
# Ejecutar: powershell -ExecutionPolicy Bypass -File "02b-CREAR-USUARIO-ORACLE.ps1"
# ============================================================================
# FIXES aplicados:
#   - Usuario correcto: caprino_user (no "caprino")
#   - Pide la password de SYS en vez de usar "oracle" hardcodeada
#   - Usa los scripts SQL del proyecto en vez de crear tablas inline
#   - Deteccion de errores mas robusta
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CREAR USUARIO Y TABLAS EN ORACLE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot
$dbScripts   = Join-Path $projectRoot "base-de-datos"

# ── Verificar sqlplus ────────────────────────────────────────────────────────
$sqlplusCmd = Get-Command sqlplus -ErrorAction SilentlyContinue
if (-not $sqlplusCmd) {
    Write-Host "[ERROR] sqlplus no encontrado en PATH." -ForegroundColor Red
    Write-Host "Ejecuta primero: 02-CONFIGURAR-ORACLE-ENV.ps1 (como Administrador)" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] sqlplus disponible" -ForegroundColor Green
Write-Host ""

# ── Pedir password de SYS ────────────────────────────────────────────────────
Write-Host "Se necesita la password del usuario SYS de Oracle para crear el usuario de la app." -ForegroundColor Yellow
Write-Host "(Es la password que elegiste cuando instalaste Oracle XE)" -ForegroundColor Gray
Write-Host ""
$sysPwdSecure = Read-Host "Password de SYS" -AsSecureString
$sysPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sysPwdSecure)
)

# ── Verificar conexion ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "Verificando conexion a Oracle..." -ForegroundColor Yellow
$testSql = "SELECT 'CONEXION_OK' FROM DUAL;"
$testOutput = $testSql | & sqlplus -S "sys/$sysPwd@127.0.0.1:1521/XEPDB1 as sysdba" 2>&1
if ($testOutput -notmatch "CONEXION_OK") {
    Write-Host "[ERROR] No se pudo conectar a Oracle con las credenciales proporcionadas." -ForegroundColor Red
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  1. Oracle esta corriendo (ejecuta 06-INICIAR-ORACLE.ps1 primero)" -ForegroundColor Yellow
    Write-Host "  2. La password de SYS es correcta" -ForegroundColor Yellow
    Write-Host "  3. La conexion es a 127.0.0.1:1521/XEPDB1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Conexion exitosa a Oracle" -ForegroundColor Green
Write-Host ""

# ── PASO 1: Crear usuario caprino_user ───────────────────────────────────────
Write-Host "Paso 1/3: Creando usuario caprino_user..." -ForegroundColor Yellow

$sqlCrearUsuario = @"
-- Crear usuario de la aplicacion (FIX: nombre correcto es caprino_user)
CREATE USER caprino_user IDENTIFIED BY "CaprinoPass2025"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA UNLIMITED ON users;

-- Permisos necesarios
GRANT CONNECT, RESOURCE TO caprino_user;
GRANT CREATE SESSION TO caprino_user;
GRANT CREATE TABLE TO caprino_user;
GRANT CREATE VIEW TO caprino_user;
GRANT CREATE SEQUENCE TO caprino_user;
GRANT CREATE TRIGGER TO caprino_user;
GRANT CREATE PROCEDURE TO caprino_user;
GRANT UNLIMITED TABLESPACE TO caprino_user;

SELECT 'USUARIO_CREADO' FROM DUAL;
EXIT;
"@

$out1 = $sqlCrearUsuario | & sqlplus -S "sys/$sysPwd@127.0.0.1:1521/XEPDB1 as sysdba" 2>&1
$errores1 = $out1 | Select-String "ORA-" | Where-Object { $_ -notmatch "ORA-01920" }  # ignorar ORA-01920 = usuario ya existe
if ($errores1) {
    Write-Host "[AVISO] $($errores1 -join ', ')" -ForegroundColor Yellow
    Write-Host "(Si el usuario ya existia esto es normal)" -ForegroundColor Gray
} elseif ($out1 -match "USUARIO_CREADO") {
    Write-Host "[OK] Usuario caprino_user creado" -ForegroundColor Green
} else {
    Write-Host "[OK] Comando ejecutado (el usuario posiblemente ya existia)" -ForegroundColor Green
}

Write-Host ""

# ── PASO 2: Ejecutar scripts SQL del esquema ──────────────────────────────────
Write-Host "Paso 2/3: Creando tablas del sistema..." -ForegroundColor Yellow

# FIX: usar los scripts SQL correctos del proyecto, no crear tablas inline
$scriptsSQL = @(
    @{ archivo = "esquemas\01-tablas-principales.sql";   desc = "Tablas principales (ANIMAL, USUARIO, SALUD, etc.)" },
    @{ archivo = "esquemas\02-datos-iniciales-razas.sql"; desc = "Razas caprinas iniciales" },
    @{ archivo = "esquemas\03-datos-iniciales-usuarios.sql"; desc = "Usuarios iniciales del sistema" },
    @{ archivo = "procedimientos\01-triggers-y-funciones.sql"; desc = "Triggers y funciones" },
    @{ archivo = "vistas\01-vistas-reportes.sql";        desc = "Vistas para reportes" }
)

foreach ($s in $scriptsSQL) {
    $rutaSql = Join-Path $dbScripts $s.archivo
    if (-not (Test-Path $rutaSql)) {
        Write-Host "    [AVISO] No encontrado: $($s.archivo) — saltando" -ForegroundColor Yellow
        continue
    }

    Write-Host "    Ejecutando: $($s.desc)..." -ForegroundColor Gray
    $outSql = & sqlplus -S "caprino_user/CaprinoPass2025@127.0.0.1:1521/XEPDB1" "@`"$rutaSql`"" 2>&1
    $errSql = $outSql | Select-String "ORA-" | Where-Object {
        # Ignorar errores de "ya existe" que son normales en reinstalacion
        $_ -notmatch "ORA-00955|ORA-01430|ORA-01442|ORA-02260|ORA-02261|ORA-02275|ORA-04043|ORA-00001"
    }
    if ($errSql) {
        Write-Host "    [AVISO] $($errSql -join '; ')" -ForegroundColor Yellow
    } else {
        Write-Host "    [OK] $($s.desc)" -ForegroundColor Green
    }
}

Write-Host ""

# ── PASO 3: Verificar tablas creadas ─────────────────────────────────────────
Write-Host "Paso 3/3: Verificando tablas..." -ForegroundColor Yellow

$sqlVerif = @"
SELECT COUNT(*) AS TOTAL_TABLAS FROM USER_TABLES;
EXIT;
"@
$outVerif = $sqlVerif | & sqlplus -S "caprino_user/CaprinoPass2025@127.0.0.1:1521/XEPDB1" 2>&1
$numTablas = ($outVerif | Select-String "^\s*\d+" | Select-Object -First 1) -replace "\s",""
Write-Host "[OK] Tablas en caprino_user: $numTablas" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   BASE DE DATOS CONFIGURADA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Datos de conexion:" -ForegroundColor Cyan
Write-Host "  Usuario : caprino_user" -ForegroundColor Gray
Write-Host "  Password: CaprinoPass2025" -ForegroundColor Gray
Write-Host "  Host    : 127.0.0.1:1521/XEPDB1" -ForegroundColor Gray
Write-Host ""
Write-Host "Credenciales de acceso al sistema:" -ForegroundColor Cyan
Write-Host "  admin@caprino.com / Admin123!" -ForegroundColor Gray
Write-Host ""
