from django.db import models


class Cliente(models.Model):
    dni = models.CharField('DNI / Documento', max_length=20, unique=True, db_index=True)
    nombre_completo = models.CharField('Nombre Completo', max_length=200)
    telefono = models.CharField('Teléfono / WhatsApp', max_length=50)
    email = models.EmailField('Correo Electrónico', blank=True, null=True)
    activo = models.BooleanField('Activo', default=True)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        db_table = 'clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['nombre_completo']

    def __str__(self):
        return f"{self.nombre_completo} (DNI: {self.dni})"
