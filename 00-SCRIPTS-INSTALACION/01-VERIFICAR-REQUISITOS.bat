@echo off
REM ============================================================================
REM 01-VERIFICAR-REQUISITOS.bat
REM ============================================================================
REM Verifica que tienes instaladas las dependencias necesarias
REM Haz doble clic para ejecutar
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  VERIFICACIÓN DE REQUISITOS - Proyecto Caprino                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Cambiar a la carpeta de scripts
cd /d "%~dp0"

REM Ejecutar el script PowerShell
powershell -ExecutionPolicy Bypass -File "01-VERIFICAR-REQUISITOS.ps1"

pause
