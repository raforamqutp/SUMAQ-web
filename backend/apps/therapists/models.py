from django.db import models


class Terapeuta(models.Model):
    usuario = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='terapeuta',
        verbose_name='Cuenta de Usuario'
    )
    cabina = models.ForeignKey(
        'cabins.Cabina',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='terapeutas',
        verbose_name='Cabina Habitual'
    )
    especialidad = models.CharField('Especialidad', max_length=150)
    foto_url = models.CharField('URL de Fotografía', max_length=500, blank=True, default='')
    activo = models.BooleanField('Activo', default=True)

    objects = models.Manager()

    class Meta:
        db_table = 'terapeutas'
        verbose_name = 'Terapeuta'
        verbose_name_plural = 'Terapeutas'
        ordering = ['id']

    def __str__(self):
        return f"{self.usuario.nombre_completo} - {self.especialidad}"

    @property
    def nombre_completo(self):
        return self.usuario.nombre_completo

    @property
    def email(self):
        return self.usuario.email
