from decimal import Decimal
from django.db import models


class MovimientoCaja(models.Model):
    class Tipos(models.TextChoices):
        INGRESO_CITA = 'INGRESO', 'Ingreso por Cita / Servicio'
        INGRESO_EXTRA = 'INGRESO_EXTRA', 'Ingreso Extraordinario'
        EGRESO = 'EGRESO', 'Egreso / Devolución / Gasto'

    tipo = models.CharField(
        'Tipo de Movimiento',
        max_length=20,
        choices=Tipos.choices,
        default=Tipos.INGRESO_CITA
    )
    concepto = models.CharField('Concepto', max_length=200, blank=True, default='')
    monto = models.DecimalField(
        'Monto (S/)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    metodo_pago = models.CharField('Método de Pago', max_length=20, default='EFECTIVO')
    cita = models.ForeignKey(
        'appointments.Cita',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_caja',
        verbose_name='Cita Asociada'
    )
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    descripcion = models.TextField('Descripción / Glosa', blank=True, default='')

    class Meta:
        db_table = 'movimientos_caja'
        verbose_name = 'Movimiento de Caja'
        verbose_name_plural = 'Movimientos de Caja'
        ordering = ['-fecha_registro', '-id']

    def __str__(self):
        return f"[{self.tipo}] S/ {self.monto} - {self.concepto or self.descripcion}"
