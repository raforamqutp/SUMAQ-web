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
def setup_rbac_users(db):
    u_admin = User.objects.create_superuser(
        email='admin.sec@sumaqspa.pe',
        password='AdminSumaq2026!',
        nombre_completo='Admin Security'
    )
    u_tera1 = User.objects.create_user(
        email='elena.sec@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Elena Sec',
        rol=User.Roles.TERAPEUTA
    )
    u_tera2 = User.objects.create_user(
        email='camila.sec@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Camila Sec',
        rol=User.Roles.TERAPEUTA
    )

    c1 = Cabina.objects.create(nombre='Cabina Sec 1', tipo='Holística')
    c2 = Cabina.objects.create(nombre='Cabina Sec 2', tipo='Dermo')

    t1 = Terapeuta.objects.create(usuario=u_tera1, cabina=c1, especialidad='Holística')
    t2 = Terapeuta.objects.create(usuario=u_tera2, cabina=c2, especialidad='Dermo')

    serv = Servicio.objects.create(nombre='Servicio Sec', precio_publico=Decimal('100.00'), duracion_min=60)
    cliente = Cliente.objects.create(dni='66778899', nombre_completo='Cliente Sec', telefono='999999999')

    cita_t1 = Cita.objects.create(
        codigo_reserva='SQ-SEC-T1',
        cliente=cliente,
        servicio=serv,
        terapeuta=t1,
        cabina=c1,
        fecha=date.today(),
        hora_inicio=time(9, 0),
        hora_fin=time(10, 0),
        subtotal=Decimal('100.00'),
        monto_total=Decimal('100.00')
    )

    return {
        'admin': u_admin,
        'tera1_user': u_tera1,
        'tera2_user': u_tera2,
        'cita_t1': cita_t1
    }


@pytest.mark.django_db
def test_therapist_cannot_access_admin_dashboard(setup_rbac_users):
    tera_user = setup_rbac_users['tera1_user']
    client = APIClient()
    client.force_authenticate(user=tera_user)

    response = client.get('/api/admin/dashboard/')

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_unauthenticated_cannot_access_therapist_agenda():
    client = APIClient()
    response = client.get('/api/terapeuta/mi-agenda/')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_therapist_cannot_modify_other_therapist_appointment(setup_rbac_users):
    # Terapeuta 2 intentando completar cita asignada a Terapeuta 1 (Anti-IDOR)
    tera2_user = setup_rbac_users['tera2_user']
    cita_t1 = setup_rbac_users['cita_t1']

    client = APIClient()
    client.force_authenticate(user=tera2_user)

    response = client.patch(f'/api/terapeuta/citas/{cita_t1.id}/completar/')

    assert response.status_code == status.HTTP_403_FORBIDDEN
