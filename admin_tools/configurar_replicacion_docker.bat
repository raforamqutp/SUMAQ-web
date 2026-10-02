@echo off
REM =====================================================================
REM SUMAQ SPA - CONFIGURADOR DE REPLICACION DOCKER
REM =====================================================================
echo =====================================================================
echo  SUMAQ SPA - VINCULANDO REPLICA DOCKER (SLAVE -^> MASTER)
echo =====================================================================
python "%~dp0setup_replicacion_docker.py"
echo.
pause
