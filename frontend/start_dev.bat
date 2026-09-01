@echo off
title SUMAQ SPA - Servidor Frontend
color 0A
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================================
echo             SUMAQ SPA ^& CENTRO DE BIENESTAR - SPRINT S04
echo                   Servidor de Desarrollo Frontend
echo ======================================================================
echo.

if not exist "node_modules" (
    echo [INFO] Instalando dependencias npm...
    call npm install
)

echo [INFO] Iniciando servidor Vite en http://localhost:5173/ ...
echo.
start http://localhost:5173/
call npm run dev

pause
