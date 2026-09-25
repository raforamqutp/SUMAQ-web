@echo off
title SUMAQ SPA - Lanzador Maestro del Sistema
color 0F
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================================
echo                  SUMAQ SPA - LANZADOR DEL SISTEMA
echo ======================================================================
echo.

:: 1. Verificar o Iniciar MySQL (XAMPP / Servicio local)
echo [1/4] Verificando servidor MySQL en puerto 3306...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Puerto 3306 no detectado. Intentando arrancar MySQL de XAMPP...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "MySQL XAMPP" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 /nobreak >nul 2>nul
    ) else if exist "C:\xampp\mysql_start.bat" (
        start /min "" "C:\xampp\mysql_start.bat"
        timeout /t 3 /nobreak >nul 2>nul
    ) else (
        net start MySQL80 >nul 2>nul
        net start MySQL >nul 2>nul
        timeout /t 3 /nobreak >nul 2>nul
    )
)

netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Servidor MySQL activo y respondiendo en el puerto 3306.
) else (
    echo [AVISO] MySQL no pudo ser arrancado automaticamente.
    echo Asegurate de iniciar el modulo MySQL desde el panel de XAMPP Control.
)
echo.

:: 2. Activar Entorno Virtual y Sincronizar Base de Datos
echo [2/4] Verificando entorno Python y sincronizando base de datos...
set VENV_ACT=
if exist ".venv\Scripts\activate.bat" (
    set VENV_ACT=.venv\Scripts\activate.bat
) else if exist "backend\.venv\Scripts\activate.bat" (
    set VENV_ACT=backend\.venv\Scripts\activate.bat
)

if defined VENV_ACT (
    call %VENV_ACT%
)

if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
    )
)

python backend\init_db.py
if %errorlevel% neq 0 (
    echo [AVISO] Hubo un aviso al inicializar la BD. Revisa backend\.env si es necesario.
)
echo.

:: 3. Iniciar Backend Django (Puerto 8000)
echo [3/4] Iniciando API Backend en http://127.0.0.1:8000/api/ ...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    if defined VENV_ACT (
        start "SUMAQ - Backend Django" cmd /k "cd /d ""%~dp0"" && call %VENV_ACT% && python backend\manage.py runserver 127.0.0.1:8000"
    ) else (
        start "SUMAQ - Backend Django" cmd /k "cd /d ""%~dp0"" && python backend\manage.py runserver 127.0.0.1:8000"
    )
    timeout /t 2 /nobreak >nul 2>nul
) else (
    echo [OK] Backend ya se encontraba en ejecucion en el puerto 8000.
)
echo.

:: 4. Iniciar Frontend Vite (Puerto 5173)
echo [4/4] Iniciando Servidor Frontend Vite en http://localhost:5173/ ...
if not exist "frontend\node_modules" (
    echo [INFO] Instalando dependencias de frontend con npm install...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    start "SUMAQ - Frontend Vite" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
    timeout /t 2 /nobreak >nul 2>nul
) else (
    echo [OK] Frontend ya se encontraba en ejecucion en el puerto 5173.
)
echo.

:: 5. Resumen de accesos y apertura de navegador
echo ======================================================================
echo                  SISTEMA SUMAQ SPA INICIADO CON EXITO
echo ======================================================================
echo   - Frontend Web:  http://localhost:5173/
echo   - Backend API:   http://127.0.0.1:8000/api/
echo   - MySQL Server:  127.0.0.1:3306 [XAMPP / root / sin password]
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
