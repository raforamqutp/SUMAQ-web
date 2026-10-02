@echo off
REM =====================================================================
REM SUMAQ SPA - INICIAR TODOS LOS SERVICIOS CON DOCKER
REM =====================================================================
echo =====================================================================
echo  SUMAQ SPA - INICIANDO ENTORNO DOCKER COMPLETO
echo =====================================================================
echo.
cd /d "%~dp0\.."
echo 1. Levantando contenedores (Master, Slave, Backend, Frontend)...
docker compose up -d
echo.
echo 2. Configurando replicacion entre Master y Slave...
python "%~dp0setup_replicacion_docker.py"
echo.
echo =====================================================================
echo  TODO LISTO Y OPERATIVO:
echo   - Frontend Web : http://localhost
echo   - Backend API  : http://localhost/api/health/ (o http://localhost:8000)
echo   - Master DB    : 127.0.0.1:3308 (root / 123456)
echo   - Slave DB     : 127.0.0.1:3309 (root / 123456)
echo =====================================================================
echo.
pause
