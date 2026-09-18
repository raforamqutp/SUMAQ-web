from decimal import Decimal
from django.db import models


class Promocion(models.Model):
    titulo = models.CharField('Título de la Promoción', max_length=150)
    descripcion = models.TextField('Descripción', blank=True, default='')
    codigo_cupon = models.CharField('Código de Cupón', max_length=50, unique=True, db_index=True)
    porcentaje_descuento = models.DecimalField(
        'Porcentaje de Descuento (%)',
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00')
    )
    fecha_inicio = models.DateField('Fecha de Inicio')
    fecha_fin = models.DateField('Fecha de Fin')
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'promociones'
        verbose_name = 'Promoción / Cupón'
        verbose_name_plural = 'Promociones / Cupones'
        ordering = ['-id']

    def __str__(self):
        return f"{self.titulo} [{self.codigo_cupon}] ({self.porcentaje_descuento}%)"

    def save(self, *args, **kwargs):
        self.codigo_cupon = self.codigo_cupon.strip().upper()
        super().save(*args, **kwargs)

    def es_valida_para_fecha(self, fecha):
        return self.activo and (self.fecha_inicio <= fecha <= self.fecha_fin)
