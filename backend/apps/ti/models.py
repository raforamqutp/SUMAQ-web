from django.db import models
from django.utils import timezone
from datetime import timedelta


class Ticket(models.Model):
    class Tipo(models.TextChoices):
        SOLICITUD_SERVICIO = 'SOLICITUD_SERVICIO', 'Solicitud de Servicio'
        SOLICITUD_INFORMACION = 'SOLICITUD_INFORMACION', 'Solicitud de Información'
        SOLICITUD_ACCESO = 'SOLICITUD_ACCESO', 'Solicitud de Acceso'
        INCIDENCIA = 'INCIDENCIA', 'Incidencia Técnica'
        SOLICITUD_CAMBIO = 'SOLICITUD_CAMBIO', 'Control de Cambios (RFC)'

    class AreaCambio(models.TextChoices):
        INFRAESTRUCTURA = 'INFRAESTRUCTURA', 'Infraestructura (Redes, Switch, Router, Servidores, Azure)'
        APLICACIONES = 'APLICACIONES', 'Aplicaciones y BD (Código, Pasarela de Pagos, Migraciones)'
        DOCUMENTACION = 'DOCUMENTACION', 'Documentación (Manuales de Contingencia, Topología, C4)'
        CALENDARIO = 'CALENDARIO', 'Calendario (Change Freeze, Ventanas de Mantenimiento)'

    class TipoCambio(models.TextChoices):
        NORMAL = 'NORMAL', 'Cambio Normal (Requiere Aprobación Formal CAB)'
        EMERGENCIA = 'EMERGENCIA', 'Cambio de Emergencia (Aprobación Rápida ECAB)'
        ESTANDAR = 'ESTANDAR', 'Cambio Estándar (Pre-aprobado, Bajo Riesgo)'

    class ImpactoRiesgo(models.TextChoices):
        BAJO = 'BAJO', 'Bajo'
        MEDIO = 'MEDIO', 'Medio'
        ALTO = 'ALTO', 'Alto'

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
    tipo = models.CharField('Tipo de Requerimiento', max_length=40, choices=Tipo.choices, default=Tipo.SOLICITUD_SERVICIO)
    prioridad = models.CharField('Prioridad (SLA)', max_length=20, choices=Prioridad.choices, default=Prioridad.P3_MEDIA)
    modulo = models.CharField('Módulo Afectado', max_length=100, default='General')
    asunto = models.CharField('Asunto', max_length=255)
    descripcion = models.TextField('Descripción Detallada')

    # Dimensiones de Control de Cambios ITIL v4 (Semana 11)
    area_cambio = models.CharField('Área de Cambio', max_length=30, choices=AreaCambio.choices, blank=True, null=True)
    tipo_cambio = models.CharField('Tipo de Cambio ITIL', max_length=20, choices=TipoCambio.choices, default=TipoCambio.NORMAL, blank=True, null=True)
    impacto_riesgo = models.CharField('Impacto y Riesgo', max_length=10, choices=ImpactoRiesgo.choices, default=ImpactoRiesgo.MEDIO, blank=True, null=True)
    ventana_mantenimiento = models.CharField('Ventana de Mantenimiento', max_length=150, blank=True, default='')
    plan_rollback = models.TextField('Plan de Rollback (< 5-10 min)', blank=True, default='')

    # Gobernanza Comité CAB (Change Advisory Board)
    cab_aprobado_por = models.CharField('Aprobador CAB', max_length=150, blank=True, default='')
    cab_acta_numero = models.CharField('N° Acta de Aprobación CAB', max_length=60, blank=True, default='')
    cab_fecha_aprobacion = models.DateTimeField('Fecha Aprobación CAB', null=True, blank=True)

    # Solicitante
    solicitante_nombre = models.CharField('Nombre del Solicitante', max_length=150, default='Usuario Sumaq')
    solicitante_email = models.EmailField('Email del Solicitante', default='usuario@sumaqspa.pe')
    solicitante_rol = models.CharField('Rol del Solicitante', max_length=50, default='TERAPEUTA')

    # SLAs
    sla_horas = models.PositiveIntegerField('SLA en Horas', default=24)
    sla_fecha_limite = models.DateTimeField('Fecha y Hora Límite SLA', null=True, blank=True)

    # Estado y Especialista
    estado = models.CharField('Estado', max_length=35, choices=Estado.choices, default=Estado.ABIERTO)
    asignado_a = models.CharField('Especialista Asignado', max_length=150, blank=True, default='')

    # Aprobación de Gerencia / Dueño (Principio ITIL de Segregación de Funciones)
    aprobado_por_gerencia = models.BooleanField('Aprobado por Gerencia', default=False)
    aprobador_nombre = models.CharField('Gerente Aprobador', max_length=150, blank=True, default='')
    fecha_aprobacion = models.DateTimeField('Fecha de Aprobación', null=True, blank=True)

    # Dictamen y Resolución
    resolucion_tecnica = models.TextField('Resolución Técnica / Dictamen', blank=True, default='')
    fecha_resolucion = models.DateTimeField('Fecha de Resolución', null=True, blank=True)

    # Enlaces de Integración Externa
    jira_key = models.CharField('Clave Jira Cloud', max_length=50, blank=True, default='')
    jira_url = models.URLField('URL Jira Cloud', blank=True, default='')
    github_url = models.URLField('URL GitHub RFC/PR', blank=True, default='')

    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        db_table = 'ti_tickets'
        verbose_name = 'Ticket de Mesa de Ayuda'
        verbose_name_plural = 'Tickets de Mesa de Ayuda'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.codigo}] {self.asunto} ({self.estado})"

    def save(self, *args, **kwargs):
        # Asignar SLA automáticamente si no está definido
        if not self.sla_horas or self.sla_horas <= 0:
            if self.prioridad == self.Prioridad.P1_CRITICA:
                self.sla_horas = 2
            elif self.prioridad == self.Prioridad.P2_ALTA:
                self.sla_horas = 8
            elif self.prioridad == self.Prioridad.P3_MEDIA:
                self.sla_horas = 24
            elif self.prioridad == self.Prioridad.P4_BAJA:
                self.sla_horas = 48

        # Si es solicitud de acceso o de cambio y no ha sido aprobada, marcar pendiente de aprobación
        if self.tipo in (self.Tipo.SOLICITUD_ACCESO, self.Tipo.SOLICITUD_CAMBIO) and not self.aprobado_por_gerencia and not self.cab_aprobado_por and self.estado == self.Estado.ABIERTO:
            self.estado = self.Estado.PENDIENTE_APROBACION

        if not self.sla_fecha_limite:
            base_time = self.created_at or timezone.now()
            self.sla_fecha_limite = base_time + timedelta(hours=self.sla_horas)

        super().save(*args, **kwargs)
