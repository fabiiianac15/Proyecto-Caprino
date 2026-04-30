# ============================================================================
# 02-INSTALAR-INSTANT-CLIENT.ps1
# Descarga e instala Oracle Instant Client 21.x para Windows x64
# Incluye: Basic (librerias OCI) + SQL*Plus (para conectarse al ADB por consola)
# Ejecutar: powershell -ExecutionPolicy Bypass -File "02-INSTALAR-INSTANT-CLIENT.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALAR ORACLE INSTANT CLIENT 21.x" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Oracle Instant Client es un cliente ligero (~120 MB) que permite" -ForegroundColor Gray
Write-Host "a PHP/OCI8 y SQL*Plus conectarse a Oracle Autonomous DB." -ForegroundColor Gray
Write-Host "No instala ningun servicio de base de datos local." -ForegroundColor Gray
Write-Host ""

$icVersion  = "21.14.0.0.0"
$icBuild    = "2114000"
$installDir = "C:\oracle\instantclient_21_14"

$urlBase    = "https://download.oracle.com/otn_software/nt/instantclient/$icBuild"
$urlBasic   = "$urlBase/instantclient-basic-windows.x64-$icVersion`dbru.zip"
$urlSqlplus = "$urlBase/instantclient-sqlplus-windows.x64-$icVersion`dbru.zip"

# ── Verificar si ya esta instalado ────────────────────────────────────────────
if (Test-Path "$installDir\oci.dll") {
    Write-Host "[OK] Oracle Instant Client ya instalado en: $installDir" -ForegroundColor Green
    Write-Host "     Verificando que $installDir este en PATH..." -ForegroundColor Gray

    # Asegurar que el directorio este en el PATH (puede haber fallado antes por permisos)
    $machinePath  = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
    $userPath     = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
    $entradasM    = $machinePath -split ";" | Where-Object { $_ -ne "" }
    $entradasU    = $userPath    -split ";" | Where-Object { $_ -ne "" }

    if ($entradasM -notcontains $installDir -and $entradasU -notcontains $installDir) {
        try {
            $nuevoPath = ($entradasM + $installDir) -join ";"
            [Environment]::SetEnvironmentVariable("Path", $nuevoPath, [EnvironmentVariableTarget]::Machine)
            Write-Host "[OK] '$installDir' agregado al PATH del sistema" -ForegroundColor Green
        } catch {
            $nuevoPathU = ($entradasU + $installDir) -join ";"
            [Environment]::SetEnvironmentVariable("Path", $nuevoPathU, [EnvironmentVariableTarget]::User)
            Write-Host "[OK] '$installDir' agregado al PATH del usuario" -ForegroundColor Green
        }
    } else {
        Write-Host "[OK] '$installDir' ya esta en PATH" -ForegroundColor Green
    }

    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [Environment]::GetEnvironmentVariable("Path","User")

    if (Get-Command sqlplus -ErrorAction SilentlyContinue) {
        Write-Host "[OK] sqlplus disponible en PATH" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Abre una nueva terminal para que el PATH actualizado surta efecto." -ForegroundColor Yellow
    }
    exit 0
}

# ── Crear directorio destino ───────────────────────────────────────────────────
Write-Host "Directorio destino: $installDir" -ForegroundColor Gray
if (-not (Test-Path $installDir)) {
    New-Item -Path $installDir -ItemType Directory -Force | Out-Null
}
Write-Host ""

# ── Funcion para descargar y extraer un paquete ───────────────────────────────
function Instalar-Paquete {
    param([string]$Nombre, [string]$Url)

    Write-Host "Descargando $Nombre..." -ForegroundColor Yellow
    $tempZip = Join-Path $env:TEMP "ic_$Nombre.zip"

    try {
        Invoke-WebRequest -Uri $Url -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
        Write-Host "  [OK] Descargado" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] No se pudo descargar $Nombre`: $_" -ForegroundColor Red
        Write-Host "  Descarga manual: $Url" -ForegroundColor Yellow
        return $false
    }

    Write-Host "  Extrayendo $Nombre..." -ForegroundColor Gray
    try {
        $tempDir = Join-Path $env:TEMP "ic_extract_$Nombre"
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
        Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

        # Los archivos estan dentro de una subcarpeta instantclient_21_14
        $subDir = Get-ChildItem $tempDir -Directory | Select-Object -First 1
        if ($subDir) {
            Get-ChildItem $subDir.FullName | Copy-Item -Destination $installDir -Force
        } else {
            Get-ChildItem $tempDir | Copy-Item -Destination $installDir -Force
        }
        Write-Host "  [OK] Extraido en $installDir" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Error al extraer: $_" -ForegroundColor Red
        return $false
    } finally {
        Remove-Item $tempZip  -Force -ErrorAction SilentlyContinue
        Remove-Item $tempDir  -Recurse -Force -ErrorAction SilentlyContinue
    }
    return $true
}

# ── Instalar paquetes ─────────────────────────────────────────────────────────
$okBasic   = Instalar-Paquete -Nombre "basic"   -Url $urlBasic
$okSqlplus = Instalar-Paquete -Nombre "sqlplus"  -Url $urlSqlplus
Write-Host ""

if (-not $okBasic) {
    Write-Host "[ERROR] El paquete Basic es obligatorio. Instalacion cancelada." -ForegroundColor Red
    Write-Host ""
    Write-Host "Descarga manual desde:" -ForegroundColor Yellow
    Write-Host "  https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html" -ForegroundColor Yellow
    Write-Host "Elige '21.x Basic' y '21.x SQL*Plus', extraelos en: $installDir" -ForegroundColor Yellow
    exit 1
}

# ── Agregar al PATH ───────────────────────────────────────────────────────────
Write-Host "Configurando PATH..." -ForegroundColor Yellow

$machinePath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
$entradas    = $machinePath -split ";" | Where-Object { $_ -ne "" }

if ($entradas -notcontains $installDir) {
    $nuevoPath = ($entradas + $installDir) -join ";"
    try {
        [Environment]::SetEnvironmentVariable("Path", $nuevoPath, [EnvironmentVariableTarget]::Machine)
        Write-Host "[OK] '$installDir' agregado al PATH del sistema" -ForegroundColor Green
    } catch {
        # Sin permisos de admin: agregar al PATH del usuario
        Write-Host "[AVISO] Sin permisos admin para PATH de sistema. Agregando al PATH de usuario..." -ForegroundColor Yellow
        $userPath    = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        $entradasU   = $userPath -split ";" | Where-Object { $_ -ne "" }
        if ($entradasU -notcontains $installDir) {
            $nuevoPathU = ($entradasU + $installDir) -join ";"
            [Environment]::SetEnvironmentVariable("Path", $nuevoPathU, [EnvironmentVariableTarget]::User)
            Write-Host "[OK] '$installDir' agregado al PATH del usuario" -ForegroundColor Green
        } else {
            Write-Host "[OK] '$installDir' ya estaba en el PATH del usuario" -ForegroundColor Green
        }
    }
} else {
    Write-Host "[OK] '$installDir' ya estaba en el PATH" -ForegroundColor Green
}

# Refrescar PATH en la sesion actual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""

# ── Verificar instalacion ─────────────────────────────────────────────────────
Write-Host "Verificando instalacion..." -ForegroundColor Yellow

if (Test-Path "$installDir\oci.dll") {
    Write-Host "[OK] oci.dll encontrada  -  Instant Client listo" -ForegroundColor Green
} else {
    Write-Host "[ERROR] oci.dll no encontrada en $installDir" -ForegroundColor Red
    exit 1
}

if ($okSqlplus -and (Test-Path "$installDir\sqlplus.exe")) {
    Write-Host "[OK] sqlplus.exe instalado" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ORACLE INSTANT CLIENT INSTALADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ruta    : $installDir" -ForegroundColor Gray
Write-Host "  Version : $icVersion" -ForegroundColor Gray
Write-Host ""
Write-Host "Siguiente paso: ejecuta 02-CONFIGURAR-WALLET.ps1" -ForegroundColor Yellow
Write-Host "(configura el wallet de Oracle Autonomous DB)" -ForegroundColor Gray
Write-Host ""
