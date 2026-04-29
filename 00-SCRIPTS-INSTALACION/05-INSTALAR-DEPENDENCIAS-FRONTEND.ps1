# ============================================================================
# 05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1
# Instala dependencias Node.js del frontend con npm
# Ejecutar: powershell -ExecutionPolicy Bypass -File "05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1"
# ============================================================================
# FIXES aplicados:
#   - Ya NO elimina package-lock.json (el lock garantiza builds reproducibles)
#   - Verifica version de Node.js antes de instalar
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALAR DEPENDENCIAS FRONTEND" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $projectRoot "frontend-web"

Write-Host "Frontend: $frontendDir" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] Directorio frontend no encontrado: $frontendDir" -ForegroundColor Red
    exit 1
}

# ── Verificar Node.js ─────────────────────────────────────────────────────────
Write-Host "Verificando Node.js y npm..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd  = Get-Command npm  -ErrorAction SilentlyContinue

if (-not $nodeCmd -or -not $npmCmd) {
    Write-Host "[ERROR] Node.js o npm no encontrados en PATH." -ForegroundColor Red
    Write-Host "Ejecuta primero: 00c-INSTALAR-NODE.ps1" -ForegroundColor Yellow
    exit 1
}

$nodeVer = & node --version 2>$null
$npmVer  = & npm  --version 2>$null
$numVer  = [int]($nodeVer.TrimStart("v").Split(".")[0])

Write-Host "[OK] Node.js $nodeVer / npm $npmVer" -ForegroundColor Green

if ($numVer -lt 18) {
    Write-Host "[AVISO] Node.js $nodeVer es menor a v18 — pueden ocurrir errores con Vite" -ForegroundColor Yellow
}

Write-Host ""

# ── Instalar dependencias ─────────────────────────────────────────────────────
Push-Location $frontendDir

Write-Host "Instalando dependencias npm (esto puede tardar varios minutos)..." -ForegroundColor Yellow
Write-Host ""

# FIX: NO borrar package-lock.json — el lock garantiza que todos usan las mismas versiones
# npm install respeta el lock si existe; lo crea si no existe
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Dependencias instaladas exitosamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] npm install termino con errores" -ForegroundColor Red
    Pop-Location
    exit 1
}

# ── Verificar Vite ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Verificando Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules\.bin\vite") {
    Write-Host "[OK] Vite disponible en node_modules/.bin/vite" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Vite no encontrado — verifica que esta en las dependencias del package.json" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DEPENDENCIAS FRONTEND INSTALADAS" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
