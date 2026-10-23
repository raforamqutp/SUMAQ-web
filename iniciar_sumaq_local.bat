@echo off
title Iniciar SUMAQ Spa - Entorno Local
color 0A

echo ======================================================================
echo           SUMAQ SPA TI - INICIADOR AUTOMATICO DEL SISTEMA
echo ======================================================================
echo.
echo [1/3] Levantando Backend Django en http://127.0.0.1:8000 ...
start "SUMAQ Backend (Django API)" cmd.exe /k "cd /d %~dp0backend && python manage.py runserver 127.0.0.1:8000"

echo [2/3] Levantando Frontend Vite React en http://localhost:5173 ...
start "SUMAQ Frontend (React 19)" cmd.exe /k "cd /d %~dp0frontend && npm.cmd run dev"

echo [3/3] Esperando inicializacion de servicios (4 segundos)...
timeout /t 4 /nobreak >nul

echo Abriendo navegador en el Portal de TI: http://localhost:5173/ti ...
start http://localhost:5173/ti

echo.
echo ======================================================================
echo  TODO LISTO: Backend y Frontend estan corriendo en segundo plano.
echo  - Portal de TI / Service Desk: http://localhost:5173/ti
echo  - Documentacion de APIs:       http://127.0.0.1:8000/api/docs/
echo  - Jira Cloud Oficial:          https://sumaq-dev.atlassian.net
echo ======================================================================
echo.
pause
