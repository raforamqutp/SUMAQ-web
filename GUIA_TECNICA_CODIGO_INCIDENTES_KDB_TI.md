# MANUAL TÉCNICO Y ARQUITECTURA DE CÓDIGO
## GESTIÓN DE INCIDENTES, SERVICE DESK, CONTROL DE CAMBIOS (CAB) Y BASE DE CONOCIMIENTO (KDB)
### PLATAFORMA INTEGRAL SUMAQ SPA & WELLNESS (ITIL v4 & ISO/IEC 20000-1)

---

| **PROYECTO** | **SUMAQ-web: Sistema Integral de Gestión, Citas, POS y Telemetría TI** |
| :--- | :--- |
| **Documento:** | Manual de Implementación Técnica de Código Fuente (Frontend & Backend) |
| **Curso:** | Curso Integrador II: Sistemas (Semana 14) |
| **Docente:** | MBA Mg. Ing. Rene Alonso Nieto Valencia |
| **Rama Git:** | `Integrador_Tic_GestionCambios_MesaAyuda_v2` |
| **Versión:** | 2.5 (Producción Docker & Cloud Azure) |

---

## 1. MAPA GENERAL DE ARCHIVOS DEL MÓDULO DE TI E INCIDENTES

El subsistema de Operaciones TI, Gestión de Incidentes y Service Desk de SUMAQ está desacoplado limpiamente entre el frontend (React 18 + TypeScript) y el backend (Django REST Framework + Python 3.12):

```
SUMAQ-web/
├── frontend/src/
│   ├── pages/ti/
│   │   └── TIPortalPage.tsx              <-- Consola Central TI (Dashboard, CAB, Service Desk y KDB)
│   ├── components/common/
│   │   └── SupportWidget.tsx             <-- Widget flotante para reporte de tickets desde cualquier rol
│   ├── services/
│   │   └── ticketStore.ts                <-- Gestor de estado local y sincronización con API REST
│   └── types/
│       └── tickets.ts                    <-- Interfaces TypeScript (Ticket, KDBArticle, SLA, Métricas)
│
├── backend/apps/ti/
│   ├── models.py                         <-- Modelo ORM Ticket (Tipos, Prioridades, SLAs, CAB, Jira)
│   ├── views.py                          <-- ViewSet CRUD, SLAs, Aprobaciones CAB, Jira Sync y Algoritmo RCA
│   ├── serializers.py                    <-- Validadores de datos JSON para tickets y aprobaciones
│   ├── urls.py                           <-- Endpoints REST (/api/ti/tickets/, /api/ti/analitica/)
│   └── management/commands/
│       └── seed_tickets.py               <-- Sembrador automatizado de tickets iniciales para auditoría
│
└── monitoring/
    ├── prometheus/prometheus.yml         <-- Scraping autónomo de telemetría cada 5 segundos
    └── grafana/provisioning/             <-- Dashboards visuales de métricas en puerto 3000
```

---

## 2. LA BASE DE CONOCIMIENTO (KDB - KNOWN ERROR DATABASE)

La **KDB** es el catálogo interactivo de errores conocidos y soluciones rápidas (*Workarounds*) para Nivel 1.

### 2.1. Ubicación en el Código
* **Archivo:** [`frontend/src/pages/ti/TIPortalPage.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/pages/ti/TIPortalPage.tsx)
* **Líneas:** 114 a 208 (Estados, Datos y Métodos) y 2263 a 2420 (Interfaz Visual React).

### 2.2. Definición del Estado y Catálogo de las 5 Soluciones
```typescript
// Líneas 114-120: Estados React para la KDB
const [isKDBOpen, setIsKDBOpen] = useState<boolean>(true);
const [kdbSearchTerm, setKdbSearchTerm] = useState<string>('');
const [kdbSelectedCategory, setKdbSelectedCategory] = useState<string>('TODOS');
const [copiedKDBId, setCopiedKDBId] = useState<string | null>(null);

// Líneas 121-187: Catálogo de las 5 Soluciones Estándar de SUMAQ
const kdbArticles = useMemo(() => [
  {
    id: 'KDB-001',
    codigo: 'KDB-2026-001',
    titulo: 'Error 502 / 504 Bad Gateway: Microservicio Backend API no responde',
    categoria: 'INFRAESTRUCTURA',
    modulo: 'Infraestructura & Azure',
    impacto: 'Crítico (P1)',
    sintoma: 'La aplicación muestra pantalla blanca o errores 502/504 al consultar citas o procesar pagos.',
    causaRaiz: 'Proceso Gunicorn en sumaq-backend saturado por fuga de memoria temporal o timeout en proxy NGINX.',
    solucionWorkaround: '1. Abrir terminal del servidor Azure o local.\n2. Ejecutar reinicio del contenedor: docker restart sumaq-backend\n3. Verificar salud del servicio: docker logs sumaq-backend --tail 30\n4. Validar respuesta en http://localhost:8000/api/catalogos/. Tiempo de recuperación estimado: < 30 seg.',
    tiempoEstimado: '< 3 min',
    jiraRef: 'SUMAQ-KB-101'
  },
  {
    id: 'KDB-002',
    codigo: 'KDB-2026-002',
    titulo: 'Error 401 Unauthorized / Token JWT Expirado en Pantalla de Cobro POS',
    categoria: 'SEGURIDAD',
    modulo: 'Seguridad & Auth',
    impacto: 'Alto (P2)',
    sintoma: 'Las recepcionistas son expulsadas a la pantalla de login con alerta "Sesión caducada" al emitir boleta.',
    causaRaiz: 'Access token de 120 minutos superó el tiempo de vida o clave de revocación en Redis fue purgada.',
    solucionWorkaround: '1. Solicitar re-login inmediato de la recepcionista para emitir nuevo Refresh Token.\n2. Si el error persiste, purgar caché de sesiones en Redis ejecutando: docker exec -it sumaq-redis redis-cli FLUSHDB\n3. Validar sincronización horaria del cliente con el servidor.',
    tiempoEstimado: '< 2 min',
    jiraRef: 'SUMAQ-KB-102'
  },
  {
    id: 'KDB-003',
    codigo: 'KDB-2026-003',
    titulo: 'Desincronización de Kardex / Reporte Financiero en Nodo Slave (Puerto 3309)',
    categoria: 'BASE_DE_DATOS',
    modulo: 'Base de Datos MySQL',
    impacto: 'Medio (P3)',
    sintoma: 'El informe analítico de caja o inventario no muestra las ventas recientes registradas en el Master.',
    causaRaiz: 'Hilo de replicación Slave_SQL_Running o Slave_IO_Running detenido por microcorte de red.',
    solucionWorkaround: '1. Conectar a MySQL Slave (puerto 3309) y verificar estado: SHOW SLAVE STATUS\\G\n2. Si Slave_SQL_Running está en "No", ejecutar: STOP REPLICA; START REPLICA;\n3. Como contingencia operativa inmediata, conmutar la lectura temporal al nodo Master (3308).',
    tiempoEstimado: '< 5 min',
    jiraRef: 'SUMAQ-KB-103'
  },
  {
    id: 'KDB-004',
    codigo: 'KDB-2026-004',
    titulo: 'Lentitud Extrema (>20s) en Checkout POS y Generación de Boletas PDF',
    categoria: 'APLICACIONES',
    modulo: 'Punto de Venta / Caja',
    impacto: 'Alto (P2)',
    sintoma: 'Al presionar "Cobrar" en recepción, el modal se congela y demora en mostrar el comprobante descargable.',
    causaRaiz: 'Saturación en el motor de renderizado de boletas PDF o acumulación excesiva de LocalStorage en navegador.',
    solucionWorkaround: '1. Instruir al personal de caja presionar Ctrl + F5 para recargar el bundle estático del navegador.\n2. Limpiar recibos temporales en localStorage del navegador.\n3. Si persiste, reiniciar worker NGINX: docker restart sumaq-frontend.',
    tiempoEstimado: '< 4 min',
    jiraRef: 'SUMAQ-KB-104'
  },
  {
    id: 'KDB-005',
    codigo: 'KDB-2026-005',
    titulo: 'Saturación de CPU al 98% en MySQL Master por Bloqueo Transaccional (Deadlock)',
    categoria: 'BASE_DE_DATOS',
    modulo: 'Base de Datos MySQL',
    impacto: 'Crítico (P1)',
    sintoma: 'Múltiples clientes y recepcionistas no pueden confirmar reservas; peticiones quedan en espera infinita.',
    causaRaiz: 'Contención de bloqueos pesimistas entre reservas concurrentes y actualización masiva de stock BOM.',
    solucionWorkaround: '1. Ingresar a MySQL Master (3308) y ejecutar: SHOW FULL PROCESSLIST;\n2. Identificar el hilo en estado "Waiting for table metadata lock" o con Time > 45 segundos.\n3. Ejecutar comando: KILL <process_id>; para liberar la tabla inmediatamente.',
    tiempoEstimado: '< 5 min',
    jiraRef: 'SUMAQ-KB-105'
  }
], []);
```

### 2.3. Lógica de Filtrado y Búsqueda en Tiempo Real
```typescript
// Líneas 189-200: Filtrado reactivo por texto y categoría
const filteredKDBArticles = useMemo(() => {
  return kdbArticles.filter(art => {
    const matchCategory = kdbSelectedCategory === 'TODOS' || art.categoria === kdbSelectedCategory;
    const matchSearch = kdbSearchTerm === '' ||
      art.titulo.toLowerCase().includes(kdbSearchTerm.toLowerCase()) ||
      art.sintoma.toLowerCase().includes(kdbSearchTerm.toLowerCase()) ||
      art.codigo.toLowerCase().includes(kdbSearchTerm.toLowerCase()) ||
      art.modulo.toLowerCase().includes(kdbSearchTerm.toLowerCase()) ||
      art.solucionWorkaround.toLowerCase().includes(kdbSearchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });
}, [kdbArticles, kdbSelectedCategory, kdbSearchTerm]);

// Líneas 202-208: Copia instantánea del procedimiento al portapapeles
const handleCopyWorkaround = (art: typeof kdbArticles[0]) => {
  const textToCopy = `[${art.codigo}] ${art.titulo}\nDiagnóstico: ${art.causaRaiz}\nSolución Workaround:\n${art.solucionWorkaround}`;
  navigator.clipboard.writeText(textToCopy);
  setCopiedKDBId(art.id);
  setTimeout(() => setCopiedKDBId(null), 2500);
};
```

---

## 3. DASHBOARD Y ANALÍTICA DE INCIDENTES (ITIL v4)

### 3.1. Frontend: KPIs Ejecutivos y Gráficos
* **Archivo:** [`frontend/src/pages/ti/TIPortalPage.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/pages/ti/TIPortalPage.tsx)
* **Líneas:** 830 a 1150.
* **Componentes Renderizados:**
  1. **KPI Total Incidentes:** `computedMetrics.total` (cuenta de tickets creados).
  2. **KPI Cerrados:** `computedMetrics.resueltos` (tickets con estado `RESUELTO`).
  3. **KPI En Atención:** `computedMetrics.en_proceso` (asignados a Nivel 2).
  4. **KPI Cumplimiento SLA Promedio:** `computedMetrics.sla_pct` (cálculo de resolución dentro de la fecha límite).
  5. **KPI Cambios CAB:** Total de RFCs aprobadas con porcentaje de rollback.
  6. **Gráfico de Barras Apiladas:** Distribución de incidentes por módulo técnico (*Base de Datos*, *Infraestructura*, *Seguridad*, *Soporte*, *Frontend*).
  7. **Gráfico Donut:** Volumen de incidentes por criticidad (*Alta/Crítica P1/P2*, *Media P3*, *Baja P4*).

### 3.2. Backend: Cálculo de SLAs y Algoritmo de Detección de Causa Raíz (RCA)
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py)
* **Clase:** `AnaliticaITILView(APIView)` (Líneas 350 a 445).

```python
# Cálculo matemático del cumplimiento de SLAs
tickets_resueltos_objs = Ticket.objects.filter(estado=Ticket.Estado.RESUELTO, fecha_resolucion__isnull=False)
sla_cumplidos = 0
for t in tickets_resueltos_objs:
    if t.sla_fecha_limite and t.fecha_resolucion <= t.sla_fecha_limite:
        sla_cumplidos += 1

sla_pct = round((sla_cumplidos / len(tickets_resueltos_objs) * 100), 1) if tickets_resueltos_objs.exists() else 100.0

# Algoritmo de Detección Proactiva de Problemas (ITIL Problem Management & RCA)
problemas_detectados = []
for row in modulo_counts:
    if row['count'] >= 2:  # Umbral de recurrencia de incidentes
        mod_name = row['modulo']
        tickets_rel = list(incidencias_qs.filter(modulo=mod_name).values_list('codigo', flat=True)[:4])
        problemas_detectados.append({
            "modulo": mod_name,
            "incidencias_count": row['count'],
            "sugerencia_itil": sugerencias_causa_raiz.get(mod_name, f"Falla recurrente detectada en {mod_name}."),
            "estado_problema": "ANALISIS_CAUSA_RAIZ",
            "tickets_relacionados": tickets_rel
        })
```

---

## 4. MODELO DE TICKETS Y CÁLCULO AUTOMÁTICO DE SLAs

### 4.1. Ubicación en el Código
* **Archivo:** [`backend/apps/ti/models.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/models.py) (Líneas 6 a 120).

### 4.2. Estructura de Datos del Modelo `Ticket`
```python
class Ticket(models.Model):
    class Tipo(models.TextChoices):
        SOLICITUD_SERVICIO = 'SOLICITUD_SERVICIO', 'Solicitud de Servicio'
        SOLICITUD_INFORMACION = 'SOLICITUD_INFORMACION', 'Solicitud de Información'
        SOLICITUD_ACCESO = 'SOLICITUD_ACCESO', 'Solicitud de Acceso'
        INCIDENCIA = 'INCIDENCIA', 'Incidencia Técnica'
        SOLICITUD_CAMBIO = 'SOLICITUD_CAMBIO', 'Control de Cambios (RFC)'

    class Prioridad(models.TextChoices):
        P1_CRITICA = 'P1_CRITICA', 'P1 - Crítica (2h)'
        P2_ALTA = 'P2_ALTA', 'P2 - Alta (8h)'
        P3_MEDIA = 'P3_MEDIA', 'P3 - Media (24h)'
        P4_BAJA = 'P4_BAJA', 'P4 - Baja (48h)'

    class Estado(models.TextChoices):
        ABIERTO = 'ABIERTO', 'Abierto (En espera de revisión)'
        EN_PROCESO = 'EN_PROCESO', 'En Proceso (Asignado a N2)'
        PENDIENTE_APROBACION = 'PENDIENTE_APROBACION', 'Pendiente de Aprobación por Gerencia / CAB'
        APROBADO = 'APROBADO', 'Aprobado por Gerencia / CAB'
        RESUELTO = 'RESUELTO', 'Resuelto / Cerrado'

    codigo = models.CharField('Código de Ticket', max_length=40, unique=True, db_index=True)
    tipo = models.CharField(max_length=40, choices=Tipo.choices, default=Tipo.SOLICITUD_SERVICIO)
    prioridad = models.CharField(max_length=20, choices=Prioridad.choices, default=Prioridad.P3_MEDIA)
    modulo = models.CharField('Módulo Afectado', max_length=100, default='General')
    asunto = models.CharField('Asunto', max_length=255)
    descripcion = models.TextField('Descripción Detallada')
    
    # SLAs
    sla_horas = models.PositiveIntegerField('SLA en Horas', default=24)
    sla_fecha_limite = models.DateTimeField('Fecha y Hora Límite SLA', null=True, blank=True)
    
    # Gobernanza CAB
    cab_aprobado_por = models.CharField('Aprobador CAB', max_length=150, blank=True, default='')
    cab_acta_numero = models.CharField('N° Acta de Aprobación CAB', max_length=60, blank=True, default='')
    plan_rollback = models.TextField('Plan de Rollback (< 5-10 min)', blank=True, default='')
    
    # Trazabilidad Jira Cloud v3
    jira_key = models.CharField('Clave Jira Cloud', max_length=50, blank=True, default='')
    jira_url = models.URLField('URL Jira Cloud', blank=True, default='')
```

### 4.3. Lógica de Asignación de Cronómetro SLA en el Backend
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py) (Líneas 120 a 145).
```python
# Prefijos normados ITIL
if is_change:
    prefix = 'RFC'
elif is_incident:
    prefix = 'INC'
else:
    prefix = 'REQ'

# Asignación automática de horas de atención según matriz de criticidad
if prioridad == Ticket.Prioridad.P1_CRITICA:
    sla_horas = 2    # 2 horas para caídas críticas
elif prioridad == Ticket.Prioridad.P2_ALTA:
    sla_horas = 8    # 8 horas para fallas de alto impacto
elif prioridad == Ticket.Prioridad.P3_MEDIA:
    sla_horas = 24   # 24 horas para solicitudes normales
elif prioridad == Ticket.Prioridad.P4_BAJA:
    sla_horas = 48   # 48 horas para consultas cosméticas

sla_fecha_limite = timezone.now() + timedelta(hours=sla_horas)
```

---

## 5. SINCRONIZACIÓN EN VIVO CON JIRA CLOUD API v3

### 5.1. Ubicación en el Código
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py)
* **Funciones Clave:** `_call_jira_api` (Líneas 24-55) y llamadas en `create`, `aprobar`, `cab_aprobar`, `resolver`.

### 5.2. Cliente REST con Autenticación Basic Auth
```python
def _call_jira_api(endpoint, method='POST', payload=None):
    domain = os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net').strip().rstrip('/')
    email = os.environ.get('JIRA_USER_EMAIL', 'rafaelramirez.utp@gmail.com').strip()
    api_token = os.environ.get('JIRA_API_TOKEN', '').strip()

    url = f"{domain}{endpoint}"
    auth_str = f"{email}:{api_token}"
    auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8') if payload else None, headers={
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }, method=method)

    with urllib.request.urlopen(req, timeout=8) as resp:
        return {"success": True, "data": json.loads(resp.read().decode('utf-8'))}
```

### 5.3. Creación Automática del Issue en Jira al registrar en SUMAQ
```python
# Líneas 167-194 en views.py
jira_payload = {
    "fields": {
        "project": {"key": "KAN"},
        "summary": f"[{ticket.codigo}] {ticket.asunto}",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [{
                "type": "paragraph",
                "content": [{"type": "text", "text": ticket.descripcion}]
            }]
        },
        "issuetype": {"name": "Incident" if is_incident else "Task"}
    }
}
jira_res = _call_jira_api('/rest/api/3/issue', method='POST', payload=jira_payload)
if jira_res.get('success'):
    ticket.jira_key = jira_res['data']['key']
    ticket.jira_url = f"{domain}/browse/{ticket.jira_key}"
    ticket.save(update_fields=['jira_key', 'jira_url'])
```

---

## 6. MESA DE AYUDA Y WIDGET DE REPORTE FLOTANTE

### 6.1. Widget Global para Todos los Roles
* **Archivo:** [`frontend/src/components/common/SupportWidget.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/components/common/SupportWidget.tsx)
* **Comportamiento:**
  * Está presente en todas las rutas del sistema para Recepcionistas, Terapeutas y Clientes.
  * Permite reportar una falla con captura de pantalla y descripción sin salir de su pantalla de trabajo.
  * Envía un POST a `/api/ti/tickets/` y entrega de inmediato el código correlativo (`INC-2026-XXXX`).

### 6.2. Consola de Atención Service Desk
* **Archivo:** [`frontend/src/pages/ti/TIPortalPage.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/pages/ti/TIPortalPage.tsx) (Pestaña `SERVICE_DESK`).
* **Operaciones de Nivel 1 y Nivel 2:**
  * Filtrado por estado (`ABIERTO`, `EN_PROCESO`, `RESUELTO`).
  * Asignación a técnico especialista (`asignado_a`).
  * Registro de la solución técnica aplicada (`resolucion_tecnica`).
  * Vinculación a Commit o PR de GitHub para trazabilidad de código.

---

## 7. CONTROL DE CAMBIOS (CAB / RFC) Y GOBERNANZA ITIL

### 7.1. Segregación de Funciones en Aprobaciones
* **Archivo:** [`backend/apps/ti/views.py`](file:///e:/INTEGRADOR%20II/SUMAQ-web/backend/apps/ti/views.py) (Acción `cab_aprobar`, Líneas 243-289).
* **Regla de Negocio:**
  * Un técnico de soporte no puede auto-aprobar cambios mayores.
  * Solo el rol `ADMIN` (Gerencia General) o el Chair del Comité CAB puede autorizar la RFC.
  * Se requiere ingresar el número de acta (`cab_acta_numero`) y el plan de *rollback* verificado (< 10 minutos).

```python
@action(detail=True, methods=['post'], url_path='cab-aprobar')
def cab_aprobar(self, request, pk=None):
    ticket = self.get_object()
    aprobador = request.data.get('cab_aprobado_por', 'Comité CAB')
    acta = request.data.get('cab_acta_numero', 'ACTA-CAB-EMERGENCIA')
    
    ticket.cab_aprobado_por = aprobador
    ticket.cab_acta_numero = acta
    ticket.cab_fecha_aprobacion = timezone.now()
    ticket.estado = Ticket.Estado.APROBADO
    ticket.save()
    
    # Publica comentario inmutable en Jira Cloud
    _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)
```

---

## 8. ENLACES DIRECTOS Y ACCESIBILIDAD EN PRODUCCIÓN DOCKER

En la barra superior de [`TIPortalPage.tsx`](file:///e:/INTEGRADOR%20II/SUMAQ-web/frontend/src/pages/ti/TIPortalPage.tsx) (Líneas 798 a 825), se cuenta con los enlaces en vivo para la sustentación:

1. **Jira Cloud v3:** Abre directamente el espacio de Atlassian (`https://sumaq-dev.atlassian.net`).
2. **Grafana Telemetría:** Abre el servidor de métricas en el puerto `3000` (`http://localhost:3000` o IP pública de Azure).
3. **Replicación MySQL:** Indicador en tiempo real de los nodos `Master: 3308` y `Slave: 3309`.
