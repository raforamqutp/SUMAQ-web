from decimal import Decimal
from django.db import models


class Servicio(models.Model):
    nombre = models.CharField('Nombre del Servicio', max_length=150)
    descripcion = models.TextField('Descripción', blank=True, default='')
    precio_publico = models.DecimalField(
        'Precio Público (S/)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    duracion_min = models.PositiveIntegerField('Duración (minutos)', default=60)
    imagen_url = models.CharField('URL de Imagen', max_length=500, blank=True, default='')
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        db_table = 'servicios'
        verbose_name = 'Servicio / Tratamiento'
        verbose_name_plural = 'Servicios / Tratamientos'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre} (S/ {self.precio_publico})"


class RecetaServicio(models.Model):
    servicio = models.ForeignKey(
        'services.Servicio',
        on_delete=models.CASCADE,
        related_name='recetas',
        verbose_name='Servicio'
    )
    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.PROTECT,
        related_name='recetas_usadas',
        verbose_name='Insumo / Producto'
    )
    cantidad_requerida = models.DecimalField(
        'Cantidad Requerida por Atención',
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00')
    )

    class Meta:
        db_table = 'recetas_servicio'
        verbose_name = 'Receta de Servicio (Insumo)'
        verbose_name_plural = 'Recetas de Servicios (Insumos)'
        unique_together = ('servicio', 'producto')

    def __str__(self):
        return f"{self.servicio.nombre} -> {self.cantidad_requerida} {self.producto.unidad_medida} de {self.producto.nombre}"
