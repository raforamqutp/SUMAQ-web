import os
import re
import sys
import json
import time
import shutil
import socket
import ctypes
import base64
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import models, connection
from django.core.cache import cache
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Ticket, KdbArticle, MonitoringEvent
from .serializers import (
    TicketSerializer,
    TicketCreateSerializer,
    TicketAprobarSerializer,
    TicketCabAprobarSerializer,
    TicketResolverSerializer,
    KdbArticleSerializer,
    MonitoringEventSerializer,
    MonitoringEvaluateSerializer
)

DEFAULT_JIRA_DOMAIN = 'https://sumaq-dev.atlassian.net'
DEFAULT_JIRA_EMAIL = 'rafaelramirez.utp@gmail.com'
DEFAULT_JIRA_TOKEN = 'ATATT3xFfGF08u8nxmTYWYA6tO8DXXnlt-VwiaRooWs_U6BVL91xLOvnbB0JvZ3V-WqEQ2UIpnyQTo5ry8-4KlViLK3OnIXF527t4wT6jdFk2RZ38iiYZGyADe9_KzeovB9N7eZaBLBG0nVquqVhKd-nU32-4BKyLkx7oNVqnYMS6WrHyF7ZTGc=E4530C32'
DEFAULT_JIRA_PROJECT = 'KAN'


def _is_running_pytest() -> bool:
    return 'pytest' in sys.modules


def _get_jira_config(custom_cfg=None) -> dict:
    cached_cfg = cache.get('sumaq_jira_runtime_config') or {}
    cfg = custom_cfg or {}
    domain = (
        cfg.get('domain')
        or cached_cfg.get('domain')
        or os.environ.get('JIRA_BASE_URL')
        or DEFAULT_JIRA_DOMAIN
    ).strip().rstrip('/')
    if not domain.startswith('http://') and not domain.startswith('https://'):
        domain = f"https://{domain}"

    email = (
        cfg.get('email')
        or cached_cfg.get('email')
        or os.environ.get('JIRA_USER_EMAIL')
        or DEFAULT_JIRA_EMAIL
    ).strip()

    api_token = (
        cfg.get('api_token')
        or cached_cfg.get('api_token')
        or os.environ.get('JIRA_API_TOKEN')
        or DEFAULT_JIRA_TOKEN
    ).strip()

    project_key = (
        cfg.get('project_key')
        or cached_cfg.get('project_key')
        or os.environ.get('JIRA_PROJECT_KEY')
        or DEFAULT_JIRA_PROJECT
    ).strip().upper()

    return {
        "domain": domain,
        "email": email,
        "api_token": api_token,
        "project_key": project_key
    }


# Implementación: jira
def _call_jira_api(endpoint, method='POST', payload=None, custom_cfg=None, allow_in_test=False):
    """
    Helper utilitario para interactuar con Jira Cloud API v3 de forma segura y tolerante a fallos.
    Bloquea llamadas externas durante la ejecución de pytest para no generar issues duplicados.
    """
    if _is_running_pytest() and not allow_in_test:
        return {"success": False, "skipped": "pytest"}

    jcfg = _get_jira_config(custom_cfg)
    domain = jcfg['domain']
    email = jcfg['email']
    api_token = jcfg['api_token']

    if not api_token or not email:
        return {"success": False, "message": "Jira API credentials no configuradas"}

    url = f"{domain}{endpoint}"
    auth_str = f"{email}:{api_token}"
    auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

    req_data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=req_data, headers={
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }, method=method)

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status in (200, 201, 204):
                raw = resp.read().decode('utf-8')
                return {"success": True, "data": json.loads(raw) if raw else {}}
            return {"success": False, "status": resp.status}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _create_jira_issue_for_ticket(ticket: Ticket) -> bool:
    """
    Publica un Ticket recién creado en Jira Cloud API v3 y actualiza su jira_key y jira_url en MySQL.
    """
    if ticket.jira_key:
        return True
    jcfg = _get_jira_config()
    is_incident = ticket.tipo == Ticket.Tipo.INCIDENCIA
    jira_payload = {
        "fields": {
            "project": {"key": jcfg['project_key']},
            "summary": f"[{ticket.codigo}] {ticket.asunto}",
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": ticket.descripcion or ticket.asunto}]
                    }
                ]
            },
            "issuetype": {"name": "Bug" if is_incident else "Task"}
        }
    }
    jira_res = _call_jira_api('/rest/api/3/issue', method='POST', payload=jira_payload)
    if jira_res.get('success') and 'key' in jira_res.get('data', {}):
        j_key = jira_res['data']['key']
        ticket.jira_key = j_key
        ticket.jira_url = f"{jcfg['domain']}/browse/{j_key}"
        ticket.save(update_fields=['jira_key', 'jira_url'])
        return True
    return False


def _extract_adf_text(node) -> str:
    if not node:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, dict):
        if node.get('type') == 'text':
            return node.get('text', '')
        parts = [_extract_adf_text(child) for child in node.get('content', [])]
        sep = "\n" if node.get('type') in ('doc', 'paragraph', 'bulletList', 'orderedList', 'listItem') else " "
        return sep.join(p for p in parts if p).strip()
    if isinstance(node, list):
        return "\n".join(_extract_adf_text(item) for item in node if item).strip()
    return ""


def _parse_jira_datetime(iso_str: str):
    if not iso_str:
        return timezone.now()
    try:
        cleaned = iso_str.strip()
        if cleaned.endswith('Z'):
            cleaned = cleaned[:-1] + '+00:00'
        elif len(cleaned) >= 5 and (cleaned[-5] in ('+', '-')) and ':' not in cleaned[-5:]:
            cleaned = cleaned[:-2] + ':' + cleaned[-2:]
        dt = datetime.fromisoformat(cleaned)
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        return dt
    except Exception:
        return timezone.now()


# Catálogo determinístico de normalización para issues históricos de Jira Cloud (KAN)
HISTORICAL_JIRA_NORMALIZATION = {
    "KAN-1": {
        "codigo": "REQ-2026-0001",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Documentación & Calidad",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Matriz de 20 riesgos técnicos documentada y verificada con controles de mitigación en repositorio.",
        "kdb_codigo": ""
    },
    "KAN-2": {
        "codigo": "INC-2026-0002",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Base de Datos MySQL",
        "asignado_a": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_nombre": "Bryan Mango (BT)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.EN_PROCESO,
        "resolucion_tecnica": "Configuración de nodo 3308 como maestro transaccional y 3309 como réplica de lectura (Seconds_Behind_Master: 0).",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-3": {
        "codigo": "INC-2026-0003",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P1_CRITICA,
        "modulo": "Infraestructura & BD",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Anthony Luque (AL)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Orquestación Docker Compose verificada con healthchecks activos en sumaq-backend, mysql-master y redis.",
        "kdb_codigo": "KDB-2026-001"
    },
    "KAN-4": {
        "codigo": "INC-2026-0004",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Frontend & APIs",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Recepción Principal",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Validación de traslape de horarios y bloqueo de horas pasadas implementada en motor de citas.",
        "kdb_codigo": ""
    },
    "KAN-5": {
        "codigo": "INC-2026-0005",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Seguridad & Auth",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Bloqueo temporal de cuenta e IP tras 5 intentos fallidos de login activo con Redis.",
        "kdb_codigo": "KDB-2026-002"
    },
    "KAN-6": {
        "codigo": "REQ-2026-0006",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Seguridad & Auth",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Middleware de Rate Limiting y expiración automática de tokens JWT en 120 minutos.",
        "kdb_codigo": "KDB-2026-002"
    },
    "KAN-7": {
        "codigo": "REQ-2026-0007",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Base de Datos MySQL",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Anthony Luque (AL)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Normalización de integridad referencial RESTRICT compatible con MySQL 8.0 y Django ORM.",
        "kdb_codigo": "KDB-2026-005"
    },
    "KAN-8": {
        "codigo": "REQ-2026-0008",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Infraestructura & BD",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Anthony Luque (AL)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Scripts de backup y restore transaccional mysqldump --single-transaction verificados con checksum MD5.",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-9": {
        "codigo": "REQ-2026-0009",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Frontend & APIs",
        "asignado_a": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_nombre": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Endpoints REST en /api/ integrados con servicios de citas, inventario, finanzas y portal TI.",
        "kdb_codigo": ""
    },
    "KAN-10": {
        "codigo": "REQ-2026-0018",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Infraestructura & BD",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Elena Terapeuta",
        "solicitante_rol": "TERAPEUTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Reposición de stock de insumos BOM registrada en Kardex y sincronizada con réplica 3309.",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-11": {
        "codigo": "INC-2026-0011",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P1_CRITICA,
        "modulo": "Punto de Venta / Caja",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Elena Recepcionista",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Reinicio de worker de renderizado PDF y limpieza de caché local en terminal de caja POS.",
        "kdb_codigo": "KDB-2026-004"
    },
    "KAN-12": {
        "codigo": "REQ-2026-0012",
        "tipo": Ticket.Tipo.SOLICITUD_ACCESO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Usuarios & Roles",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Recepcionista Turno Tarde",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.PENDIENTE_APROBACION,
        "resolucion_tecnica": "",
        "kdb_codigo": ""
    },
    "KAN-25": {
        "codigo": "REQ-2026-0016",
        "tipo": Ticket.Tipo.SOLICITUD_INFORMACION,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Base de Datos MySQL",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Camila Vega (Recepción)",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Consulta analítica de reportes habilitada sobre el nodo MySQL Slave (puerto 3309).",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-26": {
        "codigo": "INC-2026-0016",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Infraestructura & BD",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Soporte TI SUMAQ",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Verificación de persistencia transaccional y sincronización entre contenedores Docker y Jira Cloud.",
        "kdb_codigo": "KDB-2026-001"
    },
    "KAN-29": {
        "codigo": "REQ-2026-0017",
        "tipo": Ticket.Tipo.SOLICITUD_ACCESO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Usuarios & Roles",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Recepción Principal",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Permisos RBAC ajustados bajo principio de menor privilegio y sesión JWT renovada.",
        "kdb_codigo": "KDB-2026-002"
    },
    "KAN-30": {
        "codigo": "REQ-2026-0019",
        "tipo": Ticket.Tipo.SOLICITUD_INFORMACION,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Base de Datos MySQL",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Área de Almacén y Cabinas",
        "solicitante_rol": "TERAPEUTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Reporte histórico de movimientos Kardex sincronizado desde réplica de lectura 3309.",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-40": {
        "codigo": "RFC-2026-0050",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Redes & Hardware",
        "area_cambio": Ticket.AreaCambio.INFRAESTRUCTURA,
        "tipo_cambio": Ticket.TipoCambio.NORMAL,
        "impacto_riesgo": Ticket.ImpactoRiesgo.ALTO,
        "ventana_mantenimiento": "Martes 02:00 AM - 04:00 AM (Ventana Nocturna No Invasiva)",
        "plan_rollback": "Reconexión de patch cords al switch anterior en rack físico en menos de 10 minutos.",
        "asignado_a": "Bryan Mango (Infraestructura)",
        "solicitante_nombre": "Bryan Mango (DBA / Infraestructura)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.APROBADO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-CAB-2026-W11-050",
        "resolucion_tecnica": "Pre-configuración en staging completada. VLANs 10, 20 y 30 etiquetadas.",
        "kdb_codigo": ""
    },
    "KAN-41": {
        "codigo": "RFC-2026-0042",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Aplicaciones & BD",
        "area_cambio": Ticket.AreaCambio.APLICACIONES,
        "tipo_cambio": Ticket.TipoCambio.NORMAL,
        "impacto_riesgo": Ticket.ImpactoRiesgo.MEDIO,
        "ventana_mantenimiento": "Jueves 02:30 AM - 03:30 AM",
        "plan_rollback": "Reversión de imagen de backend Docker a versión estable anterior en < 5 minutos.",
        "asignado_a": "Anthony Luque (DevOps)",
        "solicitante_nombre": "Anthony Luque (DevOps / Frontend)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.APROBADO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-CAB-2026-W11-042",
        "resolucion_tecnica": "Pipeline CI/CD en GitHub Actions verificado con Pytest 100% pass.",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-42": {
        "codigo": "RFC-2026-0043",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Documentación & Calidad",
        "area_cambio": Ticket.AreaCambio.DOCUMENTACION,
        "tipo_cambio": Ticket.TipoCambio.ESTANDAR,
        "impacto_riesgo": Ticket.ImpactoRiesgo.BAJO,
        "ventana_mantenimiento": "Horario Laboral Diurno (Procedimiento Documental No Invasivo)",
        "plan_rollback": "Restauración de versión previa de la documentación en la wiki interna de TI.",
        "asignado_a": "Rafael Ramirez (PO)",
        "solicitante_nombre": "Rafael Ramirez (Product Owner)",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "Rafael Ramirez (Change Manager)",
        "cab_aprobado_por": "Rafael Ramirez (Change Manager)",
        "cab_acta_numero": "ACTA-CAB-2026-W11-043",
        "resolucion_tecnica": "Manuales y diagramas aprobados y distribuidos a recepción y cabinas.",
        "kdb_codigo": ""
    },
    "KAN-43": {
        "codigo": "RFC-2026-0030",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Operaciones & Calendario",
        "area_cambio": Ticket.AreaCambio.CALENDARIO,
        "tipo_cambio": Ticket.TipoCambio.NORMAL,
        "impacto_riesgo": Ticket.ImpactoRiesgo.MEDIO,
        "ventana_mantenimiento": "10 de Febrero 00:00 hrs al 16 de Febrero 23:59 hrs",
        "plan_rollback": "Desbloqueo de emergencia de pipeline CI/CD con flag OVERRIDE_FREEZE=true previa autorización del CAB.",
        "asignado_a": "Rafael Ramirez (Change Manager)",
        "solicitante_nombre": "Administradora General SUMAQ",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.APROBADO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-CAB-2026-W11-030",
        "resolucion_tecnica": "Calendario de despliegues actualizado en GitHub Releases y notificado al personal.",
        "kdb_codigo": ""
    },
    "KAN-44": {
        "codigo": "RFC-2026-0020",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Redes & Hardware",
        "area_cambio": Ticket.AreaCambio.INFRAESTRUCTURA,
        "tipo_cambio": Ticket.TipoCambio.NORMAL,
        "impacto_riesgo": Ticket.ImpactoRiesgo.ALTO,
        "ventana_mantenimiento": "Miércoles 01:00 AM - 03:00 AM",
        "plan_rollback": "Restauración de router de respaldo preconfigurado en < 10 minutos.",
        "asignado_a": "Bryan Mango (Infraestructura)",
        "solicitante_nombre": "Jefatura de Operaciones Spa",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.APROBADO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-CAB-2026-W11-020",
        "resolucion_tecnica": "Router de borde reemplazado con reglas NAT y firewall verificadas.",
        "kdb_codigo": ""
    },
    "KAN-96": {
        "codigo": "RFC-2026-0021",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Redes & Hardware",
        "area_cambio": Ticket.AreaCambio.INFRAESTRUCTURA,
        "tipo_cambio": Ticket.TipoCambio.ESTANDAR,
        "impacto_riesgo": Ticket.ImpactoRiesgo.BAJO,
        "ventana_mantenimiento": "Domingo 22:00 PM - 23:30 PM",
        "plan_rollback": "Conmutación a enlaces inalámbricos de respaldo en VLAN 10.",
        "asignado_a": "Bryan Mango (Infraestructura)",
        "solicitante_nombre": "Soporte de Redes TI",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.RESUELTO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-CAB-2026-W11-021",
        "resolucion_tecnica": "Reemplazo de patch cords Cat6A certificados en gabinete principal.",
        "kdb_codigo": ""
    },
    "KAN-100": {
        "codigo": "INC-2026-0021",
        "tipo": Ticket.Tipo.INCIDENCIA,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Punto de Venta / Caja",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Recepción Caja Principal",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Optimización de generación de boletas PDF y limpieza de cola de almacenamiento local en POS.",
        "kdb_codigo": "KDB-2026-004"
    },
    "KAN-101": {
        "codigo": "REQ-2026-0022",
        "tipo": Ticket.Tipo.SOLICITUD_INFORMACION,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Punto de Venta / Caja",
        "asignado_a": "Bryan Mango (BT)",
        "solicitante_nombre": "Recepción Turno Mañana",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Extracto histórico de transacciones del cliente exportado desde réplica MySQL 3309.",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-105": {
        "codigo": "REQ-2026-0023",
        "tipo": Ticket.Tipo.SOLICITUD_ACCESO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Usuarios & Roles",
        "asignado_a": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_nombre": "Terapeuta Cabina 1",
        "solicitante_rol": "TERAPEUTA",
        "estado": Ticket.Estado.RESUELTO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "Rafael Ramirez (Gerente General)",
        "resolucion_tecnica": "Restablecimiento de credenciales ejecutado con invalidación de token anterior en Redis.",
        "kdb_codigo": "KDB-2026-002"
    },
    "KAN-106": {
        "codigo": "REQ-2026-0024",
        "tipo": Ticket.Tipo.SOLICITUD_SERVICIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Frontend & APIs",
        "asignado_a": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_nombre": "Coordinación de Cabinas",
        "solicitante_rol": "TERAPEUTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Nuevo tratamiento incorporado al catálogo maestro de servicios y sincronizado con el portal de reservas.",
        "kdb_codigo": ""
    },
    "KAN-107": {
        "codigo": "RFC-2026-0025",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P2_ALTA,
        "modulo": "Aplicaciones & BD",
        "area_cambio": Ticket.AreaCambio.APLICACIONES,
        "tipo_cambio": Ticket.TipoCambio.EMERGENCIA,
        "impacto_riesgo": Ticket.ImpactoRiesgo.ALTO,
        "ventana_mantenimiento": "Ventana de Emergencia ECAB (15 minutos)",
        "plan_rollback": "Conmutación directa de lecturas al nodo Master 3308.",
        "asignado_a": "Bryan Mango (DBA / Infraestructura)",
        "solicitante_nombre": "Recepción Caja Principal",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-ECAB-2026-W12-025",
        "resolucion_tecnica": "Sincronización de réplica Slave 3309 restablecida y vista de pagos de recepción normalizada.",
        "kdb_codigo": "KDB-2026-003"
    },
    "KAN-111": {
        "codigo": "REQ-2026-0026",
        "tipo": Ticket.Tipo.SOLICITUD_INFORMACION,
        "prioridad": Ticket.Prioridad.P4_BAJA,
        "modulo": "Base de Datos MySQL",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Atención al Cliente",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Ficha histórica de sesiones atendidas del cliente generada desde el módulo de reportes.",
        "kdb_codigo": ""
    },
    "KAN-112": {
        "codigo": "REQ-2026-0027",
        "tipo": Ticket.Tipo.SOLICITUD_INFORMACION,
        "prioridad": Ticket.Prioridad.P4_BAJA,
        "modulo": "Documentación & Calidad",
        "asignado_a": "Anthony Luque (AL)",
        "solicitante_nombre": "Recepción Turno Tarde",
        "solicitante_rol": "RECEPCIONISTA",
        "estado": Ticket.Estado.RESUELTO,
        "resolucion_tecnica": "Procedimiento operativo entregado desde el catálogo interno de documentación.",
        "kdb_codigo": ""
    },
    "KAN-113": {
        "codigo": "RFC-2026-0028",
        "tipo": Ticket.Tipo.SOLICITUD_CAMBIO,
        "prioridad": Ticket.Prioridad.P3_MEDIA,
        "modulo": "Usuarios & Roles",
        "area_cambio": Ticket.AreaCambio.APLICACIONES,
        "tipo_cambio": Ticket.TipoCambio.ESTANDAR,
        "impacto_riesgo": Ticket.ImpactoRiesgo.BAJO,
        "ventana_mantenimiento": "Horario Operativo (Cambio Estándar Pre-aprobado)",
        "plan_rollback": "Reversión de perfil de rol en tabla de cuentas de usuario.",
        "asignado_a": "Rafael Ramirez Quiroz (RQ)",
        "solicitante_nombre": "Administración SUMAQ",
        "solicitante_rol": "ADMIN",
        "estado": Ticket.Estado.APROBADO,
        "aprobado_por_gerencia": True,
        "aprobador_nombre": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_aprobado_por": "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)",
        "cab_acta_numero": "ACTA-CAB-2026-W12-028",
        "resolucion_tecnica": "Actualización de permisos de rol aplicada en módulo de usuarios.",
        "kdb_codigo": ""
    }
}

PYTEST_SPAM_SUMMARIES = {
    '[INC-2026-0010] Error en emisión de boleta POS',
    '[REQ-2026-0010] Alta de usuario para terapeuta Sofia Vargas',
    '[RFC-2026-0010] Reemplazo de Switch Administrable 24p'
}


def _auto_sync_from_jira(force: bool = False) -> dict:
    """
    Sincroniza automáticamente los issues históricos y nuevos desde Jira Cloud hacia MySQL,
    preservando intactas las fechas históricas (created_at) y normalizando códigos y campos nulos.
    """
    if _is_running_pytest():
        return {"synced": 0, "skipped": "pytest"}

    if not force and cache.get('sumaq_jira_auto_sync_lock'):
        return {"synced": 0, "cached": True}

    cache.set('sumaq_jira_auto_sync_lock', True, timeout=45)
    jcfg = _get_jira_config()
    domain = jcfg['domain']
    project_key = jcfg['project_key']

    all_issues = []
    next_token = None
    try:
        while True:
            endpoint = (
                f"/rest/api/3/search/jql?jql=project={project_key}+ORDER+BY+created+ASC"
                f"&maxResults=100&fields=summary,status,issuetype,priority,created,updated,resolutiondate,assignee,reporter,description"
            )
            if next_token:
                endpoint += f"&nextPageToken={next_token}"
            res = _call_jira_api(endpoint, method='GET')
            if not res.get('success'):
                break
            data = res.get('data', {})
            batch = data.get('issues', [])
            all_issues.extend(batch)
            next_token = data.get('nextPageToken')
            if not next_token or data.get('isLast', True):
                break
    except Exception:
        return {"synced": 0, "error": "jira_unreachable"}

    if not all_issues:
        return {"synced": 0}

    synced_count = 0
    for issue in all_issues:
        key = issue.get('key', '').strip()
        if not key:
            continue
        fields = issue.get('fields', {}) or {}
        raw_summary = (fields.get('summary') or '').strip()

        # Filtrar los 103 issues duplicados generados por pytest en el pasado (conservar solo KAN-11 y KAN-12)
        if raw_summary in PYTEST_SPAM_SUMMARIES and key not in ('KAN-11', 'KAN-12'):
            continue

        created_dt = _parse_jira_datetime(fields.get('created'))
        preset = HISTORICAL_JIRA_NORMALIZATION.get(key)

        # Limpiar prefijos [REQ-...] / [INC-...] / [RFC-...] del asunto para evitar duplicación visual
        code_match = re.match(r'^\[([A-Z]{3}-\d{4}-\d{3,5})\]\s*(.*)$', raw_summary)
        extracted_code = code_match.group(1) if code_match else ''
        clean_asunto = code_match.group(2).strip() if code_match else raw_summary
        clean_asunto = re.sub(r'^\[(INFRAESTRUCTURA|APLICACIONES|DOCUMENTACION|CALENDARIO)\]\s*', '', clean_asunto).strip()
        if not clean_asunto:
            clean_asunto = f"Requerimiento Técnico {key}"

        raw_desc = _extract_adf_text(fields.get('description'))
        if not raw_desc:
            raw_desc = f"{clean_asunto}. Registro sincronizado y normalizado desde Atlassian Jira Cloud ({key})."

        if preset:
            codigo = preset['codigo']
            tipo = preset['tipo']
            prioridad = preset['prioridad']
            modulo = preset['modulo']
            asignado_a = preset['asignado_a']
            solicitante_nombre = preset['solicitante_nombre']
            solicitante_rol = preset['solicitante_rol']
            estado = preset['estado']
            resolucion_tecnica = preset.get('resolucion_tecnica', '')
            kdb_codigo = preset.get('kdb_codigo', '')
            area_cambio = preset.get('area_cambio')
            tipo_cambio = preset.get('tipo_cambio', Ticket.TipoCambio.NORMAL)
            impacto_riesgo = preset.get('impacto_riesgo', Ticket.ImpactoRiesgo.MEDIO)
            ventana_mantenimiento = preset.get('ventana_mantenimiento', '')
            plan_rollback = preset.get('plan_rollback', '')
            aprobado_por_gerencia = preset.get('aprobado_por_gerencia', estado in (Ticket.Estado.APROBADO, Ticket.Estado.RESUELTO))
            aprobador_nombre = preset.get('aprobador_nombre', 'Rafael Ramirez (Gerente General)' if aprobado_por_gerencia else '')
            cab_aprobado_por = preset.get('cab_aprobado_por', '')
            cab_acta_numero = preset.get('cab_acta_numero', '')
        else:
            # Inferir estructura normalizada para cualquier issue nuevo creado en Jira Cloud
            itype_name = ((fields.get('issuetype') or {}).get('name') or '').lower()
            if extracted_code.startswith('RFC-') or 'rfc' in raw_summary.lower() or 'cambio' in raw_summary.lower():
                tipo = Ticket.Tipo.SOLICITUD_CAMBIO
                prefix = 'RFC'
            elif extracted_code.startswith('INC-') or 'error' in itype_name or 'bug' in itype_name:
                tipo = Ticket.Tipo.INCIDENCIA
                prefix = 'INC'
            else:
                tipo = Ticket.Tipo.SOLICITUD_SERVICIO
                prefix = 'REQ'

            # Verificar si ya existe por jira_key o por extracted_code
            existing_by_key = Ticket.objects.filter(jira_key=key).first()
            if existing_by_key:
                codigo = existing_by_key.codigo
            elif extracted_code and not Ticket.objects.filter(codigo=extracted_code).exclude(jira_key__in=['', key]).exists():
                codigo = extracted_code
            else:
                key_num = key.split('-')[-1] if '-' in key else '99'
                candidate = f"{prefix}-{created_dt.year}-{int(key_num):04d}" if key_num.isdigit() else Ticket.generar_siguiente_codigo(prefix)
                if Ticket.objects.filter(codigo=candidate).exclude(jira_key__in=['', key]).exists():
                    candidate = Ticket.generar_siguiente_codigo(prefix)
                codigo = candidate

            low_sum = clean_asunto.lower()
            if 'mysql' in low_sum or 'base de datos' in low_sum or 'replica' in low_sum or 'kardex' in low_sum:
                modulo = 'Base de Datos MySQL'
                kdb_codigo = 'KDB-2026-003'
                default_assignee = 'Bryan Mango (BT)'
            elif 'pos' in low_sum or 'boleta' in low_sum or 'cobrar' in low_sum or 'pago' in low_sum:
                modulo = 'Punto de Venta / Caja'
                kdb_codigo = 'KDB-2026-004'
                default_assignee = 'Anthony Luque (AL)'
            elif 'login' in low_sum or 'contraseña' in low_sum or 'acceso' in low_sum or 'usuario' in low_sum:
                modulo = 'Seguridad & Auth'
                kdb_codigo = 'KDB-2026-002'
                default_assignee = 'Bryan Mango (BT)'
            elif 'switch' in low_sum or 'router' in low_sum or 'cable' in low_sum or 'red' in low_sum:
                modulo = 'Redes & Hardware'
                kdb_codigo = ''
                default_assignee = 'Bryan Mango (Infraestructura)'
            else:
                modulo = 'Infraestructura & BD'
                kdb_codigo = 'KDB-2026-001' if tipo == Ticket.Tipo.INCIDENCIA else ''
                default_assignee = 'Anthony Luque (AL)'

            jira_assignee = ((fields.get('assignee') or {}).get('displayName') or '').strip()
            if 'bryan' in jira_assignee.lower() or 'alexis' in jira_assignee.lower():
                asignado_a = 'Bryan Mango (BT)'
            elif 'anthony' in jira_assignee.lower():
                asignado_a = 'Anthony Luque (AL)'
            elif 'rafael' in jira_assignee.lower():
                asignado_a = 'Rafael Ramirez Quiroz (RQ)'
            else:
                asignado_a = default_assignee

            j_status = ((fields.get('status') or {}).get('name') or '').lower()
            if 'finaliz' in j_status or 'done' in j_status or 'resuelt' in j_status:
                estado = Ticket.Estado.RESUELTO
            elif 'progreso' in j_status or 'revisión' in j_status or 'progress' in j_status:
                estado = Ticket.Estado.EN_PROCESO
            else:
                estado = Ticket.Estado.PENDIENTE_APROBACION if tipo == Ticket.Tipo.SOLICITUD_CAMBIO else Ticket.Estado.ABIERTO

            prioridad = Ticket.Prioridad.P2_ALTA if tipo == Ticket.Tipo.INCIDENCIA else Ticket.Prioridad.P3_MEDIA
            solicitante_nombre = 'Usuario Sumaq'
            solicitante_rol = 'RECEPCIONISTA'
            resolucion_tecnica = 'Atendido y sincronizado con Jira Cloud.' if estado == Ticket.Estado.RESUELTO else ''
            area_cambio = Ticket.AreaCambio.INFRAESTRUCTURA if tipo == Ticket.Tipo.SOLICITUD_CAMBIO else None
            tipo_cambio = Ticket.TipoCambio.NORMAL
            impacto_riesgo = Ticket.ImpactoRiesgo.MEDIO
            ventana_mantenimiento = ''
            plan_rollback = ''
            aprobado_por_gerencia = estado == Ticket.Estado.RESUELTO
            aprobador_nombre = 'Rafael Ramirez (Gerente General)' if aprobado_por_gerencia else ''
            cab_aprobado_por = ''
            cab_acta_numero = ''

        sla_horas = 2 if prioridad == Ticket.Prioridad.P1_CRITICA else (8 if prioridad == Ticket.Prioridad.P2_ALTA else (24 if prioridad == Ticket.Prioridad.P3_MEDIA else 48))
        sla_limite = created_dt + timedelta(hours=sla_horas)
        jira_url = f"{domain}/browse/{key}"

        existing = Ticket.objects.filter(models.Q(jira_key=key) | models.Q(codigo=codigo)).first()
        if existing:
            # Preservar siempre la fecha histórica original de Jira y completar campos vacíos/nulos
            update_fields = []
            if existing.created_at != created_dt:
                existing.created_at = created_dt
                existing.sla_fecha_limite = sla_limite
                update_fields.extend(['created_at', 'sla_fecha_limite'])
            if existing.jira_key != key:
                existing.jira_key = key
                existing.jira_url = jira_url
                update_fields.extend(['jira_key', 'jira_url'])
            if not existing.asignado_a and asignado_a:
                existing.asignado_a = asignado_a
                update_fields.append('asignado_a')
            if not existing.kdb_codigo and kdb_codigo:
                existing.kdb_codigo = kdb_codigo
                update_fields.append('kdb_codigo')
            if not existing.modulo or existing.modulo == 'General':
                existing.modulo = modulo
                update_fields.append('modulo')
            if update_fields:
                existing.save(update_fields=list(set(update_fields)))
        else:
            Ticket.objects.create(
                codigo=codigo,
                tipo=tipo,
                prioridad=prioridad,
                modulo=modulo,
                asunto=clean_asunto,
                descripcion=raw_desc,
                area_cambio=area_cambio,
                tipo_cambio=tipo_cambio,
                impacto_riesgo=impacto_riesgo,
                ventana_mantenimiento=ventana_mantenimiento,
                plan_rollback=plan_rollback,
                cab_aprobado_por=cab_aprobado_por,
                cab_acta_numero=cab_acta_numero,
                cab_fecha_aprobacion=created_dt + timedelta(hours=2) if cab_aprobado_por else None,
                solicitante_nombre=solicitante_nombre,
                solicitante_email='operaciones@sumaqspa.pe',
                solicitante_rol=solicitante_rol,
                sla_horas=sla_horas,
                sla_fecha_limite=sla_limite,
                estado=estado,
                asignado_a=asignado_a,
                aprobado_por_gerencia=aprobado_por_gerencia,
                aprobador_nombre=aprobador_nombre,
                fecha_aprobacion=created_dt + timedelta(hours=1) if aprobado_por_gerencia else None,
                resolucion_tecnica=resolucion_tecnica,
                fecha_resolucion=created_dt + timedelta(hours=3) if estado == Ticket.Estado.RESUELTO else None,
                jira_key=key,
                jira_url=jira_url,
                github_url='https://github.com/raforamqutp/SUMAQ-web/tree/Integrador_Tic_Monitoreo_Eventos_v4',
                kdb_codigo=kdb_codigo,
                created_at=created_dt
            )
            synced_count += 1

    return {"synced": synced_count, "total_jira": len(all_issues)}


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión integral de Tickets de la Mesa de Ayuda y Control de Cambios (ITIL v4).
    """
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        val = self.kwargs[lookup_url_kwarg]
        if str(val).isdigit():
            obj = Ticket.objects.filter(pk=val).first()
        else:
            obj = Ticket.objects.filter(codigo=val).first()
        if not obj:
            obj = Ticket.objects.filter(codigo__iexact=val).first()
        if not obj:
            from django.http import Http404
            raise Http404(f'Ticket no encontrado con identificador {val}')
        return obj

    def get_queryset(self):
        if self.action == 'list':
            _auto_sync_from_jira(force=False)
        qs = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        estado = self.request.query_params.get('estado')
        prioridad = self.request.query_params.get('prioridad')
        area_cambio = self.request.query_params.get('area_cambio')
        tipo_cambio = self.request.query_params.get('tipo_cambio')
        search = self.request.query_params.get('search')

        if tipo and tipo != 'TODOS':
            qs = qs.filter(tipo=tipo)
        if estado and estado != 'TODOS':
            qs = qs.filter(estado=estado)
        if prioridad and prioridad != 'TODOS':
            qs = qs.filter(prioridad=prioridad)
        if area_cambio and area_cambio != 'TODOS':
            qs = qs.filter(area_cambio=area_cambio)
        if tipo_cambio and tipo_cambio != 'TODOS':
            qs = qs.filter(tipo_cambio=tipo_cambio)
        if search:
            qs = qs.filter(
                models.Q(asunto__icontains=search) |
                models.Q(descripcion__icontains=search) |
                models.Q(codigo__icontains=search) |
                models.Q(solicitante_nombre__icontains=search) |
                models.Q(modulo__icontains=search) |
                models.Q(jira_key__icontains=search) |
                models.Q(kdb_codigo__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        is_incident = data['tipo'] == Ticket.Tipo.INCIDENCIA
        is_change = data['tipo'] == Ticket.Tipo.SOLICITUD_CAMBIO
        if is_change:
            prefix = 'RFC'
        elif is_incident:
            prefix = 'INC'
        else:
            prefix = 'REQ'

        codigo = Ticket.generar_siguiente_codigo(prefix)

        prioridad = data.get('prioridad', Ticket.Prioridad.P3_MEDIA)
        sla_horas = 24
        if prioridad == Ticket.Prioridad.P1_CRITICA:
            sla_horas = 2
        elif prioridad == Ticket.Prioridad.P2_ALTA:
            sla_horas = 8
        elif prioridad == Ticket.Prioridad.P3_MEDIA:
            sla_horas = 24
        elif prioridad == Ticket.Prioridad.P4_BAJA:
            sla_horas = 48

        sla_fecha_limite = timezone.now() + timedelta(hours=sla_horas)

        initial_state = Ticket.Estado.ABIERTO
        if data['tipo'] in (Ticket.Tipo.SOLICITUD_ACCESO, Ticket.Tipo.SOLICITUD_CAMBIO):
            initial_state = Ticket.Estado.PENDIENTE_APROBACION

        kdb_cod = (data.get('kdb_codigo') or request.data.get('kdbCodigo') or '').strip()

        ticket = Ticket.objects.create(
            codigo=codigo,
            tipo=data['tipo'],
            prioridad=prioridad,
            modulo=data.get('modulo', 'General'),
            asunto=data['asunto'].strip(),
            descripcion=data['descripcion'].strip(),
            area_cambio=data.get('area_cambio'),
            tipo_cambio=data.get('tipo_cambio', Ticket.TipoCambio.NORMAL),
            impacto_riesgo=data.get('impacto_riesgo', Ticket.ImpactoRiesgo.MEDIO),
            ventana_mantenimiento=data.get('ventana_mantenimiento', ''),
            plan_rollback=data.get('plan_rollback', ''),
            solicitante_nombre=data.get('solicitante_nombre', 'Usuario Sumaq'),
            solicitante_email=data.get('solicitante_email', 'usuario@sumaqspa.pe'),
            solicitante_rol=data.get('solicitante_rol', 'TERAPEUTA'),
            sla_horas=sla_horas,
            sla_fecha_limite=sla_fecha_limite,
            estado=initial_state,
            asignado_a=data.get('asignado_a', 'Rafael Ramirez Quiroz (RQ)'),
            kdb_codigo=kdb_cod
        )

        _create_jira_issue_for_ticket(ticket)
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        ticket = self.get_object()
        payload = request.data
        jcfg = _get_jira_config()

        if 'estado' in payload and payload['estado']:
            ticket.estado = payload['estado']
            if ticket.estado == Ticket.Estado.RESUELTO and not ticket.fecha_resolucion:
                ticket.fecha_resolucion = timezone.now()

        for src_key, attr in [
            ('asignado_a', 'asignado_a'),
            ('asignadoA', 'asignado_a'),
            ('resolucion_tecnica', 'resolucion_tecnica'),
            ('resolucionTecnica', 'resolucion_tecnica'),
            ('github_url', 'github_url'),
            ('githubUrl', 'github_url'),
            ('kdb_codigo', 'kdb_codigo'),
            ('kdbCodigo', 'kdb_codigo'),
            ('prioridad', 'prioridad'),
            ('modulo', 'modulo'),
            ('asunto', 'asunto'),
            ('descripcion', 'descripcion'),
            ('ventana_mantenimiento', 'ventana_mantenimiento'),
            ('ventanaMantenimiento', 'ventana_mantenimiento'),
            ('plan_rollback', 'plan_rollback'),
            ('planRollback', 'plan_rollback'),
        ]:
            if src_key in payload and payload[src_key] is not None:
                setattr(ticket, attr, str(payload[src_key]).strip())

        j_key = payload.get('jira_key') if 'jira_key' in payload else payload.get('jiraKey')
        if j_key is not None:
            j_key_str = str(j_key).strip().upper()
            ticket.jira_key = j_key_str
            ticket.jira_url = f"{jcfg['domain']}/browse/{j_key_str}" if j_key_str else ''

        ticket.save()

        if ticket.jira_key:
            comment_payload = {
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        f"[ACTUALIZACIÓN SERVICE DESK]: Estado={ticket.estado} | "
                                        f"Especialista={ticket.asignado_a or 'TI N2'} | "
                                        f"KDB={ticket.kdb_codigo or 'N/A'} | "
                                        f"Dictamen={ticket.resolucion_tecnica or 'En seguimiento'}"
                                    )
                                }
                            ]
                        }
                    ]
                }
            }
            _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)

        return Response({
            "success": True,
            "ticket": TicketSerializer(ticket).data
        }, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='aprobar')
    # Implementación: polp-aprobacion
    def aprobar(self, request, pk=None):
        """
        Aprobación formal de Solicitud de Acceso por Gerencia General (Dueño - Rol ADMIN).
        """
        ticket = self.get_object()

        aprobador = "Gerencia General (Dueño)"
        if request.user and request.user.is_authenticated:
            aprobador = f"{request.user.nombre_completo} (Gerente General)"
        elif request.data.get('aprobador_nombre'):
            aprobador = request.data.get('aprobador_nombre')

        ticket.aprobado_por_gerencia = True
        ticket.aprobador_nombre = aprobador
        ticket.fecha_aprobacion = timezone.now()
        ticket.estado = Ticket.Estado.APROBADO
        ticket.save()

        # Notificar en Jira Cloud como comentario de auditoría
        if ticket.jira_key:
            comment_payload = {
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"✅ [AUTORIZACIÓN FORMAL DE NEGOCIO]: Solicitud aprobada con éxito por {aprobador} el {ticket.fecha_aprobacion.strftime('%Y-%m-%d %H:%M:%S')}. Proceder con la provisión de usuario en BD bajo principio de menor privilegio."
                                }
                            ]
                        }
                    ]
                }
            }
            _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)

        return Response({
            "success": True,
            "message": f"Ticket {ticket.codigo} formalmente aprobado por {aprobador}.",
            "ticket": TicketSerializer(ticket).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='cab-aprobar')
    # Implementación: cab
    def cab_aprobar(self, request, pk=None):
        """
        Aprobación formal de Solicitud de Cambio (RFC) por el Comité CAB (Change Advisory Board).
        """
        ticket = self.get_object()
        serializer = TicketCabAprobarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cab_aprobador = data.get('cab_aprobador') or "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)"
        sufijo = ticket.codigo.split('-')[-1] if '-' in ticket.codigo else "042"
        cab_acta = data.get('cab_acta') or f"ACTA-CAB-2026-W11-{sufijo}"

        ticket.cab_aprobado_por = cab_aprobador
        ticket.cab_acta_numero = cab_acta
        ticket.cab_fecha_aprobacion = timezone.now()
        ticket.aprobado_por_gerencia = True
        ticket.aprobador_nombre = cab_aprobador
        ticket.estado = Ticket.Estado.APROBADO
        ticket.save()

        # Comentario de auditoría en Jira Cloud
        if ticket.jira_key:
            comment_payload = {
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"🏛️ [RESOLUCIÓN FORMAL COMITÉ CAB]: Solicitud de Cambio {ticket.codigo} APROBADA UNÁNIMEMENTE por {cab_aprobador}. Acta oficial: {cab_acta}. Ventana autorizada: {ticket.ventana_mantenimiento or 'Nocturna 02:00-04:00 AM'}. Plan de Rollback: {ticket.plan_rollback or 'Activo (< 10 min)'}."
                                }
                            ]
                        }
                    ]
                }
            }
            _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)

        return Response({
            "success": True,
            "message": f"Solicitud {ticket.codigo} aprobada por el Comité CAB ({cab_acta}).",
            "ticket": TicketSerializer(ticket).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], url_path='resolver')
    def resolver(self, request, pk=None):
        """
        Dictamen y resolución técnica por parte del especialista de TI (Soporte N2).
        """
        ticket = self.get_object()
        serializer = TicketResolverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        jcfg = _get_jira_config()

        ticket.estado = Ticket.Estado.RESUELTO
        ticket.resolucion_tecnica = data['resolucion_tecnica'].strip()
        ticket.fecha_resolucion = timezone.now()

        if data.get('asignado_a'):
            ticket.asignado_a = data['asignado_a']
        if data.get('github_url'):
            ticket.github_url = data['github_url']
        if data.get('kdb_codigo') is not None:
            ticket.kdb_codigo = data['kdb_codigo'].strip()
        elif request.data.get('kdbCodigo') is not None:
            ticket.kdb_codigo = str(request.data.get('kdbCodigo')).strip()
        if data.get('jira_key'):
            j_key = data['jira_key'].strip().upper()
            ticket.jira_key = j_key
            ticket.jira_url = f"{jcfg['domain']}/browse/{j_key}"

        ticket.save()

        # Notificar resolución en Jira Cloud
        if ticket.jira_key:
            comment_payload = {
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        f"🎉 [RESOLUCIÓN TÉCNICA - SERVICE DESK]: {ticket.resolucion_tecnica}. "
                                        f"Especialista: {ticket.asignado_a or 'TI N2'}. "
                                        f"KDB: {ticket.kdb_codigo or 'N/A'}."
                                    )
                                }
                            ]
                        }
                    ]
                }
            }
            _call_jira_api(f'/rest/api/3/issue/{ticket.jira_key}/comment', method='POST', payload=comment_payload)

        return Response({
            "success": True,
            "message": f"Ticket {ticket.codigo} resuelto con éxito.",
            "ticket": TicketSerializer(ticket).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='metricas')
    def metricas(self, request):
        """
        Dashboard de Métricas ITIL v4 y Gestión de Problemas en tiempo real.
        """
        from django.db.models import Count

        _auto_sync_from_jira(force=False)

        total = Ticket.objects.count()
        abiertos = Ticket.objects.filter(estado=Ticket.Estado.ABIERTO).count()
        en_proceso = Ticket.objects.filter(estado=Ticket.Estado.EN_PROCESO).count()
        pendientes_aprobacion = Ticket.objects.filter(estado=Ticket.Estado.PENDIENTE_APROBACION).count()
        aprobados = Ticket.objects.filter(estado=Ticket.Estado.APROBADO).count()
        resueltos = Ticket.objects.filter(estado=Ticket.Estado.RESUELTO).count()

        # Métricas de Cambios (Semana 11)
        total_rfcs = Ticket.objects.filter(tipo=Ticket.Tipo.SOLICITUD_CAMBIO).count()
        rfcs_aprobados = Ticket.objects.filter(tipo=Ticket.Tipo.SOLICITUD_CAMBIO, estado=Ticket.Estado.APROBADO).count()
        rfcs_pendientes = Ticket.objects.filter(tipo=Ticket.Tipo.SOLICITUD_CAMBIO, estado=Ticket.Estado.PENDIENTE_APROBACION).count()

        # Cálculo SLA Cumplido
        tickets_resueltos_objs = Ticket.objects.filter(estado=Ticket.Estado.RESUELTO, fecha_resolucion__isnull=False)
        sla_cumplidos = 0
        for t in tickets_resueltos_objs:
            if not t.sla_fecha_limite or t.fecha_resolucion <= t.sla_fecha_limite:
                sla_cumplidos += 1

        sla_pct = round((sla_cumplidos / len(tickets_resueltos_objs) * 100), 1) if tickets_resueltos_objs.exists() else 100.0

        # 1. Conteo de incidencias y solicitudes por módulo
        incidencias_qs = Ticket.objects.exclude(tipo=Ticket.Tipo.SOLICITUD_CAMBIO)
        modulo_counts = (
            incidencias_qs.values('modulo')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        total_incidencias = incidencias_qs.count() or 1
        incidencias_por_modulo = [
            {
                "modulo": row['modulo'],
                "count": row['count'],
                "percentage": round((row['count'] / total_incidencias) * 100, 1)
            }
            for row in modulo_counts
        ]

        # 2. Última incidencia o solicitud registrada
        last_inc = incidencias_qs.order_by('-created_at').first()
        ultima_incidencia = None
        if last_inc:
            ultima_incidencia = {
                "codigo": last_inc.codigo,
                "asunto": last_inc.asunto,
                "modulo": last_inc.modulo,
                "tipo": last_inc.tipo,
                "prioridad": last_inc.prioridad,
                "estado": last_inc.estado,
                "solicitante": last_inc.solicitante_nombre,
                "jira_key": last_inc.jira_key,
                "kdb_codigo": last_inc.kdb_codigo,
                "created_at": last_inc.created_at.strftime('%Y-%m-%d %H:%M') if last_inc.created_at else ''
            }

        # 3. Último cambio por cada una de las 4 áreas ITIL
        ultimo_cambio_por_area = {}
        for area_val in [Ticket.AreaCambio.INFRAESTRUCTURA, Ticket.AreaCambio.APLICACIONES, Ticket.AreaCambio.DOCUMENTACION, Ticket.AreaCambio.CALENDARIO]:
            c = Ticket.objects.filter(tipo=Ticket.Tipo.SOLICITUD_CAMBIO, area_cambio=area_val).order_by('-created_at').first()
            if c:
                ultimo_cambio_por_area[area_val] = {
                    "codigo": c.codigo,
                    "asunto": c.asunto,
                    "tipo_cambio": c.tipo_cambio,
                    "impacto_riesgo": c.impacto_riesgo,
                    "estado": c.estado,
                    "cab_acta_numero": c.cab_acta_numero or 'N/A',
                    "cab_aprobado_por": c.cab_aprobado_por or 'Comité CAB',
                    "fecha": c.created_at.strftime('%Y-%m-%d %H:%M') if c.created_at else ''
                }
            else:
                ultimo_cambio_por_area[area_val] = None

        # 4. Detección Proactiva de Problemas (RCA) vinculada con artículos reales de ti_kdb_articulos y RFCs
        sugerencias_causa_raiz = {
            "Punto de Venta / Caja": "Inestabilidad en motor de renderizado de boletas PDF o timeout en pasarela POS. Se recomienda limpieza de cola local y procesamiento asíncrono.",
            "Base de Datos MySQL": "Contención de bloqueos pesimistas en reservas concurrentes. Se recomienda aislamiento analítico en réplica Slave 3309.",
            "Infraestructura & BD": "Saturación de workers Gunicorn o acumulación de binlogs en contenedor. Se recomienda rotación y healthcheck automático.",
            "Frontend & APIs": "Normalización de endpoints REST y validación de traslape de horarios en motor de citas.",
            "Seguridad & Auth": "Ráfagas de intentos fallidos de inicio de sesión y expiración de tokens JWT. Se recomienda Rate Limiting y purga controlada en Redis.",
            "Usuarios & Roles": "Requerimientos recurrentes de provisión de cuentas y ajuste de privilegios RBAC por turno."
        }
        mapa_kdb_modulo = {
            "Punto de Venta / Caja": "KDB-2026-004",
            "Base de Datos MySQL": "KDB-2026-003",
            "Infraestructura & BD": "KDB-2026-001",
            "Seguridad & Auth": "KDB-2026-002",
            "Usuarios & Roles": "KDB-2026-002",
        }
        problemas_detectados = []
        for row in modulo_counts:
            if row['count'] >= 2:
                mod_name = row['modulo']
                tickets_mod = incidencias_qs.filter(modulo=mod_name)
                tickets_rel = list(tickets_mod.values_list('codigo', flat=True)[:6])
                kdb_code = (
                    tickets_mod.exclude(kdb_codigo='').values_list('kdb_codigo', flat=True).first()
                    or mapa_kdb_modulo.get(mod_name, 'KDB-2026-001')
                )
                kdb_obj = KdbArticle.objects.filter(codigo=kdb_code).first() or KdbArticle.objects.filter(modulo__icontains=mod_name).first()
                rfc_rel = Ticket.objects.filter(tipo=Ticket.Tipo.SOLICITUD_CAMBIO).order_by('-created_at').first()
                problemas_detectados.append({
                    "modulo": mod_name,
                    "incidencias_count": row['count'],
                    "sugerencia_itil": kdb_obj.causa_raiz if kdb_obj else sugerencias_causa_raiz.get(mod_name, f"Falla recurrente detectada en {mod_name}."),
                    "solucion_kedb": kdb_obj.solucion_workaround if kdb_obj else "Verificar procedimiento de contingencia en catálogo KDB.",
                    "kdb_codigo": kdb_obj.codigo if kdb_obj else kdb_code,
                    "kdb_titulo": kdb_obj.titulo if kdb_obj else "",
                    "rfc_codigo": rfc_rel.codigo if rfc_rel else "RFC-2026-0042",
                    "estado_problema": "ANALISIS_CAUSA_RAIZ",
                    "tickets_relacionados": tickets_rel
                })

        # 5. Incidencias y solicitudes pendientes prioritarias
        pendientes_qs = incidencias_qs.filter(
            estado__in=[Ticket.Estado.ABIERTO, Ticket.Estado.EN_PROCESO, Ticket.Estado.PENDIENTE_APROBACION]
        ).order_by('-prioridad', 'sla_fecha_limite')[:10]

        incidencias_pendientes = [
            {
                "codigo": p.codigo,
                "asunto": p.asunto,
                "modulo": p.modulo,
                "tipo": p.tipo,
                "prioridad": p.prioridad,
                "estado": p.estado,
                "solicitante": p.solicitante_nombre,
                "jira_key": p.jira_key,
                "kdb_codigo": p.kdb_codigo,
                "sla_fecha_limite": p.sla_fecha_limite.strftime('%Y-%m-%d %H:%M') if p.sla_fecha_limite else 'SLA 24h'
            }
            for p in pendientes_qs
        ]

        # 6. Evolución temporal real basada en fechas históricas de MySQL / Jira Cloud
        meses_es = {
            1: 'ene', 2: 'feb', 3: 'mar', 4: 'abr', 5: 'may', 6: 'jun',
            7: 'jul', 8: 'ago', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dic'
        }
        date_buckets = {}
        for t_obj in Ticket.objects.all().order_by('created_at'):
            dt = t_obj.created_at or timezone.now()
            day_key = dt.strftime('%Y-%m-%d')
            label = f"{dt.day:02d} {meses_es.get(dt.month, 'mes')} {dt.year}"
            if day_key not in date_buckets:
                date_buckets[day_key] = {"fecha": day_key, "label": label, "count": 0}
            date_buckets[day_key]["count"] += 1
        evolucion_temporal = list(date_buckets.values())

        # 7. Matriz de técnicos calculada en vivo desde los tickets asignados en MySQL
        perfiles_equipo = [
            {
                "match": ["bryan", "alexis"],
                "nombre": "Ing. Bryan Mango",
                "rol": "DBA / Especialista Infraestructura N3",
                "area": "Base de Datos MySQL & Redes"
            },
            {
                "match": ["anthony"],
                "nombre": "Ing. Anthony Luque",
                "rol": "Ingeniero DevOps / Soporte TI N2",
                "area": "Infraestructura, POS & Backend"
            },
            {
                "match": ["rafael"],
                "nombre": "Ing. Rafael Ramirez",
                "rol": "Arquitecto Cloud / SysAdmin N3",
                "area": "Frontend, APIs & Gobernanza"
            },
            {
                "match": ["rené", "rene", "nieto", "cab"],
                "nombre": "MBA Mg. Ing. René Nieto",
                "rol": "CAB Chair / Comité de Cambios",
                "area": "Control de Cambios (RFC / CAB)",
                "is_cab": True
            }
        ]
        matriz_tecnicos = []
        all_tickets_list = list(Ticket.objects.all())
        for perf in perfiles_equipo:
            if perf.get("is_cab"):
                t_assigned = [t for t in all_tickets_list if t.tipo == Ticket.Tipo.SOLICITUD_CAMBIO]
            else:
                t_assigned = [
                    t for t in all_tickets_list
                    if any(m in (t.asignado_a or '').lower() for m in perf["match"])
                ]
            t_total = len(t_assigned)
            t_res = sum(1 for t in t_assigned if t.estado in (Ticket.Estado.RESUELTO, Ticket.Estado.APROBADO))
            t_curso = t_total - t_res
            matriz_tecnicos.append({
                "nombre": perf["nombre"],
                "rol": perf["rol"],
                "area": perf["area"],
                "total": t_total,
                "resueltos": t_res,
                "en_curso": t_curso,
                "is_cab": bool(perf.get("is_cab")),
                "sla_pct": 100.0
            })

        return Response({
            "total": total,
            "abiertos": abiertos,
            "en_proceso": en_proceso,
            "pendientes_aprobacion": pendientes_aprobacion,
            "aprobados": aprobados,
            "resueltos": resueltos,
            "sla_cumplimiento_porcentaje": sla_pct,
            "total_rfcs": total_rfcs,
            "rfcs_aprobados": rfcs_aprobados,
            "rfcs_pendientes": rfcs_pendientes,
            "incidencias_por_modulo": incidencias_por_modulo,
            "ultima_incidencia": ultima_incidencia,
            "ultimo_cambio_por_area": ultimo_cambio_por_area,
            "problemas_detectados": problemas_detectados,
            "incidencias_pendientes": incidencias_pendientes,
            "evolucion_temporal": evolucion_temporal,
            "matriz_tecnicos": matriz_tecnicos
        })


class KdbArticleViewSet(viewsets.ModelViewSet):
    queryset = KdbArticle.objects.filter(activo=True).order_by('codigo')
    serializer_class = KdbArticleSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        val = self.kwargs[lookup_url_kwarg]
        if str(val).isdigit():
            obj = KdbArticle.objects.filter(pk=val).first()
        else:
            obj = KdbArticle.objects.filter(codigo__iexact=str(val)).first()
        if not obj:
            from django.http import Http404
            raise Http404(f'Artículo KDB no encontrado: {val}')
        return obj

    def get_queryset(self):
        qs = super().get_queryset()
        categoria = self.request.query_params.get('categoria')
        prioridad = self.request.query_params.get('prioridad')
        modulo = self.request.query_params.get('modulo')
        search = self.request.query_params.get('search')

        if categoria and categoria != 'TODOS':
            qs = qs.filter(categoria=categoria)
        if prioridad and prioridad != 'TODOS':
            qs = qs.filter(prioridad=prioridad)
        if modulo and modulo != 'TODOS':
            qs = qs.filter(modulo=modulo)
        if search:
            qs = qs.filter(
                models.Q(codigo__icontains=search) |
                models.Q(titulo__icontains=search) |
                models.Q(sintoma__icontains=search) |
                models.Q(causa_raiz__icontains=search) |
                models.Q(solucion_workaround__icontains=search) |
                models.Q(modulo__icontains=search) |
                models.Q(jira_ref__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        if not instance.jira_ref:
            jcfg = _get_jira_config()
            jira_payload = {
                "fields": {
                    "project": {"key": jcfg['project_key']},
                    "summary": f"[{instance.codigo}] KDB: {instance.titulo}",
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": f"Síntoma: {instance.sintoma}\nCausa Raíz: {instance.causa_raiz}\nWorkaround:\n{instance.solucion_workaround}"
                                    }
                                ]
                            }
                        ]
                    },
                    "issuetype": {"name": "Task"}
                }
            }
            jira_res = _call_jira_api('/rest/api/3/issue', method='POST', payload=jira_payload)
            if jira_res.get('success') and 'key' in jira_res.get('data', {}):
                instance.jira_ref = jira_res['data']['key']
                instance.save(update_fields=['jira_ref'])


class JiraTestConnectionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        custom_cfg = {
            "domain": request.data.get('domain', ''),
            "email": request.data.get('email', ''),
            "api_token": request.data.get('api_token', ''),
            "project_key": request.data.get('project_key', 'KAN')
        }
        jcfg = _get_jira_config(custom_cfg)
        cache.set('sumaq_jira_runtime_config', jcfg, timeout=86400)

        res = _call_jira_api(f"/rest/api/3/project/{jcfg['project_key']}", method='GET', custom_cfg=jcfg)
        if res.get('success'):
            proj_name = res.get('data', {}).get('name', jcfg['project_key'])
            sync_info = _auto_sync_from_jira(force=True)
            return Response({
                "success": True,
                "message": f"Conexión verificada con Atlassian Jira Cloud (Proyecto: {proj_name}). Sincronización activa.",
                "sync": sync_info
            }, status=status.HTTP_200_OK)
        return Response({
            "success": False,
            "message": f"No se pudo autenticar con Jira Cloud ({res.get('error') or res.get('status') or 'Verifique token'})."
        }, status=status.HTTP_400_BAD_REQUEST)


def _get_host_memory_telemetry():
    try:
        if os.name == 'nt':
            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong),
                    ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong),
                    ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong),
                    ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong),
                    ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
                ]
            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(stat)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
            total_gb = round(stat.ullTotalPhys / (1024 ** 3), 2)
            avail_gb = round(stat.ullAvailPhys / (1024 ** 3), 2)
            used_gb = round(total_gb - avail_gb, 2)
            used_pct = round(float(stat.dwMemoryLoad), 1)
            return {"used_pct": used_pct, "total_gb": total_gb, "used_gb": used_gb, "free_gb": avail_gb}
        elif os.path.exists('/proc/meminfo'):
            mem_info = {}
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    parts = line.split(':')
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val_kb = int(parts[1].strip().split()[0])
                        mem_info[key] = val_kb
            total_kb = mem_info.get('MemTotal', 1)
            avail_kb = mem_info.get('MemAvailable', mem_info.get('MemFree', 0))
            used_kb = total_kb - avail_kb
            total_gb = round(total_kb / (1024 ** 2), 2)
            used_gb = round(used_kb / (1024 ** 2), 2)
            free_gb = round(avail_kb / (1024 ** 2), 2)
            used_pct = round((used_kb / total_kb) * 100, 1)
            return {"used_pct": used_pct, "total_gb": total_gb, "used_gb": used_gb, "free_gb": free_gb}
    except Exception:
        pass
    return {"used_pct": 64.0, "total_gb": 16.0, "used_gb": 10.24, "free_gb": 5.76}


def _classify_percentage_threshold(pct: float) -> str:
    if pct > 95.0:
        return MonitoringEvent.Nivel.CRITICAL
    if pct >= 85.0:
        return MonitoringEvent.Nivel.ERROR
    if pct >= 75.0:
        return MonitoringEvent.Nivel.WARNING
    return MonitoringEvent.Nivel.INFO


class MonitoringEventViewSet(viewsets.ModelViewSet):
    queryset = MonitoringEvent.objects.all().order_by('-created_at', '-id')
    serializer_class = MonitoringEventSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        nivel = self.request.query_params.get('nivel')
        componente = self.request.query_params.get('componente')
        estado = self.request.query_params.get('estado')
        genera_incidente = self.request.query_params.get('genera_incidente')
        search = self.request.query_params.get('search')

        if nivel and nivel != 'TODOS':
            qs = qs.filter(nivel=nivel)
        if componente and componente != 'TODOS':
            qs = qs.filter(componente=componente)
        if estado and estado != 'TODOS':
            qs = qs.filter(estado=estado)
        if genera_incidente in ('true', 'True', '1', 'SI'):
            qs = qs.filter(genera_incidente=True)
        elif genera_incidente in ('false', 'False', '0', 'NO'):
            qs = qs.filter(genera_incidente=False)
        if search:
            qs = qs.filter(
                models.Q(codigo__icontains=search) |
                models.Q(metrica__icontains=search) |
                models.Q(descripcion__icontains=search) |
                models.Q(proceso_negocio__icontains=search) |
                models.Q(responsable__icontains=search) |
                models.Q(ticket_codigo__icontains=search)
            )
        return qs

    @action(detail=False, methods=['get'], url_path='health')
    def health(self, request):
        # 1. Telemetría en vivo de Base de Datos
        db_start = time.perf_counter()
        db_ok = True
        db_engine = connection.vendor
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            db_latency_ms = round((time.perf_counter() - db_start) * 1000, 2)
        except Exception:
            db_ok = False
            db_latency_ms = 9999.0

        if not db_ok or db_latency_ms > 2500:
            db_nivel = MonitoringEvent.Nivel.CRITICAL
        elif db_latency_ms >= 1000:
            db_nivel = MonitoringEvent.Nivel.ERROR
        elif db_latency_ms >= 400:
            db_nivel = MonitoringEvent.Nivel.WARNING
        else:
            db_nivel = MonitoringEvent.Nivel.INFO

        # 2. Telemetría en vivo de Caché / Redis
        cache_start = time.perf_counter()
        cache_ok = True
        try:
            cache.set('sumaq_monitoring_heartbeat', timezone.now().isoformat(), timeout=15)
            val = cache.get('sumaq_monitoring_heartbeat')
            cache_ok = bool(val)
            cache_latency_ms = round((time.perf_counter() - cache_start) * 1000, 2)
        except Exception:
            cache_ok = False
            cache_latency_ms = 999.0

        redis_host = os.environ.get('REDIS_HOST', '127.0.0.1')
        redis_port = int(os.environ.get('REDIS_PORT', '6379'))
        redis_socket_active = False
        try:
            with socket.create_connection((redis_host, redis_port), timeout=0.15):
                redis_socket_active = True
        except Exception:
            redis_socket_active = False

        cache_nivel = MonitoringEvent.Nivel.INFO if cache_ok else MonitoringEvent.Nivel.ERROR

        # 3. Telemetría en vivo de Memoria Física del Servidor (RAM)
        mem = _get_host_memory_telemetry()
        mem_nivel = _classify_percentage_threshold(mem['used_pct'])

        # 4. Telemetría en vivo de Almacenamiento en Disco
        try:
            disk = shutil.disk_usage(os.getcwd())
            disk_total_gb = round(disk.total / (1024 ** 3), 2)
            disk_used_gb = round(disk.used / (1024 ** 3), 2)
            disk_free_gb = round(disk.free / (1024 ** 3), 2)
            disk_used_pct = round((disk.used / disk.total) * 100, 1)
        except Exception:
            disk_total_gb = 100.0
            disk_used_gb = 58.0
            disk_free_gb = 42.0
            disk_used_pct = 58.0
        disk_nivel = _classify_percentage_threshold(disk_used_pct)

        # 5. Estadísticas consolidadas de Eventos en Base de Datos
        all_events = MonitoringEvent.objects.all()
        total_eventos = all_events.count()
        info_count = all_events.filter(nivel=MonitoringEvent.Nivel.INFO).count()
        warning_count = all_events.filter(nivel=MonitoringEvent.Nivel.WARNING).count()
        error_count = all_events.filter(nivel=MonitoringEvent.Nivel.ERROR).count()
        critical_count = all_events.filter(nivel=MonitoringEvent.Nivel.CRITICAL).count()
        incidentes_generados = all_events.filter(genera_incidente=True).count()
        activos_count = all_events.filter(estado__in=[MonitoringEvent.Estado.ACTIVO, MonitoringEvent.Estado.ESCALADO]).count()
        mitigados_count = all_events.filter(estado__in=[MonitoringEvent.Estado.MITIGADO, MonitoringEvent.Estado.CERRADO]).count()

        # 6. Políticas formales de monitoreo de eventos
        politicas_monitoreo = [
            {
                "metrica": "Uso de CPU del Servidor / Contenedor",
                "componente": "Django REST API / Host",
                "umbral_info": "60% – 75%",
                "umbral_warning": "75% – 85%",
                "umbral_error": "85% – 95%",
                "umbral_critical": "> 95%",
                "intervalo": "30 seg"
            },
            {
                "metrica": "Consumo de Memoria RAM",
                "componente": "Contenedores Docker / Host",
                "umbral_info": "60% – 75%",
                "umbral_warning": "75% – 85%",
                "umbral_error": "85% – 95%",
                "umbral_critical": "> 95% (Riesgo OOM)",
                "intervalo": "30 seg"
            },
            {
                "metrica": "Ocupación de Almacenamiento en Disco",
                "componente": "Partición Base de Datos / Logs",
                "umbral_info": "60% – 75%",
                "umbral_warning": "75% – 85%",
                "umbral_error": "85% – 95%",
                "umbral_critical": "> 95%",
                "intervalo": "5 min"
            },
            {
                "metrica": "Tiempo de Respuesta / Latencia DB",
                "componente": "MySQL Master (3308) / Slave (3309)",
                "umbral_info": "< 400 ms",
                "umbral_warning": "400 – 1000 ms",
                "umbral_error": "1000 – 2500 ms",
                "umbral_critical": "> 2500 ms / Timeout",
                "intervalo": "15 seg"
            },
            {
                "metrica": "Intentos Fallidos de Inicio de Sesión",
                "componente": "Seguridad & Autenticación JWT",
                "umbral_info": "< 10 / min",
                "umbral_warning": "10 – 30 / min",
                "umbral_error": "30 – 60 / min",
                "umbral_critical": "> 60 / min (Bloqueo IP)",
                "intervalo": "60 seg"
            }
        ]

        return Response({
            "timestamp": timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            "servicios": {
                "database": {
                    "nombre": "MySQL Master (3308) / Motor Activo",
                    "engine": db_engine.upper(),
                    "online": db_ok,
                    "latencia_ms": db_latency_ms,
                    "nivel": db_nivel,
                    "umbral": "Normal < 400 ms | Warning 400-1000 ms | Crítico > 2500 ms",
                    "registros_ti": Ticket.objects.count() + KdbArticle.objects.count() + total_eventos
                },
                "memory": {
                    "nombre": "Memoria RAM del Servidor",
                    "used_pct": mem['used_pct'],
                    "used_gb": mem['used_gb'],
                    "total_gb": mem['total_gb'],
                    "free_gb": mem['free_gb'],
                    "nivel": mem_nivel,
                    "umbral": "Info 60-75% | Warning 75-85% | Error 85-95% | Crítico > 95%"
                },
                "disk": {
                    "nombre": "Almacenamiento en Disco",
                    "used_pct": disk_used_pct,
                    "used_gb": disk_used_gb,
                    "total_gb": disk_total_gb,
                    "free_gb": disk_free_gb,
                    "nivel": disk_nivel,
                    "umbral": "Info 60-75% | Warning 75-85% | Error 85-95% | Crítico > 95%"
                },
                "cache_api": {
                    "nombre": "Motor de Caché Redis & API REST",
                    "online": cache_ok,
                    "redis_socket": redis_socket_active,
                    "latencia_ms": cache_latency_ms,
                    "nivel": cache_nivel,
                    "umbral": "Heartbeat cada 15s | Respuesta HTTP 200 OK"
                }
            },
            "resumen_eventos": {
                "total": total_eventos,
                "info": info_count,
                "warning": warning_count,
                "error": error_count,
                "critical": critical_count,
                "incidentes_generados": incidentes_generados,
                "activos": activos_count,
                "mitigados": mitigados_count
            },
            "politicas_monitoreo": politicas_monitoreo
        })

    @action(detail=False, methods=['post'], url_path='evaluar')
    def evaluar(self, request):
        serializer = MonitoringEvaluateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        componente = data['componente']
        metrica = data['metrica'].strip()
        val = float(data['valor_numerico'])
        unidad = data.get('unidad', '%').strip()
        proceso_negocio = data.get('proceso_negocio', 'Operación General Spa').strip()
        descripcion_custom = data.get('descripcion', '').strip()

        # Evaluación cuantitativa contra políticas de umbrales
        if unidad == 'ms':
            umbral_ref = 'Normal: <400ms | Warning: 400-1000ms | Error: 1000-2500ms | Crítico: >2500ms'
            if val > 2500:
                nivel = MonitoringEvent.Nivel.CRITICAL
                genera_incidente = True
                impacto = MonitoringEvent.NivelImpacto.ALTO
                urgencia = MonitoringEvent.NivelUrgencia.ALTA
            elif val >= 1000:
                nivel = MonitoringEvent.Nivel.ERROR
                genera_incidente = True
                impacto = MonitoringEvent.NivelImpacto.MEDIO
                urgencia = MonitoringEvent.NivelUrgencia.ALTA
            elif val >= 400:
                nivel = MonitoringEvent.Nivel.WARNING
                genera_incidente = False
                impacto = MonitoringEvent.NivelImpacto.BAJO
                urgencia = MonitoringEvent.NivelUrgencia.MEDIA
            else:
                nivel = MonitoringEvent.Nivel.INFO
                genera_incidente = False
                impacto = MonitoringEvent.NivelImpacto.BAJO
                urgencia = MonitoringEvent.NivelUrgencia.BAJA
        elif unidad == 'intentos':
            umbral_ref = 'Normal: <10/min | Warning: 10-30/min | Error: 30-60/min | Crítico: >60/min'
            if val > 60:
                nivel = MonitoringEvent.Nivel.CRITICAL
                genera_incidente = True
                impacto = MonitoringEvent.NivelImpacto.ALTO
                urgencia = MonitoringEvent.NivelUrgencia.ALTA
            elif val >= 30:
                nivel = MonitoringEvent.Nivel.ERROR
                genera_incidente = True
                impacto = MonitoringEvent.NivelImpacto.MEDIO
                urgencia = MonitoringEvent.NivelUrgencia.ALTA
            elif val >= 10:
                nivel = MonitoringEvent.Nivel.WARNING
                genera_incidente = False
                impacto = MonitoringEvent.NivelImpacto.BAJO
                urgencia = MonitoringEvent.NivelUrgencia.MEDIA
            else:
                nivel = MonitoringEvent.Nivel.INFO
                genera_incidente = False
                impacto = MonitoringEvent.NivelImpacto.BAJO
                urgencia = MonitoringEvent.NivelUrgencia.BAJA
        else:
            umbral_ref = 'Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%'
            if val > 95.0:
                nivel = MonitoringEvent.Nivel.CRITICAL
                genera_incidente = True
                impacto = MonitoringEvent.NivelImpacto.ALTO
                urgencia = MonitoringEvent.NivelUrgencia.ALTA
            elif val >= 85.0:
                nivel = MonitoringEvent.Nivel.ERROR
                genera_incidente = True
                impacto = MonitoringEvent.NivelImpacto.MEDIO
                urgencia = MonitoringEvent.NivelUrgencia.ALTA
            elif val >= 75.0:
                nivel = MonitoringEvent.Nivel.WARNING
                genera_incidente = False
                impacto = MonitoringEvent.NivelImpacto.BAJO
                urgencia = MonitoringEvent.NivelUrgencia.MEDIA
            else:
                nivel = MonitoringEvent.Nivel.INFO
                genera_incidente = False
                impacto = MonitoringEvent.NivelImpacto.BAJO
                urgencia = MonitoringEvent.NivelUrgencia.BAJA

        valor_registrado = f"{round(val, 1)} {unidad}".strip() if unidad != '%' else f"{round(val, 1)}%"
        prioridad = MonitoringEvent.calcular_prioridad_matriz(impacto, urgencia) if genera_incidente else 'N/A'

        # Mapeo de componente a módulo, responsable, KDB y plan de respuesta
        mapa_componentes = {
            MonitoringEvent.Componente.MYSQL_MASTER: {
                "modulo": "Base de Datos MySQL",
                "responsable": "Bryan Mango (DBA / Infraestructura L2)",
                "kdb": "KDB-2026-005",
                "accion_critica": "Terminar consultas bloqueadas (KILL query), liberar conexiones inactivas y conmutar lecturas a réplica 3309.",
                "accion_preventiva": "Monitorear pool de conexiones activas y revisar consultas lentas en slow_query_log."
            },
            MonitoringEvent.Componente.MYSQL_SLAVE: {
                "modulo": "Base de Datos MySQL",
                "responsable": "Bryan Mango (DBA / Infraestructura L2)",
                "kdb": "KDB-2026-003",
                "accion_critica": "Reiniciar hilos de replicación (STOP REPLICA; START REPLICA) y redirigir reportes temporalmente.",
                "accion_preventiva": "Verificar Seconds_Behind_Master en nodo 3309."
            },
            MonitoringEvent.Componente.REDIS_CACHE: {
                "modulo": "Seguridad & Auth",
                "responsable": "Anthony Luque (DevOps / L2)",
                "kdb": "KDB-2026-002",
                "accion_critica": "Reiniciar servicio sumaq-redis y purgar claves expiradas con FLUSHDB controlado.",
                "accion_preventiva": "Verificar política maxmemory-policy allkeys-lru."
            },
            MonitoringEvent.Componente.BACKEND_API: {
                "modulo": "Infraestructura & BD",
                "responsable": "Anthony Luque (DevOps / Backend L2)",
                "kdb": "KDB-2026-001",
                "accion_critica": "Reciclar workers de Gunicorn / reiniciar contenedor sumaq-backend y escalar instancia.",
                "accion_preventiva": "Inspeccionar consumo de workers y liberar memoria en caché."
            },
            MonitoringEvent.Componente.NGINX_GATEWAY: {
                "modulo": "Infraestructura & BD",
                "responsable": "Rafael Ramirez (Especialista Infraestructura L3)",
                "kdb": "KDB-2026-001",
                "accion_critica": "Restablecer proxy reverso Nginx, verificar upstream backend:8000 y aplicar healthcheck.",
                "accion_preventiva": "Revisar logs de acceso y latencia de upstream."
            },
            MonitoringEvent.Componente.PASARELA_NIUBIZ: {
                "modulo": "Punto de Venta / Caja",
                "responsable": "Anthony Luque (Integraciones L2)",
                "kdb": "KDB-2026-004",
                "accion_critica": "Activar cola asíncrona de reintentos de webhook y habilitar registro de pago POS alterno.",
                "accion_preventiva": "Validar latencia TLS hacia endpoint de pasarela."
            },
            MonitoringEvent.Componente.SEGURIDAD_AUTH: {
                "modulo": "Seguridad & Auth",
                "responsable": "Bryan Mango (Seguridad TI L2)",
                "kdb": "KDB-2026-002",
                "accion_critica": "Bloquear dirección IP origen en firewall / Nginx y revocar tokens comprometidos.",
                "accion_preventiva": "Aplicar Rate Limiting automático por dirección IP."
            },
            MonitoringEvent.Componente.HOST_SISTEMA: {
                "modulo": "Infraestructura & BD",
                "responsable": "Rafael Ramirez (SysAdmin / Cloud L3)",
                "kdb": "KDB-2026-001",
                "accion_critica": "Purgar binlogs y logs rotados antiguos, liberar espacio en disco y redimensionar volumen.",
                "accion_preventiva": "Ejecutar rotación preventiva de archivos temporales."
            }
        }

        cfg = mapa_componentes.get(componente, mapa_componentes[MonitoringEvent.Componente.BACKEND_API])
        comp_label = dict(MonitoringEvent.Componente.choices).get(componente, componente)

        if not descripcion_custom:
            descripcion_custom = f"Lectura de {metrica} en {comp_label} registró un valor de {valor_registrado}."

        if genera_incidente:
            justificacion = (
                f"El valor registrado ({valor_registrado}) supera el umbral de tolerancia operativa, "
                f"afectando el proceso '{proceso_negocio}'. Se requiere contención técnica inmediata."
            )
            accion_respuesta = cfg['accion_critica']
            tiempo_max = "5 min" if nivel == MonitoringEvent.Nivel.CRITICAL else "15 min"
            estado_evento = MonitoringEvent.Estado.ESCALADO
        elif nivel == MonitoringEvent.Nivel.WARNING:
            justificacion = (
                f"Comportamiento en rango de advertencia ({valor_registrado}). No interrumpe la continuidad "
                f"del servicio de citas ni cobros; se gestiona mediante acción preventiva."
            )
            accion_respuesta = cfg['accion_preventiva']
            tiempo_max = "30 min"
            estado_evento = MonitoringEvent.Estado.ACTIVO
        else:
            justificacion = (
                f"Parámetro operativo dentro del rango normal ({valor_registrado}). "
                f"Se registra en bitácora sin generar ticket de incidente."
            )
            accion_respuesta = "Registro automático en bitácora de auditoría. Sin intervención manual."
            tiempo_max = "N/A"
            estado_evento = MonitoringEvent.Estado.CERRADO

        evt_codigo = MonitoringEvent.generar_siguiente_codigo()

        created_ticket = None
        if genera_incidente:
            t_codigo = Ticket.generar_siguiente_codigo('INC')
            sla_horas = 2 if prioridad == Ticket.Prioridad.P1_CRITICA else 8
            created_ticket = Ticket.objects.create(
                codigo=t_codigo,
                tipo=Ticket.Tipo.INCIDENCIA,
                prioridad=prioridad,
                modulo=cfg['modulo'],
                asunto=f"[Alerta {nivel}] {metrica} en {comp_label} ({valor_registrado})",
                descripcion=(
                    f"Incidente generado automáticamente por el motor de monitoreo de eventos ({evt_codigo}).\n"
                    f"Componente: {comp_label}\n"
                    f"Métrica: {metrica} = {valor_registrado} (Umbral: {umbral_ref})\n"
                    f"Proceso de Negocio: {proceso_negocio}\n"
                    f"Plan de Respuesta Inmediata: {accion_respuesta}"
                ),
                solicitante_nombre="Motor de Monitoreo SUMAQ",
                solicitante_email="monitoreo.ti@sumaqspa.pe",
                solicitante_rol="ADMIN",
                sla_horas=sla_horas,
                sla_fecha_limite=timezone.now() + timedelta(hours=sla_horas),
                estado=Ticket.Estado.ABIERTO,
                asignado_a=cfg['responsable'],
                kdb_codigo=cfg['kdb']
            )
            _create_jira_issue_for_ticket(created_ticket)

        evento = MonitoringEvent.objects.create(
            codigo=evt_codigo,
            nivel=nivel,
            componente=componente,
            metrica=metrica,
            valor_registrado=valor_registrado,
            valor_numerico=val,
            umbral_referencia=umbral_ref,
            descripcion=descripcion_custom,
            proceso_negocio=proceso_negocio,
            genera_incidente=genera_incidente,
            justificacion_incidente=justificacion,
            impacto=impacto,
            urgencia=urgencia,
            prioridad_asignada=prioridad,
            responsable=cfg['responsable'],
            accion_respuesta=accion_respuesta,
            tiempo_respuesta_max=tiempo_max,
            estado=estado_evento,
            ticket_vinculado=created_ticket,
            ticket_codigo=created_ticket.codigo if created_ticket else ''
        )

        return Response({
            "success": True,
            "evento": MonitoringEventSerializer(evento).data,
            "ticket_generado": TicketSerializer(created_ticket).data if created_ticket else None
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post', 'patch'], url_path='mitigar')
    def mitigar(self, request, pk=None):
        evento = self.get_object()
        accion = request.data.get('accion_respuesta', '').strip()
        nuevo_estado = request.data.get('estado', MonitoringEvent.Estado.MITIGADO)
        if nuevo_estado not in dict(MonitoringEvent.Estado.choices):
            nuevo_estado = MonitoringEvent.Estado.MITIGADO

        if accion:
            evento.accion_respuesta = accion
        evento.estado = nuevo_estado
        evento.save()

        return Response({
            "success": True,
            "evento": MonitoringEventSerializer(evento).data
        }, status=status.HTTP_200_OK)


