# 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1

Write-Host ""
Write-Host "==== INSTALAR DEPENDENCIAS FRONTEND ==== " -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$frontendDir = "$projectRoot\frontend-web"

Write-Host "Frontend dir: $frontendDir" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] Directorio frontend no encontrado" -ForegroundColor Red
    exit 1
}

Push-Location $frontendDir
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow

Write-Host ""
Write-Host "Verificando Node.js y npm..." -ForegroundColor Yellow

try {
    $nodeVersion = node -v 2>$null
    $npmVersion = npm -v 2>$null
    Write-Host "[OK] Node.js $nodeVersion encontrado" -ForegroundColor Green
    Write-Host "[OK] npm $npmVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js o npm no instalados" -ForegroundColor Red
    Write-Host "Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "Limpiando instalacion anterior..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "[INFO] node_modules sera reemplazada (puede tardar...)" -ForegroundColor Yellow
}

if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] package-lock.json eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Instalando dependencias con npm..." -ForegroundColor Yellow
Write-Host "(puede tardar varios minutos)" -ForegroundColor Gray
Write-Host ""

npm install

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
Write-Host "Verificando Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules\.bin\vite") {
    Write-Host "[OK] Vite disponible" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Vite no encontrado" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "==== COMPLETADO ====" -ForegroundColor Green
Write-Host ""
