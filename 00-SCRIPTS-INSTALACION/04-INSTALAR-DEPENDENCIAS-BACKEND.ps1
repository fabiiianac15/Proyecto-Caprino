# 04-INSTALAR-DEPENDENCIAS-BACKEND.ps1

Write-Host ""
Write-Host "==== INSTALAR DEPENDENCIAS BACKEND ==== " -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH con variables de entorno del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = "$projectRoot\backend-symfony"

Write-Host "Backend dir: $backendDir" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Directorio backend no encontrado" -ForegroundColor Red
    exit 1
}

Push-Location $backendDir
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow

Write-Host ""
Write-Host "Verificando Composer..." -ForegroundColor Yellow

try {
    $composerVersion = composer --version 2>$null
    Write-Host "[OK] Composer encontrado: $composerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Composer no instalado" -ForegroundColor Red
    Write-Host "Descarga desde: https://getcomposer.org/download/" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "Limpiando archivos anteriores..." -ForegroundColor Yellow

if (Test-Path "composer.lock") {
    Remove-Item "composer.lock" -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] composer.lock eliminado" -ForegroundColor Green
}

if (Test-Path "vendor") {
    Write-Host "[INFO] vendor sera reemplazada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Instalando dependencias con Composer..." -ForegroundColor Yellow
Write-Host "(puede tardar varios minutos)" -ForegroundColor Gray
Write-Host ""

composer install --ignore-platform-req=php --ignore-platform-req=ext-oci8 --ignore-platform-req=ext-sodium

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Error en instalacion" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "Verificando autoload..." -ForegroundColor Yellow
if (Test-Path "vendor/autoload.php") {
    Write-Host "[OK] vendor/autoload.php existe" -ForegroundColor Green
} else {
    Write-Host "[AVISO] vendor/autoload.php no encontrado" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "==== COMPLETADO ====" -ForegroundColor Green
Write-Host ""
