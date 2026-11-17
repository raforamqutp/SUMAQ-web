from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.ti.models import Ticket, KdbArticle

class Command(BaseCommand):
    help = 'Semillero de tickets iniciales para Service Desk (Semana 10) y Control de Cambios RFC/CAB (Semana 11) - ITIL v4'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Recrea o actualiza los tickets sembrados')

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

        if Ticket.objects.count() >= 10 and not force:
            self.stdout.write(self.style.SUCCESS(f'Ya existen {Ticket.objects.count()} tickets en la base de datos.'))
            return

        now = timezone.now()
        seeds = [
            # =========================================================================
            # SEMANA 10: MESA DE AYUDA (SERVICE DESK) - SERVICIO, ACCESO, INCIDENCIA
            # =========================================================================
            {
                "codigo": "REQ-2026-0001",
                "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
                "prioridad": Ticket.Prioridad.P3_MEDIA,
                "asunto": "Desacoplamiento total de datos simulados hacia API REST real",
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
                "fecha_aprobacion": now - timedelta(days=2),
                "resolucion_tecnica": "Endpoints en /api/ conectando servicios de citas y pagos con axios y React Query.",
                "fecha_resolucion": now - timedelta(days=1),
                "jira_key": "KAN-1",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-1",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti"
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
                "fecha_aprobacion": now - timedelta(days=2),
                "resolucion_tecnica": "Script verificado con Checksum MD5 y Seconds_Behind_Master: 0 en contenedor 3309.",
                "fecha_resolucion": now - timedelta(days=1),
                "jira_key": "KAN-8",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-8",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti"
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
                "fecha_aprobacion": now - timedelta(days=2),
                "resolucion_tecnica": "Esquema de migración makemigrations generado con integridad referencial validada en tests unitarios.",
                "fecha_resolucion": now - timedelta(days=1),
                "jira_key": "KAN-7",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-7",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti"
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
                "fecha_aprobacion": now - timedelta(days=2),
                "resolucion_tecnica": "Seguridad RBAC configurada en común permissions.py y middleware de expiración de sesión.",
                "fecha_resolucion": now - timedelta(days=1),
                "jira_key": "KAN-6",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-6",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti"
            },
            {
                "codigo": "REQ-2026-0015",
                "tipo": Ticket.Tipo.SOLICITUD_ACCESO,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "Alta de cuenta para nueva recepcionista Camila Vega (Turno Tarde)",
                "descripcion": "Creación de usuario en el sistema con permisos de cobro POS, agenda y emisión de boletas tributarias.",
                "modulo": "Usuarios & Roles",
                "solicitante_nombre": "Recepcionista Principal",
                "solicitante_email": "recepcion@sumaqspa.pe",
                "solicitante_rol": "RECEPCIONISTA",
                "sla_horas": 8,
                "estado": Ticket.Estado.PENDIENTE_APROBACION,
                "asignado_a": "Anthony Luque (AL)",
                "aprobado_por_gerencia": False,
                "resolucion_tecnica": "",
                "jira_key": "KAN-15",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-15",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti"
            },
            {
                "codigo": "REQ-2026-0025",
                "tipo": Ticket.Tipo.INCIDENCIA,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "Implementación de arquitectura y monitor de replicación MySQL Master-Slave",
                "descripcion": "Configuración de nodo 3308 como maestro transaccional y 3309 como réplica de lectura para analítica de caja.",
                "modulo": "Base de Datos MySQL",
                "solicitante_nombre": "Bryan Mango (BT)",
                "solicitante_email": "bryan.mango@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 8,
                "estado": Ticket.Estado.EN_PROCESO,
                "asignado_a": "Rafael Ramirez Quiroz (RQ)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Gerente General)",
                "fecha_aprobacion": now - timedelta(hours=4),
                "resolucion_tecnica": "Slave_IO_Running: Yes, Slave_SQL_Running: Yes, Seconds_Behind_Master: 0.",
                "jira_key": "KAN-25",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-25",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti"
            },

            # =========================================================================
            # SEMANA 11: CONTROL DE CAMBIOS (ITIL v4) - LAS 4 ÁREAS DE CAMBIO
            # =========================================================================
            # ÁREA 1: INFRAESTRUCTURA (Hardware de red, Switch Administrable, VLANs)
            {
                "codigo": "RFC-2026-0050",
                "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
                "prioridad": Ticket.Prioridad.P2_ALTA,
                "asunto": "Reemplazo de Switch Administrable y Segmentación de VLANs 10, 20 y 30",
                "descripcion": "Sustitución física del switch no administrable por Switch Cisco Catalyst Gigabit 24p L2/L3 con soporte 802.1Q. Segmentación estricta: VLAN 10 (Gestión/POS/Servidor 3307), VLAN 20 (Tablets Cabinas 1, 2 y 3) y VLAN 30 (Wi-Fi Clientes con Client Isolation para evitar accesos indebidos a BD).",
                "modulo": "Redes & Hardware",
                "area_cambio": Ticket.AreaCambio.INFRAESTRUCTURA,
                "tipo_cambio": Ticket.TipoCambio.NORMAL,
                "impacto_riesgo": Ticket.ImpactoRiesgo.ALTO,
                "ventana_mantenimiento": "Martes 02:00 AM - 04:00 AM (Ventana Nocturna No Invasiva)",
                "plan_rollback": "Reconexión de patch cords al switch anterior en rack físico en menos de 10 minutos si fallan pruebas de ping a Gateway o transacción POS de prueba.",
                "solicitante_nombre": "Bryan Mango (DBA / Infraestructura)",
                "solicitante_email": "bryan.mango@sumaqspa.pe",
                "solicitante_rol": "ADMIN",
                "sla_horas": 48,
                "estado": Ticket.Estado.APROBADO,
                "asignado_a": "Bryan Mango (Infraestructura)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-050",
                "cab_fecha_aprobacion": now - timedelta(hours=12),
                "fecha_aprobacion": now - timedelta(hours=12),
                "resolucion_tecnica": "Pre-configuración en staging completada. VLANs 10, 20 y 30 etiquetadas. Listo para swap físico.",
                "jira_key": "KAN-40",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-40",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo"
            },
            # ÁREA 2: APLICACIONES Y BASE DE DATOS (Código, pasarelas, replicación)
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
                "asignado_a": "Anthony Luque (DevOps)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-042",
                "cab_fecha_aprobacion": now - timedelta(hours=6),
                "fecha_aprobacion": now - timedelta(hours=6),
                "resolucion_tecnica": "Pipeline CI/CD en GitHub Actions verificado con Pytest 100% pass y scan de seguridad Trivy.",
                "jira_key": "KAN-41",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-41",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo"
            },
            # ÁREA 3: DOCUMENTACIÓN (Manuales de Contingencia, Diagramas C4 y Topología)
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
                "asignado_a": "Rafael Ramirez (PO)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "Rafael Ramirez (Change Manager)",
                "cab_aprobado_por": "Rafael Ramirez (Change Manager)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-043",
                "cab_fecha_aprobacion": now - timedelta(days=1),
                "fecha_aprobacion": now - timedelta(days=1),
                "resolucion_tecnica": "Manuales y diagramas aprobados y distribuidos a recepción y cabinas de masajes.",
                "fecha_resolucion": now - timedelta(hours=2),
                "jira_key": "KAN-42",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-42",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo"
            },
            # ÁREA 4: CALENDARIO (Change Freeze, Ventanas de Mantenimiento)
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
                "asignado_a": "Rafael Ramirez (Change Manager)",
                "aprobado_por_gerencia": True,
                "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
                "cab_acta_numero": "ACTA-CAB-2026-W11-030",
                "cab_fecha_aprobacion": now - timedelta(days=1),
                "fecha_aprobacion": now - timedelta(days=1),
                "resolucion_tecnica": "Calendario de despliegues actualizado en GitHub Releases y notificado a todo el personal.",
                "jira_key": "KAN-43",
                "jira_url": "https://sumaq-dev.atlassian.net/browse/KAN-43",
                "github_url": "https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo"
            }
        ]

        for s in seeds:
            s["sla_fecha_limite"] = now + timedelta(hours=s["sla_horas"])
            Ticket.objects.update_or_create(codigo=s["codigo"], defaults=s)

        # Sembrado de Base de Conocimiento KDB (ITIL v4)
        kdb_seeds = [
            {
                "codigo": "KDB-2026-001",
                "titulo": "Error 502 / 504 Bad Gateway: Microservicio Backend API no responde",
                "categoria": KdbArticle.Categoria.INFRAESTRUCTURA,
                "modulo": "Infraestructura & Azure",
                "prioridad": KdbArticle.Prioridad.P1_CRITICA,
                "sintoma": "La aplicación muestra pantalla blanca o errores 502/504 al consultar citas o procesar pagos.",
                "causa_raiz": "Proceso Gunicorn en sumaq-backend saturado por fuga de memoria temporal o timeout en proxy NGINX.",
                "solucion_workaround": "1. Abrir terminal del servidor Azure o local.\n2. Ejecutar reinicio del contenedor: docker restart sumaq-backend\n3. Verificar salud del servicio: docker logs sumaq-backend --tail 30\n4. Validar respuesta en http://localhost:8000/api/catalogos/. Tiempo de recuperación estimado: < 30 seg.",
                "tiempo_estimado": "< 3 min",
                "jira_ref": "SUMAQ-KB-101",
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
                "solucion_workaround": "1. Solicitar re-login inmediato de la recepcionista para emitir nuevo Refresh Token.\n2. Si el error persiste, purgar caché de sesiones en Redis ejecutando: docker exec -it sumaq-redis redis-cli FLUSHDB\n3. Validar sincronización horaria del cliente con el servidor.",
                "tiempo_estimado": "< 2 min",
                "jira_ref": "SUMAQ-KB-102",
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
                "solucion_workaround": "1. Conectar a MySQL Slave (puerto 3309) y verificar estado: SHOW SLAVE STATUS\\G\n2. Si Slave_SQL_Running está en 'No', ejecutar: STOP REPLICA; START REPLICA;\n3. Como contingencia operativa inmediata, conmutar la lectura temporal al nodo Master (3308).",
                "tiempo_estimado": "< 5 min",
                "jira_ref": "SUMAQ-KB-103",
                "activo": True
            },
            {
                "codigo": "KDB-2026-004",
                "titulo": "Lentitud Extrema (>20s) en Checkout POS y Generación de Boletas PDF",
                "categoria": KdbArticle.Categoria.APLICACIONES,
                "modulo": "Punto de Venta / Caja",
                "prioridad": KdbArticle.Prioridad.P2_ALTA,
                "sintoma": "Al presionar 'Cobrar' en recepción, el modal se congela y demora en mostrar el comprobante descargable.",
                "causa_raiz": "Saturación en el motor de renderizado de boletas PDF o acumulación excesiva de LocalStorage en navegador.",
                "solucion_workaround": "1. Instruir al personal de caja presionar Ctrl + F5 para recargar el bundle estático del navegador.\n2. Limpiar recibos temporales en localStorage del navegador.\n3. Si persiste, reiniciar worker NGINX: docker restart sumaq-frontend.",
                "tiempo_estimado": "< 4 min",
                "jira_ref": "SUMAQ-KB-104",
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
                "solucion_workaround": "1. Ingresar a MySQL Master (3308) y ejecutar: SHOW FULL PROCESSLIST;\n2. Identificar el hilo en estado 'Waiting for table metadata lock' o con Time > 45 segundos.\n3. Ejecutar comando: KILL <process_id>; para liberar la tabla inmediatamente.",
                "tiempo_estimado": "< 5 min",
                "jira_ref": "SUMAQ-KB-105",
                "activo": True
            }
        ]

        for k in kdb_seeds:
            KdbArticle.objects.update_or_create(codigo=k["codigo"], defaults=k)

        # Vincular tickets de prueba a los artículos de KDB para reflejar uso real
        Ticket.objects.filter(modulo="Base de Datos MySQL").update(kdb_codigo="KDB-2026-003")

        self.stdout.write(self.style.SUCCESS(f'Se sincronizaron exitosamente {len(seeds)} tickets y {len(kdb_seeds)} artículos KDB en la base de datos.'))

