# ============================================================================
# 00-INSTALACION-COMPLETA.ps1
# Script maestro  -  ejecuta todos los pasos de instalacion en orden
# Ejecutar: powershell -ExecutionPolicy Bypass -File "00-INSTALACION-COMPLETA.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALACION COMPLETA - PROYECTO CAPRINO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script instalara y configurara todo lo necesario para" -ForegroundColor Yellow
Write-Host "conectarse a Oracle Autonomous Database en la nube." -ForegroundColor Yellow
Write-Host "Duracion estimada: 10-15 minutos segun la velocidad de internet." -ForegroundColor Yellow
Write-Host ""
Write-Host "PREREQUISITO: Tener el wallet de Oracle Autonomous DB descargado" -ForegroundColor Cyan
Write-Host "  Oracle Cloud Console -> ADB -> DB Connection -> Download Wallet" -ForegroundColor Gray
Write-Host "  Extraer el ZIP en: C:\Caprino-Wallet" -ForegroundColor Gray
Write-Host ""

$scriptDir   = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptDir

Write-Host "Directorio scripts : $scriptDir" -ForegroundColor Gray
Write-Host "Directorio proyecto: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Lista de pasos en orden
$pasos = @(
    @{ num = "00b"; nombre = "Visual C++ Runtime (prerequisito PHP)";       archivo = "00b-INSTALAR-VCRUNTIME.ps1";            admin = $false },
    @{ num = "00" ; nombre = "Instalar PHP 8.2";                            archivo = "00-INSTALAR-PHP-COMPATIBLE.ps1";         admin = $false },
    @{ num = "00c"; nombre = "Instalar Node.js";                            archivo = "00c-INSTALAR-NODE.ps1";                  admin = $false },
    @{ num = "02-IC"; nombre = "Instalar Oracle Instant Client";            archivo = "02-INSTALAR-INSTANT-CLIENT.ps1";         admin = $false },
    @{ num = "02" ; nombre = "Configurar wallet Oracle Autonomous DB";      archivo = "02-CONFIGURAR-ORACLE-ENV.ps1";           admin = $true  },
    @{ num = "02b"; nombre = "Crear usuario y tablas en Oracle ADB";        archivo = "02b-CREAR-USUARIO-ORACLE.ps1";           admin = $false },
    @{ num = "03" ; nombre = "Instalar extension OCI8 para PHP";            archivo = "03-INSTALAR-OCI8.ps1";                   admin = $false },
    @{ num = "03b"; nombre = "Instalar Composer";                           archivo = "03b-INSTALAR-COMPOSER.ps1";              admin = $false },
    @{ num = "04" ; nombre = "Instalar dependencias backend";               archivo = "04-INSTALAR-DEPENDENCIAS-BACKEND.ps1";   admin = $false },
    @{ num = "05" ; nombre = "Instalar dependencias frontend";              archivo = "05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1";  admin = $false },
    @{ num = "09" ; nombre = "Configurar archivos .env";                    archivo = "09-CONFIGURAR-ENV.ps1";                  admin = $false },
    @{ num = "01" ; nombre = "Verificar requisitos (comprobacion final)";   archivo = "01-VERIFICAR-REQUISITOS.ps1";            admin = $false }
)

Write-Host "Pasos a ejecutar:" -ForegroundColor Cyan
foreach ($p in $pasos) {
    $adminTag = if ($p.admin) { " [requiere Admin]" } else { "" }
    Write-Host ("  [{0}] {1}{2}" -f $p.num, $p.nombre, $adminTag)
}
Write-Host ""

$resp = Read-Host "Continuar? (s/n)"
if ($resp -notmatch "^[sS]$") {
    Write-Host "Instalacion cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

$ok     = 0
$fallos = 0

foreach ($paso in $pasos) {
    $ruta = Join-Path $scriptDir $paso.archivo

    Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "Paso [$($paso.num)] $($paso.nombre)" -ForegroundColor Green
    Write-Host "------------------------------------------------------------" -ForegroundColor Cyan

    if (-not (Test-Path $ruta)) {
        Write-Host "[AVISO] Script no encontrado: $($paso.archivo)  -  saltando" -ForegroundColor Yellow
        continue
    }

    try {
        if ($paso.admin) {
            Write-Host "Este paso requiere permisos de Administrador." -ForegroundColor Yellow
            Write-Host "Se abrira una ventana elevada. Espera a que termine antes de continuar." -ForegroundColor Yellow
            Write-Host ""
            $proc = Start-Process powershell.exe `
                -ArgumentList "-ExecutionPolicy Bypass -File `"$ruta`"" `
                -Verb RunAs `
                -PassThru `
                -Wait
            if ($proc.ExitCode -ne 0) {
                throw "El script termino con codigo $($proc.ExitCode)"
            }
        } else {
            & $ruta
            if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
                throw "El script termino con codigo $LASTEXITCODE"
            }
        }
        Write-Host "[OK] Paso completado" -ForegroundColor Green
        $ok++
    } catch {
        Write-Host "[ERROR] $_" -ForegroundColor Red
        $fallos++
        $continuar = Read-Host "Continuar con el siguiente paso? (s/n)"
        if ($continuar -notmatch "^[sS]$") {
            Write-Host "Instalacion cancelada por el usuario." -ForegroundColor Red
            exit 1
        }
    }

    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALACION FINALIZADA" -ForegroundColor Cyan
Write-Host "   Pasos exitosos: $ok   Fallos: $fallos" -ForegroundColor $(if ($fallos -eq 0) { "Green" } else { "Yellow" })
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el sistema:" -ForegroundColor Cyan
Write-Host "  1. Abrir terminal 1 -> doble clic en: 07-INICIAR-BACKEND.bat" -ForegroundColor White
Write-Host "  2. Abrir terminal 2 -> doble clic en: 08-INICIAR-FRONTEND.bat" -ForegroundColor White
Write-Host ""
Write-Host "La aplicacion estara disponible en: http://localhost:5173" -ForegroundColor Green
Write-Host "(con el backend corriendo en:        http://localhost:8000)" -ForegroundColor Gray
Write-Host ""
Read-Host "Presiona ENTER para cerrar"
