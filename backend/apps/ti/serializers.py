from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    # Aliases camelCase para compatibilidad transparente con TypeScript
    id = serializers.CharField(source='codigo')
    solicitanteNombre = serializers.CharField(source='solicitante_nombre')
    solicitanteEmail = serializers.EmailField(source='solicitante_email')
    solicitanteRol = serializers.CharField(source='solicitante_rol')
    slaHoras = serializers.IntegerField(source='sla_horas')
    slaFechaLimite = serializers.SerializerMethodField()
    fechaCreacion = serializers.SerializerMethodField()
    asignadoA = serializers.CharField(source='asignado_a', allow_blank=True)
    aprobadoPorGerencia = serializers.BooleanField(source='aprobado_por_gerencia')
    aprobadorNombre = serializers.CharField(source='aprobador_nombre', allow_blank=True)
    fechaAprobacion = serializers.SerializerMethodField()
    resolucionTecnica = serializers.CharField(source='resolucion_tecnica', allow_blank=True)
    fechaResolucion = serializers.SerializerMethodField()
    jiraKey = serializers.CharField(source='jira_key', allow_blank=True)
    jiraUrl = serializers.CharField(source='jira_url', allow_blank=True)
    githubUrl = serializers.CharField(source='github_url', allow_blank=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'codigo', 'tipo', 'prioridad', 'modulo', 'asunto', 'descripcion',
            'solicitanteNombre', 'solicitanteEmail', 'solicitanteRol',
            'solicitante_nombre', 'solicitante_email', 'solicitante_rol',
            'slaHoras', 'slaFechaLimite', 'fechaCreacion',
            'sla_horas', 'sla_fecha_limite', 'created_at',
            'estado', 'asignadoA', 'asignado_a',
            'aprobadoPorGerencia', 'aprobado_por_gerencia',
            'aprobadorNombre', 'aprobador_nombre',
            'fechaAprobacion', 'fecha_aprobacion',
            'resolucionTecnica', 'resolucion_tecnica',
            'fechaResolucion', 'fecha_resolucion',
            'jiraKey', 'jira_key', 'jiraUrl', 'jira_url',
            'githubUrl', 'github_url'
        ]

    def get_slaFechaLimite(self, obj):
        if obj.sla_fecha_limite:
            return obj.sla_fecha_limite.strftime('%Y-%m-%d %H:%M:%S')
        return ""

    def get_fechaCreacion(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%Y-%m-%d %H:%M:%S')
        return ""

    def get_fechaResolucion(self, obj):
        if obj.fecha_resolucion:
            return obj.fecha_resolucion.strftime('%Y-%m-%d %H:%M:%S')
        return ""

    def get_fechaAprobacion(self, obj):
        if obj.fecha_aprobacion:
            return obj.fecha_aprobacion.strftime('%Y-%m-%d %H:%M:%S')
        return ""


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'tipo', 'prioridad', 'modulo', 'asunto', 'descripcion',
            'solicitante_nombre', 'solicitante_email', 'solicitante_rol',
            'asignado_a'
        ]


class TicketAprobarSerializer(serializers.Serializer):
    aprobador_nombre = serializers.CharField(max_length=150, required=False, allow_blank=True)


class TicketResolverSerializer(serializers.Serializer):
    resolucion_tecnica = serializers.CharField(required=True)
    asignado_a = serializers.CharField(max_length=150, required=False, allow_blank=True)
    github_url = serializers.URLField(required=False, allow_blank=True)
    jira_key = serializers.CharField(max_length=50, required=False, allow_blank=True)
