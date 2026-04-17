# 03-INSTALAR-OCI8.ps1

Write-Host ""
Write-Host "INSTALAR OCI8" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH con variables de entorno del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$phpPath = (Get-Command php -ErrorAction SilentlyContinue).Source

if (-not $phpPath) {
    Write-Host "[ERROR] PHP no encontrado" -ForegroundColor Red
    exit 1
}

$phpDir = Split-Path -Parent $phpPath
$extDir = "$phpDir\ext"
$iniFile = "$phpDir\php.ini"

Write-Host "PHP: $phpDir" -ForegroundColor Green
Write-Host ""

$oci8Files = Get-ChildItem "$extDir" -Filter "php_oci8*.dll" -ErrorAction SilentlyContinue

if ($oci8Files) {
    Write-Host "[OK] OCI8 DLL existe" -ForegroundColor Green
} else {
    Write-Host "[INFO] Descargando OCI8..." -ForegroundColor Yellow
    
    $url = "https://windows.php.net/downloads/pecl/releases/oci8/3.3.0/php_oci8-3.3.0-8.2-ts-vc16-x64.dll"
    $outputFile = "$extDir\php_oci8-3.3.0-8.2-ts-vc16-x64.dll"
    
    try {
        (New-Object Net.WebClient).DownloadFile($url, $outputFile)
        Write-Host "[OK] OCI8 descargado" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] No se pudo descargar" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Configurando php.ini..." -ForegroundColor Yellow

if (-not (Test-Path $iniFile)) {
    Write-Host "[ERROR] php.ini no encontrado" -ForegroundColor Red
    exit 1
}

$iniContent = Get-Content $iniFile -Raw

if ($iniContent -match "extension\s*=\s*oci8") {
    Write-Host "[OK] OCI8 habilitado" -ForegroundColor Green
} else {
    Write-Host "Habilitando OCI8..." -ForegroundColor Yellow
    $iniContent = $iniContent + [Environment]::NewLine + "extension=oci8"
    Set-Content -Path $iniFile -Value $iniContent -Encoding UTF8
    Write-Host "[OK] OCI8 agregado" -ForegroundColor Green
}

Write-Host ""
Write-Host "COMPLETADO" -ForegroundColor Green
Write-Host ""
Write-Host "Nota: PHP necesita reiniciarse para cargar la extensión OCI8" -ForegroundColor Yellow
Write-Host "Abre nueva PowerShell y ejecuta: php -m | findstr oci8" -ForegroundColor Yellow
Write-Host ""
