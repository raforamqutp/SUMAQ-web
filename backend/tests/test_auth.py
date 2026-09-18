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
