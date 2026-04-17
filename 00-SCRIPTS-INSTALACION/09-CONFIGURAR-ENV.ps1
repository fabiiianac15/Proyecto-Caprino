# 09-CONFIGURAR-ENV.ps1
# Configura archivos .env para backend y frontend

Write-Host ""
Write-Host "CONFIGURAR ARCHIVOS .env" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# ============================================================================
# Backend .env
# ============================================================================

Write-Host "Configurando backend .env..." -ForegroundColor Yellow

$backendEnvPath = "$projectRoot\backend-symfony\.env"

if (-not (Test-Path $backendEnvPath)) {
    Write-Host "✗ Archivo .env no encontrado: $backendEnvPath" -ForegroundColor Red
    exit 1
}

try {
    $envContent = Get-Content $backendEnvPath -Raw
    
    # Actualizar valores de base de datos
    $envContent = $envContent -replace 'DATABASE_HOST=.*', 'DATABASE_HOST=127.0.0.1'
    $envContent = $envContent -replace 'DATABASE_PORT=.*', 'DATABASE_PORT=1521'
    $envContent = $envContent -replace 'DATABASE_NAME=.*', 'DATABASE_NAME=XEPDB1'
    $envContent = $envContent -replace 'DATABASE_USER=.*', 'DATABASE_USER=caprino'
    $envContent = $envContent -replace 'DATABASE_PASSWORD=.*', 'DATABASE_PASSWORD=CaprinoPass2025'
    
    # Generar secreto aleatorio si es necesario
    if ($envContent -match 'APP_SECRET=cambiar_este_secreto') {
        $newSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        $envContent = $envContent -replace 'APP_SECRET=cambiar_este_secreto.*', "APP_SECRET=$newSecret"
    }
    
    Set-Content -Path $backendEnvPath -Value $envContent -Encoding UTF8
    Write-Host "✓ Backend .env configurado" -ForegroundColor Green
} catch {
    Write-Host "✗ Error configurando backend .env: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Frontend .env.local
# ============================================================================

Write-Host "Configurando frontend .env..." -ForegroundColor Yellow

$frontendEnvPath = "$projectRoot\frontend-web\.env.local"

$frontendEnvContent = @"
# Configuración del ambiente frontend
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Sistema Caprino
VITE_DEBUG=true
"@

try {
    Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Encoding UTF8
    Write-Host "✓ Frontend .env.local configurado" -ForegroundColor Green
} catch {
    Write-Host "✗ Error configurando frontend .env: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Verificación
# ============================================================================

Write-Host ""
Write-Host "Configuración completada:" -ForegroundColor Green
Write-Host "  ✓ Backend: $backendEnvPath"
Write-Host "  ✓ Frontend: $frontendEnvPath"
Write-Host ""
Write-Host "Los archivos .env están listos para usar" -ForegroundColor Green
Write-Host ""
