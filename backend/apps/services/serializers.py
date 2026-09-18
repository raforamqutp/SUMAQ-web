from decimal import Decimal
from rest_framework import serializers
from apps.services.models import Servicio, RecetaServicio
from apps.inventory.models import Producto


class RecetaServicioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    unidad_medida = serializers.CharField(source='producto.unidad_medida', read_only=True)
    costo_unitario = serializers.DecimalField(
        source='producto.costo_unitario',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = RecetaServicio
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'unidad_medida',
            'costo_unitario',
            'cantidad_requerida'
        ]


class ServicioSerializer(serializers.ModelSerializer):
    recetas = RecetaServicioSerializer(many=True, read_only=True)

    class Meta:
        model = Servicio
        fields = [
            'id',
            'nombre',
            'descripcion',
            'precio_publico',
            'duracion_min',
            'imagen_url',
            'activo',
            'recetas'
        ]


class RecetaItemInputSerializer(serializers.Serializer):
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source='producto'
    )
    cantidad_requerida = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01')
    )
