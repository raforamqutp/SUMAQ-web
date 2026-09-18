import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.cabins.models import Cabina
from apps.therapists.models import Terapeuta
from apps.services.models import Servicio
from apps.marketing.models import Promocion
from apps.appointments.models import Cita
from apps.clients.models import Cliente


@pytest.fixture
def setup_appointment_resources(db):
    u_admin = User.objects.create_superuser(
        email='admin@sumaqspa.pe',
        password='AdminSumaq2026!',
        nombre_completo='Admin Test'
    )
    u_tera = User.objects.create_user(
        email='elena@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Elena Morales',
        rol=User.Roles.TERAPEUTA
    )
    cabina = Cabina.objects.create(
        id=1,
        nombre='Cabina 1',
        tipo='Holística',
        descripcion='Cabina Holística'
    )
    terapeuta = Terapeuta.objects.create(
        id=1,
        usuario=u_tera,
        cabina=cabina,
        especialidad='Masajes'
    )
    servicio = Servicio.objects.create(
        id=1,
        nombre='Masaje Relajante',
        precio_publico=Decimal('120.00'),
        duracion_min=60
    )
    promo = Promocion.objects.create(
        titulo='Bienvenida',
        codigo_cupon='SUMAQBIENVENIDA',
        porcentaje_descuento=Decimal('20.00'),
        fecha_inicio=date(2026, 1, 1),
        fecha_fin=date(2026, 12, 31)
    )
    return {
        'admin': u_admin,
        'terapeuta': terapeuta,
        'cabina': cabina,
        'servicio': servicio,
        'promo': promo
    }


@pytest.mark.django_db
def test_reserva_web_successful(setup_appointment_resources):
    client = APIClient()
    target_date = (timezone.localdate() + timedelta(days=2)).isoformat()

    response = client.post('/api/citas/reservar-web/', {
        'dni': '78901234',
        'nombre_completo': 'Cliente Reserva Test',
        'telefono': '987654321',
        'email': 'cliente@test.com',
        'servicio_id': 1,
        'terapeuta_id': 1,
        'cabina_id': 1,
        'fecha': target_date,
        'hora_inicio': '09:00:00',
        'metodo_pago': 'EFECTIVO',
        'codigo_cupon': 'SUMAQBIENVENIDA'
    })

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['success'] is True
    assert response.data['data']['subtotal'] == '120.00'
    assert response.data['data']['descuento'] == '24.00'
    assert response.data['data']['monto_total'] == '96.00'
    assert response.data['data']['codigo_reserva'].startswith('SQ-')


@pytest.mark.django_db
def test_reserva_web_dni_rule_same_day_rejected(setup_appointment_resources):
    client = APIClient()
    target_date = (timezone.localdate() + timedelta(days=3)).isoformat()

    # Primera reserva
    res1 = client.post('/api/citas/reservar-web/', {
        'dni': '78901234',
        'nombre_completo': 'Cliente Doble Test',
        'telefono': '987654321',
        'servicio_id': 1,
        'terapeuta_id': 1,
        'cabina_id': 1,
        'fecha': target_date,
        'hora_inicio': '09:00:00'
    })
    assert res1.status_code == status.HTTP_201_CREATED

    # Segunda reserva con el mismo DNI en la misma fecha
    res2 = client.post('/api/citas/reservar-web/', {
        'dni': '78901234',
        'nombre_completo': 'Cliente Doble Test',
        'telefono': '987654321',
        'servicio_id': 1,
        'terapeuta_id': 1,
        'cabina_id': 1,
        'fecha': target_date,
        'hora_inicio': '11:00:00'
    })
    assert res2.status_code == status.HTTP_400_BAD_REQUEST
    assert res2.data['error']['code'] == 'CLIENT_HAS_APPOINTMENT_SAME_DAY'


@pytest.mark.django_db
def test_consultar_y_cancelar_cita_web_24h_rule(setup_appointment_resources):
    client = APIClient()
    target_date = (timezone.localdate() + timedelta(days=5)).isoformat()

    res = client.post('/api/citas/reservar-web/', {
        'dni': '78905555',
        'nombre_completo': 'Cliente Cancelar Test',
        'telefono': '987654321',
        'servicio_id': 1,
        'terapeuta_id': 1,
        'cabina_id': 1,
        'fecha': target_date,
        'hora_inicio': '10:00:00'
    })
    codigo = res.data['data']['codigo_reserva']

    # Consultar cita
    res_consultar = client.post('/api/citas/consultar/', {
        'codigo_reserva': codigo,
        'dni': '78905555'
    })
    assert res_consultar.status_code == status.HTTP_200_OK
    assert res_consultar.data['data']['puede_modificar'] is True

    # Cancelar cita
    res_cancelar = client.post('/api/citas/cancelar-web/', {
        'codigo_reserva': codigo,
        'dni': '78905555',
        'motivo': 'Prueba de cancelación'
    })
    assert res_cancelar.status_code == status.HTTP_200_OK
    assert res_cancelar.data['data']['estado'] == 'CANCELADA'
