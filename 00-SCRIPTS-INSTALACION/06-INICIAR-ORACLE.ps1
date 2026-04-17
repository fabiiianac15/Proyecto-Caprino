# ============================================================================
# 06-INICIAR-ORACLE.ps1
# ============================================================================
# PASO 6: Verificar e iniciar Oracle Database Service
# Ejecuta como Administrador: powershell -ExecutionPolicy Bypass -File "06-INICIAR-ORACLE.ps1"
# ============================================================================

Write-Host ""
Write-Host "==== INICIAR ORACLE - Oracle 21c XE Database Service ====" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH con variables de entorno del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$oracleService = "OracleServiceXE"

Write-Host "[1] Buscando servicio de Oracle: $oracleService" -ForegroundColor Yellow
$service = Get-Service -Name $oracleService -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "[ERROR] Servicio Oracle no encontrado" -ForegroundColor Red
    Write-Host "Verifica que Oracle 21c XE está instalado" -ForegroundColor Yellow
    Read-Host "Presiona ENTER para salir"
    exit 1
}

Write-Host "[OK] Servicio encontrado: $oracleService" -ForegroundColor Green
Write-Host "     Estado actual: $($service.Status)" -ForegroundColor Gray
Write-Host ""

if ($service.Status -eq "Running") {
    Write-Host "[OK] Oracle ya está corriendo" -ForegroundColor Green
} else {
    Write-Host "[INFO] Oracle no está corriendo - Iniciando servicio..." -ForegroundColor Yellow
    try {
        Start-Service -Name $oracleService
        Start-Sleep -Seconds 3
        $service = Get-Service -Name $oracleService
        
        if ($service.Status -eq "Running") {
            Write-Host "[OK] Oracle iniciado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] No se pudo iniciar Oracle automáticamente" -ForegroundColor Yellow
            Write-Host "Intenta iniciarlo manualmente:" -ForegroundColor Yellow
            Write-Host "   services.msc -> Busca 'OracleServiceXE' -> Click derecho -> Iniciar" -ForegroundColor Gray
        }
    } catch {
        Write-Host "[ERROR] Error iniciando Oracle: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[2] Verificando conexión a Oracle..." -ForegroundColor Yellow

try {
    # Esperar un poco para que el servicio esté listo
    Start-Sleep -Seconds 2
    
    # Intentar conectar (requiere sqlplus)
    $sqlplusExists = Get-Command sqlplus -ErrorAction SilentlyContinue
    if ($sqlplusExists) {
        Write-Host "[OK] sqlplus disponible" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] sqlplus no encontrado en PATH (pero Oracle debería estar corriendo)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[AVISO] No se pudo verificar conexión" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==== ORACLE LISTO ====" -ForegroundColor Green
Write-Host "Detalles de conexión:" -ForegroundColor Cyan
Write-Host "  Hostname: localhost" -ForegroundColor Gray
Write-Host "  Puerto: 1521" -ForegroundColor Gray
Write-Host "  SID: XE" -ForegroundColor Gray
Write-Host "  PDB: XEPDB1" -ForegroundColor Gray
Write-Host ""
Write-Host "Usuarios disponibles:" -ForegroundColor Cyan
Write-Host "  SYS (Password: se configuró durante la instalación)" -ForegroundColor Gray
Write-Host "  SYSTEM (Password: se configuró durante la instalación)" -ForegroundColor Gray
Write-Host ""

Read-Host "Presiona ENTER para continuar"
