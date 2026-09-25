# SUMAQ SPA & Centro de Bienestar

Sistema integral de gestión de reservas, cabinas, agenda de terapeutas, kárdex de insumos y punto de venta para **SUMAQ SPA**.

---

## Estructura del Repositorio

- **`frontend/`**: Aplicación SPA construida con React 19, TypeScript y Vite. Contiene el portal público de reservas, panel de terapeuta y panel de administración.
- **`backend/`**: API REST desarrollada con Django 5 y Django REST Framework, autenticación JWT, reportes financieros y gestión transaccional.
- **`database/`**: Esquema relacional DDL (`01_schema.sql`), datos semilla (`02_seed_data.sql`) y volcado completo (`03_sumaq_spa_full_dump.sql`).
- **`admin_tools/`**: Herramientas operativas de monitoreo de rendimiento InnoDB y scripts de backup y restore transaccional.

---

## Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
- **Python 3.10+** (con pip)
- **Node.js 18+ LTS**
- **MySQL 8.0 / MariaDB** (vía XAMPP o MySQL Workbench / Server) o **SQLite**

### 2. Configurar Variables de Entorno
Copia la plantilla `.env.example` en `backend/.env`:
```bash
copy backend\.env.example backend\.env
```
- **Si usas XAMPP**: Deja `DB_PASSWORD=` vacío.
- **Si usas MySQL Workbench / Server standalone**: Configura tu clave en `DB_PASSWORD=tu_contraseña`.
- **Si prefieres trabajar con SQLite**: Configura `DB_ENGINE=sqlite`.

### 3. Ejecutar el Proyecto
- **Lanzador Integral (Frontend + Backend + DB)**:
  ```cmd
  ejecutar_todo.bat
  ```
- **Solo Backend**:
  ```cmd
  ejecutar_backend.bat
  ```
- **Solo Frontend**:
  ```cmd
  ejecutar_frontend.bat
  ```

---

## Accesos y Credenciales de Demostración

- **Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
- **Healthcheck**: [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin@sumaqspa.pe` | `AdminSumaq2026!` |
| Recepción | `recepcion@sumaqspa.pe` | `Sumaq2026!` |
| Terapeuta | `elena.morales@sumaqspa.pe` | `Sumaq2026!` |
