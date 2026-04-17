# ============================================================================
# 00-INSTALAR-PHP-COMPATIBLE.ps1
# ============================================================================
# PASO 0: Instalar y configurar PHP compatible para Proyecto Caprino
# Ejecutar: powershell -ExecutionPolicy Bypass -File "00-INSTALAR-PHP-COMPATIBLE.ps1"
# ============================================================================

param(
    [string]$PhpVersion = "8.2.29",
    [string]$InstallDir = "$env:LOCALAPPDATA\Programs\php82",
    [switch]$Force
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " INSTALAR PHP COMPATIBLE - Proyecto Caprino" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASO 1: DETECTAR REQUISITOS
# ============================================================================

$projectRoot = Split-Path -Parent $PSScriptRoot
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
Write-Host "Version a instalar: $PhpVersion" -ForegroundColor Cyan
Write-Host "Directorio destino: $InstallDir" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASO 2: VERIFICAR SI PHP YA EXISTE
# ============================================================================

$phpExe = Join-Path $InstallDir "php.exe"
$alreadyInstalled = $false

if (Test-Path $phpExe) {
    try {
        $currentVersion = & $phpExe -r "echo PHP_VERSION;"
        Write-Host "PHP ya instalado: $currentVersion" -ForegroundColor Yellow
        $alreadyInstalled = $true
    } catch {
        Write-Host "PHP encontrado pero no responde" -ForegroundColor Yellow
        $alreadyInstalled = $false
    }
}

# ============================================================================
# PASO 3: DESCARGAR E INSTALAR PHP (si es necesario)
# ============================================================================

if (-not $alreadyInstalled -or $Force) {
    Write-Host "Iniciando descarga de PHP $PhpVersion..." -ForegroundColor Yellow
    
    $zipName = "php-$PhpVersion-Win32-vs16-x64.zip"
    $tempZip = Join-Path $env:TEMP $zipName
    $primaryUrl = "https://windows.php.net/downloads/releases/$zipName"
    $archiveUrl = "https://windows.php.net/downloads/releases/archives/$zipName"
    
    $downloadSuccess = $false
    
    try {
        Write-Host "Intentando descargar desde releases..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $primaryUrl -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
        $downloadSuccess = $true
        Write-Host "OK: Descargado desde releases" -ForegroundColor Green
    } catch {
        Write-Host "No disponible en releases, intentando archives..." -ForegroundColor Yellow
    }
    
    if (-not $downloadSuccess) {
        try {
            Invoke-WebRequest -Uri $archiveUrl -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
            $downloadSuccess = $true
            Write-Host "OK: Descargado desde archives" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: No se pudo descargar PHP $PhpVersion" -ForegroundColor Red
            exit 1
        }
    }
    
    if (-not (Test-Path $tempZip)) {
        Write-Host "ERROR: Descarga incompleta" -ForegroundColor Red
        exit 1
    }
    
    # Crear directorio de destino si no existe
    if (-not (Test-Path $InstallDir)) {
        New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
    }
    
    # Limpiar destino si existe
    if ((Get-ChildItem $InstallDir -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0) {
        Write-Host "Limpiando directorio de destino..." -ForegroundColor Yellow
        Get-ChildItem $InstallDir -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "Extrayendo PHP a $InstallDir..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZip -DestinationPath $InstallDir -Force
    
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Write-Host "OK: PHP instalado exitosamente" -ForegroundColor Green
    
} else {
    Write-Host "PHP ya existe, saltando descarga/instalacion (usa -Force para reinstalar)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# PASO 4: CONFIGURAR php.ini
# ============================================================================

$iniPath = Join-Path $InstallDir "php.ini"
Write-Host "Configurando php.ini..." -ForegroundColor Yellow

if (-not (Test-Path $iniPath)) {
    $iniDev = Join-Path $InstallDir "php.ini-development"
    $iniProd = Join-Path $InstallDir "php.ini-production"
    
    if (Test-Path $iniDev) {
        Copy-Item $iniDev $iniPath -Force
        Write-Host "OK: Creado desde php.ini-development" -ForegroundColor Green
    } elseif (Test-Path $iniProd) {
        Copy-Item $iniProd $iniPath -Force
        Write-Host "OK: Creado desde php.ini-production" -ForegroundColor Green
    } else {
        New-Item -Path $iniPath -ItemType File -Force | Out-Null
        Write-Host "OK: Creado archivo php.ini vacio" -ForegroundColor Green
    }
} else {
    Write-Host "OK: php.ini ya existe" -ForegroundColor Green
}

# Leer y modificar php.ini
$iniContent = Get-Content $iniPath -Raw

# Configurar extension_dir
if ($iniContent -match ';\s*extension_dir\s*=') {
    $iniContent = $iniContent -replace ';\s*extension_dir\s*=\s*"ext"', 'extension_dir="ext"'
} elseif ($iniContent -notmatch 'extension_dir') {
    $iniContent += [Environment]::NewLine + 'extension_dir="ext"'
}

# Configurar timezone
if ($iniContent -match ';\s*date\.timezone\s*=') {
    $iniContent = $iniContent -replace ';\s*date\.timezone\s*=.*', 'date.timezone="America/Lima"'
} elseif ($iniContent -notmatch 'date\.timezone') {
    $iniContent += [Environment]::NewLine + 'date.timezone="America/Lima"'
}

# Guardar php.ini
Set-Content -Path $iniPath -Value $iniContent -Encoding UTF8 -NoNewline
Write-Host "OK: php.ini configurado (extension_dir y timezone)" -ForegroundColor Green

Write-Host ""

# ============================================================================
# PASO 5: CONFIGURAR VARIABLES DE ENTORNO
# ============================================================================

Write-Host "Configurando variables de entorno..." -ForegroundColor Yellow

[Environment]::SetEnvironmentVariable("PHP_HOME", $InstallDir, [EnvironmentVariableTarget]::User)
$env:PHP_HOME = $InstallDir
Write-Host "OK: PHP_HOME configurado" -ForegroundColor Green

# Agregar al PATH si no esta
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
$pathEntries = $currentUserPath -split ";" | Where-Object { $_ -ne "" }
$phpDirInPath = $false

foreach ($entry in $pathEntries) {
    if ($entry.TrimEnd("\") -ieq $InstallDir.TrimEnd("\")) {
        $phpDirInPath = $true
        break
    }
}

if (-not $phpDirInPath) {
    $newPath = "$currentUserPath;$InstallDir"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    $env:Path = "$env:Path;$InstallDir"
    Write-Host "OK: Ruta PHP agregada al PATH" -ForegroundColor Green
} else {
    Write-Host "OK: Ruta PHP ya esta en PATH" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# PASO 6: VALIDAR INSTALACION
# ============================================================================

Write-Host "Validando instalacion..." -ForegroundColor Yellow

if (-not (Test-Path $phpExe)) {
    Write-Host "ERROR: No se encontro php.exe" -ForegroundColor Red
    exit 1
}

$phpVersionLine = & $phpExe -v | Select-Object -First 1
Write-Host "OK: $phpVersionLine" -ForegroundColor Green

$modules = & $phpExe -m

if ($modules -contains "ctype") {
    Write-Host "OK: extension ctype disponible" -ForegroundColor Green
} else {
    Write-Host "AVISO: ctype no aparece en modulos" -ForegroundColor Yellow
}

if ($modules -contains "iconv") {
    Write-Host "OK: extension iconv disponible" -ForegroundColor Green
} else {
    Write-Host "AVISO: iconv no aparece en modulos" -ForegroundColor Yellow
}

if ($modules -contains "oci8") {
    Write-Host "OK: extension oci8 ya cargada" -ForegroundColor Green
} else {
    Write-Host "AVISO: oci8 aun no cargada (ejecuta 03-INSTALAR-OCI8.ps1 despues)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " INSTALACION FINALIZADA CON EXITO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Cyan
Write-Host "1) Cierra y reabre PowerShell para aplicar cambios de PATH" -ForegroundColor White
Write-Host "2) Ejecuta 02-CONFIGURAR-ORACLE-ENV.ps1" -ForegroundColor White
Write-Host "3) Ejecuta 03-INSTALAR-OCI8.ps1" -ForegroundColor White
Write-Host ""

Read-Host "Presiona ENTER para continuar"
