# ============================================================================
# 09-CONFIGURAR-ENV.ps1
# Configura archivos .env para backend y frontend
# Ejecutar: powershell -ExecutionPolicy Bypass -File "09-CONFIGURAR-ENV.ps1"
# ============================================================================
# FIXES aplicados:
#   - DATABASE_USER corregido a caprino_user (no "caprino")
#   - JWT_SECRET generado y guardado en backend .env
#   - VITE_API_URL apunta al puerto 8000 (servidor PHP de desarrollo)
#   - Escribe frontend/.env.local (override local, no se sube a git)
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURAR ARCHIVOS .env" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# ── Backend .env ─────────────────────────────────────────────────────────────
Write-Host "Configurando backend .env..." -ForegroundColor Yellow

$backendEnvPath = Join-Path $projectRoot "backend-symfony\.env"

if (-not (Test-Path $backendEnvPath)) {
    Write-Host "[ERROR] Archivo .env no encontrado: $backendEnvPath" -ForegroundColor Red
    Write-Host "Asegurate de que la carpeta backend-symfony existe con su .env" -ForegroundColor Yellow
    exit 1
}

try {
    $envContent = Get-Content $backendEnvPath -Raw

    # FIX: usar caprino_user (no "caprino") — ese es el usuario creado en Oracle
    $envContent = $envContent -replace '(?m)^DATABASE_HOST=.*',     'DATABASE_HOST=127.0.0.1'
    $envContent = $envContent -replace '(?m)^DATABASE_PORT=.*',     'DATABASE_PORT=1521'
    $envContent = $envContent -replace '(?m)^DATABASE_NAME=.*',     'DATABASE_NAME=XEPDB1'
    $envContent = $envContent -replace '(?m)^DATABASE_USER=.*',     'DATABASE_USER=caprino_user'
    $envContent = $envContent -replace '(?m)^DATABASE_PASSWORD=.*', 'DATABASE_PASSWORD=CaprinoPass2025'

    # Generar APP_SECRET si tiene el valor por defecto
    if ($envContent -match 'APP_SECRET=cambiar_este_secreto') {
        $appSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
        $envContent = $envContent -replace '(?m)^APP_SECRET=.*', "APP_SECRET=$appSecret"
        Write-Host "[OK] APP_SECRET generado aleatoriamente" -ForegroundColor Green
    }

    # FIX: agregar o actualizar JWT_SECRET
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    if ($envContent -match '(?m)^JWT_SECRET=') {
        $envContent = $envContent -replace '(?m)^JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
        Write-Host "[OK] JWT_SECRET actualizado" -ForegroundColor Green
    } else {
        $envContent = $envContent.TrimEnd() + "`r`n`r`n# Clave para tokens JWT (generada automaticamente)`r`nJWT_SECRET=$jwtSecret`r`n"
        Write-Host "[OK] JWT_SECRET agregado" -ForegroundColor Green
    }

    Set-Content -Path $backendEnvPath -Value $envContent -Encoding UTF8
    Write-Host "[OK] Backend .env configurado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error configurando backend .env: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Frontend .env.local ───────────────────────────────────────────────────────
# Usamos .env.local porque es especifico de esta maquina y git lo ignora.
# El .env del repo ya tiene VITE_API_URL=http://localhost:8000/api como defecto.
Write-Host "Configurando frontend .env.local..." -ForegroundColor Yellow

$frontendEnvPath = Join-Path $projectRoot "frontend-web\.env.local"

$frontendEnvContent = @"
# Configuracion local de la maquina (sobreescribe frontend-web/.env)
# Este archivo es ignorado por git
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Sistema Caprino
"@

try {
    Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Encoding UTF8
    Write-Host "[OK] Frontend .env.local configurado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error configurando frontend .env.local: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos configurados:" -ForegroundColor Cyan
Write-Host "  Backend : $backendEnvPath" -ForegroundColor Gray
Write-Host "  Frontend: $frontendEnvPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Base de datos:" -ForegroundColor Cyan
Write-Host "  Usuario  : caprino_user" -ForegroundColor Gray
Write-Host "  Password : CaprinoPass2025" -ForegroundColor Gray
Write-Host "  Host     : 127.0.0.1:1521/XEPDB1" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend (dev):" -ForegroundColor Cyan
Write-Host "  Backend URL: http://localhost:8000/api" -ForegroundColor Gray
Write-Host ""
