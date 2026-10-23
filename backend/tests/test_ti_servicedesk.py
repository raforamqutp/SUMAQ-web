import pytest
from rest_framework.test import APIClient
from apps.ti.models import Ticket

@pytest.mark.django_db
def test_crear_ticket_servicedesk_itil():
    client = APIClient()
    payload = {
        "tipo": "INCIDENCIA",
        "prioridad": "P1_CRITICA",
        "modulo": "Punto de Venta / Caja",
        "asunto": "Error en emisión de boleta POS",
        "descripcion": "El botón de impresión no responde al registrar pago en efectivo",
        "solicitante_nombre": "Elena Recepcionista",
        "solicitante_email": "recepcion@sumaqspa.pe",
        "solicitante_rol": "RECEPCIONISTA"
    }
    response = client.post('/api/ti/tickets/', payload, format='json')
    assert response.status_code == 201
    data = response.json()
    assert data['codigo'].startswith('INC-')
    assert data['sla_horas'] == 2  # P1 Crítica tiene SLA de 2 horas
    assert data['estado'] == 'ABIERTO'


@pytest.mark.django_db
def test_flujo_aprobacion_gerencia_solicitud_acceso():
    client = APIClient()
    # 1. Crear solicitud de acceso
    payload = {
        "tipo": "SOLICITUD_ACCESO",
        "prioridad": "P2_ALTA",
        "modulo": "Usuarios & Roles",
        "asunto": "Alta de usuario para terapeuta Sofia Vargas",
        "descripcion": "Asignación de rol TERAPEUTA y acceso a cabina 2",
        "solicitante_nombre": "Recepcionista Turno Tarde",
        "solicitante_email": "recepcion@sumaqspa.pe",
        "solicitante_rol": "RECEPCIONISTA"
    }
    response = client.post('/api/ti/tickets/', payload, format='json')
    assert response.status_code == 201
    ticket_id = response.json()['codigo']
    
    # 2. Verificar que entra en estado PENDIENTE_APROBACION por principio ITIL
    ticket = Ticket.objects.get(codigo=ticket_id)
    assert ticket.estado == Ticket.Estado.PENDIENTE_APROBACION
    assert not ticket.aprobado_por_gerencia

    # 3. Gerente General emite la aprobación formal
    approve_res = client.post(f'/api/ti/tickets/{ticket_id}/aprobar/', {
        "aprobador_nombre": "Lic. Rafael Ramirez (Gerente General)"
    }, format='json')
    assert approve_res.status_code == 200
    
    ticket.refresh_from_db()
    assert ticket.estado == Ticket.Estado.APROBADO
    assert ticket.aprobado_por_gerencia
    assert "Gerente General" in ticket.aprobador_nombre


@pytest.mark.django_db
def test_resolver_ticket_soporte_tecnico():
    client = APIClient()
    ticket = Ticket.objects.create(
        codigo="REQ-2026-TEST",
        tipo=Ticket.Tipo.SOLICITUD_SERVICIO,
        prioridad=Ticket.Prioridad.P3_MEDIA,
        asunto="Revisión de stock en Kárdex",
        descripcion="Verificación de saldos físicos",
        sla_horas=24
    )
    
    res = client.patch(f'/api/ti/tickets/{ticket.codigo}/resolver/', {
        "resolucion_tecnica": "Ajuste físico de 10 unidades registrado en MySQL Master",
        "asignado_a": "Ing. Anthony Luque - Soporte N2",
        "jira_key": "KAN-10"
    }, format='json')
    assert res.status_code == 200
    
    ticket.refresh_from_db()
    assert ticket.estado == Ticket.Estado.RESUELTO
    assert "Anthony Luque" in ticket.asignado_a
    assert ticket.fecha_resolucion is not None
