@echo off
REM =====================================================================
REM SUMAQ SPA - MONITOR DE REPLICACION DOCKER (3308 <-> 3309)
REM =====================================================================
python "%~dp0monitor_replication.py" --docker
pause
