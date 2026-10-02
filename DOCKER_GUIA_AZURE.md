# 🐳 GUÍA DE CONTENEDORIZACIÓN DOCKER Y DESPLIEGUE EN AZURE
## SUMAQ SPA & Centro de Bienestar — Curso Integrador II

Esta guía explica la arquitectura de contenedores Docker preparada para **SUMAQ SPA** y cómo se utiliza para el despliegue en local y en la nube con **Microsoft Azure**.

---

## 1. Arquitectura de Contenedores (`docker-compose.yml`)

El sistema cuenta con **4 contenedores interconectados** mediante una red interna bridge (`sumaq-net`):

```
┌────────────────────────────────────────────────────────┐
│             NAVEGADOR WEB (PUERTO 80 / 5173)           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 1. sumaq-frontend (Nginx Alpine + React 19 Build)      │
│    - Sirve los archivos estáticos HTML/JS/CSS          │
│    - Proxy inverso: Redirige /api/* hacia el Backend   │
└───────────────────────────┬────────────────────────────┘
                            │ (http://backend:8000/api/)
┌───────────────────────────▼────────────────────────────┐
│ 2. sumaq-backend (Python 3.12 + Django 5.1 + Gunicorn) │
│    - Procesa reservas, caja POS, inventario y auth JWT │
│    - Ejecuta migraciones automáticas al iniciar        │
└─────────────┬────────────────────────────▲─────────────┘
  (Escritura) │                            │ (Lectura)
              ▼                            │
┌───────────────────────────┐    ┌─────────┴─────────────┐
│ 3. sumaq-mysql-master     │    │ 4. sumaq-mysql-slave  │
│    (Puerto host: 3308)    │───▶│    (Puerto host: 3309)│
│    - Binary Log (ROW)     │    │    - Relay Log        │
│    - DB: sumaq_spa        │    │    - read_only = 1    │
└───────────────────────────┘    └───────────────────────┘
```

> **Aislamiento de Puertos:** En Docker usamos los puertos **`3308`** (Master) y **`3309`** (Slave) para que nunca colisionen con los servicios MySQL que ya tengas instalados en tu Windows (como el `3307` o `3306`).

---

## 2. Archivos Creados y Modificados

1. **[`docker-compose.yml`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/docker-compose.yml):** Orquestador de los 4 servicios con volúmenes persistentes y dependencias con `healthcheck`.
2. **[`backend/Dockerfile`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/Dockerfile):** Imagen de producción basada en `python:3.12-slim`, servidor WSGI **Gunicorn** y librerías del sistema.
3. **[`backend/entrypoint.sh`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/entrypoint.sh):** Script de arranque seguro que espera la disponibilidad de MySQL antes de aplicar `migrate` y `collectstatic`.
4. **[`backend/.dockerignore`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/.dockerignore):** Excluye entornos virtuales (`.venv`), cachés y archivos temporales para construir imágenes livianas.
5. **[`frontend/Dockerfile`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/frontend/Dockerfile) y [`frontend/.dockerignore`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/frontend/.dockerignore):** Construcción optimizada multi-etapa (*Multi-stage build*: Node 20 para compilar y Nginx Alpine para servir).
6. **[`admin_tools/iniciar_docker.bat`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/admin_tools/iniciar_docker.bat):** Enciende todos los contenedores y sincroniza la réplica con un doble clic.
7. **[`admin_tools/detener_docker.bat`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/admin_tools/detener_docker.bat):** Detiene los contenedores de forma limpia.
8. **[`admin_tools/monitor_replicacion_docker.bat`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/admin_tools/monitor_replicacion_docker.bat):** Monitor interactivo para demostrar la réplica en Docker ante el docente.

---

## 3. Cómo Ejecutar Todo en Local con Docker

Si tienes instalado **Docker Desktop** en tu máquina:

### A. Encender toda la solución (Doble clic o comando):
- **Opción gráfica:** Doble clic en `admin_tools/iniciar_docker.bat`
- **Por terminal:**
```bash
docker compose up -d --build
python admin_tools/setup_replicacion_docker.py
```

### B. Verificar que los 4 contenedores estén en verde:
```bash
docker compose ps
```

### C. Probar en el navegador:
* **Frontend Web:** `http://localhost` (o `http://localhost:5173`)
* **Backend API Health:** `http://localhost/api/health/` (o `http://localhost:8000/api/health/`)
* **Django Admin:** `http://localhost/admin/`
* **MySQL Master:** Conectar en Workbench a `127.0.0.1:3308` (root / 123456)
* **MySQL Slave:** Conectar en Workbench a `127.0.0.1:3309` (root / 123456)

### D. Ver registros (logs) en tiempo real:
```bash
docker compose logs -f backend
```

### E. Detener los contenedores:
- Doble clic en `admin_tools/detener_docker.bat` o:
```bash
docker compose down
```

---

## 4. Cómo Desplegarlo en Microsoft Azure

Tienes las **2 opciones más comunes y recomendadas**:

### 🔹 Opción A: Despliegue con Máquina Virtual en Azure (La más sencilla y directa)

Ideal para proyectos académicos con créditos de **Azure for Students**:

1. En el portal de Azure (`portal.azure.com`), crea una **Máquina Virtual (Ubuntu 22.04 LTS)** de tamaño económico (ej. `Standard_B2s`).
2. Abre los puertos **80 (HTTP)**, **443 (HTTPS)** y **22 (SSH)** en el Grupo de Seguridad de Red (NSG).
3. Conéctate por SSH e instala Docker:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   ```
4. Clona tu repositorio de GitHub:
   ```bash
   git clone https://github.com/tu-usuario/SUMAQ-web.git
   cd SUMAQ-web
   ```
5. Enciende el sistema completo:
   ```bash
   docker compose up -d --build
   ```
6. Abre la IP pública de tu máquina virtual en el navegador y tu web estará online para todo el mundo.

---

### 🔹 Opción B: Despliegue Empresarial en Servicios PaaS (Azure App Service)

1. **Subir imágenes a Azure Container Registry (ACR):**
   ```bash
   az acr login --name sumaqregistry
   docker tag sumaq-web-backend sumaqregistry.azurecr.io/backend:v1
   docker push sumaqregistry.azurecr.io/backend:v1
   ```
2. **Frontend:** Desplegar en **Azure Static Web Apps** conectado directamente a la rama `main` de GitHub.
3. **Backend:** Desplegar en **Azure App Service para Contenedores** apuntando a tu imagen en ACR.
4. **Base de Datos:** Crear **Azure Database for MySQL (Flexible Server)** y habilitar la opción de **Read Replica**.

---

## 5. Resumen para la Sustentación ante el Profesor

> *"Profesor, para garantizar la portabilidad y facilitar el pase a producción en Microsoft Azure, contenerizamos la arquitectura completa con Docker y Docker Compose. Definimos imágenes multi-etapa ligeras para Frontend y Backend, orquestando los 4 nodos con volúmenes persistentes y variables de entorno desacopladas mediante el principio de diseño Twelve-Factor App."*
