@echo off
REM ============================================================================
REM 00b-INSTALAR-VCRUNTIME.bat
REM ============================================================================
REM Lanza la instalacion de Visual C++ 2015-2022 Runtime (prerequisito para PHP)
REM ============================================================================

echo.
echo ============================================================
echo  INSTALAR VISUAL C++ RUNTIME
echo ============================================================
echo.

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "00b-INSTALAR-VCRUNTIME.ps1"

pause
