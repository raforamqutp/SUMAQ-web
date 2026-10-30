@echo off
TITLE SUMAQ Spa - Iniciar Monitoreo (Prometheus + Grafana)
echo ===============================================================================
echo        SUMAQ SPA - INICIANDO PROMETHEUS Y GRAFANA (PLAN DE MONITOREO)
echo ===============================================================================
echo.
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d prometheus grafana
echo.
echo ===============================================================================
echo Servicios iniciados correctamente:
echo  * Prometheus : http://localhost:9090
echo  * Grafana    : http://localhost:3000  (Usuario: admin / Clave: admin)
echo ===============================================================================
pause
