@echo off
REM =====================================================================
REM SUMAQ SPA - RESTAURADOR DE BASE DE DATOS EN DOCKER
REM =====================================================================
chcp 65001 >nul
title SUMAQ SPA - Restaurar Base de Datos en Docker

echo =====================================================================
echo  SUMAQ SPA - RESTAURANDO BASE DE DATOS EN DOCKER (MASTER)
echo =====================================================================
echo.

set SQL_TARGET=%~1

if not "%SQL_TARGET%"=="" goto :do_restore

:: Buscar el backup mas reciente en admin_tools\backups\
for /f "delims=" %%F in ('dir /b /o:-d "%~dp0backups\*.sql" 2^>nul') do (
    set SQL_TARGET=%~dp0backups\%%F
    goto :do_restore
)

:: Si no hay en backups, usar el dump oficial
if exist "%~dp0..\database\03_sumaq_spa_full_dump.sql" (
    set SQL_TARGET=%~dp0..\database\03_sumaq_spa_full_dump.sql
    goto :do_restore
)

echo [ERROR] No se encontro ningun archivo .sql de respaldo en admin_tools\backups\
echo.
pause
exit /b 1

:do_restore
set SQL_TARGET=%SQL_TARGET:"=%

echo [1/2] Archivo de respaldo seleccionado:
echo       %SQL_TARGET%
echo.
echo ADVERTENCIA: Esta accion sobreescribira los datos actuales de la base de datos
echo en Docker y se sincronizara automaticamente con el esclavo.
echo.
set /p CONFIRM="Desea continuar con la restauracion? [S/N]: "
if /i not "%CONFIRM%"=="S" (
    echo.
    echo Operacion cancelada por el usuario.
    echo.
    pause
    exit /b 0
)

echo.
echo [2/2] Inyectando datos en el contenedor sumaq-mysql-master...
docker exec -i sumaq-mysql-master mysql -u root -p123456 sumaq_spa < "%SQL_TARGET%"

if errorlevel 1 (
    echo.
    echo [ERROR] Ocurrio un fallo al restaurar. Asegurese de que Docker este encendido.
    echo.
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo  [EXITO] BASE DE DATOS RESTAURADA CORRECTAMENTE EN DOCKER
echo  Todos los datos restaurados ya se sincronizaron con el Esclavo.
echo =====================================================================
echo.
pause
