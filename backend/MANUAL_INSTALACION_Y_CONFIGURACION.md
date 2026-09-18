# MANUAL DE INSTALACIÓN, CONFIGURACIÓN Y DESPLIEGUE - SUMAQ SPA BACKEND

## 1. Requerimientos del Sistema

| Componente | Requisito Mínimo | Versión Recomendada |
|---|---|---|
| **Sistema Operativo** | Windows 10/11, Ubuntu 22.04 LTS, macOS 12+ | Windows 11 / Ubuntu 24.04 |
| **Python** | 3.10+ | Python 3.13.x |
| **SGBD** | MySQL 8.0 o MariaDB 10.4 | XAMPP 8.2 / MariaDB 10.4.32 |
| **Memoria RAM** | 2 GB | 4 GB o superior |
| **Espacio en Disco** | 500 MB libres | 2 GB libres |

---

## 2. Preparación del Entorno en Windows con XAMPP

### Paso 1: Iniciar el servicio MySQL en XAMPP
1. Abrir el **XAMPP Control Panel**.
2. Presionar **Start** en el módulo **MySQL** (Puerto por defecto: 3306).
3. (Opcional) Presionar **Start** en **Apache** para acceder a `http://localhost/phpmyadmin/`.

### Paso 2: Crear la Base de Datos
Desde la consola MySQL o phpMyAdmin, ejecutar:
```sql
CREATE DATABASE IF NOT EXISTS sumaq_spa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 3. Instalación de Dependencias de Backend

1. Abrir una terminal en la carpeta `SUMAQ/backend/`.
2. Crear un entorno virtual:
   ```cmd
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Instalar los paquetes requeridos:
   ```cmd
   pip install -r requirements.txt
   ```

---

## 4. Configuración de Variables de Entorno (`.env`)

Verificar o ajustar el archivo `.env`:
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

---

## 5. Aplicación de Migraciones y Carga Inicial

Ejecutar el inicializador automatizado:
```cmd
python init_db.py
```
Este script aplicará las migraciones de Django (`makemigrations` y `migrate`) y cargará la semilla inicial completa (usuarios, cabinas, terapeutas, productos, servicios y citas de prueba).

---

## 6. Ejecución del Servidor Backend

Iniciar el servidor de desarrollo:
```cmd
python manage.py runserver 8000
```
La API estará disponible en `http://127.0.0.1:8000/api/`.

Comprobar el estado del servicio:
```cmd
curl http://127.0.0.1:8000/api/health/
```
Respuesta esperada:
```json
{
  "status": "healthy",
  "database": "healthy",
  "database_latency_ms": 42.5,
  "timestamp": "2026-04-26T12:00:00.000Z"
}
```

---

## 7. Ejecución de Pruebas Automatizadas

Ejecutar la suite completa en Pytest:
```cmd
pytest
```
Todas las 18 pruebas unitarias, de concurrencia (`test_concurrency.py`), kárdex (`test_inventory_attention.py`), RBAC (`test_rbac_security.py`) y generación PDF (`test_pdf.py`) deben finalizar con estado **PASSED**.

---

## 8. Solución de Problemas Frecuentes (Troubleshooting)

### Error: `Can't connect to MySQL server on '127.0.0.1'`
- **Causa:** El servicio MySQL de XAMPP no está encendido o el puerto 3306 está bloqueado por otro servicio.
- **Solución:** Iniciar MySQL en XAMPP Control Panel o cambiar el puerto a `3307` en `my.ini` y `.env`.

### Error: `Access denied for user 'root'@'localhost'`
- **Causa:** MySQL tiene contraseña configurada para el usuario root.
- **Solución:** Actualizar `DB_PASSWORD=su_contraseña` en el archivo `backend/.env`.

### Error: `CORS request blocked`
- **Causa:** El frontend corre en un puerto distinto al configurado en `CORS_ALLOWED_ORIGINS`.
- **Solución:** Agregar el origen en `.env` (ej: `http://localhost:5174`) o mantener `CORS_ALLOW_ALL_ORIGINS=True`.
