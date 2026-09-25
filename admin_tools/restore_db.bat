@echo off
title SUMAQ SPA - Restaurador Automatico de Base de Datos
color 0B
chcp 65001 >nul
cd /d "%~dp0.."

echo ===================================================
echo     SUMAQ SPA - RESTAURADOR DE BASE DE DATOS
echo ===================================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python no se encuentra instalado o no esta en el PATH.
    pause
    exit /b 1
)

set SQL_TARGET=%~1

if not "%SQL_TARGET%"=="" goto :check_file

for /f "delims=" %%F in ('dir /b /o:-d "admin_tools\backups\*.sql" 2^>nul') do (
    set SQL_TARGET=admin_tools\backups\%%F
    goto :check_file
)

for /f "delims=" %%F in ('dir /b /o:-d "backend\admin_tools\backups\*.sql" 2^>nul') do (
    set SQL_TARGET=backend\admin_tools\backups\%%F
    goto :check_file
)

set SQL_TARGET=database\03_sumaq_spa_full_dump.sql

:check_file
set SQL_TARGET=%SQL_TARGET:"=%

if not exist "%SQL_TARGET%" (
    color 0C
    echo [ERROR] No se encontro ningun archivo SQL para restaurar: %SQL_TARGET%
    pause
    exit /b 1
)

echo [1/2] Archivo seleccionado para restaurar:
echo       %SQL_TARGET%
echo.
echo [2/2] Ejecutando restauracion en MySQL...
echo.

python admin_tools\restore_db.py "%SQL_TARGET%"

if errorlevel 1 goto :show_error

:show_success
color 0A
echo.
echo ===================================================
echo   [EXITO] Base de datos restaurada correctamente.
echo ===================================================
goto :end

:show_error
color 0C
echo.
echo ===================================================
echo   [ERROR] Fallo al restaurar la base de datos.
echo   Verifique que MySQL este iniciado y la clave
echo   en backend\.env sea correcta (DB_PASSWORD).
echo ===================================================

:end
echo.
pause
