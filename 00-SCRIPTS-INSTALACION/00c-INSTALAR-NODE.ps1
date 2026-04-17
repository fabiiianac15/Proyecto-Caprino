# 00c-INSTALAR-NODE.ps1
# Instala Node.js v24+ si no está disponible

Write-Host ""
Write-Host "VERIFICAR/INSTALAR NODE.JS" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$nodeExe = Get-Command node -ErrorAction SilentlyContinue

if ($nodeExe) {
    $nodeVersion = & node --version
    Write-Host "✓ Node.js ya está instalado: $nodeVersion" -ForegroundColor Green
    exit 0
}

Write-Host "Node.js no encontrado. Descargando e instalando..." -ForegroundColor Yellow
Write-Host ""

# Descargar Node.js
$nodeUrl = "https://nodejs.org/dist/v24.11.1/node-v24.11.1-x64.msi"
$outputPath = "$env:TEMP\node-v24.11.1-x64.msi"

try {
    Write-Host "Descargando Node.js v24.11.1..." -ForegroundColor Yellow
    (New-Object Net.WebClient).DownloadFile($nodeUrl, $outputPath)
    Write-Host "✓ Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error descargando Node.js: $_" -ForegroundColor Red
    exit 1
}

# Instalar Node.js
try {
    Write-Host "Instalando Node.js..." -ForegroundColor Yellow
    Start-Process -FilePath msiexec.exe -ArgumentList "/i `"$outputPath`" /quiet /norestart" -Wait
    Write-Host "✓ Node.js instalado" -ForegroundColor Green
} catch {
    Write-Host "✗ Error instalando Node.js: $_" -ForegroundColor Red
    exit 1
}

# Actualizar PATH en la sesión actual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verificar instalación
$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if ($nodeExe) {
    $nodeVersion = & node --version
    $npmVersion = & npm --version
    Write-Host ""
    Write-Host "✓ Node.js instalado correctamente:" -ForegroundColor Green
    Write-Host "  - Node: $nodeVersion"
    Write-Host "  - npm: $npmVersion"
} else {
    Write-Host "✗ No se pudo verificar Node.js" -ForegroundColor Red
    exit 1
}

# Limpiar
Remove-Item $outputPath -Force -ErrorAction SilentlyContinue

Write-Host ""
