# MANUAL DE ADMINISTRACIÓN, SEGURIDAD Y MANTENIMIENTO DE BASE DE DATOS - SUMAQ SPA

## 1. Políticas de Seguridad y Privilegios Mínimos

Para entornos de producción y despliegue formal, se prohíbe el uso del usuario `root` de MySQL para la aplicación web. Se establecen los siguientes roles de base de datos con mínimos privilegios:

### A. Usuario Operativo de la Aplicación (`sumaq_app`)
Solo posee permisos DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) y ejecución de transacciones sobre el esquema `sumaq_spa`:
```sql
CREATE USER 'sumaq_app'@'localhost' IDENTIFIED BY 'AppSumaq2026SecurePass!';
GRANT SELECT, INSERT, UPDATE, DELETE ON sumaq_spa.* TO 'sumaq_app'@'localhost';
FLUSH PRIVILEGES;
```

### B. Usuario de Reportes y Solo Lectura (`sumaq_readonly`)
Utilizado para conexiones de herramientas BI, réplicas o auditoría externa:
```sql
CREATE USER 'sumaq_readonly'@'localhost' IDENTIFIED BY 'ReadOnlySumaq2026!';
GRANT SELECT ON sumaq_spa.* TO 'sumaq_readonly'@'localhost';
FLUSH PRIVILEGES;
```

### C. Protección de Secretos y Variables de Entorno
- Las credenciales nunca se colocan en texto plano en el repositorio.
- Se configuran mediante el archivo `backend/.env` protegido por `.gitignore`.
- Contraseñas de usuario interno cifradas mediante hash `PBKDF2-SHA256` con salt dinámico de 870,000 iteraciones en Django.

---

## 2. Prevención de SQL Injection y OWASP

- **Parametrización Obligatoria:** Todas las consultas se canalizan a través del ORM de Django o consultas preparadas (`cursor.execute(sql, [params])`).
- **Validación Estricta de DTOs:** Los serializers de Django REST Framework validan tipos de datos, longitudes y formatos antes de invocar la capa de persistencia.
- **Transacciones Aisladas:** Uso de `transaction.atomic()` y `select_for_update()` para evitar condiciones de carrera en reservas y kárdex.

---

## 3. Plan de Respaldo y Recuperación (Regla 3-2-1)

| Copia | Destino | Frecuencia | Tipo |
|---|---|---|---|
| **Copia 1 (Primaria)** | Base de datos MySQL activa en servidor | Tiempo real | Transaccional InnoDB |
| **Copia 2 (Local)** | Disco local comprimido (`backups/sumaq_spa_backup_*.sql.gz`) | Diario (02:00 AM) | Lógico completo (`mysqldump`) |
| **Copia 3 (Nube/Offsite)** | Almacenamiento seguro externo (AWS S3 / Azure Blob) | Diario (04:00 AM) | Cifrado AES-256 |

### Ejecución de Copias de Seguridad:
- **En Windows:**
  ```cmd
  cd backend\admin_tools
  backup_db.bat
  ```
- **En Linux / macOS:**
  ```bash
  cd backend/admin_tools
  chmod +x backup_db.sh
  ./backup_db.sh
  ```

### Procedimiento de Restauración:
- **En Windows:**
  ```cmd
  restore_db.bat backups\sumaq_spa_backup_20260426_120000.sql
  ```
- **En Linux / macOS:**
  ```bash
  ./restore_db.sh backups/sumaq_spa_backup_20260426_120000.sql.gz
  ```

---

## 4. Monitoreo y Mantenimiento Preventivo

### Script de Diagnóstico en Tiempo Real:
Ejecutar periódicamente para revisar latencia, conexiones activas, tamaño de tablas e integridad:
```bash
python backend/admin_tools/monitor_db.py
```

### Mantenimiento Mensual de Índices y Espacio:
Ejecutar durante la ventana de mantenimiento nocturno:
```sql
USE sumaq_spa;
OPTIMIZE TABLE citas;
OPTIMIZE TABLE movimientos_inventario;
OPTIMIZE TABLE movimientos_caja;
ANALYZE TABLE citas;
```
