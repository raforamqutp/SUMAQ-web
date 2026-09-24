from rest_framework import serializers
from apps.clients.models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'dni', 'nombre_completo', 'telefono', 'email', 'activo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
