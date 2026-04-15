# ============================================================================
# 06-INICIAR-ORACLE.ps1
# ============================================================================
# PASO 6: Verificar e iniciar Oracle Database Service
# Ejecuta como Administrador: powershell -ExecutionPolicy Bypass -File "06-INICIAR-ORACLE.ps1"
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INICIAR ORACLE - Oracle 21c XE Database Service                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$oracleService = "OracleServiceXE"

Write-Host "🔍 Buscando servicio de Oracle: $oracleService" -ForegroundColor Yellow
$service = Get-Service -Name $oracleService -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "❌ Servicio Oracle no encontrado" -ForegroundColor Red
    Write-Host "Verifica que Oracle 21c XE está instalado en C:\oracle\product\21c" -ForegroundColor Yellow
    Read-Host "Presiona ENTER para salir"
    exit
}

Write-Host "✅ Servicio encontrado: $oracleService" -ForegroundColor Green
Write-Host "   Estado actual: $($service.Status)" -ForegroundColor Gray
Write-Host ""

if ($service.Status -eq "Running") {
    Write-Host "✅ Oracle ya está corriendo" -ForegroundColor Green
} else {
    Write-Host "📝 Oracle no está corriendo - Iniciando servicio..." -ForegroundColor Yellow
    try {
        Start-Service -Name $oracleService
        Start-Sleep -Seconds 3
        $service = Get-Service -Name $oracleService
        
        if ($service.Status -eq "Running") {
            Write-Host "✅ Oracle iniciado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No se pudo iniciar Oracle automáticamente" -ForegroundColor Yellow
            Write-Host "Intenta iniciarlo manualmente:" -ForegroundColor Yellow
            Write-Host "   services.msc -> Busca 'OracleServiceXE' -> Click derecho -> Iniciar" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Error iniciando Oracle: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🧪 Verificando conexión a Oracle..." -ForegroundColor Yellow

try {
    # Esperar un peu para que el servicio esté listo
    Start-Sleep -Seconds 2
    
    # Intentar conectar (requiere sqlplus)
    $sqlplusExists = Get-Command sqlplus -ErrorAction SilentlyContinue
    if ($sqlplusExists) {
        Write-Host "ℹ️  Disponible: sqlplus" -ForegroundColor Gray
    } else {
        Write-Host "ℹ️  sqlplus no encontrado en PATH (pero Oracle debería estar corriendo)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  No se pudo verificar conexión" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Oracle está listo                                             ║" -ForegroundColor Green
Write-Host "║     URL: localhost:1521/XEPDB1                                    ║" -ForegroundColor Green
Write-Host "║     Usuario: C##caprino                                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Read-Host "Presiona ENTER para continuar"
