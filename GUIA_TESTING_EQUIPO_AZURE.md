# 🚀 GUÍA INTEGRAL DE TESTING Y CONECTIVIDAD — SUMAQ SPA EN AZURE

> **Proyecto:** SUMAQ Spa & Wellness Center  
> **Servidor Cloud:** Azure Virtual Machine (Ubuntu 22.04 LTS)  
> **IP Pública del Servidor:** `68.155.146.110`  
> **Arquitectura:** Docker Compose (Frontend Nginx/React 19, Backend Django REST, MySQL 8.0 Master/Slave, Redis 7, Prometheus 2.51, Grafana 10.4)

---

## 📋 1. ENLACES Y CREDENCIALES DE ACCESO APLICATIVO

### A. Acceso Web Principal (Frontend Nginx)
* **URL Principal:** [http://68.155.146.110/](http://68.155.146.110/)
* **Pantalla de Login:** [http://68.155.146.110/login](http://68.155.146.110/login)

| Rol | Correo Electrónico | Contraseña | Alcance / Permisos en el Sistema |
| :--- | :--- | :--- | :--- |
| **Admin General** | `admin@sumaqspa.pe` | `AdminSumaq2026!` | Acceso completo: Finanzas, inventario, reportes ejecutivos, cabinas, caja y usuarios. |
| **Recepcionista** | `recepcion@sumaqspa.pe` | `Sumaq2026!` | Gestión de clientes, reservas, calendario de cabinas y cobro en caja. |
| **Terapeuta (Elena)** | `elena.morales@sumaqspa.pe` | `Sumaq2026!` | Vista de agenda propia, registro de atención y fichas clínicas. |
| **Soporte TI (Service Desk)** | `soporte.ti@sumaqspa.pe` | `Sumaq2026!` | Portal de Operaciones TI (`/ti`), Gestión de Incidentes, Aprobación de Cambios (CAB), Matriz ITIL v4 y KEDB. |

> 💡 **Tip:** En la pantalla de login (`/login`), en la parte inferior encontrarás los **botones de acceso rápido por rol**; al hacer clic sobre cualquiera de ellos, las credenciales se completan e inician sesión automáticamente.

---

## 🖥️ 2. CONEXIÓN SSH AL SERVIDOR DE AZURE

Para tareas de administración, despliegue o revisión de logs en el servidor Linux:

* **Host / IP:** `68.155.146.110`
* **Puerto:** `22`
* **Usuario:** `azureuser`
* **Contraseña:** `SumaqSpa2026`
* **Directorio del Proyecto:** `/home/azureuser/SUMAQ-web`

### Conexión desde Terminal / PowerShell / Git Bash:
```bash
ssh azureuser@68.155.146.110
# (Ingresar la contraseña: SumaqSpa2026)
```

### Comandos útiles en el servidor:
```bash
# Ver estado de los 7 contenedores Docker
docker ps

# Ver logs en vivo del backend Django
docker logs -f sumaq-backend --tail 50

# Ver métricas de consumo de CPU/Memoria de contenedores
docker stats --no-stream
```

---

## 🗄️ 3. CONEXIÓN A BASE DE DATOS MYSQL CON WORKBENCH

La arquitectura cuenta con **Replicación MySQL Master-Slave (Topología ITIL de Alta Disponibilidad)**:
* **Master (Puerto 3308):** Escrituras, transacciones atómicas (reservas, pagos, usuarios).
* **Slave (Puerto 3309):** Lecturas analíticas (`read-only=1`), reportes y balanceo.

### Opción A (Recomendada y 100% Segura): Mediante Túnel SSH (SSH Tunneling)
No requiere abrir los puertos de la base de datos a internet público; Workbench se conecta a través del canal cifrado SSH de la máquina virtual.

1. Abre **MySQL Workbench**.
2. En la pantalla de inicio, haz clic en el ícono **`+`** para crear una nueva conexión.
3. Configura los siguientes campos:
   * **Connection Name:** `SUMAQ Azure - Master DB`
   * **Connection Method:** Selecciona **`Standard TCP/IP over SSH`**
   * **SSH Hostname:** `68.155.146.110:22`
   * **SSH Username:** `azureuser`
   * **SSH Password:** Clic en *Store in Vault* e ingresar `SumaqSpa2026`
   * **MySQL Hostname:** `127.0.0.1` (o `localhost`)
   * **MySQL Server Port:** `3308` *(Para Master)*  o  `3309` *(Para Slave Réplica)*
   * **Username:** `root`
   * **Password:** Clic en *Store in Vault* e ingresar `123456`
   * **Default Schema:** `sumaq_spa`
4. Haz clic en **Test Connection**. Verás el mensaje:  
   *`Successfully made the MySQL connection!`*
5. Haz clic en **OK** y abre la conexión para consultar las tablas.

### Opción B: Conexión Directa TCP/IP (Si el puerto está habilitado en Azure NSG)
* **Hostname:** `68.155.146.110`
* **Puerto:** `3308` (Master) / `3309` (Slave)
* **Usuario:** `root`
* **Contraseña:** `123456`
* **Database:** `sumaq_spa`

---

## 📊 4. PLATAFORMA DE MONITOREO (GRAFANA & PROMETHEUS)

### A. Grafana (Dashboard Visual en Tiempo Real)
* **URL:** [http://68.155.146.110:3000](http://68.155.146.110:3000)
* **Usuario:** `admin`
* **Contraseña:** `admin`
* **Dashboard Directo:** [http://68.155.146.110:3000/d/sumaq-performance-kpis/sumaq-spa-capacidad-y-rendimiento-del-servicio](http://68.155.146.110:3000/d/sumaq-performance-kpis/sumaq-spa-capacidad-y-rendimiento-del-servicio)

> **Métricas que verás en Grafana:**
> * Tiempo de respuesta HTTP del backend (SLA objetivo: `< 400 ms`).
> * Latencia de conexión a MySQL Master en milisegundos.
> * Throughput de transacciones por segundo (RPS).
> * Uso de CPU del servidor Azure.
> * Tasa de acierto de caché en memoria Redis (*Cache Hit Ratio*).

### B. Prometheus (Motor de Series de Tiempo)
* **URL:** [http://68.155.146.110:9090](http://68.155.146.110:9090)
* **Estado de Conexión de Agentes (Targets):** [http://68.155.146.110:9090/targets](http://68.155.146.110:9090/targets) *(Debe mostrar `sumaq-backend` en verde **UP**)*.
* **Cómo consultar métricas:**
  1. En el campo `Expression`, escribe una métrica, por ejemplo: `sumaq_http_response_time_ms`
  2. Haz clic en el botón azul **Execute**.
  3. Haz clic en la pestaña **Graph** para ver la curva temporal generada.

---

## ⚡ 5. PRUEBAS DE CARGA Y RENDIMIENTO CON APACHE JMETER

### ¿Qué evalúa esta prueba?
Simula la concurrencia de **20 usuarios simultáneos** consultando masivamente el catálogo de servicios de SUMAQ Spa contra la nube de Azure, validando:
1. **SLA de Tiempo de Respuesta:** `< 400 ms` por transacción.
2. **Tasa de Errores HTTP:** `0.00%` (Todas las peticiones devuelven `200 OK`).
3. **Resistencia de la infraestructura:** Comportamiento de Redis, Nginx y Django bajo estrés.

---

### Opción 1: Ejecución Ultrarrápida con Python (Sin instalar Java ni JMeter)
En la raíz del proyecto, abre una terminal (PowerShell o CMD) y ejecuta:
```bash
python tests/performance/correr_prueba_rapida.py
```
* Generará 40 peticiones concurrentes y te mostrará en consola:
  * Latencia promedio (ms).
  * Latencia Percentil 95 (P95).
  * Throughput (peticiones/segundo).
  * Cumplimiento de SLA ITIL.

---

### Opción 2: Apache JMeter en Modo Automático (Reporte HTML Profesional)
El proyecto incluye un script automatizado que descarga Apache JMeter si no lo tienes y genera un reporte HTML completo con gráficos interactivos.

1. Haz doble clic en el archivo:
   ```text
   ejecutar_jmeter_cli.bat
   ```
2. El script ejecutará el plan `tests/performance/sumaq_smoke_test.jmx` contra el servidor.
3. Al finalizar, abrirá o creará la carpeta:
   `tests/performance/reporte_html/index.html`
4. Abre `index.html` en tu navegador para ver:
   * **APDEX Score** (Índice de satisfacción del usuario).
   * Gráficas de Throughput vs Latency.
   * Tabla detallada de Percentiles (50th, 90th, 95th, 99th).

---

### Opción 3: Apache JMeter Modo Gráfico (GUI)
1. Haz doble clic en:
   ```text
   ejecutar_jmeter_gui.bat
   ```
2. Se abrirá la interfaz gráfica de Apache JMeter con el plan de pruebas cargado.
3. En el árbol izquierdo:
   * Selecciona `SUMAQ Spa - Plan de Rendimiento y Carga`.
   * En `User Defined Variables`:
     * `HOST`: Puedes poner `68.155.146.110` (Azure) o `localhost` (si pruebas local).
     * `PORT`: `80` (a través de Nginx en Azure) o `8000`.
4. Haz clic en el botón verde **Start ▶** en la barra superior.
5. Revisa los resultados en los árboles `View Results Tree` y `Summary Report`.

---

## 🛠️ 6. CHECKLIST DE VERIFICACIÓN PARA CADA COMPAÑERO

Cada integrante del equipo debe completar este checklist para confirmar que su entorno y el sistema están 100% operativos:

- [ ] **Acceso Web:** Ingresar a [http://68.155.146.110/login](http://68.155.146.110/login) y probar inicio de sesión con los 4 roles (Admin, Recepción, Terapeuta, TI).
- [ ] **Módulo TI (`/ti`):**
  - [ ] Interactuar con los filtros (Módulo, Prioridad, Estado) y verificar que los gráficos reaccionen.
  - [ ] En la sección de *Gestión de Problemas ITIL*, revisar el patrón recurrente detectado y la solución KEDB (**RFC-2026-0042**).
  - [ ] En la pestaña *Control de Cambios (CAB)*, dictaminar o aprobar un RFC.
- [ ] **Grafana:** Entrar a [http://68.155.146.110:3000](http://68.155.146.110:3000) con `admin`/`admin` y comprobar que los paneles carguen métricas activas.
- [ ] **Prometheus:** Entrar a [http://68.155.146.110:9090/targets](http://68.155.146.110:9090/targets) y validar que el target `sumaq-backend` esté en estado `UP`.
- [ ] **MySQL Workbench:** Conectar exitosamente a la base de datos `sumaq_spa` vía túnel SSH en los puertos `3308` (Master) y `3309` (Slave).
- [ ] **JMeter / Carga:** Ejecutar `ejecutar_jmeter_cli.bat` o `python tests/performance/correr_prueba_rapida.py` y validar que el tiempo de respuesta sea inferior a 400ms con 0% de errores.
