@echo off
title SUMAQ SPA - Restaurador de Base de Datos MySQL
color 0C
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

echo Restauracion de base de datos %DB_NAME% (%DB_HOST%:%DB_PORT%)
echo.

set MYSQL_CMD=mysql
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set MYSQL_CMD="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    ) else if exist "C:\xampp\mysql\bin\mysql.exe" (
        set MYSQL_CMD="C:\xampp\mysql\bin\mysql.exe"
    ) else (
        echo [error] No se encontro mysql en PATH ni en las rutas estandar de MySQL/XAMPP.
        pause
        exit /b 1
    )
)

echo [aviso] Esta operacion reemplazara la base de datos '%DB_NAME%'.
echo Presione ENTER para usar el dump oficial database\03_sumaq_spa_full_dump.sql, o ingrese una ruta personalizada:
set /p SQL_FILE=Ruta del archivo SQL: 

if "%SQL_FILE%"=="" (
    set SQL_FILE=database\03_sumaq_spa_full_dump.sql
)

if not exist "%SQL_FILE%" (
    echo [error] El archivo '%SQL_FILE%' no existe.
    pause
    exit /b 1
)

echo.
echo Procediendo a restaurar desde: %SQL_FILE%
echo.

if "%DB_PASS%"=="" (
    %MYSQL_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    %MYSQL_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %DB_NAME% < "%SQL_FILE%"
) else (
    %MYSQL_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    %MYSQL_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%SQL_FILE%"
)

if %errorlevel% neq 0 (
    echo [error] Ocurrio un fallo durante la restauracion.
    pause
    exit /b 1
)

echo [ok] Base de datos restaurada exitosamente desde '%SQL_FILE%'.
echo.
pause
