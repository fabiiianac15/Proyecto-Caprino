# ============================================================================
# 02b-CREAR-USUARIO-ORACLE.ps1
# Crea el usuario caprino_user en Oracle Autonomous DB y crea las tablas
# Requiere: Instant Client instalado + wallet configurado (TNS_ADMIN)
# Ejecutar: powershell -ExecutionPolicy Bypass -File "02b-CREAR-USUARIO-ORACLE.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CREAR USUARIO Y TABLAS EN ORACLE AUTONOMOUS DB" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH y TNS_ADMIN
$env:Path     = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")
$env:TNS_ADMIN = [System.Environment]::GetEnvironmentVariable("TNS_ADMIN","Machine")
$env:NLS_LANG  = [System.Environment]::GetEnvironmentVariable("NLS_LANG","Machine")
if (-not $env:NLS_LANG) { $env:NLS_LANG = "AMERICAN_AMERICA.AL32UTF8" }

$projectRoot = Split-Path -Parent $PSScriptRoot
$dbScripts   = Join-Path $projectRoot "base-de-datos"

# ── Verificar sqlplus ────────────────────────────────────────────────────────
$sqlplusCmd = Get-Command sqlplus -ErrorAction SilentlyContinue
if (-not $sqlplusCmd) {
    Write-Host "[ERROR] sqlplus no encontrado en PATH." -ForegroundColor Red
    Write-Host "  Ejecuta primero: 02-INSTALAR-INSTANT-CLIENT.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] sqlplus disponible" -ForegroundColor Green

# ── Verificar TNS_ADMIN ───────────────────────────────────────────────────────
if (-not $env:TNS_ADMIN -or -not (Test-Path "$env:TNS_ADMIN\tnsnames.ora")) {
    Write-Host "[ERROR] TNS_ADMIN no configurado o wallet no encontrado." -ForegroundColor Red
    Write-Host "  Ejecuta primero: 02-CONFIGURAR-ORACLE-ENV.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Wallet en: $env:TNS_ADMIN" -ForegroundColor Green
Write-Host ""

# ── Leer TNS name del .env ────────────────────────────────────────────────────
$backendEnvPath = Join-Path $projectRoot "backend-symfony\.env"
$tnsName = "caprinodb_high"
if (Test-Path $backendEnvPath) {
    $envLines = Get-Content $backendEnvPath
    $tnLine   = $envLines | Where-Object { $_ -match "^DATABASE_TNS_NAME=" } | Select-Object -First 1
    if ($tnLine) { $tnsName = ($tnLine -split "=", 2)[1].Trim() }
}
Write-Host "Usando TNS alias: $tnsName" -ForegroundColor Cyan
Write-Host ""

# ── Credenciales del usuario ADMIN de ADB ─────────────────────────────────────
Write-Host "Se necesitan las credenciales del usuario ADMIN de Oracle Autonomous DB." -ForegroundColor Yellow
Write-Host "(Es la password que configuraste al crear el ADB en Oracle Cloud)" -ForegroundColor Gray
Write-Host ""
$adminPwdSecure = Read-Host "Password del usuario ADMIN" -AsSecureString
$adminPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPwdSecure)
)

# Funcion auxiliar: ejecutar SQL en sqlplus via archivo temporal (evita BOM en pipes)
function Invoke-SqlPlus {
    param([string]$ConnStr, [string]$Sql)
    $tmpFile = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), ".sql")
    [System.IO.File]::WriteAllText($tmpFile, $Sql, (New-Object System.Text.UTF8Encoding $false))
    $out = & sqlplus -S $ConnStr "@`"$tmpFile`"" 2>&1
    Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    return $out
}

# ── Verificar conexion ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Verificando conexion a Oracle Autonomous DB..." -ForegroundColor Yellow
Write-Host "  TNS_ADMIN = $env:TNS_ADMIN" -ForegroundColor Gray
Write-Host "  Alias     = $tnsName" -ForegroundColor Gray

$testOutput = Invoke-SqlPlus -ConnStr "ADMIN/`"$adminPwd`"@$tnsName" -Sql "SELECT 'CONEXION_OK' FROM DUAL;`r`nEXIT;"
if ($testOutput -notmatch "CONEXION_OK") {
    Write-Host "[ERROR] No se pudo conectar al ADB." -ForegroundColor Red
    Write-Host "Salida de sqlplus:" -ForegroundColor Yellow
    $testOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  1. La password del usuario ADMIN es correcta" -ForegroundColor Yellow
    Write-Host "  2. El wallet esta configurado (TNS_ADMIN=$env:TNS_ADMIN)" -ForegroundColor Yellow
    Write-Host "  3. El alias '$tnsName' existe en tnsnames.ora" -ForegroundColor Yellow
    Write-Host "  4. Tienes conexion a internet" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Conexion exitosa al Autonomous DB" -ForegroundColor Green
Write-Host ""

# ── PASO 1: Crear usuario caprino_user ───────────────────────────────────────
Write-Host "Paso 1/3: Creando usuario caprino_user..." -ForegroundColor Yellow

# En ADB se usa CREATE USER normal (no SYS/sysdba).
# IDENTIFIED EXTERNALLY AS 'CN=...' es para LDAP  -  aqui usamos password directa.
$caprino_password = "CaprinoPass2025!"
$sqlCrearUsuario = @"
-- Crear usuario de la aplicacion en ADB
CREATE USER caprino_user IDENTIFIED BY "$caprino_password"
  DEFAULT TABLESPACE data
  QUOTA UNLIMITED ON data;

GRANT CONNECT TO caprino_user;
GRANT RESOURCE TO caprino_user;
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

$out1 = Invoke-SqlPlus -ConnStr "ADMIN/`"$adminPwd`"@$tnsName" -Sql $sqlCrearUsuario
# ORA-01920: el usuario ya existe  -  ignorar
$errores1 = $out1 | Select-String "ORA-" | Where-Object { $_ -notmatch "ORA-01920" }
if ($errores1) {
    Write-Host "  [AVISO] $($errores1 -join '; ')" -ForegroundColor Yellow
    Write-Host "  (Si el usuario ya existia esto es normal)" -ForegroundColor Gray
} else {
    Write-Host "  [OK] caprino_user listo" -ForegroundColor Green
}

# Guardar password en .env
if (Test-Path $backendEnvPath) {
    $utf8NoBom  = New-Object System.Text.UTF8Encoding $false
    $envContent = [System.IO.File]::ReadAllText($backendEnvPath, (New-Object System.Text.UTF8Encoding $true))
    if ($envContent.Length -gt 0 -and $envContent[0] -eq [char]0xFEFF) { $envContent = $envContent.Substring(1) }
    $envContent = $envContent -replace '(?m)^DATABASE_USER=.*',     'DATABASE_USER=caprino_user'
    $envContent = $envContent -replace '(?m)^DATABASE_PASSWORD=.*', "DATABASE_PASSWORD=$caprino_password"
    [System.IO.File]::WriteAllText($backendEnvPath, $envContent, $utf8NoBom)
    Write-Host "  [OK] Credenciales guardadas en backend\.env" -ForegroundColor Green
}
Write-Host ""

# ── PASO 2: Ejecutar scripts SQL del esquema ──────────────────────────────────
Write-Host "Paso 2/3: Creando tablas del sistema..." -ForegroundColor Yellow

$scriptsSQL = @(
    @{ archivo = "esquemas\01-tablas-principales.sql";      desc = "Tablas principales" },
    @{ archivo = "esquemas\02-datos-iniciales-razas.sql";   desc = "Razas caprinas" },
    @{ archivo = "esquemas\03-datos-iniciales-usuarios.sql"; desc = "Usuarios iniciales" },
    @{ archivo = "procedimientos\01-triggers-y-funciones.sql"; desc = "Triggers y funciones" },
    @{ archivo = "vistas\01-vistas-reportes.sql";           desc = "Vistas para reportes" }
)

foreach ($s in $scriptsSQL) {
    $rutaSql = Join-Path $dbScripts $s.archivo
    if (-not (Test-Path $rutaSql)) {
        Write-Host "  [AVISO] No encontrado: $($s.archivo)  -  saltando" -ForegroundColor Yellow
        continue
    }
    Write-Host "  Ejecutando: $($s.desc)..." -ForegroundColor Gray
    $outSql = & sqlplus -S "caprino_user/`"$caprino_password`"@$tnsName" "@`"$rutaSql`"" 2>&1
    $errSql = $outSql | Select-String "ORA-" | Where-Object {
        $_ -notmatch "ORA-00955|ORA-01430|ORA-01442|ORA-02260|ORA-02261|ORA-02275|ORA-04043|ORA-00001"
    }
    if ($errSql) {
        Write-Host "  [AVISO] $($errSql -join '; ')" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] $($s.desc)" -ForegroundColor Green
    }
}

Write-Host ""

# ── PASO 3: Verificar tablas creadas ─────────────────────────────────────────
Write-Host "Paso 3/3: Verificando tablas..." -ForegroundColor Yellow
$outVerif = Invoke-SqlPlus -ConnStr "caprino_user/`"$caprino_password`"@$tnsName" -Sql "SELECT COUNT(*) AS TOTAL_TABLAS FROM USER_TABLES;`r`nEXIT;"
$numTablas = ($outVerif | Select-String "^\s*\d+" | Select-Object -First 1) -replace "\s",""
Write-Host "[OK] Tablas en caprino_user: $numTablas" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   BASE DE DATOS CONFIGURADA EN ORACLE AUTONOMOUS DB" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conexion:" -ForegroundColor Cyan
Write-Host "  Usuario  : caprino_user" -ForegroundColor Gray
Write-Host "  Password : $caprino_password" -ForegroundColor Gray
Write-Host "  TNS      : $tnsName" -ForegroundColor Gray
Write-Host "  Wallet   : $env:TNS_ADMIN" -ForegroundColor Gray
Write-Host ""
Write-Host "Credenciales de acceso al sistema:" -ForegroundColor Cyan
Write-Host "  admin@caprino.com / Admin123!" -ForegroundColor Gray
Write-Host ""
