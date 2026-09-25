@echo off
title SUMAQ SPA - Lanzador del Sistema
color 0F
chcp 65001 >nul
cd /d "%~dp0"

echo ===================================================
echo       INICIANDO ENTORNO LOCAL DE SUMAQ SPA
echo ===================================================
echo.

:: 1. Verificar Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no se encuentra instalado o no esta en el PATH.
    pause
    exit /b 1
)

:: 2. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no se encuentra instalado o no esta en el PATH.
    pause
    exit /b 1
)

:: 3. Sincronizar base de datos
echo [1/3] Verificando base de datos MySQL (MySQL 8.0 / 3307)...
python backend\init_db.py
if %errorlevel% neq 0 (
    echo [AVISO] Revisa las credenciales de MySQL en backend\.env si es necesario.
)
echo.

:: 4. Iniciar Servidor Backend Django
echo [2/3] Iniciando Servidor Backend Django en http://127.0.0.1:8000/api/ ...
start "SUMAQ - Backend Django" "%~dp0ejecutar_backend.bat"
timeout /t 2 /nobreak >nul 2>nul

:: 5. Iniciar Servidor Frontend Vite
echo [3/3] Iniciando Servidor Frontend Vite en http://localhost:5173/ ...
start "SUMAQ - Frontend Vite" "%~dp0ejecutar_frontend.bat"
timeout /t 2 /nobreak >nul 2>nul

echo.
echo ===================================================
echo         SISTEMA SUMAQ SPA INICIADO
echo ===================================================
echo   - Frontend:    http://localhost:5173/
echo   - Backend API: http://127.0.0.1:8000/api/
echo   - Admin:       admin@sumaqspa.pe / AdminSumaq2026!
echo   - Recepcion:   recepcion@sumaqspa.pe / Sumaq2026!
echo   - Terapeuta:   elena.morales@sumaqspa.pe / Sumaq2026!
echo ===================================================
echo.
pause
