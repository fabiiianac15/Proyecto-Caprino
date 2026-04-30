# 03b-INSTALAR-COMPOSER.ps1

Write-Host ""
Write-Host "==== INSTALAR COMPOSER ==== " -ForegroundColor Cyan
Write-Host ""

Write-Host "Descargando Composer..." -ForegroundColor Yellow

$composerUrl = "https://getcomposer.org/Composer-Setup.exe"
$composerInstaller = "$env:TEMP\Composer-Setup.exe"

try {
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($composerUrl, $composerInstaller)
    Write-Host "[OK] Composer descargado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo descargar Composer" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instalando Composer..." -ForegroundColor Yellow
& $composerInstaller /SILENT /ALLUSERS | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Composer instalado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Instalacion completada" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Limpiando..." -ForegroundColor Yellow
Remove-Item $composerInstaller -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Actualizando variables de entorno en la sesión actual..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "[OK] PATH actualizado" -ForegroundColor Green

Write-Host ""
Write-Host "Verificando Composer..." -ForegroundColor Yellow
try {
    $version = composer --version 2>$null
    Write-Host "[OK] $version" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Composer no se pudo verificar" -ForegroundColor Red
}

Write-Host ""
Write-Host "==== COMPLETADO ====" -ForegroundColor Green
Write-Host ""
