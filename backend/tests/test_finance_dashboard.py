import pytest
from decimal import Decimal
from datetime import date, time
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.cabins.models import Cabina
from apps.therapists.models import Terapeuta
from apps.services.models import Servicio
from apps.clients.models import Cliente
from apps.appointments.models import Cita


@pytest.fixture
def setup_finance_data(db):
    admin = User.objects.create_superuser(
        email='admin@sumaqspa.pe',
        password='AdminSumaq2026!',
        nombre_completo='Admin Finance'
    )
    u_tera = User.objects.create_user(
        email='elena@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Elena Morales',
        rol=User.Roles.TERAPEUTA
    )
    cabina = Cabina.objects.create(nombre='Cabina Fin', tipo='Holística')
    tera = Terapeuta.objects.create(usuario=u_tera, cabina=cabina, especialidad='Holística')
    serv = Servicio.objects.create(nombre='Servicio Fin', precio_publico=Decimal('150.00'), duracion_min=60)
    cliente = Cliente.objects.create(dni='77778888', nombre_completo='Cliente Fin', telefono='999999999')

    Cita.objects.create(
        codigo_reserva='SQ-FIN-01',
        cliente=cliente,
        servicio=serv,
        terapeuta=tera,
        cabina=cabina,
        fecha=date.today(),
        hora_inicio=time(9, 0),
        hora_fin=time(10, 0),
        estado=Cita.Estados.ATENDIDA,
        subtotal=Decimal('150.00'),
        monto_total=Decimal('150.00')
    )

    return admin


@pytest.mark.django_db
def test_financial_analytics_dashboard(setup_finance_data):
    admin = setup_finance_data
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.get('/api/admin/dashboard/')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['success'] is True
    assert 'resumen_financiero' in response.data['data']
    assert 'tendencia_7_dias' in response.data['data']
    assert response.data['data']['resumen_financiero']['ingresos_totales'] >= 150.0


@pytest.mark.django_db
def test_admin_reportes_therapist_breakdown(setup_finance_data):
    admin = setup_finance_data
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.get('/api/admin/reportes/')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['success'] is True
    assert 'desglose_terapeutas' in response.data['data']
    assert len(response.data['data']['desglose_terapeutas']) >= 1
