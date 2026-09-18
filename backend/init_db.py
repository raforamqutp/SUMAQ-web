import os
import sys
import django
from decimal import Decimal
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from django.db import connection
from apps.accounts.models import User
from apps.cabins.models import Cabina
from apps.therapists.models import Terapeuta
from apps.inventory.models import Producto, MovimientoInventario
from apps.services.models import Servicio, RecetaServicio
from apps.marketing.models import Promocion
from apps.clients.models import Cliente
from apps.appointments.models import Cita
from apps.attention.models import FichaAtencion
from apps.finance.models import MovimientoCaja


def init_database():
    print("==================================================")
    print("  INICIALIZADOR DE BASE DE DATOS - SUMAQ SPA")
    print("==================================================")

    print("\n1. Aplicando migraciones de Django...")
    try:
        call_command('makemigrations', 'accounts', 'clients', 'cabins', 'therapists', 'services', 'inventory', 'marketing', 'appointments', 'attention', 'finance', interactive=False)
        call_command('migrate', interactive=False)
        print("-> Migraciones aplicadas con éxito.")
    except Exception as e:
        print(f"Error aplicando migraciones: {e}")
        return

    print("\n2. Verificando y cargando datos semilla...")
    if User.objects.count() == 0:
        print("-> Creando usuarios...")
        admin_user = User.objects.create_superuser(
            email='admin@sumaqspa.pe',
            password='AdminSumaq2026!',
            nombre_completo='Administrador General Sumaq'
        )
        recepcion_user = User.objects.create_user(
            email='recepcion@sumaqspa.pe',
            password='Sumaq2026!',
            nombre_completo='Valeria Quispe',
            rol=User.Roles.RECEPCIONISTA
        )
        u_elena = User.objects.create_user(
            email='elena.morales@sumaqspa.pe',
            password='Sumaq2026!',
            nombre_completo='Elena Morales',
            rol=User.Roles.TERAPEUTA
        )
        u_camila = User.objects.create_user(
            email='camila.vega@sumaqspa.pe',
            password='Sumaq2026!',
            nombre_completo='Camila Vega',
            rol=User.Roles.TERAPEUTA
        )
        u_lucia = User.objects.create_user(
            email='lucia.ramos@sumaqspa.pe',
            password='Sumaq2026!',
            nombre_completo='Lucía Ramos',
            rol=User.Roles.TERAPEUTA
        )

        print("-> Creando cabinas...")
        c1 = Cabina.objects.create(id=1, nombre='Cabina 1', tipo='Holística', descripcion='Masajes relajantes y terapéuticos con aromaterapia y música binaural.')
        c2 = Cabina.objects.create(id=2, nombre='Cabina 2', tipo='Dermoestética', descripcion='Tratamientos y limpiezas faciales profundas con aparatología avanzada.')
        c3 = Cabina.objects.create(id=3, nombre='Cabina 3', tipo='Hidroterapia', descripcion='Envolturas corporales, exfoliaciones y sales de baño minerales relajantes.')

        print("-> Creando terapeutas...")
        t1 = Terapeuta.objects.create(id=1, usuario=u_elena, cabina=c1, especialidad='Terapias Holísticas y Masajes Descontracturantes', foto_url='https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600')
        t2 = Terapeuta.objects.create(id=2, usuario=u_camila, cabina=c2, especialidad='Dermoestética y Cosmiatría Facial Avanzada', foto_url='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600')
        t3 = Terapeuta.objects.create(id=3, usuario=u_lucia, cabina=c3, especialidad='Hidroterapia, Exfoliaciones y Rituales Corporales', foto_url='https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600')

        print("-> Creando insumos...")
        p1 = Producto.objects.create(id=1, nombre='Aceite Esencial de Lavanda', descripcion='Aceite botánico 100% puro para masajes relajantes y aromaterapia.', costo_unitario=Decimal('18.00'), stock_actual=Decimal('28.00'), stock_minimo_alerta=Decimal('5.00'), unidad_medida='frascos (100ml)')
        p2 = Producto.objects.create(id=2, nombre='Crema Hidratante Dermo Facial', descripcion='Fórmula hidratante con ácido hialurónico para todo tipo de piel.', costo_unitario=Decimal('22.50'), stock_actual=Decimal('24.00'), stock_minimo_alerta=Decimal('5.00'), unidad_medida='potes (250gr)')
        p3 = Producto.objects.create(id=3, nombre='Exfoliante Corporal Botánico', descripcion='Exfoliante de microgránulos de albaricoque y sales del mar muerto.', costo_unitario=Decimal('25.00'), stock_actual=Decimal('4.00'), stock_minimo_alerta=Decimal('5.00'), unidad_medida='frascos (300gr)')
        p4 = Producto.objects.create(id=4, nombre='Mascarilla Facial Revitalizante', descripcion='Mascarilla con colágeno y vitamina C en sobres individuales.', costo_unitario=Decimal('15.00'), stock_actual=Decimal('2.00'), stock_minimo_alerta=Decimal('5.00'), unidad_medida='sobres')
        p5 = Producto.objects.create(id=5, nombre='Sales de Baño Minerales', descripcion='Sales minerales aromatizadas con eucalipto para hidroterapia.', costo_unitario=Decimal('12.00'), stock_actual=Decimal('32.00'), stock_minimo_alerta=Decimal('5.00'), unidad_medida='bolsas (500gr)')

        print("-> Creando servicios y recetas BOM...")
        s1 = Servicio.objects.create(id=1, nombre='Masaje Relajante', descripcion='Masaje corporal antiestrés con aceites esenciales botánicos y técnicas de relajación profunda.', precio_publico=Decimal('120.00'), duracion_min=60, imagen_url='https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800')
        s2 = Servicio.objects.create(id=2, nombre='Limpieza Facial Profunda', descripcion='Tratamiento dermoestético con exfoliación, vapor de ozono, extracción y mascarilla revitalizante.', precio_publico=Decimal('150.00'), duracion_min=60, imagen_url='https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800')
        s3 = Servicio.objects.create(id=3, nombre='Envoltura Corporal & Hidroterapia', descripcion='Inmersión relajante con sales marinas aromáticas y envoltura desintoxicante con exfoliación corporal.', precio_publico=Decimal('180.00'), duracion_min=60, imagen_url='https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800')

        RecetaServicio.objects.create(servicio=s1, producto=p1, cantidad_requerida=Decimal('1.00'))
        RecetaServicio.objects.create(servicio=s1, producto=p2, cantidad_requerida=Decimal('1.00'))
        RecetaServicio.objects.create(servicio=s2, producto=p4, cantidad_requerida=Decimal('1.00'))
        RecetaServicio.objects.create(servicio=s2, producto=p2, cantidad_requerida=Decimal('1.00'))
        RecetaServicio.objects.create(servicio=s3, producto=p3, cantidad_requerida=Decimal('1.00'))
        RecetaServicio.objects.create(servicio=s3, producto=p5, cantidad_requerida=Decimal('1.00'))

        print("-> Creando promociones...")
        Promocion.objects.create(id=1, titulo='Bienvenida Sumaq Spa', descripcion='20% de descuento en tu primera reserva online.', codigo_cupon='SUMAQBIENVENIDA', porcentaje_descuento=Decimal('20.00'), fecha_inicio=date(2026, 1, 1), fecha_fin=date(2026, 12, 31))
        Promocion.objects.create(id=2, titulo='Día de Relajación', descripcion='15% de descuento en todos nuestros tratamientos y masajes.', codigo_cupon='RELAXDAY', porcentaje_descuento=Decimal('15.00'), fecha_inicio=date(2026, 1, 1), fecha_fin=date(2026, 12, 31))

        print("-> Creando clientes de prueba...")
        Cliente.objects.create(id=1, dni='72345678', nombre_completo='María García Ramos', telefono='987654321', email='maria.garcia@gmail.com')
        Cliente.objects.create(id=2, dni='45678901', nombre_completo='Carlos Mendoza Silva', telefono='912345678', email='carlos.mendoza@hotmail.com')
        Cliente.objects.create(id=3, dni='70987654', nombre_completo='Ana Lucía Torres', telefono='998877665', email='ana.torres@outlook.com')

        print("-> Datos semilla cargados con éxito.")
    else:
        print("-> La base de datos ya contiene registros. No se requirió carga inicial.")

    print("\n==================================================")
    print("  INICIALIZACIÓN COMPLETADA CON ÉXITO")
    print("==================================================")


if __name__ == '__main__':
    init_database()
