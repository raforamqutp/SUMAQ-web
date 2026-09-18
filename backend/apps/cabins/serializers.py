from rest_framework import serializers
from apps.cabins.models import Cabina


class CabinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cabina
        fields = ['id', 'nombre', 'tipo', 'descripcion', 'activa']
