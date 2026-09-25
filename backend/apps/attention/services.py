from decimal import Decimal
from django.db import transaction
from apps.appointments.models import Cita
from apps.services.models import Servicio, RecetaServicio
from apps.inventory.models import Producto, MovimientoInventario
from apps.attention.models import FichaAtencion, ServicioAdicionalAtencion
from apps.finance.models import MovimientoCaja
from apps.common.exceptions import InsufficientStockError, BusinessLogicError


class AtencionService:
    @classmethod
    def agregar_servicio_adicional(cls, cita, servicio_id, cantidad=1):
        with transaction.atomic():
            cita_lock = Cita.objects.select_for_update().get(id=cita.id)
            if cita_lock.estado == Cita.Estados.ATENDIDA:
                raise BusinessLogicError("No se pueden agregar servicios a una cita ya completada.")

            try:
                extra_servicio = Servicio.objects.get(id=servicio_id, activo=True)
            except Servicio.DoesNotExist:
                raise BusinessLogicError("El servicio adicional especificado no existe.")

            ficha, _ = FichaAtencion.objects.get_or_create(cita=cita_lock)

            precio_unitario = extra_servicio.precio_publico
            subtotal_adicional = (precio_unitario * Decimal(cantidad)).quantize(Decimal('0.01'))

            ServicioAdicionalAtencion.objects.create(
                ficha_atencion=ficha,
                servicio=extra_servicio,
                cantidad=cantidad,
                precio_unitario_historico=precio_unitario,
                subtotal=subtotal_adicional
            )

            # Recalcular totales de la cita
            cita_lock.subtotal += subtotal_adicional
            cita_lock.monto_total += subtotal_adicional
            cita_lock.save()

            # Actualizar o agregar movimiento en caja
            MovimientoCaja.objects.create(
                cita=cita_lock,
                tipo=MovimientoCaja.Tipos.INGRESO_CITA,
                monto=subtotal_adicional,
                descripcion=f"Tratamiento adicional: {extra_servicio.nombre} (x{cantidad}) en cita {cita_lock.codigo_reserva}"
            )

            return cita_lock

    @classmethod
    def completar_cita(cls, cita):
        ### RIESGO: Rollback transaccional atómico ante falta de stock
        with transaction.atomic():
            cita_lock = Cita.objects.select_for_update().get(id=cita.id)
            if cita_lock.estado == Cita.Estados.ATENDIDA:
                return cita_lock

            if cita_lock.estado == Cita.Estados.CANCELADA:
                raise BusinessLogicError("No se puede completar una cita que ha sido cancelada.")

            # Recopilar todos los insumos necesarios (Servicio Base + Servicios Adicionales)
            servicios_consumo = [(cita_lock.servicio, 1)]

            if hasattr(cita_lock, 'ficha_atencion') and cita_lock.ficha_atencion:
                for adicional in cita_lock.ficha_atencion.servicios_adicionales.select_related('servicio'):
                    servicios_consumo.append((adicional.servicio, adicional.cantidad))

            # Verificar y descontar stock por receta
            for servicio_item, cant_sesion in servicios_consumo:
                recetas = RecetaServicio.objects.filter(servicio=servicio_item)
                for receta in recetas:
                    cant_total_insumo = receta.cantidad_requerida * Decimal(cant_sesion)
                    prod_lock = Producto.objects.select_for_update().get(id=receta.producto_id)

                    if prod_lock.stock_actual < cant_total_insumo:
                        raise InsufficientStockError(
                            f"Stock insuficiente para el insumo '{prod_lock.nombre}'. "
                            f"Requerido: {cant_total_insumo} {prod_lock.unidad_medida}, "
                            f"Disponible: {prod_lock.stock_actual} {prod_lock.unidad_medida}."
                        )

                    prod_lock.stock_actual -= cant_total_insumo
                    prod_lock.save()

                    MovimientoInventario.objects.create(
                        producto=prod_lock,
                        tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO,
                        cantidad=cant_total_insumo,
                        costo_unitario=prod_lock.costo_unitario,
                        referencia_tipo='CITA',
                        referencia_id=cita_lock.id,
                        descripcion=f"Consumo en atención de cita {cita_lock.codigo_reserva} ({servicio_item.nombre})"
                    )

            cita_lock.estado = Cita.Estados.ATENDIDA
            cita_lock.save()
            return cita_lock
