@echo off
REM ==============================================================================
REM SCRIPT DE RESTAURACIÓN DE BASE DE DATOS - SUMAQ SPA (WINDOWS / XAMPP)
REM Uso: restore_db.bat <ruta_archivo_sql>
REM ==============================================================================

set DB_NAME=sumaq_spa
set DB_USER=root
set DB_PASS=
set DB_HOST=127.0.0.1
set DB_PORT=3306

set MYSQL="C:\xampp\mysql\bin\mysql.exe"
if not exist %MYSQL% set MYSQL="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not exist %MYSQL% set MYSQL=mysql

if "%~1"=="" (
    echo [ERROR] Debe especificar el archivo SQL de respaldo a restaurar.
    echo Ejemplo: restore_db.bat backups\sumaq_spa_backup_20260426_120000.sql
    exit /b 1
)

set BACKUP_FILE=%~1

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
