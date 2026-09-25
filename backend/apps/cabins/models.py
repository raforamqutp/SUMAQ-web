from django.db import models


class Cabina(models.Model):
    nombre = models.CharField('Nombre de Cabina', max_length=100, unique=True)
    tipo = models.CharField('Especialidad / Tipo', max_length=100)
    descripcion = models.TextField('Descripción', blank=True, default='')
    activa = models.BooleanField('Activa', default=True)

    objects = models.Manager()

    class Meta:
        db_table = 'cabinas'
        verbose_name = 'Cabina'
        verbose_name_plural = 'Cabinas'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"
