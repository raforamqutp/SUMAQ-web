import pytest
from rest_framework.test import APIClient
from rest_framework import status


@pytest.mark.django_db
def test_health_check_endpoint():
    client = APIClient()
    response = client.get('/api/health/')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['status'] == 'healthy'
    assert response.data['database'] == 'healthy'
    assert 'database_latency_ms' in response.data
    assert response.data['database_latency_ms'] >= 0.0
