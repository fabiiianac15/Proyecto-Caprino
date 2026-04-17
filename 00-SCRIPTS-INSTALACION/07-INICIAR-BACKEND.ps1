# ============================================================================
# 07-INICIAR-BACKEND.ps1
# ============================================================================
# PASO 7: Iniciar servidor PHP del backend
# Ejecuta como Usuario Normal: powershell -ExecutionPolicy Bypass -File "07-INICIAR-BACKEND.ps1"
# Dejar corriendo en una terminal
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INICIAR BACKEND - Servidor PHP                                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH con variables de entorno del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Ruta del proyecto
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = "$projectRoot\backend-symfony"
$publicDir = "$backendDir\public"

Write-Host "📍 Directorio del backend: $backendDir" -ForegroundColor Cyan
Write-Host "📍 Raíz pública: $publicDir" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el directorio
if (-not (Test-Path $publicDir)) {
    Write-Host "❌ Directorio público no encontrado: $publicDir" -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit
}

# Cambiar al directorio
Push-Location $publicDir

Write-Host "✅ Directorio configurado" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor PHP..." -ForegroundColor Yellow
Write-Host "   Puerto: 8000" -ForegroundColor Gray
Write-Host "   URL: http://localhost:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  Para detener el servidor: presiona CTRL+C" -ForegroundColor Yellow
Write-Host ""

# Registrar hora de inicio
$logFile = "$projectRoot\00-SCRIPTS-INSTALACION\logs\backend-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
New-Item -Path (Split-Path -Parent $logFile) -ItemType Directory -Force | Out-Null

Write-Host "📝 Log: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Gray

php -S localhost:8000 -t . 2>&1 | Tee-Object -FilePath $logFile

Pop-Location
