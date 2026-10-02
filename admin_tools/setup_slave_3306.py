import sys
import time
import pymysql
import subprocess

MASTER_CONFIG = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': 'root',
    'password': '123456',
    'connect_timeout': 5,
    'autocommit': True
}

SLAVE_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': '',
    'connect_timeout': 5,
    'autocommit': True
}

def main():
    print("================================================================")
    print("CONFIGURANDO REPLICACIÓN MASTER (3307) -> SLAVE (3306)")
    print("================================================================")

    # 1. Probar conexión a Master
    print("\n1. Conectando al Master (Puerto 3307)...")
    try:
        m_conn = pymysql.connect(**MASTER_CONFIG)
        m_cur = m_conn.cursor()
        m_cur.execute("SELECT @@version, @@server_id, @@log_bin;")
        m_ver, m_sid, m_bin = m_cur.fetchone()
        print(f"   [OK] Master conectado: Version={m_ver}, ServerID={m_sid}, LogBin={m_bin}")
    except Exception as e:
        print(f"   [ERROR] No se pudo conectar al Master (3307): {e}")
        return

    # 2. Configurar usuario de replicación en Master
    print("\n2. Creando/actualizando 'repl_user' en el Master...")
    try:
        m_cur.execute("CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED WITH mysql_native_password BY 'ReplSumaq2026Secure!';")
        m_cur.execute("ALTER USER 'repl_user'@'%' IDENTIFIED WITH mysql_native_password BY 'ReplSumaq2026Secure!';")
        m_cur.execute("GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';")
        m_cur.execute("FLUSH PRIVILEGES;")
        print("   [OK] Usuario 'repl_user' listo con plugin mysql_native_password.")
    except Exception as e:
        print(f"   [ERROR] Creando usuario de replicación: {e}")
        return

    # 3. Probar conexión a Slave
    print("\n3. Conectando al Slave (Puerto 3306)...")
    try:
        s_conn = pymysql.connect(**SLAVE_CONFIG)
        s_cur = s_conn.cursor()
        s_cur.execute("SELECT @@version, @@server_id, @@read_only;")
        s_ver, s_sid, s_ro = s_cur.fetchone()
        print(f"   [OK] Slave conectado: Version={s_ver}, ServerID={s_sid}, ReadOnly={s_ro}")
    except Exception as e:
        print(f"   [ERROR] No se pudo conectar al Slave (3306): {e}")
        return

    if s_sid == m_sid:
        print(f"   [AVISO] server_id del Slave ({s_sid}) es igual al Master. Asegúrese de reiniciar XAMPP con my.ini.")

    # 4. Crear BD sumaq_spa en Slave si no existe
    print("\n4. Verificando base de datos 'sumaq_spa' en Slave...")
    s_cur.execute("CREATE DATABASE IF NOT EXISTS sumaq_spa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print("   [OK] Base de datos 'sumaq_spa' confirmada en Slave.")

    # 5. Obtener coordenadas del Master y volcado consistente
    print("\n5. Tomando snapshot y coordenadas del Master...")
    m_cur.execute("FLUSH TABLES WITH READ LOCK;")
    m_cur.execute("SHOW MASTER STATUS;")
    status = m_cur.fetchone()
    bin_file = status[0]
    bin_pos = status[1]
    print(f"   [INFO] Coordenadas Binlog: Archivo='{bin_file}', Posicion={bin_pos}")

    # Exportar datos e importar en slave
    dump_file = "sumaq_initial_replica_sync.sql"
    mysqldump_cmd = [
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "-h", "127.0.0.1",
        "-P", "3307",
        "-u", "root",
        "-p123456",
        "--single-transaction",
        "--routines",
        "--triggers",
        "sumaq_spa"
    ]

    print(f"   Exportando snapshot desde Master (3307) a {dump_file}...")
    with open(dump_file, "w", encoding="utf-8") as f:
        res = subprocess.run(mysqldump_cmd, stdout=f, stderr=subprocess.PIPE, text=True)
    
    # Liberar lock en Master
    m_cur.execute("UNLOCK TABLES;")
    m_conn.close()

    if res.returncode != 0:
        print(f"   [ERROR] mysqldump falló: {res.stderr}")
        return
    print("   [OK] Snapshot exportado exitosamente.")

    print(f"   Importando snapshot en Slave (3306)...")
    mysql_import_cmd = [
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "-h", "127.0.0.1",
        "-P", "3306",
        "-u", "root",
        "sumaq_spa"
    ]
    with open(dump_file, "r", encoding="utf-8") as f:
        res2 = subprocess.run(mysql_import_cmd, stdin=f, stderr=subprocess.PIPE, text=True)

    if res2.returncode != 0:
        print(f"   [ERROR] Importación falló: {res2.stderr}")
        return
    print("   [OK] Base de datos 'sumaq_spa' sincronizada en Slave.")

    # 6. Configurar replicación en Slave
    print(f"\n6. Ejecutando CHANGE MASTER TO en Slave...")
    s_cur.execute("STOP SLAVE;")
    s_cur.execute("RESET SLAVE;")
    change_sql = f"""
        CHANGE MASTER TO
            MASTER_HOST = '127.0.0.1',
            MASTER_PORT = 3307,
            MASTER_USER = 'repl_user',
            MASTER_PASSWORD = 'ReplSumaq2026Secure!',
            MASTER_LOG_FILE = '{bin_file}',
            MASTER_LOG_POS = {bin_pos};
    """
    s_cur.execute(change_sql)
    s_cur.execute("START SLAVE;")
    print("   [OK] Replicación iniciada.")

    # 7. Verificar estado
    print("\n7. Comprobando estado de hilos en Slave...")
    time.sleep(2)
    s_cur.execute("SHOW SLAVE STATUS;")
    slave_status = s_cur.fetchone()
    cols = [d[0] for d in s_cur.description]
    stat_dict = dict(zip(cols, slave_status)) if slave_status else {}

    io_run = stat_dict.get('Slave_IO_Running', 'No')
    sql_run = stat_dict.get('Slave_SQL_Running', 'No')
    lag = stat_dict.get('Seconds_Behind_Master', 'N/A')
    last_io_err = stat_dict.get('Last_IO_Error', '')
    last_sql_err = stat_dict.get('Last_SQL_Error', '')

    print(f"   * Slave_IO_Running:  {io_run}")
    print(f"   * Slave_SQL_Running: {sql_run}")
    print(f"   * Seconds_Behind:    {lag}")

    if io_run == 'Yes' and sql_run == 'Yes':
        print("\n================================================================")
        print("¡ÉXITO TOTAL! LA REPLICACIÓN ESTÁ ACTIVA Y SINCRONIZADA AL 100%")
        print("================================================================")
    else:
        print("\n[!] Advertencia en replicación:")
        if last_io_err:
            print(f"    IO Error:  {last_io_err}")
        if last_sql_err:
            print(f"    SQL Error: {last_sql_err}")

    s_conn.close()

if __name__ == '__main__':
    main()
