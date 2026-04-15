@echo off
REM ============================================================================
REM 08-INICIAR-FRONTEND.bat
REM ============================================================================
REM Inicia el servidor Vite del frontend en puerto 5173
REM Haz doble clic para iniciar
REM ============================================================================

title Frontend Vite - Puerto 5173
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "08-INICIAR-FRONTEND.ps1"
