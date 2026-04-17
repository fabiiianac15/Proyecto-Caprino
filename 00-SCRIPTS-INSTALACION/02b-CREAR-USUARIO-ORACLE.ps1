# 02b-CREAR-USUARIO-ORACLE.ps1
# Crea usuario caprino en Oracle y configura tablas necesarias

Write-Host ""
Write-Host "CREAR USUARIO Y TABLAS EN ORACLE" -ForegroundColor Cyan
Write-Host ""

# Actualizar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verificar sqlplus
$sqlplus = Get-Command sqlplus -ErrorAction SilentlyContinue
if (-not $sqlplus) {
    Write-Host "✗ sqlplus no encontrado. Configura ORACLE_HOME primero" -ForegroundColor Red
    exit 1
}

Write-Host "Conectando a Oracle como SYSDBA..." -ForegroundColor Yellow

# Crear usuario y tablas
$sqlScript = @"
SET PAGESIZE 0 FEEDBACK OFF VERIFY OFF HEADING OFF ECHO OFF;

-- Crear usuario
CREATE USER caprino IDENTIFIED BY CaprinoPass2025;

-- Otorgar privilegios
GRANT CONNECT, RESOURCE TO caprino;
GRANT UNLIMITED TABLESPACE TO caprino;

-- Crear tabla USUARIO
CREATE TABLE caprino.USUARIO (
  ID_USUARIO NUMBER PRIMARY KEY,
  NOMBRE_COMPLETO VARCHAR2(200) NOT NULL,
  EMAIL VARCHAR2(200) NOT NULL UNIQUE,
  PASSWORD_HASH VARCHAR2(500) NOT NULL,
  ROL VARCHAR2(50) DEFAULT 'tecnico',
  ESTADO VARCHAR2(50) DEFAULT 'activo',
  FECHA_CREACION TIMESTAMP DEFAULT SYSDATE
);

-- Crear secuencia para ID
CREATE SEQUENCE caprino.SEQ_USUARIO START WITH 1 INCREMENT BY 1;

COMMIT;
EXIT;
"@

try {
    $sqlScript | & "sqlplus" -S "sys/oracle@127.0.0.1:1521/XEPDB1 as sysdba" 2>&1 | Tee-Object -Variable output | Out-Null
    
    if ($output -match "usuario|Usuario|creado|Tabla|Secuencia") {
        if ($output -match "ORA-[0-9]+") {
            $errorMsg = ($output | Select-String "ORA-[0-9]+").Line
            if ($errorMsg -notmatch "ORA-01917|ORA-00942") {  # Ignorar "usuario ya existe" y "tabla no existe"
                Write-Host "✗ Error Oracle: $errorMsg" -ForegroundColor Red
                exit 1
            }
        }
        Write-Host "✓ Usuario y tablas configurados en Oracle" -ForegroundColor Green
    } else {
        Write-Host "✗ No se pudo conectar a Oracle" -ForegroundColor Red
        Write-Host "Verifica que:" -ForegroundColor Yellow
        Write-Host "  1. Oracle está ejecutándose"
        Write-Host "  2. Las credenciales sys/oracle son correctas"
        Write-Host "  3. La conexión es: 127.0.0.1:1521/XEPDB1"
        exit 1
    }
} catch {
    Write-Host "✗ Error ejecutando SQL: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configuración completada:" -ForegroundColor Green
Write-Host "  - Usuario: caprino"
Write-Host "  - Contraseña: CaprinoPass2025"
Write-Host "  - BD: XEPDB1"
Write-Host ""
