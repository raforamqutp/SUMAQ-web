from rest_framework import serializers
from apps.attention.models import FichaAtencion, ServicioAdicionalAtencion
from apps.appointments.models import Cita


class ServicioAdicionalAtencionSerializer(serializers.ModelSerializer):
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)

    class Meta:
        model = ServicioAdicionalAtencion
        fields = [
            'id',
            'servicio',
            'servicio_nombre',
            'cantidad',
            'precio_unitario_historico',
            'subtotal',
            'created_at'
        ]


class FichaAtencionSerializer(serializers.ModelSerializer):
    servicios_adicionales = ServicioAdicionalAtencionSerializer(many=True, read_only=True)

    class Meta:
        model = FichaAtencion
        fields = [
            'id',
            'tipo_piel',
            'alergias_conocidas',
            'notas_terapeuta',
            'servicios_adicionales',
            'fecha_registro',
            'updated_at'
        ]


class FichaAtencionInputSerializer(serializers.Serializer):
    cita_id = serializers.PrimaryKeyRelatedField(
        queryset=Cita.objects.all(),
        required=False,
        allow_null=True
    )
    tipo_piel = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    alergias_conocidas = serializers.CharField(required=False, allow_blank=True, default='')
    notas_terapeuta = serializers.CharField(required=False, allow_blank=True, default='')


class AgregarServicioInputSerializer(serializers.Serializer):
    servicio_id = serializers.IntegerField(required=True)
    cantidad = serializers.IntegerField(default=1, min_value=1)
