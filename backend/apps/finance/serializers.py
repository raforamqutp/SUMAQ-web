from decimal import Decimal
from rest_framework import serializers
from apps.finance.models import MovimientoCaja


class MovimientoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCaja
        fields = [
            'id',
            'tipo',
            'concepto',
            'monto',
            'metodo_pago',
            'cita',
            'fecha_registro',
            'descripcion'
        ]
        read_only_fields = ['id', 'fecha_registro']


class MovimientoCajaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCaja
        fields = [
            'tipo',
            'concepto',
            'monto',
            'metodo_pago',
            'descripcion'
        ]

    def create(self, validated_data):
        if not validated_data.get('concepto'):
            validated_data['concepto'] = validated_data.get('descripcion', 'Movimiento de caja')
        return super().create(validated_data)
