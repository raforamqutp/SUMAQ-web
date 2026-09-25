import os
import sys
import time
from dotenv import load_dotenv

# Cargar variables de entorno
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, 'backend', '.env'))

DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
DB_PORT = int(os.environ.get('DB_PORT', '3306'))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'sumaq_spa')

### RIESGO: Script de telemetría y diagnóstico en vivo de la base de datos
def run_db_monitor():
    print(f"Diagnóstico de base de datos ({DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME})\n")

    try:
        import pymysql
    except ImportError:
        print("[error] pymysql no está instalado en el entorno.")
        sys.exit(1)

    # Latencia de conexión
    t0 = time.time()
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        latency_ms = round((time.time() - t0) * 1000, 2)
        print(f"[ok] Conexión establecida ({latency_ms} ms)\n")
    except Exception as e:
        print(f"[error] No se pudo conectar a la base de datos: {e}")
        sys.exit(1)

    with conn.cursor() as cursor:
        # Métricas de rendimiento InnoDB
        ### RIESGO: Monitoreo del ratio de aciertos de memoria InnoDB (meta > 97%)
        print("Métricas InnoDB:")
        cursor.execute("SHOW GLOBAL STATUS WHERE Variable_name IN ('Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads', 'Uptime', 'Threads_connected');")
        status_rows = {row['Variable_name']: row['Value'] for row in cursor.fetchall()}
        
        read_req = float(status_rows.get('Innodb_buffer_pool_read_requests', 1))
        disk_reads = float(status_rows.get('Innodb_buffer_pool_reads', 0))
        threads = status_rows.get('Threads_connected', 'N/A')
        uptime = int(status_rows.get('Uptime', 0))

        hit_ratio = round((1 - (disk_reads / read_req)) * 100, 2) if read_req > 0 else 100.0

        print(f"  Buffer Pool Hit Ratio: {hit_ratio}%")
        print(f"  Conexiones activas: {threads}")
        print(f"  Uptime: {uptime} s (~{round(uptime/60, 1)} min)\n")

        # Catálogo de tablas y almacenamiento
        print("Tablas y tamaño en disco:")
        cursor.execute("""
            SELECT 
                TABLE_NAME, 
                TABLE_ROWS, 
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) AS SIZE_KB
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = %s
            ORDER BY TABLE_NAME ASC;
        """, (DB_NAME,))
        tables = cursor.fetchall()
        
        total_rows = 0
        total_size_kb = 0.0

        print(f"  {'Tabla':<32} | {'Filas':<8} | {'Tamaño (KB)':<12}")
        print("  " + "-" * 56)
        for t in tables:
            name = t['TABLE_NAME']
            rows = t['TABLE_ROWS'] or 0
            size = float(t['SIZE_KB'] or 0.0)
            total_rows += rows
            total_size_kb += size
            print(f"  {name:<32} | {rows:<8} | {size:<12}")

        print("  " + "-" * 56)
        print(f"  Total: {len(tables)} tablas | ~{total_rows} filas | {round(total_size_kb, 2)} KB\n")

        # Verificación de integridad estructural
        ### RIESGO: Verificación periódica de integridad física (CHECK TABLE)
        print("Integridad estructural (CHECK TABLE):")
        key_tables = ['citas', 'fichas_atencion', 'movimientos_inventario', 'movimientos_caja', 'usuarios']
        for kt in key_tables:
            cursor.execute(f"CHECK TABLE `{kt}`;")
            res = cursor.fetchone()
            status = res.get('Msg_text', 'OK')
            print(f"  {kt}: {status}")

        # Alertas de stock crítico
        ### RIESGO: Alerta temprana de quiebre de stock (< 5 unidades)
        print("\nAlertas de stock:")
        cursor.execute("SELECT nombre, stock_actual, stock_minimo_alerta, unidad_medida FROM productos WHERE stock_actual <= stock_minimo_alerta AND activo = 1;")
        criticos = cursor.fetchall()
        if criticos:
            for c in criticos:
                print(f"  [aviso] {c['nombre']}: actual {c['stock_actual']} {c['unidad_medida']} (mínimo: {c['stock_minimo_alerta']})")
        else:
            print("  [ok] Insumos por encima del umbral mínimo.")

    conn.close()
    print("\nDiagnóstico finalizado.")

if __name__ == '__main__':
    run_db_monitor()
