from decimal import Decimal
from django.db import models


class Producto(models.Model):
    class EstadosStock(models.TextChoices):
        NORMAL = 'NORMAL', 'Normal'
        BAJO = 'BAJO', 'Stock Bajo'
        CRITICO = 'CRITICO', 'Stock Crítico'

    nombre = models.CharField('Nombre del Producto/Insumo', max_length=150)
    descripcion = models.TextField('Descripción', blank=True, default='')
    costo_unitario = models.DecimalField(
        'Costo Unitario (S/)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    stock_actual = models.DecimalField(
        'Stock Actual',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    stock_minimo_alerta = models.DecimalField(
        'Stock Mínimo de Alerta',
        max_digits=10,
        decimal_places=2,
        default=Decimal('5.00')
    )
    unidad_medida = models.CharField('Unidad de Medida', max_length=50, default='unidades')
    activo = models.BooleanField('Activo', default=True)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        db_table = 'productos'
        verbose_name = 'Producto / Insumo'
        verbose_name_plural = 'Productos / Insumos'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.stock_actual} {self.unidad_medida})"

    @property
    def estado_stock(self):
        if self.stock_actual <= Decimal('2.00') or self.stock_actual <= (self.stock_minimo_alerta / Decimal('2.00')):
            return self.EstadosStock.CRITICO
        elif self.stock_actual <= self.stock_minimo_alerta:
            return self.EstadosStock.BAJO
        return self.EstadosStock.NORMAL


class MovimientoInventario(models.Model):
    class Tipos(models.TextChoices):
        ENTRADA_COMPRA = 'ENTRADA_COMPRA', 'Entrada por Compra'
        SALIDA_CONSUMO_SERVICIO = 'SALIDA_CONSUMO_SERVICIO', 'Salida por Consumo en Servicio'
        AJUSTE_POSITIVO = 'AJUSTE_POSITIVO', 'Ajuste Físico Positivo'
        AJUSTE_NEGATIVO = 'AJUSTE_NEGATIVO', 'Ajuste Físico Negativo'

    producto = models.ForeignKey(
        'inventory.Producto',
        on_delete=models.CASCADE,
        related_name='movimientos',
        verbose_name='Producto'
    )
    tipo = models.CharField('Tipo de Movimiento', max_length=35, choices=Tipos.choices)
    cantidad = models.DecimalField('Cantidad', max_digits=10, decimal_places=2)
    costo_unitario = models.DecimalField(
        'Costo Unitario al Asiento (S/)',
        max_digits=10,
        decimal_places=2
    )
    referencia_tipo = models.CharField('Tipo de Referencia', max_length=50, default='AJUSTE_MANUAL')
    referencia_id = models.PositiveIntegerField('ID Referencia', null=True, blank=True)
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    descripcion = models.TextField('Descripción / Glosa', blank=True, default='')

    class Meta:
        db_table = 'movimientos_inventario'
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
        ordering = ['-fecha_registro', '-id']

    def __str__(self):
        return f"[{self.tipo}] {self.cantidad} {self.producto.unidad_medida} - {self.producto.nombre}"
