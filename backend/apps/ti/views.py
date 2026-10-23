import os
import json
import base64
import urllib.request
import urllib.error
from datetime import timedelta
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Ticket
from .serializers import (
    TicketSerializer,
    TicketCreateSerializer,
    TicketAprobarSerializer,
    TicketResolverSerializer
)


def _call_jira_api(endpoint, method='POST', payload=None):
    """
    Helper utilitario para interactuar con Jira Cloud API v3 de forma segura y tolerante a fallos.
    """
    domain = os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net').strip().rstrip('/')
    email = os.environ.get('JIRA_USER_EMAIL', 'rafaelramirez.utp@gmail.com').strip()
    api_token = os.environ.get('JIRA_API_TOKEN', '').strip()

    if not domain.startswith('http://') and not domain.startswith('https://'):
        domain = f"https://{domain}"

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
            if resp.status in (200, 201):
                raw = resp.read().decode('utf-8')
                return {"success": True, "data": json.loads(raw) if raw else {}}
            return {"success": False, "status": resp.status}
    except Exception as e:
        return {"success": False, "error": str(e)}


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión integral de Tickets de la Mesa de Ayuda (ITIL v4).
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
        qs = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        estado = self.request.query_params.get('estado')
        prioridad = self.request.query_params.get('prioridad')
        search = self.request.query_params.get('search')

        if tipo and tipo != 'TODOS':
            qs = qs.filter(tipo=tipo)
        if estado and estado != 'TODOS':
            qs = qs.filter(estado=estado)
        if prioridad and prioridad != 'TODOS':
            qs = qs.filter(prioridad=prioridad)
        if search:
            qs = qs.filter(
                models.Q(asunto__icontains=search) |
                models.Q(descripcion__icontains=search) |
                models.Q(codigo__icontains=search) |
                models.Q(solicitante_nombre__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        is_incident = data['tipo'] == Ticket.Tipo.INCIDENCIA
        prefix = 'INC' if is_incident else 'REQ'
        year = timezone.now().year
        count = Ticket.objects.count() + 10
        codigo = f"{prefix}-{year}-00{count}"

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
        if data['tipo'] == Ticket.Tipo.SOLICITUD_ACCESO:
            initial_state = Ticket.Estado.PENDIENTE_APROBACION

        ticket = Ticket.objects.create(
            codigo=codigo,
            tipo=data['tipo'],
            prioridad=prioridad,
            modulo=data.get('modulo', 'General'),
            asunto=data['asunto'].strip(),
            descripcion=data['descripcion'].strip(),
            solicitante_nombre=data.get('solicitante_nombre', 'Usuario Sumaq'),
            solicitante_email=data.get('solicitante_email', 'usuario@sumaqspa.pe'),
            solicitante_rol=data.get('solicitante_rol', 'TERAPEUTA'),
            sla_horas=sla_horas,
            sla_fecha_limite=sla_fecha_limite,
            estado=initial_state,
            asignado_a=data.get('asignado_a', 'Rafael Ramirez Quiroz (RQ)')
        )

        # Sincronización automática con Jira Cloud
        jira_project = os.environ.get('JIRA_PROJECT_KEY', 'KAN').strip().upper()
        jira_payload = {
            "fields": {
                "project": {"key": jira_project},
                "summary": f"[{codigo}] {ticket.asunto}",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": ticket.descripcion}]
                        }
                    ]
                },
                "issuetype": {"name": "Task" if not is_incident else "Bug"}
            }
        }

        jira_res = _call_jira_api('/rest/api/3/issue', method='POST', payload=jira_payload)
        if jira_res.get('success') and 'key' in jira_res.get('data', {}):
            j_key = jira_res['data']['key']
            domain = os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net').strip().rstrip('/')
            ticket.jira_key = j_key
            ticket.jira_url = f"{domain}/browse/{j_key}"
            ticket.save(update_fields=['jira_key', 'jira_url'])

        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """
        Aprobación formal de Solicitud de Acceso por Gerencia General (Dueño - Rol ADMIN).
        """
        ticket = self.get_object()

        # Determinar nombre del aprobador (usuario autenticado o payload)
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

    @action(detail=True, methods=['patch', 'post'], url_path='resolver')
    def resolver(self, request, pk=None):
        """
        Dictamen y resolución técnica por parte del especialista de TI (Soporte N2).
        """
        ticket = self.get_object()
        serializer = TicketResolverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ticket.estado = Ticket.Estado.RESUELTO
        ticket.resolucion_tecnica = data['resolucion_tecnica'].strip()
        ticket.fecha_resolucion = timezone.now()

        if data.get('asignado_a'):
            ticket.asignado_a = data['asignado_a']
        if data.get('github_url'):
            ticket.github_url = data['github_url']
        if data.get('jira_key'):
            ticket.jira_key = data['jira_key']
            domain = os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net').strip().rstrip('/')
            ticket.jira_url = f"{domain}/browse/{data['jira_key']}"

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
                                    "text": f"🎉 [RESOLUCIÓN TÉCNICA - SERVICE DESK]: {ticket.resolucion_tecnica}. Especialista: {ticket.asignado_a or 'TI N2'}."
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
        Dashboard de Métricas ITIL v4 en tiempo real para el Administrador.
        """
        total = Ticket.objects.count()
        abiertos = Ticket.objects.filter(estado=Ticket.Estado.ABIERTO).count()
        en_proceso = Ticket.objects.filter(estado=Ticket.Estado.EN_PROCESO).count()
        pendientes_aprobacion = Ticket.objects.filter(estado=Ticket.Estado.PENDIENTE_APROBACION).count()
        aprobados = Ticket.objects.filter(estado=Ticket.Estado.APROBADO).count()
        resueltos = Ticket.objects.filter(estado=Ticket.Estado.RESUELTO).count()

        # Cálculo SLA Cumplido
        tickets_resueltos_objs = Ticket.objects.filter(estado=Ticket.Estado.RESUELTO, fecha_resolucion__isnull=False)
        sla_cumplidos = 0
        for t in tickets_resueltos_objs:
            if t.sla_fecha_limite and t.fecha_resolucion <= t.sla_fecha_limite:
                sla_cumplidos += 1
        
        sla_pct = round((sla_cumplidos / len(tickets_resueltos_objs) * 100), 1) if tickets_resueltos_objs.exists() else 100.0

        return Response({
            "total": total,
            "abiertos": abiertos,
            "en_proceso": en_proceso,
            "pendientes_aprobacion": pendientes_aprobacion,
            "aprobados": aprobados,
            "resueltos": resueltos,
            "sla_cumplimiento_porcentaje": sla_pct
        })
