@echo off
title SUMAQ SPA - Servidor Frontend (React + Vite)
color 0E
chcp 65001 >nul
cd /d "%~dp0frontend"

echo Iniciando servidor Frontend Vite (React 19 + TypeScript)...
echo Abriendo navegador en http://localhost:5173/ ...
echo.

start http://localhost:5173/
npm run dev
pause
