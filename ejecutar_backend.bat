@echo off
title SUMAQ SPA - Servidor Backend (Django REST API)
color 0B
chcp 65001 >nul
cd /d "%~dp0backend"

echo Iniciando backend Django REST API...
echo.

python manage.py runserver 127.0.0.1:8000
pause
