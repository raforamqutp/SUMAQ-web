@echo off
TITLE SUMAQ Spa - Detener Monitoreo
echo Deteniendo Prometheus y Grafana...
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml stop prometheus grafana
echo Monitoreo detenido para liberar memoria RAM.
pause
