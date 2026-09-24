import os
import sys
import re
from decimal import Decimal
from datetime import date, time, timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde backend/ o raíz del repositorio
base_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(base_dir)
load_dotenv(os.path.join(base_dir, '.env'))
load_dotenv(os.path.join(root_dir, '.env'))


def _persist_db_password_to_env(password: str):
    """Guarda DB_PASSWORD en backend/.env para no requerir reingreso."""
    env_file = os.path.join(base_dir, '.env')
    if not os.path.exists(env_file):
        example_file = os.path.join(base_dir, '.env.example')
        content = open(example_file, 'r', encoding='utf-8').read() if os.path.exists(example_file) else ''
    else:
        content = open(env_file, 'r', encoding='utf-8').read()

    if re.search(r'^DB_PASSWORD=.*$', content, re.MULTILINE):
        new_content = re.sub(r'^DB_PASSWORD=.*$', f'DB_PASSWORD={password}', content, flags=re.MULTILINE)
    else:
        new_content = content + f"\nDB_PASSWORD={password}\n"

    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(new_content)


# Paso 0: Verificación y preparación de base de datos
db_engine = os.environ.get('DB_ENGINE', 'mysql').lower()
db_name = os.environ.get('DB_NAME', 'sumaq_spa')
db_user = os.environ.get('DB_USER', 'root')
db_password = os.environ.get('DB_PASSWORD', '')
db_host = os.environ.get('DB_HOST', '127.0.0.1')
db_port = int(os.environ.get('DB_PORT', '3306'))

if db_engine == 'sqlite':
    print(f"[info] Motor SQLite seleccionado (DB_ENGINE=sqlite). Base local lista.")
elif db_engine == 'mysql':
    import pymysql

    def _connect(pwd):
        return pymysql.connect(
            host=db_host,
            user=db_user,
            password=pwd,
            port=db_port,
            charset='utf8mb4'
        )

    conn = None
    try:
        conn = _connect(db_password)
    except pymysql.err.OperationalError as err:
        err_code = err.args[0] if err.args else 0

        # Error 1045: Acceso denegado (requiere contraseña o la contraseña actual es errónea)
        if err_code == 1045:
            if not db_password and sys.stdin and sys.stdin.isatty():
                print(f"[aviso] MySQL en {db_host}:{db_port} requiere contraseña para '{db_user}' (MySQL Workbench / Server).")
                try:
                    import getpass
                    pwd_input = getpass.getpass(f"  -> Ingrese la contraseña de MySQL para '{db_user}': ")
                except Exception:
                    pwd_input = input(f"  -> Ingrese la contraseña de MySQL para '{db_user}': ")

                if pwd_input:
                    try:
                        conn = _connect(pwd_input)
                        db_password = pwd_input
                        os.environ['DB_PASSWORD'] = pwd_input
                        _persist_db_password_to_env(pwd_input)
                        print("[ok] Conexión establecida y guardada en backend/.env.")
                    except Exception as e2:
                        print(f"[error] No se pudo autenticar con la contraseña ingresada: {e2}")

            if not conn:
                print(f"\n[error] Acceso denegado en MySQL para el usuario '{db_user}' ({db_host}:{db_port}).")
                print("  -> Si usas MySQL Workbench o MySQL Server standalone, define tu contraseña en 'backend/.env':")
                print("     DB_PASSWORD=tu_contraseña_aqui")
                print("  -> Si usas XAMPP, asegúrate de que MySQL esté activo en el panel.")
                print("  -> O si prefieres trabajar sin MySQL, configura en 'backend/.env':")
                print("     DB_ENGINE=sqlite\n")
                sys.exit(1)

        # Error 2003 / 10061: Conexión rechazada (MySQL no está corriendo en el puerto)
        elif err_code in (2003, 10061):
            started = False
            import time as time_lib
            # Intentar arranque local si existe XAMPP o servicio Windows
            if os.path.exists(r"C:\xampp\mysql_start.bat"):
                import subprocess
                try:
                    subprocess.Popen([r"C:\xampp\mysql_start.bat"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time_lib.sleep(2)
                    conn = _connect(db_password)
                    started = True
                except Exception:
                    pass
            elif os.path.exists(r"C:\xampp\mysql\bin\mysqld.exe"):
                import subprocess
                try:
                    subprocess.Popen([r"C:\xampp\mysql\bin\mysqld.exe", "--defaults-file=C:\\xampp\\mysql\\bin\\my.ini", "--standalone"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time_lib.sleep(2)
                    conn = _connect(db_password)
                    started = True
                except Exception:
                    pass

            if not started:
                print(f"\n[error] No se detecta un servidor MySQL activo en {db_host}:{db_port}.")
                print("  -> Si usas XAMPP: Inicia el módulo MySQL desde el panel de XAMPP.")
                print("  -> Si usas MySQL Workbench / Servicio de Windows: Inicia el servicio MySQL (ej. 'net start MySQL80').")
                print("  -> Si prefieres trabajar sin MySQL: Configura 'DB_ENGINE=sqlite' en 'backend/.env'.\n")
                sys.exit(1)
        else:
            print(f"[error] Fallo de conexión a MySQL: {err}")
            sys.exit(1)

    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.close()
            print(f"[ok] Base de datos '{db_name}' verificada en MySQL ({db_host}:{db_port}).")
        except Exception as err:
            print(f"[error] No se pudo crear o verificar la base de datos '{db_name}': {err}")
            sys.exit(1)

# Inicializar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.core.management import call_command
from django.utils import timezone
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
    print("Inicializando base de datos sumaq_spa...")

    print("\n1. Aplicando migraciones...")
    try:
        call_command('makemigrations', 'accounts', 'clients', 'cabins', 'therapists', 'services', 'inventory', 'marketing', 'appointments', 'attention', 'finance', interactive=False)
        call_command('migrate', interactive=False)
        print("   Migraciones aplicadas.")
    except Exception as e:
        print(f"[error] Error en migraciones: {e}")
        return

    print("\n2. Cargando catálogos y usuarios iniciales...")

    # 1. Usuarios
    admin_user, _ = User.objects.get_or_create(
        email='admin@sumaqspa.pe',
        defaults={
            'nombre_completo': 'Administrador General Sumaq',
            'is_superuser': True,
            'is_staff': True,
            'rol': User.Roles.ADMIN
        }
    )
    admin_user.set_password('AdminSumaq2026!')
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.rol = User.Roles.ADMIN
    admin_user.save()

    recepcion_user, _ = User.objects.get_or_create(
        email='recepcion@sumaqspa.pe',
        defaults={
            'nombre_completo': 'Valeria Quispe',
            'rol': User.Roles.RECEPCIONISTA
        }
    )
    recepcion_user.set_password('Sumaq2026!')
    recepcion_user.rol = User.Roles.RECEPCIONISTA
    recepcion_user.save()

    u_elena, _ = User.objects.get_or_create(
        email='elena.morales@sumaqspa.pe',
        defaults={
            'nombre_completo': 'Elena Morales',
            'rol': User.Roles.TERAPEUTA
        }
    )
    u_elena.set_password('Sumaq2026!')
    u_elena.rol = User.Roles.TERAPEUTA
    u_elena.save()

    u_camila, _ = User.objects.get_or_create(
        email='camila.vega@sumaqspa.pe',
        defaults={
            'nombre_completo': 'Camila Vega',
            'rol': User.Roles.TERAPEUTA
        }
    )
    u_camila.set_password('Sumaq2026!')
    u_camila.rol = User.Roles.TERAPEUTA
    u_camila.save()

    u_lucia, _ = User.objects.get_or_create(
        email='lucia.ramos@sumaqspa.pe',
        defaults={
            'nombre_completo': 'Lucía Ramos',
            'rol': User.Roles.TERAPEUTA
        }
    )
    u_lucia.set_password('Sumaq2026!')
    u_lucia.rol = User.Roles.TERAPEUTA
    u_lucia.save()
    print("-> Usuarios verificados: admin, recepcion, elena.morales, camila.vega, lucia.ramos.")

    # 2. Cabinas
    c1, _ = Cabina.objects.get_or_create(
        id=1,
        defaults={'nombre': 'Cabina 1', 'tipo': 'Holística', 'descripcion': 'Masajes relajantes y terapéuticos con aromaterapia y música binaural.'}
    )
    c2, _ = Cabina.objects.get_or_create(
        id=2,
        defaults={'nombre': 'Cabina 2', 'tipo': 'Dermoestética', 'descripcion': 'Tratamientos y limpiezas faciales profundas con aparatología avanzada.'}
    )
    c3, _ = Cabina.objects.get_or_create(
        id=3,
        defaults={'nombre': 'Cabina 3', 'tipo': 'Hidroterapia', 'descripcion': 'Envolturas corporales, exfoliaciones y sales de baño minerales relajantes.'}
    )
    print("-> Cabinas 1, 2 y 3 listas.")

    # 3. Terapeutas
    t1, _ = Terapeuta.objects.get_or_create(
        id=1,
        defaults={
            'usuario': u_elena,
            'cabina': c1,
            'especialidad': 'Terapias Holísticas y Masajes Descontracturantes',
            'foto_url': 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600'
        }
    )
    t2, _ = Terapeuta.objects.get_or_create(
        id=2,
        defaults={
            'usuario': u_camila,
            'cabina': c2,
            'especialidad': 'Dermoestética y Cosmiatría Facial Avanzada',
            'foto_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600'
        }
    )
    t3, _ = Terapeuta.objects.get_or_create(
        id=3,
        defaults={
            'usuario': u_lucia,
            'cabina': c3,
            'especialidad': 'Hidroterapia, Exfoliaciones y Rituales Corporales',
            'foto_url': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600'
        }
    )
    print("-> Terapeutas vinculadas a sus cabinas.")

    # 4. Insumos
    p1, _ = Producto.objects.get_or_create(id=1, defaults={'nombre': 'Aceite Esencial de Lavanda', 'descripcion': 'Aceite botánico 100% puro para masajes relajantes y aromaterapia.', 'costo_unitario': Decimal('18.00'), 'stock_actual': Decimal('28.00'), 'stock_minimo_alerta': Decimal('5.00'), 'unidad_medida': 'frascos (100ml)'})
    p2, _ = Producto.objects.get_or_create(id=2, defaults={'nombre': 'Crema Hidratante Dermo Facial', 'descripcion': 'Fórmula hidratante con ácido hialurónico para todo tipo de piel.', 'costo_unitario': Decimal('22.50'), 'stock_actual': Decimal('24.00'), 'stock_minimo_alerta': Decimal('5.00'), 'unidad_medida': 'potes (250gr)'})
    p3, _ = Producto.objects.get_or_create(id=3, defaults={'nombre': 'Exfoliante Corporal Botánico', 'descripcion': 'Exfoliante de microgránulos de albaricoque y sales del mar muerto.', 'costo_unitario': Decimal('25.00'), 'stock_actual': Decimal('4.00'), 'stock_minimo_alerta': Decimal('5.00'), 'unidad_medida': 'frascos (300gr)'})
    p4, _ = Producto.objects.get_or_create(id=4, defaults={'nombre': 'Mascarilla Facial Revitalizante', 'descripcion': 'Mascarilla con colágeno y vitamina C en sobres individuales.', 'costo_unitario': Decimal('15.00'), 'stock_actual': Decimal('2.00'), 'stock_minimo_alerta': Decimal('5.00'), 'unidad_medida': 'sobres'})
    p5, _ = Producto.objects.get_or_create(id=5, defaults={'nombre': 'Sales de Baño Minerales', 'descripcion': 'Sales minerales aromatizadas con eucalipto para hidroterapia.', 'costo_unitario': Decimal('12.00'), 'stock_actual': Decimal('32.00'), 'stock_minimo_alerta': Decimal('5.00'), 'unidad_medida': 'bolsas (500gr)'})
    print("-> Insumos de almacén verificados.")

    # 5. Servicios y recetas
    s1, _ = Servicio.objects.get_or_create(id=1, defaults={'nombre': 'Masaje Relajante', 'descripcion': 'Masaje corporal antiestrés con aceites esenciales botánicos y técnicas de relajación profunda.', 'precio_publico': Decimal('120.00'), 'duracion_min': 60, 'imagen_url': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'})
    s2, _ = Servicio.objects.get_or_create(id=2, defaults={'nombre': 'Limpieza Facial Profunda', 'descripcion': 'Tratamiento dermoestético con exfoliación, vapor de ozono, extracción y mascarilla revitalizante.', 'precio_publico': Decimal('150.00'), 'duracion_min': 60, 'imagen_url': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800'})
    s3, _ = Servicio.objects.get_or_create(id=3, defaults={'nombre': 'Envoltura Corporal & Hidroterapia', 'descripcion': 'Inmersión relajante con sales marinas aromáticas y envoltura desintoxicante con exfoliación corporal.', 'precio_publico': Decimal('180.00'), 'duracion_min': 60, 'imagen_url': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800'})

    RecetaServicio.objects.get_or_create(servicio=s1, producto=p1, defaults={'cantidad_requerida': Decimal('1.00')})
    RecetaServicio.objects.get_or_create(servicio=s1, producto=p2, defaults={'cantidad_requerida': Decimal('1.00')})
    RecetaServicio.objects.get_or_create(servicio=s2, producto=p4, defaults={'cantidad_requerida': Decimal('1.00')})
    RecetaServicio.objects.get_or_create(servicio=s2, producto=p2, defaults={'cantidad_requerida': Decimal('1.00')})
    RecetaServicio.objects.get_or_create(servicio=s3, producto=p3, defaults={'cantidad_requerida': Decimal('1.00')})
    RecetaServicio.objects.get_or_create(servicio=s3, producto=p5, defaults={'cantidad_requerida': Decimal('1.00')})

    # 6. Promociones
    promo1, _ = Promocion.objects.get_or_create(id=1, defaults={'titulo': 'Bienvenida Sumaq Spa', 'descripcion': '20% de descuento en tu primera reserva online.', 'codigo_cupon': 'SUMAQBIENVENIDA', 'porcentaje_descuento': Decimal('20.00'), 'fecha_inicio': date(2026, 1, 1), 'fecha_fin': date(2026, 12, 31)})
    promo2, _ = Promocion.objects.get_or_create(id=2, defaults={'titulo': 'Día de Relajación', 'descripcion': '15% de descuento en todos nuestros tratamientos y masajes.', 'codigo_cupon': 'RELAXDAY', 'porcentaje_descuento': Decimal('15.00'), 'fecha_inicio': date(2026, 1, 1), 'fecha_fin': date(2026, 12, 31)})

    # 7. Clientes del Mock Data
    cli1, _ = Cliente.objects.get_or_create(
        dni='72345678',
        defaults={'nombre_completo': 'María García Ramos', 'telefono': '987654321', 'email': 'maria.garcia@gmail.com'}
    )
    cli2, _ = Cliente.objects.get_or_create(
        dni='45678901',
        defaults={'nombre_completo': 'Carlos Mendoza Silva', 'telefono': '912345678', 'email': 'carlos.mendoza@hotmail.com'}
    )
    cli3, _ = Cliente.objects.get_or_create(
        dni='70987654',
        defaults={'nombre_completo': 'Ana Lucía Torres', 'telefono': '998877665', 'email': 'ana.torres@outlook.com'}
    )
    print("-> Clientes oficiales registrados.")

    # 8. Citas del Mock Data copiadas a la Base de Datos Real
    today = timezone.localdate()
    today_code = today.strftime('%Y%m%d')

    c1_code = f'SQ-{today_code}-0042'
    if not Cita.objects.filter(codigo_reserva=c1_code).exists():
        cita1 = Cita.objects.create(
            codigo_reserva=c1_code,
            cliente=cli1,
            servicio=s1,
            terapeuta=t1,
            cabina=c1,
            fecha=today,
            hora_inicio=time(9, 0),
            hora_fin=time(10, 0),
            estado=Cita.Estados.PENDIENTE,
            subtotal=Decimal('120.00'),
            descuento=Decimal('24.00'),
            monto_total=Decimal('96.00'),
            metodo_pago=Cita.MetodosPago.EFECTIVO,
            promocion=promo1,
            codigo_cupon_aplicado='SUMAQBIENVENIDA'
        )
        FichaAtencion.objects.get_or_create(
            cita=cita1,
            defaults={
                'tipo_piel': 'Piel Sensible y Reactiva',
                'alergias_conocidas': 'Alergia a parabenos y fragancias sintéticas fuertes.',
                'notas_terapeuta': 'Paciente refiere tensión muscular cervical. Se aplicará aceite esencial de lavanda tibio.'
            }
        )
        MovimientoCaja.objects.get_or_create(
            cita=cita1,
            defaults={
                'tipo': MovimientoCaja.Tipos.INGRESO_CITA,
                'concepto': f'Cobro de Cita Masaje Relajante ({cita1.codigo_reserva})',
                'monto': Decimal('96.00'),
                'metodo_pago': 'EFECTIVO',
                'descripcion': 'Cobro de reserva web confirmada'
            }
        )
        print(f"-> Cita {c1_code} (Hoy - Pendiente) registrada en MySQL.")

    c2_code = f'SQ-{today_code}-0043'
    if not Cita.objects.filter(codigo_reserva=c2_code).exists():
        cita2 = Cita.objects.create(
            codigo_reserva=c2_code,
            cliente=cli2,
            servicio=s2,
            terapeuta=t2,
            cabina=c2,
            fecha=today,
            hora_inicio=time(11, 0),
            hora_fin=time(12, 0),
            estado=Cita.Estados.ATENDIDA,
            subtotal=Decimal('150.00'),
            descuento=Decimal('0.00'),
            monto_total=Decimal('150.00'),
            metodo_pago=Cita.MetodosPago.TARJETA
        )
        FichaAtencion.objects.get_or_create(
            cita=cita2,
            defaults={
                'tipo_piel': 'Piel Mixta con Tendencia Acneica',
                'alergias_conocidas': 'Ninguna alergia conocida declarada.',
                'notas_terapeuta': 'Limpieza facial profunda realizada con éxito. Se aplicó mascarilla revitalizante y crema hidratante.'
            }
        )
        MovimientoInventario.objects.create(
            producto=p4,
            tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO,
            cantidad=Decimal('1.00'),
            costo_unitario=Decimal('15.00'),
            referencia_tipo='CITA',
            referencia_id=cita2.id,
            descripcion=f'Consumo en atención de limpieza facial {cita2.codigo_reserva}'
        )
        MovimientoInventario.objects.create(
            producto=p2,
            tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO,
            cantidad=Decimal('1.00'),
            costo_unitario=Decimal('22.50'),
            referencia_tipo='CITA',
            referencia_id=cita2.id,
            descripcion=f'Consumo en atención de limpieza facial {cita2.codigo_reserva}'
        )
        MovimientoCaja.objects.get_or_create(
            cita=cita2,
            defaults={
                'tipo': MovimientoCaja.Tipos.INGRESO_CITA,
                'concepto': f'Cobro de Cita Limpieza Facial ({cita2.codigo_reserva})',
                'monto': Decimal('150.00'),
                'metodo_pago': 'TARJETA',
                'descripcion': 'Atención completada en cabina 2'
            }
        )
        print(f"-> Cita {c2_code} (Hoy - Atendida) registrada en MySQL.")

    c3_code = f'SQ-{today_code}-0044'
    if not Cita.objects.filter(codigo_reserva=c3_code).exists():
        cita3 = Cita.objects.create(
            codigo_reserva=c3_code,
            cliente=cli3,
            servicio=s3,
            terapeuta=t3,
            cabina=c3,
            fecha=today,
            hora_inicio=time(14, 0),
            hora_fin=time(15, 0),
            estado=Cita.Estados.PENDIENTE,
            subtotal=Decimal('180.00'),
            descuento=Decimal('27.00'),
            monto_total=Decimal('153.00'),
            metodo_pago=Cita.MetodosPago.YAPE,
            promocion=promo2,
            codigo_cupon_aplicado='RELAXDAY'
        )
        MovimientoCaja.objects.get_or_create(
            cita=cita3,
            defaults={
                'tipo': MovimientoCaja.Tipos.INGRESO_CITA,
                'concepto': f'Cobro de Cita Hidroterapia ({cita3.codigo_reserva})',
                'monto': Decimal('153.00'),
                'metodo_pago': 'YAPE',
                'descripcion': 'Pago adelantado vía Yape'
            }
        )
        print(f"-> Cita {c3_code} (Hoy - Pendiente) registrada en MySQL.")

    # Cita demo para el botón de prueba en Consulta de Cita
    demo_code = 'SQ-20260825-7281'
    if not Cita.objects.filter(codigo_reserva=demo_code).exists():
        c_demo = Cita.objects.create(
            codigo_reserva=demo_code,
            cliente=cli1,
            servicio=s1,
            terapeuta=t1,
            cabina=c1,
            fecha=today + timedelta(days=3),
            hora_inicio=time(10, 0),
            hora_fin=time(11, 0),
            estado=Cita.Estados.PENDIENTE,
            subtotal=Decimal('120.00'),
            descuento=Decimal('24.00'),
            monto_total=Decimal('96.00'),
            metodo_pago=Cita.MetodosPago.TARJETA,
            codigo_cupon_aplicado='SUMAQBIENVENIDA'
        )
        FichaAtencion.objects.get_or_create(
            cita=c_demo,
            defaults={
                'tipo_piel': 'Piel Sensible',
                'alergias_conocidas': 'Sin alergias',
                'notas_terapeuta': 'Cita de control agendada para sustento y demostración en vivo.'
            }
        )
        print(f"-> Cita Demo {demo_code} registrada para sustento.")

    # Citas Históricas de los últimos 7 días para gráficas del Dashboard
    historical_configs = [
        (1, time(10, 0), time(11, 0), cli1, s1, t1, c1, Decimal('120.00'), Decimal('0.00'), Decimal('120.00'), Cita.MetodosPago.EFECTIVO),
        (1, time(15, 0), time(16, 0), cli2, s2, t2, c2, Decimal('150.00'), Decimal('0.00'), Decimal('150.00'), Cita.MetodosPago.TARJETA),
        (2, time(9, 0), time(10, 0), cli3, s3, t3, c3, Decimal('180.00'), Decimal('27.00'), Decimal('153.00'), Cita.MetodosPago.YAPE),
        (2, time(12, 0), time(13, 0), cli1, s1, t1, c1, Decimal('120.00'), Decimal('24.00'), Decimal('96.00'), Cita.MetodosPago.TARJETA),
        (3, time(11, 0), time(12, 0), cli2, s2, t2, c2, Decimal('150.00'), Decimal('0.00'), Decimal('150.00'), Cita.MetodosPago.EFECTIVO),
        (3, time(16, 0), time(17, 0), cli3, s1, t1, c1, Decimal('120.00'), Decimal('0.00'), Decimal('120.00'), Cita.MetodosPago.PLIN),
        (4, time(10, 0), time(11, 0), cli1, s3, t3, c3, Decimal('180.00'), Decimal('0.00'), Decimal('180.00'), Cita.MetodosPago.TARJETA),
        (4, time(14, 0), time(15, 0), cli2, s1, t1, c1, Decimal('120.00'), Decimal('0.00'), Decimal('120.00'), Cita.MetodosPago.EFECTIVO),
        (5, time(9, 0), time(10, 0), cli3, s2, t2, c2, Decimal('150.00'), Decimal('0.00'), Decimal('150.00'), Cita.MetodosPago.TARJETA),
        (5, time(15, 0), time(16, 0), cli1, s3, t3, c3, Decimal('180.00'), Decimal('27.00'), Decimal('153.00'), Cita.MetodosPago.YAPE),
        (6, time(11, 0), time(12, 0), cli2, s1, t1, c1, Decimal('120.00'), Decimal('0.00'), Decimal('120.00'), Cita.MetodosPago.EFECTIVO),
        (6, time(13, 0), time(14, 0), cli3, s2, t2, c2, Decimal('150.00'), Decimal('0.00'), Decimal('150.00'), Cita.MetodosPago.TARJETA),
    ]

    hist_count = 0
    for days_ago, h_ini, h_fin, cli, srv, ter, cab, subt, desc, tot, pago in historical_configs:
        hist_date = today - timedelta(days=days_ago)
        hist_code = f"SQ-{hist_date.strftime('%Y%m%d')}-{100 + days_ago * 10 + (1 if h_ini.hour < 12 else 2)}"
        if not Cita.objects.filter(codigo_reserva=hist_code).exists():
            h_cita = Cita.objects.create(
                codigo_reserva=hist_code,
                cliente=cli,
                servicio=srv,
                terapeuta=ter,
                cabina=cab,
                fecha=hist_date,
                hora_inicio=h_ini,
                hora_fin=h_fin,
                estado=Cita.Estados.ATENDIDA,
                subtotal=subt,
                descuento=desc,
                monto_total=tot,
                metodo_pago=pago
            )
            MovimientoCaja.objects.get_or_create(
                cita=h_cita,
                defaults={
                    'tipo': MovimientoCaja.Tipos.INGRESO_CITA,
                    'concepto': f'Cobro de Cita {srv.nombre} ({h_cita.codigo_reserva})',
                    'monto': tot,
                    'metodo_pago': pago,
                    'descripcion': 'Atención completada'
                }
            )
            hist_count += 1
    if hist_count > 0:
        print(f"-> {hist_count} citas históricas registradas para el análisis semanal.")

    # 9. Asientos iniciales de inventario (Kárdex)
    if MovimientoInventario.objects.count() < 5:
        MovimientoInventario.objects.get_or_create(
            producto=p1,
            tipo=MovimientoInventario.Tipos.ENTRADA_COMPRA,
            defaults={'cantidad': Decimal('30.00'), 'costo_unitario': Decimal('18.00'), 'referencia_tipo': 'COMPRA_INICIAL', 'descripcion': 'Compra y abastecimiento inicial de stock'}
        )
        MovimientoInventario.objects.get_or_create(
            producto=p2,
            tipo=MovimientoInventario.Tipos.ENTRADA_COMPRA,
            defaults={'cantidad': Decimal('25.00'), 'costo_unitario': Decimal('22.50'), 'referencia_tipo': 'COMPRA_INICIAL', 'descripcion': 'Compra y abastecimiento inicial de stock'}
        )
        MovimientoInventario.objects.get_or_create(
            producto=p3,
            tipo=MovimientoInventario.Tipos.ENTRADA_COMPRA,
            defaults={'cantidad': Decimal('5.00'), 'costo_unitario': Decimal('25.00'), 'referencia_tipo': 'COMPRA_INICIAL', 'descripcion': 'Compra y abastecimiento inicial de stock'}
        )
        MovimientoInventario.objects.get_or_create(
            producto=p4,
            tipo=MovimientoInventario.Tipos.ENTRADA_COMPRA,
            defaults={'cantidad': Decimal('3.00'), 'costo_unitario': Decimal('15.00'), 'referencia_tipo': 'COMPRA_INICIAL', 'descripcion': 'Compra y abastecimiento inicial de stock'}
        )
        MovimientoInventario.objects.get_or_create(
            producto=p5,
            tipo=MovimientoInventario.Tipos.ENTRADA_COMPRA,
            defaults={'cantidad': Decimal('33.00'), 'costo_unitario': Decimal('12.00'), 'referencia_tipo': 'COMPRA_INICIAL', 'descripcion': 'Compra y abastecimiento inicial de stock'}
        )
        print("-> Movimientos de kárdex inicializados.")

    print("\nBase de datos inicializada correctamente.")


if __name__ == '__main__':
    init_database()
