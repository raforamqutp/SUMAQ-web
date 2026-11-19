import pytest
from rest_framework.test import APIClient
from apps.ti.models import Ticket, MonitoringEvent

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


# =========================================================================
# PRUEBAS UNITARIAS SEMANA 11: CONTROL DE CAMBIOS & COMITÉ CAB (ITIL v4)
# =========================================================================

@pytest.mark.django_db
def test_crear_solicitud_cambio_rfc_infraestructura():
    """Valida la creación de un RFC de Infraestructura (Switch/VLANs) con Matriz de Riesgo."""
    client = APIClient()
    payload = {
        "tipo": "SOLICITUD_CAMBIO",
        "prioridad": "P2_ALTA",
        "modulo": "Redes & Hardware",
        "area_cambio": "INFRAESTRUCTURA",
        "tipo_cambio": "NORMAL",
        "impacto_riesgo": "ALTO",
        "asunto": "Reemplazo de Switch Administrable 24p",
        "descripcion": "Segmentación VLAN 10 (POS), VLAN 20 (Cabinas), VLAN 30 (Invitados)",
        "ventana_mantenimiento": "Martes 02:00 AM - 04:00 AM",
        "plan_rollback": "Reconexión de cables a switch anterior en menos de 10 minutos",
        "solicitante_nombre": "Bryan Mango",
        "solicitante_email": "bryan.mango@sumaqspa.pe",
        "solicitante_rol": "ADMIN"
    }
    response = client.post('/api/ti/tickets/', payload, format='json')
    assert response.status_code == 201
    data = response.json()
    assert data['codigo'].startswith('RFC-')
    assert data['areaCambio'] == 'INFRAESTRUCTURA'
    assert data['tipoCambio'] == 'NORMAL'
    assert data['impactoRiesgo'] == 'ALTO'
    assert data['estado'] == 'PENDIENTE_APROBACION'


@pytest.mark.django_db
def test_aprobacion_formal_comite_cab_rene_nieto():
    """Valida el flujo de dictamen y aprobación formal del Comité CAB por el docente evaluador."""
    client = APIClient()
    rfc = Ticket.objects.create(
        codigo="RFC-2026-TEST-CAB",
        tipo=Ticket.Tipo.SOLICITUD_CAMBIO,
        prioridad=Ticket.Prioridad.P2_ALTA,
        asunto="Despliegue Pasarela de Pagos Niubiz",
        descripcion="Integración con nodo MySQL Slave 3309",
        area_cambio=Ticket.AreaCambio.APLICACIONES,
        tipo_cambio=Ticket.TipoCambio.NORMAL,
        impacto_riesgo=Ticket.ImpactoRiesgo.MEDIO,
        estado=Ticket.Estado.PENDIENTE_APROBACION
    )

    cab_chair = "MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)"
    acta_num = "ACTA-CAB-2026-W11-TEST"

    res = client.post(f'/api/ti/tickets/{rfc.codigo}/cab-aprobar/', {
        "cab_aprobador": cab_chair,
        "cab_acta": acta_num
    }, format='json')
    assert res.status_code == 200

    rfc.refresh_from_db()
    assert rfc.estado == Ticket.Estado.APROBADO
    assert rfc.cab_aprobado_por == cab_chair
    assert rfc.cab_acta_numero == acta_num
    assert rfc.cab_fecha_aprobacion is not None


@pytest.mark.django_db
def test_telemetria_salud_monitoreo_ti():
    client = APIClient()
    res = client.get('/api/ti/monitoring/health/')
    assert res.status_code == 200
    data = res.json()
    assert 'servicios' in data
    assert 'database' in data['servicios']
    assert 'memory' in data['servicios']
    assert 'disk' in data['servicios']
    assert 'cache_api' in data['servicios']
    assert data['servicios']['database']['online'] is True
    assert len(data['politicas_monitoreo']) >= 5


@pytest.mark.django_db
def test_evaluacion_evento_warning_no_genera_incidente():
    client = APIClient()
    payload = {
        "componente": "HOST_SISTEMA",
        "metrica": "Consumo de Memoria RAM",
        "valor_numerico": 78.5,
        "unidad": "%",
        "proceso_negocio": "Administración y Reportes",
        "descripcion": "Uso de memoria en banda de advertencia"
    }
    res = client.post('/api/ti/monitoring/evaluar/', payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['success'] is True
    assert data['evento']['nivel'] == 'WARNING'
    assert data['evento']['genera_incidente'] is False
    assert data['evento']['prioridad_asignada'] == 'N/A'
    assert data['ticket_generado'] is None


@pytest.mark.django_db
def test_evaluacion_evento_critico_genera_ticket_incidente_p1():
    client = APIClient()
    payload = {
        "componente": "MYSQL_MASTER",
        "metrica": "Uso de CPU del Servidor",
        "valor_numerico": 97.2,
        "unidad": "%",
        "proceso_negocio": "Agendamiento y Cobranza POS",
        "descripcion": "Saturación crítica en nodo maestro 3308"
    }
    res = client.post('/api/ti/monitoring/evaluar/', payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['success'] is True
    assert data['evento']['nivel'] == 'CRITICAL'
    assert data['evento']['genera_incidente'] is True
    assert data['evento']['prioridad_asignada'] == 'P1_CRITICA'
    assert data['ticket_generado'] is not None
    assert data['ticket_generado']['codigo'].startswith('INC-')
    assert data['ticket_generado']['prioridad'] == 'P1_CRITICA'
    assert data['evento']['ticket_codigo'] == data['ticket_generado']['codigo']


@pytest.mark.django_db
def test_mitigar_evento_monitoreo():
    client = APIClient()
    ev = MonitoringEvent.objects.create(
        codigo="EVT-2026-TEST",
        nivel=MonitoringEvent.Nivel.WARNING,
        componente=MonitoringEvent.Componente.REDIS_CACHE,
        metrica="Consumo de Memoria RAM",
        valor_registrado="81.0%",
        valor_numerico=81.0,
        descripcion="Prueba de mitigación",
        estado=MonitoringEvent.Estado.ACTIVO
    )
    res = client.post(f'/api/ti/monitoring/{ev.id}/mitigar/', {
        "estado": "MITIGADO",
        "accion_respuesta": "Caché liberado exitosamente"
    }, format='json')
    assert res.status_code == 200
    ev.refresh_from_db()
    assert ev.estado == MonitoringEvent.Estado.MITIGADO
    assert "liberado" in ev.accion_respuesta

