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
Write-Host "Verificando Composer..." -ForegroundColor Yellow
try {
    $version = composer --version 2>$null
    Write-Host "[OK] $version" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Abre nueva PowerShell para aplicar cambios" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==== COMPLETADO ====" -ForegroundColor Green
Write-Host ""
