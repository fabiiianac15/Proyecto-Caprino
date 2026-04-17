# 02-CONFIGURAR-ORACLE-ENV.ps1

Write-Host ""
Write-Host "CONFIGURAR ORACLE ENV" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH con variables de entorno del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Detectar la ubicación de Oracle dinamicamente
$oracleHome = $null

# Buscar sqlplus para encontrar ORACLE_HOME
try {
    $sqlplusPath = (Get-Command sqlplus -ErrorAction SilentlyContinue).Source
    if ($sqlplusPath) {
        $ORACLE_HOME = Split-Path -Parent (Split-Path -Parent $sqlplusPath)
        Write-Host "[OK] Oracle encontrado en $ORACLE_HOME" -ForegroundColor Green
    }
} catch {
    Write-Host "[AVISO] No se pudo detectar ORACLE_HOME" -ForegroundColor Yellow
}

# Si no se encontró por comando, intentar ubicación por defecto
if (-not $ORACLE_HOME) {
    if (Test-Path "C:\app\CEDIT\product\21c\dbhomeXE") {
        $ORACLE_HOME = "C:\app\CEDIT\product\21c\dbhomeXE"
        Write-Host "[OK] Oracle encontrado en ubicación por defecto" -ForegroundColor Green
    } elseif (Test-Path "C:\oracle\product\21c") {
        $ORACLE_HOME = "C:\oracle\product\21c"
        Write-Host "[OK] Oracle encontrado" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Oracle no encontrado en ubicaciones conocidas" -ForegroundColor Yellow
        $ORACLE_HOME = "C:\oracle\product\21c"
    }
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
    $env:Path = $newPath
    Write-Host "[OK] Oracle agregado al PATH" -ForegroundColor Green
} else {
    Write-Host "[OK] Oracle ya en PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "Actualizando PATH en la sesión actual..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "[OK] PATH actualizado" -ForegroundColor Green

Write-Host ""
Write-Host "COMPLETADO" -ForegroundColor Green
Write-Host ""
