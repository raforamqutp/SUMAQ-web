from rest_framework import serializers
from apps.therapists.models import Terapeuta
from apps.accounts.serializers import UserSerializer
from apps.cabins.serializers import CabinaSerializer
from apps.accounts.models import User
from apps.cabins.models import Cabina


class TerapeutaSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    cabina = CabinaSerializer(read_only=True)
    cabina_id = serializers.PrimaryKeyRelatedField(
        queryset=Cabina.objects.all(),
        source='cabina',
        allow_null=True,
        required=False
    )
    nombre_completo = serializers.CharField(source='usuario.nombre_completo', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model = Terapeuta
        fields = [
            'id',
            'usuario',
            'nombre_completo',
            'email',
            'especialidad',
            'cabina',
            'cabina_id',
            'foto_url',
            'activo'
        ]


class TerapeutaCreateUpdateSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    cabina_id = serializers.PrimaryKeyRelatedField(
        queryset=Cabina.objects.all(),
        source='cabina',
        allow_null=True,
        required=False
    )

    class Meta:
        model = Terapeuta
        fields = [
            'id',
            'usuario',
            'nombre_completo',
            'email',
            'password',
            'especialidad',
            'cabina_id',
            'foto_url',
            'activo'
        ]
        read_only_fields = ['id', 'usuario']

    def create(self, validated_data):
        nombre_completo = validated_data.pop('nombre_completo', 'Terapeuta')
        email = validated_data.pop('email', f"terapeuta_{Terapeuta.objects.count() + 1}@sumaqspa.pe")
        password = validated_data.pop('password', 'Sumaq2026!')

        user = User.objects.create(
            email=email,
            nombre_completo=nombre_completo,
            rol=User.Roles.TERAPEUTA,
            activo=True
        )
        user.set_password(password)
        user.save()

        terapeuta = Terapeuta.objects.create(usuario=user, **validated_data)
        return terapeuta

    def update(self, instance, validated_data):
        nombre_completo = validated_data.pop('nombre_completo', None)
        email = validated_data.pop('email', None)

        if nombre_completo:
            instance.usuario.nombre_completo = nombre_completo
        if email:
            instance.usuario.email = email
        instance.usuario.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
