# ============================================================================
# 04-INSTALAR-DEPENDENCIAS-BACKEND.ps1
# ============================================================================
# PASO 4: Instalar dependencias del backend (Composer)
# Ejecuta como Administrador: powershell -ExecutionPolicy Bypass -File "04-INSTALAR-DEPENDENCIAS-BACKEND.ps1"
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INSTALAR DEPENDENCIAS BACKEND - Composer                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Ruta del proyecto
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendDir = "$projectRoot\backend-symfony"

Write-Host "📍 Directorio del backend: $backendDir" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el directorio
if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Directorio del backend no encontrado: $backendDir" -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit
}

# Cambiar al directorio del backend
Push-Location $backendDir

Write-Host "🔍 Verificando Composer..." -ForegroundColor Yellow
try {
    $composerVersion = composer --version 2>$null
    Write-Host "✅ Composer encontrado: $composerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Composer no está instalado" -ForegroundColor Red
    Write-Host "Descarga desde: https://getcomposer.org/download/" -ForegroundColor Yellow
    Pop-Location
    Read-Host "Presiona ENTER para salir"
    exit
}

Write-Host ""
Write-Host "🗑️  Limpiando archivos anteriores..." -ForegroundColor Yellow
if (Test-Path "composer.lock") {
    Remove-Item "composer.lock" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ composer.lock eliminado" -ForegroundColor Green
}

if (Test-Path "vendor") {
    Write-Host "⚠️  Carpeta vendor será reemplazada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📥 Instalando dependencias con Composer..." -ForegroundColor Yellow
Write-Host "   (Esta operación puede tardar varios minutos...)" -ForegroundColor Gray
Write-Host ""

composer install --ignore-platform-req=php --ignore-platform-req=ext-sodium

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Hubo un error instalando dependencias" -ForegroundColor Red
    Write-Host "Revisa los mensajes de error arriba" -ForegroundColor Red
    Pop-Location
    Read-Host "Presiona ENTER para salir"
    exit
}

Write-Host ""
Write-Host "✅ vendor/autoload.php existe: $(Test-Path 'vendor/autoload.php')" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Dependencias del backend instaladas                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Read-Host "Presiona ENTER para continuar"
