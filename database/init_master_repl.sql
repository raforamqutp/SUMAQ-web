-- ==============================================================================
-- INICIALIZACIÓN DE USUARIO DE RÉPLICA EN EL MASTER DOCKER
-- ==============================================================================
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED WITH mysql_native_password BY 'ReplSumaq2026Secure!';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';
FLUSH PRIVILEGES;
