from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'nombre_completo', 'rol', 'activo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'nombre_completo', 'rol', 'activo']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password('Sumaq2026!')
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

### RIESGO: Autenticación Stateless JWT + Hashing PBKDF2-SHA256
### RIESGO: Consultas preparadas y parametrizadas vía ORM (sin raw SQL)
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError({
                'code': 'INVALID_CREDENTIALS',
                'message': 'Credenciales incorrectas. Verifique su correo y contraseña.'
            })

        if not user.activo:
            raise serializers.ValidationError({
                'code': 'USER_INACTIVE',
                'message': 'La cuenta de usuario se encuentra inactiva. Contacte al administrador.'
            })

        refresh = RefreshToken.for_user(user)

        # Inyectar rol en los claims del token
        refresh['rol'] = user.rol
        refresh['email'] = user.email

        terapeuta_id = None
        if hasattr(user, 'terapeuta') and user.terapeuta:
            terapeuta_id = user.terapeuta.id

        return {
            'user': UserSerializer(user).data,
            'terapeuta_id': terapeuta_id,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
