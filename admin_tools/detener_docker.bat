@echo off
REM =====================================================================
REM SUMAQ SPA - DETENER SERVICIOS DE DOCKER
REM =====================================================================
echo =====================================================================
echo  SUMAQ SPA - DETENIENDO CONTENEDORES DOCKER
echo =====================================================================
echo.
cd /d "%~dp0\.."
docker compose down
echo.
echo [OK] Todos los contenedores fueron detenidos correctamente.
echo.
pause
