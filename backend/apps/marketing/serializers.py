from rest_framework import serializers
from apps.marketing.models import Promocion


class PromocionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promocion
        fields = [
            'id',
            'titulo',
            'descripcion',
            'codigo_cupon',
            'porcentaje_descuento',
            'fecha_inicio',
            'fecha_fin',
            'activo'
        ]
