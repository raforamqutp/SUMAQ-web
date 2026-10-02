#!/usr/bin/env python3
"""
=============================================================================
SUMAQ SPA - CONFIGURADOR DE RÉPLICA MASTER-SLAVE EN DOCKER
=============================================================================
Conecta la réplica de MySQL en Docker (sumaq-mysql-slave) al Master (sumaq-mysql-master).
"""

import sys
import time

try:
    import pymysql
except ImportError:
    print("[ERROR] Requiere pymysql. Instale con: pip install pymysql")
    sys.exit(1)

MASTER_HOST = "127.0.0.1"
MASTER_PORT = 3308
MASTER_USER = "root"
MASTER_PASS = "123456"

SLAVE_HOST = "127.0.0.1"
SLAVE_PORT = 3309
SLAVE_USER = "root"
SLAVE_PASS = "123456"

REPL_USER = "repl_user"
REPL_PASS = "ReplSumaq2026Secure!"

def wait_for_mysql(host, port, user, password, desc, max_retries=20):
    print(f"[*] Comprobando disponibilidad de {desc} ({host}:{port})...")
    for i in range(max_retries):
        try:
            conn = pymysql.connect(
                host=host, port=port, user=user, password=password,
                connect_timeout=3
            )
            conn.close()
            print(f"    [OK] {desc} disponible.")
            return True
        except Exception:
            time.sleep(2)
    print(f"    [FAIL] No se pudo conectar a {desc} tras {max_retries} intentos.")
    return False

def configure_replication():
    print("=" * 65)
    print(" CONFIGURANDO REPLICACIÓN MASTER-SLAVE DOCKER")
    print("=" * 65)

    if not wait_for_mysql(MASTER_HOST, MASTER_PORT, MASTER_USER, MASTER_PASS, "Docker Master"):
        return False
    if not wait_for_mysql(SLAVE_HOST, SLAVE_PORT, SLAVE_USER, SLAVE_PASS, "Docker Slave"):
        return False

    # 1. Asegurar usuario de replicación en Master
    print("\n[1/3] Verificando usuario de replicación en Master...")
    m_conn = pymysql.connect(
        host=MASTER_HOST, port=MASTER_PORT, user=MASTER_USER, password=MASTER_PASS,
        cursorclass=pymysql.cursors.DictCursor
    )
    with m_conn.cursor() as cur:
        cur.execute(f"CREATE USER IF NOT EXISTS '{REPL_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '{REPL_PASS}';")
        cur.execute(f"ALTER USER '{REPL_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '{REPL_PASS}';")
        cur.execute(f"GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO '{REPL_USER}'@'%';")
        cur.execute("FLUSH PRIVILEGES;")
        
        # Obtener binlog status
        try:
            cur.execute("SHOW BINARY LOG STATUS;")
            row = cur.fetchone()
        except Exception:
            cur.execute("SHOW MASTER STATUS;")
            row = cur.fetchone()
            
        if not row:
            print("    [ERROR] El Master no tiene los binary logs activos.")
            return False
            
        bin_file = row.get("File")
        bin_pos = row.get("Position")
        print(f"    [OK] Master Binlog: Archivo={bin_file}, Posición={bin_pos}")
    m_conn.close()

    # 2. Configurar Slave
    print("\n[2/3] Configurando parámetros de replicación en Slave...")
    s_conn = pymysql.connect(
        host=SLAVE_HOST, port=SLAVE_PORT, user=SLAVE_USER, password=SLAVE_PASS,
        cursorclass=pymysql.cursors.DictCursor
    )
    with s_conn.cursor() as cur:
        cur.execute("STOP REPLICA;")
        cur.execute("RESET REPLICA ALL;")
        sql_change = f"""
            CHANGE REPLICATION SOURCE TO
                SOURCE_HOST='mysql-master',
                SOURCE_PORT=3306,
                SOURCE_USER='{REPL_USER}',
                SOURCE_PASSWORD='{REPL_PASS}',
                SOURCE_LOG_FILE='{bin_file}',
                SOURCE_LOG_POS={bin_pos},
                GET_SOURCE_PUBLIC_KEY=1;
        """
        cur.execute(sql_change)
        cur.execute("START REPLICA;")
        print("    [OK] Sentencia START REPLICA ejecutada.")
        
        time.sleep(2)
        cur.execute("SHOW REPLICA STATUS;")
        status = cur.fetchone()
        if not status:
            cur.execute("SHOW SLAVE STATUS;")
            status = cur.fetchone()

        io_running = status.get("Replica_IO_Running") or status.get("Slave_IO_Running")
        sql_running = status.get("Replica_SQL_Running") or status.get("Slave_SQL_Running")
        last_io_err = status.get("Last_IO_Error")
        last_sql_err = status.get("Last_SQL_Error")

        print(f"    -> Estado IO  : {io_running}")
        print(f"    -> Estado SQL : {sql_running}")

        if io_running == "Yes" and sql_running == "Yes":
            print("\n" + "=" * 65)
            print(" [EXITO] REPLICACION DOCKER OPERATIVA AL 100%")
            print("=" * 65)
            return True
        else:
            print("\n[ADVERTENCIA] La replica reporta estados no optimos:")
            if last_io_err:
                print(f"    IO Error: {last_io_err}")
            if last_sql_err:
                print(f"    SQL Error: {last_sql_err}")
            return False
    s_conn.close()

if __name__ == "__main__":
    success = configure_replication()
    sys.exit(0 if success else 1)
