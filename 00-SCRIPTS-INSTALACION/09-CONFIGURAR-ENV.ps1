# ============================================================================
# 09-CONFIGURAR-ENV.ps1
# Configura los archivos .env para backend y frontend
# Ejecutar: powershell -ExecutionPolicy Bypass -File "09-CONFIGURAR-ENV.ps1"
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURAR ARCHIVOS .env" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# ── Leer configuracion actual del sistema ─────────────────────────────────────
$tnsAdmin = [System.Environment]::GetEnvironmentVariable("TNS_ADMIN", "Machine")
$tnsName  = $null

if ($tnsAdmin -and (Test-Path "$tnsAdmin\tnsnames.ora")) {
    $tnsLines = Get-Content "$tnsAdmin\tnsnames.ora"
    $nombres  = $tnsLines | Where-Object { $_ -match "^\w.*=\s*\(" } | ForEach-Object {
        ($_ -split "=")[0].Trim()
    }
    $tnsName = $nombres | Where-Object { $_ -match "_high$" } | Select-Object -First 1
    if (-not $tnsName) { $tnsName = $nombres | Select-Object -First 1 }
}

# ── Backend .env ──────────────────────────────────────────────────────────────
Write-Host "Configurando backend\.env..." -ForegroundColor Yellow

$backendEnvPath = Join-Path $projectRoot "backend-symfony\.env"

if (-not (Test-Path $backendEnvPath)) {
    Write-Host "[ERROR] backend\.env no encontrado: $backendEnvPath" -ForegroundColor Red
    exit 1
}

try {
    # Usar ReadAllText para leer correctamente sin importar si hay BOM o no
    $utf8NoBom  = New-Object System.Text.UTF8Encoding $false
    $envContent = [System.IO.File]::ReadAllText($backendEnvPath, (New-Object System.Text.UTF8Encoding $true))
    # Quitar caracter BOM (U+FEFF) si quedo en el string
    $envContent = $envContent -replace "^\xEF\xBB\xBF", ""
    if ($envContent[0] -eq [char]0xFEFF) { $envContent = $envContent.Substring(1) }

    # Generar APP_SECRET si tiene el valor por defecto
    if ($envContent -match 'APP_SECRET=cambiar_este_secreto') {
        $appSecret  = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
        $envContent = $envContent -replace '(?m)^APP_SECRET=.*', "APP_SECRET=$appSecret"
        Write-Host "[OK] APP_SECRET generado aleatoriamente" -ForegroundColor Green
    }

    # Generar JWT_SECRET si tiene el valor por defecto
    $jwtSecret  = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    if ($envContent -match '(?m)^JWT_SECRET=') {
        $envContent = $envContent -replace '(?m)^JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
        Write-Host "[OK] JWT_SECRET generado aleatoriamente" -ForegroundColor Green
    } else {
        $envContent = $envContent.TrimEnd() + "`r`n`r`nJWT_SECRET=$jwtSecret`r`n"
        Write-Host "[OK] JWT_SECRET agregado" -ForegroundColor Green
    }

    # Actualizar TNS_ADMIN y TNS_NAME si se detectaron
    if ($tnsAdmin) {
        $envContent = $envContent -replace '(?m)^DATABASE_WALLET_PATH=.*', "DATABASE_WALLET_PATH=$tnsAdmin"
        Write-Host "[OK] DATABASE_WALLET_PATH = $tnsAdmin" -ForegroundColor Green
    }
    if ($tnsName) {
        $envContent = $envContent -replace '(?m)^DATABASE_TNS_NAME=.*', "DATABASE_TNS_NAME=$tnsName"
        Write-Host "[OK] DATABASE_TNS_NAME = $tnsName" -ForegroundColor Green
    }

    [System.IO.File]::WriteAllText($backendEnvPath, $envContent, $utf8NoBom)
    Write-Host "[OK] backend\.env configurado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error configurando backend\.env: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Frontend .env.local ───────────────────────────────────────────────────────
Write-Host "Configurando frontend\.env.local..." -ForegroundColor Yellow

$frontendEnvPath = Join-Path $projectRoot "frontend-web\.env.local"
$frontendEnvContent = @"
# Configuracion local de la maquina (sobreescribe frontend-web/.env)
# Este archivo es ignorado por git
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Sistema Caprino
"@

try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($frontendEnvPath, $frontendEnvContent, $utf8NoBom)
    Write-Host "[OK] frontend\.env.local configurado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error configurando frontend\.env.local: $_" -ForegroundColor Red
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
if ($tnsName) {
    Write-Host "Oracle Autonomous DB:" -ForegroundColor Cyan
    Write-Host "  TNS alias: $tnsName" -ForegroundColor Gray
    Write-Host "  Wallet   : $tnsAdmin" -ForegroundColor Gray
    Write-Host ""
}
Write-Host "Credenciales de la base de datos:" -ForegroundColor Cyan
Write-Host "  Usuario  : caprino_user" -ForegroundColor Gray
Write-Host "  Password : (la configurada en 02b-CREAR-USUARIO-ORACLE.ps1)" -ForegroundColor Gray
Write-Host ""
