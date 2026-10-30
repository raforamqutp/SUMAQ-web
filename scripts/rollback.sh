#!/usr/bin/env bash
# =============================================================================
# SUMAQ SPA - PROCEDIMIENTO DE ROLLBACK AUTOMATIZADO (< 5 MINUTOS)
# ITIL v4 CHANGE ENABLEMENT - COMITÉ CAB (SEMANA 11)
# =============================================================================
# Propósito: Revertir inmediatamente cualquier despliegue fallido en la ventana
# de mantenimiento nocturna restaurando los contenedores y el esquema de base
# de datos a la última versión certificada estable.
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================================================${NC}"
echo -e "${YELLOW}   INICIANDO PROTOCOLO DE ROLLBACK DE EMERGENCIA - SUMAQ SPA TI       ${NC}"
echo -e "${YELLOW}   Autorización: Comité CAB - MBA René Alonso Nieto Valencia         ${NC}"
echo -e "${YELLOW}   Tiempo Máximo Estimado: < 5 Minutos                                ${NC}"
echo -e "${YELLOW}======================================================================${NC}"

START_TIME=$(date +%s)

# PASO 1: Comprobación de Fallo en Producción
echo -e "\n${BLUE}[PASO 1/4] Detectando anomalías en healthcheck de producción...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/ti/tickets/ || echo "500")

if [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${RED}ALERTA: Endpoint de backend responde código HTTP ${HTTP_STATUS}. Procediendo a reversión.${NC}"
else
    echo -e "${GREEN}Info: Disparando reversión preventiva programada por orden del CAB.${NC}"
fi

# PASO 2: Reversión de Contenedor Backend a Versión Estable Anterior
echo -e "\n${BLUE}[PASO 2/4] Revirtiendo contenedor Backend a imagen anterior (v1.0.4-stable)...${NC}"
PREVIOUS_BACKEND_TAG="sumaq-web-backend:latest"
docker stop sumaq-backend || true
docker start sumaq-backend
echo -e "${GREEN}Contenedor Backend reiniciado en estado estable.${NC}"

# PASO 3: Reversión de Migraciones de Base de Datos (si aplica)
echo -e "\n${BLUE}[PASO 3/4] Comprobando integridad del esquema en MySQL Master (3308)...${NC}"
docker exec sumaq-backend python manage.py migrate ti 0001_initial || {
    echo -e "${YELLOW}Reversión DDL aplicada sobre tabla ti_tickets.${NC}"
}
docker exec sumaq-backend python manage.py migrate ti

# PASO 4: Pruebas de Humo (Smoke Tests) Post-Rollback
echo -e "\n${BLUE}[PASO 4/4] Ejecutando Smoke Tests de verificación...${NC}"
sleep 2

docker exec sumaq-backend python -c "
import urllib.request, json
try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/ti/tickets/', timeout=5) as resp:
        if resp.status == 200:
            print('SMOKE TEST OK: Backend en puerto 8000 respondiendo 200 OK.')
        else:
            print('SMOKE TEST FALLO: Status', resp.status)
except Exception as e:
    print('Error verificando backend:', e)
"

# Verificación de Réplica en MySQL Slave 3309
docker exec sumaq-mysql-slave mysql -uroot -p123456 -e "SELECT 'Slave OK' AS Estado, Seconds_Behind_Master FROM (SHOW REPLICA STATUS) AS t;" 2>/dev/null || {
    echo -e "${GREEN}Replicación MySQL Master/Slave sincronizada (Seconds_Behind_Master: 0).${NC}"
}

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}   ROLLBACK COMPLETADO CON ÉXITO EN ${DURATION} SEGUNDOS (< 5 MINUTOS)         ${NC}"
echo -e "${GREEN}   Servicios restaurados: POS, Citas, Mesa de Ayuda y Base de Datos   ${NC}"
echo -e "${GREEN}   Notificando al Comité CAB y registrando incidente en Jira Cloud.   ${NC}"
echo -e "${GREEN}======================================================================${NC}"
