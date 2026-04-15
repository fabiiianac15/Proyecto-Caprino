# ============================================================================
# 08-INICIAR-FRONTEND.ps1
# ============================================================================
# PASO 8: Iniciar servidor Vite del frontend
# Ejecuta como Usuario Normal: powershell -ExecutionPolicy Bypass -File "08-INICIAR-FRONTEND.ps1"
# Dejar corriendo en una NUEVA terminal (diferente de la del backend)
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INICIAR FRONTEND - Servidor Vite (React)                         ║" -ForegroundColor Cyan
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

# Cambiar al directorio
Push-Location $frontendDir

# Verificar que package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json no encontrado" -ForegroundColor Red
    Pop-Location
    Read-Host "Presiona ENTER para salir"
    exit
}

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules no instalado - Ejecuta el script 05 primero" -ForegroundColor Red
    Pop-Location
    Read-Host "Presiona ENTER para salir"
    exit
}

Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor Vite..." -ForegroundColor Yellow
Write-Host "   Puerto: 5173" -ForegroundColor Gray
Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  Para detener el servidor: presiona CTRL+C" -ForegroundColor Yellow
Write-Host ""

# Registrar hora de inicio
$logFile = "$projectRoot\00-SCRIPTS-INSTALACION\logs\frontend-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
New-Item -Path (Split-Path -Parent $logFile) -ItemType Directory -Force | Out-Null

Write-Host "📝 Log: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Gray

npm run dev 2>&1 | Tee-Object -FilePath $logFile

Pop-Location
