from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timedelta
from apps.ti.models import Ticket, KdbArticle, MonitoringEvent


class Command(BaseCommand):
    help = 'Semillero y sincronización normalizada desde Jira Cloud para Service Desk, Control de Cambios y Monitoreo - ITIL v4'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Fuerza la resincronización con Jira Cloud y actualiza registros base')

    def handle(self, *args, **options):
        force = options.get('force', False)

        # 1. Asegurar existencia del usuario de Soporte TI para autenticación y RBAC
        try:
            from apps.accounts.models import User
            ti_user, user_created = User.objects.get_or_create(
                email='soporte.ti@sumaqspa.pe',
                defaults={
                    'nombre_completo': 'Ing. Anthony Luque (Soporte TI)',
                    'rol': User.Roles.SOPORTE_TI,
                    'activo': True,
                }
            )
            if user_created or not ti_user.check_password('Sumaq2026!'):
                ti_user.set_password('Sumaq2026!')
                ti_user.rol = User.Roles.SOPORTE_TI
                ti_user.activo = True
                ti_user.save()
            self.stdout.write(self.style.SUCCESS('Usuario soporte.ti@sumaqspa.pe listo en base de datos.'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Aviso verificando usuario TI: {e}'))

        if (
            Ticket.objects.count() >= 15
            and KdbArticle.objects.count() >= 5
            and MonitoringEvent.objects.count() >= 8
            and not force
        ):
            self.stdout.write(self.style.SUCCESS(
                f'Ya existen {Ticket.objects.count()} tickets, {KdbArticle.objects.count()} artículos KDB y {MonitoringEvent.objects.count()} eventos.'
            ))
            return

        # Limpiar códigos obsoletos que duplicaban issues existentes
        Ticket.objects.filter(codigo__in=['REQ-2026-0015', 'REQ-2026-0025', 'RFC-2026-0044']).delete()

        # 2. Sembrado de Base de Conocimiento KDB (ITIL v4) con referencias reales a Jira Cloud (KAN)
        kdb_seeds = [
            {
                "codigo": "KDB-2026-001",
                "titulo": "Error 502 / 504 Bad Gateway: Microservicio Backend API no responde",
                "categoria": KdbArticle.Categoria.INFRAESTRUCTURA,
                "modulo": "Infraestructura & BD",
                "prioridad": KdbArticle.Prioridad.P1_CRITICA,
                "sintoma": "La aplicación muestra pantalla blanca o errores 502/504 al consultar citas o procesar pagos.",
                "causa_raiz": "Proceso Gunicorn en sumaq-backend saturado por fuga de memoria temporal o bloqueo de E/S en proxy NGINX.",
                "solucion_workaround": (
                    "1. Abrir terminal del servidor Azure o local.\n"
                    "2. Ejecutar reinicio del contenedor: docker restart sumaq-backend\n"
                    "3. Verificar salud del servicio: docker logs sumaq-backend --tail 30\n"
                    "4. Validar respuesta en http://localhost:8000/api/v1/health/. Tiempo de recuperación estimado: < 30 seg."
                ),
                "tiempo_estimado": "< 3 min",
                "jira_ref": "KAN-3",
                "activo": True
            },
            {
                "codigo": "KDB-2026-002",
                "titulo": "Error 401 Unauthorized / Token JWT Expirado en Pantalla de Cobro POS",
                "categoria": KdbArticle.Categoria.SEGURIDAD,
                "modulo": "Seguridad & Auth",
                "prioridad": KdbArticle.Prioridad.P2_ALTA,
                "sintoma": "Las recepcionistas son expulsadas a la pantalla de login con alerta 'Sesión caducada' al emitir boleta.",
                "causa_raiz": "Access token de 120 minutos superó el tiempo de vida o clave de revocación en Redis fue purgada.",
                "solucion_workaround": (
                    "1. Solicitar re-login inmediato de la recepcionista para emitir nuevo Refresh Token.\n"
                    "2. Si el error persiste, purgar caché de sesiones en Redis ejecutando: docker exec -it sumaq-redis redis-cli FLUSHDB\n"
                    "3. Validar sincronización horaria del cliente con el servidor."
                ),
                "tiempo_estimado": "< 2 min",
                "jira_ref": "KAN-5",
                "activo": True
            },
            {
                "codigo": "KDB-2026-003",
                "titulo": "Desincronización de Kardex / Reporte Financiero en Nodo Slave (Puerto 3309)",
                "categoria": KdbArticle.Categoria.BASE_DE_DATOS,
                "modulo": "Base de Datos MySQL",
                "prioridad": KdbArticle.Prioridad.P3_MEDIA,
                "sintoma": "El informe analítico de caja o inventario no muestra las ventas recientes registradas en el Master.",
                "causa_raiz": "Hilo de replicación Slave_SQL_Running o Slave_IO_Running detenido por microcorte de red.",
                "solucion_workaround": (
                    "1. Conectar a MySQL Slave (puerto 3309) y verificar estado: SHOW REPLICA STATUS\\G\n"
                    "2. Si Replica_SQL_Running está en 'No', ejecutar: STOP REPLICA; START REPLICA;\n"
                    "3. Como contingencia operativa inmediata, conmutar la lectura temporal al nodo Master (3308)."
                ),
                "tiempo_estimado": "< 5 min",
                "jira_ref": "KAN-2",
                "activo": True
            },
            {
                "codigo": "KDB-2026-004",
                "titulo": "Lentitud Extrema (>20s) en Checkout POS y Generación de Boletas PDF",
                "categoria": KdbArticle.Categoria.APLICACIONES,
                "modulo": "Punto de Venta / Caja",
                "prioridad": KdbArticle.Prioridad.P2_ALTA,
                "sintoma": "Al presionar 'Cobrar' en recepción, el modal se congela y demora en mostrar el comprobante descargable.",
                "causa_raiz": "Saturación en el motor de renderizado de boletas PDF o acumulación excesiva de estado en navegador.",
                "solucion_workaround": (
                    "1. Instruir al personal de caja presionar Ctrl + F5 para recargar el bundle estático del navegador.\n"
                    "2. Limpiar recibos temporales en almacenamiento local del navegador.\n"
                    "3. Si persiste, reiniciar worker NGINX: docker restart sumaq-frontend."
                ),
                "tiempo_estimado": "< 4 min",
                "jira_ref": "KAN-100",
                "activo": True
            },
            {
                "codigo": "KDB-2026-005",
                "titulo": "Saturación de CPU al 98% en MySQL Master por Bloqueo Transaccional (Deadlock)",
                "categoria": KdbArticle.Categoria.BASE_DE_DATOS,
                "modulo": "Base de Datos MySQL",
                "prioridad": KdbArticle.Prioridad.P1_CRITICA,
                "sintoma": "Múltiples clientes y recepcionistas no pueden confirmar reservas; peticiones quedan en espera infinita.",
                "causa_raiz": "Contención de bloqueos pesimistas entre reservas concurrentes y actualización masiva de stock BOM.",
                "solucion_workaround": (
                    "1. Ingresar a MySQL Master (3308) y ejecutar: SHOW FULL PROCESSLIST;\n"
                    "2. Identificar el hilo en estado 'Waiting for table metadata lock' o con Time > 45 segundos.\n"
                    "3. Ejecutar comando: KILL <process_id>; para liberar la tabla inmediatamente."
                ),
                "tiempo_estimado": "< 5 min",
                "jira_ref": "KAN-7",
                "activo": True
            }
        ]

        for k in kdb_seeds:
            KdbArticle.objects.update_or_create(codigo=k["codigo"], defaults=k)

        # 3. Sincronizar desde Jira Cloud preservando fechas históricas reales
        from apps.ti.views import _auto_sync_from_jira
        sync_res = _auto_sync_from_jira(force=True)
        self.stdout.write(self.style.SUCCESS(f'Resultado sincronización Jira Cloud: {sync_res}'))

        # 4. Asegurar metadatos CAB completos en los 4 RFC de Control de Cambios (preservando sus fechas históricas 2026-10-29)
        hist_oct23 = parse_datetime("2026-10-23T01:15:40+00:00")
        hist_oct29 = parse_datetime("2026-10-29T23:54:50+00:00")
        now = timezone.now()

        rfc_And_base_seeds = [
            {
                "codigo": "REQ-2026-0001",
                "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
                "prioridad": Ticket.Prioridad.P3_MEDIA,
                "asunto": "Integración de servicios frontend hacia endpoints Django REST",
                "descripcion": "Reemplazo de estados estáticos en frontend por endpoints Django /api/ en citas, inventario y finanzas.",
                "modulo": "Frontend & APIs",
                "solicitante_nombre": "Rafael Ramirez Quiroz (RQ)",
                "solicitante_email": "rafaelramirez.utp@gmail.com",
                "solicitante_rol": "ADMIN",
                "sla_horas": 24,
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Rafael Ramirez Quiroz (RQ)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "fecha_aprobacion": hist_oct23 + timedelta(hours=2),
                "resolucion_tecnica": "Endpoints en /api/ conectando servicios de citas y pagos con axios y React Query.",
                "fecha_resolucion": hist_oct23 + timedelta(hours=10),
                "jira_key": "KAN-1",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-1",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti",
                "kdb_codigo": "KDB-2026-004",
                "created_at": hist_oct23,
            },
            {
                "codigo": "REQ-2026-0008",
                "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
                "prioridad": Ticket.Prioridad.P3_MEDIA,
                "asunto": "Scripts de backup y restore transaccional con detección de MySQL 8.0",
                "descripcion": "Ejecución de backup_docker.bat con mysqldump --single-transaction --quick y compresión gzip hacia el esclavo 3309.",
                "modulo": "Infraestructura & BD",
                "solicitante_nombre": "Anthony Luque (AL)",
                "solicitante_email": "anthony.luque@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 24,
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Anthony Luque (AL)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "fecha_aprobacion": hist_oct23 + timedelta(hours=2),
                "resolucion_tecnica": "Script verificado con Checksum MD5 y Seconds_Behind_Master: 0 en contenedor 3309.",
                "fecha_resolucion": hist_oct23 + timedelta(hours=8),
                "jira_key": "KAN-8",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-8",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti",
                "kdb_codigo": "KDB-2026-001",
                "created_at": hist_oct23,
            },
            {
                "codigo": "REQ-2026-0007",
                "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
                "prioridad": Ticket.Prioridad.P3_MEDIA,
                "asunto": "Ajuste de sintaxis SQL reemplazando ON DELETE PROTECT por RESTRICT",
                "descripcion": "Normalización de restricciones de integridad referencial para compatibilidad estricta con MySQL 8.0 y Django ORM.",
                "modulo": "Base de Datos MySQL",
                "solicitante_nombre": "Anthony Luque (AL)",
                "solicitante_email": "anthony.luque@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 24,
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Anthony Luque (AL)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "fecha_aprobacion": hist_oct23 + timedelta(hours=2),
                "resolucion_tecnica": "Esquema de migración makemigrations generado con integridad referencial validada en tests unitarios.",
                "fecha_resolucion": hist_oct23 + timedelta(hours=6),
                "jira_key": "KAN-7",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-7",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti",
                "kdb_codigo": "KDB-2026-005",
                "created_at": hist_oct23,
            },
            {
                "codigo": "REQ-2026-0006",
                "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
                "prioridad": Ticket.Prioridad.P3_MEDIA,
                "asunto": "Implementación de Rate Limiting y auto-logout por inactividad",
                "descripcion": "Middleware de seguridad contra ataques de fuerza bruta y expiración de tokens JWT en 120 minutos.",
                "modulo": "Seguridad & Auth",
                "solicitante_nombre": "Rafael Ramirez Quiroz (RQ)",
                "solicitante_email": "rafaelramirez.utp@gmail.com",
                "solicitante_rol": "ADMIN",
                "sla_horas": 24,
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Bryan Alexis Mango (BT)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "fecha_aprobacion": hist_oct23 + timedelta(hours=2),
                "resolucion_tecnica": "Seguridad RBAC configurada en común permissions.py y middleware de expiración de sesión.",
                "fecha_resolucion": hist_oct23 + timedelta(hours=7),
                "jira_key": "KAN-6",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-6",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti",
                "kdb_codigo": "KDB-2026-002",
                "created_at": hist_oct23,
            },
            {
                "codigo": "RFC-2026-0050",
                "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "Reemplazo de Switch Administrable y Segmentación de VLANs 10, 20 y 30",
                "descripcion": (
                    "Sustitución física del switch no administrable por Switch Cisco Catalyst Gigabit 24p L2/L3 con soporte 802.1Q. "
                    "Segmentación estricta: VLAN 10 (Gestión/POS/Servidor 3308), VLAN 20 (Tablets Cabinas 1, 2 y 3) y VLAN 30 (Wi-Fi Clientes con Client Isolation)."
                ),
                "modulo": "Redes & Hardware",
                "area_cambio": Ticket.AreaCambio.INFRAESTRUCTURA,
                "tipo_cambio": Ticket.TipoCambio.NORMAL,
                "impacto_riesgo": Ticket.ImpactoRiesgo.ALTO,
                "ventana_mantenimiento": "Martes 02:00 AM - 04:00 AM (Ventana Nocturna No Invasiva)",
                "plan_rollback": "Reconexión de patch cords al switch anterior en rack físico en menos de 10 minutos si fallan pruebas de ping a Gateway o transacción POS.",
                "solicitante_nombre": "Bryan Mango (DBA / Infraestructura)",
                "solicitante_email": "bryan.mango@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 48,
                "estado": Ticket.Estado.APROBADO,
                "asignado_a": "Bryan Alexis Mango (BT)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-050",
                "cab_fecha_aprobacion": hist_oct29 + timedelta(hours=4),
                "fecha_aprobacion": hist_oct29 + timedelta(hours=4),
                "resolucion_tecnica": "Pre-configuración en staging completada. VLANs 10, 20 y 30 etiquetadas. Listo para swap físico.",
                "jira_key": "KAN-40",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-40",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo",
                "kdb_codigo": "KDB-2026-001",
                "created_at": hist_oct29,
            },
            {
                "codigo": "RFC-2026-0042",
                "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "Despliegue de Pasarela de Pagos Niubiz y Replicación Asíncrona MySQL",
                "descripcion": "Incorporación del SDK de pasarela de pagos para reservas web y activación de replicación GTID Master/Slave con nodo esclavo 3309 para descarga de lecturas de caja.",
                "modulo": "Aplicaciones & BD",
                "area_cambio": Ticket.AreaCambio.APLICACIONES,
                "tipo_cambio": Ticket.TipoCambio.NORMAL,
                "impacto_riesgo": Ticket.ImpactoRiesgo.MEDIO,
                "ventana_mantenimiento": "Jueves 02:30 AM - 03:30 AM",
                "plan_rollback": "Reversión de imagen de backend Docker a v1.0.4-stable y ejecución de 'python manage.py migrate apps.citas 0012_revert' en < 5 minutos.",
                "solicitante_nombre": "Anthony Luque (DevOps / Frontend)",
                "solicitante_email": "anthony.luque@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 24,
                "estado": Ticket.Estado.APROBADO,
                "asignado_a": "Anthony Luque (AL)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-042",
                "cab_fecha_aprobacion": hist_oct29 + timedelta(hours=5),
                "fecha_aprobacion": hist_oct29 + timedelta(hours=5),
                "resolucion_tecnica": "Pipeline CI/CD en GitHub Actions verificado con Pytest 100% pass y scan de seguridad Trivy.",
                "jira_key": "KAN-41",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-41",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo",
                "kdb_codigo": "KDB-2026-003",
                "created_at": hist_oct29,
            },
            {
                "codigo": "RFC-2026-0043",
                "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
                "prioridad": Ticket.Prioridad.P3_MEDIA,
                "asunto": "Actualización de Topología de Red y Manual Operativo de Contingencia Offline",
                "descripcion": "Publicación del nuevo plano arquitectónico de red del Spa, mapa de puertos del rack, diagrama de clases C4 y protocolo de cobro manual ante pérdida de enlace con Azure VM.",
                "modulo": "Documentación & Calidad",
                "area_cambio": Ticket.AreaCambio.DOCUMENTACION,
                "tipo_cambio": Ticket.TipoCambio.ESTANDAR,
                "impacto_riesgo": Ticket.ImpactoRiesgo.BAJO,
                "ventana_mantenimiento": "Horario Laboral Diurno (Procedimiento Documental No Invasivo)",
                "plan_rollback": "Restauración de versión v1.2 de la documentación en la wiki interna de TI.",
                "solicitante_nombre": "Rafael Ramirez (Product Owner)",
                "solicitante_email": "rafaelramirez.utp@gmail.com",
                "solicitante_rol": "ADMIN",
                "sla_horas": 24,
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Rafael Ramirez Quiroz (RQ)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Change Manager)",
                "cab_aprobado_por": "Rafael Ramirez (Change Manager)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-043",
                "cab_fecha_aprobacion": hist_oct29 + timedelta(hours=6),
                "fecha_aprobacion": hist_oct29 + timedelta(hours=6),
                "resolucion_tecnica": "Manuales y diagramas aprobados y distribuidos a recepción y cabinas de masajes.",
                "fecha_resolucion": hist_oct29 + timedelta(hours=12),
                "jira_key": "KAN-42",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-42",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo",
                "kdb_codigo": "KDB-2026-001",
                "created_at": hist_oct29,
            },
            {
                "codigo": "RFC-2026-0030",
                "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "Definición de Ventana de Congelamiento (Change Freeze) Campaña San Valentín",
                "descripcion": "Establecimiento del periodo de Change Freeze con bloqueo estricto de despliegues a producción en código backend y base de datos desde el 10 al 16 de Febrero, protegiendo las reservas de tratamientos para parejas.",
                "modulo": "Operaciones & Calendario",
                "area_cambio": Ticket.AreaCambio.CALENDARIO,
                "tipo_cambio": Ticket.TipoCambio.NORMAL,
                "impacto_riesgo": Ticket.ImpactoRiesgo.MEDIO,
                "ventana_mantenimiento": "10 de Febrero 00:00 hrs al 16 de Febrero 23:59 hrs",
                "plan_rollback": "Desbloqueo de emergencia de pipeline CI/CD con flag 'OVERRIDE_FREEZE=true' previa autorización unánime del CAB.",
                "solicitante_nombre": "Administradora General SUMAQ",
                "solicitante_email": "administracion@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 48,
                "estado": Ticket.Estado.APROBADO,
                "asignado_a": "Rafael Ramirez Quiroz (RQ)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-030",
                "cab_fecha_aprobacion": hist_oct29 + timedelta(hours=8),
                "fecha_aprobacion": hist_oct29 + timedelta(hours=8),
                "resolucion_tecnica": "Calendario de despliegues actualizado en GitHub Releases y notificado a todo el personal.",
                "jira_key": "KAN-43",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-43",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo",
                "kdb_codigo": "KDB-2026-001",
                "created_at": hist_oct29,
            }
        ]

        for s in rfc_And_base_seeds:
            base_dt = s.get("created_at", now)
            s["sla_fecha_limite"] = base_dt + timedelta(hours=s["sla_horas"])
            Ticket.objects.update_or_create(codigo=s["codigo"], defaults=s)

        # Normalizar cualquier ticket de monitoreo previo que no tuviera jira_key asignado
        for t_empty in Ticket.objects.filter(jira_key=''):
            fallback_key = 'KAN-7' if 'MySQL' in (t_empty.modulo or '') or 'CPU' in (t_empty.asunto or '') else 'KAN-3'
            t_empty.jira_key = fallback_key
            t_empty.jira_url = f"https://sumaq-dev.atlassian.net/browse/{fallback_key}"
            t_empty.save(update_fields=['jira_key', 'jira_url'])

        # 5. Tickets de Incidente generados por el Motor de Monitoreo de Eventos (con claves reales de Jira KAN-2 y KAN-3)
        incident_tickets_seeds = [
            {
                "codigo": "INC-2026-0028",
                "tipo": Ticket.Tipo.INCIDENCIA,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "[Alerta ERROR] Latencia de Respuesta en MySQL Master (3308) (2150.0 ms)",
                "descripcion": (
                    "Incidente generado automáticamente por el motor de monitoreo de eventos (EVT-2026-0005).\n"
                    "Componente: MySQL Master (3308)\n"
                    "Métrica: Latencia de Respuesta = 2150.0 ms (Umbral: Error 1000-2500ms)\n"
                    "Proceso de Negocio: Agendamiento y Disponibilidad de Terapeutas\n"
                    "Plan de Respuesta Inmediata: Terminar consultas bloqueadas, liberar conexiones en estado Sleep y conmutar lecturas analíticas a réplica 3309."
                ),
                "modulo": "Base de Datos MySQL",
                "solicitante_nombre": "Motor de Monitoreo SUMAQ",
                "solicitante_email": "monitoreo.ti@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 8,
                "sla_fecha_limite": now + timedelta(hours=8),
                "estado": Ticket.Estado.EN_PROCESO,
                "asignado_a": "Bryan Alexis Mango (BT)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "resolucion_tecnica": "Aislamiento de lecturas de reportes hacia contenedor Slave 3309 en curso.",
                "jira_key": "KAN-2",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-2",
                "kdb_codigo": "KDB-2026-005"
            },
            {
                "codigo": "INC-2026-0029",
                "tipo": Ticket.Tipo.INCIDENCIA,
                "prioridad": Ticket.Prioridad.P1_CRITICA,
                "asunto": "[Alerta CRITICAL] Ocupación de Almacenamiento en Disco en Servidor Host (95.4%)",
                "descripcion": (
                    "Incidente generado automáticamente por el motor de monitoreo de eventos (EVT-2026-0006).\n"
                    "Componente: Recursos de Servidor / Host\n"
                    "Métrica: Ocupación de Disco = 95.4% (Umbral Crítico: >95%)\n"
                    "Proceso de Negocio: Continuidad Transaccional y Persistencia MySQL\n"
                    "Plan de Respuesta Inmediata: Purgar binlogs antiguos ya replicados (PURGE BINARY LOGS), rotar logs de Nginx y liberar partición."
                ),
                "modulo": "Infraestructura & BD",
                "solicitante_nombre": "Motor de Monitoreo SUMAQ",
                "solicitante_email": "monitoreo.ti@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 2,
                "sla_fecha_limite": now + timedelta(hours=2),
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Rafael Ramirez Quiroz (RQ)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "resolucion_tecnica": "Ejecución de PURGE BINARY LOGS en nodo 3308 y compresión de respaldos; ocupación reducida al 64.2%.",
                "fecha_resolucion": now - timedelta(minutes=15),
                "jira_key": "KAN-3",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-3",
                "kdb_codigo": "KDB-2026-001"
            },
            {
                "codigo": "INC-2026-0031",
                "tipo": Ticket.Tipo.INCIDENCIA,
                "prioridad": Ticket.Prioridad.P1_CRITICA,
                "asunto": "[Alerta CRITICAL] Indisponibilidad HTTP 502 en Servidor Web Nginx (98.0%)",
                "descripcion": (
                    "Incidente generado automáticamente por el motor de monitoreo de eventos (EVT-2026-0007).\n"
                    "Componente: Servidor Web Nginx\n"
                    "Métrica: Tasa de Errores HTTP 5xx = 98.0% (Umbral Crítico: >95%)\n"
                    "Proceso de Negocio: Portal de Reservas Web y Checkout POS\n"
                    "Plan de Respuesta Inmediata: Reinicio automático de workers Gunicorn en sumaq-backend mediante política Docker healthcheck."
                ),
                "modulo": "Infraestructura & BD",
                "solicitante_nombre": "Motor de Monitoreo SUMAQ",
                "solicitante_email": "monitoreo.ti@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 2,
                "sla_fecha_limite": now + timedelta(hours=2),
                "estado": Ticket.Estado.RESUELTO,
                "asignado_a": "Anthony Luque (AL)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "resolucion_tecnica": "Contenedor sumaq-backend reiniciado vía healthcheck en 22 segundos. Respuesta 200 OK restablecida.",
                "fecha_resolucion": now - timedelta(minutes=10),
                "jira_key": "KAN-3",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-3",
                "kdb_codigo": "KDB-2026-001"
            }
        ]

        created_inc_tickets = {}
        for inc_data in incident_tickets_seeds:
            t_obj, _ = Ticket.objects.update_or_create(codigo=inc_data["codigo"], defaults=inc_data)
            created_inc_tickets[inc_data["codigo"]] = t_obj

        # 6. Sembrado de Bitácora Cronológica de Eventos de Monitoreo (09:00 a 09:25)
        event_seeds = [
            {
                "codigo": "EVT-2026-0001",
                "nivel": MonitoringEvent.Nivel.INFO,
                "componente": MonitoringEvent.Componente.BACKEND_API,
                "metrica": "Verificación de Salud de Servicios (Heartbeat)",
                "valor_registrado": "62.0%",
                "valor_numerico": 62.0,
                "umbral_referencia": "Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%",
                "descripcion": "[09:00] Inicio de jornada operativa en SUMAQ Spa. Servicios Django REST, MySQL 3308 y Redis 6379 operando dentro de parámetros normales.",
                "proceso_negocio": "Operación General Spa",
                "genera_incidente": False,
                "justificacion_incidente": "Operación normal verificada. Se almacena registro en bitácora de auditoría sin requerir ticket.",
                "impacto": MonitoringEvent.NivelImpacto.BAJO,
                "urgencia": MonitoringEvent.NivelUrgencia.BAJA,
                "prioridad_asignada": "N/A",
                "responsable": "Monitoreo Automatizado TI",
                "accion_respuesta": "Registro en bitácora estructurada. Sin intervención manual.",
                "tiempo_respuesta_max": "N/A",
                "estado": MonitoringEvent.Estado.CERRADO,
                "ticket_vinculado": None,
                "ticket_codigo": ""
            },
            {
                "codigo": "EVT-2026-0002",
                "nivel": MonitoringEvent.Nivel.INFO,
                "componente": MonitoringEvent.Componente.BACKEND_API,
                "metrica": "Uso de CPU del Servidor",
                "valor_registrado": "72.0%",
                "valor_numerico": 72.0,
                "umbral_referencia": "Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%",
                "descripcion": "[09:05] Incremento de uso de CPU al 72.0% en contenedor sumaq-backend durante apertura simultánea de agendas de terapeutas.",
                "proceso_negocio": "Consulta de Catálogo y Agenda",
                "genera_incidente": False,
                "justificacion_incidente": "El consumo de CPU (72.0%) se mantiene dentro de la banda informativa (60%-75%) sin degradar tiempos de respuesta.",
                "impacto": MonitoringEvent.NivelImpacto.BAJO,
                "urgencia": MonitoringEvent.NivelUrgencia.BAJA,
                "prioridad_asignada": "N/A",
                "responsable": "Monitoreo Automatizado TI",
                "accion_respuesta": "Seguimiento automático de curva de carga por agente de telemetría.",
                "tiempo_respuesta_max": "N/A",
                "estado": MonitoringEvent.Estado.CERRADO,
                "ticket_vinculado": None,
                "ticket_codigo": ""
            },
            {
                "codigo": "EVT-2026-0003",
                "nivel": MonitoringEvent.Nivel.WARNING,
                "componente": MonitoringEvent.Componente.HOST_SISTEMA,
                "metrica": "Consumo de Memoria RAM",
                "valor_registrado": "84.5%",
                "valor_numerico": 84.5,
                "umbral_referencia": "Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%",
                "descripcion": "[09:08] Memoria RAM del servidor alcanza el 84.5% debido a generación concurrente de reportes financieros de sedes.",
                "proceso_negocio": "Administración y Reportes",
                "genera_incidente": False,
                "justificacion_incidente": "Al encontrarse en umbral de advertencia (75%-85%) sin interrumpir transacciones de clientes, se ejecuta liberación preventiva de caché.",
                "impacto": MonitoringEvent.NivelImpacto.BAJO,
                "urgencia": MonitoringEvent.NivelUrgencia.MEDIA,
                "prioridad_asignada": "N/A",
                "responsable": "Anthony Luque (AL)",
                "accion_respuesta": "Liberación preventiva de objetos expirados en memoria caché y supervisión de workers.",
                "tiempo_respuesta_max": "30 min",
                "estado": MonitoringEvent.Estado.MITIGADO,
                "ticket_vinculado": None,
                "ticket_codigo": ""
            },
            {
                "codigo": "EVT-2026-0004",
                "nivel": MonitoringEvent.Nivel.WARNING,
                "componente": MonitoringEvent.Componente.SEGURIDAD_AUTH,
                "metrica": "Intentos Fallidos de Inicio de Sesión",
                "valor_registrado": "25.0 intentos",
                "valor_numerico": 25.0,
                "umbral_referencia": "Normal: <10/min | Warning: 10-30/min | Error: 30-60/min | Crítico: >60/min",
                "descripcion": "[09:12] Detección de 25 intentos fallidos de inicio de sesión en menos de 2 minutos sobre el endpoint /api/auth/login/.",
                "proceso_negocio": "Seguridad de Acceso y Autenticación",
                "genera_incidente": False,
                "justificacion_incidente": "Mitigado automáticamente por el middleware de Rate Limiting que bloqueó temporalmente la IP origen sin comprometer cuentas.",
                "impacto": MonitoringEvent.NivelImpacto.BAJO,
                "urgencia": MonitoringEvent.NivelUrgencia.MEDIA,
                "prioridad_asignada": "N/A",
                "responsable": "Bryan Alexis Mango (BT)",
                "accion_respuesta": "Bloqueo temporal de IP por 15 minutos mediante política de Rate Limiting y registro en auditoría.",
                "tiempo_respuesta_max": "15 min",
                "estado": MonitoringEvent.Estado.MITIGADO,
                "ticket_vinculado": None,
                "ticket_codigo": ""
            },
            {
                "codigo": "EVT-2026-0005",
                "nivel": MonitoringEvent.Nivel.ERROR,
                "componente": MonitoringEvent.Componente.MYSQL_MASTER,
                "metrica": "Latencia de Respuesta Base de Datos",
                "valor_registrado": "2150.0 ms",
                "valor_numerico": 2150.0,
                "umbral_referencia": "Normal: <400ms | Warning: 400-1000ms | Error: 1000-2500ms | Crítico: >2500ms",
                "descripcion": "[09:15] Lentitud severa en consultas a MySQL Master (3308) con latencia de 2,150 ms por contención de bloqueos en tabla de citas.",
                "proceso_negocio": "Agendamiento y Disponibilidad de Terapeutas",
                "genera_incidente": True,
                "justificacion_incidente": "Degrada directamente la calidad del servicio en recepción durante hora pico, superando el umbral de error (>1000 ms).",
                "impacto": MonitoringEvent.NivelImpacto.MEDIO,
                "urgencia": MonitoringEvent.NivelUrgencia.ALTA,
                "prioridad_asignada": Ticket.Prioridad.P2_ALTA,
                "responsable": "Bryan Alexis Mango (BT)",
                "accion_respuesta": "Terminar consultas bloqueadas, liberar conexiones en estado Sleep y conmutar lecturas analíticas a réplica 3309.",
                "tiempo_respuesta_max": "15 min",
                "estado": MonitoringEvent.Estado.ESCALADO,
                "ticket_vinculado": created_inc_tickets.get("INC-2026-0028"),
                "ticket_codigo": "INC-2026-0028"
            },
            {
                "codigo": "EVT-2026-0006",
                "nivel": MonitoringEvent.Nivel.CRITICAL,
                "componente": MonitoringEvent.Componente.HOST_SISTEMA,
                "metrica": "Ocupación de Almacenamiento en Disco",
                "valor_registrado": "95.4%",
                "valor_numerico": 95.4,
                "umbral_referencia": "Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%",
                "descripcion": "[09:18] Partición de datos alcanza el 95.4% de capacidad por acumulación de archivos binlog de replicación y logs sin rotar.",
                "proceso_negocio": "Continuidad Transaccional y Persistencia MySQL",
                "genera_incidente": True,
                "justificacion_incidente": "Supera el umbral crítico (>95%), con riesgo inminente de bloqueo de escritura en la base de datos transaccional.",
                "impacto": MonitoringEvent.NivelImpacto.ALTO,
                "urgencia": MonitoringEvent.NivelUrgencia.ALTA,
                "prioridad_asignada": Ticket.Prioridad.P1_CRITICA,
                "responsable": "Rafael Ramirez Quiroz (RQ)",
                "accion_respuesta": "Purgar binlogs antiguos ya replicados (PURGE BINARY LOGS), rotar logs de Nginx y liberar partición.",
                "tiempo_respuesta_max": "5 min",
                "estado": MonitoringEvent.Estado.CERRADO,
                "ticket_vinculado": created_inc_tickets.get("INC-2026-0029"),
                "ticket_codigo": "INC-2026-0029"
            },
            {
                "codigo": "EVT-2026-0007",
                "nivel": MonitoringEvent.Nivel.CRITICAL,
                "componente": MonitoringEvent.Componente.NGINX_GATEWAY,
                "metrica": "Tasa de Errores HTTP 5xx (502 Bad Gateway)",
                "valor_registrado": "98.0%",
                "valor_numerico": 98.0,
                "umbral_referencia": "Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%",
                "descripcion": "[09:20] Caída de respuesta en servidor web Nginx al agotarse el pool de workers de Gunicorn tras bloqueo de E/S en disco.",
                "proceso_negocio": "Portal de Reservas Web y Checkout POS",
                "genera_incidente": True,
                "justificacion_incidente": "Interrupción total del servicio de reservas y cobros en todas las sedes. Impacto Alto y Urgencia Alta (Prioridad P1).",
                "impacto": MonitoringEvent.NivelImpacto.ALTO,
                "urgencia": MonitoringEvent.NivelUrgencia.ALTA,
                "prioridad_asignada": Ticket.Prioridad.P1_CRITICA,
                "responsable": "Anthony Luque (AL)",
                "accion_respuesta": "Reinicio automático de contenedor sumaq-backend mediante Docker healthcheck y restablecimiento de pool.",
                "tiempo_respuesta_max": "5 min",
                "estado": MonitoringEvent.Estado.CERRADO,
                "ticket_vinculado": created_inc_tickets.get("INC-2026-0031"),
                "ticket_codigo": "INC-2026-0031"
            },
            {
                "codigo": "EVT-2026-0008",
                "nivel": MonitoringEvent.Nivel.INFO,
                "componente": MonitoringEvent.Componente.BACKEND_API,
                "metrica": "Recuperación y Estabilización de Servicio",
                "valor_registrado": "64.2%",
                "valor_numerico": 64.2,
                "umbral_referencia": "Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%",
                "descripcion": "[09:25] Recuperación automática completada. Contenedor backend operativo, espacio en disco en 64.2% y latencia MySQL en 18 ms.",
                "proceso_negocio": "Operación General Spa",
                "genera_incidente": False,
                "justificacion_incidente": "Evento de confirmación de restablecimiento y vuelta a la normalidad tras ejecución del plan de respuesta.",
                "impacto": MonitoringEvent.NivelImpacto.BAJO,
                "urgencia": MonitoringEvent.NivelUrgencia.BAJA,
                "prioridad_asignada": "N/A",
                "responsable": "Monitoreo Automatizado TI",
                "accion_respuesta": "Verificación post-recuperación exitosa y cierre de alertas activas.",
                "tiempo_respuesta_max": "N/A",
                "estado": MonitoringEvent.Estado.CERRADO,
                "ticket_vinculado": None,
                "ticket_codigo": ""
            }
        ]

        for ev in event_seeds:
            MonitoringEvent.objects.update_or_create(codigo=ev["codigo"], defaults=ev)

        self.stdout.write(
            self.style.SUCCESS(
                f'Sincronización completa: {Ticket.objects.count()} tickets totales, '
                f'{KdbArticle.objects.count()} artículos KDB y {MonitoringEvent.objects.count()} eventos de monitoreo.'
            )
        )
