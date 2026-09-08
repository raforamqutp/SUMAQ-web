@echo off
title SUMAQ SPA - Lanzador Frontend (Sprint S04)
color 0F
chcp 65001 >nul
cd /d "%~dp0frontend"

echo ======================================================================
echo             SUMAQ SPA ^& CENTRO DE BIENESTAR - SPRINT S04
echo                      Lanzador del Prototipo Frontend
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no se encuentra instalado en el sistema o en el PATH.
    echo Por favor descargue e instale Node.js LTS desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Primera ejecucion detectada: Instalando paquetes y dependencias npm...
    echo Esto puede tardar 1 o 2 minutos. Por favor espere...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Ocurrio un problema instalando las dependencias.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas correctamente.
    echo.
)

echo [INFO] Iniciando servidor de desarrollo de Vite (React 19 + TypeScript)...
echo [INFO] Abriendo navegador en http://localhost:5173/ ...
echo.

start http://localhost:5173/
call npm run dev

pause
