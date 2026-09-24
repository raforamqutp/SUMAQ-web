from decimal import Decimal
from django.db import models


class Cita(models.Model):
    class Estados(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ATENDIDA = 'ATENDIDA', 'Atendida'
        CANCELADA = 'CANCELADA', 'Cancelada'

    class MetodosPago(models.TextChoices):
        EFECTIVO = 'EFECTIVO', 'Efectivo'
        TARJETA = 'TARJETA', 'Tarjeta'
        YAPE = 'YAPE', 'Yape'
        PLIN = 'PLIN', 'Plin'

    codigo_reserva = models.CharField(
        'Código de Reserva',
        max_length=40,
        unique=True,
        db_index=True
    )
    cliente = models.ForeignKey(
        'clients.Cliente',
        on_delete=models.PROTECT,
        related_name='citas',
        verbose_name='Cliente'
    )
    servicio = models.ForeignKey(
        'services.Servicio',
        on_delete=models.PROTECT,
        related_name='citas',
        verbose_name='Servicio Base'
    )
    terapeuta = models.ForeignKey(
        'therapists.Terapeuta',
        on_delete=models.PROTECT,
        related_name='citas',
        verbose_name='Terapeuta'
    )
    cabina = models.ForeignKey(
        'cabins.Cabina',
        on_delete=models.PROTECT,
        related_name='citas',
        verbose_name='Cabina'
    )
    fecha = models.DateField('Fecha de Cita', db_index=True)
    hora_inicio = models.TimeField('Hora de Inicio')
    hora_fin = models.TimeField('Hora de Fin')
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estados.choices,
        default=Estados.PENDIENTE,
        db_index=True
    )
    subtotal = models.DecimalField(
        'Subtotal (S/)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    descuento = models.DecimalField(
        'Descuento (S/)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    monto_total = models.DecimalField(
        'Monto Total (S/)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    metodo_pago = models.CharField(
        'Método de Pago',
        max_length=20,
        choices=MetodosPago.choices,
        default=MetodosPago.EFECTIVO
    )
    promocion = models.ForeignKey(
        'marketing.Promocion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='citas',
        verbose_name='Promoción Aplicada'
    )
    codigo_cupon_aplicado = models.CharField(
        'Cupón Aplicado',
        max_length=50,
        blank=True,
        default=''
    )
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    objects = models.Manager()
    DoesNotExist: type[Exception]

    class Meta:
        db_table = 'citas'
        verbose_name = 'Cita / Reserva'
        verbose_name_plural = 'Citas / Reservas'
        ordering = ['-fecha', '-hora_inicio']
        indexes = [
            models.Index(fields=['fecha', 'terapeuta', 'hora_inicio', 'hora_fin', 'estado'], name='idx_cita_terapeuta_slot'),
            models.Index(fields=['fecha', 'cabina', 'hora_inicio', 'hora_fin', 'estado'], name='idx_cita_cabina_slot'),
            models.Index(fields=['cliente', 'fecha', 'estado'], name='idx_cita_cliente_fecha'),
        ]

    def __str__(self):
        return f"[{self.codigo_reserva}] {self.cliente.nombre_completo} - {self.fecha} {self.hora_inicio} ({self.estado})"
