# GUÍA DE REPLICACIÓN DE BASE DE DATOS - SUMAQ SPA

## 1. Tipo de Replicación y Justificación Técnica

Para el sistema **SUMAQ Spa & Centro de Bienestar**, se seleccionó la arquitectura de **Replicación Asíncrona Master-Slave (Source-Replica)** basada en el **Binary Log (Binlog en formato ROW)** de MySQL 8.0 / MariaDB 10.4.

### Justificación Técnica:
1. **Separación de Cargas (Read/Write Splitting):** Las operaciones transaccionales críticas que requieren bloqueos pesimistas (`select_for_update()`) como el motor de reservas (`/api/citas/reservar-web/`) y el descuento de inventario (`completar_cita()`) se dirigen al nodo **Master**. Las consultas intensivas de disponibilidad horaria (`/api/disponibilidad/`) y catálogo de servicios se pueden delegar al nodo **Replica**.
2. **Alta Disponibilidad y Respaldo en Caliente:** La réplica mantiene una copia sincronizada en tiempo real, permitiendo conmutación por error (Failover) con un RTO < 15 minutos ante fallo de hardware en el nodo principal.
3. **Cero Impacto en Latencia de Escritura:** La replicación asíncrona no bloquea los hilos de confirmación de transacciones en el Master.

---

## 2. Arquitectura y Flujo de Datos

```
┌────────────────────────────────────────────────────────┐
│               CLIENTES & FRONTEND REACT 19             │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS REST API)
┌───────────────────────────▼────────────────────────────┐
│              BACKEND DJANGO 5.1 / GUNICORN             │
└─────────────┬────────────────────────────▲─────────────┘
  (Escrituras)│                            │ (Lecturas Masivas)
              ▼                            │
┌───────────────────────────┐    ┌─────────┴─────────────┐
│       MYSQL MASTER        │    │     MYSQL REPLICA     │
│   (Server-ID: 1, Port 3306)│    │ (Server-ID: 2, Port 3307)
│     - Binary Log (ROW)    │───▶│   - Relay Log         │
│     - Base: sumaq_spa     │    │   - read_only = 1     │
└───────────────────────────┘    └───────────────────────┘
```

---

## 3. Procedimiento de Configuración Paso a Paso

### Paso 1: Configurar el Servidor Master en XAMPP
1. Abrir el archivo `C:\xampp\mysql\bin\my.ini`.
2. En la sección `[mysqld]`, agregar o verificar las siguientes directivas:
   ```ini
   server-id = 1
   log-bin = mysql-bin
   binlog_format = ROW
   binlog_do_db = sumaq_spa
   innodb_flush_log_at_trx_commit = 1
   sync_binlog = 1
   ```
3. Reiniciar el servicio MySQL desde el panel de control de XAMPP.

### Paso 2: Crear el Usuario de Replicación en el Master
Conectarse a MySQL mediante consola o phpMyAdmin y ejecutar:
```sql
CREATE USER 'repl_user'@'%' IDENTIFIED BY 'ReplSumaq2026Secure!';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%';
FLUSH PRIVILEGES;
```

### Paso 3: Tomar Snapshot y Consultar Coordenadas del Binlog
1. Bloquear tablas temporalmente para snapshot consistente:
   ```sql
   USE sumaq_spa;
   FLUSH TABLES WITH READ LOCK;
   SHOW MASTER STATUS;
   ```
2. Tomar nota de los valores devueltos (Ejemplo: `File: mysql-bin.000001`, `Position: 154`).
3. En otra terminal, exportar el dump inicial:
   ```bash
   mysqldump -u root -p sumaq_spa > sumaq_initial_replica.sql
   ```
4. Liberar el bloqueo en el Master:
   ```sql
   UNLOCK TABLES;
   ```

### Paso 4: Configurar e Inicializar el Servidor Réplica
1. En el nodo réplica, configurar `my.ini` / `my.cnf`:
   ```ini
   server-id = 2
   relay-log = mysql-relay-bin
   read_only = 1
   replicate_do_db = sumaq_spa
   ```
2. Importar el dump inicial en la réplica:
   ```bash
   mysql -u root -p -P 3307 sumaq_spa < sumaq_initial_replica.sql
   ```
3. Configurar los parámetros de conexión al Master:
   ```sql
   CHANGE MASTER TO
       MASTER_HOST = '127.0.0.1',
       MASTER_PORT = 3306,
       MASTER_USER = 'repl_user',
       MASTER_PASSWORD = 'ReplSumaq2026Secure!',
       MASTER_LOG_FILE = 'mysql-bin.000001',
       MASTER_LOG_POS = 154;

   START SLAVE;
   ```

---

## 4. Procedimiento de Verificación del Estado de Replicación

En el nodo Réplica, ejecutar:
```sql
SHOW SLAVE STATUS\G;
```

### Indicadores Clave de Éxito:
- `Slave_IO_Running: Yes` (El hilo de I/O está conectado y leyendo eventos del Master).
- `Slave_SQL_Running: Yes` (El hilo SQL está aplicando las transacciones en la réplica).
- `Seconds_Behind_Master: 0` (La réplica se encuentra completamente al día sin retraso).
- `Last_Error: ` (Debe estar vacío, sin códigos de error).

---

## 5. Procedimiento de Recuperación y Conmutación por Error (Failover)

En caso de caída irreversible del servidor Master:
1. **Detener Réplica y Promoverla a Nuevo Master:**
   ```sql
   STOP SLAVE;
   RESET SLAVE ALL;
   SET GLOBAL read_only = 0;
   ```
2. **Actualizar Configuración de Backend:**
   Cambiar la variable de entorno en `.env`:
   ```env
   DB_PORT=3307
   ```
3. **Reiniciar Backend:**
   ```bash
   python manage.py runserver 8000
   ```
4. El sistema reanuda operaciones completas de lectura y escritura en menos de 5 minutos.
