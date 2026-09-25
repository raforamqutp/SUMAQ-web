@echo off
setlocal enabledelayedexpansion
title SUMAQ SPA - Monitor de Replicacion Master-Slave
chcp 65001 >nul

cd /d "%~dp0\.."

set "PYTHON_EXE="
if exist ".venv\Scripts\python.exe" set "PYTHON_EXE=.venv\Scripts\python.exe"
if not defined PYTHON_EXE if exist "backend\.venv\Scripts\python.exe" set "PYTHON_EXE=backend\.venv\Scripts\python.exe"
if not defined PYTHON_EXE set "PYTHON_EXE=python"

"%PYTHON_EXE%" admin_tools\monitor_replication.py

pause
