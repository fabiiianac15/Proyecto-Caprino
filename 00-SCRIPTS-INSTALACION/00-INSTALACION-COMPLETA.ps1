# 00-INSTALACION-COMPLETA.ps1
# Script maestro que ejecuta la instalación completa en orden

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        INSTALACIÓN COMPLETA - PROYECTO CAPRINO         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script ejecutará todos los pasos de instalación en orden" -ForegroundColor Yellow
Write-Host ""

$scriptDir = Split-Path -Resolve $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptDir

# Lista de scripts a ejecutar en orden
$scripts = @(
    @{ num = "00b"; name = "Instalar Visual C++ Runtime"; file = "00b-INSTALAR-VCRUNTIME.ps1"; admin = $false },
    @{ num = "00"; name = "Instalar PHP compatible"; file = "00-INSTALAR-PHP-COMPATIBLE.ps1"; admin = $false },
    @{ num = "00c"; name = "Instalar Node.js"; file = "00c-INSTALAR-NODE.ps1"; admin = $false },
    @{ num = "01"; name = "Verificar requisitos"; file = "01-VERIFICAR-REQUISITOS.ps1"; admin = $false },
    @{ num = "02"; name = "Configurar Oracle ENV"; file = "02-CONFIGURAR-ORACLE-ENV.ps1"; admin = $true },
    @{ num = "02b"; name = "Crear usuario Oracle"; file = "02b-CREAR-USUARIO-ORACLE.ps1"; admin = $false },
    @{ num = "03"; name = "Instalar OCI8"; file = "03-INSTALAR-OCI8.ps1"; admin = $true },
    @{ num = "03b"; name = "Instalar Composer"; file = "03b-INSTALAR-COMPOSER.ps1"; admin = $false },
    @{ num = "04"; name = "Instalar dependencias backend"; file = "04-INSTALAR-DEPENDENCIAS-BACKEND.ps1"; admin = $false },
    @{ num = "05"; name = "Instalar dependencias frontend"; file = "05-INSTALAR-DEPENDENCIAS-FRONTEND.ps1"; admin = $false },
    @{ num = "09"; name = "Configurar .env"; file = "09-CONFIGURAR-ENV.ps1"; admin = $false }
)

# Mostrar resumen
Write-Host "Se ejecutarán los siguientes pasos:" -ForegroundColor Cyan
Write-Host ""
$scripts | ForEach-Object {
    $adminIcon = if ($_.admin) { " [ADMIN]" } else { "" }
    Write-Host "  $($_.num) - $($_.name)$adminIcon"
}
Write-Host ""

$response = Read-Host "¿Deseas continuar? (s/n)"
if ($response -ne "s" -and $response -ne "S") {
    Write-Host "Instalación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Iniciando instalación..." -ForegroundColor Green
Write-Host ""

# Ejecutar scripts
$contador = 0
$totalScripts = $scripts.Count

foreach ($script in $scripts) {
    $contador++
    
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "[$contador/$totalScripts] $($script.name)" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $scriptPath = Join-Path $scriptDir $script.file
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "✗ Script no encontrado: $scriptPath" -ForegroundColor Red
        Write-Host ""
        continue
    }
    
    try {
        if ($script.admin) {
            Write-Host "Este paso requiere permisos de administrador" -ForegroundColor Yellow
            Write-Host "Se abrirá una nueva ventana de PowerShell con permisos elevados" -ForegroundColor Yellow
            Write-Host ""
            
            # Ejecutar como administrador
            $psCredential = New-Object System.Management.Automation.PSCredential (
                [System.Security.Principal.WindowsIdentity]::GetCurrent().User,
                (ConvertTo-SecureString -String "dummy" -AsPlainText -Force)
            )
            
            Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -Wait
        } else {
            # Ejecutar normally
            & $scriptPath
        }
        
        Write-Host ""
        Write-Host "✓ Paso completado" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error en el script: $_" -ForegroundColor Red
        Write-Host ""
        $continuar = Read-Host "¿Continuar con el siguiente paso? (s/n)"
        if ($continuar -ne "s" -and $continuar -ne "S") {
            Write-Host "Instalación cancelada" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
}

# Resumen final
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Ejecuta: 06-INICIAR-ORACLE.ps1 (para iniciar Oracle)"
Write-Host "  2. Abre 2 terminales separadas:"
Write-Host "     - Terminal 1: 07-INICIAR-BACKEND.bat"
Write-Host "     - Terminal 2: 08-INICIAR-FRONTEND.bat"
Write-Host ""
Write-Host "La aplicación estará disponible en: http://localhost:5173" -ForegroundColor Green
Write-Host ""
