# MANUAL DE INSTALACIÓN, CONFIGURACIÓN Y DESPLIEGUE - SUMAQ SPA

Esta guía detalla los pasos para levantar el entorno de desarrollo local de forma homogénea para todo el equipo, soportando **XAMPP**, **MySQL Workbench / Server standalone** y **SQLite**.

---

## 1. Requerimientos del Sistema

| Componente | Requisito Mínimo | Versión Recomendada |
|---|---|---|
| **Sistema Operativo** | Windows 10/11, Ubuntu 22.04 LTS, macOS 12+ | Windows 11 / Ubuntu 24.04 |
| **Python** | 3.10+ | Python 3.12+ o 3.13 |
| **Node.js** | 18+ LTS | Node.js 20 LTS o superior |
| **Base de Datos** | MySQL 8.0, MariaDB 10.4 o SQLite | XAMPP 8.2, MySQL Workbench / Server 8.0 o SQLite |
| **Memoria RAM** | 2 GB | 4 GB o superior |
| **Espacio en Disco** | 500 MB libres | 2 GB libres |

---

## 2. Configuración de Base de Datos y Variables de Entorno (`.env`)

Copia el archivo de plantilla a tu entorno:
```bash
copy backend\.env.example backend\.env
```

Abre `backend/.env` y ajusta según tu entorno local:

### Opción A: Desarrolladores con XAMPP (por defecto)
XAMPP por defecto utiliza el usuario `root` sin contraseña en el puerto `3306`:
```env
# Configuración Django
SECRET_KEY=sumaq-spa-insecure-secret-key-development-2026-prod-ready
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Conexión MySQL XAMPP
DB_ENGINE=mysql
DB_NAME=sumaq_spa
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306

# Integración Frontend CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000

# Tokens JWT
JWT_ACCESS_MINUTES=120
JWT_REFRESH_DAYS=7
```

### Opción B: Desarrolladores con MySQL Workbench / MySQL Server standalone
Si instalaste MySQL con contraseña para el usuario `root`:
```env
DB_ENGINE=mysql
DB_NAME=sumaq_spa
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Opción C: Desarrollo Rápido con SQLite (Sin instalar MySQL)
Si trabajas en frontend o deseas probar el backend sin levantar un servicio MySQL:
```env
DB_ENGINE=sqlite
```

---

## 3. Formas de Lanzamiento Rápido (Windows)

### Método 1: Lanzador Integral (Frontend + Backend + DB)
Ejecuta en la raíz del proyecto:
```cmd
ejecutar_todo.bat
```
Este script:
1. Detecta o inicia el servicio MySQL (compatible con XAMPP y MySQL standalone).
2. Valida el entorno virtual `.venv`.
3. Sincroniza la base de datos y migraciones (`python backend/init_db.py`).
4. Inicia la API Django en `http://127.0.0.1:8000/api/`.
5. Inicia el Frontend Vite en `http://localhost:5173/` y lo abre en el navegador.

### Método 2: Solo Backend
Ejecuta en la raíz del proyecto:
```cmd
ejecutar_backend.bat
```
O directamente desde la carpeta `backend/`:
```cmd
start_backend.bat
```

### Método 3: Solo Frontend
Ejecuta en la raíz del proyecto:
```cmd
ejecutar_frontend.bat
```

---

## 4. Instalación y Ejecución Manual

### Paso 1: Dependencias de Backend
```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Paso 2: Inicialización de Base de Datos y Catálogos
```cmd
python init_db.py
```
El script creará automáticamente la base de datos `sumaq_spa` si no existe, aplicará las migraciones (`makemigrations` y `migrate`) y cargará la semilla inicial completa (usuarios, cabinas, terapeutas, productos, servicios y citas de prueba).

### Paso 3: Iniciar Servidor Backend
```cmd
python manage.py runserver 127.0.0.1:8000
```
La API estará disponible en `http://127.0.0.1:8000/api/`.

Comprobar el estado del servicio:
```cmd
curl http://127.0.0.1:8000/api/health/
```

### Paso 4: Iniciar Servidor Frontend
```cmd
cd ../frontend
npm install
npm run dev
```

---

## 5. Credenciales de Prueba

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador** | `admin@sumaqspa.pe` | `AdminSumaq2026!` |
| **Recepcionista** | `recepcion@sumaqspa.pe` | `Sumaq2026!` |
| **Terapeuta 1** | `elena.morales@sumaqspa.pe` | `Sumaq2026!` |
| **Terapeuta 2** | `camila.vega@sumaqspa.pe` | `Sumaq2026!` |
| **Terapeuta 3** | `lucia.ramos@sumaqspa.pe` | `Sumaq2026!` |

---

## 6. Pruebas Automatizadas

Para validar la integridad de la API y lógica de negocio:
```bash
pytest backend/tests/ -v
```
Todas las 18 pruebas unitarias, de concurrencia (`test_concurrency.py`), kárdex (`test_inventory_attention.py`), RBAC (`test_rbac_security.py`) y generación PDF (`test_pdf.py`) deben finalizar con estado **PASSED**.

---

## 7. Solución de Problemas Frecuentes (Troubleshooting)

### Error: `Can't connect to MySQL server on '127.0.0.1'`
- **Causa:** El servicio MySQL de XAMPP no está encendido o el puerto 3306 está bloqueado por otro servicio.
- **Solución:** Iniciar MySQL en XAMPP Control Panel, ejecutar `ejecutar_todo.bat` o cambiar a `DB_ENGINE=sqlite` en `backend/.env`.

### Error: `Access denied for user 'root'@'localhost'`
- **Causa:** MySQL tiene contraseña configurada para el usuario root (MySQL Workbench / Server standalone).
- **Solución:** Actualizar `DB_PASSWORD=su_contraseña` en el archivo `backend/.env`.

### Error: `CORS request blocked`
- **Causa:** El frontend corre en un puerto distinto al configurado en `CORS_ALLOWED_ORIGINS`.
- **Solución:** Agregar el origen en `.env` (ej: `http://localhost:5174`) o mantener `CORS_ALLOW_ALL_ORIGINS=True`.
