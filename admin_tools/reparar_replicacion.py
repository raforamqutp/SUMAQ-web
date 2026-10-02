import time
import pymysql

# 1. Limpiar tabla de pruebas en Master y obtener posicion actual
m_conn = pymysql.connect(host='127.0.0.1', port=3307, user='root', password='123456', database='sumaq_spa')
m_cur = m_conn.cursor()
m_cur.execute('TRUNCATE TABLE _test_replication_proof;')
m_cur.execute('SHOW MASTER STATUS;')
status = m_cur.fetchone()
file, pos = status[0], status[1]
print(f'Master coordenadas actuales: File={file}, Pos={pos}')
m_conn.close()

# 2. Limpiar y reanudar Slave
s_conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', database='sumaq_spa')
s_cur = s_conn.cursor()
s_cur.execute('STOP REPLICA;')
s_cur.execute('RESET REPLICA;')
s_cur.execute('TRUNCATE TABLE _test_replication_proof;')
s_cur.execute(f'''
    CHANGE REPLICATION SOURCE TO
        SOURCE_HOST = '127.0.0.1',
        SOURCE_PORT = 3307,
        SOURCE_USER = 'repl_user',
        SOURCE_PASSWORD = 'ReplSumaq2026Secure!',
        SOURCE_LOG_FILE = '{file}',
        SOURCE_LOG_POS = {pos};
''')
s_cur.execute('START REPLICA;')

time.sleep(1)
s_cur.execute('SHOW REPLICA STATUS;')
res = s_cur.fetchone()
cols = [d[0] for d in s_cur.description]
d = dict(zip(cols, res))
print('Replica_IO_Running:', d.get('Replica_IO_Running'))
print('Replica_SQL_Running:', d.get('Replica_SQL_Running'))
print('Seconds_Behind_Source:', d.get('Seconds_Behind_Source'))
print('Last_Error:', d.get('Last_Error'))
s_conn.close()
