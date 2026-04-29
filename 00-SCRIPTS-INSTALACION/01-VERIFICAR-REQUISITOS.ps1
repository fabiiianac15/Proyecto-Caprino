# ============================================================================
# 01-VERIFICAR-REQUISITOS.ps1
# Verifica que todos los componentes necesarios estan instalados
# Ejecutar: powershell -ExecutionPolicy Bypass -File "01-VERIFICAR-REQUISITOS.ps1"
# ============================================================================

# FIX: eliminar las 3 copias duplicadas del codigo original — version unica y limpia

# Refrescar PATH para ver lo instalado en esta sesion
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VERIFICACION DE REQUISITOS - Proyecto Caprino" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$todoOk = $true

# ── 1. PHP ───────────────────────────────────────────────────────────────────
Write-Host "[1] PHP 8.1 o superior..." -ForegroundColor Yellow
$phpCmd = Get-Command php -ErrorAction SilentlyContinue
if ($phpCmd) {
    $ver = & php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;" 2>$null
    $major = [int]($ver.Split(".")[0])
    if ($major -ge 8) {
        $linea = (& php -v 2>$null).Split([Environment]::NewLine)[0]
        Write-Host "    [OK] $linea" -ForegroundColor Green
    } else {
        Write-Host "    [ERROR] PHP $ver encontrado — se requiere 8.1 o superior" -ForegroundColor Red
        $todoOk = $false
    }
} else {
    Write-Host "    [ERROR] PHP no encontrado — ejecuta 00-INSTALAR-PHP-COMPATIBLE.ps1" -ForegroundColor Red
    $todoOk = $false
}

Write-Host ""

# ── 2. Extension OCI8 ────────────────────────────────────────────────────────
Write-Host "[2] Extension OCI8 (Oracle para PHP)..." -ForegroundColor Yellow
if ($phpCmd) {
    $oci8 = & php -m 2>$null | Select-String "^oci8$"
    if ($oci8) {
        Write-Host "    [OK] OCI8 cargado en PHP" -ForegroundColor Green
    } else {
        Write-Host "    [AVISO] OCI8 no cargado — ejecuta 02-CONFIGURAR-ORACLE-ENV.ps1 y 03-INSTALAR-OCI8.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "    [OMITIDO] PHP no disponible" -ForegroundColor Gray
}

Write-Host ""

# ── 3. Oracle XE (sqlplus) ───────────────────────────────────────────────────
Write-Host "[3] Oracle Client / sqlplus..." -ForegroundColor Yellow
$sqlplusCmd = Get-Command sqlplus -ErrorAction SilentlyContinue
if ($sqlplusCmd) {
    Write-Host "    [OK] sqlplus encontrado: $($sqlplusCmd.Source)" -ForegroundColor Green
} else {
    # Buscar en rutas comunes de Oracle XE
    $posiblesRutas = @(
        "C:\app\$env:USERNAME\product\21c\dbhomeXE\bin\sqlplus.exe",
        "C:\app\$env:USERNAME\product\18c\dbhomeXE\bin\sqlplus.exe",
        "C:\Oracle\product\21c\dbhomeXE\bin\sqlplus.exe",
        "C:\oracle\bin\sqlplus.exe"
    )
    $encontrado = $posiblesRutas | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($encontrado) {
        Write-Host "    [OK] sqlplus en: $encontrado (no esta en PATH — ejecuta 02-CONFIGURAR-ORACLE-ENV.ps1)" -ForegroundColor Yellow
    } else {
        Write-Host "    [ERROR] sqlplus no encontrado — Oracle XE debe estar instalado" -ForegroundColor Red
        $todoOk = $false
    }
}

Write-Host ""

# ── 4. Servicio Oracle ───────────────────────────────────────────────────────
Write-Host "[4] Servicio Oracle XE..." -ForegroundColor Yellow
$svc = Get-Service -Name "OracleServiceXE" -ErrorAction SilentlyContinue
if ($svc) {
    $color = if ($svc.Status -eq "Running") { "Green" } else { "Yellow" }
    Write-Host "    [OK] OracleServiceXE — Estado: $($svc.Status)" -ForegroundColor $color
    if ($svc.Status -ne "Running") {
        Write-Host "    [AVISO] Oracle no esta corriendo — ejecuta 06-INICIAR-ORACLE.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "    [ERROR] Servicio OracleServiceXE no encontrado — Oracle XE no esta instalado" -ForegroundColor Red
    $todoOk = $false
}

Write-Host ""

# ── 5. Node.js ───────────────────────────────────────────────────────────────
Write-Host "[5] Node.js 18 o superior..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVer = & node --version 2>$null
    $numVer  = [int]($nodeVer.TrimStart("v").Split(".")[0])
    if ($numVer -ge 18) {
        $npmVer = & npm --version 2>$null
        Write-Host "    [OK] Node.js $nodeVer  /  npm $npmVer" -ForegroundColor Green
    } else {
        Write-Host "    [AVISO] Node.js $nodeVer — se recomienda v18 o superior" -ForegroundColor Yellow
    }
} else {
    Write-Host "    [AVISO] Node.js no encontrado — ejecuta 00c-INSTALAR-NODE.ps1" -ForegroundColor Yellow
}

Write-Host ""

# ── 6. Composer ──────────────────────────────────────────────────────────────
Write-Host "[6] Composer..." -ForegroundColor Yellow
$compCmd = Get-Command composer -ErrorAction SilentlyContinue
if ($compCmd) {
    $compVer = & composer --version 2>$null
    Write-Host "    [OK] $compVer" -ForegroundColor Green
} else {
    Write-Host "    [AVISO] Composer no encontrado — ejecuta 03b-INSTALAR-COMPOSER.ps1" -ForegroundColor Yellow
}

Write-Host ""

# ── 7. Puerto 8000 libre ─────────────────────────────────────────────────────
Write-Host "[7] Puerto 8000 disponible para el backend..." -ForegroundColor Yellow
$en8000 = netstat -an 2>$null | Select-String ":8000\s.*LISTEN"
if ($en8000) {
    Write-Host "    [AVISO] Puerto 8000 ya esta en uso — el backend podria no iniciar" -ForegroundColor Yellow
} else {
    Write-Host "    [OK] Puerto 8000 libre" -ForegroundColor Green
}

Write-Host ""
# FIX: eliminado "LINE_SEPARATOR" literal — se usa Write-Host con el separador correcto
Write-Host "============================================================" -ForegroundColor Cyan
if ($todoOk) {
    Write-Host "   RESULTADO: Todos los requisitos criticos estan OK" -ForegroundColor Green
} else {
    Write-Host "   RESULTADO: Faltan componentes — revisa los marcados en rojo" -ForegroundColor Yellow
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
