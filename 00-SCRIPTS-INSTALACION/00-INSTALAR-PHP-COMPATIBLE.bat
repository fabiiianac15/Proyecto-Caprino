@echo off
REM ============================================================================
REM 00-INSTALAR-PHP-COMPATIBLE.bat
REM ============================================================================
REM Lanza la instalacion automatica de PHP compatible para Proyecto Caprino
REM ============================================================================

echo.
echo ============================================================
echo  INSTALAR PHP COMPATIBLE - Proyecto Caprino
echo ============================================================
echo.

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "00-INSTALAR-PHP-COMPATIBLE.ps1"

pause
