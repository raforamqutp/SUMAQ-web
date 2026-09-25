-- Configuración de usuario y privilegios de replicación (ejecutar en Master)

-- 1. Crear usuario dedicado para la sincronización de réplicas
-- ### RIESGO: Replicación Master-Slave asíncrona (puertos 3306 / 3307)
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED BY 'ReplSumaq2026Secure!';

-- 2. Otorgar privilegios mínimos requeridos por MySQL
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';

-- 3. Aplicar privilegios
FLUSH PRIVILEGES;

-- 4. Comando para consultar posición del log binario en Master:
-- SHOW MASTER STATUS;

-- Comandos para el servidor réplica (Slave)
-- Reemplazar MASTER_LOG_FILE y MASTER_LOG_POS con los valores de SHOW MASTER STATUS

/*
CHANGE MASTER TO
    MASTER_HOST = '127.0.0.1',
    MASTER_PORT = 3306,
    MASTER_USER = 'repl_user',
    MASTER_PASSWORD = 'ReplSumaq2026Secure!',
    MASTER_LOG_FILE = 'mysql-bin.000001',
    MASTER_LOG_POS = 154;

START SLAVE;

SHOW SLAVE STATUS\G;
*/
