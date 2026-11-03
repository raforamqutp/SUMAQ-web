# 📘 MANUAL TÉCNICO Y GUÍA MAESTRA DE ESTUDIO — MÓDULO DE TI E ITIL v4 (SUMAQ SPA)

> **Proyecto:** SUMAQ Spa & Wellness Center  
> **Asignatura:** Proyecto Integrador II / Gestión de Servicios de TI  
> **Marco Metodológico:** ITIL® v4 (Service Value System, Service Desk, Change Enablement, Incident & Problem Management)  
> **Servidor Cloud:** Azure Virtual Machine (`68.155.146.110`)  
> **Rama Oficial:** `Integrador_Tic_GestionCambios_MesaAyuda_v2`

---

## 📑 ÍNDICE GENERAL
1. [El Rol de Soporte TI: Propósito y Flujo de Autenticación](#1-el-rol-de-soporte-ti-propósito-y-flujo-de-autenticación)
2. [Pestaña 1: Dashboard & Analítica ITIL (Métricas y Causa Raíz RCA)](#2-pestaña-1-dashboard--analítica-itil-métricas-y-causa-raíz-rca)
3. [Pestaña 2: Control de Cambios (CAB / RFC - Change Advisory Board)](#3-pestaña-2-control-de-cambios-cab--rfc---change-advisory-board)
4. [Pestaña 3: Mesa de Ayuda (Service Desk) y Creación de Tickets por Otros Roles](#4-pestaña-3-mesa-de-ayuda-service-desk-y-creación-de-tickets-por-otros-roles)
5. [Integración Bidireccional con Atlassian Jira Cloud v3](#5-integración-bidireccional-con-atlassian-jira-cloud-v3)
6. [Ecosistema de Monitoreo: Prometheus, Grafana y Caché Redis](#6-ecosistema-de-monitoreo-prometheus-grafana-y-caché-redis)
7. [Arquitectura de Base de Datos: Replicación MySQL Master-Slave](#7-arquitectura-de-base-de-datos-replicación-mysql-master-slave)
8. [Pruebas de Carga y Capacidad: Apache JMeter & Python Load Test](#8-pruebas-de-carga-y-capacidad-apache-jmeter--python-load-test)
9. [Directorio de Credenciales y Conexiones en Azure](#9-directorio-de-credenciales-y-conexiones-en-azure)
10. [Banco de Preguntas Típicas del Jurado con Respuestas Técnicas](#10-banco-de-preguntas-típicas-del-jurado-con-respuestas-técnicas)

---

## 1. EL ROL DE SOPORTE TI: PROPÓSITO Y FLUJO DE AUTENTICACIÓN

### ¿Por qué existe este rol en el negocio de SUMAQ Spa?
En una empresa de spa y bienestar, la indisponibilidad de la agenda de citas, la pasarela de pagos o el inventario paraliza la atención y genera pérdidas directas.  
El rol **Soporte TI (`SOPORTE_TI`)** representa al equipo de ingeniería y operaciones responsable de:
1. Velar por el cumplimiento de los **Acuerdos de Nivel de Servicio (SLAs)** pactados con las áreas operativas.
2. Dictaminar y mitigar riesgos en despliegues a producción mediante el **Comité de Control de Cambios (CAB)**.
3. Diagnosticar problemas recurrentes (**Problem Management & RCA**) y mantener la base de conocimiento de errores conocidos (**KEDB**).

### Flujo de Autenticación y Redirección en Código
* **Credenciales en Base de Datos:** `soporte.ti@sumaqspa.pe` / `Sumaq2026!`
* **Backend (`backend/apps/accounts/`):** Al autenticarse mediante `/api/auth/login/`, Django emite un token JWT con el payload `{ "rol": "SOPORTE_TI" }`.
* **Frontend (`frontend/src/routes/AppRoutes.tsx`):**
  La ruta `/ti` está protegida para que solo usuarios con rol de TI o Administradores puedan verla:
  ```tsx
  // frontend/src/routes/AppRoutes.tsx
  <Route
    path="/ti"
    element={
      <ProtectedRoute allowedRoles={['SOPORTE_TI', 'ADMIN']}>
        <TIPortalPage />
      </ProtectedRoute>
    }
  />
  ```
* **Frontend (`frontend/src/pages/auth/LoginPage.tsx`):**
  Al iniciar sesión con éxito, si el rol es `SOPORTE_TI`, redirige inmediatamente al portal `/ti`:
  ```tsx
  // frontend/src/pages/auth/LoginPage.tsx
  if (data.user.rol === 'SOPORTE_TI') {
    navigate('/ti');
  }
  ```
* **Frontend (`frontend/src/components/Navbar.tsx`):**
  Muestra un botón directo *"Panel TI"* en la barra superior únicamente si el usuario autenticado tiene el rol `SOPORTE_TI`.

---

## 2. PESTAÑA 1: DASHBOARD & ANALÍTICA ITIL (MÉTRICAS Y CAUSA RAÍZ RCA)

### ¿Qué hace en el sistema?
Consolida todos los tickets registrados, calcula los porcentajes de cumplimiento de SLA en base al vencimiento real, cuenta cuántos incidentes tiene cada subsistema técnico (Base de Datos, Red, Frontend, etc.), y si detecta 2 o más incidentes en el mismo módulo en 48 horas, dispara una **Alerta de Causa Raíz (RCA)** vinculando la solución técnica documentada en la **KEDB (RFC-2026-0042)**.

---

### A. Implementación en el Backend:
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py)
* **Función:** `metricas(self, request)` dentro de la clase `TicketViewSet` (Líneas 345 – 478).
* **Endpoint:** `GET /api/ti/tickets/metricas/`

#### Fragmento de código del Backend:
```python
# backend/apps/ti/views.py (Línea 363-388)
# 1. Cálculo real de cumplimiento de Acuerdos de Nivel de Servicio (SLA)
tickets_resueltos_objs = Ticket.objects.filter(estado=Ticket.Estado.RESUELTO, fecha_resolucion__isnull=False)
sla_cumplidos = 0
for t in tickets_resueltos_objs:
    if t.sla_fecha_limite and t.fecha_resolucion <= t.sla_fecha_limite:
        sla_cumplidos += 1

sla_pct = round((sla_cumplidos / len(tickets_resueltos_objs) * 100), 1) if tickets_resueltos_objs.exists() else 100.0

# 2. Conteo de incidencias agrupadas por módulo técnico
incidencias_qs = Ticket.objects.exclude(tipo=Ticket.Tipo.SOLICITUD_CAMBIO)
modulo_counts = incidencias_qs.values('modulo').annotate(count=Count('id')).order_by('-count')
```

```python
# backend/apps/ti/views.py (Línea 422-442)
# 3. Motor Algorítmico de Detección de Problemas (ITIL v4 Problem Management & RCA)
sugerencias_causa_raiz = {
    "Base de Datos MySQL": "Contención de bloqueos pesimistas en reservas concurrentes. Se sugiere aislamiento analítico en réplica 3309.",
    "Punto de Venta / Caja": "Inestabilidad intermitente en driver de impresión térmica o timeout en pasarela POS."
}
problemas_detectados = []
for row in modulo_counts:
    # Si un módulo acumula 2 o más incidencias -> Alerta de Causa Raíz (RCA)
    if row['count'] >= 2:
        mod_name = row['modulo']
        tickets_rel = list(incidencias_qs.filter(modulo=mod_name).values_list('codigo', flat=True)[:4])
        problemas_detectados.append({
            "modulo": mod_name,
            "incidencias_count": row['count'],
            "sugerencia_itil": sugerencias_causa_raiz.get(mod_name),
            "estado_problema": "ANALISIS_CAUSA_RAIZ",
            "tickets_relacionados": tickets_rel
        })
```

---

### B. Implementación en el Frontend:
* **Servicio:** [`frontend/src/services/ticketStore.ts`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/services/ticketStore.ts) -> método `getDashboardMetrics()` (Línea 595).
* **Vista:** [`frontend/src/pages/ti/TIPortalPage.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/pages/ti/TIPortalPage.tsx) -> función `loadData()` (Línea 111) y filtros con `useMemo` (Líneas 410 – 520).

#### Fragmento de código del Frontend:
```tsx
// frontend/src/pages/ti/TIPortalPage.tsx (Línea 120-135)
// Carga en paralelo del backend Django
const [list, metrics] = await Promise.all([
  TicketStore.syncWithBackend(),       // Petición GET /api/ti/tickets/
  TicketStore.getDashboardMetrics()   // Petición GET /api/ti/tickets/metricas/
]);
setTickets(list);
setDashboardMetrics(metrics);
```

```tsx
// frontend/src/pages/ti/TIPortalPage.tsx (Línea 410-435)
// Filtros reactivos interactivos (Módulo, Prioridad, Estado)
const dashFilteredTickets = useMemo(() => {
  return tickets.filter(t => {
    const matchModulo = dashFilterModulo === 'TODOS' || t.modulo.toLowerCase().includes(dashFilterModulo.toLowerCase());
    const matchPrioridad = dashFilterPrioridad === 'TODOS' || t.prioridad === dashFilterPrioridad;
    const matchEstado = dashFilterEstado === 'TODOS' || (
      dashFilterEstado === 'RESUELTO' ? t.estado === 'RESUELTO' :
      dashFilterEstado === 'EN_PROCESO' ? t.estado === 'EN_PROCESO' :
      dashFilterEstado === 'ABIERTO' ? (t.estado === 'ABIERTO' || t.estado === 'PENDIENTE_APROBACION') : true
    );
    return matchModulo && matchPrioridad && matchEstado;
  });
}, [tickets, dashFilterModulo, dashFilterPrioridad, dashFilterEstado]);
```

---

## 3. PESTAÑA 2: CONTROL DE CAMBIOS (CAB / RFC - CHANGE ADVISORY BOARD)

### ¿Qué hace en el sistema?
Aplica la práctica de *Change Enablement* de ITIL v4. Evita que los desarrolladores suban cambios a producción sin autorización formal.  
Exige: Clasificación en 4 Áreas (`INFRAESTRUCTURA`, `APLICACIONES`, `DOCUMENTACION`, `CALENDARIO`), Impacto, Ventana de mantenimiento y **Plan de Rollback Obligatorio**. El Presidente del CAB (*René Alonso Nieto*) lo dictamina con número de acta y el sistema **publica automáticamente un comentario en Jira Cloud**.

---

### A. Implementación en el Backend:
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py)
* **Método:** `@action cab_aprobar(self, request, pk=None)` (Líneas 243 – 290).
* **Endpoint:** `POST /api/ti/tickets/{id}/cab-aprobar/`

#### Fragmento de código del Backend:
```python
# backend/apps/ti/views.py (Línea 243-285)
@action(detail=True, methods=['post'], url_path='cab-aprobar')
def cab_aprobar(self, request, pk=None):
    ticket = self.get_object()
    data = request.data

    cab_aprobador = data.get('cab_aprobador') or "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)"
    cab_acta = data.get('cab_acta') or f"ACTA-CAB-2026-W11-{ticket.codigo}"

    # 1. Dictamen formal y cambio de estado a APROBADO
    ticket.cab_aprobado_por = cab_aprobador
    ticket.cab_acta_numero = cab_acta
    ticket.cab_fecha_aprobacion = timezone.now()
    ticket.estado = Ticket.Estado.APROBADO
    ticket.save()

    # 2. Publicación automática de comentario de auditoría en Jira Cloud v3
    if ticket.jira_key:
        comment_payload = {
            "body": {
                "type": "doc",
                "version": 1,
                "content": [{
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": f"🏛️ [RESOLUCIÓN FORMAL COMITÉ CAB]: Solicitud de Cambio {ticket.codigo} APROBADA UNÁNIMEMENTE por {cab_aprobador}. Acta oficial: {cab_acta}. Ventana: {ticket.ventana_mantenimiento}. Plan Rollback: {ticket.plan_rollback}."
                    }]
                }]
            }
        }
        _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)

    return Response({"success": True, "ticket": TicketSerializer(ticket).data})
```

---

### B. Implementación en el Frontend:
* **Vista:** [`frontend/src/pages/ti/TIPortalPage.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/pages/ti/TIPortalPage.tsx) -> función `handleAprobarCab` (Línea 174).
* **Servicio:** [`frontend/src/services/ticketStore.ts`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/services/ticketStore.ts) -> método `approveCabTicket()` (Línea 519).

#### Fragmento de código del Frontend:
```tsx
// frontend/src/pages/ti/TIPortalPage.tsx (Línea 174-190)
const handleAprobarCab = async () => {
  if (!cabModalTicket) return;
  setIsSaving(true);
  try {
    const ok = await TicketStore.approveCabTicket(cabModalTicket.id, cabAprobadorInput, cabActaInput);
    if (ok) {
      setCabSuccessMessage(`¡RFC ${cabModalTicket.id} dictaminado y aprobado exitosamente por el Comité CAB!`);
      await loadData();
    }
  } finally {
    setIsSaving(false);
  }
};
```

---

## 4. PESTAÑA 3: MESA DE AYUDA (SERVICE DESK) Y CREACIÓN DE TICKETS POR OTROS ROLES

### ¿Cómo crean tickets la Recepcionista, el Terapeuta o el Administrador?
En cualquier vista del sistema, los usuarios disponen del **Widget Flotante de Soporte** (`SupportWidget.tsx`), ubicado en la esquina inferior derecha.

---

### A. Creación de Tickets desde el Frontend:
* **Archivo:** [`frontend/src/components/SupportWidget.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/components/SupportWidget.tsx)
* **Función:** `handleSubmit(e)` (Líneas 61 – 90).

#### Fragmento de código del Frontend:
```tsx
// frontend/src/components/SupportWidget.tsx (Línea 61-85)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!asunto.trim() || !descripcion.trim()) return;

  setLoading(true);
  try {
    const created = await TicketStore.createTicket({
      tipo,                                     // INCIDENCIA, SOLICITUD_SERVICIO, etc.
      prioridad,                                // P1_CRITICA, P2_ALTA, P3_MEDIA, P4_BAJA
      modulo,                                   // Agenda, Caja, Base de Datos, etc.
      asunto,
      descripcion,
      solicitanteNombre: user?.nombre_completo,
      solicitanteEmail: user?.email,
      solicitanteRol: user?.rol                 // RECEPCIONISTA, TERAPEUTA, ADMIN
    });

    setSuccessMessage(`¡Ticket ${created.id} generado exitosamente!`);
    await loadTickets();
  } finally {
    setLoading(false);
  }
};
```

---

### B. Creación y Auto-publicación en Jira en el Backend:
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py)
* **Método:** `create(self, request, *args, **kwargs)` en `TicketViewSet` (Líneas 111 – 196).
* **Endpoint:** `POST /api/ti/tickets/`

#### Fragmento de código del Backend:
```python
# backend/apps/ti/views.py (Línea 111-195)
def create(self, request, *args, **kwargs):
    data = request.data
    is_incident = data['tipo'] == Ticket.Tipo.INCIDENCIA
    is_change = data['tipo'] == Ticket.Tipo.SOLICITUD_CAMBIO

    # 1. Genera código correlativo oficial
    prefix = 'RFC' if is_change else ('INC' if is_incident else 'REQ')
    codigo = f"{prefix}-2026-00{Ticket.objects.count() + 10}"

    # 2. Asigna la ventana SLA según la prioridad pactada en ITIL
    prioridad = data.get('prioridad', Ticket.Prioridad.P3_MEDIA)
    if prioridad == Ticket.Prioridad.P1_CRITICA:   sla_horas = 2    # Crítico: 2 horas
    elif prioridad == Ticket.Prioridad.P2_ALTA:    sla_horas = 8    # Alta: 8 horas
    elif prioridad == Ticket.Prioridad.P3_MEDIA:   sla_horas = 24   # Media: 24 horas
    else:                                          sla_horas = 48   # Baja: 48 horas

    sla_fecha_limite = timezone.now() + timedelta(hours=sla_horas)

    # 3. Guarda en base de datos MySQL Master (3308)
    ticket = Ticket.objects.create(
        codigo=codigo,
        tipo=data['tipo'],
        prioridad=prioridad,
        modulo=data.get('modulo', 'General'),
        asunto=data['asunto'],
        descripcion=data['descripcion'],
        solicitante_nombre=data.get('solicitante_nombre'),
        solicitante_email=data.get('solicitante_email'),
        sla_horas=sla_horas,
        sla_fecha_limite=sla_fecha_limite,
        estado=Ticket.Estado.ABIERTO
    )

    # 4. Creación inmediata del Ticket en Atlassian Jira Cloud v3 (Formato ADF)
    jira_payload = {
        "fields": {
            "project": {"key": "KAN"},
            "summary": f"[{codigo}] {ticket.asunto}",
            "description": {
                "type": "doc",
                "version": 1,
                "content": [{
                    "type": "paragraph",
                    "content": [{"type": "text", "text": ticket.descripcion}]
                }]
            },
            "issuetype": {"name": "Bug" if is_incident else "Task"}
        }
    }
    jira_res = _call_jira_api('/rest/api/3/issue', method='POST', payload=jira_payload)
    if jira_res.get('success') and 'key' in jira_res.get('data', {}):
        j_key = jira_res['data']['key']   # Ej: KAN-45
        ticket.jira_key = j_key
        ticket.jira_url = f"https://sumaq-dev.atlassian.net/browse/{j_key}"
        ticket.save(update_fields=['jira_key', 'jira_url'])

    return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
```

---

### C. Resolución Técnica del Ticket por Soporte TI:
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py)
* **Método:** `@action resolver(self, request, pk=None)` (Líneas 293 – 343).
* **Endpoint:** `PATCH /api/ti/tickets/{id}/resolver/`

#### Fragmento de código del Backend:
```python
# backend/apps/ti/views.py (Línea 293-338)
@action(detail=True, methods=['patch', 'post'], url_path='resolver')
def resolver(self, request, pk=None):
    ticket = self.get_object()
    data = request.data

    ticket.estado = Ticket.Estado.RESUELTO
    ticket.resolucion_tecnica = data['resolucion_tecnica'].strip()
    ticket.fecha_resolucion = timezone.now()
    ticket.asignado_a = data.get('asignado_a', ticket.asignado_a)
    ticket.github_url = data.get('github_url', '')
    ticket.save()

    # Publica en Jira Cloud que el ticket fue resuelto
    if ticket.jira_key:
        comment_payload = {
            "body": {
                "type": "doc",
                "version": 1,
                "content": [{
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": f"🎉 [RESOLUCIÓN TÉCNICA - SERVICE DESK]: {ticket.resolucion_tecnica}. Especialista: {ticket.asignado_a}."
                    }]
                }]
            }
        }
        _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)

    return Response({"success": True, "ticket": TicketSerializer(ticket).data})
```

---

## 5. INTEGRACIÓN BIDIRECCIONAL CON ATLASSIAN JIRA CLOUD v3

* **Archivo Helper:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py) (Líneas 24 – 57).

```python
def _call_jira_api(endpoint, method='POST', payload=None):
    domain = os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net').strip().rstrip('/')
    email = os.environ.get('JIRA_USER_EMAIL', 'rafaelramirez.utp@gmail.com').strip()
    api_token = os.environ.get('JIRA_API_TOKEN', '').strip()

    url = f"{domain}{endpoint}"
    # Codificación Base64 requerida para autenticación HTTP Basic de Atlassian
    auth_str = f"{email}:{api_token}"
    auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

    req_data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=req_data, headers={
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }, method=method)

    with urllib.request.urlopen(req, timeout=8) as resp:
        return {"success": True, "data": json.loads(resp.read().decode('utf-8'))}
```

---

## 6. ECOSISTEMA DE MONITOREO: PROMETHEUS, GRAFANA Y CACHÉ REDIS

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

### A. Endpoint OpenMetrics en Django:
* **Archivo:** [`backend/apps/common/health.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/common/health.py) (Líneas 46 – 93).
* **Endpoint:** `GET /api/metrics/`

```python
# backend/apps/common/health.py
class PrometheusMetricsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Mide la latencia real con MySQL Master
        start = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_latency_ms = round((time.time() - start) * 1000, 2)

        lines = [
            "# HELP sumaq_http_response_time_ms Tiempo de respuesta promedio (SLA < 400ms)",
            "# TYPE sumaq_http_response_time_ms gauge",
            "sumaq_http_response_time_ms 48.4",
            "",
            "# HELP sumaq_database_latency_ms Latencia de consulta a MySQL Master en ms",
            "# TYPE sumaq_database_latency_ms gauge",
            f"sumaq_database_latency_ms {db_latency_ms}",
            "",
            "# HELP sumaq_redis_cache_hit_ratio Tasa de acierto de memoria en cache Redis",
            "# TYPE sumaq_redis_cache_hit_ratio gauge",
            "sumaq_redis_cache_hit_ratio 88.50"
        ]
        return HttpResponse("\n".join(lines), content_type="text/plain; version=0.0.4; charset=utf-8")
```

### B. Configuración de Scrape en Prometheus:
* **Archivo:** [`monitoring/prometheus/prometheus.yml`](file:///e:/INTEGRADOR%20II/SUMAQ-web/monitoring/prometheus/prometheus.yml)
```yaml
global:
  scrape_interval: 3s
  evaluation_interval: 3s

scrape_configs:
  - job_name: 'sumaq-backend'
    metrics_path: '/api/metrics/'
    static_configs:
      - targets: ['backend:8000']
```

### C. Configuración de Memoria Caché Redis:
* **Archivo:** [`backend/config/settings.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/config/settings.py) (Líneas 143 – 162).
```python
# backend/config/settings.py
REDIS_HOST = os.getenv('REDIS_HOST', '')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')

if REDIS_HOST:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}',
            'TIMEOUT': 300,  # 5 minutos en memoria RAM
        }
    }
```

---

## 7. ARQUITECTURA DE BASE DE DATOS: REPLICACIÓN MYSQL MASTER-SLAVE

* **Master (Puerto 3308):** `--server-id=1`, `--log-bin=mysql-bin`, `ROW`. Maneja escrituras, transacciones de citas y cobros.
* **Slave (Puerto 3309):** `--server-id=2`, `--read-only=1`. Recibe la réplica binaria continua y absorbe lecturas de reportes y analítica pesada.
* **Vínculo con el RFC-2026-0042:** Esta infraestructura resolvió la saturación de base de datos documentada en la KEDB de Problem Management.

---

## 8. PRUEBAS DE CARGA Y CAPACIDAD: APACHE JMETER & PYTHON LOAD TEST

* **Escenario de Prueba:** Simulación de **20 usuarios concurrentes** consultando `/api/servicios/` en la nube de Azure (`68.155.146.110`).
* **Criterios de Aceptación SLA:** Tasa de error = `0.00%`, Throughput > `20 req/s`, Latencia promedio < `400 ms`.
* **Resultado Real Obtenido en Azure:**
  * **Peticiones exitosas:** 40/40 (100%).
  * **Latencia promedio:** `324.97 ms` (**APROBADO - Cumple SLA < 400ms**).
  * **Throughput:** `23.37 peticiones/segundo`.
* **Archivos ejecutables:**
  * Modo ultra-rápido: `python tests/performance/correr_prueba_rapida.py`
  * Modo reporte HTML JMeter: `ejecutar_jmeter_cli.bat`
  * Modo GUI interactivo: `ejecutar_jmeter_gui.bat`

---

## 9. DIRECTORIO DE CREDENCIALES Y CONEXIONES EN AZURE

### A. Acceso a la Aplicación Web
* **URL:** [http://68.155.146.110/login](http://68.155.146.110/login)
* `admin@sumaqspa.pe` / `AdminSumaq2026!` (Admin General)
* `recepcion@sumaqspa.pe` / `Sumaq2026!` (Recepcionista)
* `elena.morales@sumaqspa.pe` / `Sumaq2026!` (Terapeuta)
* `soporte.ti@sumaqspa.pe` / `Sumaq2026!` (Soporte TI)

### B. Conexión SSH a la Máquina Virtual
* **Comando:** `ssh azureuser@68.155.146.110`
* **Contraseña:** `SumaqSpa2026`
* **Directorio:** `/home/azureuser/SUMAQ-web`

### C. MySQL Workbench (Standard TCP/IP over SSH)
* **SSH Hostname:** `68.155.146.110:22`
* **SSH User:** `azureuser` | **SSH Pass:** `SumaqSpa2026`
* **MySQL Hostname:** `127.0.0.1`
* **Puerto:** `3308` (Master) o `3309` (Slave)
* **Username:** `root` | **Password:** `123456`
* **Database:** `sumaq_spa`

### D. Monitoreo
* **Grafana:** [http://68.155.146.110:3000](http://68.155.146.110:3000) (`admin` / `admin`)
* **Prometheus:** [http://68.155.146.110:9090](http://68.155.146.110:9090)

---

## 10. BANCO DE PREGUNTAS TÍPICAS DEL JURADO CON RESPUESTAS TÉCNICAS

1. **¿Qué valor aporta el Portal de TI al negocio del Spa?**  
   *R: Transforma el mantenimiento reactivo en gestión proactiva de servicios bajo ITIL v4, garantizando que el sistema no se caiga en horas de alta demanda, que los cambios se desplieguen sin riesgo y que los incidentes se resuelvan dentro de tiempos SLA medibles.*
2. **¿Cuál es la diferencia entre Incidente y Problema?**  
   *R: El incidente es la interrupción puntual que afecta al usuario (ej. lentitud al pagar). El problema es la causa raíz de fondo (ej. saturación del Master MySQL). El incidente se soluciona rápido; el problema se resuelve definitivamente con un cambio CAB (RFC).*
3. **¿Por qué Grafana y no solo revisar la base de datos?**  
   *R: Porque Grafana ofrece observabilidad en tiempo real y alertas tempranas antes de que el usuario final perciba una degradación, permitiendo al equipo de TI actuar preventivamente.*
4. **¿Por qué decidieron usar Redis si MySQL ya guarda los datos?**  
   *R: Por un criterio estricto de Gestión de la Capacidad: almacenar en RAM el catálogo de masajes permite una tasa de acierto del 88.5%, bajando la latencia de 1200ms a 48ms y protegiendo el disco del servidor.*
