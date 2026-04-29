# ============================================================================
# 02-CONFIGURAR-ORACLE-ENV.ps1
# Detecta Oracle XE y configura ORACLE_HOME, ORACLE_SID, NLS_LANG y PATH
# Ejecutar como Administrador: powershell -ExecutionPolicy Bypass -File "02-CONFIGURAR-ORACLE-ENV.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURAR VARIABLES DE ENTORNO DE ORACLE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$ORACLE_HOME = $null

# ── 1. Buscar por sqlplus ya en PATH ─────────────────────────────────────────
$sqlplusCmd = Get-Command sqlplus -ErrorAction SilentlyContinue
if ($sqlplusCmd) {
    # sqlplus esta en C:\...\bin\sqlplus.exe → subir dos niveles = ORACLE_HOME
    $ORACLE_HOME = Split-Path -Parent (Split-Path -Parent $sqlplusCmd.Source)
    Write-Host "[OK] Oracle detectado via sqlplus en PATH: $ORACLE_HOME" -ForegroundColor Green
}

# ── 2. Buscar en rutas tipicas de Oracle XE (cualquier usuario) ──────────────
if (-not $ORACLE_HOME) {
    # FIX: buscar dinamicamente en C:\app\<cualquier-usuario>\product\...
    $candidatos = @()

    # Oracle XE 21c instalado para cualquier usuario
    if (Test-Path "C:\app") {
        Get-ChildItem "C:\app" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $p21 = Join-Path $_.FullName "product\21c\dbhomeXE"
            $p18 = Join-Path $_.FullName "product\18c\dbhomeXE"
            if (Test-Path $p21) { $candidatos += $p21 }
            if (Test-Path $p18) { $candidatos += $p18 }
        }
    }

    # Rutas adicionales comunes
    @(
        "C:\Oracle\product\21c\dbhomeXE",
        "C:\oracle\product\21c\dbhomeXE",
        "C:\Oracle21c",
        "C:\OracleXE21c\app\oracle\product\21c\dbhomeXE"
    ) | Where-Object { Test-Path $_ } | ForEach-Object { $candidatos += $_ }

    if ($candidatos.Count -gt 0) {
        $ORACLE_HOME = $candidatos[0]
        Write-Host "[OK] Oracle encontrado en: $ORACLE_HOME" -ForegroundColor Green
        if ($candidatos.Count -gt 1) {
            Write-Host "     (se encontraron $($candidatos.Count) instalaciones, usando la primera)" -ForegroundColor Gray
        }
    }
}

# ── 3. Si aun no se encontro, pedir al usuario ───────────────────────────────
if (-not $ORACLE_HOME) {
    Write-Host "[AVISO] No se pudo detectar Oracle automaticamente." -ForegroundColor Yellow
    Write-Host "Busca la carpeta que contiene BIN\sqlplus.exe (ej: C:\app\juan\product\21c\dbhomeXE)" -ForegroundColor Yellow
    $ORACLE_HOME = Read-Host "Ingresa la ruta de ORACLE_HOME"

    if (-not (Test-Path "$ORACLE_HOME\bin\sqlplus.exe")) {
        Write-Host "[ERROR] No se encontro sqlplus.exe en '$ORACLE_HOME\bin'" -ForegroundColor Red
        Write-Host "Asegurate de que Oracle XE este instalado e ingresa la ruta correcta." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# ── 4. Configurar variables de entorno del sistema ───────────────────────────
Write-Host "Configurando ORACLE_HOME = $ORACLE_HOME" -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("ORACLE_HOME", $ORACLE_HOME, [EnvironmentVariableTarget]::Machine)
$env:ORACLE_HOME = $ORACLE_HOME

Write-Host "Configurando ORACLE_SID = XE" -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("ORACLE_SID", "XE", [EnvironmentVariableTarget]::Machine)
$env:ORACLE_SID = "XE"

Write-Host "Configurando NLS_LANG = AMERICAN_AMERICA.AL32UTF8" -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("NLS_LANG", "AMERICAN_AMERICA.AL32UTF8", [EnvironmentVariableTarget]::Machine)
$env:NLS_LANG = "AMERICAN_AMERICA.AL32UTF8"

Write-Host ""

# ── 5. Agregar ORACLE_HOME\bin al PATH del sistema ───────────────────────────
$binPath     = "$ORACLE_HOME\bin"
$machinePath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
$entradas    = $machinePath -split ";" | Where-Object { $_ -ne "" }

# FIX: usar -notcontains sobre array de entradas (no sobre el string completo)
if ($entradas -notcontains $binPath) {
    $nuevoPath = ($entradas + $binPath) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $nuevoPath, [EnvironmentVariableTarget]::Machine)
    Write-Host "[OK] '$binPath' agregado al PATH del sistema" -ForegroundColor Green
} else {
    Write-Host "[OK] '$binPath' ya esta en el PATH del sistema" -ForegroundColor Green
}

# Refrescar PATH en la sesion actual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "Verificando sqlplus..." -ForegroundColor Yellow
$sqlp2 = Get-Command sqlplus -ErrorAction SilentlyContinue
if ($sqlp2) {
    Write-Host "[OK] sqlplus disponible en PATH" -ForegroundColor Green
} else {
    Write-Host "[AVISO] sqlplus aun no visible — abre una nueva terminal para que surtan efecto los cambios" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Variables configuradas:" -ForegroundColor Cyan
Write-Host "  ORACLE_HOME = $ORACLE_HOME" -ForegroundColor Gray
Write-Host "  ORACLE_SID  = XE" -ForegroundColor Gray
Write-Host "  NLS_LANG    = AMERICAN_AMERICA.AL32UTF8" -ForegroundColor Gray
Write-Host ""
Write-Host "Siguiente paso: ejecuta 03-INSTALAR-OCI8.ps1" -ForegroundColor Yellow
Write-Host ""
