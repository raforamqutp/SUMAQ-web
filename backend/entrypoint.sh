#!/bin/sh
set -e

echo "=========================================================="
echo " SUMAQ SPA - INICIANDO BACKEND (DJANGO + GUNICORN)"
echo "=========================================================="

echo "1. Esperando conexión con el servidor MySQL (${DB_HOST:-mysql-master}:${DB_PORT:-3306})..."
while ! nc -z ${DB_HOST:-mysql-master} ${DB_PORT:-3306}; do
  sleep 1
done
echo "   [OK] Conexión establecida con MySQL."

echo "2. Aplicando migraciones de base de datos..."
python manage.py migrate --noinput

if [ "$INIT_DB_SEED" = "true" ]; then
    echo "3. Inicializando datos semilla (init_db.py)..."
    python init_db.py || true
fi

echo "4. Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear || true

echo "5. Iniciando servidor de producción Gunicorn..."
exec "$@"
