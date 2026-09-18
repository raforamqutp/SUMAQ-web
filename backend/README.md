# SUMAQ SPA & CENTRO DE BIENESTAR - BACKEND REST API

Solución backend empresarial de alta concurrencia desarrollada en **Python 3.13 + Django 5.1 + Django REST Framework (DRF)** para **Sumaq Spa & Centro de Bienestar**.

---

## 1. Arquitectura y Tecnologías

- **Framework Web:** Django 5.1 & Django REST Framework (DRF 3.15)
- **Base de Datos:** MySQL 8.0 / MariaDB 10.4 (InnoDB, `utf8mb4_unicode_ci`)
- **Conector DB:** PyMySQL con inicialización nativa
- **Autenticación:** JSON Web Tokens (`djangorestframework-simplejwt`)
- **Control de Acceso (RBAC):** Roles `ADMIN`, `RECEPCIONISTA`, `TERAPEUTA` y prevención Anti-IDOR
- **Concurrencia:** Bloqueos pesimistas (`select_for_update()`) en transacciones ACID
- **Reportes y Comprobantes:** ReportLab (Generación y streaming de PDF)
- **Testing:** Pytest & pytest-django

---

## 2. Requisitos Previos

- Python 3.10 o superior (Recomendado: Python 3.13)
- MySQL / MariaDB (vía XAMPP o standalone) en puerto 3306
- Git

---

## 3. Instalación y Puesta en Marcha

### Paso 1: Clonar y navegar al directorio
```bash
cd SUMAQ/backend
```

### Paso 2: Crear y activar entorno virtual (opcional pero recomendado)
```bash
python -m venv .venv
# En Windows:
.venv\Scripts\activate
# En Linux / macOS:
source .venv/bin/activate
```

### Paso 3: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 4: Configurar variables de entorno
Copiar `.env.example` a `.env` y verificar parámetros:
```bash
cp .env.example .env
```

### Paso 5: Iniciar MySQL en XAMPP y crear la base de datos
Asegurarse de que el servicio MySQL esté corriendo en XAMPP y ejecutar:
```bash
python init_db.py
```
O manualmente desde MySQL:
```sql
CREATE DATABASE sumaq_spa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Paso 6: Ejecutar migraciones y servidor de desarrollo
```bash
python manage.py migrate
python manage.py runserver 8000
```
La API quedará escuchando en `http://127.0.0.1:8000/api/`.

---

## 4. Credenciales de Demostración Iniciales

| Usuario | Correo | Contraseña | Rol |
|---|---|---|---|
| **Administrador** | `admin@sumaqspa.pe` | `AdminSumaq2026!` | `ADMIN` |
| **Recepcionista** | `recepcion@sumaqspa.pe` | `Sumaq2026!` | `RECEPCIONISTA` |
| **Terapeuta 1** | `elena.morales@sumaqspa.pe` | `Sumaq2026!` | `TERAPEUTA` (Cabina 1) |
| **Terapeuta 2** | `camila.vega@sumaqspa.pe` | `Sumaq2026!` | `TERAPEUTA` (Cabina 2) |
| **Terapeuta 3** | `lucia.ramos@sumaqspa.pe` | `Sumaq2026!` | `TERAPEUTA` (Cabina 3) |

---

## 5. Ejecución de la Suite de Pruebas

Para ejecutar las pruebas unitarias, de concurrencia y seguridad:
```bash
pytest
```

---

## 6. Estructura de Paquetes (`apps/`)

```
backend/
├── apps/
│   ├── common/       # Permisos, Excepciones, PDF ReportLab, Health Check
│   ├── accounts/     # Usuario Custom, Autenticación JWT y Roles RBAC
│   ├── clients/      # Clientes identificados por DNI
│   ├── cabins/       # Cabinas físicas temáticas (1, 2, 3)
│   ├── therapists/   # Terapeutas y Agenda Personalizada
│   ├── services/     # Servicios y Recetas de Insumos (BOM)
│   ├── inventory/    # Productos, Alertas de Stock y Kárdex
│   ├── marketing/    # Promociones y Cupones de Descuento
│   ├── appointments/ # Motor de Citas, Bloqueo Pesimista y Autogestión 24h
│   ├── attention/    # Fichas Clínicas y Descuento Automático de Stock
│   └── finance/      # Caja, Dashboard de KPIs y Reportes Financieros
├── config/           # Settings, URLs, WSGI
├── database/         # Scripts DDL y DML para MySQL
├── replication/      # Configuración y Guía de Replicación Master-Slave
├── admin_tools/      # Scripts de Backup, Restauración y Monitor de BD
└── tests/            # Suite de pruebas automatizadas Pytest
```
