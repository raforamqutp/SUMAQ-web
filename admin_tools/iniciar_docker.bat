@echo off
REM =====================================================================
REM SUMAQ SPA - INICIAR TODOS LOS SERVICIOS CON DOCKER
REM =====================================================================
echo =====================================================================
echo  SUMAQ SPA - INICIANDO ENTORNO DOCKER COMPLETO
echo =====================================================================
echo.
cd /d "%~dp0\.."

:: Verificar si Docker daemon esta corriendo
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop no esta iniciado o no esta respondiendo.
    echo Por favor, abre Docker Desktop desde el menu de Windows y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo 1. Levantando y reconstruyendo contenedores con la ultima version...
docker compose up -d --build
echo.
echo 2. Configurando replicacion entre Master y Slave...
python "%~dp0setup_replicacion_docker.py"
echo.
echo =====================================================================
echo  TODO LISTO Y OPERATIVO:
echo   - Frontend Web : http://localhost (o http://localhost:5173)
echo   - Backend API  : http://localhost/api/health/ (o http://localhost:8000)
echo   - Master DB    : 127.0.0.1:3308 (root / 123456)
echo   - Slave DB     : 127.0.0.1:3309 (root / 123456)
echo =====================================================================
echo.
echo Abriendo el sistema en tu navegador...
timeout /t 2 /nobreak >nul 2>nul
start http://localhost
echo.
pause
