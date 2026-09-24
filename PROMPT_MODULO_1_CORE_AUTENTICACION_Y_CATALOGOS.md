# GUÍA DE DESARROLLO — MÓDULO 1: ARQUITECTURA BASE, AUTENTICACIÓN Y CATÁLOGOS
**Sistema:** SUMAQ Spa & Centro de Bienestar — Plataforma Web Integral
**Rama de Trabajo:** `feature/backend-core-autenticacion-catalogos`
**Objetivo:** Implementar los cimientos de la arquitectura backend con Django REST Framework, conexión a MySQL (XAMPP), sistema de usuarios con roles y autenticación JWT, entidades de catálogo (Clientes, Cabinas, Terapeutas, Servicios, Promociones) y el motor de disponibilidad de citas con franjas horarias fijas.

---

## 1. Contexto del Negocio y Arquitectura
La plataforma de **SUMAQ Spa** requiere una capa backend desacoplada, moderna y robusta para abastecer el frontend interactivo en React/TypeScript (`frontend/`).
Este primer avance establece la infraestructura base, el esquema relacional en Tercera Forma Normal (3FN), la seguridad de usuarios basada en roles (RBAC) y la consulta pública de disponibilidad y catálogos.

---

## 2. Flujo de Trabajo en Git

```bash
# 1. Ubicarse en el directorio raíz del proyecto SUMAQ
cd d:\Projects\Antigravity-projects\SUMAQ

# 2. Crear y cambiar a la rama de la funcionalidad
git checkout -b feature/backend-core-autenticacion-catalogos

# 3. Validar estado limpio de la rama
git status
```

---

## 3. Especificaciones Técnicas y Entregables

### 3.1. Estructura Modular de la Carpeta `backend/`

```text
backend/
├── config/
│   ├── __init__.py           # Activación de PyMySQL como driver MySQLdb
│   ├── settings.py           # Configuración Django, SimpleJWT, CORS, Base de Datos dinámica
│   ├── urls.py               # Enrutador central /api/
│   └── wsgi.py
├── apps/
│   ├── common/               # Excepciones personalizadas, permisos RBAC, autenticación y health
│   │   ├── exceptions.py
│   │   ├── permissions.py
│   │   ├── authentication.py
│   │   └── health.py
│   ├── accounts/             # Usuarios y Roles (ADMIN, RECEPCIONISTA, TERAPEUTA)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── clients/              # Clientes con DNI único indexado
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── cabins/               # 3 Cabinas físicas de atención
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── therapists/           # Terapeutas vinculados a Usuarios y Cabinas
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── services/             # Catálogo de Servicios y Recetas BOM
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── marketing/            # Promociones y cupones de descuento
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   └── appointments/         # Motor de Disponibilidad de Horarios
│       ├── models.py
│       ├── services.py       # DisponibilidadService (9 slots: 08:00 - 17:00)
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
├── database/
│   ├── 01_schema.sql         # Script DDL MySQL InnoDB en 3FN
│   ├── 02_seed_data.sql       # Script DML con datos de prueba sincronizados con Frontend
│   └── init_db.py            # Ejecutable de inicialización y migraciones automáticas
├── tests/
│   ├── test_auth.py          # Pruebas de autenticación JWT y roles
│   ├── test_health.py        # Prueba de endpoint de salud
│   └── test_availability.py  # Prueba de cálculo de horarios y colisiones
├── .env.example
├── .env
├── manage.py
├── pytest.ini
└── requirements.txt
```

---

### 3.2. Dependencias Principales (`requirements.txt`)
```text
Django>=5.1.0,<5.2.0
djangorestframework>=3.15.0
djangorestframework-simplejwt>=5.3.0
django-cors-headers>=4.4.0
PyMySQL>=1.1.0
python-dotenv>=1.0.0
reportlab>=4.2.0
pytest>=8.0.0
pytest-django>=4.8.0
```

---

### 3.3. Configuración y Conexión de Base de Datos
1. **Driver MySQL:** En `config/__init__.py`:
   ```python
   import pymysql
   pymysql.install_as_MySQLdb()
   ```
2. **Entornos de Base de Datos:**
   * En ejecución local/desarrollo: Conexión directa a MySQL (XAMPP `localhost:3306`, BD `sumaq_spa_db`, collation `utf8mb4_unicode_ci`).
   * En ejecución de pruebas (`pytest`): Base de datos SQLite en memoria `:memory:` para pruebas veloces e independientes de XAMPP.
3. **Seguridad y CORS:** Permitir `http://localhost:5173` y orígenes locales de desarrollo.
4. **SimpleJWT:** Configuración de Access Token y Refresh Token con claims de rol (`ADMIN`, `RECEPCIONISTA`, `TERAPEUTA`).

---

### 3.4. Endpoints y Modelos Clave del Módulo 1

* **Autenticación:**
  * `POST /api/auth/login/`: Inicio de sesión con retorno de token y datos de usuario.
  * `GET /api/auth/me/`: Obtención del usuario autenticado en sesión.
  * `GET/POST/PUT/DELETE /api/usuarios/`: Gestión administrativa de usuarios (RBAC: Admin).
* **Catálogos Públicos y Administrativos:**
  * `GET/POST /api/clientes/`: Registro y consulta de clientes por DNI.
  * `GET /api/cabinas/`: Lista pública de cabinas activas.
  * `GET /api/terapeutas/`: Directorio de terapeutas con su cabina y especialidad.
  * `GET /api/servicios/`: Catálogo público de servicios y precios.
  * `GET /api/promociones/activas/`: Promociones y cupones vigentes.
* **Motor de Disponibilidad de Horarios:**
  * `GET /api/citas/disponibilidad/?fecha=YYYY-MM-DD&servicio_id=X&terapeuta_id=Y`: Retorna los 9 slots horarios diarios (08:00 a 17:00) verificando no colisión con citas reservadas ni con ocupación de cabinas.

---

## 4. Validación de Calidad y Pruebas
Ejecutar las pruebas unitarias y de integración del módulo:

```bash
pytest backend/tests/test_auth.py backend/tests/test_health.py -v
```

Criterios de Aceptación:
1. Autenticación exitosa con credenciales válidas y generación de tokens JWT.
2. Rechazo de credenciales inválidas con código 401.
3. Endpoint `/api/health/` respondiendo estado operativo y conexión a BD activa.
4. Ejecución sin errores de `python backend/manage.py migrate`.

---

## 5. Cierre y Preparación de la Entrega
```bash
git add backend/ database/
git commit -m "feat(backend): implementar arquitectura base, autenticacion jwt, catalogos y motor de disponibilidad"
```
