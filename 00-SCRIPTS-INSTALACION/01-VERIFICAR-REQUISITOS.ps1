# ============================================================================
# 01-VERIFICAR-REQUISITOS.ps1
# ============================================================================

Write-Host ""
Write-Host "==== VERIFICACION DE REQUISITOS - Proyecto Caprino ====" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH con variables de entorno del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$requisitos_ok = $true

# 1. Verificar PHP
Write-Host "[1] Verificando PHP 8.2..." -ForegroundColor Yellow
try {
    $phpVersion = php -v 2>$null
    if ($phpVersion -match "8\.2") {
        Write-Host "[OK] PHP 8.2 instalado" -ForegroundColor Green
        $line = $phpVersion.Split([Environment]::NewLine)[0]
        Write-Host "     $line" -ForegroundColor Gray
    } else {
        Write-Host "[ERROR] PHP no esta en version 8.2" -ForegroundColor Red
        $requisitos_ok = $false
    }
} catch {
    Write-Host "[ERROR] PHP NO ENCONTRADO" -ForegroundColor Red
    $requisitos_ok = $false
}

Write-Host ""

# 2. Verificar Composer
Write-Host "[2] Verificando Composer..." -ForegroundColor Yellow
try {
    $composerVersion = composer --version 2>$null
    Write-Host "[OK] Composer instalado" -ForegroundColor Green
    Write-Host "     $composerVersion" -ForegroundColor Gray
} catch {
    Write-Host "[AVISO] Composer NO encontrado" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar OCI8
Write-Host "[3] Verificando OCI8 (Extension Oracle)..." -ForegroundColor Yellow
try {
    $oci8 = php -m 2>$null | Select-String oci8
    if ($oci8) {
        Write-Host "[OK] OCI8 cargado" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] OCI8 no cargado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[AVISO] No se pudo verificar OCI8" -ForegroundColor Yellow
}

Write-Host ""

# 4. Verificar Oracle Client
Write-Host "[4] Verificando Oracle Client..." -ForegroundColor Yellow
try {
    $sqlplusPath = (Get-Command sqlplus -ErrorAction SilentlyContinue).Source
    if ($sqlplusPath) {
        Write-Host "[OK] Oracle Client encontrado" -ForegroundColor Green
        $oracleHome = Split-Path -Parent (Split-Path -Parent $sqlplusPath)
        Write-Host "     Ubicación: $oracleHome" -ForegroundColor Gray
    } else {
        Write-Host "[AVISO] Oracle Client no encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[AVISO] No se pudo verificar Oracle Client" -ForegroundColor Yellow
}

Write-Host ""

# 5. Verificar Node.js
Write-Host "[5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>$null
    Write-Host "[OK] Node.js instalado" -ForegroundColor Green
    Write-Host "     Version: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "[AVISO] Node.js no encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==== RESULTADO ====" -ForegroundColor Cyan
if ($requisitos_ok) {
    Write-Host "[OK] Requisitos basicos verificados" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Algunos requisitos faltan, revisa los marcados en rojo" -ForegroundColor Yellow
}
Write-Host "==== FIN ==== " -ForegroundColor Cyan
Write-Host ""
# ============================================================================
# 01-VERIFICAR-REQUISITOS.ps1
# ============================================================================
# PASO 1: Verificar que tienes todo instalado
# ============================================================================

Write-Host ""
Write-Host "VERIFICACION DE REQUISITOS - Proyecto Caprino" -ForegroundColor Cyan
Write-Host ""

$requisitos_ok = $true

# 1. Verificar PHP
Write-Host "Componente 1: PHP 8.2" -ForegroundColor Yellow
try {
    $phpVersion = php -v 2>$null
    if ($phpVersion -match "8\.2") {
        Write-Host "OK: PHP 8.2 INSTALADO" -ForegroundColor Green
        Write-Host $phpVersion.Split([Environment]::NewLine)[0] -ForegroundColor Gray
    } else {
        Write-Host "ERROR: PHP no esta en version 8.2" -ForegroundColor Red
        $requisitos_ok = $false
    }
} catch {
    Write-Host "ERROR: PHP NO ENCONTRADO" -ForegroundColor Red
    $requisitos_ok = $false
}

Write-Host ""

# 2. Verificar Composer
Write-Host "Componente 2: Composer" -ForegroundColor Yellow
try {
    $composerVersion = composer --version 2>$null
    Write-Host "OK: Composer INSTALADO" -ForegroundColor Green
    Write-Host $composerVersion -ForegroundColor Gray
} catch {
    Write-Host "AVISO: Composer NO ENCONTRADO" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar OCI8
Write-Host "Componente 3: OCI8 (Extensión Oracle)" -ForegroundColor Yellow
try {
    $oci8 = php -m | Select-String oci8
    if ($oci8) {
        Write-Host "OK: OCI8 CARGADO EN PHP" -ForegroundColor Green
    } else {
        Write-Host "AVISO: OCI8 NO CARGADO" -ForegroundColor Yellow
    }
} catch {
    Write-Host "AVISO: No se pudo verificar OCI8" -ForegroundColor Yellow
}

Write-Host ""

# 4. Verificar Oracle Client
Write-Host "Componente 4: Oracle Client" -ForegroundColor Yellow
if (Test-Path "C:\Oracle") {
    Write-Host "OK: Directorio Oracle ENCONTRADO" -ForegroundColor Green
} else {
    Write-Host "AVISO: Oracle NO INSTALADO" -ForegroundColor Yellow
}

Write-Host ""

# 5. Verificar Node.js
Write-Host "Componente 5: Node.js (para frontend)" -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>$null
    Write-Host "OK: Node.js INSTALADO" -ForegroundColor Green
    Write-Host "Version: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "AVISO: Node.js NO ENCONTRADO" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
if ($requisitos_ok) {
    Write-Host "OK: REQUISITOS BASICOS - Continua con script 02" -ForegroundColor Green
} else {
    Write-Host "AVISO: Algunos componentes faltan" -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
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
Write-Host "LINE_SEPARATOR" -ForegroundColor Cyan
if ($requisitos_ok) {
    Write-Host "REQUISITOS BASICOS OK - Continua con el script 02" -ForegroundColor Green
} else {
    Write-Host "FALTAN COMPONENTES - Instala los marcados" -ForegroundColor Red
}
Write-Host "LINE_SEPARATOR" -ForegroundColor Cyan
