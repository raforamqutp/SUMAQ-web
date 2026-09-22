@echo off
REM ==============================================================================
REM SCRIPT DE RESTAURACIÓN DE BASE DE DATOS - SUMAQ SPA (WINDOWS / XAMPP)
REM Uso: restore_db.bat <ruta_archivo_sql>
REM ==============================================================================

REM 1. Configuracion por defecto (XAMPP / estandar)
set DB_NAME=sumaq_spa
set DB_USER=root
set DB_PASS=
set DB_HOST=127.0.0.1
set DB_PORT=3306

REM 2. Cargar variables dinamicamente desde backend/.env si existe
set ENV_FILE=%~dp0..\.env
if exist "%ENV_FILE%" (
    for /f "usebackq tokens=1* delims==" %%A in ("%ENV_FILE%") do (
        if "%%A"=="DB_NAME" set DB_NAME=%%B
        if "%%A"=="DB_USER" set DB_USER=%%B
        if "%%A"=="DB_PASSWORD" set DB_PASS=%%B
        if "%%A"=="DB_HOST" set DB_HOST=%%B
        if "%%A"=="DB_PORT" set DB_PORT=%%B
    )
)

set MYSQL="C:\xampp\mysql\bin\mysql.exe"
if not exist %MYSQL% set MYSQL="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not exist %MYSQL% set MYSQL=mysql

set BACKUP_FILE=%~1
if "%BACKUP_FILE%"=="" (
    for /f "delims=" %%F in ('dir /b /o:-d "%~dp0backups\*.sql" 2^>nul') do (
        set BACKUP_FILE=%~dp0backups\%%F
        goto :found_backup
    )
)
:found_backup

if "%BACKUP_FILE%"=="" (
    echo [ERROR] No se encontro ningun archivo SQL de respaldo en la carpeta backups.
    exit /b 1
)

if not exist "%BACKUP_FILE%" (
    echo [ERROR] El archivo especificado no existe: %BACKUP_FILE%
    exit /b 1
)

echo ========================================================
echo   RESTAURANDO BASE DE DATOS: %DB_NAME%
echo   Desde: %BACKUP_FILE%
echo ========================================================

if "%DB_PASS%"=="" (
    %MYSQL% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    %MYSQL% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %DB_NAME% < "%BACKUP_FILE%"
) else (
    %MYSQL% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    %MYSQL% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%BACKUP_FILE%"
)

if %ERRORLEVEL% equ 0 (
    echo [OK] Restauracion completada exitosamente.
) else (
    echo [ERROR] Ocurrio un error durante la restauracion.
)

echo.
pause
