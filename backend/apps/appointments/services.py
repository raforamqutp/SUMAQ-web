import uuid
from decimal import Decimal
from datetime import datetime, time, timedelta
from django.db import transaction
from django.utils import timezone
from apps.appointments.models import Cita
from apps.clients.models import Cliente
from apps.services.models import Servicio
from apps.therapists.models import Terapeuta
from apps.cabins.models import Cabina
from apps.marketing.models import Promocion
from apps.finance.models import MovimientoCaja
from apps.common.exceptions import (
    ClientAlreadyHasAppointmentError,
    ResourceConflictError,
    BusinessLogicError
)

HORAS_INICIO = [
    time(8, 0), time(9, 0), time(10, 0), time(11, 0),
    time(12, 0), time(13, 0), time(14, 0), time(15, 0), time(16, 0)
]


class DisponibilidadService:
    @staticmethod
    def get_slots_disponibles(fecha, servicio_id=None, terapeuta_id=None, cabina_id=None):
        duracion_min = 60
        if servicio_id:
            try:
                servicio = Servicio.objects.get(id=servicio_id, activo=True)
                duracion_min = servicio.duracion_min
            except Servicio.DoesNotExist:
                pass

        terapeutas_qs = Terapeuta.objects.select_related('usuario', 'cabina').filter(activo=True, usuario__activo=True)
        if terapeuta_id:
            terapeutas_qs = terapeutas_qs.filter(id=terapeuta_id)

        cabinas_qs = Cabina.objects.filter(activa=True)
        if cabina_id:
            cabinas_qs = cabinas_qs.filter(id=cabina_id)

        citas_existentes = Cita.objects.filter(
            fecha=fecha,
            estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA]
        ).values('terapeuta_id', 'cabina_id', 'hora_inicio', 'hora_fin')

        citas_list = list(citas_existentes)
        slots_resultado = []

        now_local = timezone.localtime()
        today_local = now_local.date()
        time_local = now_local.time()

        for hora_ini in HORAS_INICIO:
            dt_inicio = datetime.combine(fecha, hora_ini)
            dt_fin = dt_inicio + timedelta(minutes=duracion_min)
            hora_fin_slot = dt_fin.time()

            # Validación de fecha u horario pasado
            es_pasado = False
            if fecha < today_local:
                es_pasado = True
            elif fecha == today_local and hora_ini <= time_local:
                es_pasado = True

            if terapeuta_id:
                for terapeuta in terapeutas_qs:
                    cabina_terapeuta = terapeuta.cabina
                    if not cabina_terapeuta or not cabina_terapeuta.activa:
                        continue

                    if cabina_id and cabina_terapeuta.id != cabina_id:
                        continue

                    terapeuta_ocupado = any(
                        c['terapeuta_id'] == terapeuta.id and
                        (hora_ini < c['hora_fin'] and hora_fin_slot > c['hora_inicio'])
                        for c in citas_list
                    )

                    cabina_ocupada = any(
                        c['cabina_id'] == cabina_terapeuta.id and
                        (hora_ini < c['hora_fin'] and hora_fin_slot > c['hora_inicio'])
                        for c in citas_list
                    )

                    if es_pasado:
                        disponible = False
                        motivo = 'Cerrado'
                    elif terapeuta_ocupado or cabina_ocupada:
                        disponible = False
                        motivo = 'Ocupado'
                    else:
                        disponible = True
                        motivo = 'Disponible'

                    slots_resultado.append({
                        'hora_inicio': hora_ini.strftime('%H:%M:%S'),
                        'hora_fin': hora_fin_slot.strftime('%H:%M:%S'),
                        'disponible': disponible,
                        'motivo': motivo,
                        'pasado': es_pasado,
                        'terapeuta_id': terapeuta.id,
                        'terapeuta_nombre': terapeuta.usuario.nombre_completo,
                        'especialidad': terapeuta.especialidad,
                        'cabina_id': cabina_terapeuta.id,
                        'cabina_nombre': cabina_terapeuta.nombre,
                        'cabina_tipo': cabina_terapeuta.tipo
                    })
            else:
                # Si no se especifica terapeuta_id, consolidar a 1 solo slot por horario (evita triplicación)
                terapeuta_libre_encontrado = None
                for terapeuta in terapeutas_qs:
                    cabina_terapeuta = terapeuta.cabina
                    if not cabina_terapeuta or not cabina_terapeuta.activa:
                        continue
                    if cabina_id and cabina_terapeuta.id != cabina_id:
                        continue

                    terapeuta_ocupado = any(
                        c['terapeuta_id'] == terapeuta.id and
                        (hora_ini < c['hora_fin'] and hora_fin_slot > c['hora_inicio'])
                        for c in citas_list
                    )
                    cabina_ocupada = any(
                        c['cabina_id'] == cabina_terapeuta.id and
                        (hora_ini < c['hora_fin'] and hora_fin_slot > c['hora_inicio'])
                        for c in citas_list
                    )

                    if not terapeuta_ocupado and not cabina_ocupada:
                        terapeuta_libre_encontrado = (terapeuta, cabina_terapeuta)
                        break

                if es_pasado:
                    disponible = False
                    motivo = 'Cerrado'
                elif terapeuta_libre_encontrado:
                    disponible = True
                    motivo = 'Disponible'
                else:
                    disponible = False
                    motivo = 'Ocupado'

                primer_t = terapeuta_libre_encontrado[0] if terapeuta_libre_encontrado else terapeutas_qs.first()
                primer_c = terapeuta_libre_encontrado[1] if terapeuta_libre_encontrado else (primer_t.cabina if primer_t else None)

                slots_resultado.append({
                    'hora_inicio': hora_ini.strftime('%H:%M:%S'),
                    'hora_fin': hora_fin_slot.strftime('%H:%M:%S'),
                    'disponible': disponible,
                    'motivo': motivo,
                    'pasado': es_pasado,
                    'terapeuta_id': primer_t.id if primer_t else None,
                    'terapeuta_nombre': primer_t.usuario.nombre_completo if primer_t else '',
                    'especialidad': primer_t.especialidad if primer_t else '',
                    'cabina_id': primer_c.id if primer_c else None,
                    'cabina_nombre': primer_c.nombre if primer_c else '',
                    'cabina_tipo': primer_c.tipo if primer_c else ''
                })

        return slots_resultado


class ReservaService:
    @staticmethod
    def generar_codigo_reserva(fecha):
        suffix = uuid.uuid4().hex[:5].upper()
        fecha_str = fecha.strftime('%Y%m%d')
        return f"SQ-{fecha_str}-{suffix}"

    @classmethod
    def crear_reserva_web(cls, data):
        dni = data['dni'].strip()
        nombre_completo = data['nombre_completo'].strip()
        telefono = data['telefono'].strip()
        email = data.get('email', '').strip()
        servicio_id = data['servicio_id']
        terapeuta_id = data['terapeuta_id']
        cabina_id = data['cabina_id']
        fecha = data['fecha']
        hora_inicio = data['hora_inicio']
        metodo_pago = data.get('metodo_pago', Cita.MetodosPago.EFECTIVO)
        codigo_cupon = data.get('codigo_cupon', '').strip()

        now_local = timezone.localtime()
        today_local = now_local.date()
        time_local = now_local.time()

        if fecha < today_local or (fecha == today_local and hora_inicio <= time_local):
            raise BusinessLogicError(
                "No es posible reservar citas en fechas u horarios pasados. Por favor seleccione un turno disponible.",
                code="PAST_SLOT_NOT_ALLOWED"
            )

        with transaction.atomic():
            # 1. Bloqueo pesimista sobre terapeuta y cabina para garantizar serialización
            try:
                terapeuta = Terapeuta.objects.select_for_update().select_related('usuario').get(id=terapeuta_id, activo=True)
            except Terapeuta.DoesNotExist:
                raise BusinessLogicError("El terapeuta seleccionado no existe o no se encuentra activo.", code="THERAPIST_NOT_FOUND")

            try:
                cabina = Cabina.objects.select_for_update().get(id=cabina_id, activa=True)
            except Cabina.DoesNotExist:
                raise BusinessLogicError("La cabina seleccionada no existe o no se encuentra activa.", code="CABIN_NOT_FOUND")

            try:
                servicio = Servicio.objects.get(id=servicio_id, activo=True)
            except Servicio.DoesNotExist:
                raise BusinessLogicError("El servicio seleccionado no existe o no se encuentra activo.", code="SERVICE_NOT_FOUND")

            dt_inicio = datetime.combine(fecha, hora_inicio)
            dt_fin = dt_inicio + timedelta(minutes=servicio.duracion_min)
            hora_fin = dt_fin.time()

            # 2. Regla de Negocio: Máximo 1 cita por cliente (DNI) por día calendario
            cliente_existente = Cliente.objects.filter(dni=dni).first()
            if cliente_existente:
                cita_mismo_dia = Cita.objects.filter(
                    cliente=cliente_existente,
                    fecha=fecha,
                    estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA]
                ).exists()
                if cita_mismo_dia:
                    raise ClientAlreadyHasAppointmentError(
                        f"El cliente con DNI {dni} ya tiene una cita registrada para la fecha {fecha}."
                    )
                cliente_existente.nombre_completo = nombre_completo
                cliente_existente.telefono = telefono
                if email:
                    cliente_existente.email = email
                cliente_existente.save()
                cliente = cliente_existente
            else:
                cliente = Cliente.objects.create(
                    dni=dni,
                    nombre_completo=nombre_completo,
                    telefono=telefono,
                    email=email or None
                )

            # 3. Verificación de conflicto de horario
            terapeuta_conflicto = Cita.objects.filter(
                terapeuta=terapeuta,
                fecha=fecha,
                estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA],
                hora_inicio__lt=hora_fin,
                hora_fin__gt=hora_inicio
            ).exists()

            if terapeuta_conflicto:
                raise ResourceConflictError(
                    f"El/la terapeuta {terapeuta.usuario.nombre_completo} ya tiene una reserva en el horario seleccionado ({hora_inicio.strftime('%H:%M')} - {hora_fin.strftime('%H:%M')})."
                )

            cabina_conflicto = Cita.objects.filter(
                cabina=cabina,
                fecha=fecha,
                estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA],
                hora_inicio__lt=hora_fin,
                hora_fin__gt=hora_inicio
            ).exists()

            if cabina_conflicto:
                raise ResourceConflictError(
                    f"La cabina {cabina.nombre} ya tiene una reserva en el horario seleccionado ({hora_inicio.strftime('%H:%M')} - {hora_fin.strftime('%H:%M')})."
                )

            # 4. Cálculo financiero y cupones
            subtotal = servicio.precio_publico
            descuento = Decimal('0.00')
            promocion_obj = None
            cupon_aplicado = ''

            if codigo_cupon:
                promo = Promocion.objects.filter(codigo_cupon__iexact=codigo_cupon, activo=True).first()
                if promo and promo.es_valida_para_fecha(fecha):
                    descuento = (subtotal * (promo.porcentaje_descuento / Decimal('100.00'))).quantize(Decimal('0.01'))
                    promocion_obj = promo
                    cupon_aplicado = promo.codigo_cupon
                else:
                    raise BusinessLogicError(
                        f"El cupón '{codigo_cupon}' no es válido o ha expirado.",
                        code="INVALID_COUPON"
                    )

            monto_total = (subtotal - descuento).quantize(Decimal('0.01'))

            # 5. Creación de Cita
            codigo_reserva = cls.generar_codigo_reserva(fecha)
            cita = Cita.objects.create(
                codigo_reserva=codigo_reserva,
                cliente=cliente,
                servicio=servicio,
                terapeuta=terapeuta,
                cabina=cabina,
                fecha=fecha,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                estado=Cita.Estados.PENDIENTE,
                subtotal=subtotal,
                descuento=descuento,
                monto_total=monto_total,
                metodo_pago=metodo_pago,
                promocion=promocion_obj,
                codigo_cupon_aplicado=cupon_aplicado
            )

            # 6. Asiento contable de ingreso en Caja
            MovimientoCaja.objects.create(
                cita=cita,
                tipo=MovimientoCaja.Tipos.INGRESO_CITA,
                monto=monto_total,
                descripcion=f"Reserva Web {codigo_reserva} - {cliente.nombre_completo} ({servicio.nombre})"
            )

            return cita

    @classmethod
    def consultar_cita_web(cls, codigo_reserva, dni):
        clean_code = codigo_reserva.strip().upper()
        clean_dni = dni.strip()

        try:
            cita = Cita.objects.select_related(
                'cliente', 'servicio', 'terapeuta__usuario', 'cabina'
            ).prefetch_related(
                'ficha_atencion__servicios_adicionales__servicio'
            ).get(
                codigo_reserva=clean_code,
                cliente__dni=clean_dni
            )
        except Cita.DoesNotExist:
            raise BusinessLogicError(
                "No se encontró ninguna cita con el código de reserva y DNI proporcionados. Verifique los datos ingresados.",
                code="APPOINTMENT_NOT_FOUND",
                status_code=404
            )

        dt_cita = datetime.combine(cita.fecha, cita.hora_inicio)
        # Asegurar comparación en zona horaria local
        dt_cita_tz = timezone.make_aware(dt_cita, timezone.get_current_timezone())
        ahora = timezone.now()

        diff_seconds = (dt_cita_tz - ahora).total_seconds()
        horas_restantes = round(diff_seconds / 3600.0, 1)

        puede_modificar = (cita.estado == Cita.Estados.PENDIENTE and horas_restantes >= 24.0)

        if puede_modificar:
            motivo_bloqueo = None
        elif cita.estado != Cita.Estados.PENDIENTE:
            motivo_bloqueo = f"La cita ya ha sido marcada como {cita.estado}."
        else:
            motivo_bloqueo = f"Por política de cancelación, las modificaciones online requieren al menos 24 horas de anticipación (restan {horas_restantes}h)."

        return {
            'cita': cita,
            'horas_restantes': horas_restantes,
            'puede_modificar': puede_modificar,
            'motivo_bloqueo': motivo_bloqueo
        }

    @classmethod
    def cancelar_cita_web(cls, codigo_reserva, dni, motivo=None):
        info = cls.consultar_cita_web(codigo_reserva, dni)
        if not info['puede_modificar']:
            raise BusinessLogicError(
                info['motivo_bloqueo'] or "No es posible cancelar la cita con menos de 24 horas de anticipación.",
                code="CANNOT_CANCEL"
            )

        cita = info['cita']
        with transaction.atomic():
            cita_lock = Cita.objects.select_for_update().get(id=cita.id)
            cita_lock.estado = Cita.Estados.CANCELADA
            cita_lock.save()

            # Registrar egreso o anulación de ingreso si corresponde
            MovimientoCaja.objects.create(
                cita=cita_lock,
                tipo=MovimientoCaja.Tipos.EGRESO,
                monto=cita_lock.monto_total,
                descripcion=f"Anulación / Cancelación Web de Cita {cita_lock.codigo_reserva}. Motivo: {motivo or 'Cancelado por el cliente'}"
            )

            return cita_lock

    @classmethod
    def reprogramar_cita_web(cls, codigo_reserva, dni, nueva_fecha, nueva_hora_inicio):
        info = cls.consultar_cita_web(codigo_reserva, dni)
        if not info['puede_modificar']:
            raise BusinessLogicError(
                info['motivo_bloqueo'] or "No es posible reprogramar la cita con menos de 24 horas de anticipación.",
                code="CANNOT_RESCHEDULE"
            )

        cita = info['cita']

        now_local = timezone.localtime()
        today_local = now_local.date()
        time_local = now_local.time()

        if nueva_fecha < today_local or (nueva_fecha == today_local and nueva_hora_inicio <= time_local):
            raise BusinessLogicError(
                "No es posible reprogramar citas hacia fechas u horarios pasados. Seleccione un turno disponible futuro.",
                code="PAST_SLOT_NOT_ALLOWED"
            )

        with transaction.atomic():
            cita_lock = Cita.objects.select_for_update().get(id=cita.id)
            terapeuta = Terapeuta.objects.select_for_update().get(id=cita_lock.terapeuta_id)
            cabina = Cabina.objects.select_for_update().get(id=cita_lock.cabina_id)

            dt_inicio = datetime.combine(nueva_fecha, nueva_hora_inicio)
            dt_fin = dt_inicio + timedelta(minutes=cita_lock.servicio.duracion_min)
            nueva_hora_fin = dt_fin.time()

            # Validar que el cliente no tenga otra cita en la nueva fecha
            otra_cita_cliente = Cita.objects.filter(
                cliente=cita_lock.cliente,
                fecha=nueva_fecha,
                estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA]
            ).exclude(id=cita_lock.id).exists()

            if otra_cita_cliente:
                raise ClientAlreadyHasAppointmentError(
                    f"El cliente ya cuenta con otra cita registrada para la fecha {nueva_fecha}."
                )

            # Validar disponibilidad de terapeuta en nuevo horario
            terapeuta_conflicto = Cita.objects.filter(
                terapeuta=terapeuta,
                fecha=nueva_fecha,
                estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA],
                hora_inicio__lt=nueva_hora_fin,
                hora_fin__gt=nueva_hora_inicio
            ).exclude(id=cita_lock.id).exists()

            if terapeuta_conflicto:
                raise ResourceConflictError(
                    f"El/la terapeuta {terapeuta.usuario.nombre_completo} no está disponible en el nuevo horario seleccionado."
                )

            cabina_conflicto = Cita.objects.filter(
                cabina=cabina,
                fecha=nueva_fecha,
                estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA],
                hora_inicio__lt=nueva_hora_fin,
                hora_fin__gt=nueva_hora_inicio
            ).exclude(id=cita_lock.id).exists()

            if cabina_conflicto:
                raise ResourceConflictError(
                    f"La cabina {cabina.nombre} no está disponible en el nuevo horario seleccionado."
                )

            cita_lock.fecha = nueva_fecha
            cita_lock.hora_inicio = nueva_hora_inicio
            cita_lock.hora_fin = nueva_hora_fin
            cita_lock.save()

            return cita_lock
