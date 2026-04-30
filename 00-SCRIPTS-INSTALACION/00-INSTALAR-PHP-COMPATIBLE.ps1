# ============================================================================
# 00-INSTALAR-PHP-COMPATIBLE.ps1
# Descarga, instala y configura PHP 8.2 para Proyecto Caprino
# Ejecutar: powershell -ExecutionPolicy Bypass -File "00-INSTALAR-PHP-COMPATIBLE.ps1"
# ============================================================================
# FIXES aplicados:
#   - Timezone corregida a America/Bogota (Colombia)
#   - Eliminado Read-Host bloqueante al final (permite llamada desde script maestro)
#   - NTS detectado y documentado (la version TS es valida para CLI y es la default)
# ============================================================================

param(
    [string]$PhpVersion = "8.2.29",
    [string]$InstallDir = "$env:LOCALAPPDATA\Programs\php82",
    [switch]$Force
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALAR PHP COMPATIBLE - Proyecto Caprino" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot  = Split-Path -Parent $PSScriptRoot
$composerPath = Join-Path $projectRoot "backend-symfony\composer.json"

if (Test-Path $composerPath) {
    $composerContent = Get-Content $composerPath -Raw
    if ($composerContent -match '"php"\s*:\s*"([^"]+)"') {
        $phpRequirement = $matches[1]
    } else {
        $phpRequirement = ">=8.1"
    }
} else {
    $phpRequirement = ">=8.1"
}

Write-Host "Requisito de PHP detectado: $phpRequirement" -ForegroundColor Cyan
Write-Host "Version a instalar        : $PhpVersion (Thread Safe, VC16, x64)" -ForegroundColor Cyan
Write-Host "Directorio destino        : $InstallDir" -ForegroundColor Cyan
Write-Host ""

# ── Verificar si PHP ya existe ────────────────────────────────────────────────
$phpExe          = Join-Path $InstallDir "php.exe"
$alreadyInstalled = $false

if (Test-Path $phpExe) {
    try {
        $currentVersion = & $phpExe -r "echo PHP_VERSION;" 2>$null
        Write-Host "[OK] PHP $currentVersion ya instalado en $InstallDir" -ForegroundColor Green
        $alreadyInstalled = $true
    } catch {
        Write-Host "[AVISO] PHP encontrado pero no responde  -  se reinstalara" -ForegroundColor Yellow
    }
}

# ── Descargar e instalar PHP ──────────────────────────────────────────────────
if (-not $alreadyInstalled -or $Force) {
    Write-Host "Descargando PHP $PhpVersion..." -ForegroundColor Yellow

    # Thread Safe (TS) funciona para CLI y para IIS; NTS seria para Apache mod_php
    $zipName    = "php-$PhpVersion-Win32-vs16-x64.zip"
    $tempZip    = Join-Path $env:TEMP $zipName
    $urlCurrent = "https://windows.php.net/downloads/releases/$zipName"
    $urlArchive = "https://windows.php.net/downloads/releases/archives/$zipName"

    $downloadOk = $false

    try {
        Write-Host "  Intentando desde releases..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $urlCurrent -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
        $downloadOk = $true
        Write-Host "  [OK] Descargado desde releases" -ForegroundColor Green
    } catch {
        Write-Host "  No en releases, intentando archives..." -ForegroundColor Gray
    }

    if (-not $downloadOk) {
        try {
            Invoke-WebRequest -Uri $urlArchive -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
            $downloadOk = $true
            Write-Host "  [OK] Descargado desde archives" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] No se pudo descargar PHP $PhpVersion desde windows.php.net" -ForegroundColor Red
            exit 1
        }
    }

    if (-not (Test-Path $tempZip) -or (Get-Item $tempZip).Length -lt 1MB) {
        Write-Host "[ERROR] Descarga incompleta o corrupta" -ForegroundColor Red
        exit 1
    }

    # Crear directorio y extraer
    if (-not (Test-Path $InstallDir)) {
        New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
    }

    # Limpiar directorio si ya tiene contenido
    if ((Get-ChildItem $InstallDir -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0) {
        Write-Host "Limpiando instalacion anterior..." -ForegroundColor Yellow
        Get-ChildItem $InstallDir -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Extrayendo PHP a $InstallDir..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZip -DestinationPath $InstallDir -Force
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] PHP extraido" -ForegroundColor Green
} else {
    Write-Host "PHP ya existe  -  saltando descarga (usa -Force para reinstalar)" -ForegroundColor Yellow
}

Write-Host ""

# ── Configurar php.ini ────────────────────────────────────────────────────────
Write-Host "Configurando php.ini..." -ForegroundColor Yellow

$iniPath = Join-Path $InstallDir "php.ini"

if (-not (Test-Path $iniPath)) {
    $iniDev  = Join-Path $InstallDir "php.ini-development"
    $iniProd = Join-Path $InstallDir "php.ini-production"

    if (Test-Path $iniDev) {
        Copy-Item $iniDev $iniPath -Force
        Write-Host "  Creado desde php.ini-development" -ForegroundColor Gray
    } elseif (Test-Path $iniProd) {
        Copy-Item $iniProd $iniPath -Force
        Write-Host "  Creado desde php.ini-production" -ForegroundColor Gray
    } else {
        New-Item -Path $iniPath -ItemType File -Force | Out-Null
        Write-Host "  Creado php.ini en blanco" -ForegroundColor Gray
    }
}

$iniContent = Get-Content $iniPath -Raw

# Habilitar extension_dir
if ($iniContent -match '(?m)^\s*;\s*extension_dir\s*=\s*"ext"') {
    $iniContent = $iniContent -replace '(?m)^\s*;\s*extension_dir\s*=\s*"ext"', 'extension_dir="ext"'
} elseif ($iniContent -notmatch '(?m)^extension_dir') {
    $iniContent += "`r`nextension_dir=`"ext`"`r`n"
}

# FIX: timezone Colombia (no Peru)
if ($iniContent -match '(?m)^\s*;?\s*date\.timezone\s*=') {
    $iniContent = $iniContent -replace '(?m)^\s*;?\s*date\.timezone\s*=.*', 'date.timezone="America/Bogota"'
} elseif ($iniContent -notmatch '(?m)^date\.timezone') {
    $iniContent += "`r`ndate.timezone=`"America/Bogota`"`r`n"
}

Set-Content -Path $iniPath -Value $iniContent -Encoding ASCII
Write-Host "[OK] php.ini configurado (extension_dir, timezone=America/Bogota)" -ForegroundColor Green

Write-Host ""

# ── Configurar variables de entorno ───────────────────────────────────────────
Write-Host "Configurando variables de entorno..." -ForegroundColor Yellow

[Environment]::SetEnvironmentVariable("PHP_HOME", $InstallDir, [EnvironmentVariableTarget]::User)
$env:PHP_HOME = $InstallDir
Write-Host "[OK] PHP_HOME = $InstallDir" -ForegroundColor Green

$userPath    = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
$pathEntries = $userPath -split ";" | Where-Object { $_ -ne "" }

$phpEnPath = $pathEntries | Where-Object { $_.TrimEnd("\") -ieq $InstallDir.TrimEnd("\") }
if (-not $phpEnPath) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$InstallDir", [EnvironmentVariableTarget]::User)
    $env:Path = "$env:Path;$InstallDir"
    Write-Host "[OK] PHP agregado al PATH de usuario" -ForegroundColor Green
} else {
    Write-Host "[OK] PHP ya estaba en el PATH" -ForegroundColor Green
}

# Refrescar PATH en la sesion actual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""

# ── Validar instalacion ───────────────────────────────────────────────────────
Write-Host "Validando instalacion..." -ForegroundColor Yellow

if (-not (Test-Path $phpExe)) {
    Write-Host "[ERROR] php.exe no encontrado en $InstallDir" -ForegroundColor Red
    exit 1
}

$phpLine = & $phpExe -v 2>$null | Select-Object -First 1
Write-Host "[OK] $phpLine" -ForegroundColor Green

$modulos = & $phpExe -m 2>$null
foreach ($ext in @("ctype", "iconv", "mbstring", "openssl")) {
    if ($modulos -contains $ext) {
        Write-Host "[OK] Extension $ext disponible" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Extension $ext no cargada (puede ser normal segun la build)" -ForegroundColor Yellow
    }
}

if ($modulos -contains "oci8") {
    Write-Host "[OK] OCI8 ya cargado" -ForegroundColor Green
} else {
    Write-Host "[INFO] OCI8 no cargado aun  -  ejecuta 02-CONFIGURAR-ORACLE-ENV.ps1 y 03-INSTALAR-OCI8.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PHP INSTALADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Version : $phpLine" -ForegroundColor Gray
Write-Host "  Ruta    : $InstallDir" -ForegroundColor Gray
Write-Host "  php.ini : $iniPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Cyan
Write-Host "  1. Ejecutar: 02-CONFIGURAR-ORACLE-ENV.ps1 (como Administrador)" -ForegroundColor White
Write-Host "  2. Ejecutar: 03-INSTALAR-OCI8.ps1" -ForegroundColor White
Write-Host "  3. Ejecutar: 03b-INSTALAR-COMPOSER.ps1" -ForegroundColor White
Write-Host ""
