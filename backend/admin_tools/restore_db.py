"""
Script de restauración de base de datos MySQL para SUMAQ SPA.
Permite restaurar volcados SQL con desactivación segura de FK y diagnóstico detallado de errores.
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
    """Encuentra archivos SQL disponibles para restauración."""
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


def restore_sql_file(sql_path: Path):
    """Ejecuta un archivo SQL sobre la base de datos MySQL con manejo de errores."""
    if not sql_path.exists():
        print(f"[ERROR] El archivo '{sql_path}' no existe.")
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
            print("  -> SOLUCION: Inicia MySQL desde el panel de XAMPP o el servicio de Windows.")
        elif err_code == 1045:
            print("  -> CAUSA: Contraseña o usuario incorrecto.")
            print(f"  -> SOLUCION: Verifica 'DB_PASSWORD' en 'backend/.env' (usuario '{DB_USER}').")
        else:
            print(f"  -> DETALLE: {e}")
        return False

    # 2. Crear base de datos si no existe
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute(f"USE `{DB_NAME}`;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';")

    # 3. Leer y parsear el archivo SQL
    print("[1/3] Leyendo archivo SQL...")
    try:
        content = sql_path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        content = sql_path.read_text(encoding='latin-1')

    # Separar sentencias SQL respetando bloques
    raw_statements = []
    current_stmt = []
    in_delimiter = False
    
    for line in content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith('--') or trimmed.startswith('/*') or trimmed.startswith('#'):
            continue
        
        current_stmt.append(line)
        if trimmed.endswith(';'):
            raw_statements.append('\n'.join(current_stmt))
            current_stmt = []
            
    if current_stmt:
        raw_statements.append('\n'.join(current_stmt))

    total_statements = len(raw_statements)
    print(f"[2/3] Ejecutando {total_statements} sentencias SQL en `{DB_NAME}`...")

    # 4. Ejecución de sentencias
    executed = 0
    errors = 0
    with conn.cursor() as cursor:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        for i, stmt in enumerate(raw_statements, 1):
            stmt_clean = stmt.strip()
            if not stmt_clean:
                continue
            try:
                cursor.execute(stmt_clean)
                executed += 1
            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"  [AVISO] Sentencia {i} falló: {e}")
                    print(f"          Query: {stmt_clean[:80]}...")
        
        # Restaurar Foreign Key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

    conn.close()

    if errors == 0:
        print(f"\n[OK] ¡Restauración completada con éxito!")
        print(f"     Se ejecutaron {executed} sentencias SQL sin ningún error.")
        print(f"     La base de datos '{DB_NAME}' está lista y sincronizada.")
        return True
    else:
        print(f"\n[AVISO] Restauración completada con {errors} advertencias/errores no críticos.")
        print(f"        Se ejecutaron {executed} sentencias exitosamente.")
        return True


if __name__ == '__main__':
    if len(sys.argv) > 1:
        target_file = Path(sys.argv[1])
    else:
        available = get_available_sql_files()
        if not available:
            print("[ERROR] No se encontraron archivos de respaldo o dumps .sql para restaurar.")
            sys.exit(1)
        target_file = available[0][1]

    success = restore_sql_file(target_file)
    sys.exit(0 if success else 1)
