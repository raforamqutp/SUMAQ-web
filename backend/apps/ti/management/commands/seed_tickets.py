from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.ti.models import Ticket

class Command(BaseCommand):
    help = 'Semillero de tickets iniciales para la Mesa de Ayuda TI (ITIL v4)'

    def handle(self, *args, **options):
        if Ticket.objects.exists():
            self.stdout.write(self.style.SUCCESS(f'Ya existen {Ticket.objects.count()} tickets en la base de datos.'))
            return

        now = timezone.now()
        seeds = [
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
            }
        ]

        for s in seeds:
            s["sla_fecha_limite"] = now + timedelta(hours=s["sla_horas"])
            Ticket.objects.create(**s)

        self.stdout.write(self.style.SUCCESS(f'Se sembraron {len(seeds)} tickets exitosamente en la base de datos.'))
