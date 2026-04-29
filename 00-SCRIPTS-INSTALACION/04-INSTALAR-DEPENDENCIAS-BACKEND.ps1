# ============================================================================
# 04-INSTALAR-DEPENDENCIAS-BACKEND.ps1
# Instala dependencias PHP del backend con Composer
# Ejecutar: powershell -ExecutionPolicy Bypass -File "04-INSTALAR-DEPENDENCIAS-BACKEND.ps1"
# ============================================================================
# FIXES aplicados:
#   - Ya NO elimina composer.lock (el lock garantiza builds reproducibles)
#   - Usa --ignore-platform-req para instalar aunque OCI8 no este cargado aun
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALAR DEPENDENCIAS BACKEND" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir  = Join-Path $projectRoot "backend-symfony"

Write-Host "Backend: $backendDir" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Directorio backend no encontrado: $backendDir" -ForegroundColor Red
    exit 1
}

# ── Verificar Composer ────────────────────────────────────────────────────────
Write-Host "Verificando Composer..." -ForegroundColor Yellow
$compCmd = Get-Command composer -ErrorAction SilentlyContinue
if (-not $compCmd) {
    Write-Host "[ERROR] Composer no encontrado en PATH." -ForegroundColor Red
    Write-Host "Ejecuta primero: 03b-INSTALAR-COMPOSER.ps1" -ForegroundColor Yellow
    exit 1
}
$compVer = & composer --version 2>$null
Write-Host "[OK] $compVer" -ForegroundColor Green
Write-Host ""

# ── Instalar dependencias ─────────────────────────────────────────────────────
Push-Location $backendDir

Write-Host "Instalando dependencias PHP (esto puede tardar varios minutos)..." -ForegroundColor Yellow
Write-Host "(OCI8 y otras extensiones se ignoran hasta que esten instaladas)" -ForegroundColor Gray
Write-Host ""

# FIX: NO borrar composer.lock — el lock garantiza que todos usan las mismas versiones
# Si el lock no existe composer lo crea; si existe, composer lo respeta
composer install --ignore-platform-req=php --ignore-platform-req=ext-oci8 --ignore-platform-req=ext-sodium

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Dependencias instaladas exitosamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] composer install termino con errores" -ForegroundColor Red
    Pop-Location
    exit 1
}

# ── Verificar autoload ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Verificando autoload..." -ForegroundColor Yellow
if (Test-Path "vendor/autoload.php") {
    Write-Host "[OK] vendor/autoload.php generado correctamente" -ForegroundColor Green
} else {
    Write-Host "[AVISO] vendor/autoload.php no encontrado — verifica errores de Composer" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DEPENDENCIAS BACKEND INSTALADAS" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
