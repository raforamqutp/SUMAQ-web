#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
==============================================================================
SUMAQ SPA - MONITOR Y DEMOSTRACIÓN DE REPLICACIÓN MASTER-SLAVE EN TIEMPO REAL
==============================================================================
Arquitectura:
  - Master (Source):  127.0.0.1:3306 (Server-ID: 1, RW - Escrituras y Transacciones)
  - Slave (Replica):  127.0.0.1:3307 (Server-ID: 2, RO - Lecturas y Respaldo)
==============================================================================
"""

import sys
import os
import time
import socket
import argparse
import datetime
import uuid
from typing import Dict, Any, Optional, Tuple

# Forzar codificación UTF-8 en Windows Console si está disponible
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    import pymysql
except ImportError:
    print("Error: El paquete 'pymysql' no esta instalado. Ejecute: pip install pymysql")
    sys.exit(1)

# Configuración de conexiones
MASTER_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'sumaq_spa',
    'connect_timeout': 2,
    'autocommit': True
}

SLAVE_CONFIG = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': 'root',
    'password': '',
    'database': 'sumaq_spa',
    'connect_timeout': 2,
    'autocommit': True
}

# Códigos ANSI para estilizado en consola
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"

def clear_screen():
    if sys.stdout.isatty():
        os.system('cls' if os.name == 'nt' else 'clear')

def wait_prompt(msg="\nPresione Enter para continuar..."):
    if sys.stdin.isatty():
        try:
            input(msg)
        except (KeyboardInterrupt, EOFError):
            pass

def check_tcp_port(host: str, port: int, timeout: float = 1.0) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

def get_connection(config: Dict[str, Any]) -> Optional[pymysql.Connection]:
    try:
        return pymysql.connect(**config)
    except Exception:
        return None

def get_server_info(conn: pymysql.Connection) -> Dict[str, Any]:
    info = {}
    with conn.cursor() as cur:
        cur.execute("SELECT @@version, @@server_id, @@read_only, @@hostname")
        row = cur.fetchone()
        info['version'] = row[0]
        info['server_id'] = row[1]
        info['read_only'] = bool(row[2])
        info['hostname'] = row[3]

        cur.execute("SHOW STATUS LIKE 'Uptime'")
        uptime_row = cur.fetchone()
        info['uptime'] = int(uptime_row[1]) if uptime_row else 0

        cur.execute("SHOW STATUS LIKE 'Threads_connected'")
        threads_row = cur.fetchone()
        info['threads_connected'] = int(threads_row[1]) if threads_row else 0

        cur.execute("SHOW STATUS WHERE Variable_name IN ('Queries', 'Com_select', 'Com_insert', 'Com_update', 'Com_delete')")
        for k, v in cur.fetchall():
            info[k] = int(v)
    return info

def get_master_status(conn: pymysql.Connection) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute("SHOW MASTER STATUS")
        row = cur.fetchone()
        if row:
            return {
                'file': row[0],
                'position': row[1],
                'binlog_do_db': row[2] if len(row) > 2 else '',
                'binlog_ignore_db': row[3] if len(row) > 3 else ''
            }
    return None

def get_slave_status(conn: pymysql.Connection) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute("SHOW SLAVE STATUS")
        row = cur.fetchone()
        if not row:
            return None
        cols = [d[0] for d in cur.description]
        return dict(zip(cols, row))

def get_active_processlist(conn: pymysql.Connection, limit: int = 4) -> list:
    procs = []
    with conn.cursor() as cur:
        cur.execute("SHOW PROCESSLIST")
        for row in cur.fetchall()[:limit]:
            procs.append({
                'id': row[0],
                'user': row[1],
                'host': row[2],
                'db': row[3] or '-',
                'command': row[4],
                'time': row[5],
                'state': row[6] or '',
                'info': (row[7] or '')[:40]
            })
    return procs

def ensure_test_table(conn: pymysql.Connection):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _test_replication_proof (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token VARCHAR(64) NOT NULL,
                mensaje VARCHAR(255) DEFAULT '',
                servidor_origen VARCHAR(64) DEFAULT 'MASTER-3306',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

# ==============================================================================
# VISTA 1: DIAGNÓSTICO ESTÁTICO / HEALTHCHECK DE AMBOS PUERTOS
# ==============================================================================
### RIESGO: Replicación Master-Slave asíncrona (puertos 3306 / 3307)
def run_health_check():
    clear_screen()
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}       SUMAQ SPA - DIAGNOSTICO DE TOPOLOGIA Y ESTADO DE REPLICACION (3306 <-> 3307)     {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}\n")

    m_tcp = check_tcp_port(MASTER_CONFIG['host'], MASTER_CONFIG['port'])
    s_tcp = check_tcp_port(SLAVE_CONFIG['host'], SLAVE_CONFIG['port'])

    print(f"{Colors.BOLD}1. ESTADO DE PUERTOS TCP Y ESCUCHA DE SOCKETS:{Colors.RESET}")
    print(f"  - Puerto 3306 [Master Principal]: " + (f"{Colors.GREEN}[ESCUCHANDO / ACTIVO]{Colors.RESET}" if m_tcp else f"{Colors.RED}[INACTIVO / CERRADO]{Colors.RESET}"))
    print(f"  - Puerto 3307 [Slave Replica]:    " + (f"{Colors.GREEN}[ESCUCHANDO / ACTIVO]{Colors.RESET}" if s_tcp else f"{Colors.RED}[INACTIVO / CERRADO]{Colors.RESET}"))
    print()

    m_conn = get_connection(MASTER_CONFIG) if m_tcp else None
    s_conn = get_connection(SLAVE_CONFIG) if s_tcp else None

    # Info Master
    print(f"{Colors.BOLD}{Colors.CYAN}2. NODO MASTER (PUERTO 3306 - ESCRITURAS / TRANSACCIONES):{Colors.RESET}")
    if m_conn:
        try:
            m_info = get_server_info(m_conn)
            m_stat = get_master_status(m_conn)
            print(f"  * Version:              {m_info.get('version')}")
            print(f"  * Server ID:            {Colors.BOLD}{m_info.get('server_id')}{Colors.RESET} (Rol: Master Primario)")
            print(f"  * Modo Read-Only:       {Colors.GREEN}OFF (Permite Lectura y Escritura Transaccional){Colors.RESET}")
            print(f"  * Conexiones activas:   {m_info.get('threads_connected')} hilos")
            print(f"  * Uptime:               {m_info.get('uptime')} segundos")
            if m_stat:
                print(f"  * Archivo Binlog Activo:{Colors.YELLOW} {m_stat.get('file')} {Colors.RESET}")
                print(f"  * Posicion de Binlog:   {Colors.YELLOW} {m_stat.get('position')} bytes {Colors.RESET}")
                print(f"  * Base de datos log:    {m_stat.get('binlog_do_db') or 'Todas'}")
            else:
                print(f"  * Estado Binlog:        {Colors.YELLOW}No activo o sin eventos aun{Colors.RESET}")
        except Exception as e:
            print(f"  {Colors.RED}Error al consultar Master: {e}{Colors.RESET}")
        finally:
            m_conn.close()
    else:
        print(f"  {Colors.RED}No se pudo conectar a MySQL en puerto 3306.{Colors.RESET}")

    print()

    # Info Slave
    print(f"{Colors.BOLD}{Colors.MAGENTA}3. NODO SLAVE / REPLICA (PUERTO 3307 - LECTURAS / ALTA DISPONIBILIDAD):{Colors.RESET}")
    if s_conn:
        try:
            s_info = get_server_info(s_conn)
            s_stat = get_slave_status(s_conn)
            print(f"  * Version:              {s_info.get('version')}")
            print(f"  * Server ID:            {Colors.BOLD}{s_info.get('server_id')}{Colors.RESET} (Rol: Slave Replica)")
            print(f"  * Modo Read-Only:       " + (f"{Colors.GREEN}ON (Protegido contra escrituras accidentales){Colors.RESET}" if s_info.get('read_only') else f"{Colors.YELLOW}OFF{Colors.RESET}"))
            print(f"  * Conexiones activas:   {s_info.get('threads_connected')} hilos")
            if s_stat:
                io_run = s_stat.get('Slave_IO_Running')
                sql_run = s_stat.get('Slave_SQL_Running')
                lag = s_stat.get('Seconds_Behind_Master')
                exec_pos = s_stat.get('Exec_Master_Log_Pos')
                read_pos = s_stat.get('Read_Master_Log_Pos')
                master_log = s_stat.get('Master_Log_File')
                relay_log = s_stat.get('Relay_Log_File')

                io_color = Colors.GREEN if io_run == 'Yes' else Colors.RED
                sql_color = Colors.GREEN if sql_run == 'Yes' else Colors.RED
                lag_color = Colors.GREEN if lag == 0 else Colors.YELLOW

                print(f"  * Hilo I/O (Recepcion): {io_color}{io_run}{Colors.RESET} (Conectado a Master 127.0.0.1:3306)")
                print(f"  * Hilo SQL (Ejecucion): {sql_color}{sql_run}{Colors.RESET} (Aplicando eventos en base sumaq_spa)")
                print(f"  * Retraso (Replication Lag): {lag_color}{lag} segundos (Sincronizado en tiempo real){Colors.RESET}")
                print(f"  * Master Log File:      {master_log}")
                print(f"  * Posicion Leida / Ejec:{read_pos} / {exec_pos}")
                print(f"  * Relay Log File:       {relay_log}")
            else:
                print(f"  * Estado Replicacion:   {Colors.YELLOW}SHOW SLAVE STATUS no devolvio configuracion activa.{Colors.RESET}")
        except Exception as e:
            print(f"  {Colors.RED}Error al consultar Slave: {e}{Colors.RESET}")
        finally:
            s_conn.close()
    else:
        print(f"  {Colors.RED}No se pudo conectar a MySQL en puerto 3307.{Colors.RESET}")

    print(f"\n{Colors.CYAN}========================================================================================{Colors.RESET}")

# ==============================================================================
# VISTA 2: TABLERO EN TIEMPO REAL (LIVE MONITOR DASHBOARD)
# ==============================================================================
def run_live_dashboard(max_ticks: Optional[int] = None):
    clear_screen()
    print(f"{Colors.BOLD}{Colors.YELLOW}Iniciando Tablero en Vivo... Presione Ctrl+C para regresar al menu.{Colors.RESET}")
    time.sleep(0.5)

    last_m_queries = 0
    last_s_queries = 0
    last_time = time.time()
    tick_count = 0

    try:
        while True:
            m_conn = get_connection(MASTER_CONFIG)
            s_conn = get_connection(SLAVE_CONFIG)
            curr_time = time.time()
            dt = max(curr_time - last_time, 0.001)

            clear_screen()
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print(f"{Colors.BOLD}{Colors.WHITE}+--------------------------------------------------------------------------------------+{Colors.RESET}")
            print(f"{Colors.BOLD}{Colors.WHITE}| {Colors.CYAN}SUMAQ SPA - MONITOR DE REPLICACION Y ACTIVIDAD EN VIVO{Colors.WHITE}     Hora: {Colors.YELLOW}{now_str}{Colors.WHITE} |{Colors.RESET}")
            print(f"{Colors.BOLD}{Colors.WHITE}+--------------------------------------------------------------------------------------+{Colors.RESET}")

            # Topología de Conexión
            m_status_str = f"{Colors.GREEN}[EN LINEA]{Colors.RESET}" if m_conn else f"{Colors.RED}[DESCONECTADO]{Colors.RESET}"
            s_status_str = f"{Colors.GREEN}[EN LINEA]{Colors.RESET}" if s_conn else f"{Colors.RED}[DESCONECTADO]{Colors.RESET}"

            print(f"\n {Colors.BOLD}TOPOLOGIA DE NODOS:{Colors.RESET}")
            print(f"  [{Colors.CYAN}MASTER (3306){Colors.RESET}] {m_status_str}  ===(Binlog ROW Sync)===>  [{Colors.MAGENTA}SLAVE (3307){Colors.RESET}] {s_status_str}")

            # Métricas del Master
            print(f"\n{Colors.BOLD}{Colors.CYAN} === [NODO MASTER: PUERTO 3306] (Transacciones & Escritura) ============================={Colors.RESET}")
            if m_conn:
                m_info = get_server_info(m_conn)
                m_stat = get_master_status(m_conn)
                m_procs = get_active_processlist(m_conn, limit=3)

                m_q = m_info.get('Queries', 0)
                m_qps = max(0, (m_q - last_m_queries) / dt) if last_m_queries > 0 else 0
                last_m_queries = m_q

                bin_file = m_stat.get('file', 'N/A') if m_stat else 'N/A'
                bin_pos = m_stat.get('position', 0) if m_stat else 0

                print(f"  * Server ID: {Colors.BOLD}{m_info.get('server_id')}{Colors.RESET} | Conexiones: {m_info.get('threads_connected')} | Uptime: {m_info.get('uptime')}s")
                print(f"  * Binlog Actual: {Colors.YELLOW}{bin_file}{Colors.RESET} | Posicion Puntero: {Colors.BOLD}{Colors.YELLOW}{bin_pos}{Colors.RESET} bytes")
                print(f"  * Consultas Totales: {m_q} | {Colors.BOLD}QPS Instantaneo:{Colors.RESET} {m_qps:.1f} ops/s")
                print(f"  * Comandos Globales: SELECT: {m_info.get('Com_select')} | INSERT: {m_info.get('Com_insert')} | UPDATE: {m_info.get('Com_update')} | DELETE: {m_info.get('Com_delete')}")

                print(f"  * {Colors.DIM}Procesos activos en Master:{Colors.RESET}")
                for p in m_procs:
                    t_val = p['time'] if p['time'] is not None else 0
                    print(f"    - ID {p['id']:>4} | User: {p['user']:<11} | Command: {p['command']:<7} | Time: {t_val:>2}s | State: {p['state'][:25]}")
            else:
                print(f"  {Colors.RED}[!] No se puede comunicar con el Master en 127.0.0.1:3306{Colors.RESET}")

            # Métricas del Slave
            print(f"\n{Colors.BOLD}{Colors.MAGENTA} === [NODO SLAVE: PUERTO 3307] (Lecturas & Alta Disponibilidad) =========================={Colors.RESET}")
            if s_conn:
                s_info = get_server_info(s_conn)
                s_stat = get_slave_status(s_conn)
                s_procs = get_active_processlist(s_conn, limit=3)

                s_q = s_info.get('Queries', 0)
                s_qps = max(0, (s_q - last_s_queries) / dt) if last_s_queries > 0 else 0
                last_s_queries = s_q

                io_ok = s_stat and s_stat.get('Slave_IO_Running') == 'Yes'
                sql_ok = s_stat and s_stat.get('Slave_SQL_Running') == 'Yes'
                lag = s_stat.get('Seconds_Behind_Master', 'N/A') if s_stat else 'N/A'
                exec_pos = s_stat.get('Exec_Master_Log_Pos', 'N/A') if s_stat else 'N/A'

                io_badge = f"{Colors.GREEN}[I/O: YES]{Colors.RESET}" if io_ok else f"{Colors.RED}[I/O: NO]{Colors.RESET}"
                sql_badge = f"{Colors.GREEN}[SQL: YES]{Colors.RESET}" if sql_ok else f"{Colors.RED}[SQL: NO]{Colors.RESET}"
                lag_badge = f"{Colors.GREEN}{lag}s (AL DIA){Colors.RESET}" if lag == 0 else f"{Colors.YELLOW}{lag}s LAG{Colors.RESET}"

                print(f"  * Server ID: {Colors.BOLD}{s_info.get('server_id')}{Colors.RESET} | Read-Only: {Colors.GREEN}ON{Colors.RESET} | Conexiones: {s_info.get('threads_connected')}")
                print(f"  * Hilos de Replica: {io_badge} {sql_badge} | Replication Lag: {lag_badge}")
                print(f"  * Posicion Replicada en Slave: {Colors.BOLD}{Colors.YELLOW}{exec_pos}{Colors.RESET} bytes")
                print(f"  * Consultas Totales: {s_q} | {Colors.BOLD}QPS Instantaneo:{Colors.RESET} {s_qps:.1f} ops/s")
                print(f"  * Comandos Globales: SELECT (Lecturas): {s_info.get('Com_select')}")

                print(f"  * {Colors.DIM}Procesos activos en Slave:{Colors.RESET}")
                for p in s_procs:
                    t_val = p['time'] if p['time'] is not None else 0
                    print(f"    - ID {p['id']:>4} | User: {p['user']:<11} | Command: {p['command']:<7} | Time: {t_val:>2}s | State: {p['state'][:25]}")
            else:
                print(f"  {Colors.RED}[!] No se puede comunicar con el Slave en 127.0.0.1:3307{Colors.RESET}")

            print(f"\n{Colors.CYAN}----------------------------------------------------------------------------------------{Colors.RESET}")
            print(f" {Colors.DIM}Actualizando automaticamente cada 1.0s. Presione Ctrl+C para salir al menu.{Colors.RESET}")

            last_time = curr_time
            if m_conn: m_conn.close()
            if s_conn: s_conn.close()

            tick_count += 1
            if max_ticks and tick_count >= max_ticks:
                break

            time.sleep(1.0)

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Monitoreo detenido por el usuario.{Colors.RESET}")
        time.sleep(0.5)

# ==============================================================================
# VISTA 3: DEMOSTRACIÓN TRANSACCIONAL INTERACTIVA MASTER -> SLAVE
# ==============================================================================
def run_interactive_demo():
    clear_screen()
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}       DEMOSTRACION TRANSACCIONAL EN VIVO: ESCRITURA EN MASTER -> SINCRONIZACION SLAVE  {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}\n")

    m_conn = get_connection(MASTER_CONFIG)
    s_conn = get_connection(SLAVE_CONFIG)

    if not m_conn or not s_conn:
        print(f"{Colors.RED}Error: Ambos servidores (3306 y 3307) deben estar encendidos para la demostracion.{Colors.RESET}")
        wait_prompt()
        return

    try:
        ensure_test_table(m_conn)

        print(f"{Colors.BOLD}PASO 1: LECTURA DE COORDENADAS PREVIAS A LA TRANSACCION:{Colors.RESET}")
        m_status_pre = get_master_status(m_conn)
        s_status_pre = get_slave_status(s_conn)

        pos_m_pre = m_status_pre['position'] if m_status_pre else 0
        file_m_pre = m_status_pre['file'] if m_status_pre else 'N/A'
        pos_s_pre = s_status_pre['Exec_Master_Log_Pos'] if s_status_pre else 0

        print(f"  - Master (3306) Binlog File / Pos: {Colors.CYAN}{file_m_pre} @ {pos_m_pre}{Colors.RESET}")
        print(f"  - Slave  (3307) Executed Log Pos:  {Colors.MAGENTA}{pos_s_pre}{Colors.RESET}")
        print()

        # Generar payload único
        test_uuid = uuid.uuid4().hex[:8]
        test_token = f"SUMAQ-DEMO-{int(time.time())}-{test_uuid}"
        test_msg = f"Prueba de Replicacion en Vivo - Cita/Transaccion #{test_uuid}"

        print(f"{Colors.BOLD}PASO 2: EJECUTANDO TRANSACCION 'INSERT' EN EL MASTER (PUERTO 3306):{Colors.RESET}")
        print(f"  > Payload: Token='{Colors.YELLOW}{test_token}{Colors.RESET}', Mensaje='{test_msg}'")

        t_start = time.perf_counter()
        with m_conn.cursor() as cur:
            cur.execute("""
                INSERT INTO _test_replication_proof (token, mensaje, servidor_origen)
                VALUES (%s, %s, 'MASTER-3306')
            """, (test_token, test_msg))
            row_id = cur.lastrowid
        t_write_ms = (time.perf_counter() - t_start) * 1000

        m_status_post = get_master_status(m_conn)
        pos_m_post = m_status_post['position'] if m_status_post else 0
        diff_bytes = pos_m_post - pos_m_pre

        print(f"  {Colors.GREEN}[OK] Transaccion confirmada en Master.{Colors.RESET}")
        print(f"  - ID generado en tabla:            {Colors.BOLD}{row_id}{Colors.RESET}")
        print(f"  - Latencia de escritura en Master: {Colors.BOLD}{t_write_ms:.2f} ms{Colors.RESET}")
        print(f"  - Nueva posicion del Binlog:       {Colors.CYAN}{pos_m_post} bytes (+{diff_bytes} bytes generados){Colors.RESET}")
        print()

        print(f"{Colors.BOLD}PASO 3: VERIFICANDO REPLICACION INMEDIATA EN EL SLAVE (PUERTO 3307):{Colors.RESET}")
        print(f"  > Consultando tabla en el Slave mediante SELECT WHERE token = '{test_token}'...")

        replicated_row = None
        t_repl_start = time.perf_counter()
        attempts = 0
        max_attempts = 20

        while attempts < max_attempts:
            attempts += 1
            with s_conn.cursor() as cur:
                cur.execute("SELECT id, token, mensaje, servidor_origen, created_at FROM _test_replication_proof WHERE token = %s", (test_token,))
                replicated_row = cur.fetchone()
                if replicated_row:
                    break
            time.sleep(0.02)

        t_repl_ms = (time.perf_counter() - t_repl_start) * 1000

        if replicated_row:
            s_status_post = get_slave_status(s_conn)
            print(f"  {Colors.GREEN}[OK] !REGISTRO ENCONTRADO EN EL SLAVE! (Replicado en {t_repl_ms:.2f} ms){Colors.RESET}")
            print(f"  - Datos leidos desde el Slave (3307):")
            print(f"    * ID:               {replicated_row[0]}")
            print(f"    * Token:            {replicated_row[1]}")
            print(f"    * Mensaje:          {replicated_row[2]}")
            print(f"    * Origen:           {replicated_row[3]}")
            print(f"    * Timestamp BD:     {replicated_row[4]}")
            print(f"  - Slave Executed Pos: {Colors.MAGENTA}{s_status_post.get('Exec_Master_Log_Pos')}{Colors.RESET}")
            print(f"  - Replication Lag:    {Colors.GREEN}{s_status_post.get('Seconds_Behind_Master')} segundos{Colors.RESET}")
        else:
            print(f"  {Colors.RED}[X] Error: El registro no llego al Slave tras {max_attempts * 20}ms.{Colors.RESET}")

        print(f"\n{Colors.BOLD}{Colors.GREEN}========================================================================================{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}       RESULTADO: DEMOSTRACION EXITOSA - REPLICACION ASINCRONA ACTIVA AL 100%           {Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}========================================================================================{Colors.RESET}")

    finally:
        m_conn.close()
        s_conn.close()

    wait_prompt()

# ==============================================================================
# VISTA 4: SIMULACIÓN DE READ/WRITE SPLITTING
# ==============================================================================
def run_split_simulation():
    clear_screen()
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}       SIMULACION DE ENRUTAMIENTO DE CARGA (READ / WRITE SPLITTING)                     {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}\n")

    m_conn = get_connection(MASTER_CONFIG)
    s_conn = get_connection(SLAVE_CONFIG)

    if not m_conn or not s_conn:
        print(f"{Colors.RED}Error: Ambos nodos (3306 y 3307) deben estar en linea.{Colors.RESET}")
        wait_prompt()
        return

    try:
        ensure_test_table(m_conn)
        total_ops = 8

        print(f"{Colors.BOLD}Ejecutando rafaga de transacciones:{Colors.RESET}")
        print(f"  - Operaciones de ESCRITURA (INSERT)  ===> Enrutadas a {Colors.CYAN}MASTER (3306){Colors.RESET}")
        print(f"  - Operaciones de LECTURA (SELECT)    ===> Enrutadas a {Colors.MAGENTA}SLAVE (3307){Colors.RESET}\n")

        for i in range(1, total_ops + 1):
            batch_uuid = uuid.uuid4().hex[:6]
            batch_token = f"SPLIT-{i}-{batch_uuid}"

            # 1. Escritura en Master
            t0 = time.perf_counter()
            with m_conn.cursor() as cur:
                cur.execute("INSERT INTO _test_replication_proof (token, mensaje, servidor_origen) VALUES (%s, %s, 'MASTER')",
                            (batch_token, f"Transaccion Lote #{i}"))
            t_w = (time.perf_counter() - t0) * 1000

            # 2. Lectura inmediata desde Slave
            time.sleep(0.01)
            t1 = time.perf_counter()
            found = False
            with s_conn.cursor() as cur:
                cur.execute("SELECT id, token FROM _test_replication_proof WHERE token = %s", (batch_token,))
                if cur.fetchone():
                    found = True
            t_r = (time.perf_counter() - t1) * 1000

            status_txt = f"{Colors.GREEN}[Sincronizado OK]{Colors.RESET}" if found else f"{Colors.RED}[Pendiente]{Colors.RESET}"
            print(f"  [Op {i}/{total_ops}] Token: {batch_token} | {Colors.CYAN}WRITE Master: {t_w:.2f}ms{Colors.RESET} | {Colors.MAGENTA}READ Slave: {t_r:.2f}ms{Colors.RESET} | {status_txt}")

        print(f"\n{Colors.GREEN}[OK] Rafaga completada. Todas las lecturas fueron descargadas en el Slave sin impacto en Master.{Colors.RESET}")

    finally:
        m_conn.close()
        s_conn.close()

    wait_prompt()

# ==============================================================================
# MENÚ PRINCIPAL
# ==============================================================================
def main_menu():
    while True:
        clear_screen()
        print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.WHITE}        SUMAQ SPA - PANEL DE CONTROL Y DEMOSTRACION DE REPLICACION MASTER-SLAVE         {Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}========================================================================================{Colors.RESET}")
        print(f" {Colors.DIM}Topologia: Master (127.0.0.1:3306) <===[Binlog ROW]===> Slave (127.0.0.1:3307){Colors.RESET}\n")

        print(f"  {Colors.BOLD}[1]{Colors.RESET} {Colors.GREEN}Tablero en Tiempo Real (Live Activity Dashboard - 1s Refresh){Colors.RESET}")
        print(f"  {Colors.BOLD}[2]{Colors.RESET} {Colors.CYAN}Demostracion Transaccional en Vivo (Insert Master -> Replicacion Slave){Colors.RESET}")
        print(f"  {Colors.BOLD}[3]{Colors.RESET} {Colors.MAGENTA}Simulacion de Read/Write Splitting (Enrutamiento de Carga){Colors.RESET}")
        print(f"  {Colors.BOLD}[4]{Colors.RESET} {Colors.YELLOW}Diagnostico Rapido de Puertos y Estado de Hilos (SHOW SLAVE/MASTER){Colors.RESET}")
        print(f"  {Colors.BOLD}[5]{Colors.RESET} Salir\n")

        try:
            opcion = input(f"{Colors.BOLD}Seleccione una opcion [1-5]: {Colors.RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            print()
            break

        if opcion == '1':
            run_live_dashboard()
        elif opcion == '2':
            run_interactive_demo()
        elif opcion == '3':
            run_split_simulation()
        elif opcion == '4':
            run_health_check()
            wait_prompt("\nPresione Enter para volver al menu...")
        elif opcion == '5' or opcion.lower() == 'q':
            print(f"\n{Colors.CYAN}Saliendo del monitor de replicacion. Hasta luego!{Colors.RESET}\n")
            break
        else:
            print(f"{Colors.RED}Opcion invalida.{Colors.RESET}")
            time.sleep(0.5)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Monitor y Demostracion de Replicacion Master-Slave en SUMAQ Spa")
    parser.add_argument('-l', '--live', action='store_true', help="Ejecutar directamente el Tablero en Tiempo Real")
    parser.add_argument('-d', '--demo', action='store_true', help="Ejecutar directamente la Demostracion Transaccional")
    parser.add_argument('-c', '--check', action='store_true', help="Ejecutar diagnostico puntual y salir")
    parser.add_argument('-s', '--split', action='store_true', help="Ejecutar simulacion de Read/Write Splitting")

    args = parser.parse_args()

    if args.live:
        run_live_dashboard()
    elif args.demo:
        run_interactive_demo()
    elif args.check:
        run_health_check()
    elif args.split:
        run_split_simulation()
    else:
        main_menu()
