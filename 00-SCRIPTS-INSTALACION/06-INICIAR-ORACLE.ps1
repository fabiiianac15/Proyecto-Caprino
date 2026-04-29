# ============================================================================
# 06-INICIAR-ORACLE.ps1
# Verifica e inicia el servicio Oracle XE
# Ejecutar como Administrador: powershell -ExecutionPolicy Bypass -File "06-INICIAR-ORACLE.ps1"
# ============================================================================
# FIXES aplicados:
#   - Eliminados Read-Host bloqueantes (permite llamada desde script maestro)
#   - Espera hasta 30s a que el servicio este Running antes de reportar exito
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INICIAR ORACLE XE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$oracleService = "OracleServiceXE"

Write-Host "Buscando servicio: $oracleService..." -ForegroundColor Yellow
$service = Get-Service -Name $oracleService -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "[ERROR] Servicio '$oracleService' no encontrado." -ForegroundColor Red
    Write-Host "Verifica que Oracle XE 21c este instalado correctamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Servicio encontrado (estado: $($service.Status))" -ForegroundColor Green
Write-Host ""

if ($service.Status -eq "Running") {
    Write-Host "[OK] Oracle ya esta corriendo" -ForegroundColor Green
} else {
    Write-Host "Iniciando $oracleService..." -ForegroundColor Yellow
    try {
        Start-Service -Name $oracleService -ErrorAction Stop

        # Esperar hasta 30 segundos a que el servicio arranque
        $intentos = 0
        do {
            Start-Sleep -Seconds 3
            $intentos++
            $service = Get-Service -Name $oracleService
            Write-Host "  Esperando... ($($service.Status))" -ForegroundColor Gray
        } while ($service.Status -ne "Running" -and $intentos -lt 10)

        if ($service.Status -eq "Running") {
            Write-Host "[OK] Oracle iniciado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] Oracle no alcanzo el estado Running en 30 segundos." -ForegroundColor Yellow
            Write-Host "Intenta iniciarlo manualmente:" -ForegroundColor Yellow
            Write-Host "  services.msc -> OracleServiceXE -> Click derecho -> Iniciar" -ForegroundColor Gray
        }
    } catch {
        Write-Host "[ERROR] No se pudo iniciar Oracle: $_" -ForegroundColor Red
        Write-Host "Asegurate de ejecutar este script como Administrador." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# ── Verificar sqlplus en PATH ─────────────────────────────────────────────────
Write-Host "Verificando sqlplus..." -ForegroundColor Yellow
$sqlp = Get-Command sqlplus -ErrorAction SilentlyContinue
if ($sqlp) {
    Write-Host "[OK] sqlplus disponible: $($sqlp.Source)" -ForegroundColor Green
} else {
    Write-Host "[AVISO] sqlplus no esta en PATH — ejecuta 02-CONFIGURAR-ORACLE-ENV.ps1 primero" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ORACLE LISTO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Datos de conexion:" -ForegroundColor Cyan
Write-Host "  Host    : localhost" -ForegroundColor Gray
Write-Host "  Puerto  : 1521" -ForegroundColor Gray
Write-Host "  PDB     : XEPDB1" -ForegroundColor Gray
Write-Host "  Usuario : caprino_user / CaprinoPass2025" -ForegroundColor Gray
Write-Host ""
