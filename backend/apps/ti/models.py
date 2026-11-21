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
    kdb_codigo = models.CharField('Código KDB Vinculado', max_length=50, blank=True, default='', db_index=True)

    created_at = models.DateTimeField('Fecha de Creación', default=timezone.now)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        db_table = 'ti_tickets'
        verbose_name = 'Ticket de Mesa de Ayuda'
        verbose_name_plural = 'Tickets de Mesa de Ayuda'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.codigo}] {self.asunto} ({self.estado})"

    @classmethod
    def generar_siguiente_codigo(cls, prefix: str = 'REQ') -> str:
        year = timezone.now().year
        base = f"{prefix}-{year}-"
        existentes = cls.objects.filter(codigo__startswith=base).values_list('codigo', flat=True)
        max_num = 9
        for cod in existentes:
            suf = cod.replace(base, '').split('-')[0]
            if suf.isdigit():
                max_num = max(max_num, int(suf))
        nuevo = max_num + 1
        while cls.objects.filter(codigo=f"{base}{nuevo:04d}").exists():
            nuevo += 1
        return f"{base}{nuevo:04d}"

    def save(self, *args, **kwargs):
        # Implementación: sla
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

        # Implementación: polp
        # Si es solicitud de acceso o de cambio y no ha sido aprobada, marcar pendiente de aprobación
        if self.tipo in (self.Tipo.SOLICITUD_ACCESO, self.Tipo.SOLICITUD_CAMBIO) and not self.aprobado_por_gerencia and not self.cab_aprobado_por and self.estado == self.Estado.ABIERTO:
            self.estado = self.Estado.PENDIENTE_APROBACION

        if not self.sla_fecha_limite:
            base_time = self.created_at or timezone.now()
            self.sla_fecha_limite = base_time + timedelta(hours=self.sla_horas)

        super().save(*args, **kwargs)


class KdbArticle(models.Model):
    class Categoria(models.TextChoices):
        INFRAESTRUCTURA = 'INFRAESTRUCTURA', 'Infraestructura'
        SEGURIDAD = 'SEGURIDAD', 'Seguridad'
        BASE_DE_DATOS = 'BASE_DE_DATOS', 'Base de Datos'
        APLICACIONES = 'APLICACIONES', 'Aplicaciones'
        REDES = 'REDES', 'Redes'

    class Prioridad(models.TextChoices):
        P1_CRITICA = 'P1_CRITICA', 'P1 - Crítica'
        P2_ALTA = 'P2_ALTA', 'P2 - Alta'
        P3_MEDIA = 'P3_MEDIA', 'P3 - Media'
        P4_BAJA = 'P4_BAJA', 'P4 - Baja'

    codigo = models.CharField('Código KDB', max_length=50, unique=True, db_index=True)
    titulo = models.CharField('Título', max_length=255)
    categoria = models.CharField('Categoría', max_length=50, choices=Categoria.choices, default=Categoria.INFRAESTRUCTURA)
    modulo = models.CharField('Módulo Afectado', max_length=100)
    prioridad = models.CharField('Prioridad', max_length=20, choices=Prioridad.choices, default=Prioridad.P2_ALTA)
    sintoma = models.TextField('Síntoma')
    causa_raiz = models.TextField('Causa Raíz')
    solucion_workaround = models.TextField('Solución Workaround')
    tiempo_estimado = models.CharField('Tiempo Estimado', max_length=50, default='< 5 min')
    jira_ref = models.CharField('Referencia Jira', max_length=50, blank=True, default='')
    activo = models.BooleanField('Activo', default=True)

    created_at = models.DateTimeField('Fecha de Creación', default=timezone.now)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        db_table = 'ti_kdb_articulos'
        verbose_name = 'Artículo KDB'
        verbose_name_plural = 'Artículos KDB'
        ordering = ['codigo']

    def __str__(self):
        return f"[{self.codigo}] {self.titulo}"

    @classmethod
    def generar_siguiente_codigo(cls) -> str:
        year = timezone.now().year
        base = f"KDB-{year}-"
        existentes = cls.objects.filter(codigo__startswith=base).values_list('codigo', flat=True)
        max_num = 0
        for cod in existentes:
            suf = cod.replace(base, '').split('-')[0]
            if suf.isdigit():
                max_num = max(max_num, int(suf))
        nuevo = max_num + 1
        while cls.objects.filter(codigo=f"{base}{nuevo:03d}").exists():
            nuevo += 1
        return f"{base}{nuevo:03d}"

    @property
    def veces_utilizado(self):
        return Ticket.objects.filter(kdb_codigo=self.codigo).count()

    @property
    def tickets_vinculados(self):
        return list(Ticket.objects.filter(kdb_codigo=self.codigo).order_by('-created_at').values_list('codigo', flat=True))


class MonitoringEvent(models.Model):
    class Nivel(models.TextChoices):
        INFO = 'INFO', 'Informativo'
        WARNING = 'WARNING', 'Advertencia'
        ERROR = 'ERROR', 'Excepción / Error'
        CRITICAL = 'CRITICAL', 'Crítico'

    class Componente(models.TextChoices):
        MYSQL_MASTER = 'MYSQL_MASTER', 'MySQL Master (3308)'
        MYSQL_SLAVE = 'MYSQL_SLAVE', 'MySQL Slave (3309)'
        REDIS_CACHE = 'REDIS_CACHE', 'Motor Redis (6379)'
        BACKEND_API = 'BACKEND_API', 'Django REST API (8000)'
        NGINX_GATEWAY = 'NGINX_GATEWAY', 'Servidor Web Nginx'
        PASARELA_NIUBIZ = 'PASARELA_NIUBIZ', 'Pasarela de Pagos Niubiz'
        SEGURIDAD_AUTH = 'SEGURIDAD_AUTH', 'Seguridad & Autenticación'
        HOST_SISTEMA = 'HOST_SISTEMA', 'Recursos de Servidor / Host'

    class Estado(models.TextChoices):
        ACTIVO = 'ACTIVO', 'Activo / En Evaluación'
        MITIGADO = 'MITIGADO', 'Mitigado / Auto-recuperado'
        ESCALADO = 'ESCALADO', 'Escalado a Incidente'
        CERRADO = 'CERRADO', 'Cerrado / Normalizado'

    class NivelImpacto(models.TextChoices):
        BAJO = 'BAJO', 'Bajo'
        MEDIO = 'MEDIO', 'Medio'
        ALTO = 'ALTO', 'Alto'

    class NivelUrgencia(models.TextChoices):
        BAJA = 'BAJA', 'Baja'
        MEDIA = 'MEDIA', 'Media'
        ALTA = 'ALTA', 'Alta'

    codigo = models.CharField('Código de Evento', max_length=40, unique=True, db_index=True)
    nivel = models.CharField('Nivel de Evento', max_length=20, choices=Nivel.choices, default=Nivel.INFO, db_index=True)
    componente = models.CharField('Componente / Origen', max_length=40, choices=Componente.choices, default=Componente.BACKEND_API, db_index=True)
    metrica = models.CharField('Métrica Evaluada', max_length=100)
    valor_registrado = models.CharField('Valor Registrado', max_length=60)
    valor_numerico = models.FloatField('Valor Numérico', default=0.0)
    umbral_referencia = models.CharField('Umbral de Referencia', max_length=120, default='Info: 60-75% | Warning: 75-85% | Error: 85-95% | Crítico: >95%')
    descripcion = models.TextField('Descripción del Evento')
    proceso_negocio = models.CharField('Proceso de Negocio Afectado', max_length=120, default='Operación General Spa')

    genera_incidente = models.BooleanField('Genera Incidente', default=False)
    justificacion_incidente = models.TextField('Justificación Técnica', blank=True, default='')
    impacto = models.CharField('Impacto', max_length=20, choices=NivelImpacto.choices, default=NivelImpacto.BAJO)
    urgencia = models.CharField('Urgencia', max_length=20, choices=NivelUrgencia.choices, default=NivelUrgencia.BAJA)
    prioridad_asignada = models.CharField('Prioridad Asignada', max_length=20, blank=True, default='N/A')

    responsable = models.CharField('Rol Responsable', max_length=150, default='Monitoreo Automatizado TI')
    accion_respuesta = models.TextField('Acción de Respuesta', blank=True, default='')
    tiempo_respuesta_max = models.CharField('Tiempo Máximo de Respuesta', max_length=40, default='15 min')
    estado = models.CharField('Estado del Evento', max_length=30, choices=Estado.choices, default=Estado.ACTIVO)

    ticket_vinculado = models.ForeignKey(
        Ticket,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_monitoreo',
        verbose_name='Ticket de Incidente Vinculado'
    )
    ticket_codigo = models.CharField('Código de Ticket Vinculado', max_length=40, blank=True, default='')

    created_at = models.DateTimeField('Fecha de Detección', default=timezone.now)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        db_table = 'ti_eventos_monitoreo'
        verbose_name = 'Evento de Monitoreo'
        verbose_name_plural = 'Eventos de Monitoreo'
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"[{self.codigo}] {self.nivel} - {self.metrica} ({self.valor_registrado})"

    @classmethod
    def generar_siguiente_codigo(cls) -> str:
        year = timezone.now().year
        base = f"EVT-{year}-"
        existentes = cls.objects.filter(codigo__startswith=base).values_list('codigo', flat=True)
        max_num = 0
        for cod in existentes:
            suf = cod.replace(base, '').split('-')[0]
            if suf.isdigit():
                max_num = max(max_num, int(suf))
        nuevo = max_num + 1
        while cls.objects.filter(codigo=f"{base}{nuevo:04d}").exists():
            nuevo += 1
        return f"{base}{nuevo:04d}"

    @staticmethod
    def calcular_prioridad_matriz(impacto: str, urgencia: str) -> str:
        matriz = {
            ('ALTO', 'ALTA'): Ticket.Prioridad.P1_CRITICA,
            ('ALTO', 'MEDIA'): Ticket.Prioridad.P2_ALTA,
            ('ALTO', 'BAJA'): Ticket.Prioridad.P3_MEDIA,
            ('MEDIO', 'ALTA'): Ticket.Prioridad.P2_ALTA,
            ('MEDIO', 'MEDIA'): Ticket.Prioridad.P3_MEDIA,
            ('MEDIO', 'BAJA'): Ticket.Prioridad.P4_BAJA,
            ('BAJO', 'ALTA'): Ticket.Prioridad.P3_MEDIA,
            ('BAJO', 'MEDIA'): Ticket.Prioridad.P4_BAJA,
            ('BAJO', 'BAJA'): Ticket.Prioridad.P4_BAJA,
        }
        return matriz.get((impacto, urgencia), Ticket.Prioridad.P3_MEDIA)

    def save(self, *args, **kwargs):
        if self.genera_incidente and (not self.prioridad_asignada or self.prioridad_asignada == 'N/A'):
            self.prioridad_asignada = self.calcular_prioridad_matriz(self.impacto, self.urgencia)
        elif not self.genera_incidente:
            self.prioridad_asignada = 'N/A'

        if self.ticket_vinculado and not self.ticket_codigo:
            self.ticket_codigo = self.ticket_vinculado.codigo

        super().save(*args, **kwargs)


