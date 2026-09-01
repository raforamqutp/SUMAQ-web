export interface User {
  id: number;
  email: string;
  nombre_completo: string;
  rol: 'ADMIN' | 'RECEPCIONISTA' | 'TERAPEUTA';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: number;
  dni: string;
  nombre_completo: string;
  telefono: string;
  email?: string | null;
  activo: boolean;
  created_at?: string;
}

export interface Cabina {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  activa: boolean;
}

export interface Terapeuta {
  id: number;
  usuario?: User;
  nombre_completo: string;
  email: string;
  especialidad: string;
  cabina?: Cabina;
  cabina_id?: number | null;
  foto_url: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  costo_unitario: string | number;
  stock_actual: string | number;
  stock_minimo_alerta: string | number;
  unidad_medida: string;
  estado_stock: 'NORMAL' | 'BAJO' | 'CRITICO';
  activo: boolean;
  created_at?: string;
}

export interface MovimientoInventario {
  id: number;
  producto: number;
  producto_nombre: string;
  unidad_medida: string;
  tipo: 'ENTRADA_COMPRA' | 'SALIDA_CONSUMO_SERVICIO' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
  cantidad: string | number;
  costo_unitario: string | number;
  referencia_tipo: string;
  referencia_id?: number | null;
  fecha_registro: string;
  descripcion: string;
}

export interface RecetaServicio {
  id: number;
  producto: number;
  producto_nombre: string;
  unidad_medida: string;
  costo_unitario: string | number;
  cantidad_requerida: string | number;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio_publico: string | number;
  duracion_min: number;
  imagen_url: string;
  activo: boolean;
  recetas?: RecetaServicio[];
}

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string;
  codigo_cupon: string;
  porcentaje_descuento: string | number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

export interface ServicioAdicionalAtencion {
  id: number;
  servicio: number;
  servicio_nombre: string;
  cantidad: number;
  precio_unitario_historico: string | number;
  subtotal: string | number;
  created_at: string;
}

export interface FichaAtencion {
  id: number;
  tipo_piel: string;
  alergias_conocidas: string;
  notas_terapeuta: string;
  servicios_adicionales: ServicioAdicionalAtencion[];
  fecha_registro: string;
  updated_at: string;
}

export interface Cita {
  id: number;
  codigo_reserva: string;
  cliente: Cliente;
  servicio: Servicio;
  terapeuta: Terapeuta;
  cabina: Cabina;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA';
  subtotal: string | number;
  descuento: string | number;
  monto_total: string | number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN';
  promocion?: Promocion | null;
  codigo_cupon_aplicado?: string;
  ficha_atencion?: FichaAtencion | null;
  created_at: string;
}

export interface MovimientoCaja {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: string | number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN';
  cita?: number | null;
  fecha_registro: string;
}

export interface SlotDisponibilidad {
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
  terapeuta_id: number;
  terapeuta_nombre: string;
  especialidad: string;
  cabina_id: number;
  cabina_nombre: string;
  cabina_tipo: string;
}

export interface DashboardData {
  resumen_financiero: {
    ingresos_totales: number;
    egresos_totales: number;
    costo_insumos_total: number;
    ganancia_operativa: number;
    ingresos_hoy: number;
    costo_insumos_hoy: number;
    ganancia_operativa_hoy: number;
  };
  operaciones_hoy: {
    citas_totales: number;
    citas_pendientes: number;
    citas_atendidas: number;
    citas_canceladas: number;
    capacidad_maxima: number;
    tasa_ocupacion_porcentaje: number;
  };
  alertas: {
    productos_criticos_conteo: number;
  };
  tendencia_7_dias: Array<{
    fecha: string;
    fecha_iso: string;
    ingresos: number;
    costos: number;
    ganancia: number;
    citas: number;
  }>;
  servicios_populares: Array<{
    servicio__nombre: string;
    total: number;
  }>;
}

export interface ReporteData {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  total_citas: number;
  citas_atendidas: number;
  ingresos: number;
  costo_insumos: number;
  ganancia_operativa: number;
  desglose_terapeutas: Array<{
    terapeuta__usuario__nombre_completo: string;
    terapeuta__especialidad: string;
    citas_count: number;
    ingresos: number | string;
  }>;
}
