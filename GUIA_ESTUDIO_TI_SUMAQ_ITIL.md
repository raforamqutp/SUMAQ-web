# 🎓 GUÍA MAESTRA DE ESTUDIO Y SUSTENTACIÓN — MÓDULO DE GESTIÓN DE TI E ITIL v4 (SUMAQ SPA)

> **Proyecto:** SUMAQ Spa & Wellness Center  
> **Asignatura:** Proyecto Integrador II / Gestión de Tecnologías de Información  
> **Marco Metodológico:** ITIL® v4 (Service Value System, Service Desk, Change Enablement, Incident & Problem Management)  
> **Servidor Cloud:** Azure Virtual Machine (`68.155.146.110`)  
> **Rama de Desarrollo:** `Integrador_Tic_GestionCambios_MesaAyuda_v2`

---

## 📑 ÍNDICE DE CONTENIDOS
1. [Rol de Soporte TI: Autenticación, Acceso y Propósito en el Negocio](#1-rol-de-soporte-ti-autenticación-acceso-y-propósito-en-el-negocio)
2. [Las 3 Secciones Clave del Portal de TI (`/ti`)](#2-las-3-secciones-clave-del-portal-de-ti-ti)
   - [Pestaña 1: Dashboard & Analítica ITIL (Problem Management & RCA)](#pestaña-1-dashboard--analítica-itil-problem-management--rca)
   - [Pestaña 2: Control de Cambios (CAB / RFC - Change Advisory Board)](#pestaña-2-control-de-cambios-cab--rfc---change-advisory-board)
   - [Pestaña 3: Mesa de Ayuda (Service Desk & Gestión de Incidentes)](#pestaña-3-mesa-de-ayuda-service-desk--gestión-de-incidentes)
3. [Mapeo Exhaustivo del Código Fuente (Frontend & Backend)](#3-mapeo-exhaustivo-del-código-fuente-frontend--backend)
4. [Integración Bidireccional con Atlassian Jira Cloud v3](#4-integración-bidireccional-con-atlassian-jira-cloud-v3)
5. [Ecosistema de Monitoreo: Prometheus, Grafana y Memoria Caché Redis](#5-ecosistema-de-monitoreo-prometheus-grafana-y-memoria-caché-redis)
6. [Arquitectura de Base de Datos: Replicación MySQL Master-Slave](#6-arquitectura-de-base-de-datos-replicación-mysql-master-slave)
7. [Pruebas de Capacidad y Rendimiento: Apache JMeter & Python Load Test](#7-pruebas-de-capacidad-y-rendimiento-apache-jmeter--python-load-test)
8. [Banco de Preguntas Típicas del Jurado / Profesor con Respuestas Técnicas](#8-banco-de-preguntas-típicas-del-jurado--profesor-con-respuestas-técnicas)

---

## 1. ROL DE SOPORTE TI: AUTENTICACIÓN, ACCESO Y PROPÓSITO EN EL NEGOCIO

### ¿Por qué existe este rol en SUMAQ Spa?
En un negocio de bienestar y salud como SUMAQ Spa, la indisponibilidad de la agenda de citas, la pasarela de pagos o el inventario de insumos genera pérdida de ingresos y daño a la reputación.
El rol **Soporte TI (`SOPORTE_TI`)** representa al equipo de operaciones y gobierno tecnológico encargado de:
1. Velar por el cumplimiento de los **Acuerdos de Nivel de Servicio (SLAs)** pactados con las áreas operativas (Recepción, Terapeutas, Administración).
2. Dictaminar y mitigar riesgos en despliegues a producción mediante el **Comité de Control de Cambios (CAB)**.
3. Diagnosticar problemas recurrentes (**Gestión de Problemas / RCA**) y mantener la base de conocimiento de errores conocidos (**KEDB**).

### Flujo de Autenticación y Redirección
1. **Credenciales en base de datos:**  
   * Correo: `soporte.ti@sumaqspa.pe`  
   * Contraseña: `Sumaq2026!`  
   * Rol en BD: `SOPORTE_TI`
2. **Autenticación Stateless JWT:** El usuario ingresa en `/login`, Django valida credenciales mediante hash PBKDF2-SHA256 y emite un token JWT (`access_token` y `refresh_token`).
3. **Control de Acceso Basado en Roles (RBAC):**  
   * En el frontend, `frontend/src/routes/AppRoutes.tsx` protege la ruta `/ti` mediante un componente `<ProtectedRoute allowedRoles={['SOPORTE_TI', 'ADMIN']} />`.
   * En `frontend/src/pages/auth/LoginPage.tsx`, al detectar `user.rol === 'SOPORTE_TI'`, redirige automáticamente a `/ti`.
   * En el Navbar superior (`frontend/src/components/Navbar.tsx`), si el usuario tiene rol `SOPORTE_TI`, se muestra el botón de acceso directo *"Panel TI"*.

---

## 2. LAS 3 SECCIONES CLAVE DEL PORTAL DE TI (`/ti`)

El portal de TI unifica tres prácticas esenciales de **ITIL v4**:

```
+----------------------------------------------------------------------------------------------------+
|  [1. Dashboard & Analítica ITIL]   |   [2. Control de Cambios (CAB)]   |   [3. Mesa de Ayuda]     |
|   (Problem Management & RCA)       |     (Change Advisory Board)       |      (Service Desk)        |
+----------------------------------------------------------------------------------------------------+
```

---

### Pestaña 1: Dashboard & Analítica ITIL (Problem Management & RCA)
**Objetivo ITIL:** Monitoreo del *Sistema de Valor del Servicio* (SVS), cumplimiento proactivo de SLAs, detección de causas raíz y análisis de tendencias.

#### A. Barra Superior de KPIs Ejecutivos (Cards Principales)
* **Total Incidentes / Requerimientos:** Conteo total de tickets registrados en el periodo.
* **Cerrados / Resueltos:** Cantidad y porcentaje de tickets solucionados exitosamente.
* **En Atención / Cubiertos:** Tickets abiertos que se encuentran dentro de su ventana de atención.
* **SLA Promedio:** Porcentaje global de cumplimiento de acuerdos de atención sin vencimiento.
* **Cambios CAB:** Proporción de cambios técnicos (RFCs) aprobados formalmente y con plan de rollback listo.
* **Último Cambio:** Ficha rápida del RFC más reciente aprobado o implementado en producción.

#### B. Barra de Filtros Interactivos en Vivo
Permite a los directores de TI filtrar los gráficos de forma dinámica:
* **Módulo:** Base de Datos MySQL, Frontend & APIs, Infraestructura & Red, Seguridad & Auth, Soporte & Usuarios.
* **Prioridad:** P1 Crítica, P2 Alta, P3 Media, P4 Baja.
* **Estado:** Abierto, En Proceso, Resuelto.
* *Botón Limpiar Filtros:* Restablece la vista general instantáneamente sin recargar la página.

#### C. Cuatro Bloques Analíticos de Rendimiento (Estilo PowerBI)
1. **Área y Estado por Incidentes (Barras Horizontales Apiladas):**  
   Distribución visual por subsistema técnico segmentado en 3 colores: 🟢 Verde (*Cerrado/Resuelto*), 🟡 Amarillo (*En Proceso*), 🔴 Rojo (*Abierto*).
2. **Prioridad por Incidentes (Donut Chart SVG Puro):**  
   Gráfico de dona con contador central y desglose porcentual de criticidad (Alta/Crítica, Media, Baja).
3. **Evolución Anual y Mensual por Total Incidentes (Gráfico de Área / Spline SVG):**  
   Curva suavizada con degradado azul y nodos de datos que refleja la tendencia de la demanda operativa mes a mes durante 2026.
4. **Matriz de Técnicos & Productividad de TI (Tabla Matricial):**  
   Seguimiento de la carga operativa y SLA por especialista:
   * *Ing. Bryan Mango:* DBA / Especialista N3 (Base de Datos MySQL).
   * *Ing. Anthony Luque:* Ingeniero de Soporte ITN2 (Infraestructura & Red).
   * *MBA Mg. Ing. René Alonso Nieto:* CAB Chair / Arquitecto de TI (Gobernanza y Cambios).
   * *Mesa de Ayuda N1:* Atención inmediata de usuarios y accesos.

#### D. Módulo de Gestión Proactiva de Problemas (Problem Management & RCA)
* **Detección Algorítmica de Patrón:** Si un módulo acumula más de 2 incidentes en 48 horas (ej. contención de bloqueos en reservas concurrentes de MySQL), el sistema genera automáticamente una **Alerta RCA**.
* **Diagnóstico de Causa Raíz:** Documenta la contención por transacciones pesadas sobre el Master.
* **Solución Definitiva (KEDB - Known Error Database):** Registra formalmente la solución en la base de errores conocidos, enlazándola al cambio **RFC-2026-0042** (Enrutamiento inteligente de reportes masivos hacia la réplica MySQL Slave en puerto 3309).

#### E. Radar de las 4 Áreas CAB y Tabla de Tickets Pendientes (SLA en Vivo)
* **Radar CAB:** 4 tarjetas visuales categorizadas por color y estado (Infraestructura, Aplicaciones, Documentación, Calendario Freeze).
* **Tickets Pendientes:** Tabla con cronómetro de vencimiento y botón de acción para gestionar el ticket.

---

### Pestaña 2: Control de Cambios (CAB / RFC - Change Advisory Board)
**Objetivo ITIL:** *Change Enablement* (Habilitación del Cambio). Asegurar que cada modificación técnica sea evaluada, documentada y autorizada para maximizar el valor del negocio minimizando interrupciones no programadas.

#### Las 4 Áreas de Gobernanza CAB:
1. **Infraestructura (`INFRAESTRUCTURA`):** Redes, routers, switches, servidores cloud Azure, docker engine.
2. **Aplicaciones y BD (`APLICACIONES`):** Despliegues de código frontend/backend, pasarelas de pago (Nubiz), migraciones de base de datos.
3. **Documentación (`DOCUMENTACION`):** Manuales de contingencia, diagramas de arquitectura C4, actas de entrega.
4. **Calendario Freeze (`CALENDARIO`):** Ventanas de congelamiento de cambios (campañas altas como San Valentín o Día de la Madre) donde solo se admiten cambios de emergencia.

#### Anatomía Obligatoria de un RFC (Request for Change):
Cada RFC exige para su dictamen:
* **Código Oficial:** Ej. `RFC-2026-0042`.
* **Tipo de Cambio:** `NORMAL` (Sometido a evaluación del CAB), `EMERGENCIA` (Resolución de caída crítica) o `ESTANDAR` (Procedimiento recurrente preaprobado).
* **Nivel de Impacto / Riesgo:** `BAJO`, `MEDIO` o `ALTO`.
* **Ventana de Mantenimiento:** Horario programado de bajo tráfico (ej. Domingos 02:00 a 04:00 AM).
* **Plan de Rollback (Marcha Atrás) Obligatorio:** Pasos técnicos detallados para revertir el cambio si las pruebas post-despliegue fallan (ej. `docker compose down && git checkout commit_previo`).

#### Flujo de Dictamen del Comité CAB:
1. El especialista hace clic en **"Dictaminar / Aprobar CAB"**.
2. Se abre un modal con validación de:
   * **Presidente del Comité (CAB Chair):** Prellenado con *MBA Mg. Ing. René Alonso Nieto Valencia*.
   * **Número de Acta del Comité:** Formato formal `ACTA-CAB-2026-W11-001`.
3. Al dictaminar, el estado pasa a **`APROBADO`**, se registra la fecha/hora exacta y **se publica automáticamente un comentario de auditoría en el ticket vinculado de Jira Cloud**.

---

### Pestaña 3: Mesa de Ayuda (Service Desk & Gestión de Incidentes)
**Objetivo ITIL:** Punto Único de Contacto (SPOC) para atender incidencias y solicitudes de servicio restableciendo la operación normal lo más rápido posible.

#### Ciclo de Vida del Ticket:
```
[ABIERTO] ──▶ [EN_PROCESO] ──▶ [RESUELTO] ──▶ [CERRADO]
     │
     └── (Si requiere autorización) ──▶ [PENDIENTE_APROBACION] ──▶ [APROBADO]
```

#### Matriz de Prioridad e Impacto vs Acuerdos SLA:
| Prioridad | Nivel de Criticidad | Ventana SLA | Ejemplos en SUMAQ |
| :--- | :--- | :--- | :--- |
| **P1_CRITICA** | Caída total del servicio | **2 horas** | Bloqueo general de base de datos MySQL o caída de pasarela de pagos. |
| **P2_ALTA** | Degradación de función clave | **8 horas** | Falla de sincronización de réplica Master-Slave o lentitud en generación de facturas. |
| **P3_MEDIA** | Incidencia puntual con bypass | **24 horas** | Error visual en módulo de promociones o ajuste de campos en catálogo. |
| **P4_BAJA** | Consulta o requerimiento menor | **48 horas** | Actualización de documentación de contingencia o cambio estético de logo. |

#### Modal de Gestión y Resolución:
Permite a los técnicos de Nivel 1 o Nivel 2:
* Asignar el ticket a un especialista responsable.
* Cambiar el estado a `EN_PROCESO` o `RESUELTO`.
* Documentar la **Resolución Técnica** detallada (ej. scripts ejecutados, configuración modificada).
* Enlazar el Pull Request o Commit de GitHub (`github_url`).
* Vincular o actualizar la clave de Jira Cloud (`jira_key`).
* Al resolver, se cierra la ventana del cronómetro y se notifica al Jira Cloud.

---

## 3. MAPEO EXHAUSTIVO DEL CÓDIGO FUENTE (FRONTEND & BACKEND)

### A. Capa Frontend (React 19 + TypeScript + Tailwind CSS)

| Archivo | Ubicación en el Repositorio | Responsabilidad Principal |
| :--- | :--- | :--- |
| **`TIPortalPage.tsx`** | `frontend/src/pages/ti/TIPortalPage.tsx` | Componente maestro del Portal de TI. Contiene el estado de las 3 vistas (`DASHBOARD_PROBLEMAS`, `CONTROL_CAMBIOS`, `SERVICE_DESK`), los hooks `useMemo` para los gráficos interactivos, modales de CAB, Service Desk y Jira. |
| **`ticketStore.ts`** | `frontend/src/services/ticketStore.ts` | Servicio de acceso a datos. Conecta con el backend Django `/api/ti/tickets/`, maneja persistencia local en `localStorage` como fallback de contingencia y provee datos semilla de demostración. |
| **`tickets.ts`** | `frontend/src/types/tickets.ts` | Definiciones estrictas de TypeScript: interfaces `Ticket`, `ITILDashboardMetrics`, tipos `TicketStatus`, `TicketPriority`, `AreaCambio`, `TipoCambio`. |
| **`LoginPage.tsx`** | `frontend/src/pages/auth/LoginPage.tsx` | Página de autenticación con selector de 4 credenciales demostrativas en cuadrícula 2x2 e inicio de sesión en un clic hacia `/ti`. |
| **`AppRoutes.tsx`** | `frontend/src/routes/AppRoutes.tsx` | Definición de rutas protegidas mediante roles (`allowedRoles={['SOPORTE_TI', 'ADMIN']}`). |

### B. Capa Backend (Django 5.1 + Django REST Framework)

| Archivo | Ubicación en el Repositorio | Responsabilidad Principal |
| :--- | :--- | :--- |
| **`models.py`** | `backend/apps/ti/models.py` | Modelo de datos `Ticket`: almacena código, tipo, prioridad, módulo, solicitante, SLA, estado, campos de cambio CAB (`area_cambio`, `tipo_cambio`, `plan_rollback`, `cab_aprobador`, `cab_acta`), y claves de Atlassian Jira (`jira_key`, `jira_url`). |
| **`views.py`** | `backend/apps/ti/views.py` | `TicketViewSet`: endpoints REST CRUD y acciones especiales (`@action`):<br>• `create`: auto-asigna código y SLA, y crea el ticket en Jira v3.<br>• `aprobar`: aprobación de accesos por dueño.<br>• `cab_aprobar`: aprobación formal del Comité CAB.<br>• `resolver`: cierre técnico del ticket.<br>• `dashboard`: cálculo analítico de métricas ITIL y detección de RCA. |
| **`serializers.py`** | `backend/apps/ti/serializers.py` | Serializadores DRF para validación y conversión bidireccional entre JSON y modelos Python (`TicketSerializer`, `TicketCabAprobarSerializer`, etc.). |
| **`jira.py`** | `backend/apps/common/jira.py` | API Views de prueba de conexión y creación directa de issues contra Jira Cloud v3 en formato ADF. |
| **`health.py`** | `backend/apps/common/health.py` | `PrometheusMetricsView` (`/api/metrics/`) y `HealthCheckView` (`/api/health/`): expone métricas en formato estándar OpenMetrics para scraping de Prometheus. |
| **`seed_tickets.py`** | `backend/apps/ti/management/commands/seed_tickets.py` | Comando Django (`python manage.py seed_tickets`) que inicializa los 10 tickets ITIL realistas y garantiza la existencia del usuario `soporte.ti@sumaqspa.pe`. |

---

## 4. INTEGRACIÓN BIDIRECCIONAL CON ATLASSIAN JIRA CLOUD v3

### ¿Para qué sirve esta integración?
Permite la trazabilidad absoluta entre el **Portal Interno de Mesa de Ayuda de SUMAQ Spa** y el **Jira Software Cloud** utilizado por el equipo de ingeniería de software. Cada vez que una recepcionista o administrador registra una incidencia, los ingenieros pueden atenderla desde el tablero Kanban de Jira sin salir de su ecosistema de desarrollo.

### Parámetros de Conexión en Producción (Azure):
* **Jira Base URL:** `https://sumaq-dev.atlassian.net`
* **Usuario:** `rafaelramirez.utp@gmail.com`
* **Proyecto Clave:** `KAN` (Kanban Board)
* **Autenticación:** HTTP Basic Auth mediante **API Token oficial de Atlassian** codificado en `Base64`.

### Implementación Técnica en Código (`_call_jira_api` en `backend/apps/ti/views.py`):
1. **Creación Automática:** Al ejecutarse el método `create()` en `TicketViewSet`, se dispara un `POST` al endpoint de Atlassian:
   ```text
   https://sumaq-dev.atlassian.net/rest/api/3/issue
   ```
2. **Formato ADF (Atlassian Document Format):** Jira v3 rechaza texto plano en la descripción; el backend de SUMAQ genera la estructura en árbol JSON:
   ```json
   {
     "fields": {
       "project": {"key": "KAN"},
       "summary": "[RFC-2026-0042] Despliegue de Pasarela de Pagos",
       "description": {
         "type": "doc",
         "version": 1,
         "content": [
           {
             "type": "paragraph",
             "content": [{"type": "text", "text": "Detalle técnico del ticket..."}]
           }
         ]
       },
       "issuetype": {"name": "Task"}
     }
   }
   ```
3. **Auditoría en Jira al Aprobar o Resolver:** Cuando el Comité CAB dictamina un RFC o cuando un técnico resuelve un incidente, el backend invoca:
   ```text
   POST https://sumaq-dev.atlassian.net/rest/api/3/issue/{jira_key}/comment
   ```
   Insertando automáticamente un comentario con el nombre del aprobador, fecha y número de acta.

---

## 5. ECOSISTEMA DE MONITOREO: PROMETHEUS, GRAFANA Y MEMORIA CACHÉ REDIS

El monitoreo garantiza el principio ITIL de **"Gestión de la Capacidad y el Rendimiento"**.

```
[ Cliente Web / JMeter ]
          │ (Peticiones HTTP)
          ▼
   [ Nginx (Port 80) ]
          │
          ▼
 [ Django Backend (Port 8000) ] ◄── Cache L1 ──► [ Redis (Port 6379) ]
          │  (/api/metrics/)                              (Hit Ratio 88.5%)
          ▼
 [ Prometheus (Port 9090) ] (Scrape cada 3 segundos)
          │
          ▼
  [ Grafana (Port 3000) ] ── (Dashboards Visuales y Alertas de SLA)
```

### A. Prometheus (`http://68.155.146.110:9090`)
* **Función:** Base de datos de series de tiempo (*TSDB*). Ejecuta un sondeo (*scrape*) periódico cada 3 segundos hacia `backend:8000/api/metrics/`.
* **Configuración:** `monitoring/prometheus/prometheus.yml`.
* **Métricas Clave recolectadas:**
  * `sumaq_http_response_time_ms`: Tiempo de respuesta promedio (Alerta si supera 400 ms).
  * `sumaq_database_latency_ms`: Latencia de consulta a MySQL Master en milisegundos.
  * `sumaq_throughput_req_per_sec`: Tasa de peticiones procesadas por segundo.
  * `sumaq_cpu_usage_percent`: Porcentaje de utilización de CPU del servidor Azure.
  * `sumaq_redis_cache_hit_ratio`: Porcentaje de respuestas servidas desde memoria Redis.

### B. Grafana (`http://68.155.146.110:3000`)
* **Función:** Capa visual ejecutiva de alto impacto. Transforma las métricas crudas de Prometheus en indicadores de semáforo, tacómetros (*gauges*) y series de tiempo con gradientes.
* **Credenciales:** `admin` / `admin`
* **Dashboard Oficial:** `SUMAQ Spa - Capacidad y Rendimiento del Servicio`  
  Ruta directa: [http://68.155.146.110:3000/d/sumaq-performance-kpis/sumaq-spa-capacidad-y-rendimiento-del-servicio](http://68.155.146.110:3000/d/sumaq-performance-kpis/sumaq-spa-capacidad-y-rendimiento-del-servicio)
* **Aprovisionamiento Automático:** La configuración se carga como código (*Dashboard-as-Code*) desde `monitoring/grafana/provisioning/` y `monitoring/grafana/dashboards/sumaq_dashboard.json`, lo que permite levantar el entorno en cualquier nube en segundos.

### C. Servidor de Caché Redis (`Puerto 6379`)
* **¿Por qué se implementó?** El catálogo de masajes y servicios es consultado cientos de veces por minuto por los clientes web. Consultar MySQL en cada petición generaba contención de conexiones y elevaba la latencia a más de 1200 ms.
* **Solución Técnica:** Se implementó Redis 7 en memoria RAM como capa de caché L1 mediante `django-redis` en `backend/config/settings.py`.
* **Resultado Comprobado:** El tiempo de respuesta cayó a **~48 ms** y el 88.5% de las lecturas se resuelven en memoria sin tocar el disco de la base de datos.

---

## 6. ARQUITECTURA DE BASE DE DATOS: REPLICACIÓN MYSQL MASTER-SLAVE

Para garantizar el principio ITIL de **"Gestión de la Continuidad y Disponibilidad del Servicio"**, el sistema utiliza una topología replicada:

```
                  ┌────────────────────────────────────────┐
                  │          DJANGO BACKEND REST           │
                  └───────────────────┬────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │ (Escrituras Atómicas)                   │ (Lecturas Masivas)
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │    MYSQL MASTER (3308)    │ ──────────► │    MYSQL SLAVE (3309)     │
   │   (binlog-format=ROW)     │ Replicación │      (read-only=1)        │
   │ server-id=1 / Transacciones│ Binaria     │ server-id=2 / Reportes    │
   └───────────────────────────┘             └───────────────────────────┘
```

1. **MySQL Master (Puerto 3308):**
   * Configurado en `docker-compose.yml` con `--server-id=1`, `--log-bin=mysql-bin` y formato de registro binario por filas (`ROW`).
   * Maneja todas las operaciones transaccionales críticas: cobro de citas, registro de atenciones clínicas y movimientos de inventario.
2. **MySQL Slave (Puerto 3309):**
   * Configurado con `--server-id=2`, `--read-only=1` y seguimiento de logs de retransmisión (`mysql-relay-bin`).
   * Recibe la réplica binaria en tiempo real desde el Master y absorbe las consultas pesadas de reportes ejecutivos y analítica, evitando el bloqueo de tablas en producción.
3. **Solución Documentada en KEDB (RFC-2026-0042):**
   * Esta arquitectura es el resultado directo de la investigación de causa raíz documentada en el portal de TI, donde se aisló la carga analítica hacia el esclavo 3309.

---

## 7. PRUEBAS DE CAPACIDAD Y RENDIMIENTO: APACHE JMETER & PYTHON LOAD TEST

### Objetivo de la Prueba
Evaluar el comportamiento del sistema ante un pico de demanda simulando **20 usuarios concurrentes** atacando el endpoint de catálogo de servicios (`/api/servicios/`) en la máquina de Azure (`68.155.146.110`).

### Criterios de Aceptación (SLA ITIL v4):
* **Disponibilidad:** Tasa de error HTTP del `0.00%` (Ningún fallo de servidor 500 o timeout 504).
* **Tiempo de Respuesta (Response Time):** Promedio y Percentil 95 (P95) estrictamente menores a **`400 ms`**.
* **Capacidad de Procesamiento:** Throughput superior a **`20 peticiones por segundo`**.

### Resultados Reales Obtenidos en Azure:
```text
======================================================================
   SUMAQ SPA - PRUEBA DE RENDIMIENTO Y CAPACIDAD (ITIL v4)
   Objetivo: http://68.155.146.110/api/servicios/
   Usuarios concurrentes: 20 | Peticiones totales: 40
======================================================================
  * Peticiones Totales Ejecutadas : 40
  * Peticiones Exitosas (HTTP 200): 40 (100.0%)
  * Peticiones Fallidas           : 0
  * Tasa de Error                 : 0.00% (Meta SLA: < 0.1%)
  * Tiempo Total de la Prueba     : 1.71 s
  * Throughput (Rendimiento)      : 23.37 req/s
  * Latencia Promedio (Avg)       : 324.97 ms (Meta SLA: < 400 ms)
  * Latencia Percentil 95 (P95)   : 343.04 ms
======================================================================
  >>> EVALUACION SLA: APROBADO CUMPLE CON LOS CRITERIOS DE RENDIMIENTO <<<
======================================================================
```

### Scripts Listos para Demostración:
* **Script Ligero de Python:** `python tests/performance/correr_prueba_rapida.py` (Muestra métricas y veredicto SLA en 2 segundos sin dependencias externas).
* **JMeter CLI:** `ejecutar_jmeter_cli.bat` (Genera un reporte HTML con métricas APDEX en `tests/performance/reporte_html/index.html`).
* **JMeter GUI:** `ejecutar_jmeter_gui.bat` (Abre el árbol visual con `View Results Tree` y gráficos de percentiles).

---

## 8. BANCO DE PREGUNTAS TÍPICAS DEL JURADO / PROFESOR CON RESPUESTAS TÉCNICAS

### P1: ¿Cuál es la diferencia entre un Incidente y un Problema según ITIL v4 en SUMAQ Spa?
> **Respuesta:**  
> Un **Incidente** es una interrupción no planificada o reducción en la calidad de un servicio (por ejemplo, el ticket `REQ-2026-0025`: lentitud en el guardado de una reserva). Su objetivo inmediato es restaurar el servicio lo más rápido posible.  
> Un **Problema** es la causa subyacente o potencial de uno o varios incidentes. En SUMAQ, nuestro motor de **Problem Management** detectó que la causa raíz era la contención de bloqueos pesimistas en MySQL Master bajo concurrencia, lo cual generó un registro en la **KEDB (Known Error Database)** y un cambio formal **RFC-2026-0042** para desacoplar lecturas hacia el Slave 3309.

### P2: ¿Por qué tienen un Comité de Cambios (CAB) y no suben los cambios directamente a producción?
> **Respuesta:**  
> Siguiendo la práctica de *Change Enablement* de ITIL v4, el CAB evalúa el impacto en el negocio, el riesgo y la ventana de mantenimiento antes de autorizar cualquier paso a producción. Además, en SUMAQ todo RFC debe presentar obligatoriamente un **Plan de Rollback** probado (pasos para retroceder la versión en menos de 5 minutos si algo sale mal). Esto garantiza que no se afecte la facturación ni la atención de clientes en el spa.

### P3: ¿Cómo interactúan Prometheus y Grafana en su arquitectura?
> **Respuesta:**  
> **Prometheus** actúa como el recolector y base de datos métrica de series de tiempo (*Scraper/TSDB*); cada 3 segundos consulta nuestro endpoint `/api/metrics/` de Django.  
> **Grafana** es el motor visual de presentación ejecutiva que consume los datos de Prometheus y los proyecta en gráficos de SLAs, tacómetros y alertas en tiempo real. Prometheus guarda los números y Grafana genera la inteligencia operativa visual para la toma de decisiones.

### P4: ¿Por qué decidieron usar Redis si MySQL ya guarda los datos?
> **Respuesta:**  
> Por un criterio estricto de **Gestión de la Capacidad**: MySQL guarda los datos en disco con integridad referencial ACID, pero ante ráfagas de 20 o 50 usuarios concurrentes, el I/O de disco y las conexiones a la base de datos se saturan elevando la latencia a más de 1 segundo. Redis opera 100% en memoria RAM; al almacenar en caché el catálogo de masajes y promociones por 5 minutos, logramos un **Cache Hit Ratio del 88.5%**, bajando la latencia a **~48 ms** y cumpliendo con creces el SLA pactado (< 400 ms).

### P5: ¿Cómo garantizan que la comunicación con Atlassian Jira Cloud sea segura?
> **Respuesta:**  
> La integración se implementó mediante la **API v3 de Atlassian** con cifrado HTTPS TLS 1.3. La autenticación se realiza con un API Token de Atlassian generado específicamente para el proyecto y transmitido en encabezados HTTP Basic con codificación Base64. El backend de Django actúa como proxy seguro, evitando exponer el token en el código fuente del frontend del navegador.
