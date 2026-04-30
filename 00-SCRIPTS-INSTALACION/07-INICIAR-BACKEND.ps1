# ============================================================================
# 07-INICIAR-BACKEND.ps1
# Inicia el servidor PHP del backend en puerto 8000
# Ejecutar: powershell -ExecutionPolicy Bypass -File "07-INICIAR-BACKEND.ps1"
# Dejar corriendo en una terminal. Ctrl+C para detener.
# ============================================================================
# FIXES aplicados:
#   - Reemplazado Tee-Object (bufferiza la salida) por Start-Transcript (tiempo real)
#   - Eliminados emojis que fallan en terminales sin UTF-8
#   - Verifica que el puerto 8000 no este ocupado antes de iniciar
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INICIAR BACKEND - Servidor PHP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH (importante para ver Instant Client y OCI8)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot
$publicDir   = Join-Path $projectRoot "backend-symfony\public"

Write-Host "Raiz publica: $publicDir" -ForegroundColor Gray
Write-Host ""

# ── Verificaciones ────────────────────────────────────────────────────────────
if (-not (Test-Path $publicDir)) {
    Write-Host "[ERROR] Directorio publico no encontrado: $publicDir" -ForegroundColor Red
    exit 1
}

$phpCmd = Get-Command php -ErrorAction SilentlyContinue
if (-not $phpCmd) {
    Write-Host "[ERROR] PHP no encontrado en PATH." -ForegroundColor Red
    Write-Host "Ejecuta 00-INSTALAR-PHP-COMPATIBLE.ps1 primero." -ForegroundColor Yellow
    exit 1
}

# Verificar que OCI8 este cargado (aviso, no bloquea)
$oci8Ok = (& php -m 2>$null) -match "^oci8$"
if (-not $oci8Ok) {
    Write-Host "[AVISO] OCI8 no cargado en PHP — la conexion a Oracle fallara." -ForegroundColor Yellow
    Write-Host "        Ejecuta 03-INSTALAR-OCI8.ps1 si no lo has hecho." -ForegroundColor Yellow
    Write-Host ""
}

# Verificar si el puerto 8000 ya esta en uso
$puerto8000 = netstat -an 2>$null | Select-String ":8000\s.*LISTEN"
if ($puerto8000) {
    Write-Host "[AVISO] El puerto 8000 ya esta en uso." -ForegroundColor Yellow
    Write-Host "        Puede que el backend ya este corriendo, o cierra el proceso que lo usa." -ForegroundColor Yellow
    Write-Host ""
}

# ── Preparar log ──────────────────────────────────────────────────────────────
$logsDir = Join-Path $projectRoot "00-SCRIPTS-INSTALACION\logs"
New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
$logFile = Join-Path $logsDir "backend-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

Write-Host "Log: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host " Puerto : 8000" -ForegroundColor White
Write-Host " URL    : http://localhost:8000" -ForegroundColor White
Write-Host " API    : http://localhost:8000/api" -ForegroundColor White
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor." -ForegroundColor Yellow
Write-Host ""

# FIX: Start-Transcript muestra la salida en tiempo real Y la guarda en el archivo.
# Tee-Object bufferiza la salida de procesos externos y retrasa los mensajes de PHP.
Start-Transcript -Path $logFile -Append | Out-Null

Push-Location $publicDir
php -S localhost:8000 -t .
Pop-Location

Stop-Transcript | Out-Null
