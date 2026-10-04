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

if exist "..\.venv\Scripts\activate.bat" (
    call ..\.venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

python init_db.py
echo.
python manage.py runserver 127.0.0.1:8000

pause
