import {
  Cabina,
  Terapeuta,
  Producto,
  Servicio,
  Promocion,
  Cliente,
  Cita,
  MovimientoInventario,
  MovimientoCaja,
  User,
  SlotDisponibilidad,
  DashboardData,
  ReporteData,
  FichaAtencion
} from '../types/models';

// Default Seed Data
export const MOCK_CABINAS: Cabina[] = [
  {
    id: 1,
    nombre: 'Cabina 1',
    tipo: 'Holística',
    descripcion: 'Masajes relajantes y terapéuticos con aromaterapia y música binaural.',
    activa: true,
  },
  {
    id: 2,
    nombre: 'Cabina 2',
    tipo: 'Dermoestética',
    descripcion: 'Tratamientos y limpiezas faciales profundas con aparatología avanzada.',
    activa: true,
  },
  {
    id: 3,
    nombre: 'Cabina 3',
    tipo: 'Hidroterapia',
    descripcion: 'Envolturas corporales, exfoliaciones y sales de baño minerales relajantes.',
    activa: true,
  },
];

export const MOCK_TERAPEUTAS: Terapeuta[] = [
  {
    id: 1,
    nombre_completo: 'Elena Morales',
    email: 'elena.morales@sumaqspa.pe',
    especialidad: 'Terapias Holísticas y Masajes Descontracturantes',
    cabina: MOCK_CABINAS[0],
    cabina_id: 1,
    foto_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600',
    activo: true,
  },
  {
    id: 2,
    nombre_completo: 'Camila Vega',
    email: 'camila.vega@sumaqspa.pe',
    especialidad: 'Dermoestética y Cosmiatría Facial Avanzada',
    cabina: MOCK_CABINAS[1],
    cabina_id: 2,
    foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
    activo: true,
  },
  {
    id: 3,
    nombre_completo: 'Lucía Ramos',
    email: 'lucia.ramos@sumaqspa.pe',
    especialidad: 'Hidroterapia, Exfoliaciones y Rituales Corporales',
    cabina: MOCK_CABINAS[2],
    cabina_id: 3,
    foto_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600',
    activo: true,
  },
];

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: 'Aceite Esencial de Lavanda',
    descripcion: 'Aceite botánico 100% puro para masajes relajantes y aromaterapia.',
    costo_unitario: '18.00',
    stock_actual: '28.00',
    stock_minimo_alerta: '5.00',
    unidad_medida: 'frascos (100ml)',
    estado_stock: 'NORMAL',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Crema Hidratante Dermo Facial',
    descripcion: 'Fórmula hidratante con ácido hialurónico para todo tipo de piel.',
    costo_unitario: '22.50',
    stock_actual: '24.00',
    stock_minimo_alerta: '5.00',
    unidad_medida: 'potes (250gr)',
    estado_stock: 'NORMAL',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Exfoliante Corporal Botánico',
    descripcion: 'Exfoliante de microgránulos de albaricoque y sales del mar muerto.',
    costo_unitario: '25.00',
    stock_actual: '4.00',
    stock_minimo_alerta: '5.00',
    unidad_medida: 'frascos (300gr)',
    estado_stock: 'BAJO',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Mascarilla Facial Revitalizante',
    descripcion: 'Mascarilla con colágeno y vitamina C en sobres individuales.',
    costo_unitario: '15.00',
    stock_actual: '2.00',
    stock_minimo_alerta: '5.00',
    unidad_medida: 'sobres',
    estado_stock: 'CRITICO',
    activo: true,
  },
  {
    id: 5,
    nombre: 'Sales de Baño Minerales',
    descripcion: 'Sales minerales aromatizadas con eucalipto para hidroterapia.',
    costo_unitario: '12.00',
    stock_actual: '32.00',
    stock_minimo_alerta: '5.00',
    unidad_medida: 'bolsas (500gr)',
    estado_stock: 'NORMAL',
    activo: true,
  },
];

export const MOCK_SERVICIOS: Servicio[] = [
  {
    id: 1,
    nombre: 'Masaje Relajante',
    descripcion: 'Masaje corporal antiestrés con aceites esenciales botánicos y técnicas de relajación profunda.',
    precio_publico: '120.00',
    duracion_min: 60,
    imagen_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    activo: true,
    recetas: [
      {
        id: 1,
        producto: 1,
        producto_nombre: 'Aceite Esencial de Lavanda',
        unidad_medida: 'frascos (100ml)',
        costo_unitario: '18.00',
        cantidad_requerida: '1.00',
      },
      {
        id: 2,
        producto: 2,
        producto_nombre: 'Crema Hidratante Dermo Facial',
        unidad_medida: 'potes (250gr)',
        costo_unitario: '22.50',
        cantidad_requerida: '1.00',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Limpieza Facial Profunda',
    descripcion: 'Tratamiento dermoestético con exfoliación, vapor de ozono, extracción y mascarilla revitalizante.',
    precio_publico: '150.00',
    duracion_min: 60,
    imagen_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',
    activo: true,
    recetas: [
      {
        id: 3,
        producto: 4,
        producto_nombre: 'Mascarilla Facial Revitalizante',
        unidad_medida: 'sobres',
        costo_unitario: '15.00',
        cantidad_requerida: '1.00',
      },
      {
        id: 4,
        producto: 2,
        producto_nombre: 'Crema Hidratante Dermo Facial',
        unidad_medida: 'potes (250gr)',
        costo_unitario: '22.50',
        cantidad_requerida: '1.00',
      },
    ],
  },
  {
    id: 3,
    nombre: 'Envoltura Corporal & Hidroterapia',
    descripcion: 'Inmersión relajante con sales marinas aromáticas y envoltura desintoxicante con exfoliación corporal.',
    precio_publico: '180.00',
    duracion_min: 60,
    imagen_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800',
    activo: true,
    recetas: [
      {
        id: 5,
        producto: 3,
        producto_nombre: 'Exfoliante Corporal Botánico',
        unidad_medida: 'frascos (300gr)',
        costo_unitario: '25.00',
        cantidad_requerida: '1.00',
      },
      {
        id: 6,
        producto: 5,
        producto_nombre: 'Sales de Baño Minerales',
        unidad_medida: 'bolsas (500gr)',
        costo_unitario: '12.00',
        cantidad_requerida: '1.00',
      },
    ],
  },
];

export const MOCK_PROMOCIONES: Promocion[] = [
  {
    id: 1,
    titulo: 'Bienvenida Sumaq Spa',
    descripcion: '20% de descuento en tu primera reserva online.',
    codigo_cupon: 'SUMAQBIENVENIDA',
    porcentaje_descuento: '20.00',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    activo: true,
  },
  {
    id: 2,
    titulo: 'Día de Relajación',
    descripcion: '15% de descuento en todos nuestros tratamientos y masajes.',
    codigo_cupon: 'RELAXDAY',
    porcentaje_descuento: '15.00',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    activo: true,
  },
];

export const MOCK_CLIENTES: Cliente[] = [
  {
    id: 1,
    dni: '72345678',
    nombre_completo: 'María García Ramos',
    telefono: '987654321',
    email: 'maria.garcia@gmail.com',
    activo: true,
  },
  {
    id: 2,
    dni: '45678901',
    nombre_completo: 'Carlos Mendoza Silva',
    telefono: '912345678',
    email: 'carlos.mendoza@hotmail.com',
    activo: true,
  },
  {
    id: 3,
    dni: '70987654',
    nombre_completo: 'Ana Lucía Torres',
    telefono: '998877665',
    email: 'ana.torres@outlook.com',
    activo: true,
  },
];

const todayStr = new Date().toISOString().split('T')[0];

export const MOCK_CITAS: Cita[] = [
  {
    id: 1,
    codigo_reserva: `SQ-${todayStr.replace(/-/g, '')}-0042`,
    cliente: MOCK_CLIENTES[0],
    servicio: MOCK_SERVICIOS[0],
    terapeuta: MOCK_TERAPEUTAS[0],
    cabina: MOCK_CABINAS[0],
    fecha: todayStr,
    hora_inicio: '09:00:00',
    hora_fin: '10:00:00',
    estado: 'PENDIENTE',
    subtotal: '120.00',
    descuento: '24.00',
    monto_total: '96.00',
    metodo_pago: 'EFECTIVO',
    codigo_cupon_aplicado: 'SUMAQBIENVENIDA',
    ficha_atencion: {
      id: 1,
      tipo_piel: 'Piel Sensible y Reactiva',
      alergias_conocidas: 'Alergia a parabenos y fragancias sintéticas fuertes.',
      notas_terapeuta: 'Paciente refiere tensión muscular cervical. Se aplicará aceite esencial de lavanda tibio.',
      servicios_adicionales: [],
      fecha_registro: `${todayStr}T09:05:00Z`,
      updated_at: `${todayStr}T09:05:00Z`,
    },
    created_at: `${todayStr}T08:00:00Z`,
  },
  {
    id: 2,
    codigo_reserva: `SQ-${todayStr.replace(/-/g, '')}-0043`,
    cliente: MOCK_CLIENTES[1],
    servicio: MOCK_SERVICIOS[1],
    terapeuta: MOCK_TERAPEUTAS[1],
    cabina: MOCK_CABINAS[1],
    fecha: todayStr,
    hora_inicio: '11:00:00',
    hora_fin: '12:00:00',
    estado: 'ATENDIDA',
    subtotal: '150.00',
    descuento: '0.00',
    monto_total: '150.00',
    metodo_pago: 'TARJETA',
    created_at: `${todayStr}T08:30:00Z`,
  },
  {
    id: 3,
    codigo_reserva: `SQ-${todayStr.replace(/-/g, '')}-0044`,
    cliente: MOCK_CLIENTES[2],
    servicio: MOCK_SERVICIOS[2],
    terapeuta: MOCK_TERAPEUTAS[2],
    cabina: MOCK_CABINAS[2],
    fecha: todayStr,
    hora_inicio: '14:00:00',
    hora_fin: '15:00:00',
    estado: 'PENDIENTE',
    subtotal: '180.00',
    descuento: '27.00',
    monto_total: '153.00',
    metodo_pago: 'YAPE',
    codigo_cupon_aplicado: 'RELAXDAY',
    created_at: `${todayStr}T08:45:00Z`,
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: 'admin@sumaqspa.pe',
    nombre_completo: 'Administrador General Sumaq',
    rol: 'ADMIN',
    activo: true,
  },
  {
    id: 2,
    email: 'recepcion@sumaqspa.pe',
    nombre_completo: 'Valeria Quispe',
    rol: 'RECEPCIONISTA',
    activo: true,
  },
  {
    id: 3,
    email: 'elena.morales@sumaqspa.pe',
    nombre_completo: 'Elena Morales',
    rol: 'TERAPEUTA',
    activo: true,
  },
  {
    id: 4,
    email: 'camila.vega@sumaqspa.pe',
    nombre_completo: 'Camila Vega',
    rol: 'TERAPEUTA',
    activo: true,
  },
  {
    id: 5,
    email: 'lucia.ramos@sumaqspa.pe',
    nombre_completo: 'Lucía Ramos',
    rol: 'TERAPEUTA',
    activo: true,
  },
];

export const MOCK_MOVIMIENTOS_INVENTARIO: MovimientoInventario[] = [
  {
    id: 1,
    producto: 1,
    producto_nombre: 'Aceite Esencial de Lavanda',
    unidad_medida: 'frascos (100ml)',
    tipo: 'ENTRADA_COMPRA',
    cantidad: '30.00',
    costo_unitario: '18.00',
    referencia_tipo: 'COMPRA_INICIAL',
    fecha_registro: `${todayStr} 08:00:00`,
    descripcion: 'Compra y abastecimiento inicial de stock',
  },
  {
    id: 2,
    producto: 1,
    producto_nombre: 'Aceite Esencial de Lavanda',
    unidad_medida: 'frascos (100ml)',
    tipo: 'SALIDA_CONSUMO_SERVICIO',
    cantidad: '1.00',
    costo_unitario: '18.00',
    referencia_tipo: 'CITA',
    referencia_id: 1,
    fecha_registro: `${todayStr} 10:00:00`,
    descripcion: 'Consumo automático en cita SQ-20260426-0042',
  },
  {
    id: 3,
    producto: 4,
    producto_nombre: 'Mascarilla Facial Revitalizante',
    unidad_medida: 'sobres',
    tipo: 'SALIDA_CONSUMO_SERVICIO',
    cantidad: '1.00',
    costo_unitario: '15.00',
    referencia_tipo: 'CITA',
    referencia_id: 2,
    fecha_registro: `${todayStr} 12:00:00`,
    descripcion: 'Consumo en atención de limpieza facial',
  },
];

export const MOCK_MOVIMIENTOS_CAJA: MovimientoCaja[] = [
  {
    id: 1,
    tipo: 'INGRESO',
    concepto: 'Cobro de Cita Masaje Relajante (SQ-0042)',
    monto: '96.00',
    metodo_pago: 'EFECTIVO',
    cita: 1,
    fecha_registro: `${todayStr} 10:05:00`,
  },
  {
    id: 2,
    tipo: 'INGRESO',
    concepto: 'Cobro de Cita Limpieza Facial (SQ-0043)',
    monto: '150.00',
    metodo_pago: 'TARJETA',
    cita: 2,
    fecha_registro: `${todayStr} 12:05:00`,
  },
  {
    id: 3,
    tipo: 'INGRESO',
    concepto: 'Cobro de Cita Hidroterapia (SQ-0044)',
    monto: '153.00',
    metodo_pago: 'YAPE',
    cita: 3,
    fecha_registro: `${todayStr} 15:05:00`,
  },
];

// Helper Store to manage in-memory local state
class LocalMockStore {
  servicios = [...MOCK_SERVICIOS];
  cabinas = [...MOCK_CABINAS];
  terapeutas = [...MOCK_TERAPEUTAS];
  productos = [...MOCK_PRODUCTOS];
  promociones = [...MOCK_PROMOCIONES];
  clientes = [...MOCK_CLIENTES];
  citas = [...MOCK_CITAS];
  users = [...MOCK_USERS];
  movimientosInventario = [...MOCK_MOVIMIENTOS_INVENTARIO];
  movimientosCaja = [...MOCK_MOVIMIENTOS_CAJA];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('sumaq_mock_citas', JSON.stringify(this.citas));
      localStorage.setItem('sumaq_mock_productos', JSON.stringify(this.productos));
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    try {
      const storedCitas = localStorage.getItem('sumaq_mock_citas');
      if (storedCitas) {
        this.citas = JSON.parse(storedCitas);
      }
      const storedProds = localStorage.getItem('sumaq_mock_productos');
      if (storedProds) {
        this.productos = JSON.parse(storedProds);
      }
    } catch {
      // ignore
    }
  }

  getDisponibilidad(fecha: string, _servicioId?: number, terapeutaId?: number, cabinaId?: number) {
    const hours = [
      { start: '08:00:00', end: '09:00:00' },
      { start: '09:00:00', end: '10:00:00' },
      { start: '10:00:00', end: '11:00:00' },
      { start: '11:00:00', end: '12:00:00' },
      { start: '12:00:00', end: '13:00:00' },
      { start: '13:00:00', end: '14:00:00' },
      { start: '14:00:00', end: '15:00:00' },
      { start: '15:00:00', end: '16:00:00' },
      { start: '16:00:00', end: '17:00:00' },
    ];

    const terapeuta = this.terapeutas.find((t) => t.id === terapeutaId) || this.terapeutas[0];
    const cabina = this.cabinas.find((c) => c.id === (cabinaId || terapeuta.cabina_id)) || this.cabinas[0];

    const slots: SlotDisponibilidad[] = hours.map((h) => {
      // Check if slot is occupied
      const occupied = this.citas.some(
        (c) =>
          c.fecha === fecha &&
          c.terapeuta.id === terapeuta.id &&
          c.hora_inicio === h.start &&
          c.estado !== 'CANCELADA'
      );

      return {
        hora_inicio: h.start,
        hora_fin: h.end,
        disponible: !occupied,
        terapeuta_id: terapeuta.id,
        terapeuta_nombre: terapeuta.nombre_completo,
        especialidad: terapeuta.especialidad,
        cabina_id: cabina.id,
        cabina_nombre: cabina.nombre,
        cabina_tipo: cabina.tipo,
      };
    });

    return { fecha, slots };
  }

  reservarWeb(payload: any): Cita {
    let cliente = this.clientes.find((c) => c.dni === payload.dni);
    if (!cliente) {
      cliente = {
        id: this.clientes.length + 1,
        dni: payload.dni,
        nombre_completo: payload.nombre_completo,
        telefono: payload.telefono,
        email: payload.email || '',
        activo: true,
      };
      this.clientes.push(cliente);
    }

    const servicio = this.servicios.find((s) => s.id === Number(payload.servicio_id)) || this.servicios[0];
    const terapeuta = this.terapeutas.find((t) => t.id === Number(payload.terapeuta_id)) || this.terapeutas[0];
    const cabina = this.cabinas.find((c) => c.id === Number(payload.cabina_id)) || this.cabinas[0];

    const subtotalNum = Number(servicio.precio_publico);
    let descuentoNum = 0;
    if (payload.codigo_cupon?.toUpperCase() === 'SUMAQBIENVENIDA') {
      descuentoNum = subtotalNum * 0.20;
    } else if (payload.codigo_cupon?.toUpperCase() === 'RELAXDAY') {
      descuentoNum = subtotalNum * 0.15;
    }
    const totalNum = subtotalNum - descuentoNum;

    const [h, m] = payload.hora_inicio.split(':');
    const horaFin = `${String(Number(h) + 1).padStart(2, '0')}:${m}:00`;
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const dateFormatted = payload.fecha.replace(/-/g, '');

    const newCita: Cita = {
      id: this.citas.length + 1,
      codigo_reserva: `SQ-${dateFormatted}-${randCode}`,
      cliente,
      servicio,
      terapeuta,
      cabina,
      fecha: payload.fecha,
      hora_inicio: payload.hora_inicio.length === 5 ? `${payload.hora_inicio}:00` : payload.hora_inicio,
      hora_fin: horaFin,
      estado: 'PENDIENTE',
      subtotal: subtotalNum.toFixed(2),
      descuento: descuentoNum.toFixed(2),
      monto_total: totalNum.toFixed(2),
      metodo_pago: payload.metodo_pago,
      codigo_cupon_aplicado: payload.codigo_cupon || undefined,
      created_at: new Date().toISOString(),
    };

    this.citas.unshift(newCita);
    this.saveToStorage();
    return newCita;
  }

  getDashboard(): DashboardData {
    const revenue = this.citas
      .filter((c) => c.estado === 'ATENDIDA')
      .reduce((acc, c) => acc + Number(c.monto_total), 0) + 399.0;

    const costs = 55.5;
    const profit = revenue - costs;

    return {
      resumen_financiero: {
        ingresos_totales: revenue,
        egresos_totales: 0,
        costo_insumos_total: costs,
        ganancia_operativa: profit,
        ingresos_hoy: 360.0,
        costo_insumos_hoy: 36.0,
        ganancia_operativa_hoy: 324.0,
      },
      operaciones_hoy: {
        citas_totales: this.citas.length + 3,
        citas_pendientes: this.citas.filter((c) => c.estado === 'PENDIENTE').length + 1,
        citas_atendidas: this.citas.filter((c) => c.estado === 'ATENDIDA').length + 2,
        citas_canceladas: this.citas.filter((c) => c.estado === 'CANCELADA').length,
        capacidad_maxima: 27,
        tasa_ocupacion_porcentaje: 74.0,
      },
      alertas: {
        productos_criticos_conteo: this.productos.filter((p) => p.estado_stock !== 'NORMAL').length,
      },
      tendencia_7_dias: [
        { fecha: 'Lun', fecha_iso: '2026-04-20', ingresos: 450, costos: 45, ganancia: 405, citas: 4 },
        { fecha: 'Mar', fecha_iso: '2026-04-21', ingresos: 580, costos: 60, ganancia: 520, citas: 5 },
        { fecha: 'Mié', fecha_iso: '2026-04-22', ingresos: 620, costos: 55, ganancia: 565, citas: 6 },
        { fecha: 'Jue', fecha_iso: '2026-04-23', ingresos: 490, costos: 48, ganancia: 442, citas: 4 },
        { fecha: 'Vie', fecha_iso: '2026-04-24', ingresos: 710, costos: 70, ganancia: 640, citas: 7 },
        { fecha: 'Sáb', fecha_iso: '2026-04-25', ingresos: 850, costos: 80, ganancia: 770, citas: 8 },
        { fecha: 'Dom', fecha_iso: '2026-04-26', ingresos: 920, costos: 95, ganancia: 825, citas: 9 },
      ],
      servicios_populares: [
        { servicio__nombre: 'Masaje Relajante', total: 14 },
        { servicio__nombre: 'Limpieza Facial Profunda', total: 11 },
        { servicio__nombre: 'Envoltura Corporal & Hidroterapia', total: 8 },
      ],
    };
  }
}

export const mockStore = new LocalMockStore();
