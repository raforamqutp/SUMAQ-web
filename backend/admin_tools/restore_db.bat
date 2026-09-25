@echo off
title SUMAQ SPA - Restaurador de Base de Datos MySQL
color 0B
chcp 65001 >nul
cd /d "%~dp0..\.."

echo =======================================================
echo   SUMAQ SPA - RESTAURADOR DE BASE DE DATOS
echo =======================================================
echo.

set SQL_TARGET=%~1

if not "%SQL_TARGET%"=="" (
    set SQL_TARGET=%SQL_TARGET:"=%
    goto :execute_restore
)

echo Seleccione el origen de datos para restaurar:
echo.
echo   [1] Restaurar el ÚLTIMO BACKUP generado en admin_tools/backups/
echo   [2] Restaurar el DUMP OFICIAL del sistema (database/03_sumaq_spa_full_dump.sql)
echo   [3] Restaurar solo el ESQUEMA inicial (database/01_schema.sql)
echo   [4] Ingresar una ruta personalizada de archivo .sql
echo.
set /p OPCION="Ingrese una opción [1-4] (por defecto 1): "

if "%OPCION%"=="" set OPCION=1
if "%OPCION%"=="1" goto :opt_last_backup
if "%OPCION%"=="2" goto :opt_dump_full
if "%OPCION%"=="3" goto :opt_schema
if "%OPCION%"=="4" goto :opt_custom

echo.
echo [AVISO] Opción no válida, usando la opción 1 por defecto...
goto :opt_last_backup

:opt_last_backup
set SQL_TARGET=
for /f "delims=" %%F in ('dir /b /o:-d "admin_tools\backups\*.sql" 2^>nul') do (
    if not "%%F"=="" (
        set SQL_TARGET=admin_tools\backups\%%F
        goto :execute_restore
    )
)
for /f "delims=" %%F in ('dir /b /o:-d "backend\admin_tools\backups\*.sql" 2^>nul') do (
    if not "%%F"=="" (
        set SQL_TARGET=backend\admin_tools\backups\%%F
        goto :execute_restore
    )
)
if "%SQL_TARGET%"=="" (
    echo [AVISO] No se encontraron archivos en la carpeta de backups.
    echo         Usando el dump oficial del sistema...
    set SQL_TARGET=database\03_sumaq_spa_full_dump.sql
)
goto :execute_restore

:opt_dump_full
set SQL_TARGET=database\03_sumaq_spa_full_dump.sql
goto :execute_restore

:opt_schema
set SQL_TARGET=database\01_schema.sql
goto :execute_restore

:opt_custom
echo.
set /p SQL_TARGET="Arrastre el archivo .sql aquí o escriba su ruta: "
set SQL_TARGET=%SQL_TARGET:"=%
if "%SQL_TARGET%"=="" (
    echo [ERROR] No ingresó ninguna ruta válida.
    pause
    exit /b 1
)
goto :execute_restore

:execute_restore
if not exist "%SQL_TARGET%" (
    echo.
    echo =======================================================
    echo   [ERROR] El archivo '%SQL_TARGET%' no existe.
    echo =======================================================
    echo.
    pause
    exit /b 1
)

echo.
echo Iniciando proceso de restauración con motor Python/MySQL...
echo.

python admin_tools\restore_db.py "%SQL_TARGET%"

if %ERRORLEVEL% equ 0 (
    color 0A
    echo.
    echo =======================================================
    echo   [EXITO] ¡Restauración finalizada correctamente!
    echo =======================================================
    echo.
) else (
    color 0C
    echo.
    echo =======================================================
    echo   [FALLO] Ocurrió un error durante la restauración.
    echo   Verifique que MySQL esté encendido y la contraseña
    echo   esté configurada en backend/.env (DB_PASSWORD).
    echo =======================================================
    echo.
)

pause
