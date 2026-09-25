@echo off
title SUMAQ SPA - Lanzador del Sistema
color 0F
chcp 65001 >nul
cd /d "%~dp0"

echo Iniciando entorno local de SUMAQ SPA...
echo.

:: 1. Verificar Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [error] Python no se encuentra instalado o no está en el PATH.
    echo Descarga e instala Python 3.10+ marcando "Add python.exe to PATH".
    pause
    exit /b 1
)

:: 2. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [error] Node.js no se encuentra instalado o no está en el PATH.
    echo Descarga e instala Node.js LTS desde https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Configuración de variables de entorno (.env)
if not exist "backend\.env" (
    echo [info] Creando backend\.env a partir de .env.example...
    copy "backend\.env.example" "backend\.env" >nul
    echo [ok] Archivo backend\.env preparado.
    echo      Nota: Si usas MySQL Workbench / Server con contraseña, edita DB_PASSWORD en backend\.env.
)

:: 4. Verificación de servicio de base de datos (Puerto 3306)
echo [1/5] Verificando base de datos (MySQL 3306)...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    echo [info] Puerto 3306 no detectado. Intentando arranque automático...
    if exist "C:\xampp\mysql_start.bat" (
        start /min "" "C:\xampp\mysql_start.bat"
        timeout /t 2 /nobreak >nul 2>nul
    ) else if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "MySQL" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul 2>nul
    ) else (
        net start MySQL80 >nul 2>nul
        net start MySQL >nul 2>nul
        timeout /t 2 /nobreak >nul 2>nul
    )
)

netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [ok] Servidor MySQL activo en puerto 3306.
) else (
    echo [aviso] No se detectó MySQL en 3306. Si usas MySQL Workbench o XAMPP, asegúrate de iniciarlo.
    echo        (O puedes definir DB_ENGINE=sqlite en backend\.env para ejecutar en modo local).
)

:: 5. Nodo de replicación opcional (Puerto 3307)
netstat -ano | findstr ":3307" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [ok] MySQL Slave activo en puerto 3307 (replicación).
) else (
    if exist "C:\xampp\mysql\bin\my_slave.ini" (
        start "MySQL Slave 3307" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my_slave.ini" --standalone
        timeout /t 2 /nobreak >nul 2>nul
    )
)
echo.

:: 6. Entorno Virtual Python y Dependencias Backend
echo [2/5] Verificando entorno Backend...
if exist ".venv" (
    set VENV_PATH=.venv
) else if exist "backend\.venv" (
    set VENV_PATH=backend\.venv
) else (
    echo [info] Creando entorno virtual .venv...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip --quiet
    pip install -r backend\requirements.txt
    set VENV_PATH=.venv
)

:: 7. Sincronización de base de datos y catálogos
echo [3/5] Sincronizando base de datos y migraciones...
call %VENV_PATH%\Scripts\activate.bat
python backend\init_db.py
if %errorlevel% neq 0 (
    echo.
    echo [aviso] La sincronización de base de datos reportó un aviso.
    echo Revisa backend\.env si tu usuario de MySQL requiere una contraseña específica.
    echo.
)
echo.

:: 8. Iniciar Servidor Backend Django - Puerto 8000
echo [4/5] Iniciando API Backend en http://127.0.0.1:8000...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    start "SUMAQ - Backend Django" cmd /k "cd /d ""%~dp0"" && call %VENV_PATH%\Scripts\activate.bat && python backend\manage.py runserver 127.0.0.1:8000"
    timeout /t 2 /nobreak >nul 2>nul
)
echo [ok] Backend API disponible en http://127.0.0.1:8000/api/
echo.

:: 9. Iniciar Frontend Vite - Puerto 5173
echo [5/5] Iniciando Frontend React en http://localhost:5173...
if not exist "frontend\node_modules" (
    echo [info] Instalando dependencias de frontend (npm install)...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 (
    start "SUMAQ - Frontend Vite" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
    timeout /t 2 /nobreak >nul 2>nul
)
echo [ok] Frontend disponible en http://localhost:5173/
echo.

echo Sistema iniciado correctamente:
echo   - Frontend:    http://localhost:5173/
echo   - Backend API: http://127.0.0.1:8000/api/
echo   - Admin:       admin@sumaqspa.pe / AdminSumaq2026!
echo   - Recepción:   recepcion@sumaqspa.pe / Sumaq2026!
echo   - Terapeuta:   elena.morales@sumaqspa.pe / Sumaq2026!
echo.

timeout /t 2 /nobreak >nul 2>nul
start http://localhost:5173/

echo Esta ventana puede cerrarse o mantenerse abierta.
pause
