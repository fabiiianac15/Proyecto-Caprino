@echo off
REM ============================================================================
REM 07-INICIAR-BACKEND.bat
REM ============================================================================
REM Inicia el servidor PHP del backend en puerto 8000
REM Haz doble clic para iniciar
REM ============================================================================

title Backend PHP - Puerto 8000
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "07-INICIAR-BACKEND.ps1"
