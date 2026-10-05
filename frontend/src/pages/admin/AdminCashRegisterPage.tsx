import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  Receipt, 
  User, 
  Tag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FileText, 
  History,
  RotateCcw,
  Search,
  UserPlus,
  Calendar,
  Clock,
  Sparkles,
  ShoppingBag,
  Download
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/Modal';
import { adminService } from '../../services/adminService';
import { downloadPdf } from '../../services/api';
import { MovimientoCaja, Servicio, Producto, Promocion, Cita, Cliente } from '../../types/models';

interface CartItem {
  id: string;
  name: string;
  type: 'SERVICIO' | 'PRODUCTO';
  price: number;
  quantity: number;
  servicioId?: number;
  productoId?: number;
  citaId?: number;
}

export const AdminCashRegisterPage: React.FC = () => {
  const { toast } = useToast();
  
  // Turno de caja
  const [shift] = useState('Turno: Mañana (08:00 - 14:00)');
  const [cashier] = useState('Recepcionista: Elena Morales');
  
  // Cliente & Ficha Clínica
  const [clientDni, setClientDni] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [historyCode, setHistoryCode] = useState('');
  const [isClientActive, setIsClientActive] = useState<boolean>(true);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientSearched, setClientSearched] = useState(false);

  // Cita detectada del día y lista de citas pendientes del cliente
  const [todayCita, setTodayCita] = useState<Cita | null>(null);
  const [clientPendingCitas, setClientPendingCitas] = useState<Cita[]>([]);

  // Carrito de cobro
  const [cart, setCart] = useState<CartItem[]>([]);

  // Catálogos desde BD
  const [serviciosList, setServiciosList] = useState<Servicio[]>([]);
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [promocionesList, setPromocionesList] = useState<Promocion[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  // Modales de selección
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Formulario nuevo cliente rápido
  const [newClientDni, setNewClientDni] = useState('');
  const [newClientNombre, setNewClientNombre] = useState('');
  const [newClientTelefono, setNewClientTelefono] = useState('');
  const [submittingNewClient, setSubmittingNewClient] = useState(false);

  // Cupón
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponApplied, setCouponApplied] = useState<boolean>(false);

  // Método de pago y liquidación
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN'>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    movimientoId?: number;
    citaId?: number;
    citasCount?: number;
    codigoReserva?: string;
    clientName: string;
    clientDni: string;
    total: number;
    paymentMethod: string;
    amountReceived: number;
    change: number;
    itemsSummary: string;
  } | null>(null);

  // Historial de movimientos
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [historialCaja, setHistorialCaja] = useState<MovimientoCaja[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Carga inicial de catálogos
  const loadCatalogs = useCallback(async () => {
    setLoadingCatalogs(true);
    try {
      const [servicios, productos, promociones] = await Promise.all([
        adminService.getServicios().catch(() => []),
        adminService.getProductos().catch(() => []),
        adminService.getPromociones().catch(() => [])
      ]);
      setServiciosList(servicios.filter(s => s.activo));
      setProductosList(productos.filter(p => p.activo));
      setPromocionesList(promociones.filter(p => p.activo));
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    } finally {
      setLoadingCatalogs(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  // Cálculos financieros
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return couponApplied ? (subtotal * discountPercent) / 100 : 0;
  }, [couponApplied, subtotal, discountPercent]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const igv = useMemo(() => {
    return total * 0.18;
  }, [total]);

  const change = useMemo(() => {
    return Math.max(0, amountReceived - total);
  }, [amountReceived, total]);

  // Sincronizar efectivo recibido sugerido
  useEffect(() => {
    if (paymentMethod === 'EFECTIVO' && amountReceived < total) {
      setAmountReceived(Math.ceil(total / 10) * 10);
    }
  }, [total, paymentMethod]);

  // Búsqueda de cliente por DNI
  const handleSearchClient = useCallback(async (dniToSearch?: string) => {
    const dni = (dniToSearch ?? clientDni).trim();
    if (!dni || dni.length < 6) {
      toast.warning('DNI Incompleto', 'Ingrese al menos 6 a 8 dígitos para buscar.');
      return;
    }

    setIsSearchingClient(true);
    setClientSearched(true);
    try {
      const results = await adminService.searchClientes(dni);
      const exactMatch = results.find(c => c.dni === dni) || results[0];

      if (exactMatch) {
        setSelectedCliente(exactMatch);
        setClientDni(exactMatch.dni);
        setClientName(exactMatch.nombre_completo);
        setClientPhone(exactMatch.telefono || '');
        setHistoryCode(`HC-${exactMatch.id.toString().padStart(4, '0')}`);
        setIsClientActive(exactMatch.activo);
        toast.success('Cliente Identificado', `${exactMatch.nombre_completo} (HC-${exactMatch.id.toString().padStart(4, '0')})`);

        // Consultar si tiene citas pendientes de atención y cobro
        const todayStr = new Date().toISOString().split('T')[0];
        try {
          const citas = await adminService.getCitas({ search: exactMatch.dni });
          const citasArray = Array.isArray(citas) ? citas : (citas as any).results || [];
          
          // REGLA ESTRICTA DE CAJA: Solo se cobran citas en estado PENDIENTE.
          // Ordenar: primero las de HOY, luego por fecha y hora cronológica ascendente
          const pendingCitas: Cita[] = citasArray
            .filter((c: Cita) => c.estado === 'PENDIENTE')
            .sort((a: Cita, b: Cita) => {
              if (a.fecha === todayStr && b.fecha !== todayStr) return -1;
              if (b.fecha === todayStr && a.fecha !== todayStr) return 1;
              return `${a.fecha} ${a.hora_inicio || ''}`.localeCompare(`${b.fecha} ${b.hora_inicio || ''}`);
            });

          setClientPendingCitas(pendingCitas);
          
          // Por defecto en caja se carga ÚNICAMENTE 1 cita (la prioritaria de hoy o la más próxima),
          // para no comprometer ni adelantar cobros de citas futuras sin consentimiento explícito.
          const pendingCita = pendingCitas[0];
          const hasAttendedCitas = citasArray.some((c: Cita) => c.estado === 'ATENDIDA');
          
          if (pendingCita && pendingCita.servicio) {
            setTodayCita(pendingCita);
            const adicionales = (pendingCita as any).ficha_atencion?.servicios_adicionales || [];
            
            if (adicionales.length > 0) {
              const extraItems: CartItem[] = adicionales.map((sa: any) => ({
                id: `extra-sa-${sa.id}`,
                name: `${sa.servicio_nombre || 'Servicio Adicional'} (Adicional Cita #${pendingCita.codigo_reserva})`,
                type: 'SERVICIO',
                price: parseFloat(sa.precio_unitario_historico || sa.subtotal || '0'),
                quantity: sa.cantidad || 1,
                servicioId: sa.servicio,
                citaId: pendingCita.id
              }));
              setCart(extraItems);
              toast.info(
                'Cita Pre-pagada Online',
                `Cita #${pendingCita.codigo_reserva} (${pendingCita.servicio.nombre}) pagada online. Se cargaron ${extraItems.length} servicio(s) adicional(es) pendiente(s) de cobro.`
              );
            } else {
              setCart([]);
              toast.info(
                'Cita Pre-pagada Online',
                `Cita #${pendingCita.codigo_reserva} (${pendingCita.servicio.nombre}) ya fue pagada online (S/ 0.00 pendiente de base). Listo para cobrar consumos extras o liquidar atención.`
              );
            }
          } else {
            setTodayCita(null);
            setCart([]);
            if (hasAttendedCitas) {
              toast.info('Sin Citas Pendientes', `${exactMatch.nombre_completo} no tiene citas pendientes de cobro (sus citas registradas ya figuran como ATENDIDAS). Puede agregar productos o servicios de mostrador.`);
            } else {
              toast.info('Cliente Mostrador', `${exactMatch.nombre_completo} no tiene citas agendadas. Listo para registrar consumos de mostrador.`);
            }
          }
        } catch (citasErr) {
          console.error('Error buscando citas del cliente:', citasErr);
        }
      } else {
        setSelectedCliente(null);
        setHistoryCode('HC-NUEVO');
        setIsClientActive(true);
        setTodayCita(null);
        setClientPendingCitas([]);
        toast.info('Cliente No Encontrado', 'Puede registrar sus datos para crear su Ficha Clínica o vender como cliente mostrador.');
      }
    } catch (err: any) {
      console.error('Error en búsqueda de cliente:', err);
      toast.error('Error', 'No se pudo consultar el servidor de clientes.');
    } finally {
      setIsSearchingClient(false);
    }
  }, [clientDni, toast]);

  // Cargar una cita específica al carrito (soporta clientes con múltiples citas en días distintos)
  const handleLoadCitaToCart = (cita: Cita) => {
    if (!cita || !cita.servicio) return;

    // Verificar si ya está en el carrito
    const alreadyInCart = cart.some(i => i.citaId === cita.id);
    if (alreadyInCart) {
      toast.info('Cita Ya Agregada', `La cita #${cita.codigo_reserva} ya se encuentra en el detalle.`);
      return;
    }

    const price = typeof cita.monto_total === 'number'
      ? cita.monto_total
      : parseFloat(cita.monto_total?.toString() || cita.servicio.precio_publico.toString());

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = cita.fecha === todayStr;

    const citaItem: CartItem = {
      id: `cita-${cita.id}`,
      name: `${cita.servicio.nombre} (Cita #${cita.codigo_reserva} - ${isToday ? 'Hoy' : cita.fecha})`,
      type: 'SERVICIO',
      price: price,
      quantity: 1,
      servicioId: cita.servicio.id,
      citaId: cita.id
    };

    setCart(prev => [...prev, citaItem]);
    toast.success('Cita Cargada a Caja', `Se agregó la cita #${cita.codigo_reserva} (${cita.servicio.nombre}) por S/ ${price.toFixed(2)}.`);
  };

  // Liquidar cita atendida sin consumos extras (S/ 0.00)
  const handleQuickCompleteCita = async (citaId: number) => {
    try {
      await adminService.updateCitaEstado(citaId, 'ATENDIDA');
      toast.success('Cita Atendida', `Cita actualizada a ATENDIDA exitosamente en Agenda.`);
      if (selectedCliente) {
        handleSearchClient(selectedCliente.dni);
      }
    } catch (err) {
      toast.error('Error', 'No se pudo actualizar el estado de la cita a ATENDIDA.');
    }
  };

  // Cargar cita detectada al carrito (compatibilidad)
  const handleLoadTodayAppointment = () => {
    if (todayCita) {
      handleLoadCitaToCart(todayCita);
    }
  };

  // Agregar servicio extra desde el modal
  const handleSelectService = (servicio: Servicio) => {
    const price = typeof servicio.precio_publico === 'number'
      ? servicio.precio_publico
      : parseFloat(servicio.precio_publico.toString());

    const newItem: CartItem = {
      id: `serv-${servicio.id}-${Date.now()}`,
      name: `${servicio.nombre} (${servicio.duracion_min} min)`,
      type: 'SERVICIO',
      price: price,
      quantity: 1,
      servicioId: servicio.id
    };

    setCart([...cart, newItem]);
    setServiceModalOpen(false);
    toast.success('Servicio Agregado', `${servicio.nombre} añadido al detalle.`);
  };

  // Agregar producto extra desde el modal
  const handleSelectProduct = (producto: Producto) => {
    const price = typeof producto.costo_unitario === 'number'
      ? producto.costo_unitario
      : parseFloat(producto.costo_unitario.toString());

    const newItem: CartItem = {
      id: `prod-${producto.id}-${Date.now()}`,
      name: `${producto.nombre} (${producto.unidad_medida})`,
      type: 'PRODUCTO',
      price: price,
      quantity: 1,
      productoId: producto.id
    };

    setCart([...cart, newItem]);
    setProductModalOpen(false);
    toast.success('Producto Agregado', `${producto.nombre} añadido al detalle.`);
  };

  // Remover ítem del carrito
  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
    toast.info('Ítem Removido', 'Se eliminó el concepto de la venta.');
  };

  // Crear nuevo cliente rápido desde la caja
  const handleQuickCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientDni.trim() || newClientDni.trim().length < 8) {
      toast.error('DNI Inválido', 'El DNI debe tener 8 dígitos.');
      return;
    }
    if (!newClientNombre.trim()) {
      toast.error('Nombre Requerido', 'Ingrese el nombre completo del cliente.');
      return;
    }

    setSubmittingNewClient(true);
    try {
      const created = await adminService.createCliente({
        dni: newClientDni.trim(),
        nombre_completo: newClientNombre.trim(),
        telefono: newClientTelefono.trim() || 'No especificado'
      });

      setSelectedCliente(created);
      setClientDni(created.dni);
      setClientName(created.nombre_completo);
      setClientPhone(created.telefono);
      setHistoryCode(`HC-${created.id.toString().padStart(4, '0')}`);
      setIsClientActive(true);
      setNewClientModalOpen(false);
      setNewClientDni('');
      setNewClientNombre('');
      setNewClientTelefono('');
      toast.success('Ficha Clínica Creada', `Cliente ${created.nombre_completo} registrado exitosamente.`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.dni?.[0] || 'Error al registrar cliente.';
      toast.error('Error', msg);
    } finally {
      setSubmittingNewClient(false);
    }
  };

  // Aplicar cupón de descuento validado contra BD
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.warning('Cupón Vacío', 'Ingrese un código de cupón.');
      return;
    }

    // Buscar en promociones cargadas de la BD
    const today = new Date().toISOString().split('T')[0];
    const foundPromo = promocionesList.find(p => 
      p.codigo_cupon.toUpperCase() === code && 
      p.activo && 
      (!p.fecha_inicio || p.fecha_inicio <= today) && 
      (!p.fecha_fin || p.fecha_fin >= today)
    );

    if (foundPromo) {
      const pct = typeof foundPromo.porcentaje_descuento === 'number' 
        ? foundPromo.porcentaje_descuento 
        : parseFloat(foundPromo.porcentaje_descuento.toString());
      setDiscountPercent(pct);
      setCouponApplied(true);
      toast.success('Cupón Aplicado', `${foundPromo.titulo || code}: Descuento del ${pct}% aplicado.`);
      return;
    }

    // Códigos de cortesía / demo universales
    if (code === 'SUMAQBIENVENIDA') {
      setDiscountPercent(20);
      setCouponApplied(true);
      toast.success('Cupón Aplicado', 'Descuento del 20% aplicado con SUMAQBIENVENIDA.');
    } else if (code === 'RELAXDAY') {
      setDiscountPercent(15);
      setCouponApplied(true);
      toast.success('Cupón Aplicado', 'Descuento del 15% aplicado con RELAXDAY.');
    } else {
      toast.error('Cupón Inválido', 'El código ingresado no existe, no está activo o ya expiró.');
    }
  };

  // Abrir historial de caja
  const handleOpenHistorial = async () => {
    setLoadingHistorial(true);
    setHistorialModalOpen(true);
    try {
      const data = await adminService.getCajaMovimientos();
      setHistorialCaja(data);
    } catch (err) {
      toast.error('Error', 'No se pudo cargar el historial de caja.');
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Liquidación y emisión de comprobante
  const handleEmitInvoice = async (withPdf: boolean) => {
    if (cart.length === 0) {
      toast.error('Carrito Vacío', 'Agregue al menos un servicio o producto para registrar la venta.');
      return;
    }

    if (paymentMethod === 'EFECTIVO' && amountReceived < total) {
      toast.error('Monto Insuficiente', `El efectivo recibido (S/ ${amountReceived.toFixed(2)}) no cubre el total (S/ ${total.toFixed(2)}).`);
      return;
    }

    setSubmittingSale(true);
    try {
      const itemsSummary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
      const clientLabel = clientName ? `${clientName} (DNI ${clientDni || 'N/A'})` : 'Cliente Mostrador';
      const associatedCitaId = todayCita?.id || cart.find(i => i.citaId)?.citaId;

      const createdMov = await adminService.createCajaMovimiento({
        tipo: 'INGRESO',
        concepto: `Venta POS - ${clientLabel}: ${itemsSummary}`.substring(0, 190),
        monto: parseFloat(total.toFixed(2)),
        metodo_pago: paymentMethod,
        cita: associatedCitaId,
        descripcion: `Atención en Mostrador. Ficha: ${historyCode || 'N/A'}. Cupón: ${couponApplied ? couponCode : 'Ninguno'}. Vuelto: S/ ${change.toFixed(2)}`
      });

      // Actualizar a ATENDIDA todas las citas cobradas en el carrito
      const citasInCart = Array.from(new Set(
        cart.filter(i => i.citaId).map(i => i.citaId as number)
      ));
      if (associatedCitaId && !citasInCart.includes(associatedCitaId)) {
        citasInCart.push(associatedCitaId);
      }

      for (const cId of citasInCart) {
        await adminService.updateCitaEstado(cId, 'ATENDIDA').catch((e) => {
          console.error(`Error actualizando estado de cita #${cId} a ATENDIDA:`, e);
        });
      }

      // Descuento de stock en kárdex para productos vendidos
      for (const item of cart) {
        if (item.type === 'PRODUCTO' && item.productoId) {
          await adminService.registrarMovimientoManual({
            producto_id: item.productoId,
            tipo: 'SALIDA_CONSUMO_SERVICIO',
            cantidad: item.quantity,
            costo_unitario: item.price,
            descripcion: `Venta POS en caja a ${clientLabel}`
          }).catch(() => {});
        }
      }

      setLastCompletedSale({
        movimientoId: createdMov?.id,
        citaId: associatedCitaId,
        citasCount: citasInCart.length,
        codigoReserva: todayCita?.codigo_reserva,
        clientName: clientName || 'Cliente Mostrador',
        clientDni: clientDni,
        total: total,
        paymentMethod: paymentMethod,
        amountReceived: amountReceived,
        change: change,
        itemsSummary: itemsSummary
      });

      setIsCompleted(true);

      if (withPdf) {
        try {
          if (createdMov?.id) {
            await downloadPdf(
              `/admin/caja/${createdMov.id}/pdf/`,
              `Boleta_Venta_POS_${createdMov.id}.pdf`
            );
          } else if (associatedCitaId) {
            await downloadPdf(
              `/admin/citas/${associatedCitaId}/pdf/`,
              `Boleta_Sumaq_${todayCita?.codigo_reserva || associatedCitaId}.pdf`
            );
          }
          toast.success('Boleta Emitida y Descargada', `Cobro de S/ ${total.toFixed(2)} registrado y boleta generada exitosamente.`);
        } catch (pdfErr) {
          console.error('Error generando PDF:', pdfErr);
          toast.warning('Venta Registrada', 'El cobro se registró en caja. Puede descargarlo desde el botón de la pantalla.');
        }
      } else {
        toast.success('Venta Registrada', `Total cobrado: S/ ${total.toFixed(2)} asentado en caja chica.`);
      }
    } catch (err: any) {
      toast.error('Error al registrar venta', err.response?.data?.error?.message || err.message || 'Error en el servidor de caja.');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Reiniciar formulario para una nueva venta limpia
  const handleResetSale = () => {
    setIsCompleted(false);
    setLastCompletedSale(null);
    setCart([]);
    setClientDni('');
    setClientName('');
    setClientPhone('');
    setHistoryCode('');
    setSelectedCliente(null);
    setTodayCita(null);
    setClientPendingCitas([]);
    setClientSearched(false);
    setCouponApplied(false);
    setCouponCode('');
    setDiscountPercent(0);
    setAmountReceived(0);
    toast.info('Nueva Venta', 'Formulario de caja listo para un nuevo cliente.');
  };

  // Filtros de búsqueda en modales
  const filteredServicios = useMemo(() => {
    if (!serviceSearchTerm.trim()) return serviciosList;
    const term = serviceSearchTerm.toLowerCase();
    return serviciosList.filter(s => s.nombre.toLowerCase().includes(term));
  }, [serviciosList, serviceSearchTerm]);

  const filteredProductos = useMemo(() => {
    if (!productSearchTerm.trim()) return productosList;
    const term = productSearchTerm.toLowerCase();
    return productosList.filter(p => p.nombre.toLowerCase().includes(term));
  }, [productosList, productSearchTerm]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#F3ECE4] rounded-lg text-[#8C6F55]">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif text-[#2C2725]">Punto de Venta / Caja Chica</h1>
          </div>
          <p className="text-xs text-[#7A7067] mt-1">
            {shift} · {cashier}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleOpenHistorial}
            className="px-3.5 py-2 text-xs font-medium text-[#5A5047] bg-[#F7F4F0] hover:bg-[#EFEAE2] rounded-xl border border-[#E0D8CE] flex items-center gap-2 transition cursor-pointer"
          >
            <History className="w-4 h-4" />
            Historial del Día
          </button>
          <button 
            type="button"
            onClick={handleResetSale}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#8C6F55] hover:bg-[#785E47] rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nueva Venta
          </button>
        </div>
      </div>

      {isCompleted ? (
        <div className="bg-white p-10 rounded-2xl border border-[#EBE4DC] shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif text-[#2C2725]">Transacción Completada con Éxito</h2>
          <p className="text-sm text-[#7A7067]">
            Comprobante registrado para <strong>{clientName || 'Cliente Mostrador'}</strong> {historyCode ? `(${historyCode})` : ''}.
          </p>
          <div className="p-4 bg-[#FBF9F7] rounded-xl border border-[#EBE4DC] text-left text-xs space-y-1">
            <p><strong>Monto Total Cobrado:</strong> S/ {total.toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> {paymentMethod}</p>
            {paymentMethod === 'EFECTIVO' && (
              <>
                <p><strong>Monto Recibido:</strong> S/ {amountReceived.toFixed(2)}</p>
                <p><strong>Vuelto Entregado:</strong> S/ {change.toFixed(2)}</p>
              </>
            )}
            {lastCompletedSale?.citasCount && lastCompletedSale.citasCount > 0 ? (
              <p className="text-emerald-700 font-semibold pt-1">
                ✓ {lastCompletedSale.citasCount === 1 
                    ? `Estado de Cita #${lastCompletedSale.codigoReserva || ''} actualizado a ATENDIDA en Agenda.` 
                    : `${lastCompletedSale.citasCount} Citas actualizadas a ATENDIDAS en Agenda.`}
              </p>
            ) : todayCita ? (
              <p className="text-emerald-700 font-semibold pt-1">
                ✓ Estado de Cita #{todayCita.codigo_reserva} actualizado a ATENDIDA en Agenda.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            {lastCompletedSale?.movimientoId && (
              <button
                type="button"
                onClick={() => downloadPdf(`/admin/caja/${lastCompletedSale.movimientoId}/pdf/`, `Boleta_Venta_POS_${lastCompletedSale.movimientoId}.pdf`)}
                className="px-5 py-2.5 bg-[#8C6F55] text-white hover:bg-[#785E47] text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                Descargar Boleta de Venta POS PDF
              </button>
            )}
            {lastCompletedSale?.citaId && (
              <button
                type="button"
                onClick={() => downloadPdf(`/admin/citas/${lastCompletedSale.citaId}/pdf/`, `Comprobante_Cita_${lastCompletedSale.codigoReserva || lastCompletedSale.citaId}.pdf`)}
                className="px-5 py-2.5 bg-white border border-[#DFD0C0] text-[#543F30] hover:bg-[#FAF8F5] text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                Ver Comprobante de Cita
              </button>
            )}
            <button
              type="button"
              onClick={handleResetSale}
              className="px-5 py-2.5 bg-[#8C6F55] text-white text-xs font-semibold rounded-xl hover:bg-[#785E47] transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Iniciar Siguiente Venta
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main sale details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client Card with Real Search */}
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#2C2725] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#8C6F55]" />
                  Identificación del Cliente & Ficha Clínica
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setNewClientDni(clientDni);
                    setNewClientModalOpen(true);
                  }}
                  className="text-xs text-[#8C6F55] hover:text-[#785E47] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Registrar Cliente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                {/* DNI with dedicated search button */}
                <div className="md:col-span-5">
                  <label className="block text-[#7A7067] mb-1 font-medium">DNI / Documento *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={12}
                      value={clientDni}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setClientDni(val);
                        if (val.length === 8) {
                          handleSearchClient(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchClient();
                        }
                      }}
                      placeholder="Ej: 72345678"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D8CE] rounded-lg text-[#2C2725] font-mono focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                    />
                    <button
                      type="button"
                      disabled={isSearchingClient}
                      onClick={() => handleSearchClient()}
                      className="px-3.5 py-2 bg-[#8C6F55] hover:bg-[#785E47] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                      title="Consultar ficha de cliente en base de datos"
                    >
                      {isSearchingClient ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Consultar Ficha</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-[#A89D91] mt-0.5 block">
                    Digite 8 dígitos y pulse Consultar Ficha
                  </span>
                </div>

                {/* Nombre Completo */}
                <div className="md:col-span-4">
                  <label className="block text-[#7A7067] mb-1 font-medium">Nombre Completo</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Cliente Mostrador o Nombre"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D8CE] rounded-lg text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                  />
                  {clientPhone && (
                    <span className="text-[10px] text-[#7A7067] mt-0.5 block">
                      Tel: {clientPhone}
                    </span>
                  )}
                </div>

                {/* Nº Historia Clínica Dinámica */}
                <div className="md:col-span-3">
                  <label className="block text-[#7A7067] mb-1 font-medium">Nº Historia Clínica</label>
                  <div className="flex items-center gap-2">
                    <span className="w-full px-3 py-2 bg-[#F3ECE4] border border-[#E0D8CE] rounded-lg font-mono font-bold text-[#8C6F55]">
                      {historyCode || (clientSearched ? 'HC-NUEVO' : 'HC- ----')}
                    </span>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                      selectedCliente
                        ? (isClientActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedCliente ? (isClientActive ? 'ACTIVA' : 'INACTIVA') : 'MOSTRADOR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de consulta rápida de clientes demo */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#F0EAE2] flex-wrap text-[11px]">
                <span className="text-[#8C6F55] font-semibold">Consultas de prueba rápidas:</span>
                <button
                  type="button"
                  onClick={() => { setClientDni('72345678'); handleSearchClient('72345678'); }}
                  className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F3ECE4] border border-[#DFD0C0] rounded-lg text-[#543F30] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3 h-3 text-[#8C6F55]" />
                  72345678 (Juan Pérez - Cita Programada)
                </button>
                <button
                  type="button"
                  onClick={() => { setClientDni('45678901'); handleSearchClient('45678901'); }}
                  className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F3ECE4] border border-[#DFD0C0] rounded-lg text-[#543F30] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3 h-3 text-[#8C6F55]" />
                  45678901 (Carlos Mendoza)
                </button>
                <button
                  type="button"
                  onClick={() => { setClientDni('70987654'); handleSearchClient('70987654'); }}
                  className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F3ECE4] border border-[#DFD0C0] rounded-lg text-[#543F30] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3 h-3 text-[#8C6F55]" />
                  70987654 (Ana Lucía Torres)
                </button>
              </div>

              {/* Banner: Citas pendientes detectadas del cliente */}
              {clientPendingCitas.length > 0 && (
                <div className="mt-3 space-y-2.5 pt-2 border-t border-[#F0EAE2]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#543F30] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8C6F55]" />
                      Citas Pendientes de Atención ({clientPendingCitas.length})
                    </p>
                    {clientPendingCitas.length > 1 && (
                      <span className="text-[10px] bg-[#EFEAE2] text-[#6B5A4B] px-2 py-0.5 rounded-full font-medium">
                        Programadas en días distintos
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {clientPendingCitas.map((cita) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isToday = cita.fecha === todayStr;
                      const isInCart = cart.some(i => i.citaId === cita.id);
                      const price = typeof cita.monto_total === 'number'
                        ? cita.monto_total
                        : parseFloat(cita.monto_total?.toString() || cita.servicio?.precio_publico?.toString() || '0');

                      return (
                        <div
                          key={cita.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                            isInCart
                              ? 'bg-[#F4F9F6] border-[#CDE5D8]'
                              : 'bg-[#FAF8F5] border-[#E8DFD5] hover:border-[#D5C6B7]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${
                              isToday
                                ? 'bg-[#E1F1E8] text-[#24634B]'
                                : 'bg-[#EFEAE2] text-[#8C6F55]'
                            }`}>
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[#2C2725]">
                                  #{cita.codigo_reserva} &middot; {cita.servicio?.nombre}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  PRE-PAGADA ONLINE
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isToday
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isToday ? 'HOY' : cita.fecha}
                                </span>
                                <span className="text-[11px] font-mono text-[#8C6F55] font-semibold">
                                  Saldo Base: S/ 0.00
                                </span>
                              </div>
                              <p className="text-[11px] text-[#7A7067] truncate">
                                Hora: {cita.hora_inicio?.slice(0, 5)} &middot; Terapeuta: {cita.terapeuta?.nombre_completo || 'No asignado'} &middot; Pagado con: {cita.metodo_pago}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {isInCart ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-lg flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                En Detalle
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickCompleteCita(cita.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition cursor-pointer"
                                  title="Marcar cita como atendida sin consumos adicionales"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Atender (Sin Extras)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLoadCitaToCart(cita)}
                                  className="px-2.5 py-1.5 bg-white border border-[#DFD0C0] text-[#7A7067] hover:bg-[#F3ECE4] text-[11px] font-medium rounded-lg flex items-center gap-1 transition cursor-pointer"
                                  title="Cobrar tratamiento base en mostrador si no fue pagado online"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Cobrar Base
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sale Items Table */}
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#2C2725] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#8C6F55]" />
                  Detalle del Servicio y Productos Adicionales
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceSearchTerm('');
                      setServiceModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-[#F3ECE4] text-[#8C6F55] hover:bg-[#EBE2D7] rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    + Servicio Extra
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearchTerm('');
                      setProductModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-[#F3ECE4] text-[#8C6F55] hover:bg-[#EBE2D7] rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    + Producto Extra
                  </button>
                </div>
              </div>

              {/* Barra de tratamientos frecuentes para cobro rápido en 1 clic */}
              {serviciosList.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap py-2 border-y border-[#F0EAE2] bg-[#FAF8F5]/80 px-3 rounded-xl text-xs">
                  <span className="text-[#8C6F55] font-semibold text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Tratamientos Rápidos:
                  </span>
                  {serviciosList.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectService(s)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F3ECE4] border border-[#DFD0C0] hover:border-[#8C6F55] rounded-lg text-[11px] font-medium text-[#2C2725] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-[#8C6F55]" />
                      <span>{s.nombre}</span>
                      <span className="font-bold text-[#8C6F55]">S/ {parseFloat(s.precio_publico.toString()).toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-10 border-2 border-dashed border-[#EBE4DC] rounded-2xl text-center space-y-3 bg-[#FAF8F5]/40 px-4">
                  <div className="w-12 h-12 rounded-full bg-[#F3ECE4] flex items-center justify-center mx-auto text-[#8C6F55]">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#543F30] font-semibold">El carrito de cobro aún no tiene ítems agregados</p>
                    <p className="text-[11px] text-[#A89D91] mt-0.5">
                      Consulta un cliente con cita arriba, o haz clic en un tratamiento rápido para comenzar:
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 flex-wrap pt-2">
                    {serviciosList.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectService(s)}
                        className="px-3.5 py-2 bg-[#8C6F55] hover:bg-[#785E47] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar {s.nombre} (S/ {parseFloat(s.precio_publico.toString()).toFixed(0)})
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF8F5] text-[#7A7067] font-semibold border-y border-[#EBE4DC]">
                      <tr>
                        <th className="py-2.5 px-3">Ítem / Concepto</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3 text-right">P. Unit (S/)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal (S/)</th>
                        <th className="py-2.5 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EAE2]">
                      {cart.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF8F5]">
                          <td className="py-3 px-3 font-medium text-[#2C2725]">
                            {item.name}
                            {item.citaId && (
                              <span className="ml-2 text-[10px] text-[#24634B] bg-[#EFF8F4] px-1.5 py-0.5 rounded font-mono font-bold">
                                VINCULADO A AGENDA
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.type === 'SERVICIO' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono">{item.price.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#2C2725]">
                            {(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              aria-label={`Eliminar ${item.name} del carrito`}
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Coupon Engine */}
              <div className="pt-3 border-t border-[#EBE4DC] flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Tag className="w-4 h-4 text-[#8C6F55]" />
                  <span className="text-xs font-semibold text-[#5A5047]">Cupón Promocional:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <input
                    aria-label="Código de cupón promocional"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ej: SUMAQBIENVENIDA"
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E0D8CE] rounded-lg text-xs font-mono uppercase flex-1 text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 bg-[#8C6F55] text-white text-xs font-medium rounded-lg hover:bg-[#785E47] transition cursor-pointer"
                  >
                    Aplicar
                  </button>
                  {couponApplied && (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponApplied(false);
                        setDiscountPercent(0);
                        setCouponCode('');
                        toast.info('Cupón Quitado', 'Se restableció el importe sin descuento.');
                      }}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {couponApplied && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Checkout sidebar (Right col) */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-[#2C2725] border-b border-[#EBE4DC] pb-2">
                Liquidación & Cobro
              </h2>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-xs text-[#5A5047]">
                <div className="flex justify-between">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono">S/ {subtotal.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Descuento ({discountPercent}%):</span>
                    <span className="font-mono">- S/ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8C8278]">
                  <span>IGV Incluido (18%):</span>
                  <span className="font-mono">S/ {igv.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-[#EBE4DC] flex justify-between items-center">
                  <span className="text-sm font-bold text-[#2C2725]">TOTAL A PAGAR:</span>
                  <span className="text-xl font-serif font-bold text-[#8C6F55]">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-[#EBE4DC]">
                <label className="block text-xs font-semibold text-[#2C2725]">
                  Método de Pago:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TARJETA', label: 'Tarjeta POS', icon: CreditCard },
                    { id: 'YAPE', label: 'Yape QR', icon: QrCode },
                    { id: 'PLIN', label: 'Plin QR', icon: QrCode }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-[#8C6F55] bg-[#F3ECE4] text-[#8C6F55] font-bold shadow-sm'
                            : 'border-[#E0D8CE] bg-[#FAF8F5] text-[#7A7067] hover:bg-[#F2ECE4]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Payment Details */}
              {paymentMethod === 'EFECTIVO' ? (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E0D8CE] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <label htmlFor="efectivo-recibido-pos" className="font-semibold text-[#2C2725]">Efectivo Recibido:</label>
                    <input
                      id="efectivo-recibido-pos"
                      aria-label="Monto de efectivo recibido en soles"
                      type="number"
                      step="any"
                      value={amountReceived || ''}
                      onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-white border border-[#D5CCC2] rounded font-mono text-right font-bold text-[#2C2725] focus:outline-none focus:ring-1 focus:ring-[#8C6F55]"
                    />
                  </div>
                  {/* Quick buttons */}
                  <div className="flex gap-1.5 justify-end flex-wrap">
                    {[50, 100, 150, 200, 250, 300].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmountReceived(val)}
                        className="px-2 py-1 bg-white border border-[#D5CCC2] rounded text-[11px] font-bold text-[#5A5047] hover:bg-[#F2ECE4] transition cursor-pointer"
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#EBE4DC]">
                    <span className="font-bold text-emerald-800">VUELTO / CAMBIO:</span>
                    <span className={`text-sm font-mono font-bold ${change >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      S/ {change.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E0D8CE] text-center space-y-2">
                  <div className="w-24 h-24 bg-white p-2 border border-[#D5CCC2] rounded-lg mx-auto flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-[#8C6F55]" />
                  </div>
                  <p className="text-[11px] text-[#7A7067]">
                    Escanee el código QR dinámico desde la App de <strong>{paymentMethod}</strong> por el monto exacto de <strong>S/ {total.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={submittingSale || cart.length === 0}
                  onClick={() => handleEmitInvoice(true)}
                  className="w-full py-3 bg-[#8C6F55] text-white text-xs font-bold rounded-xl hover:bg-[#785E47] transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  {submittingSale ? 'Registrando Venta...' : 'Emitir Boleta y Cobrar'}
                </button>
                <button
                  type="button"
                  disabled={submittingSale || cart.length === 0}
                  onClick={() => handleEmitInvoice(false)}
                  className="w-full py-2.5 bg-[#FAF8F5] text-[#5A5047] text-xs font-semibold rounded-xl border border-[#E0D8CE] hover:bg-[#F0EAE2] transition text-center cursor-pointer disabled:opacity-50"
                >
                  Registrar sin Comprobante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECCIONAR SERVICIO EXTRA (CATÁLOGO REAL) */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title="Catálogo de Servicios y Tratamientos"
        subtitle="Seleccione un servicio de la carta para incluir en la venta"
      >
        <div className="space-y-4 text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar servicio por nombre..."
              value={serviceSearchTerm}
              onChange={(e) => setServiceSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#E0D8CE] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
            <Search className="w-4 h-4 text-[#8C6F55] absolute left-2.5 top-2.5" />
          </div>

          {loadingCatalogs ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredServicios.length === 0 ? (
            <p className="text-center text-[#7A7067] py-6">No se encontraron servicios disponibles.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredServicios.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-[#FAF8F5] hover:bg-[#F3ECE4] border border-[#EBE4DC] rounded-xl flex items-center justify-between transition cursor-pointer"
                  onClick={() => handleSelectService(s)}
                >
                  <div>
                    <p className="font-semibold text-[#2C2725]">{s.nombre}</p>
                    <p className="text-[11px] text-[#7A7067] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {s.duracion_min} minutos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#8C6F55]">
                      S/ {parseFloat(s.precio_publico.toString()).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      + Agregar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL: SELECCIONAR PRODUCTO EXTRA (INVENTARIO REAL) */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Catálogo de Productos e Insumos"
        subtitle="Seleccione un producto disponible en almacén para la venta"
      >
        <div className="space-y-4 text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#E0D8CE] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
            <Search className="w-4 h-4 text-[#8C6F55] absolute left-2.5 top-2.5" />
          </div>

          {loadingCatalogs ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProductos.length === 0 ? (
            <p className="text-center text-[#7A7067] py-6">No se encontraron productos activos en stock.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredProductos.map((p) => {
                const stock = parseFloat(p.stock_actual.toString());
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-[#FAF8F5] hover:bg-[#F3ECE4] border border-[#EBE4DC] rounded-xl flex items-center justify-between transition cursor-pointer"
                    onClick={() => handleSelectProduct(p)}
                  >
                    <div>
                      <p className="font-semibold text-[#2C2725]">{p.nombre}</p>
                      <p className="text-[11px] text-[#7A7067] flex items-center gap-1 mt-0.5">
                        Stock disponible: <strong>{stock} {p.unidad_medida}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#8C6F55]">
                        S/ {parseFloat(p.costo_unitario.toString()).toFixed(2)}
                      </p>
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        + Agregar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL: REGISTRO RÁPIDO DE CLIENTE */}
      <Modal
        isOpen={newClientModalOpen}
        onClose={() => setNewClientModalOpen(false)}
        title="Alta Rápida de Cliente"
        subtitle="Crea la ficha de cliente e historia clínica inmediatamente"
      >
        <form onSubmit={handleQuickCreateClient} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#5A5047] font-semibold mb-1">DNI / Documento *</label>
            <input
              type="text"
              required
              maxLength={12}
              value={newClientDni}
              onChange={(e) => setNewClientDni(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 72345678"
              className="w-full px-3 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block text-[#5A5047] font-semibold mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={newClientNombre}
              onChange={(e) => setNewClientNombre(e.target.value)}
              placeholder="Ej: Juan Carlos Pérez"
              className="w-full px-3 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block text-[#5A5047] font-semibold mb-1">Teléfono / WhatsApp</label>
            <input
              type="tel"
              value={newClientTelefono}
              onChange={(e) => setNewClientTelefono(e.target.value)}
              placeholder="Ej: 987654321"
              className="w-full px-3 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewClientModalOpen(false)}
              className="px-4 py-2 border border-[#DFD0C0] text-[#5A5047] rounded-xl hover:bg-[#F0EAE2] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingNewClient}
              className="px-4 py-2 bg-[#8C6F55] text-white rounded-xl hover:bg-[#785E47] transition cursor-pointer font-semibold disabled:opacity-50"
            >
              {submittingNewClient ? 'Guardando...' : 'Crear Ficha y Asignar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: HISTORIAL DE CAJA */}
      <Modal
        isOpen={historialModalOpen}
        onClose={() => setHistorialModalOpen(false)}
        title="Historial de Movimientos de Caja"
        subtitle="Asientos contables e ingresos en tiempo real"
      >
        <div className="space-y-4 text-xs">
          {loadingHistorial ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : historialCaja.length === 0 ? (
            <p className="text-center text-[#7A7067] py-8">No hay movimientos registrados en caja.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-[#E0D8CE] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#5A5047] border-b border-[#E0D8CE] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center">Boleta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D8CE]">
                  {historialCaja.map((m) => (
                    <tr key={m.id} className="hover:bg-[#FDFBF7]">
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.tipo === 'INGRESO' ? 'bg-[#EFF8F4] text-[#24634B]' : 'bg-[#FDF2F4] text-[#9B2C1C]'
                        }`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-[#2C2725]">{m.concepto}</p>
                        <p className="text-[10px] text-[#8C6F55]">{new Date(m.fecha_registro).toLocaleString('es-PE')}</p>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#5A5047]">{m.metodo_pago}</td>
                      <td className={`p-3 text-right font-bold ${
                        m.tipo === 'INGRESO' ? 'text-[#24634B]' : 'text-[#9B2C1C]'
                      }`}>
                        {m.tipo === 'INGRESO' ? '+' : '-'} S/ {parseFloat(m.monto.toString()).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (m.cita) {
                              downloadPdf(`/admin/citas/${m.cita}/pdf/`, `Boleta_Cita_${m.cita}.pdf`);
                            } else {
                              downloadPdf(`/admin/caja/${m.id}/pdf/`, `Boleta_POS_${m.id}.pdf`);
                            }
                          }}
                          className="p-1.5 hover:bg-[#FAF8F5] text-[#8C6F55] rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          title="Descargar Boleta PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium hidden sm:inline">PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setHistorialModalOpen(false)}
              className="px-4 py-2 bg-[#8C6F55] text-white text-xs font-semibold rounded-xl hover:bg-[#785E47] transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
