# Base de Datos SUMAQ SPA & Centro de Bienestar

Este directorio contiene los esquemas, datos semilla y volcado completo de la base de datos MySQL / MariaDB para el sistema **SUMAQ SPA**.

---

## Archivos Disponibles

1. **`01_schema.sql`**: Esquema DDL completo con las 13 tablas relacionales en InnoDB, codificación `utf8mb4_unicode_ci`, restricciones de integridad (`ON DELETE RESTRICT` / `CASCADE`), índices y claves foráneas.
2. **`02_seed_data.sql`**: Catálogo base institucional (usuarios con contraseñas PBKDF2 hash, cabinas temáticas, terapeutas especializadas, insumos con costos y stock, servicios con recetas BOM y promociones vigentes).
3. **`03_sumaq_spa_full_dump.sql`**: Volcado completo (estructura + datos) exportado directamente desde el servidor MySQL, incluyendo:
   - 5 cuentas de usuario institucionales (Admin, Recepción, 3 Terapeutas).
   - 3 Cabinas y 3 Terapeutas asignadas.
   - 5 Insumos de almacén con kárdex valorizado.
   - 3 Servicios principales y recetas (BOM).
   - 2 Promociones / cupones de descuento.
   - 9 Clientes registrados.
   - 24 Citas (citas del día pendientes y atendidas, cita demo `SQ-20260825-7281` para sustento, y 12 citas históricas para reportes).
   - Fichas clínicas confidenciales de atención.
   - Asientos de libro diario en Caja y movimientos de Kárdex.

---

## Instrucciones de Restauración / Importación

### Opción A: Desde consola MySQL / MariaDB
```bash
mysql -u root -p < database/03_sumaq_spa_full_dump.sql
```

### Opción B: Ejecución paso a paso
```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_seed_data.sql
```

### Opción C: Inicializador automático de Django
```bash
python backend/init_db.py
```
