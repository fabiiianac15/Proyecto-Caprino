# ============================================================================
# 00b-INSTALAR-VCRUNTIME.ps1
# ============================================================================
# Instalar Visual C++ 2015-2022 Runtime (prerequisito para PHP 8.2)
# Ejecutar: powershell -ExecutionPolicy Bypass -File "00b-INSTALAR-VCRUNTIME.ps1"
# ============================================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " INSTALAR VISUAL C++ RUNTIME" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# URL del instalador oficial de Microsoft
$url = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
$outputFile = "$env:TEMP\vc_redist.x64.exe"

Write-Host "Descargando Visual C++ Redistributable 2015-2022..." -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $url -OutFile $outputFile -UseBasicParsing
    Write-Host "OK: Descargado" -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo descargar" -ForegroundColor Red
    Write-Host "Descarga manual desde: https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $outputFile)) {
    Write-Host "ERROR: Descarga incompleta" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instalando Visual C++ Runtime..." -ForegroundColor Yellow

try {
    & $outputFile /install /quiet /norestart
    $vcExitCode = $LASTEXITCODE
    # 0=exito, 1638=ya instalada otra version, 3010=exito (requiere reinicio)
    if ($vcExitCode -eq 0 -or $vcExitCode -eq 1638 -or $vcExitCode -eq 3010) {
        Write-Host "OK: Instalacion completada (codigo: $vcExitCode)" -ForegroundColor Green
    } else {
        Write-Host "AVISO: El instalador retorno codigo $vcExitCode" -ForegroundColor Yellow
        Write-Host "       Puede ser normal si ya estaba instalada una version compatible." -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR durante la instalacion: $_" -ForegroundColor Red
    exit 1
}

Remove-Item $outputFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " INSTALACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora PHP 8.2 funcionara correctamente sin warnings" -ForegroundColor Green
Write-Host ""
exit 0
