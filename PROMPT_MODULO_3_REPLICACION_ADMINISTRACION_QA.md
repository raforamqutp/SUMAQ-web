# GUÍA DE DESARROLLO — MÓDULO 3: REPLICACIÓN DE BASE DE DATOS, ADMINISTRACIÓN Y QA
**Sistema:** SUMAQ Spa & Centro de Bienestar — Plataforma Web Integral
**Rama de Trabajo:** `feature/backend-replicacion-administracion-qa`
**Rama Base:** `feature/backend-gestion-citas-inventario-finanzas` (o `main` tras integrar los módulos anteriores)
**Objetivo:** Implementar la arquitectura de Replicación Master-Slave en MySQL (XAMPP), scripts automatizados de Administración de Base de Datos (Estrategia 3-2-1 de Backups, Restauración segura y Monitoreo de salud en tiempo real), auditoría de seguridad RBAC/Anti-IDOR, ejecución de la suite completa de 18 pruebas automatizadas de QA y documentación exhaustiva de despliegue.

---

## 1. Contexto del Negocio y Pilares Operativos
Con los modelos base (Módulo 1) y el motor transaccional de negocio (Módulo 2) ya desarrollados, este módulo se enfoca en **Alta Disponibilidad**, **Resiliencia ante Desastres**, **Seguridad y Auditoría** de la base de datos MySQL, además de garantizar la calidad total del software antes de su puesta en producción.

### Pilares Obligatorios de Entrega:
1. **Replicación Master-Slave en MySQL (XAMPP):** Habilitar binary logging en modo `ROW`, plantillas de configuración `my.ini` para Master y Slave, script SQL de sincronización y guía de conmutación ante fallos (*Failover*).
2. **Administración y Mantenimiento de BD:** Scripts automatizados multiplataforma (`.bat` para Windows y `.sh` para Linux) para copias de seguridad con retención de 7 días, script interactivo de restauración segura y herramienta en Python para monitoreo de métricas InnoDB y salud de tablas.
3. **Auditoría de Seguridad y RBAC (Anti-IDOR):** Garantizar que usuarios con rol `TERAPEUTA` o anónimos no puedan acceder a datos privados ni a endpoints reservados para `ADMIN`.
4. **Garantía de Calidad (QA):** Ejecutar y certificar la suite de 18 pruebas automatizadas con 100% de éxito.

---

## 2. Flujo de Trabajo en Git

```bash
# 1. Ubicarse en el proyecto
cd d:\Projects\Antigravity-projects\SUMAQ

# 2. Asegurarse de tener la rama base actualizada
git checkout feature/backend-gestion-citas-inventario-finanzas
git pull origin feature/backend-gestion-citas-inventario-finanzas

# 3. Crear la rama de trabajo para el Módulo 3
git checkout -b feature/backend-replicacion-administracion-qa

# 4. Validar el estado de la rama
git status
```

---

## 3. Especificaciones Técnicas y Entregables

### 3.1. Arquitectura de Replicación Master-Slave (`replication/`)

```text
replication/
├── master_my.ini            # Parámetros para el nodo Master (XAMPP)
├── slave_my.ini             # Parámetros para el nodo Slave (XAMPP)
├── setup_replication.sql    # Comandos SQL de creación de usuario y sincronización
└── REPLICACION_GUIA.md      # Manual técnico detallado con protocolo de Failover
```

* **Master (`master_my.ini`):** `server-id = 1`, `log-bin = mysql-bin`, `binlog_format = ROW`, `binlog_do_db = sumaq_spa_db`, `expire_logs_days = 7`.
* **Slave (`slave_my.ini`):** `server-id = 2`, `relay-log = mysql-relay-bin`, `replicate-do-db = sumaq_spa_db`, `read_only = 1`.
* **Script de Sincronización (`setup_replication.sql`):** Creación del usuario `sumaq_repl`, asignación de privilegios `REPLICATION SLAVE`, captura de coordenadas (`SHOW MASTER STATUS`) y vinculación en el Slave (`CHANGE MASTER TO ...`).
* **Manual de Replicación (`REPLICACION_GUIA.md`):** Configuración en puertos 3306 y 3307 en XAMPP, monitoreo de latencia (`Seconds_Behind_Master`) y procedimiento de promoción del nodo réplica en caso de caída del primario.

---

### 3.2. Herramientas de Administración y Mantenimiento (`admin_tools/`)

```text
admin_tools/
├── backup_db.bat            # Script de backup para Windows (mysqldump + compresión + retención 7d)
├── backup_db.sh             # Script de backup para Linux/macOS
├── restore_db.bat           # Script de restauración interactiva con confirmación de seguridad
├── restore_db.sh            # Script de restauración para Linux/macOS
├── monitor_db.py            # Monitor en tiempo real de salud, métricas InnoDB y alertas
└── ADMINISTRACION_BD.md     # Manual de administración, estrategia 3-2-1 y política de privilegios
```

* **Monitor en Tiempo Real (`monitor_db.py`):**
  * Medición de latencia de consulta (Ping DB en ms).
  * Tasa de aciertos de lectura en memoria del *InnoDB Buffer Pool* (Meta: > 99%).
  * Conteo de filas y tamaño en disco (MB) de cada tabla de `sumaq_spa_db`.
  * Verificación de integridad estructural mediante `CHECK TABLE`.
  * Emisión de alertas ante stock crítico o anomalías.
* **Manual de Administración (`ADMINISTRACION_BD.md`):**
  * Estrategia de respaldos 3-2-1 (3 copias, 2 medios distintos, 1 copia externa).
  * Principio de privilegios mínimos en BD (`sumaq_app`, `sumaq_admin`, `sumaq_repl`, `sumaq_backup`).
  * Rutinas de optimización (`OPTIMIZE TABLE`) y purga de logs binarios.

---

### 3.3. Suite de Seguridad RBAC y QA Integral (`backend/tests/`)
* Implementar y certificar las siguientes pruebas:
  * `test_rbac_security.py`: Bloqueo de acceso no autorizado a datos de otros terapeutas (Anti-IDOR) y endpoints de administración.
  * Suite completa: `test_auth.py`, `test_appointments.py`, `test_concurrency.py`, `test_inventory_attention.py`, `test_finance_dashboard.py`, `test_pdf.py`, `test_health.py` y `test_rbac_security.py`.

---

### 3.4. Manuales de Despliegue y Configuración
* **`backend/README.md`:** Resumen técnico de la arquitectura, dependencias y endpoints REST.
* **`backend/MANUAL_INSTALACION_Y_CONFIGURACION.md`:** Manual paso a paso para levantar el backend en XAMPP, ejecutar migraciones, cargar datos de prueba e iniciar el servidor.

---

## 4. Validación de Calidad (QA Total)
Ejecutar la suite completa de 18 pruebas automatizadas:

```bash
pytest backend/tests/ -v --tb=short
```

**Resultado Requerido:** `18 passed in X.XXs` (100% de éxito, 0 fallos).

---

## 5. Proceso de Integración Final y Cierre de Release
Una vez validado todo el ecosistema:

```bash
# 1. Realizar commit en la rama del Módulo 3
git add admin_tools/ replication/ backend/
git commit -m "feat(ops-qa): implementar replicacion master-slave, herramientas de administracion de BD, pruebas de seguridad y manuales"

# 2. Integrar a la rama principal (main)
git checkout main
git pull origin main

# Fusionar secuencialmente los módulos
git merge --no-ff feature/backend-core-autenticacion-catalogos -m "merge: integrar Modulo 1 (Core y Catalogos)"
git merge --no-ff feature/backend-gestion-citas-inventario-finanzas -m "merge: integrar Modulo 2 (Citas, Inventario y Finanzas)"
git merge --no-ff feature/backend-replicacion-administracion-qa -m "merge: integrar Modulo 3 (Replicacion, Administracion y QA)"

# 3. Etiquetar la versión oficial
git tag -a v1.0.0 -m "Release v1.0.0: SUMAQ Spa Backend Integral con Replicacion y Administracion de BD"
git push origin main --tags
```
