# 02-CONFIGURAR-ORACLE-ENV.ps1

Write-Host ""
Write-Host "CONFIGURAR ORACLE ENV" -ForegroundColor Cyan
Write-Host ""

$ORACLE_HOME = "C:\oracle\product\21c"

if (Test-Path "C:\oracle\product\21c") {
    Write-Host "[OK] Oracle encontrado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Oracle no encontrado" -ForegroundColor Yellow
}

Write-Host "Configurando ORACLE_HOME=$ORACLE_HOME" -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("ORACLE_HOME", $ORACLE_HOME, [EnvironmentVariableTarget]::User)
$env:ORACLE_HOME = $ORACLE_HOME

Write-Host "Configurando ORACLE_SID=XE" -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("ORACLE_SID", "XE", [EnvironmentVariableTarget]::User)
$env:ORACLE_SID = "XE"

Write-Host "Configurando NLS_LANG=AMERICAN_AMERICA.AL32UTF8" -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("NLS_LANG", "AMERICAN_AMERICA.AL32UTF8", [EnvironmentVariableTarget]::User)
$env:NLS_LANG = "AMERICAN_AMERICA.AL32UTF8"

$pathEntry = "$ORACLE_HOME\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)

if ($currentPath -notcontains $pathEntry) {
    $newPath = "$currentPath;$pathEntry"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    Write-Host "[OK] Oracle agregado al PATH" -ForegroundColor Green
} else {
    Write-Host "[OK] Oracle ya en PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "COMPLETADO" -ForegroundColor Green
Write-Host "Abre nueva PowerShell para aplicar cambios" -ForegroundColor Yellow
Write-Host ""
