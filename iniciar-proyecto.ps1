# ==================================================================
# Script para Iniciar el Proyecto Completo
# Sistema de Gestion Zootecnica Caprina - Windows (Sin Docker)
# ==================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Sistema de Gestion Zootecnica Caprina - Configuracion Inicial" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# ==================================================================
# PASO 1: Verificar Oracle Database
# ==================================================================
Write-Host "[PASO 1/5] Verificando Oracle Database..." -ForegroundColor Yellow

$oracleService = Get-Service -Name "OracleServiceXE" -ErrorAction SilentlyContinue
if ($null -eq $oracleService) {
    Write-Host "  [ERROR] Servicio Oracle no encontrado" -ForegroundColor Red
    exit 1
}

if ($oracleService.Status -ne "Running") {
    Write-Host "  Iniciando servicio Oracle..." -ForegroundColor Cyan
    Start-Service OracleServiceXE
    Start-Sleep -Seconds 5
}
Write-Host "  Oracle Database: RUNNING" -ForegroundColor Green

# Verificar listener
$listenerService = Get-Service -Name "OracleOraDB21Home1TNSListener" -ErrorAction SilentlyContinue
if ($listenerService.Status -ne "Running") {
    Write-Host "  Iniciando Oracle Listener..." -ForegroundColor Cyan
    Start-Service OracleOraDB21Home1TNSListener
    Start-Sleep -Seconds 3
}
Write-Host "  Oracle Listener: RUNNING" -ForegroundColor Green

# Verificar conexion PHP
Write-Host "  Verificando conexion PHP a Oracle..." -ForegroundColor Cyan
Set-Location backend-symfony
$output = php test-conexion-simple.php 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] No se puede conectar a Oracle desde PHP" -ForegroundColor Red
    Write-Host $output
    exit 1
}
Write-Host "  Conexion PHP-Oracle: OK" -ForegroundColor Green

# ==================================================================
# PASO 2: Instalar dependencias del backend (Symfony)
# ==================================================================
Write-Host ""
Write-Host "[PASO 2/5] Instalando dependencias de Symfony..." -ForegroundColor Yellow

if (-Not (Test-Path "vendor")) {
    Write-Host "  Intentando instalar con Composer..." -ForegroundColor Cyan
    composer install --no-interaction --prefer-dist --ignore-platform-reqs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Fallo Composer (puede ser problema de red)" -ForegroundColor Yellow
        Write-Host "  Intenta mas tarde ejecutar: cd backend-symfony; composer install" -ForegroundColor Gray
    } else {
        Write-Host "  Dependencias Symfony instaladas" -ForegroundColor Green
    }
} else {
    Write-Host "  Dependencias ya instaladas (vendor existe)" -ForegroundColor Green
}

# ==================================================================
# PASO 3: Generar claves JWT
# ==================================================================
Write-Host ""
Write-Host "[PASO 3/5] Generando claves JWT para autenticacion..." -ForegroundColor Yellow

if (-Not (Test-Path "config/jwt/private.pem")) {
    Write-Host "  Generando par de claves RSA..." -ForegroundColor Cyan
    
    # Crear directorio si no existe
    New-Item -ItemType Directory -Force -Path "config/jwt" | Out-Null
    
    # Generar clave privada
    openssl genpkey -algorithm RSA -out config/jwt/private.pem -pkeyopt rsa_keygen_bits:4096
    
    # Generar clave publica
    openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
    
    Write-Host "  Claves JWT generadas correctamente" -ForegroundColor Green
} else {
    Write-Host "  Claves JWT ya existen" -ForegroundColor Green
}

# ==================================================================
# PASO 4: Instalar dependencias del frontend (React)
# ==================================================================
Write-Host ""
Write-Host "[PASO 4/5] Instalando dependencias de React..." -ForegroundColor Yellow
Set-Location ../frontend-web

if (-Not (Test-Path "node_modules")) {
    Write-Host "  Instalando con npm..." -ForegroundColor Cyan
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Fallo npm install (puede ser problema de red)" -ForegroundColor Yellow
        Write-Host "  Intenta mas tarde ejecutar: cd frontend-web; npm install" -ForegroundColor Gray
    } else {
        Write-Host "  Dependencias React instaladas" -ForegroundColor Green
    }
} else {
    Write-Host "  Dependencias ya instaladas (node_modules existe)" -ForegroundColor Green
}

Set-Location ..

# ==================================================================
# PASO 5: Guardar scripts de inicio rapido
# ==================================================================
Write-Host ""
Write-Host "[PASO 5/5] Creando scripts de inicio rapido..." -ForegroundColor Yellow

Set-Location ..

# Script para iniciar backend
$backendScript = @"
Write-Host "Iniciando Backend Symfony..." -ForegroundColor Cyan
Set-Location backend-symfony
php -S localhost:8000 -t public
"@
$backendScript | Out-File -FilePath "iniciar-backend.ps1" -Encoding UTF8

# Script para iniciar frontend
$frontendScript = @"
Write-Host "Iniciando Frontend React..." -ForegroundColor Cyan
Set-Location frontend-web
npm run dev
"@
$frontendScript | Out-File -FilePath "iniciar-frontend.ps1" -Encoding UTF8

Write-Host "  Scripts creados: iniciar-backend.ps1, iniciar-frontend.ps1" -ForegroundColor Green

# ==================================================================
# RESUMEN FINAL
# ==================================================================
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "  CONFIGURACION COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el sistema, abre 2 terminales PowerShell:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  TERMINAL 1 (Backend):" -ForegroundColor Yellow
Write-Host "    .\iniciar-backend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  TERMINAL 2 (Frontend):" -ForegroundColor Yellow
Write-Host "    .\iniciar-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Luego accede a:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8000/api" -ForegroundColor White
Write-Host ""
Write-Host "Usuario de prueba:" -ForegroundColor Cyan
Write-Host "  Email:    admin@caprino.com" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "Base de datos:" -ForegroundColor Cyan
Write-Host "  Host:     192.168.101.20:1521" -ForegroundColor White
Write-Host "  Service:  XEPDB1" -ForegroundColor White
Write-Host "  Usuario:  caprino_user" -ForegroundColor White
Write-Host ""
