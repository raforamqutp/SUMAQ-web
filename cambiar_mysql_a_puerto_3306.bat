@echo off
echo ========================================================
echo   CONFIGURANDO MYSQL 8.0 AL PUERTO 3306
echo ========================================================

echo 1. Deteniendo MariaDB para liberar el puerto 3306...
net stop MariaDB
sc config MariaDB start= demand

echo 2. Configurando my.ini de MySQL 8.0 al puerto 3306...
powershell -Command "(Get-Content 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini') -replace 'port=3307', 'port=3306' -replace 'mysqlx_port=33070', 'mysqlx_port=33060' | Set-Content 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini'"

echo 3. Reiniciando servicio MySQL80...
net stop MySQL80
net start MySQL80

echo ========================================================
echo   [EXITO] MySQL 8.0 ahora esta corriendo en el puerto 3306!
echo ========================================================
pause
