import pytest
from datetime import date, time, timedelta
from decimal import Decimal
import threading
from django.db import connection
from apps.accounts.models import User
from apps.cabins.models import Cabina
from apps.therapists.models import Terapeuta
from apps.services.models import Servicio
from apps.appointments.services import ReservaService
from apps.appointments.models import Cita
from apps.common.exceptions import ResourceConflictError, BusinessLogicError


@pytest.mark.django_db(transaction=True)
def test_concurrency_anti_double_booking():
    """
    Simula 2 hilos concurrentes intentando reservar exactamente la misma cabina y terapeuta
    en el mismo turno horario. Gracias a select_for_update(), exactamente 1 debe ganar y 1 fallar.
    """
    u_tera = User.objects.create_user(
        email='tera.concurrente@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Terapeuta Concurrente',
        rol=User.Roles.TERAPEUTA
    )
    cabina = Cabina.objects.create(
        nombre='Cabina Concurrente',
        tipo='Holística'
    )
    terapeuta = Terapeuta.objects.create(
        usuario=u_tera,
        cabina=cabina,
        especialidad='Holística'
    )
    servicio = Servicio.objects.create(
        nombre='Masaje Concurrente',
        precio_publico=Decimal('100.00'),
        duracion_min=60
    )

    fecha_test = date.today() + timedelta(days=10)
    hora_test = time(9, 0)

    results = []
    errors = []

    def book_task(dni, nombre):
        # Cada hilo abre su propia conexión
        django_conn = connection
        try:
            cita = ReservaService.crear_reserva_web({
                'dni': dni,
                'nombre_completo': nombre,
                'telefono': '999999999',
                'servicio_id': servicio.id,
                'terapeuta_id': terapeuta.id,
                'cabina_id': cabina.id,
                'fecha': fecha_test,
                'hora_inicio': hora_test,
                'metodo_pago': 'EFECTIVO'
            })
            results.append(cita)
        except Exception as exc:
            errors.append(exc)
        finally:
            django_conn.close()

    t1 = threading.Thread(target=book_task, args=('11111111', 'Cliente 1'))
    t2 = threading.Thread(target=book_task, args=('22222222', 'Cliente 2'))

    t1.start()
    t2.start()

    t1.join()
    t2.join()

    # Comprobar que en la base de datos solo existe 1 cita
    total_citas = Cita.objects.filter(
        terapeuta=terapeuta,
        fecha=fecha_test,
        hora_inicio=hora_test
    ).count()

    assert total_citas == 1, f"Se esperaba 1 cita en BD, se encontraron {total_citas}"
    assert len(results) == 1, "Exactamente 1 hilo debió registrar con éxito la reserva."
    assert len(errors) == 1, "Exactamente 1 hilo debió ser rechazado por conflicto de recursos."
