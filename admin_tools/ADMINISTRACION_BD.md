# MANUAL DE ADMINISTRACIÓN, SEGURIDAD Y MANTENIMIENTO DE BASE DE DATOS — SUMAQ SPA

Este documento describe la arquitectura operativa de administración de la base de datos MySQL / MariaDB para el sistema **SUMAQ Spa & Centro de Bienestar**.

---

## 1. Gestión de Backups (Estrategia 3-2-1)

El sistema implementa una política formal de resiliencia y copias de seguridad basada en el estándar industrial **3-2-1**:
- **3 Copias de los datos:** Datos en producción (nodo Master), Réplica en caliente (nodo Slave) y respaldos históricos en frío.
- **2 Medios distintos:** Almacenamiento local en disco NVMe y archivo comprimido en repositorio secundario.
- **1 Copia fuera del sitio (Offsite):** Volcado sincronizado en almacenamiento cloud seguro o servidor de contingencia.

### Herramientas y Rutinas Implementadas:
1. **Volcado Inicial Completo:** [database/03_sumaq_spa_full_dump.sql](file:///d:/Projects/SUMAQ/database/03_sumaq_spa_full_dump.sql) (estructura DDL, constraints, triggers y 24 citas de prueba).
2. **Generador Automatizado de Respaldos:** [admin_tools/backup_db.bat](file:///d:/Projects/SUMAQ/admin_tools/backup_db.bat). Ejecuta `mysqldump` con los flags de máxima consistencia transaccional InnoDB:
   ```bash
   mysqldump -h 127.0.0.1 -P 3306 -u root --single-transaction --quick --routines --triggers --hex-blob sumaq_spa > backup_sumaq_spa_YYYYMMDD_HHMMSS.sql
   ```
   Incluye purga automática de respaldos con antigüedad superior a 7 días.
3. **Restaurador Seguro:** [admin_tools/restore_db.bat](file:///d:/Projects/SUMAQ/admin_tools/restore_db.bat).
4. **Semillero Idempotente:** [backend/init_db.py](file:///d:/Projects/SUMAQ/backend/init_db.py). Permite recrear y repoblar la base de datos en cualquier momento desde cero.

---

## 2. Seguridad de Base de Datos y Aplicación

### A. Almacenamiento Seguro de Credenciales (Hashing)
- Ninguna contraseña se almacena en texto plano.
- Se utiliza el algoritmo **PBKDF2 con salt criptográfico y hashing SHA-256** (estándar NIST implementado por Django), con un factor de trabajo de más de 600,000 iteraciones.

### B. Control de Acceso Basado en Roles (RBAC) y Anti-IDOR
Implementado a nivel de vista y objeto en [backend/apps/common/permissions.py](file:///d:/Projects/SUMAQ/backend/apps/common/permissions.py):
- **`IsAdminUserRole`:** Reservado para administradores generales. Da acceso a reportes financieros, kardex de insumos, auditoría de usuarios y parametrización de cabinas.
- **`IsTherapistUserRole`:** Limita las acciones al módulo asistencial.
- **`IsAssignedTherapistOrAdmin` (Protección Anti-IDOR):** Valida que una terapeuta solo pueda visualizar o editar las fichas clínicas (`fichas_atencion`) y citas que le fueron explícitamente asignadas. Se previene la vulnerabilidad de referencia directa insegura a objetos (*Insecure Direct Object Reference*).
- Esta regla está certificada mediante pruebas unitarias en [backend/tests/test_rbac_security.py](file:///d:/Projects/SUMAQ/backend/tests/test_rbac_security.py).

### C. Prevención de Inyección SQL (SQLi)
- Todas las consultas se canalizan a través del ORM de Django con sentencias preparadas y parametrización estricta de variables.
- Queda prohibida la concatenación directa de cadenas en sentencias SQL.

### D. Tokens de Sesión Stateless (JWT)
- Autenticación mediante **JSON Web Tokens (Simple JWT)** firmados con clave HMAC-SHA256 (`SECRET_KEY`).
- Token de acceso con expiración corta (120 minutos) y token de refresco (7 días).

### E. Principio de Mínimo Privilegio (DB Users)
Para entornos de producción se definen los siguientes perfiles de usuario en MySQL:
- `sumaq_app`: Permisos `SELECT, INSERT, UPDATE, DELETE` sobre `sumaq_spa.*`.
- `sumaq_admin`: Permisos DDL completos para migraciones de Django (`ALTER, CREATE, DROP, INDEX, REFERENCES`).
- `repl_user`: Permisos exclusivos `REPLICATION SLAVE, REPLICATION CLIENT` para replicación.
- `sumaq_backup`: Permisos `SELECT, RELOAD, LOCK TABLES, SHOW VIEW` para respaldos sin acceso de modificación.

---

## 3. Monitoreo, Control y Mantenimiento

### A. Endpoint de Salud y Telemetría en Tiempo Real
- **Ruta:** `GET /api/health/` implementado en [backend/apps/common/health.py](file:///d:/Projects/SUMAQ/backend/apps/common/health.py).
- **Funcionamiento:** Ejecuta un `SELECT 1;` contra el motor MySQL midiendo la latencia de respuesta en milisegundos (`database_latency_ms`). Si la base de datos se desconecta, responde HTTP 503 Service Unavailable alertando al balanceador de carga.

### B. Script de Monitoreo de Rendimiento
- **Archivo:** [admin_tools/monitor_db.py](file:///d:/Projects/SUMAQ/admin_tools/monitor_db.py).
- **Métricas Inspeccionadas:**
  1. Latencia de conexión en milisegundos.
  2. Ratio de aciertos de memoria del motor **InnoDB Buffer Pool** (`Innodb_buffer_pool_read_requests` vs `Innodb_buffer_pool_reads`). Meta: > 99%.
  3. Tamaño de cada tabla en disco (KB/MB) y número de registros en `information_schema.TABLES`.
  4. Verificación de integridad estructural (`CHECK TABLE`).
  5. Alerta temprana de stock crítico de insumos según recetas técnicas BOM.

### C. Control de Concurrencia y Transacciones Atómicas
- En el motor de reservas (`/api/citas/reservar-web/`) y en la finalización de citas con descuento de inventario (`/api/terapeuta/citas/<id>/completar/`), se utiliza:
  - `@transaction.atomic` para garantizar atomicidad ACID.
  - Bloqueo pesimista `select_for_update()` a nivel de fila en la tabla `citas` y `productos`, impidiendo sobre-agendamientos simultáneos en la misma cabina/horario (Anti-Double Booking) y saldos negativos de inventario.

---

## 4. Replicación Master-Slave y Monitoreo en Tiempo Real (Puertos 3306 y 3307)

### A. Arquitectura
- **Nodo Master (Source):** `127.0.0.1:3306` (Server-ID: 1, `read_only = OFF`). Procesa todas las transacciones `INSERT/UPDATE/DELETE` y escribe en el Binary Log (`ROW`).
- **Nodo Slave (Replica):** `127.0.0.1:3307` (Server-ID: 2, `read_only = ON`). Recibe los eventos del Binlog mediante el hilo I/O y los aplica con el hilo SQL en el Relay Log, absorbiendo consultas de lectura `SELECT`.

### B. Herramientas de Monitoreo y Demostración en Terminal
- **Script Principal:** [admin_tools/monitor_replication.py](file:///d:/Projects/SUMAQ/admin_tools/monitor_replication.py)
- **Lanzador Directo:** [admin_tools/monitor_replicacion.bat](file:///d:/Projects/SUMAQ/admin_tools/monitor_replicacion.bat)

#### Modos de Demostración:
1. **`python admin_tools/monitor_replication.py --live`** (o tecla `[1]`): Tablero de telemetría en tiempo real que refresca cada 1 segundo mostrando estado de sockets, QPS de Master vs Slave, hilos I/O y SQL (`Yes/Yes`), lag de sincronización (0s) y procesos activos.
2. **`python admin_tools/monitor_replication.py --demo`** (o tecla `[2]`): Demostración transaccional que inserta un registro en el Master (3306), muestra el avance del Binlog y comprueba la replicación instantánea (< 2ms) en el Slave (3307).
3. **`python admin_tools/monitor_replication.py --split`** (o tecla `[3]`): Simulación de enrutamiento de carga (Read/Write Splitting).
4. **`python admin_tools/monitor_replication.py --check`** (o tecla `[4]`): Diagnóstico rápido de conectividad y estado de replicación.

