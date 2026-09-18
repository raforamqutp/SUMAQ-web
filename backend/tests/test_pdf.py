import pytest
from decimal import Decimal
from datetime import date, time
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User
from apps.cabins.models import Cabina
from apps.therapists.models import Terapeuta
from apps.services.models import Servicio
from apps.clients.models import Cliente
from apps.appointments.models import Cita
from apps.common.pdf import generar_comprobante_pdf


@pytest.fixture
def setup_pdf_cita(db):
    u_tera = User.objects.create_user(
        email='tera.pdf@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Terapeuta PDF',
        rol=User.Roles.TERAPEUTA
    )
    cabina = Cabina.objects.create(nombre='Cabina PDF', tipo='Holística')
    tera = Terapeuta.objects.create(usuario=u_tera, cabina=cabina, especialidad='Holística')
    serv = Servicio.objects.create(nombre='Servicio PDF', precio_publico=Decimal('120.00'), duracion_min=60)
    cliente = Cliente.objects.create(dni='99887766', nombre_completo='Cliente PDF', telefono='987654321')

    cita = Cita.objects.create(
        codigo_reserva='SQ-20260426-PDF1',
        cliente=cliente,
        servicio=serv,
        terapeuta=tera,
        cabina=cabina,
        fecha=date.today(),
        hora_inicio=time(10, 0),
        hora_fin=time(11, 0),
        subtotal=Decimal('120.00'),
        monto_total=Decimal('120.00')
    )
    return {'cita': cita, 'user': u_tera}


@pytest.mark.django_db
def test_generar_comprobante_pdf_binary(setup_pdf_cita):
    cita = setup_pdf_cita['cita']
    pdf_bytes = generar_comprobante_pdf(cita)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b'%PDF')


@pytest.mark.django_db
def test_public_pdf_download_by_codigo_reserva(setup_pdf_cita):
    cita = setup_pdf_cita['cita']
    client = APIClient()

    response = client.get(f'/api/citas/comprobante-pdf/{cita.codigo_reserva}/')

    assert response.status_code == status.HTTP_200_OK
    assert response['Content-Type'] == 'application/pdf'
    assert len(response.content) > 1000


@pytest.mark.django_db
def test_query_param_token_pdf_download(setup_pdf_cita):
    cita = setup_pdf_cita['cita']
    user = setup_pdf_cita['user']

    token = str(RefreshToken.for_user(user).access_token)
    client = APIClient()

    response = client.get(f'/api/terapeuta/citas/{cita.id}/pdf/?token={token}')

    assert response.status_code == status.HTTP_200_OK
    assert response['Content-Type'] == 'application/pdf'
