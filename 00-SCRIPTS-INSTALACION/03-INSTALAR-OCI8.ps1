# ============================================================================
# 03-INSTALAR-OCI8.ps1
# Instala y habilita la extension OCI8 para Oracle en PHP
# Ejecutar: powershell -ExecutionPolicy Bypass -File "03-INSTALAR-OCI8.ps1"
# ============================================================================
# FIXES aplicados:
#   - Detecta si PHP es TS (Thread Safe) o NTS para descargar la DLL correcta
#   - Renombra la DLL a php_oci8.dll (lo que PHP busca con "extension=oci8")
#   - Verifica que OCI8 realmente carga despues de la configuracion
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALAR EXTENSION OCI8 PARA PHP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

# ── Verificar PHP ────────────────────────────────────────────────────────────
$phpCmd = Get-Command php -ErrorAction SilentlyContinue
if (-not $phpCmd) {
    Write-Host "[ERROR] PHP no encontrado. Ejecuta primero 00-INSTALAR-PHP-COMPATIBLE.ps1" -ForegroundColor Red
    exit 1
}
$phpDir  = Split-Path -Parent $phpCmd.Source
$extDir  = Join-Path $phpDir "ext"
$iniFile = Join-Path $phpDir "php.ini"

Write-Host "[OK] PHP encontrado en: $phpDir" -ForegroundColor Green

# ── Detectar version y tipo (TS/NTS) de PHP ──────────────────────────────────
# FIX: necesitamos saber si es Thread Safe para descargar la DLL correcta
$phpVerFull = & php -r "echo PHP_VERSION;" 2>$null                     # ej: 8.2.29
$phpMajMin  = ($phpVerFull -split "\." | Select-Object -First 2) -join ""  # ej: 82
$tsCheck    = & php -r "echo PHP_ZTS;" 2>$null                         # 1=TS, 0=NTS
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

# ── Verificar si la DLL ya existe ────────────────────────────────────────────
$dllDestino = Join-Path $extDir "php_oci8.dll"

if (-not (Test-Path $dllDestino)) {
    Write-Host "Descargando php_oci8.dll para PHP $phpVerFull ($tsLabel)..." -ForegroundColor Yellow

    # URL del PECL de OCI8 — version 3.3.0 es compatible con PHP 8.1 y 8.2
    # FIX: la URL incluye ts/nts segun el tipo de PHP detectado
    $oci8Version = "3.3.0"
    $dllNombreRemoto = "php_oci8-$oci8Version-$phpMajMin-$tsLabel-vc16-x64.zip"
    # PECL distribuye como ZIP con la DLL adentro
    $urlPecl = "https://windows.php.net/downloads/pecl/releases/oci8/$oci8Version/$dllNombreRemoto"

    # Algunos builds se distribuyen como .dll directo
    $urlDll  = "https://windows.php.net/downloads/pecl/releases/oci8/$oci8Version/php_oci8-$oci8Version-$phpMajMin-$tsLabel-vc16-x64.dll"

    $descargaOk = $false

    # Intentar descargar DLL directa
    $tempDll = Join-Path $env:TEMP "php_oci8_download.dll"
    try {
        Write-Host "  Intentando DLL directa..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $urlDll -OutFile $tempDll -UseBasicParsing -ErrorAction Stop
        if ((Get-Item $tempDll).Length -gt 100000) {   # minimo 100KB para una DLL valida
            Copy-Item $tempDll $dllDestino -Force
            $descargaOk = $true
            Write-Host "  [OK] DLL descargada directamente" -ForegroundColor Green
        }
    } catch {
        Write-Host "  DLL directa no disponible, intentando ZIP..." -ForegroundColor Gray
    }

    # Si fallo, intentar descargar ZIP y extraer
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
            Remove-Item $tempZip  -Force -ErrorAction SilentlyContinue
            Remove-Item $tempDir  -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    if (-not $descargaOk) {
        # Intentar copiar desde la instalacion de Oracle si existe
        $oracleHome = $env:ORACLE_HOME
        if ($oracleHome) {
            $oci8EnOracle = Get-ChildItem "$oracleHome" -Filter "php_oci8*.dll" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($oci8EnOracle) {
                Copy-Item $oci8EnOracle.FullName $dllDestino -Force
                $descargaOk = $true
                Write-Host "[OK] DLL copiada desde ORACLE_HOME" -ForegroundColor Green
            }
        }
    }

    if (-not $descargaOk) {
        Write-Host "[ERROR] No se pudo obtener php_oci8.dll automaticamente." -ForegroundColor Red
        Write-Host "Descarga manual desde: https://windows.php.net/downloads/pecl/releases/oci8/" -ForegroundColor Yellow
        Write-Host "Elige la version para PHP $phpMajMin $tsLabel vc16 x64 y copia la DLL como:" -ForegroundColor Yellow
        Write-Host "  $dllDestino" -ForegroundColor Gray
        exit 1
    }
    Remove-Item $tempDll -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[OK] php_oci8.dll ya existe en: $dllDestino" -ForegroundColor Green
}

Write-Host ""

# ── Habilitar en php.ini ─────────────────────────────────────────────────────
Write-Host "Configurando php.ini..." -ForegroundColor Yellow

if (-not (Test-Path $iniFile)) {
    Write-Host "[ERROR] php.ini no encontrado en $phpDir" -ForegroundColor Red
    exit 1
}

$iniContent = Get-Content $iniFile -Raw

# FIX: buscar cualquier forma existente de declarar oci8 y unificarla
# La forma correcta es "extension=oci8" (PHP resuelve a php_oci8.dll via extension_dir)
if ($iniContent -match "(?m)^[;]*\s*extension\s*=\s*(php_)?oci8") {
    # Ya existe (comentada o no) — asegurar que este activa sin punto y coma
    $iniContent = $iniContent -replace "(?m)^[;]*\s*extension\s*=\s*(php_)?oci8.*", "extension=oci8"
    Write-Host "[OK] Linea OCI8 actualizada en php.ini" -ForegroundColor Green
} else {
    # No existe — agregar al final
    $iniContent = $iniContent.TrimEnd() + "`r`n`r`n; Oracle OCI8`r`nextension=oci8`r`n"
    Write-Host "[OK] Linea OCI8 agregada a php.ini" -ForegroundColor Green
}

# Asegurar que extension_dir esta configurado
if ($iniContent -match '(?m)^;\s*extension_dir') {
    $iniContent = $iniContent -replace '(?m)^;\s*extension_dir\s*=\s*"ext"', 'extension_dir="ext"'
}

Set-Content -Path $iniFile -Value $iniContent -Encoding UTF8
Write-Host "[OK] php.ini guardado" -ForegroundColor Green

Write-Host ""

# ── Verificar que OCI8 carga ─────────────────────────────────────────────────
Write-Host "Verificando que OCI8 carga correctamente..." -ForegroundColor Yellow
$oci8Resultado = & php -m 2>$null | Select-String "^oci8$"
if ($oci8Resultado) {
    Write-Host "[OK] OCI8 cargado exitosamente en PHP" -ForegroundColor Green
} else {
    # Puede fallar si ORACLE_HOME no esta en PATH aun
    $errPhp = & php -r "echo 'test';" 2>&1
    Write-Host "[AVISO] OCI8 no aparece en php -m todavia." -ForegroundColor Yellow
    Write-Host "Esto puede ser porque ORACLE_HOME aun no esta en el PATH de esta sesion." -ForegroundColor Yellow
    Write-Host "Abre una NUEVA terminal y ejecuta: php -m | findstr oci8" -ForegroundColor Yellow
    Write-Host "Si sigue sin aparecer, verifica que 02-CONFIGURAR-ORACLE-ENV.ps1 se ejecuto como Admin." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   OCI8 CONFIGURADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  DLL  : $dllDestino" -ForegroundColor Gray
Write-Host "  INI  : $iniFile" -ForegroundColor Gray
Write-Host ""
