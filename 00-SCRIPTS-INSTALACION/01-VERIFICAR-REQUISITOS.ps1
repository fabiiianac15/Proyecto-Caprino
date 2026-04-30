# ============================================================================
# 01-VERIFICAR-REQUISITOS.ps1
# Verifica que todos los componentes necesarios estan instalados
# Ejecutar: powershell -ExecutionPolicy Bypass -File "01-VERIFICAR-REQUISITOS.ps1"
# ============================================================================

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VERIFICACION DE REQUISITOS - Proyecto Caprino" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$todoOk = $true

# ── 1. PHP ────────────────────────────────────────────────────────────────────
Write-Host "[1] PHP 8.1 o superior..." -ForegroundColor Yellow
$phpCmd = Get-Command php -ErrorAction SilentlyContinue
if ($phpCmd) {
    $ver   = & php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;" 2>$null
    $major = [int]($ver.Split(".")[0])
    if ($major -ge 8) {
        $linea = (& php -v 2>$null).Split([Environment]::NewLine)[0]
        Write-Host "    [OK] $linea" -ForegroundColor Green
    } else {
        Write-Host "    [ERROR] PHP $ver — se requiere 8.1 o superior" -ForegroundColor Red
        $todoOk = $false
    }
} else {
    Write-Host "    [ERROR] PHP no encontrado — ejecuta 00-INSTALAR-PHP-COMPATIBLE.ps1" -ForegroundColor Red
    $todoOk = $false
}
Write-Host ""

# ── 2. Extension OCI8 ─────────────────────────────────────────────────────────
Write-Host "[2] Extension OCI8 (Oracle para PHP)..." -ForegroundColor Yellow
if ($phpCmd) {
    $oci8 = & php -m 2>$null | Select-String "^oci8$"
    if ($oci8) {
        Write-Host "    [OK] OCI8 cargado en PHP" -ForegroundColor Green
    } else {
        Write-Host "    [AVISO] OCI8 no cargado — ejecuta 03-INSTALAR-OCI8.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "    [OMITIDO] PHP no disponible" -ForegroundColor Gray
}
Write-Host ""

# ── 3. Oracle Instant Client ──────────────────────────────────────────────────
Write-Host "[3] Oracle Instant Client..." -ForegroundColor Yellow
$ociDll = Get-Command oci.dll -ErrorAction SilentlyContinue
if (-not $ociDll) {
    # Buscar en rutas comunes
    $icCandidatos = @(
        "C:\oracle\instantclient_21_14",
        "C:\oracle\instantclient_21_13",
        "C:\oracle\instantclient_21_3",
        "C:\instantclient_21_14"
    )
    $icDir = $icCandidatos | Where-Object { Test-Path "$_\oci.dll" } | Select-Object -First 1
    if ($icDir) {
        Write-Host "    [AVISO] Instant Client en '$icDir' pero no esta en PATH — abre nueva terminal" -ForegroundColor Yellow
    } else {
        Write-Host "    [ERROR] Instant Client no encontrado — ejecuta 02-INSTALAR-INSTANT-CLIENT.ps1" -ForegroundColor Red
        $todoOk = $false
    }
} else {
    $icDir = Split-Path -Parent $ociDll.Source
    Write-Host "    [OK] Instant Client en PATH: $icDir" -ForegroundColor Green
}
Write-Host ""

# ── 4. sqlplus disponible ─────────────────────────────────────────────────────
Write-Host "[4] sqlplus (SQL*Plus para Oracle)..." -ForegroundColor Yellow
$sqlplusCmd = Get-Command sqlplus -ErrorAction SilentlyContinue
if ($sqlplusCmd) {
    Write-Host "    [OK] sqlplus encontrado: $($sqlplusCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "    [AVISO] sqlplus no encontrado — incluido en Instant Client SQL*Plus package" -ForegroundColor Yellow
}
Write-Host ""

# ── 5. Wallet y TNS_ADMIN ─────────────────────────────────────────────────────
Write-Host "[5] Wallet Oracle Autonomous DB (TNS_ADMIN)..." -ForegroundColor Yellow
$tnsAdmin = [System.Environment]::GetEnvironmentVariable("TNS_ADMIN", "Machine")
if (-not $tnsAdmin) { $tnsAdmin = $env:TNS_ADMIN }

if ($tnsAdmin -and (Test-Path "$tnsAdmin\tnsnames.ora")) {
    Write-Host "    [OK] TNS_ADMIN = $tnsAdmin" -ForegroundColor Green
    $tnsLines = Get-Content "$tnsAdmin\tnsnames.ora" -ErrorAction SilentlyContinue
    $tnsNames = $tnsLines | Where-Object { $_ -match "^\w.*=\s*\(" } | ForEach-Object {
        ($_ -split "=")[0].Trim()
    }
    if ($tnsNames) {
        Write-Host "    [OK] Servicios TNS: $($tnsNames -join ', ')" -ForegroundColor Green
    }
} elseif ($tnsAdmin) {
    Write-Host "    [ERROR] TNS_ADMIN=$tnsAdmin pero tnsnames.ora no encontrado" -ForegroundColor Red
    $todoOk = $false
} else {
    Write-Host "    [ERROR] TNS_ADMIN no configurado — ejecuta 02-CONFIGURAR-ORACLE-ENV.ps1" -ForegroundColor Red
    $todoOk = $false
}
Write-Host ""

# ── 6. Node.js ────────────────────────────────────────────────────────────────
Write-Host "[6] Node.js 18 o superior..." -ForegroundColor Yellow
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

# ── 7. Composer ───────────────────────────────────────────────────────────────
Write-Host "[7] Composer..." -ForegroundColor Yellow
$compCmd = Get-Command composer -ErrorAction SilentlyContinue
if ($compCmd) {
    $compVer = & composer --version 2>$null
    Write-Host "    [OK] $compVer" -ForegroundColor Green
} else {
    Write-Host "    [AVISO] Composer no encontrado — ejecuta 03b-INSTALAR-COMPOSER.ps1" -ForegroundColor Yellow
}
Write-Host ""

# ── 8. Puerto 8000 libre ──────────────────────────────────────────────────────
Write-Host "[8] Puerto 8000 disponible para el backend..." -ForegroundColor Yellow
$en8000 = netstat -an 2>$null | Select-String ":8000\s.*LISTEN"
if ($en8000) {
    Write-Host "    [AVISO] Puerto 8000 en uso — el backend podria no iniciar" -ForegroundColor Yellow
} else {
    Write-Host "    [OK] Puerto 8000 libre" -ForegroundColor Green
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
if ($todoOk) {
    Write-Host "   RESULTADO: Todos los requisitos criticos estan OK" -ForegroundColor Green
} else {
    Write-Host "   RESULTADO: Faltan componentes — revisa los marcados en rojo" -ForegroundColor Yellow
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
