@echo off
echo ====================================
echo Iniciando Backend con PHP 8.2 + Oracle
echo ====================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Asegurar que usamos PHP 8.2 con extensiones Oracle
set PATH=C:\tools\php82;%PATH%

REM Mostrar versión de PHP
php --version
echo.

REM Verificar extensiones Oracle
php -m | findstr /I "oci8 pdo_oci"
echo.

REM Iniciar servidor
cd /d "%~dp0backend-symfony"
php -S localhost:8000 -t public

pause
