# ============================================================================
# 01-VERIFICAR-REQUISITOS.ps1
# ============================================================================
# PASO 1: Verificar que tienes todo instalado
# Ejecuta como Administrador:  
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        VERIFICACIÓN DE REQUISITOS - Proyecto Caprino              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$requisitos_ok = $true

# 1. Verificar PHP
Write-Host "🔍 Componente 1: PHP 8.2" -ForegroundColor Yellow
try {
    $phpVersion = php -v 2>$null
    if ($phpVersion -match "8\.2") {
        Write-Host "✅ PHP 8.2 INSTALADO" -ForegroundColor Green
        Write-Host $phpVersion.Split([Environment]::NewLine)[0] -ForegroundColor Gray
    } else {
        Write-Host "❌ PHP no está en versión 8.2" -ForegroundColor Red
        $requisitos_ok = $false
    }
} catch {
    Write-Host "❌ PHP NO ENCONTRADO - Instala PHP 8.2 primero" -ForegroundColor Red
    $requisitos_ok = $false
}

Write-Host ""

# 2. Verificar Composer
Write-Host "🔍 Componente 2: Composer" -ForegroundColor Yellow
try {
    $composerVersion = composer --version 2>$null
    Write-Host "✅ Composer INSTALADO" -ForegroundColor Green
    Write-Host $composerVersion -ForegroundColor Gray
} catch {
    Write-Host "❌ Composer NO ENCONTRADO - Se instalará en el siguiente paso" -ForegroundColor Red
}

Write-Host ""

# 3. Verificar OCI8
Write-Host "🔍 Componente 3: OCI8 (Extensión Oracle)" -ForegroundColor Yellow
try {
    $oci8 = php -m | Select-String oci8
    if ($oci8) {
        Write-Host "✅ OCI8 CARGADO EN PHP" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OCI8 NO CARGADO - Se configurará en el siguiente paso" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar OCI8" -ForegroundColor Yellow
}

Write-Host ""

# 4. Verificar Oracle Client
Write-Host "🔍 Componente 4: Oracle Client" -ForegroundColor Yellow
if (Test-Path "C:\Oracle") {
    Write-Host "✅ Directorio Oracle ENCONTRADO en C:\Oracle" -ForegroundColor Green
} else {
    Write-Host "❌ Oracle NO INSTALADO - Se configurará en el siguiente paso" -ForegroundColor Red
    $requisitos_ok = $false
}

Write-Host ""

# 5. Verificar Node.js
Write-Host "🔍 Componente 5: Node.js (para frontend)" -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>$null
    Write-Host "✅ Node.js INSTALADO" -ForegroundColor Green
    Write-Host "Versión: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Node.js NO ENCONTRADO (necesario para frontend)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($requisitos_ok) {
    Write-Host "║  ✅ REQUISITOS BÁSICOS OK - Continúa con el script 02              ║" -ForegroundColor Green
} else {
    Write-Host "║  ❌ FALTAN COMPONENTES - Instala los marcados en rojo             ║" -ForegroundColor Red
}
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Pausa
Read-Host "Presiona ENTER para continuar"
