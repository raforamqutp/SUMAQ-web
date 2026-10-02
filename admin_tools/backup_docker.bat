@echo off
REM =====================================================================
REM SUMAQ SPA - GENERADOR DE BACKUP EN DOCKER (MYSQL MASTER)
REM =====================================================================
chcp 65001 >nul
title SUMAQ SPA - Backup en Docker

echo =====================================================================
echo  SUMAQ SPA - GENERANDO COPIA DE SEGURIDAD DESDE DOCKER
echo =====================================================================
echo.

set BACKUP_DIR=%~dp0backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"`) do set TIMESTAMP=%%I
if "%TIMESTAMP%"=="" set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup_docker_sumaq_spa_%TIMESTAMP%.sql

echo [1/2] Extrayendo base de datos del contenedor sumaq-mysql-master...
docker exec sumaq-mysql-master mysqldump -u root -p123456 --single-transaction --routines --triggers sumaq_spa > "%BACKUP_FILE%"

if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo generar el backup. Verifique que el contenedor sumaq-mysql-master este encendido.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Backup generado exitosamente:
echo       %BACKUP_FILE%
echo.
echo =====================================================================
echo  [EXITO] COPIA DE SEGURIDAD GUARDADA EN: admin_tools\backups\
echo =====================================================================
echo.
pause
