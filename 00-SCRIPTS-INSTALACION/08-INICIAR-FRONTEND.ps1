# ============================================================================
# 08-INICIAR-FRONTEND.ps1
# Inicia el servidor Vite del frontend en puerto 5173
# Ejecutar: powershell -ExecutionPolicy Bypass -File "08-INICIAR-FRONTEND.ps1"
# Dejar corriendo en una NUEVA terminal (diferente de la del backend). Ctrl+C para detener.
# ============================================================================
# FIXES aplicados:
#   - Reemplazado Tee-Object (bufferiza la salida) por Start-Transcript (tiempo real)
#   - Eliminados emojis que fallan en terminales sin UTF-8
#   - Verifica que node_modules este instalado
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INICIAR FRONTEND - Servidor Vite (React)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $projectRoot "frontend-web"

Write-Host "Frontend: $frontendDir" -ForegroundColor Gray
Write-Host ""

# ── Verificaciones ────────────────────────────────────────────────────────────
if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] Directorio frontend no encontrado: $frontendDir" -ForegroundColor Red
    exit 1
}

Push-Location $frontendDir

if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json no encontrado en $frontendDir" -ForegroundColor Red
    Pop-Location
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[ERROR] node_modules no instalado." -ForegroundColor Red
    Write-Host "Ejecuta primero: 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "[ERROR] Node.js no encontrado en PATH." -ForegroundColor Red
    Write-Host "Ejecuta primero: 00c-INSTALAR-NODE.ps1" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Write-Host "[OK] Dependencias verificadas" -ForegroundColor Green
Write-Host ""

# ── Preparar log ──────────────────────────────────────────────────────────────
$logsDir = Join-Path $projectRoot "00-SCRIPTS-INSTALACION\logs"
New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
$logFile = Join-Path $logsDir "frontend-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

Write-Host "Log: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host " Puerto : 5173" -ForegroundColor White
Write-Host " URL    : http://localhost:5173" -ForegroundColor White
Write-Host " Backend: http://localhost:8000/api" -ForegroundColor White
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor." -ForegroundColor Yellow
Write-Host ""

# FIX: Start-Transcript muestra la salida en tiempo real Y la guarda en el archivo.
Start-Transcript -Path $logFile -Append | Out-Null

npm run dev

Pop-Location

Stop-Transcript | Out-Null
