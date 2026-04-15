@echo off
REM ============================================================================
REM 02-CONFIGURAR-ORACLE-ENV.bat
REM ============================================================================
REM Configura variables de entorno de Oracle
REM Ejecuta como ADMINISTRADOR (clic derecho -> Ejecutar como administrador)
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  CONFIGURAR ORACLE - Variables de Entorno                         ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "02-CONFIGURAR-ORACLE-ENV.ps1"

pause
