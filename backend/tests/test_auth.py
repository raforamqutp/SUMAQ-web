import pytest
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User


@pytest.mark.django_db
def test_login_successful_admin():
    user = User.objects.create_user(
        email='admin@sumaqspa.pe',
        password='AdminSumaq2026!',
        nombre_completo='Admin Test',
        rol=User.Roles.ADMIN
    )
    client = APIClient()
    response = client.post('/api/auth/login/', {
        'email': 'admin@sumaqspa.pe',
        'password': 'AdminSumaq2026!'
    })

    assert response.status_code == status.HTTP_200_OK
    assert response.data['success'] is True
    assert 'access' in response.data['data']
    assert 'refresh' in response.data['data']
    assert response.data['data']['user']['rol'] == 'ADMIN'


@pytest.mark.django_db
def test_login_invalid_password():
    User.objects.create_user(
        email='admin@sumaqspa.pe',
        password='AdminSumaq2026!',
        nombre_completo='Admin Test'
    )
    client = APIClient()
    response = client.post('/api/auth/login/', {
        'email': 'admin@sumaqspa.pe',
        'password': 'WrongPassword123'
    })

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['success'] is False


@pytest.mark.django_db
def test_login_inactive_user_rejected():
    User.objects.create_user(
        email='inactivo@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Usuario Inactivo',
        activo=False
    )
    client = APIClient()
    response = client.post('/api/auth/login/', {
        'email': 'inactivo@sumaqspa.pe',
        'password': 'Sumaq2026!'
    })

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['success'] is False


@pytest.mark.django_db
def test_account_lockout_after_five_failed_attempts():
    from django.core.cache import cache
    cache.clear()

    User.objects.create_user(
        email='bloqueo.test@sumaqspa.pe',
        password='Password2026!',
        nombre_completo='Usuario Bloqueo'
    )
    client = APIClient()

    # Primeros 4 intentos fallidos: avisa intentos restantes
    for i in range(1, 5):
        resp = client.post('/api/auth/login/', {
            'email': 'bloqueo.test@sumaqspa.pe',
            'password': f'ClaveErronea{i}'
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'le quedan' in resp.data['error']['message'].lower()

    # 5to intento fallido: Bloquea la cuenta
    resp_5 = client.post('/api/auth/login/', {
        'email': 'bloqueo.test@sumaqspa.pe',
        'password': 'ClaveErronea5'
    })
    assert resp_5.status_code == status.HTTP_400_BAD_REQUEST
    assert 'bloqueada temporalmente' in resp_5.data['error']['message'].lower()

    # 6to intento (incluso con la contraseña correcta): Rechaza por estar bloqueada
    resp_bloqueado = client.post('/api/auth/login/', {
        'email': 'bloqueo.test@sumaqspa.pe',
        'password': 'Password2026!'
    })
    assert resp_bloqueado.status_code == status.HTTP_400_BAD_REQUEST
    assert 'bloqueada temporalmente' in resp_bloqueado.data['error']['message'].lower()
