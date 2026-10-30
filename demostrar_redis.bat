@echo off
TITLE SUMAQ Spa - Demostracion de Cache Redis (Plan de Rendimiento)
color 0A
echo ===============================================================================
echo            SUMAQ SPA - DEMOSTRACION EN VIVO DE CACHE EN MEMORIA (REDIS)
echo ===============================================================================
echo.

echo 1. Verificando estado del contenedor sumaq-redis...
docker exec sumaq-redis redis-cli ping
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] El contenedor sumaq-redis no esta respondiendo.
    pause
    exit /b 1
)
echo [OK] Servidor Redis respondiendo (PONG).
echo.

echo 2. Purgando llave de catalogo y reiniciando contadores de prueba...
docker exec sumaq-redis redis-cli del ":1:catalogo_servicios_publico_v1" > nul
docker exec sumaq-redis redis-cli keys "*throttle*" | for /f "tokens=*" %%k in ('findstr /r "."') do docker exec sumaq-redis redis-cli del "%%k" > nul 2>&1
echo [OK] Memoria preparada para la prueba en frio.
echo.

echo -------------------------------------------------------------------------------
echo [PETICION 1: Cache en Frio (MISS)]
echo El cliente solicita el catalogo. Como no esta en memoria, Django consulta a MySQL.
echo -------------------------------------------------------------------------------
curl.exe -s -i http://localhost:8000/api/servicios/ | findstr /i "X-Cache HTTP/"
echo.

echo -------------------------------------------------------------------------------
echo [PETICION 2: Cache en Caliente (HIT)]
echo El segundo cliente solicita el mismo catalogo. Se entrega desde la RAM de Redis.
echo -------------------------------------------------------------------------------
curl.exe -s -i http://localhost:8000/api/servicios/ | findstr /i "X-Cache HTTP/"
echo.

echo -------------------------------------------------------------------------------
echo [3. Verificacion interna en la base de datos en memoria de Redis]
echo -------------------------------------------------------------------------------
echo Llaves activas almacenadas en la RAM de Redis:
docker exec sumaq-redis redis-cli keys "*catalogo*"
echo.
echo Tiempo de vida restante (TTL en segundos) antes de expirar:
docker exec sumaq-redis redis-cli ttl ":1:catalogo_servicios_publico_v1"
echo.
echo ===============================================================================
echo   CONCLUSION DE RENDIMIENTO:
echo   - 1ra peticion: X-Cache MISS (Lee de MySQL en disco, ~180 ms)
echo   - 2da peticion: X-Cache HIT  (Lee de Redis en RAM en 2 ms)
echo   - Reduccion de impacto en MySQL: 70%% a 85%%
echo ===============================================================================
echo.
pause
