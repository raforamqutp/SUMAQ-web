# GUÍA DE INSTALACIÓN, CONFIGURACIÓN Y DESPLIEGUE - SUMAQ SPA

Esta guía detalla los pasos para levantar el entorno de desarrollo local de forma homogénea para todo el equipo, soportando **XAMPP**, **MySQL Workbench / Server standalone** y **SQLite**.

---

## 1. Requerimientos del Sistema

| Componente | Requisito Mínimo | Versión Recomendada |
|---|---|---|
| **Sistema Operativo** | Windows 10/11, Ubuntu 22.04 LTS, macOS 12+ | Windows 11 / Ubuntu 24.04 |
| **Python** | 3.10+ | Python 3.12+ o 3.13 |
| **Node.js** | 18+ LTS | Node.js 20 LTS o superior |
| **Base de Datos** | MySQL 8.0, MariaDB 10.4 o SQLite | XAMPP 8.2, MySQL Workbench / Server 8.0 o SQLite |

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
DB_ENGINE=mysql
DB_NAME=sumaq_spa
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
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

## 3. Formas de Lanzamiento

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

## 4. Inicialización Manual de Base de Datos

Si prefieres ejecutar los comandos de Django manualmente en terminal:
```bash
# Activar entorno virtual
.venv\Scripts\activate

# Inicializar base de datos y semilla oficial
python backend/init_db.py
```
El script creará automáticamente la base de datos `sumaq_spa` si no existe, aplicará las migraciones y cargará los catálogos y usuarios iniciales.

---

## 5. Credenciales de Prueba

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador** | `admin@sumaqspa.pe` | `AdminSumaq2026!` |
| **Recepcionista** | `recepcion@sumaqspa.pe` | `Sumaq2026!` |
| **Terapeuta** | `elena.morales@sumaqspa.pe` | `Sumaq2026!` |

---

## 6. Pruebas Automatizadas

Para validar la integridad de la API y lógica de negocio:
```bash
pytest
```
Todas las pruebas (concurrencia, kárdex, RBAC y generación de comprobantes PDF) deben finalizar con estado **PASSED**.
