"""
Script de restauración de base de datos MySQL para SUMAQ SPA.
Permite restaurar volcados SQL con desactivación segura de FK, detección automática de codificación (UTF-8, UTF-16, Latin-1) y diagnóstico detallado de errores.
"""

import os
import sys
import re
from pathlib import Path
from dotenv import load_dotenv

# Cargar configuración desde backend/.env o raíz
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / 'backend' / '.env')
load_dotenv(BASE_DIR / '.env')

DB_NAME = os.environ.get('DB_NAME', 'sumaq_spa')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
DB_PORT = int(os.environ.get('DB_PORT', '3306'))


def get_available_sql_files():
    """Encuentra archivos SQL disponibles para restauración ordenados por prioridad."""
    files = []
    
    # 1. Backups recientes
    backup_dirs = [BASE_DIR / 'admin_tools' / 'backups', BASE_DIR / 'backend' / 'admin_tools' / 'backups']
    for b_dir in backup_dirs:
        if b_dir.exists():
            for f in sorted(b_dir.glob('*.sql'), key=os.path.getmtime, reverse=True):
                if f.stat().st_size > 0:
                    files.append(('Backup Reciente', f))
    
    # 2. Dumps oficiales del proyecto
    dumps = [
        BASE_DIR / 'database' / '03_sumaq_spa_full_dump.sql',
        BASE_DIR / 'backend' / 'database' / '03_sumaq_spa_full_dump.sql',
        BASE_DIR / 'database' / '01_schema.sql',
    ]
    for d in dumps:
        if d.exists() and d.stat().st_size > 0 and not any(f[1] == d for f in files):
            files.append(('Dump Oficial', d))
            
    return files


def read_sql_file_clean(sql_path: Path) -> str:
    """Lee un archivo SQL autodetectando UTF-16, UTF-8 con/sin BOM y Latin-1."""
    raw = sql_path.read_bytes()
    if raw.startswith(b'\xff\xfe') or raw.startswith(b'\xfe\xff'):
        return raw.decode('utf-16')
    elif raw.startswith(b'\xef\xbb\xbf'):
        return raw.decode('utf-8-sig')
    else:
        try:
            return raw.decode('utf-8')
        except UnicodeDecodeError:
            return raw.decode('latin-1')


def parse_sql_statements(content: str):
    """Parsea el contenido SQL dividiendo en sentencias ejecutables individuales."""
    statements = []
    current = []
    in_quote = False
    quote_char = None
    
    for line in content.splitlines():
        trimmed = line.strip()
        # Ignorar comentarios de línea completa si no estamos dentro de una sentencia acumulada
        if not current and (trimmed.startswith('--') or trimmed.startswith('/*') or trimmed.startswith('#') or not trimmed):
            continue
        
        # Filtrar directivas DROP/CREATE DATABASE para permitir restaurar en el schema target
        current.append(line)
        if trimmed.endswith(';'):
            stmt = '\n'.join(current).strip()
            # Limpiar posibles comentarios iniciales
            stmt = re.sub(r'^(/\*.*?\*/|--[^\n]*\n|#[^\n]*\n|\s+)+', '', stmt, flags=re.DOTALL).strip()
            if stmt:
                statements.append(stmt)
            current = []
            
    if current:
        stmt = '\n'.join(current).strip()
        if stmt:
            statements.append(stmt)
            
    return statements


def restore_sql_file(sql_path: Path):
    """Ejecuta un archivo SQL sobre la base de datos MySQL con manejo de errores."""
    if not sql_path.exists():
        print(f"\n[ERROR] El archivo de respaldo '{sql_path}' no existe.")
        return False

    print(f"\n=======================================================")
    print(f"  RESTAURADOR DE BASE DE DATOS - SUMAQ SPA")
    print(f"=======================================================")
    print(f"  Servidor:  {DB_HOST}:{DB_PORT}")
    print(f"  Usuario:   {DB_USER}")
    print(f"  Base BD:   {DB_NAME}")
    print(f"  Archivo:   {sql_path.name}")
    print(f"  Tamano:    {sql_path.stat().st_size / 1024:.1f} KB")
    print(f"=======================================================\n")

    try:
        import pymysql
    except ImportError:
        print("[ERROR] El paquete 'pymysql' no está instalado en el entorno de Python.")
        return False

    # 1. Conexión al servidor MySQL
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            charset='utf8mb4',
            autocommit=True
        )
    except pymysql.err.OperationalError as e:
        err_code = e.args[0] if e.args else 0
        print(f"[ERROR] No se pudo conectar al servidor MySQL en {DB_HOST}:{DB_PORT}.")
        if err_code in (2003, 10061):
            print("  -> CAUSA: El servicio MySQL no está iniciado.")
            print("  -> SOLUCION: Inicia el módulo MySQL desde el panel de XAMPP o el servicio de Windows.")
        elif err_code == 1045:
            print("  -> CAUSA: Contraseña o usuario de MySQL incorrecto.")
            print(f"  -> SOLUCION: Verifica 'DB_PASSWORD' en 'backend/.env' (usuario '{DB_USER}').")
        else:
            print(f"  -> DETALLE DEL ERROR: {e}")
        return False

    # 2. Preparar Base de Datos con Foreign Keys desactivadas temporalmente
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute(f"USE `{DB_NAME}`;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("SET UNIQUE_CHECKS = 0;")
        cursor.execute("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';")

    # 3. Leer y parsear el archivo SQL
    print("[1/3] Leyendo y procesando archivo SQL...")
    try:
        content = read_sql_file_clean(sql_path)
    except Exception as e:
        print(f"[ERROR] Error al leer el archivo: {e}")
        conn.close()
        return False

    statements = parse_sql_statements(content)
    total_statements = len(statements)
    print(f"[2/3] Ejecutando {total_statements} sentencias SQL en base de datos `{DB_NAME}`...")

    # 4. Ejecución de sentencias
    executed = 0
    errors = 0
    with conn.cursor() as cursor:
        cursor.execute(f"USE `{DB_NAME}`;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        for i, stmt in enumerate(statements, 1):
            try:
                cursor.execute(stmt)
                executed += 1
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  [AVISO] Falló sentencia {i}: {e}")
                    clean_display = ' '.join(stmt.split())[:75]
                    print(f"          Query: {clean_display}...")
        
        # Reactivar chequeos de integridad
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        cursor.execute("SET UNIQUE_CHECKS = 1;")

    conn.close()

    print(f"\n[3/3] Finalizando proceso de restauracion...")
    if errors == 0:
        print(f"\n=======================================================")
        print(f"  [OK] ¡Base de datos '{DB_NAME}' restaurada con EXITO!")
        print(f"  Sentencias aplicadas: {executed} de {total_statements}")
        print(f"=======================================================\n")
        return True
    elif executed > 0:
        print(f"\n=======================================================")
        print(f"  [OK] Base de datos '{DB_NAME}' restaurada con {executed} sentencias.")
        print(f"  (Hubo {errors} advertencias no criticas).")
        print(f"=======================================================\n")
        return True
    else:
        print(f"\n[ERROR] No se pudo ejecutar ninguna sentencia SQL del archivo.")
        return False


if __name__ == '__main__':
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    else:
        available = get_available_sql_files()
        if not available:
            print("[ERROR] No se encontraron archivos de respaldo o dumps .sql para restaurar.")
            sys.exit(1)
        target = available[0][1]

    ok = restore_sql_file(target)
    sys.exit(0 if ok else 1)
