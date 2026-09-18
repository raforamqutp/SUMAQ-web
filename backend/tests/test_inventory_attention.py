import pytest
from decimal import Decimal
from datetime import date, time
from apps.accounts.models import User
from apps.cabins.models import Cabina
from apps.therapists.models import Terapeuta
from apps.services.models import Servicio, RecetaServicio
from apps.inventory.models import Producto, MovimientoInventario
from apps.clients.models import Cliente
from apps.appointments.models import Cita
from apps.attention.services import AtencionService
from apps.common.exceptions import InsufficientStockError


@pytest.fixture
def setup_inventory_test(db):
    u_tera = User.objects.create_user(
        email='tera.inv@sumaqspa.pe',
        password='Sumaq2026!',
        nombre_completo='Terapeuta Inv',
        rol=User.Roles.TERAPEUTA
    )
    cabina = Cabina.objects.create(nombre='Cabina Inv', tipo='Holística')
    terapeuta = Terapeuta.objects.create(usuario=u_tera, cabina=cabina, especialidad='Masajes')
    prod = Producto.objects.create(
        nombre='Aceite Test',
        costo_unitario=Decimal('15.00'),
        stock_actual=Decimal('10.00'),
        stock_minimo_alerta=Decimal('2.00')
    )
    servicio = Servicio.objects.create(
        nombre='Servicio Inv',
        precio_publico=Decimal('100.00'),
        duracion_min=60
    )
    RecetaServicio.objects.create(
        servicio=servicio,
        producto=prod,
        cantidad_requerida=Decimal('2.00')
    )
    cliente = Cliente.objects.create(
        dni='12345678',
        nombre_completo='Cliente Inv',
        telefono='999999999'
    )
    cita = Cita.objects.create(
        codigo_reserva='SQ-TEST-INV-01',
        cliente=cliente,
        servicio=servicio,
        terapeuta=terapeuta,
        cabina=cabina,
        fecha=date.today(),
        hora_inicio=time(9, 0),
        hora_fin=time(10, 0),
        subtotal=Decimal('100.00'),
        monto_total=Decimal('100.00')
    )
    return {
        'cita': cita,
        'producto': prod,
        'servicio': servicio
    }


@pytest.mark.django_db
def test_completar_cita_consumes_inventory(setup_inventory_test):
    cita = setup_inventory_test['cita']
    prod = setup_inventory_test['producto']

    assert prod.stock_actual == Decimal('10.00')

    cita_atendida = AtencionService.completar_cita(cita)

    assert cita_atendida.estado == Cita.Estados.ATENDIDA

    prod.refresh_from_db()
    assert prod.stock_actual == Decimal('8.00')

    mov = MovimientoInventario.objects.filter(producto=prod).first()
    assert mov is not None
    assert mov.tipo == MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO
    assert mov.cantidad == Decimal('2.00')


@pytest.mark.django_db
def test_completar_cita_insufficient_stock_rollback(setup_inventory_test):
    cita = setup_inventory_test['cita']
    prod = setup_inventory_test['producto']

    # Forzar stock a 1.0 (cuando la receta requiere 2.0)
    prod.stock_actual = Decimal('1.00')
    prod.save()

    with pytest.raises(InsufficientStockError):
        AtencionService.completar_cita(cita)

    # Comprobar que la cita sigue en PENDIENTE y el stock no varió
    cita.refresh_from_db()
    prod.refresh_from_db()

    assert cita.estado == Cita.Estados.PENDIENTE
    assert prod.stock_actual == Decimal('1.00')
