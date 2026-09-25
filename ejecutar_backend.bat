@echo off
title SUMAQ SPA - Servidor Backend (Django REST API)
color 0B
chcp 65001 >nul
cd /d "%~dp0"

echo Iniciando backend Django REST API...
echo.

:: 1. Verificar Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [error] Python no se encuentra instalado o no está en el PATH.
    pause
    exit /b 1
)

:: 2. Configuración .env
if not exist "backend\.env" (
    echo [info] Creando backend\.env desde .env.example...
    copy "backend\.env.example" "backend\.env" >nul
)

:: 3. Entorno virtual
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

call %VENV_PATH%\Scripts\activate.bat

:: 4. Sincronizar base de datos
echo [info] Verificando base de datos y migraciones...
python backend\init_db.py
if %errorlevel% neq 0 (
    echo [aviso] Hubo un problema al inicializar la base de datos.
    echo Revisa las credenciales en backend\.env si usas MySQL Workbench.
    echo.
)

:: 5. Iniciar servidor
echo.
echo Iniciando servidor en http://127.0.0.1:8000/ ...
python backend\manage.py runserver 127.0.0.1:8000

pause
