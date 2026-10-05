@echo off
title SUMAQ SPA - Lanzador Maestro del Sistema
color 0F
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================================
echo                  SUMAQ SPA - LANZADOR DEL SISTEMA
echo ======================================================================
echo.

:: 1. Verificar o Iniciar MySQL
echo [1/4] Verificando servidor MySQL en puertos 3307 o 3306...
set "MYSQL_PORT="

netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
    set "MYSQL_PORT=3307"
    echo [OK] Servidor MySQL activo y respondiendo en el puerto 3307.
    goto :mysql_ready
)

netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
    set "MYSQL_PORT=3306"
    echo [OK] Servidor MySQL activo y respondiendo en el puerto 3306.
    goto :mysql_ready
)

echo [INFO] Intentando iniciar servicios locales de MySQL...
net start MySQL80 >nul 2>nul
net start MySQL >nul 2>nul
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    start "MySQL XAMPP" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
) else if exist "C:\xampp\mysql_start.bat" (
    start /min "" "C:\xampp\mysql_start.bat"
)
timeout /t 3 /nobreak >nul 2>nul

netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
    set "MYSQL_PORT=3307"
    echo [OK] Servidor MySQL 8.0 iniciado en el puerto 3307.
    goto :mysql_ready
)

netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
    set "MYSQL_PORT=3306"
    echo [OK] Servidor MySQL iniciado en el puerto 3306.
    goto :mysql_ready
)

echo [AVISO] MySQL no fue detectado en 3307 ni 3306.
echo        Si tu base de datos corre en Docker u otro puerto, el inicio continuara.

:mysql_ready
echo.

:: 2. Activar Entorno Virtual y Sincronizar Base de Datos
echo [2/4] Verificando entorno Python y sincronizando base de datos...
set "VENV_ACT="
if exist "%~dp0.venv\Scripts\activate.bat" set "VENV_ACT=%~dp0.venv\Scripts\activate.bat"
if not defined VENV_ACT if exist "%~dp0backend\.venv\Scripts\activate.bat" set "VENV_ACT=%~dp0backend\.venv\Scripts\activate.bat"

if defined VENV_ACT (
    call "%VENV_ACT%"
)

if not exist "%~dp0backend\.env" (
    if exist "%~dp0backend\.env.example" (
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
        echo [OK] Archivo backend\.env generado desde plantilla de ejemplo.
    )
)

python "%~dp0backend\init_db.py"
if errorlevel 1 (
    echo [AVISO] Aviso en inicializacion de base de datos.
)
echo.

:: 3. Iniciar Backend Django (Puerto 8000)
echo [3/4] Iniciando API Backend en http://127.0.0.1:8000/api/ ...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
    echo [OK] Backend Django ya se encuentra en ejecucion en el puerto 8000.
) else (
    if defined VENV_ACT (
        start "SUMAQ - Backend Django" /D "%~dp0backend" cmd /k "call ""%VENV_ACT%"" && python manage.py runserver 127.0.0.1:8000"
    ) else (
        start "SUMAQ - Backend Django" /D "%~dp0backend" cmd /k "python manage.py runserver 127.0.0.1:8000"
    )
    timeout /t 2 /nobreak >nul 2>nul
)
echo.

:: 4. Iniciar Frontend Vite (Puerto 5173)
echo [4/4] Iniciando Servidor Frontend Vite en http://localhost:5173/ ...
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Instalando dependencias de frontend con npm install...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
    echo [OK] Frontend Vite ya se encuentra en ejecucion en el puerto 5173.
) else (
    start "SUMAQ - Frontend Vite" /D "%~dp0frontend" cmd /k "npm run dev"
    timeout /t 2 /nobreak >nul 2>nul
)
echo.

:: 5. Resumen de accesos y apertura de navegador
echo ======================================================================
echo                  SISTEMA SUMAQ SPA INICIADO CON EXITO
echo ======================================================================
echo   - Frontend Web:  http://localhost:5173/
echo   - Backend API:   http://127.0.0.1:8000/api/
if defined MYSQL_PORT (
    echo   - MySQL Server:  127.0.0.1:%MYSQL_PORT% [Activo]
) else (
    echo   - MySQL Server:  127.0.0.1:3307 / 3306
)
echo.
echo   Credenciales de Demostracion:
echo   - Administrador: admin@sumaqspa.pe      / AdminSumaq2026!
echo   - Recepcionista: recepcion@sumaqspa.pe  / Sumaq2026!
echo   - Terapeuta:     elena.morales@sumaqspa.pe / Sumaq2026!
echo ======================================================================
echo.

timeout /t 2 /nobreak >nul 2>nul
start http://localhost:5173/

echo Esta ventana puede mantenerse abierta como monitor.
pause
