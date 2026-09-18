from decimal import Decimal
from rest_framework import serializers
from apps.inventory.models import Producto, MovimientoInventario


class ProductoSerializer(serializers.ModelSerializer):
    estado_stock = serializers.CharField(read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'costo_unitario',
            'stock_actual',
            'stock_minimo_alerta',
            'unidad_medida',
            'estado_stock',
            'activo',
            'created_at'
        ]
        read_only_fields = ['id', 'estado_stock', 'created_at']


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    unidad_medida = serializers.CharField(source='producto.unidad_medida', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'unidad_medida',
            'tipo',
            'cantidad',
            'costo_unitario',
            'referencia_tipo',
            'referencia_id',
            'fecha_registro',
            'descripcion'
        ]
        read_only_fields = ['id', 'fecha_registro']


class MovimientoManualInputSerializer(serializers.Serializer):
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source='producto'
    )
    tipo = serializers.ChoiceField(choices=MovimientoInventario.Tipos.choices)
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    costo_unitario = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    descripcion = serializers.CharField(required=False, allow_blank=True, default='Ajuste manual de inventario')
