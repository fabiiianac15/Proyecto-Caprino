# ============================================================================
# 00c-INSTALAR-NODE.ps1
# Instala Node.js LTS si no esta disponible
# Ejecutar: powershell -ExecutionPolicy Bypass -File "00c-INSTALAR-NODE.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VERIFICAR / INSTALAR NODE.JS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCmd) {
    $nodeVersion = & node --version 2>$null
    $npmVersion  = & npm  --version 2>$null
    Write-Host "[OK] Node.js $nodeVersion ya instalado (npm $npmVersion)" -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "Node.js no encontrado. Descargando e instalando..." -ForegroundColor Yellow
Write-Host ""

$nodeVersion = "24.11.1"
$nodeUrl     = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
$tempMsi     = Join-Path $env:TEMP "node-v$nodeVersion-x64.msi"

try {
    Write-Host "Descargando Node.js v$nodeVersion..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $nodeUrl -OutFile $tempMsi -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo descargar Node.js: $_" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Instalando Node.js (instalacion silenciosa)..." -ForegroundColor Yellow
    $proc = Start-Process msiexec.exe -ArgumentList "/i `"$tempMsi`" /quiet /norestart" -Wait -PassThru
    if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne 3010) {
        Write-Host "[AVISO] Instalador termino con codigo $($proc.ExitCode)" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Node.js instalado" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Error instalando Node.js: $_" -ForegroundColor Red
    exit 1
}

Remove-Item $tempMsi -Force -ErrorAction SilentlyContinue

# Refrescar PATH para ver la instalacion recien hecha
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "Verificando instalacion..." -ForegroundColor Yellow
$nodeCmd2 = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd2) {
    $nv = & node --version 2>$null
    $npv = & npm  --version 2>$null
    Write-Host "[OK] Node.js $nv / npm $npv" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Node.js instalado pero aun no visible en PATH." -ForegroundColor Yellow
    Write-Host "        Abre una nueva terminal y ejecuta: node --version" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   NODE.JS INSTALADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
