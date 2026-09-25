@echo off
:: Backup de base de datos sumaq_spa (Windows)

:: 1. Configuración por defecto (XAMPP / MySQL Server)
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

set MYSQLDUMP="C:\xampp\mysql\bin\mysqldump.exe"
if not exist %MYSQLDUMP% set MYSQLDUMP="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
if not exist %MYSQLDUMP% set MYSQLDUMP=mysqldump

set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"`) do set TIMESTAMP=%%i
if "%TIMESTAMP%"=="" set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_FILE=%BACKUP_DIR%\sumaq_spa_backup_%TIMESTAMP%.sql

echo Generando copia de seguridad: %DB_NAME%
echo Destino: %BACKUP_FILE%

if "%DB_PASS%"=="" (
    %MYSQLDUMP% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --routines --triggers --events %DB_NAME% > "%BACKUP_FILE%"
) else (
    %MYSQLDUMP% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% --single-transaction --routines --triggers --events %DB_NAME% > "%BACKUP_FILE%"
)

if %ERRORLEVEL% equ 0 (
    echo [OK] Copia de seguridad generada exitosamente en:
    echo      %BACKUP_FILE%
) else (
    echo [ERROR] Ocurrio un error al generar la copia de seguridad.
)

echo.
pause
