from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio.')
        email = self.normalize_email(email)
        extra_fields.setdefault('activo', True)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('rol', User.Roles.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('activo', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        RECEPCIONISTA = 'RECEPCIONISTA', 'Recepcionista'
        TERAPEUTA = 'TERAPEUTA', 'Terapeuta'

    email = models.EmailField('Correo Electrónico', unique=True, db_index=True)
    nombre_completo = models.CharField('Nombre Completo', max_length=200)
    rol = models.CharField(
        'Rol',
        max_length=20,
        choices=Roles.choices,
        default=Roles.TERAPEUTA
    )
    activo = models.BooleanField('Activo', default=True)
    is_staff = models.BooleanField('Es Staff', default=False)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre_completo']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre_completo} ({self.email}) - {self.rol}"

    @property
    def is_active(self):
        return self.activo
