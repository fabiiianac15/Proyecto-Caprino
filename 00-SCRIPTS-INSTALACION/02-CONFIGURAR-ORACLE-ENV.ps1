# ============================================================================
# 02-CONFIGURAR-ORACLE-ENV.ps1
# ============================================================================
# PASO 2: Configurar variables de entorno de Oracle para OCI8
# Ejecuta como Administrador: powershell -ExecutionPolicy Bypass -File "02-CONFIGURAR-ORACLE-ENV.ps1"
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CONFIGURAR VARIABLES DE ENTORNO - Oracle & NLS_LANG              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Detectar ruta de Oracle automáticamente
$ORACLE_HOME = "C:\oracle\product\21c"
$ORACLE_PATH = "C:\Oracle\WINDOWS.X64_213000_db_home"

Write-Host "🔍 Buscando Oracle en el sistema..." -ForegroundColor Yellow

if (Test-Path $ORACLE_HOME) {
    Write-Host "✅ Oracle encontrado en: $ORACLE_HOME" -ForegroundColor Green
} elseif (Test-Path $ORACLE_PATH) {
    Write-Host "✅ Oracle encontrado en: $ORACLE_PATH" -ForegroundColor Green
    $ORACLE_HOME = $ORACLE_PATH
} else {
    Write-Host "❌ Oracle NO encontrado" -ForegroundColor Red
    Write-Host "Verifica que Oracle 21c XE está instalado en C:\oracle" -ForegroundColor Red
    $ORACLE_HOME = "C:\oracle\product\21c"
}

Write-Host ""
Write-Host "📝 Configurando variables de entorno..." -ForegroundColor Yellow

# Configurar variables de entorno para el usuario actual (permanecer después de cerrar PowerShell)
[Environment]::SetEnvironmentVariable("ORACLE_HOME", $ORACLE_HOME, [EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable("ORACLE_SID", "XE", [EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable("NLS_LANG", "AMERICAN_AMERICA.AL32UTF8", [EnvironmentVariableTarget]::User)

# También establecer en la sesión actual
$env:ORACLE_HOME = $ORACLE_HOME
$env:ORACLE_SID = "XE"
$env:NLS_LANG = "AMERICAN_AMERICA.AL32UTF8"

Write-Host "✅ ORACLE_HOME = $ORACLE_HOME" -ForegroundColor Green
Write-Host "✅ ORACLE_SID = XE" -ForegroundColor Green
Write-Host "✅ NLS_LANG = AMERICAN_AMERICA.AL32UTF8" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Agregando ruta de Oracle al PATH..." -ForegroundColor Yellow

$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if (-not $currentPath.Contains("$ORACLE_HOME\bin")) {
    $newPath = "$currentPath;$ORACLE_HOME\bin"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    Write-Host "✅ Ruta de Oracle agregada al PATH" -ForegroundColor Green
} else {
    Write-Host "✅ Ruta de Oracle ya está en PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE: Cierra y reabre PowerShell para aplicar los cambios" -ForegroundColor Yellow
Write-Host "   luego ejecuta el script 03" -ForegroundColor Yellow

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Variables de entorno configuradas                             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Read-Host "Presiona ENTER para continuar"
