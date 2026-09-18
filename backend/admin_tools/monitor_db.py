import os
import sys
import time
import django

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from apps.inventory.models import Producto
from apps.appointments.models import Cita


def run_diagnostics():
    print("==================================================================")
    print("  MONITOR DE ESTADO, SALUD Y MANTENIMIENTO DE BASE DE DATOS")
    print("  SUMAQ SPA & CENTRO DE BIENESTAR")
    print("==================================================================")

    # 1. Latencia de conexión
    start = time.time()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        latency = round((time.time() - start) * 1000, 2)
        print(f"\n[+] ESTADO CONEXIÓN: OK (Latencia: {latency} ms)")
    except Exception as e:
        print(f"\n[-] ERROR CONEXIÓN: {e}")
        return

    # 2. Métricas del Motor MySQL
    print("\n--- MÉTRICAS DEL MOTOR MYSQL ---")
    metrics_query = """
        SHOW GLOBAL STATUS WHERE Variable_name IN (
            'Threads_connected', 'Threads_running', 'Max_used_connections',
            'Uptime', 'Questions', 'Innodb_buffer_pool_reads',
            'Innodb_buffer_pool_read_requests'
        );
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(metrics_query)
            rows = cursor.fetchall()
            for var_name, val in rows:
                print(f"  • {var_name:<35}: {val}")
    except Exception as e:
        print(f"  (Métricas no disponibles: {e})")

    # 3. Tamaño y Conteo de Tablas del Esquema
    print("\n--- INVENTARIO DE TABLAS RELACIONALES (sumaq_spa) ---")
    tables_query = """
        SELECT 
            table_name,
            table_rows,
            ROUND(((data_length + index_length) / 1024), 2) AS size_kb
        FROM information_schema.TABLES
        WHERE table_schema = DATABASE()
        ORDER BY table_name;
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(tables_query)
            tables = cursor.fetchall()
            print(f"  {'Tabla':<32} | {'Filas (Est.)':<12} | {'Tamaño (KB)':<10}")
            print("  " + "-" * 60)
            for t_name, rows_count, size_kb in tables:
                print(f"  {t_name:<32} | {str(rows_count or 0):<12} | {str(size_kb or 0):<10}")
    except Exception as e:
        print(f"  (Información de esquema no disponible: {e})")

    # 4. Chequeo de Integridad de Tablas
    print("\n--- CHEQUEO DE INTEGRIDAD (CHECK TABLE) ---")
    tablas_check = [
        'usuarios', 'clientes', 'cabinas', 'terapeutas', 'servicios',
        'productos', 'recetas_servicio', 'promociones', 'citas',
        'fichas_atencion', 'movimientos_inventario', 'movimientos_caja'
    ]
    try:
        with connection.cursor() as cursor:
            for tbl in tablas_check:
                try:
                    cursor.execute(f"CHECK TABLE `{tbl}`;")
                    res = cursor.fetchall()
                    msg = res[-1][3] if res else "OK"
                    print(f"  • {tbl:<32}: {msg}")
                except Exception:
                    pass
    except Exception as e:
        print(f"  (Chequeo omitido: {e})")

    # 5. Diagnóstico de Negocio
    print("\n--- RESUMEN DE NEGOCIO EN TIEMPO REAL ---")
    total_citas = Cita.objects.count()
    citas_pendientes = Cita.objects.filter(estado=Cita.Estados.PENDIENTE).count()
    citas_atendidas = Cita.objects.filter(estado=Cita.Estados.ATENDIDA).count()
    insumos_criticos = Producto.objects.filter(stock_actual__lte=2.0)

    print(f"  • Total Citas Registradas: {total_citas}")
    print(f"  • Citas Pendientes: {citas_pendientes} | Atendidas: {citas_atendidas}")
    print(f"  • Insumos en Estado Crítico: {insumos_criticos.count()}")
    for item in insumos_criticos:
        print(f"    - ALERTA: {item.nombre} (Stock: {item.stock_actual} {item.unidad_medida})")

    print("\n==================================================================")
    print("  DIAGNÓSTICO FINALIZADO CORRECTAMENTE")
    print("==================================================================")


if __name__ == '__main__':
    run_diagnostics()
