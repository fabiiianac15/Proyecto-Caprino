# ============================================================================
# 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1
# ============================================================================
# PASO 5: Instalar dependencias del frontend (npm)
# Ejecuta como Usuario Normal: powershell -ExecutionPolicy Bypass -File "05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1"
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INSTALAR DEPENDENCIAS FRONTEND - npm                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Ruta del proyecto
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$frontendDir = "$projectRoot\frontend-web"

Write-Host "📍 Directorio del frontend: $frontendDir" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el directorio
if (-not (Test-Path $frontendDir)) {
    Write-Host "❌ Directorio del frontend no encontrado: $frontendDir" -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit
}

# Cambiar al directorio del frontend
Push-Location $frontendDir

Write-Host "🔍 Verificando Node.js y npm..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>$null
    $npmVersion = npm -v 2>$null
    Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
    Write-Host "✅ npm $npmVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js o npm no están instalados" -ForegroundColor Red
    Write-Host "Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    Pop-Location
    Read-Host "Presiona ENTER para salir"
    exit
}

Write-Host ""
Write-Host "🗑️  Limpiando instalación anterior..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "⚠️  Carpeta node_modules será reemplazada (puede tardar...)" -ForegroundColor Yellow
}

if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📥 Instalando dependencias con npm..." -ForegroundColor Yellow
Write-Host "   (Esta operación puede tardar 2-5 minutos...)" -ForegroundColor Gray
Write-Host ""

npm install

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
Write-Host "✅ node_modules existe: $(Test-Path 'node_modules')" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Dependencias del frontend instaladas                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Read-Host "Presiona ENTER para continuar"
