@echo off
title SUMAQ SPA - Generador de Copia de Seguridad (Backup MySQL)
color 0B
chcp 65001 >nul
cd /d "%~dp0.."

set DB_NAME=sumaq_spa
set DB_USER=root
set DB_PASS=
set DB_HOST=127.0.0.1
set DB_PORT=3306

:: Cargar variables desde backend/.env o .env
if exist "backend\.env" (
    for /f "usebackq tokens=1* delims==" %%A in ("backend\.env") do (
        if "%%A"=="DB_NAME" set DB_NAME=%%B
        if "%%A"=="DB_USER" set DB_USER=%%B
        if "%%A"=="DB_PASSWORD" set DB_PASS=%%B
        if "%%A"=="DB_HOST" set DB_HOST=%%B
        if "%%A"=="DB_PORT" set DB_PORT=%%B
    )
) else if exist ".env" (
    for /f "usebackq tokens=1* delims==" %%A in (".env") do (
        if "%%A"=="DB_NAME" set DB_NAME=%%B
        if "%%A"=="DB_USER" set DB_USER=%%B
        if "%%A"=="DB_PASSWORD" set DB_PASS=%%B
        if "%%A"=="DB_HOST" set DB_HOST=%%B
        if "%%A"=="DB_PORT" set DB_PORT=%%B
    )
)

echo Iniciando copia de seguridad de %DB_NAME% (%DB_HOST%:%DB_PORT%)...
echo.

set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"`) do set TIMESTAMP=%%I
if "%TIMESTAMP%"=="" set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup_%DB_NAME%_%TIMESTAMP%.sql

echo [1/3] Detectando binario mysqldump...
set MYSQLDUMP_CMD=mysqldump
where mysqldump >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" (
        set MYSQLDUMP_CMD="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
    ) else if exist "C:\xampp\mysql\bin\mysqldump.exe" (
        set MYSQLDUMP_CMD="C:\xampp\mysql\bin\mysqldump.exe"
    ) else (
        echo [error] No se encontro mysqldump en PATH ni en las rutas estandar de MySQL/XAMPP.
        pause
        exit /b 1
    )
)

echo [2/3] Generando respaldo transaccional (InnoDB)...
:: ### RIESGO: Rutina de respaldo transaccional diario
if "%DB_PASS%"=="" (
    %MYSQLDUMP_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --quick --routines --triggers --hex-blob %DB_NAME% > "%BACKUP_FILE%"
) else (
    %MYSQLDUMP_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% --single-transaction --quick --routines --triggers --hex-blob %DB_NAME% > "%BACKUP_FILE%"
)

if %errorlevel% neq 0 (
    echo [error] Fallo al generar el respaldo de la base de datos.
    pause
    exit /b 1
)

echo [ok] Respaldo generado con exito:
echo      %BACKUP_FILE%
echo.

echo [3/3] Aplicando politica de retencion (conservar ultimos 7 dias)...
:: ### RIESGO: Purga automática de historiales y logs corruptos
forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -7 /c "cmd /c del @path" 2>nul
echo [ok] Politica de retencion finalizada.
echo.

echo Copia de seguridad finalizada.
pause
