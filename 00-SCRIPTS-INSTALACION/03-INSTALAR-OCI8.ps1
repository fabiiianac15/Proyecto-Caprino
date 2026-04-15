# ============================================================================
# 03-INSTALAR-OCI8.ps1
# ============================================================================
# PASO 3: Descargar e instalar extensión OCI8 para PHP
# Ejecuta como Administrador: powershell -ExecutionPolicy Bypass -File "03-INSTALAR-OCI8.ps1"
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INSTALAR OCI8 - Extensión Oracle para PHP 8.2                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Detectar ruta de PHP
$phpPath = (Get-Command php -ErrorAction SilentlyContinue).Source
if (-not $phpPath) {
    Write-Host "❌ PHP no encontrado en el PATH" -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit
}

$phpDir = Split-Path -Parent $phpPath
$extDir = "$phpDir\ext"
$iniFile = "$phpDir\php.ini"

Write-Host "📍 Ruta PHP: $phpDir" -ForegroundColor Cyan
Write-Host "📍 Extensiones: $extDir" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el directorio ext
if (-not (Test-Path $extDir)) {
    Write-Host "❌ Directorio de extensiones no encontrado: $extDir" -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit
}

Write-Host "🔍 Verificando si OCI8 ya está instalado..." -ForegroundColor Yellow
$oci8Files = Get-ChildItem $extDir -Filter "php_oci8*.dll" -ErrorAction SilentlyContinue
if ($oci8Files) {
    Write-Host "✅ OCI8 DLL ya existe:" -ForegroundColor Green
    $oci8Files | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Green }
} else {
    Write-Host "⚠️  OCI8 DLL no encontrada - Descargando..." -ForegroundColor Yellow
    
    # Descargar OCI8 3.3.0 para PHP 8.2 (Thread Safe)
    $url = "https://windows.php.net/downloads/pecl/releases/oci8/3.3.0/php_oci8-3.3.0-8.2-ts-vc16-x64.dll"
    $outputFile = "$extDir\php_oci8-3.3.0-8.2-ts-vc16-x64.dll"
    
    Write-Host "📥 Descargando desde: $url" -ForegroundColor Yellow
    try {
        (New-Object Net.WebClient).DownloadFile($url, $outputFile)
        Write-Host "✅ OCI8 DLL descargada exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error descargando OCI8: $_" -ForegroundColor Red
        Write-Host "Descarga manual desde: $url" -ForegroundColor Yellow
        Read-Host "Presiona ENTER para salir"
        exit
    }
}

Write-Host ""
Write-Host "📝 Verificando configuración en php.ini..." -ForegroundColor Yellow

if (-not (Test-Path $iniFile)) {
    Write-Host "❌ php.ini no encontrado en: $iniFile" -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit
}

$iniContent = Get-Content $iniFile -Raw
if ($iniContent -match "extension\s*=\s*oci8") {
    Write-Host "✅ OCI8 ya está habilitado en php.ini" -ForegroundColor Green
} else {
    Write-Host "📝 Habilitando OCI8 en php.ini..." -ForegroundColor Yellow
    
    # Agregar línea de extensión si no existe
    if ($iniContent -notmatch "^\[Dynamic Extensions\]") {
        Add-Content -Path $iniFile -Value "`n[Dynamic Extensions]`nextension=oci8"
        Write-Host "✅ OCI8 agregado a php.ini" -ForegroundColor Green
    } else {
        Add-Content -Path $iniFile -Value "extension=oci8"
        Write-Host "✅ OCI8 agregado a php.ini" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔍 Verificando que OCI8 se carga correctamente..." -ForegroundColor Yellow
$modulesList = php -m 2>$null
if ($modulesList | Select-String "oci8") {
    Write-Host "✅ OCI8 se carga correctamente en PHP" -ForegroundColor Green
} else {
    Write-Host "⚠️  OCI8 aún no se carga - Reinicia PowerShell completamente" -ForegroundColor Yellow
    Write-Host "   Cierra esta ventana y abre una NUEVA ventana de PowerShell" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ OCI8 instalado y configurado                                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Read-Host "Presiona ENTER para continuar"
