@echo off
REM ==============================================================================
REM SCRIPT DE BACKUP AUTOMATIZADO DE BASE DE DATOS - SUMAQ SPA (WINDOWS / XAMPP)
REM ==============================================================================

set DB_NAME=sumaq_spa
set DB_USER=root
set DB_PASS=admin123
set DB_HOST=127.0.0.1
set DB_PORT=3306

set MYSQLDUMP="C:\xampp\mysql\bin\mysqldump.exe"
if not exist %MYSQLDUMP% set MYSQLDUMP="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
if not exist %MYSQLDUMP% set MYSQLDUMP=mysqldump

set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set TIMESTAMP=%%I
set BACKUP_FILE=%BACKUP_DIR%\sumaq_spa_backup_%TIMESTAMP%.sql

echo ========================================================
echo   GENERANDO COPIA DE SEGURIDAD: %DB_NAME%
echo   Destino: %BACKUP_FILE%
echo ========================================================

if "%DB_PASS%"=="" (
    %MYSQLDUMP% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --routines --triggers --events %DB_NAME% > "%BACKUP_FILE%"
) else (
    %MYSQLDUMP% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% --single-transaction --routines --triggers --events %DB_NAME% > "%BACKUP_FILE%"
)

if %ERRORLEVEL% equ 0 (
    echo [OK] Copia de seguridad generada exitosamente.
) else (
    echo [ERROR] Ocurrio un error al generar la copia de seguridad.
)
