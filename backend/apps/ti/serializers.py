from rest_framework import serializers
from .models import Ticket, KdbArticle, MonitoringEvent


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

    # Campos Control de Cambios (Semana 11 - ITIL v4)
    areaCambio = serializers.CharField(source='area_cambio', allow_null=True, required=False)
    tipoCambio = serializers.CharField(source='tipo_cambio', allow_null=True, required=False)
    impactoRiesgo = serializers.CharField(source='impacto_riesgo', allow_null=True, required=False)
    ventanaMantenimiento = serializers.CharField(source='ventana_mantenimiento', allow_blank=True, required=False)
    planRollback = serializers.CharField(source='plan_rollback', allow_blank=True, required=False)
    cabAprobador = serializers.CharField(source='cab_aprobado_por', allow_blank=True, required=False)
    cabActa = serializers.CharField(source='cab_acta_numero', allow_blank=True, required=False)
    cabFechaAprobacion = serializers.SerializerMethodField()

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
            'githubUrl', 'github_url',
            # Semana 11
            'areaCambio', 'area_cambio',
            'tipoCambio', 'tipo_cambio',
            'impactoRiesgo', 'impacto_riesgo',
            'ventanaMantenimiento', 'ventana_mantenimiento',
            'planRollback', 'plan_rollback',
            'cabAprobador', 'cab_aprobado_por',
            'cabActa', 'cab_acta_numero',
            'cabFechaAprobacion', 'cab_fecha_aprobacion'
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

    def get_cabFechaAprobacion(self, obj):
        if obj.cab_fecha_aprobacion:
            return obj.cab_fecha_aprobacion.strftime('%Y-%m-%d %H:%M:%S')
        return ""


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'tipo', 'prioridad', 'modulo', 'asunto', 'descripcion',
            'solicitante_nombre', 'solicitante_email', 'solicitante_rol',
            'asignado_a',
            'area_cambio', 'tipo_cambio', 'impacto_riesgo',
            'ventana_mantenimiento', 'plan_rollback'
        ]


class TicketAprobarSerializer(serializers.Serializer):
    aprobador_nombre = serializers.CharField(max_length=150, required=False, allow_blank=True)


class TicketCabAprobarSerializer(serializers.Serializer):
    cab_aprobador = serializers.CharField(max_length=150, required=False, allow_blank=True)
    cab_acta = serializers.CharField(max_length=60, required=False, allow_blank=True)


class TicketResolverSerializer(serializers.Serializer):
    resolucion_tecnica = serializers.CharField(required=True)
    asignado_a = serializers.CharField(max_length=150, required=False, allow_blank=True)
    github_url = serializers.URLField(required=False, allow_blank=True)
    jira_key = serializers.CharField(max_length=50, required=False, allow_blank=True)


class KdbArticleSerializer(serializers.ModelSerializer):
    vecesUtilizado = serializers.IntegerField(source='veces_utilizado', read_only=True)
    solucionWorkaround = serializers.CharField(source='solucion_workaround')
    causaRaiz = serializers.CharField(source='causa_raiz')
    tiempoEstimado = serializers.CharField(source='tiempo_estimado')
    jiraRef = serializers.CharField(source='jira_ref', allow_blank=True)

    class Meta:
        model = KdbArticle
        fields = [
            'id', 'codigo', 'titulo', 'categoria', 'modulo', 'prioridad',
            'sintoma', 'causa_raiz', 'causaRaiz',
            'solucion_workaround', 'solucionWorkaround',
            'tiempo_estimado', 'tiempoEstimado',
            'jira_ref', 'jiraRef', 'activo',
            'veces_utilizado', 'vecesUtilizado',
            'created_at', 'updated_at'
        ]


class MonitoringEventSerializer(serializers.ModelSerializer):
    valorRegistrado = serializers.CharField(source='valor_registrado')
    valorNumerico = serializers.FloatField(source='valor_numerico')
    umbralReferencia = serializers.CharField(source='umbral_referencia')
    procesoNegocio = serializers.CharField(source='proceso_negocio')
    generaIncidente = serializers.BooleanField(source='genera_incidente')
    justificacionIncidente = serializers.CharField(source='justificacion_incidente', allow_blank=True)
    prioridadAsignada = serializers.CharField(source='prioridad_asignada', allow_blank=True)
    accionRespuesta = serializers.CharField(source='accion_respuesta', allow_blank=True)
    tiempoRespuestaMax = serializers.CharField(source='tiempo_respuesta_max')
    ticketCodigo = serializers.CharField(source='ticket_codigo', allow_blank=True)
    componenteDisplay = serializers.CharField(source='get_componente_display', read_only=True)
    nivelDisplay = serializers.CharField(source='get_nivel_display', read_only=True)
    estadoDisplay = serializers.CharField(source='get_estado_display', read_only=True)
    fechaDeteccion = serializers.SerializerMethodField()

    class Meta:
        model = MonitoringEvent
        fields = [
            'id', 'codigo', 'nivel', 'nivelDisplay', 'componente', 'componenteDisplay',
            'metrica', 'valor_registrado', 'valorRegistrado', 'valor_numerico', 'valorNumerico',
            'umbral_referencia', 'umbralReferencia', 'descripcion',
            'proceso_negocio', 'procesoNegocio',
            'genera_incidente', 'generaIncidente',
            'justificacion_incidente', 'justificacionIncidente',
            'impacto', 'urgencia', 'prioridad_asignada', 'prioridadAsignada',
            'responsable', 'accion_respuesta', 'accionRespuesta',
            'tiempo_respuesta_max', 'tiempoRespuestaMax',
            'estado', 'estadoDisplay',
            'ticket_vinculado', 'ticket_codigo', 'ticketCodigo',
            'fechaDeteccion', 'created_at', 'updated_at'
        ]

    def get_fechaDeteccion(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%Y-%m-%d %H:%M:%S')
        return ""


class MonitoringEvaluateSerializer(serializers.Serializer):
    componente = serializers.ChoiceField(choices=MonitoringEvent.Componente.choices)
    metrica = serializers.CharField(max_length=100)
    valor_numerico = serializers.FloatField()
    unidad = serializers.CharField(max_length=20, required=False, default='%')
    proceso_negocio = serializers.CharField(max_length=120, required=False, default='Operación General Spa')
    descripcion = serializers.CharField(required=False, allow_blank=True, default='')


