from decimal import Decimal
from django.db import models


class FichaAtencion(models.Model):
    cita = models.OneToOneField(
        'appointments.Cita',
        on_delete=models.CASCADE,
        related_name='ficha_atencion',
        verbose_name='Cita Asociada'
    )
    tipo_piel = models.CharField('Tipo de Piel / Diagnóstico', max_length=100, blank=True, default='')
    alergias_conocidas = models.TextField('Alergias o Contraindicaciones', blank=True, default='')
    notas_terapeuta = models.TextField('Notas de Evolución y Observaciones', blank=True, default='')
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    objects = models.Manager()

    class Meta:
        db_table = 'fichas_atencion'
        verbose_name = 'Ficha de Atención Clínica'
        verbose_name_plural = 'Fichas de Atención Clínica'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"Ficha Clínica Cita [{self.cita.codigo_reserva}] - {self.cita.cliente.nombre_completo}"


class ServicioAdicionalAtencion(models.Model):
    ficha_atencion = models.ForeignKey(
        'attention.FichaAtencion',
        on_delete=models.CASCADE,
        related_name='servicios_adicionales',
        verbose_name='Ficha de Atención'
    )
    servicio = models.ForeignKey(
        'services.Servicio',
        on_delete=models.PROTECT,
        verbose_name='Servicio Adicional'
    )
    cantidad = models.PositiveIntegerField('Cantidad', default=1)
    precio_unitario_historico = models.DecimalField(
        'Precio Unitario Histórico (S/)',
        max_digits=10,
        decimal_places=2
    )
    subtotal = models.DecimalField(
        'Subtotal (S/)',
        max_digits=10,
        decimal_places=2
    )
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)

    objects = models.Manager()

    class Meta:
        db_table = 'servicios_adicionales_atencion'
        verbose_name = 'Servicio Adicional en Atención'
        verbose_name_plural = 'Servicios Adicionales en Atención'

    def __str__(self):
        return f"{self.cantidad}x {self.servicio.nombre} en {self.ficha_atencion.cita.codigo_reserva}"
