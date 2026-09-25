from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.cache import cache
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

        lockout_key = f"login_lockout_{email}"
        attempts_key = f"login_attempts_{email}"

        # 1. Comprobar si la cuenta está bloqueada temporalmente por intentos fallidos
        if cache.get(lockout_key):
            raise serializers.ValidationError({
                'code': 'ACCOUNT_LOCKED',
                'message': 'Cuenta bloqueada temporalmente por exceso de intentos fallidos. Intente nuevamente en 15 minutos.'
            })

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            # Incrementar contador de intentos fallidos (duración de la ventana: 15 minutos)
            attempts = cache.get(attempts_key, 0) + 1
            if attempts >= 5:
                # Bloquear la cuenta por 15 minutos
                cache.set(lockout_key, True, timeout=15 * 60)
                cache.delete(attempts_key)
                raise serializers.ValidationError({
                    'code': 'ACCOUNT_LOCKED',
                    'message': 'Demasiados intentos fallidos (5 de 5). Su cuenta ha sido bloqueada temporalmente por 15 minutos por seguridad.'
                })
            else:
                cache.set(attempts_key, attempts, timeout=15 * 60)
                restantes = 5 - attempts
                raise serializers.ValidationError({
                    'code': 'INVALID_CREDENTIALS',
                    'message': f'Credenciales incorrectas. Le quedan {restantes} intento(s) antes del bloqueo temporal de 15 minutos.'
                })

        # Si el inicio de sesión es exitoso, resetear intentos fallidos
        cache.delete(attempts_key)
        cache.delete(lockout_key)

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
