from decimal import Decimal
from rest_framework import serializers
from apps.appointments.models import Cita
from apps.clients.serializers import ClienteSerializer
from apps.services.serializers import ServicioSerializer
from apps.therapists.serializers import TerapeutaSerializer
from apps.cabins.serializers import CabinaSerializer
from apps.marketing.serializers import PromocionSerializer
from apps.clients.models import Cliente
from apps.services.models import Servicio
from apps.therapists.models import Terapeuta
from apps.cabins.models import Cabina


class CitaListDetailSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)
    servicio = ServicioSerializer(read_only=True)
    terapeuta = TerapeutaSerializer(read_only=True)
    cabina = CabinaSerializer(read_only=True)
    promocion = PromocionSerializer(read_only=True)
    ficha_atencion = serializers.SerializerMethodField()

    class Meta:
        model = Cita
        fields = [
            'id',
            'codigo_reserva',
            'cliente',
            'servicio',
            'terapeuta',
            'cabina',
            'fecha',
            'hora_inicio',
            'hora_fin',
            'estado',
            'subtotal',
            'descuento',
            'monto_total',
            'metodo_pago',
            'promocion',
            'codigo_cupon_aplicado',
            'ficha_atencion',
            'created_at',
            'updated_at'
        ]

    def get_ficha_atencion(self, obj):
        if hasattr(obj, 'ficha_atencion') and obj.ficha_atencion:
            from apps.attention.serializers import FichaAtencionSerializer
            return FichaAtencionSerializer(obj.ficha_atencion).data
        return None


class ReservaWebInputSerializer(serializers.Serializer):
    dni = serializers.CharField(max_length=20, required=True)
    nombre_completo = serializers.CharField(max_length=200, required=True)
    telefono = serializers.CharField(max_length=50, required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    servicio_id = serializers.IntegerField(required=True)
    terapeuta_id = serializers.IntegerField(required=True)
    cabina_id = serializers.IntegerField(required=True)
    fecha = serializers.DateField(required=True)
    hora_inicio = serializers.TimeField(required=True)
    metodo_pago = serializers.ChoiceField(
        choices=Cita.MetodosPago.choices,
        default=Cita.MetodosPago.EFECTIVO
    )
    codigo_cupon = serializers.CharField(max_length=50, required=False, allow_blank=True)


class ConsultarCitaInputSerializer(serializers.Serializer):
    codigo_reserva = serializers.CharField(max_length=40, required=True)
    dni = serializers.CharField(max_length=20, required=True)


class CancelarCitaWebInputSerializer(serializers.Serializer):
    codigo_reserva = serializers.CharField(max_length=40, required=True)
    dni = serializers.CharField(max_length=20, required=True)
    motivo = serializers.CharField(max_length=255, required=False, allow_blank=True)


class ReprogramarCitaWebInputSerializer(serializers.Serializer):
    codigo_reserva = serializers.CharField(max_length=40, required=True)
    dni = serializers.CharField(max_length=20, required=True)
    fecha = serializers.DateField(required=True)
    hora_inicio = serializers.TimeField(required=True)
