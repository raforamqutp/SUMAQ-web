@echo off
setlocal
cd /d "%~dp0\.."
title SUMAQ SPA - MySQL Slave Replica (Puerto 3306)

echo =====================================================================
echo  SUMAQ SPA - SERVIDOR MYSQL 8.0 REPLICA (PUERTO 3306)
echo =====================================================================
echo  Master: 127.0.0.1:3307 (Lectura y Escritura)
echo  Slave:  127.0.0.1:3306 (Solo Lectura / Replicacion Activa)
echo =====================================================================
echo  [IMPORTANTE] Mantenga esta ventana abierta mientras use la replica.
echo  Para detener el servidor presione Ctrl+C.
echo =====================================================================
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --defaults-file="backend\replication\slave_my.ini" --console

pause
