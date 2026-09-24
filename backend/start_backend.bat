@echo off
title SUMAQ SPA - Backend Django
color 0B
chcp 65001 >nul
cd /d "%~dp0"

echo Iniciando backend Django...
echo.

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [ok] .env generado desde .env.example
    )
)

if exist "..\.venv" (
    set VENV_PATH=..\.venv
) else if exist ".venv" (
    set VENV_PATH=.venv
) else (
    echo [info] Creando entorno virtual .venv...
    python -m venv .venv
    set VENV_PATH=.venv
    call %VENV_PATH%\Scripts\activate.bat
    pip install -r requirements.txt
)

call %VENV_PATH%\Scripts\activate.bat

python init_db.py
echo.
python manage.py runserver 127.0.0.1:8000

pause
