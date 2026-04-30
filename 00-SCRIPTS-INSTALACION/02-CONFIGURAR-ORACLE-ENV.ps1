# ============================================================================
# 02-CONFIGURAR-ORACLE-ENV.ps1
# Configura el wallet de Oracle Autonomous DB y la variable TNS_ADMIN
# Ejecutar como Administrador: powershell -ExecutionPolicy Bypass -File "02-CONFIGURAR-ORACLE-ENV.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURAR WALLET - Oracle Autonomous DB" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script configura la conexion a Oracle Autonomous DB." -ForegroundColor Gray
Write-Host "Necesitas tener el wallet descargado desde Oracle Cloud Console." -ForegroundColor Gray
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot

# ── 1. Verificar Oracle Instant Client ───────────────────────────────────────
Write-Host "[1/4] Verificando Oracle Instant Client..." -ForegroundColor Yellow

$icDir = $null
$candidatosIC = @(
    "C:\oracle\instantclient_21_14",
    "C:\oracle\instantclient_21_13",
    "C:\oracle\instantclient_21_12",
    "C:\oracle\instantclient_21_3",
    "C:\instantclient_21_14",
    "C:\oracle\instantclient"
)

foreach ($c in $candidatosIC) {
    if (Test-Path "$c\oci.dll") { $icDir = $c; break }
}

# Buscar tambien via PATH actual
if (-not $icDir) {
    $ociEnPath = Get-Command oci.dll -ErrorAction SilentlyContinue
    if ($ociEnPath) {
        $icDir = Split-Path -Parent $ociEnPath.Source
    }
}

if ($icDir) {
    Write-Host "  [OK] Instant Client encontrado: $icDir" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Oracle Instant Client no encontrado." -ForegroundColor Red
    Write-Host "  Ejecuta primero: 02-INSTALAR-INSTANT-CLIENT.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ── 2. Ubicar el wallet ───────────────────────────────────────────────────────
Write-Host "[2/4] Ubicando wallet de Oracle Autonomous DB..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  El wallet es un ZIP que descargas desde Oracle Cloud Console:" -ForegroundColor Gray
Write-Host "  ADB -> DB Connection -> Download Wallet" -ForegroundColor Gray
Write-Host "  Extrae el ZIP en una carpeta local (ej: C:\Caprino-Wallet)" -ForegroundColor Gray
Write-Host ""

# Buscar wallet en rutas comunes
$walletCandidatos = @(
    "C:\Caprino-Wallet",
    "C:\oracle\wallet",
    "C:\oracle\adb-wallet",
    "$env:USERPROFILE\wallet",
    "$env:USERPROFILE\Downloads\wallet"
)

$walletEncontrado = $walletCandidatos | Where-Object { Test-Path "$_\tnsnames.ora" } | Select-Object -First 1

if ($walletEncontrado) {
    Write-Host "  Wallet encontrado automaticamente en: $walletEncontrado" -ForegroundColor Green
    $respuesta = Read-Host "  Usar esta ruta? (s/n)"
    if ($respuesta -notmatch "^[sS]$") {
        $walletEncontrado = $null
    }
}

if (-not $walletEncontrado) {
    $walletPath = Read-Host "  Ingresa la ruta donde extrajiste el wallet (ej: C:\Caprino-Wallet)"
    $walletPath = $walletPath.Trim('"').Trim("'")

    if (-not (Test-Path "$walletPath\tnsnames.ora")) {
        Write-Host "  [ERROR] No se encontro tnsnames.ora en: $walletPath" -ForegroundColor Red
        Write-Host "  Verifica que el wallet este extraido correctamente." -ForegroundColor Yellow
        exit 1
    }
    $walletEncontrado = $walletPath
}

Write-Host "  [OK] Wallet valido en: $walletEncontrado" -ForegroundColor Green
Write-Host ""

# ── 3. Actualizar sqlnet.ora con la ruta real del wallet ──────────────────────
Write-Host "[3/4] Actualizando sqlnet.ora..." -ForegroundColor Yellow

$sqlnetPath = Join-Path $walletEncontrado "sqlnet.ora"
$walletEscapado = $walletEncontrado -replace "\\", "\\"

$sqlnetContent = @"
WALLET_LOCATION = (SOURCE = (METHOD = file)(METHOD_DATA = (DIRECTORY="$walletEncontrado")))
SSL_SERVER_DN_MATCH=yes
"@

Set-Content -Path $sqlnetPath -Value $sqlnetContent -Encoding ASCII
Write-Host "  [OK] sqlnet.ora actualizado con WALLET_LOCATION = $walletEncontrado" -ForegroundColor Green
Write-Host ""

# ── 4. Configurar variables de entorno del sistema ────────────────────────────
Write-Host "[4/4] Configurando variables de entorno del sistema..." -ForegroundColor Yellow

[Environment]::SetEnvironmentVariable("TNS_ADMIN", $walletEncontrado, [EnvironmentVariableTarget]::Machine)
$env:TNS_ADMIN = $walletEncontrado
Write-Host "  [OK] TNS_ADMIN = $walletEncontrado" -ForegroundColor Green

# NLS_LANG para manejo correcto de caracteres
[Environment]::SetEnvironmentVariable("NLS_LANG", "AMERICAN_AMERICA.AL32UTF8", [EnvironmentVariableTarget]::Machine)
$env:NLS_LANG = "AMERICAN_AMERICA.AL32UTF8"
Write-Host "  [OK] NLS_LANG  = AMERICAN_AMERICA.AL32UTF8" -ForegroundColor Green

Write-Host ""

# ── Mostrar TNS names disponibles ─────────────────────────────────────────────
Write-Host "Servicios TNS disponibles en el wallet:" -ForegroundColor Cyan
$tnsContent = Get-Content "$walletEncontrado\tnsnames.ora" -ErrorAction SilentlyContinue
$tnsNames = $tnsContent | Where-Object { $_ -match "^\w.*=\s*\(" } | ForEach-Object {
    ($_ -split "=")[0].Trim()
}
if ($tnsNames) {
    $tnsNames | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    $defaultTns = $tnsNames | Where-Object { $_ -match "_high$" } | Select-Object -First 1
    if (-not $defaultTns) { $defaultTns = $tnsNames | Select-Object -First 1 }
} else {
    Write-Host "  (no se pudieron leer — verifica tnsnames.ora)" -ForegroundColor Yellow
    $defaultTns = "caprinodb_high"
}

Write-Host ""
Write-Host "Recomendado para uso general: _high (mas recursos)" -ForegroundColor Gray
Write-Host "Para cargas ligeras: _low o _medium" -ForegroundColor Gray
Write-Host ""

# ── Actualizar .env del backend ───────────────────────────────────────────────
Write-Host "Actualizando backend\.env con la ruta del wallet..." -ForegroundColor Yellow

$backendEnvPath = Join-Path $projectRoot "backend-symfony\.env"
if (Test-Path $backendEnvPath) {
    $envContent = Get-Content $backendEnvPath -Raw
    $walletEscapado2 = $walletEncontrado -replace "\\", "\\"

    $envContent = $envContent -replace '(?m)^DATABASE_WALLET_PATH=.*', "DATABASE_WALLET_PATH=$walletEncontrado"
    if ($defaultTns) {
        $envContent = $envContent -replace '(?m)^DATABASE_TNS_NAME=.*', "DATABASE_TNS_NAME=$defaultTns"
    }
    Set-Content -Path $backendEnvPath -Value $envContent -Encoding UTF8
    Write-Host "  [OK] .env actualizado (DATABASE_WALLET_PATH, DATABASE_TNS_NAME)" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] backend\.env no encontrado — actualiza manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   WALLET CONFIGURADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Instant Client : $icDir" -ForegroundColor Gray
Write-Host "  Wallet         : $walletEncontrado" -ForegroundColor Gray
Write-Host "  TNS_ADMIN      : $walletEncontrado" -ForegroundColor Gray
if ($defaultTns) {
    Write-Host "  TNS default    : $defaultTns" -ForegroundColor Gray
}
Write-Host ""
Write-Host "IMPORTANTE: Abre una nueva terminal para que TNS_ADMIN surta efecto." -ForegroundColor Yellow
Write-Host ""
Write-Host "Siguiente paso: ejecuta 02b-CREAR-USUARIO-ORACLE.ps1" -ForegroundColor Yellow
Write-Host "(crea el usuario y las tablas en tu ADB)" -ForegroundColor Gray
Write-Host ""
