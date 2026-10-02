# 🐳 GUÍA DIDÁCTICA DEFINITIVA DE DOCKER: DE CERO A EXPERTO
## Proyecto: SUMAQ SPA & Centro de Bienestar (Integrador II)
**Autor:** Antigravity AI & Equipo de Desarrollo SUMAQ  
**Fecha:** Octubre 2026  

---

## 📌 ÍNDICE GENERAL
1. [¿Qué es Docker y por qué todo el mundo lo usa? (Explicado con Manzanas)](#1-qué-es-docker-y-por-qué-todo-el-mundo-lo-usa-explicado-con-manzanas)
2. [Los 5 Conceptos Clave de Docker](#2-los-5-conceptos-clave-de-docker)
3. [¿Qué se implementó exactamente en SUMAQ SPA?](#3-qué-se-implementó-exactamente-en-sumaq-spa)
4. [Radiografía Completa de Archivos, Carpetas y Código](#4-radiografía-completa-de-archivos-carpetas-y-código)
   - [A. El Orquestador: `docker-compose.yml`](#a-el-orquestador-docker-composeyml)
   - [B. El Backend: `backend/Dockerfile` y `entrypoint.sh`](#b-el-backend-backenddockerfile-y-entrypointsh)
   - [C. El Frontend: `frontend/Dockerfile` y `nginx.conf`](#c-el-frontend-frontenddockerfile-y-nginxconf)
   - [D. Los Filtros de Seguridad: `.dockerignore`](#d-los-filtros-de-seguridad-dockerignore)
   - [E. Las Herramientas de Control: Scripts en `admin_tools/`](#e-las-herramientas-de-control-scripts-en-admin_tools)
5. [Manual Práctico de Operación (Paso a Paso sin Complicaciones)](#5-manual-práctico-de-operación-paso-a-paso-sin-complicaciones)
6. [Cómo Demostrar la Replicación y el Sistema ante el Profesor](#6-cómo-demostrar-la-replicación-y-el-sistema-ante-el-profesor)
7. [Preguntas Frecuentes y Guion para la Sustentación](#7-preguntas-frecuentes-y-guion-para-la-sustentación)

---

# 1. ¿Qué es Docker y por qué todo el mundo lo usa? (Explicado con Manzanas)

### El Gran Problema Histórico de la Programación:
Seguramente has escuchado o vivido esta situación:
> *"¡En mi computadora el proyecto funciona de maravilla, pero cuando se lo paso a mi compañero o lo subo al servidor de la nube, se cae y salen mil errores de versiones, librerías o dependencias!"*

Esto ocurre porque cada computadora tiene un entorno distinto: una tiene Python 3.10, otra Python 3.12, una tiene MySQL configurado de una forma, otra tiene librerías de Windows que no existen en Linux, etc.

### La Solución de Docker: La Metáfora de los Contenedores Marítimos
Antes de 1956, transportar mercancía en barcos era un caos: barriles de vino sueltos, cajas de fruta de distintos tamaños, sacos de café amarrados... Si el barco se movía, todo se rompía y tardaban semanas en cargar y descargar.

Entonces se inventó el **Contenedor Marítimo Estándar**: una caja metálica cerrada de medidas universales. Dentro del contenedor puedes meter botellas, autos o ropa; al barco y a las grúas del puerto no les importa qué hay dentro, solo saben levantar esa caja y transportarla de China a Perú intacta.

**Docker hace exactamente lo mismo con el Software:**
Empaqueta tu código (React, Django, MySQL, librerías, configuraciones y variables) en una **caja virtual cerrada y autosuficiente llamada Contenedor**.

```
┌────────────────────────────────────────────────────────┐
│                   DOCKER EN TU EQUIPO                  │
│                                                        │
│  📦 Caja 1: Frontend (React 19 + Nginx)               │
│  📦 Caja 2: Backend (Django REST + Python 3.12)       │
│  📦 Caja 3: Base de Datos Master (MySQL 8.0)          │
│  📦 Caja 4: Base de Datos Slave (MySQL 8.0 Réplica)   │
└────────────────────────────────────────────────────────┘
```

Si esa "caja" funciona en tu laptop con Windows, **va a funcionar exactamente igual en la Mac de tu profesor, en una laptop con Linux o en los servidores de Microsoft Azure**, sin instalar nada a mano.

---

### ¿Es Docker lo mismo que una Máquina Virtual (como VirtualBox o VMware)?
**NO.** Esta es una pregunta fija de sustentación.

| Característica | Máquina Virtual (VMWare / VirtualBox) | Contenedor Docker 🐳 |
| :--- | :--- | :--- |
| **Peso / Tamaño** | Enorme (20 a 50 Gigabytes por cada una). | Muy ligero (pocos Megabytes). |
| **Tiempo de arranque**| Lento (tarda 1 a 3 minutos en iniciar). | Instantáneo (arranca en 1 a 3 segundos). |
| **Sistema Operativo** | Instala un Windows o Linux completo con su propio kernel repetido. | **Comparte el núcleo (Kernel)** de la máquina anfitriona de forma inteligente. |
| **Rendimiento** | Consume mucha memoria RAM y CPU innecesaria. | Rendimiento nativo casi idéntico al de tu procesador. |

---

# 2. Los 5 Conceptos Clave de Docker

Para entender cualquier conversación sobre Docker, solo necesitas dominar estos 5 términos:

### 1. Imagen (Image) 📄
* **¿Qué es?** Es la **receta** o el plano de construcción. Es un archivo estático de solo lectura que dice: *"Para armar el backend necesitas Debian Slim, Python 3.12, instalar las librerías de `requirements.txt` y copiar el código de Django"*.
* **Analogía:** Es la receta escrita en papel para hornear un pastel.

### 2. Contenedor (Container) 🎂
* **¿Qué es?** Es la imagen **cobrando vida y ejecutándose en la memoria RAM**. Puedes crear 1, 5 o 100 contenedores a partir de una sola imagen.
* **Analogía:** Es el pastel ya horneado y listo para comer en la mesa.

### 3. Volumen (Volume) 💾
* **¿Qué es?** Los contenedores son por naturaleza *efímeros* (si destruyes un contenedor, lo que estaba adentro desaparece). Un **Volumen** es una carpeta especial de tu disco duro que se conecta al contenedor. Aunque el contenedor se apague o se actualice, **la información de la base de datos y las imágenes subidas nunca se borran**.
* **Analogía:** Es como conectar un disco duro externo USB a tu consola de juegos para guardar tus partidas.

### 4. Red (Network) 🌐
* **¿Qué es?** Un puente virtual privado creado por Docker que conecta los contenedores entre sí. Gracias a esto, el backend puede hablar con MySQL llamándolo simplemente por su nombre `mysql-master` en lugar de una IP complicada.
* **Analogía:** Es como un router WiFi interno que solo ven tus 4 contenedores.

### 5. Docker Compose 🎼
* **¿Qué es?** Si tienes 4 contenedores, escribir comandos individuales en la terminal para levantar cada uno sería agotador y propenso a errores. `docker-compose.yml` es un archivo de texto donde declaras todos los servicios, y con un solo comando (`docker compose up`) enciende los 4 de golpe en el orden correcto.
* **Analogía:** Es el director de orquesta que coordina a los 4 músicos al mismo tiempo.

---

# 3. ¿Qué se implementó exactamente en SUMAQ SPA?

En el proyecto SUMAQ SPA hemos diseñado una arquitectura profesional desacoplada de **4 Contenedores** que trabajan en equipo:

```
                                 USUARIO (Tú / Navegador / Docente)
                                                  │
                                                  ▼
                                         http://localhost:80
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         │                                                 │
                   (Carga de la Web)                                 (Llamadas a /api/)
                         │                                                 │
                         ▼                                                 ▼
             ┌─────────────────────────┐                       ┌─────────────────────────┐
             │     sumaq-frontend      │                       │      sumaq-backend      │
             │   (React 19 + Nginx)    │──────────────────────▶│  (Django + Gunicorn)    │
             │  Puerto en Windows: 80  │  (Proxy Inverso /api) │ Puerto en Windows: 8000 │
             └─────────────────────────┘                       └────────────┬────────────┘
                                                                            │
                                                               (Escrituras) │
                                                                            ▼
                                                               ┌─────────────────────────┐
                                                               │   sumaq-mysql-master    │
                                                               │  (Base Datos Principal) │
                                                               │ Puerto en Windows: 3308 │
                                                               └────────────┬────────────┘
                                                                            │
                                                       (Replicación Binlog) │
                                                                            ▼
                                                               ┌─────────────────────────┐
                                                               │    sumaq-mysql-slave    │
                                                               │   (Réplica de Lectura)  │
                                                               │ Puerto en Windows: 3309 │
                                                               └─────────────────────────┘
```

### El Aislamiento de Puertos (Crucial para que nada falle en tu PC):
En tu laptop ya tenías instalado MySQL Server en Windows escuchando en el puerto local **3307** y una réplica en **3306**. Para evitar cualquier choque:
* **Docker Master:** Expone hacia tu Windows el puerto **`3308`** (que conecta internamente al puerto estándar 3306 de MySQL).
* **Docker Slave:** Expone hacia tu Windows el puerto **`3309`** (que conecta internamente al 3306 del contenedor).
* **Frontend Web:** Expone el puerto **`80`** (puedes entrar escribiendo solo `http://localhost`).
* **Backend API:** Expone el puerto **`8000`** (`http://localhost:8000/api/health/`).

---

# 4. Radiografía Completa de Archivos, Carpetas y Código

A continuación se explica qué hace cada archivo creado en el proyecto:

---

## A. El Orquestador: `docker-compose.yml`
Ubicado en la raíz del proyecto: `docker-compose.yml`

Este archivo es el **cerebro maestro**. Define los 4 contenedores:

```yaml
services:
  # 1. BASE DE DATOS MASTER (PRINCIPAL)
  mysql-master:
    image: mysql:8.0                       # Usa la imagen oficial de MySQL versión 8.0
    container_name: sumaq-mysql-master     # Nombre amigable del contenedor
    restart: always                        # Si el contenedor se cae, Docker lo revive solo
    environment:
      MYSQL_ROOT_PASSWORD: "123456"        # Contraseña del usuario root
      MYSQL_DATABASE: "sumaq_spa"          # Crea automáticamente la base de datos
    command: >                             # Parámetros avanzados para activar la replicación:
      --server-id=1                        # Identificador único del Master
      --log-bin=mysql-bin                  # Habilita el registro binario (Binary Log)
      --binlog-format=ROW                  # Formato fila por fila (el más seguro de la industria)
      --binlog-do-db=sumaq_spa             # Solo replica la base sumaq_spa
    ports:
      - "3308:3306"                        # Conecta el puerto 3308 de Windows con el 3306 del contenedor
    volumes:
      - master_db_data:/var/lib/mysql      # Guarda las tablas en un volumen persistente
      - ./database/03_sumaq_spa_full_dump.sql:/docker-entrypoint-initdb.d/01_init.sql:ro
      - ./database/init_master_repl.sql:/docker-entrypoint-initdb.d/02_repl.sql:ro
      # Los archivos .sql colocados en docker-entrypoint-initdb.d se ejecutan
      # automáticamente al encender por primera vez para crear tablas y usuarios.
    healthcheck:                           # Comprobación de salud: avisa cuando MySQL está 100% listo
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p123456"]

  # 2. BASE DE DATOS SLAVE (RÉPLICA)
  mysql-slave:
    image: mysql:8.0
    container_name: sumaq-mysql-slave
    command: >
      --server-id=2                        # ID único del Slave
      --relay-log=mysql-relay-bin          # Habilita los registros de transmisión
      --read-only=1                        # Protege la réplica: solo permite lecturas, no escrituras accidentales
      --replica-skip-errors=1062,1032      # Evita que se detenga ante llaves duplicadas durante pruebas
    ports:
      - "3309:3306"                        # Expone el puerto 3309 en Windows
    volumes:
      - slave_db_data:/var/lib/mysql
    depends_on:
      mysql-master:
        condition: service_healthy         # Espera que el Master esté saludable antes de encender

  # 3. BACKEND DJANGO REST API
  backend:
    build:
      context: ./backend                   # Busca la carpeta backend para construir la imagen
      dockerfile: Dockerfile
    container_name: sumaq-backend
    environment:                           # Variables de entorno seguras (Twelve-Factor App)
      DEBUG: "False"                       # Modo producción activado
      DB_HOST: "mysql-master"              # Se conecta al contenedor MySQL usando su nombre interno
      DB_PORT: "3306"
      DB_NAME: "sumaq_spa"
      DB_USER: "root"
      DB_PASSWORD: "123456"
    ports:
      - "8000:8000"
    volumes:
      - backend_media:/app/media           # Volumen para comprobantes PDF y fotos de servicios
      - backend_static:/app/staticfiles    # Volumen para CSS y JS de Django Admin
    depends_on:
      mysql-master:
        condition: service_healthy

  # 4. FRONTEND REACT 19 + NGINX
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: "/api"               # Enruta peticiones relativas a través de Nginx
    container_name: sumaq-frontend
    ports:
      - "80:80"                            # Puerto web por defecto
      - "5173:80"                          # También en el 5173 por compatibilidad con Vite
    volumes:
      - backend_static:/var/www/static:ro  # Comparte los archivos estáticos de Django con Nginx
      - backend_media:/var/www/media:ro    # Comparte los archivos subidos con Nginx
    depends_on:
      - backend

# DEFINICIÓN DE VOLÚMENES PERSISTENTES
volumes:
  master_db_data:                          # Asegura que las citas y transacciones no se borren
  slave_db_data:                           # Asegura que la réplica persista
  backend_media:
  backend_static:

# DEFINICIÓN DE RED PRIVADA
networks:
  sumaq-net:
    driver: bridge                         # Puente de red interna
```

---

## B. El Backend: `backend/Dockerfile` y `entrypoint.sh`

### 1. `backend/Dockerfile`:
La receta de cocina para empaquetar Django:
* **`FROM python:3.12-slim`**: Usa una versión oficial y ligera de Python 3.12 basada en Debian Linux.
* **`RUN apt-get update && apt-get install...`**: Instala los compiladores C (`gcc`) y las librerías de conexión nativa de MySQL (`default-libmysqlclient-dev`) necesarias para que Django hable con MySQL velozmente.
* **`RUN pip install -r requirements.txt`**: Instala todas las librerías Python, incluyendo **Gunicorn** (el servidor web industrial que reemplaza al `python manage.py runserver`).
* **`COPY . /app/`**: Copia todo el código fuente del proyecto dentro del contenedor.
* **`ENTRYPOINT ["/entrypoint.sh"]`**: Define el script que se ejecuta automáticamente cada vez que el contenedor arranca.
* **`CMD ["gunicorn", "config.wsgi:application"...]`**: Inicia 3 procesos concurrentes (*workers*) de Gunicorn listos para atender miles de peticiones simultáneas.

### 2. `backend/entrypoint.sh`:
Es un script inteligente de arranque escrito en Bash que hace 4 tareas cruciales antes de iniciar el servidor web:
1. **Comprobación de Red (`nc -z mysql-master 3306`)**: Espera activamente a que MySQL esté listo y aceptando conexiones. Esto previene el clásico error de *"Django intentó arrancar antes de que la base de datos terminara de encender"*.
2. **Migraciones Automáticas (`python manage.py migrate --noinput`)**: Aplica cualquier cambio en los modelos a la base de datos de forma desatendida.
3. **Recolección de Estáticos (`python manage.py collectstatic`)**: Junta todos los archivos CSS, JavaScript e íconos en la carpeta compartida para que Nginx los sirva a velocidad máxima.
4. **Ejecución de Gunicorn (`exec "$@"`)**: Cede el control al servidor de producción.

---

## C. El Frontend: `frontend/Dockerfile` y `nginx.conf`

### 1. `frontend/Dockerfile` (Compilación Multi-Etapa / Multi-stage Build):
Esta técnica es un estándar de alta ingeniería de software y sorprenderá gratamente a tus profesores:
* **Etapa 1 (Build con Node.js):**
  * Descarga `node:20-alpine`.
  * Instala dependencias con `npm ci`.
  * Compila todo el código React y TypeScript ejecutando `npm run build`.
  * Esto genera una carpeta `dist/` ultraligera con archivos HTML, CSS y JS ya minificados y optimizados.
* **Etapa 2 (Servidor Nginx):**
  * Descarga `nginx:alpine` (un servidor web que pesa solo **15 Megabytes**).
  * **Copia únicamente la carpeta compilada `dist/`** y desecha Node.js, `node_modules` y el código fuente.
  * **Resultado:** La imagen final es súper liviana, arranca al instante y no tiene vulnerabilidades de desarrollo.

### 2. `frontend/nginx.conf` (El Proxy Inverso):
Nginx funciona como el recepcionista del hotel que atiende en el puerto 80:
* Si el cliente pide `/` o cualquier página de la web: Nginx entrega los archivos de React (`index.html`).
* Si el cliente pide `/api/...`: Nginx redirige internamente la petición a `http://backend:8000/api/` sin que el usuario note la diferencia.
* Si el cliente pide `/admin/...`: Nginx redirige al panel administrativo de Django.
* Si el cliente pide `/static/` o `/media/`: Nginx entrega las imágenes y archivos directamente desde el disco sin molestar a Python, logrando una velocidad impresionante.

---

## D. Los Filtros de Seguridad: `.dockerignore`

Tanto en `backend/.dockerignore` como en `frontend/.dockerignore` se listan los archivos que **JAMÁS** deben copiarse dentro de las imágenes:
* `.venv/` (el entorno virtual de tu Windows, porque sus ejecutables no sirven en Linux).
* `node_modules/` (miles de archivos temporales que inflarían el contenedor innecesariamente).
* `.git/` (el historial de versiones).
* `*.pyc` y `__pycache__` (archivos compilados temporales de Python).

---

## E. Las Herramientas de Control: Scripts en `admin_tools/`

Hemos creado accesos directos por lotes (`.bat`) para que puedas controlar todo con un solo doble clic sin tener que recordar comandos de consola:

1. **`admin_tools/iniciar_docker.bat`:**
   * Ejecuta `docker compose up -d`.
   * Llama a `setup_replicacion_docker.py` para enlazar automáticamente el Slave con el Master.
   * Te muestra en pantalla los enlaces listos para usar.
2. **`admin_tools/detener_docker.bat`:**
   * Ejecuta `docker compose down` para apagar todos los contenedores de forma segura y liberar la memoria RAM de tu computadora.
3. **`admin_tools/monitor_replicacion_docker.bat`:**
   * Abre el monitor interactivo en tiempo real conectado a los puertos de Docker (`3308` y `3309`) para hacer demostraciones en vivo.
4. **`admin_tools/setup_replicacion_docker.py`:**
   * Script en Python que consulta las coordenadas exactas del binlog del Master (`SHOW BINARY LOG STATUS;`) y configura la réplica en el Slave (`CHANGE REPLICATION SOURCE TO...; START REPLICA;`).

---

# 5. Manual Práctico de Operación (Paso a Paso sin Complicaciones)

### Paso 1: Asegurarte de que Docker Desktop esté abierto
En la barra de tareas de Windows (cerca del reloj), busca el ícono de la **ballenita de Docker**. Debe decir *"Docker Desktop is running"*.

### Paso 2: Encender el proyecto
Ve a la carpeta `admin_tools` y dale doble clic a:
👉 **`iniciar_docker.bat`**

Verás una ventana negra que compila y levanta los 4 contenedores y te avisa:
```
[EXITO] REPLICACION DOCKER OPERATIVA AL 100%
TODO LISTO Y OPERATIVO:
 - Frontend Web : http://localhost
 - Backend API  : http://localhost/api/health/
 - Master DB    : 127.0.0.1:3308
 - Slave DB     : 127.0.0.1:3309
```

### Paso 3: Probar la Web en el Navegador
Abre Google Chrome o tu navegador favorito y visita:
* **Página Web del SPA:** [http://localhost](http://localhost) (verás la interfaz de React con catálogo, servicios y reservas).
* **Diagnóstico del Backend:** [http://localhost/api/health/](http://localhost/api/health/) (verás un JSON que dice `status: healthy, database: healthy`).
* **Panel de Administración:** [http://localhost/admin/](http://localhost/admin/) (acceso para administradores del Spa).

### Paso 4: Conectar MySQL Workbench a los Contenedores
Para que veas las tablas y los datos directamente en Workbench:

1. Abre **MySQL Workbench**.
2. Dale clic al signo **`+`** para crear una nueva conexión.
3. **Para ver el Master:**
   * Connection Name: `Docker - Master 3308`
   * Hostname: `127.0.0.1`
   * Port: `3308`
   * Username: `root`
   * Password: Dale a *Store in Vault* y pon `123456`.
4. **Para ver el Slave:**
   * Connection Name: `Docker - Slave 3309`
   * Hostname: `127.0.0.1`
   * Port: `3309`
   * Username: `root`
   * Password: Dale a *Store in Vault* y pon `123456`.

---

# 6. Cómo Demostrar la Replicación y el Sistema ante el Profesor

Durante tu exposición o evaluación, sigue estos sencillos pasos:

1. **Abre el monitor interactivo:**
   Dale doble clic a `admin_tools/monitor_replicacion_docker.bat`.
2. **Selecciona la Opción `[2]` (Demostración Transaccional en Vivo):**
   * El programa generará una transacción simulada (un registro único con token criptográfico).
   * Escribirá el dato en el **Master (3308)** en ~9 ms.
   * Inmediatamente consultará el **Slave (3309)**.
   * La pantalla mostrará en verde:
     `[OK] ¡REGISTRO ENCONTRADO EN EL SLAVE! (Replicado en 59 ms - Lag: 0 segundos)`.
3. **Selecciona la Opción `[1]` (Tablero en Vivo):**
   * Verás una pantalla estilo consola de centro de control que se actualiza cada segundo mostrando los hilos de replicación (`Replica_IO_Running: Yes`, `Replica_SQL_Running: Yes`) y las coordenadas de posición del binlog.

---

# 7. Preguntas Frecuentes y Guion para la Sustentación

### Pregunta 1: "¿Por qué decidieron usar Docker en su proyecto de fin de carrera?"
> **Respuesta sugerida:**  
> *"Profesor, elegimos Docker para garantizar la portabilidad y la reproducibilidad total del sistema. Al contenerizar la solución, desacoplamos el Frontend en React, el Backend en Django y la base de datos MySQL con su réplica esclava. Esto elimina el problema clásico de incompatibilidad de entornos y nos permite desplegar la arquitectura completa en Microsoft Azure con exactamente el mismo comportamiento que tenemos en local."*

### Pregunta 2: "¿Cómo garantizan que los datos no se pierdan si se apaga el contenedor de MySQL?"
> **Respuesta sugerida:**  
> *"Los contenedores son stateless por diseño. Por ello, implementamos Volúmenes Persistentes de Docker (`master_db_data` y `slave_db_data`) montados directamente en `/var/lib/mysql`. De esta manera, aunque los contenedores se detengan, se reinicien o se actualicen a una nueva versión, los registros de clientes, citas y transacciones permanecen intactos en el almacenamiento persistente del host."*

### Pregunta 3: "¿Qué papel cumple Nginx en la arquitectura?"
> **Respuesta sugerida:**  
> *"Nginx actúa como Servidor Web de archivos estáticos y como Proxy Inverso (Reverse Proxy). Recibe todo el tráfico en el puerto estándar 80: si la petición es para las pantallas de la aplicación, sirve la compilación optimizada de React; si la petición es un consumo de API hacia `/api/` o el panel administrativo `/admin/`, Nginx la redirige de forma transparente al servidor de aplicaciones Gunicorn en el backend. Esto mejora el rendimiento, la seguridad y simplifica la gestión de CORS."*

### Pregunta 4: "¿Cómo funciona la replicación Master-Slave en Docker?"
> **Respuesta sugerida:**  
> *"El contenedor Master tiene habilitado el registro binario (`log-bin`) con formato `ROW` y `server-id=1`. El contenedor Slave tiene `server-id=2` y está configurado en modo `read-only`. Mediante un canal seguro con el usuario `repl_user`, el hilo I/O del Slave descarga los eventos binarios hacia el Relay Log y el hilo SQL los ejecuta en tiempo real, garantizando alta disponibilidad y permitiendo separar las consultas de solo lectura de las escrituras transaccionales."*

---

### 💡 Resumen Final
* **Para iniciar todo:** Doble clic en `admin_tools/iniciar_docker.bat`.
* **Para ver la web:** `http://localhost`.
* **Para monitorear la réplica:** Doble clic en `admin_tools/monitor_replicacion_docker.bat`.
* **Para apagar todo:** Doble clic en `admin_tools/detener_docker.bat`.
