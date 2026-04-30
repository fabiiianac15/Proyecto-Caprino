# ============================================================================
# 03-INSTALAR-OCI8.ps1
# Instala y habilita la extension OCI8 para PHP
# Requiere: PHP instalado + Oracle Instant Client instalado y en PATH
# Ejecutar: powershell -ExecutionPolicy Bypass -File "03-INSTALAR-OCI8.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALAR EXTENSION OCI8 PARA PHP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH para ver Instant Client
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

# ── Verificar PHP ─────────────────────────────────────────────────────────────
$phpCmd = Get-Command php -ErrorAction SilentlyContinue
if (-not $phpCmd) {
    Write-Host "[ERROR] PHP no encontrado. Ejecuta primero: 00-INSTALAR-PHP-COMPATIBLE.ps1" -ForegroundColor Red
    exit 1
}
$phpDir  = Split-Path -Parent $phpCmd.Source
$extDir  = Join-Path $phpDir "ext"
$iniFile = Join-Path $phpDir "php.ini"
Write-Host "[OK] PHP encontrado en: $phpDir" -ForegroundColor Green

# ── Verificar Oracle Instant Client en PATH ────────────────────────────────────
Write-Host "Verificando Oracle Instant Client en PATH..." -ForegroundColor Yellow
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
        Write-Host "[AVISO] Instant Client en '$icDir' pero no esta en PATH de esta sesion." -ForegroundColor Yellow
        Write-Host "        OCI8 se instalara — abre una nueva terminal tras terminar." -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] Oracle Instant Client no encontrado." -ForegroundColor Red
        Write-Host "  Ejecuta primero: 02-INSTALAR-INSTANT-CLIENT.ps1" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[OK] oci.dll encontrada en PATH" -ForegroundColor Green
}

# ── Detectar version y tipo (TS/NTS) de PHP ──────────────────────────────────
$phpVerFull = & php -r "echo PHP_VERSION;" 2>$null
$phpMajMin  = ($phpVerFull -split "\." | Select-Object -First 2) -join ""
$tsCheck    = & php -r "echo PHP_ZTS;" 2>$null
$tsLabel    = if ($tsCheck -eq "1") { "ts" } else { "nts" }
Write-Host "[OK] PHP $phpVerFull ($tsLabel)" -ForegroundColor Green
Write-Host ""

# ── Verificar si OCI8 ya esta funcionando ────────────────────────────────────
$oci8Cargado = (& php -m 2>$null) -match "^oci8$"
if ($oci8Cargado) {
    Write-Host "[OK] OCI8 ya esta cargado en PHP — no es necesario reinstalar" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# ── Obtener la DLL de OCI8 ───────────────────────────────────────────────────
$dllDestino = Join-Path $extDir "php_oci8.dll"

if (-not (Test-Path $dllDestino)) {
    Write-Host "Descargando php_oci8.dll para PHP $phpVerFull ($tsLabel)..." -ForegroundColor Yellow

    $oci8Version    = "3.3.0"
    $urlDll         = "https://windows.php.net/downloads/pecl/releases/oci8/$oci8Version/php_oci8-$oci8Version-$phpMajMin-$tsLabel-vc16-x64.dll"
    $urlPecl        = "https://windows.php.net/downloads/pecl/releases/oci8/$oci8Version/php_oci8-$oci8Version-$phpMajMin-$tsLabel-vc16-x64.zip"
    $descargaOk     = $false

    # Intentar DLL directa
    $tempDll = Join-Path $env:TEMP "php_oci8_download.dll"
    try {
        Write-Host "  Intentando DLL directa..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $urlDll -OutFile $tempDll -UseBasicParsing -ErrorAction Stop
        if ((Get-Item $tempDll).Length -gt 100000) {
            Copy-Item $tempDll $dllDestino -Force
            $descargaOk = $true
            Write-Host "  [OK] DLL descargada" -ForegroundColor Green
        }
    } catch {
        Write-Host "  DLL directa no disponible, intentando ZIP..." -ForegroundColor Gray
    }

    # Intentar ZIP
    if (-not $descargaOk) {
        $tempZip = Join-Path $env:TEMP "php_oci8.zip"
        $tempDir = Join-Path $env:TEMP "php_oci8_extract"
        try {
            Invoke-WebRequest -Uri $urlPecl -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
            New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
            Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
            $dllEnZip = Get-ChildItem $tempDir -Filter "php_oci8*.dll" -Recurse | Select-Object -First 1
            if ($dllEnZip) {
                Copy-Item $dllEnZip.FullName $dllDestino -Force
                $descargaOk = $true
                Write-Host "  [OK] DLL extraida del ZIP" -ForegroundColor Green
            }
        } catch {
            Write-Host "  [AVISO] Descarga automatica fallida: $_" -ForegroundColor Yellow
        } finally {
            Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    if (-not $descargaOk) {
        Write-Host "[ERROR] No se pudo obtener php_oci8.dll automaticamente." -ForegroundColor Red
        Write-Host "Descarga manual desde:" -ForegroundColor Yellow
        Write-Host "  https://windows.php.net/downloads/pecl/releases/oci8/" -ForegroundColor Yellow
        Write-Host "Elige PHP $phpMajMin $tsLabel vc16 x64 y copia la DLL como:" -ForegroundColor Yellow
        Write-Host "  $dllDestino" -ForegroundColor Gray
        exit 1
    }
    Remove-Item $tempDll -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[OK] php_oci8.dll ya existe en: $dllDestino" -ForegroundColor Green
}

Write-Host ""

# ── Habilitar en php.ini ──────────────────────────────────────────────────────
Write-Host "Configurando php.ini..." -ForegroundColor Yellow

if (-not (Test-Path $iniFile)) {
    Write-Host "[ERROR] php.ini no encontrado en $phpDir" -ForegroundColor Red
    exit 1
}

$iniContent = Get-Content $iniFile -Raw

if ($iniContent -match "(?m)^[;]*\s*extension\s*=\s*(php_)?oci8") {
    $iniContent = $iniContent -replace "(?m)^[;]*\s*extension\s*=\s*(php_)?oci8.*", "extension=oci8"
    Write-Host "[OK] Linea OCI8 activada en php.ini" -ForegroundColor Green
} else {
    $iniContent = $iniContent.TrimEnd() + "`r`n`r`n; Oracle OCI8 para Instant Client`r`nextension=oci8`r`n"
    Write-Host "[OK] Linea OCI8 agregada a php.ini" -ForegroundColor Green
}

if ($iniContent -match '(?m)^;\s*extension_dir') {
    $iniContent = $iniContent -replace '(?m)^;\s*extension_dir\s*=\s*"ext"', 'extension_dir="ext"'
}

Set-Content -Path $iniFile -Value $iniContent -Encoding UTF8
Write-Host "[OK] php.ini guardado" -ForegroundColor Green
Write-Host ""

# ── Verificar ────────────────────────────────────────────────────────────────
Write-Host "Verificando que OCI8 carga..." -ForegroundColor Yellow
$oci8Resultado = & php -m 2>$null | Select-String "^oci8$"
if ($oci8Resultado) {
    Write-Host "[OK] OCI8 cargado exitosamente" -ForegroundColor Green
} else {
    Write-Host "[AVISO] OCI8 aun no aparece en 'php -m'." -ForegroundColor Yellow
    Write-Host "  Abre una nueva terminal (para que PATH con Instant Client este activo)" -ForegroundColor Yellow
    Write-Host "  y ejecuta: php -m | findstr oci8" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   OCI8 CONFIGURADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  DLL  : $dllDestino" -ForegroundColor Gray
Write-Host "  INI  : $iniFile" -ForegroundColor Gray
Write-Host ""
