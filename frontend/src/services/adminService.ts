import { apiClient } from './api';
import { ApiResponse, ApiPaginatedData } from '../types/api';
import {
  DashboardData,
  ReporteData,
  Cita,
  Producto,
  MovimientoInventario,
  Promocion,
  Servicio,
  Terapeuta,
  Cabina,
  User,
  Cliente,
  MovimientoCaja,
} from '../types/models';
import { mockStore } from './mockData';

// Helper para extraer datos de la respuesta
function extractData<T>(response: any): T {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data?.results !== undefined) return response.data.results;
  if (response?.data !== undefined) return response.data;
  return response;
}

export const adminService = {
  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<any>('/admin/dashboard/');
      const data = extractData<DashboardData>(response);
      if (data?.resumen_financiero) return data;
      return mockStore.getDashboard();
    } catch {
      return mockStore.getDashboard();
    }
  },

  getReportes: async (fechaInicio?: string, fechaFin?: string): Promise<ReporteData> => {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      const response = await apiClient.get<any>(`/admin/reportes/?${params.toString()}`);
      const data = extractData<ReporteData>(response);
      if (data?.periodo) return data;
      throw new Error('No se recibieron datos del reporte.');
    } catch {
      return {
        periodo: {
          fecha_inicio: fechaInicio || '2026-04-01',
          fecha_fin: fechaFin || '2026-04-30',
        },
        total_citas: 28,
        citas_atendidas: 24,
        ingresos: 3840.0,
        costo_insumos: 312.0,
        ganancia_operativa: 3528.0,
        desglose_terapeutas: [
          {
            terapeuta__usuario__nombre_completo: 'Elena Morales',
            terapeuta__especialidad: 'Terapias Holísticas y Masajes',
            citas_count: 11,
            ingresos: 1420.0,
          },
          {
            terapeuta__usuario__nombre_completo: 'Camila Vega',
            terapeuta__especialidad: 'Dermoestética Facial',
            citas_count: 10,
            ingresos: 1350.0,
          },
          {
            terapeuta__usuario__nombre_completo: 'Lucía Ramos',
            terapeuta__especialidad: 'Hidroterapia y Exfoliaciones',
            citas_count: 7,
            ingresos: 1070.0,
          },
        ],
      };
    }
  },

  // Citas Global
  getCitas: async (filters?: {
    fecha?: string;
    estado?: string;
    terapeuta_id?: number;
    cabina_id?: number;
    search?: string;
    page?: number;
  }): Promise<Cita[] | ApiPaginatedData<Cita>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.fecha) params.append('fecha', filters.fecha);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.terapeuta_id) params.append('terapeuta_id', filters.terapeuta_id.toString());
      if (filters?.cabina_id) params.append('cabina_id', filters.cabina_id.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());

      const response = await apiClient.get<any>(`/admin/citas/?${params.toString()}`);
      const data = extractData<any>(response);
      const results = data?.results || (Array.isArray(data) ? data : null);
      if (results) return results;
      throw new Error('Fallback needed');
    } catch {
      let filtered = [...mockStore.citas];
      if (filters?.fecha) {
        filtered = filtered.filter((c) => c.fecha === filters.fecha);
      }
      if (filters?.estado) {
        filtered = filtered.filter((c) => c.estado === filters.estado);
      }
      if (filters?.terapeuta_id) {
        filtered = filtered.filter((c) => c.terapeuta.id === filters.terapeuta_id);
      }
      if (filters?.cabina_id) {
        filtered = filtered.filter((c) => c.cabina.id === filters.cabina_id);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.cliente.nombre_completo.toLowerCase().includes(q) ||
            c.cliente.dni.includes(q) ||
            c.codigo_reserva.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  updateCitaEstado: async (id: number, estado: 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA'): Promise<Cita> => {
    const response = await apiClient.patch<any>(`/admin/citas/${id}/`, { estado });
    const data = extractData<Cita>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar el estado de la cita.');
  },

  // Inventario
  getProductos: async (estado?: 'NORMAL' | 'BAJO' | 'CRITICO'): Promise<Producto[]> => {
    try {
      const params = estado ? `?estado=${estado}` : '';
      const response = await apiClient.get<any>(`/admin/inventario/${params}`);
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      if (estado) {
        return mockStore.productos.filter((p) => p.estado_stock === estado);
      }
      return mockStore.productos;
    }
  },

  createProducto: async (payload: Partial<Producto>): Promise<Producto> => {
    const response = await apiClient.post<any>('/admin/inventario/', payload);
    const data = extractData<Producto>(response);
    if (data?.id) return data;
    throw new Error('No se pudo crear el insumo.');
  },

  updateProducto: async (id: number, payload: Partial<Producto>): Promise<Producto> => {
    const response = await apiClient.patch<any>(`/admin/inventario/${id}/`, payload);
    const data = extractData<Producto>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar el insumo.');
  },

  deleteProducto: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/inventario/${id}/`);
  },

  // Movimientos de inventario
  getMovimientosInventario: async (productoId?: number): Promise<MovimientoInventario[]> => {
    try {
      const params = productoId ? `?producto_id=${productoId}` : '';
      const response = await apiClient.get<any>(`/admin/inventario/movimientos/${params}`);
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      if (productoId) {
        return mockStore.movimientosInventario.filter((m) => m.producto === productoId);
      }
      return mockStore.movimientosInventario;
    }
  },

  // Asiento manual de kardex
  registrarMovimientoManual: async (payload: {
    producto_id: number;
    tipo: string;
    cantidad: number;
    costo_unitario?: number;
    descripcion?: string;
  }): Promise<MovimientoInventario> => {
    const response = await apiClient.post<any>('/admin/inventario/movimientos/', payload);
    const data = extractData<MovimientoInventario>(response);
    if (data?.id) return data;
    throw new Error('No se pudo registrar el movimiento de kárdex.');
  },

  // Promociones y cupones
  getPromociones: async (): Promise<Promocion[]> => {
    try {
      const response = await apiClient.get<any>('/admin/marketing/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.promociones;
    }
  },

  createPromocion: async (payload: Partial<Promocion>): Promise<Promocion> => {
    const response = await apiClient.post<any>('/admin/marketing/', payload);
    const data = extractData<Promocion>(response);
    if (data?.id) return data;
    throw new Error('No se pudo crear la promoción.');
  },

  updatePromocion: async (id: number, payload: Partial<Promocion>): Promise<Promocion> => {
    const response = await apiClient.patch<any>(`/admin/marketing/${id}/`, payload);
    const data = extractData<Promocion>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar la promoción.');
  },

  deletePromocion: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/marketing/${id}/`);
  },

  // Servicios y recetas (BOM)
  getServicios: async (): Promise<Servicio[]> => {
    try {
      const response = await apiClient.get<any>('/admin/servicios/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.servicios;
    }
  },

  createServicio: async (payload: Partial<Servicio>): Promise<Servicio> => {
    const response = await apiClient.post<any>('/admin/servicios/', payload);
    const data = extractData<Servicio>(response);
    if (data?.id) return data;
    throw new Error('No se pudo crear el servicio.');
  },

  updateServicio: async (id: number, payload: Partial<Servicio>): Promise<Servicio> => {
    const response = await apiClient.patch<any>(`/admin/servicios/${id}/`, payload);
    const data = extractData<Servicio>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar el servicio.');
  },

  deleteServicio: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/servicios/${id}/`);
  },

  // Insumos de receta (BOM)
  addRecetaItem: async (
    servicioId: number,
    payload: { producto_id: number; cantidad_requerida: number }
  ): Promise<Servicio> => {
    const response = await apiClient.post<any>(
      `/admin/servicios/${servicioId}/recetas/`,
      payload
    );
    const data = extractData<Servicio>(response);
    if (data?.id) return data;
    throw new Error('No se pudo agregar el insumo a la receta.');
  },

  deleteRecetaItem: async (servicioId: number, recetaId: number): Promise<Servicio> => {
    const response = await apiClient.delete<any>(
      `/admin/servicios/${servicioId}/recetas/${recetaId}/`
    );
    const data = extractData<Servicio>(response);
    if (data?.id) return data;
    throw new Error('No se pudo eliminar el insumo de la receta.');
  },

  // Terapeutas
  getTerapeutas: async (): Promise<Terapeuta[]> => {
    try {
      const response = await apiClient.get<any>('/admin/terapeutas/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.terapeutas;
    }
  },

  createTerapeuta: async (payload: Partial<Terapeuta>): Promise<Terapeuta> => {
    const response = await apiClient.post<any>('/admin/terapeutas/', payload);
    const data = extractData<Terapeuta>(response);
    if (data?.id) return data;
    throw new Error('No se pudo registrar la terapeuta.');
  },

  updateTerapeuta: async (id: number, payload: Partial<Terapeuta>): Promise<Terapeuta> => {
    const response = await apiClient.patch<any>(`/admin/terapeutas/${id}/`, payload);
    const data = extractData<Terapeuta>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar la terapeuta.');
  },

  // Cabinas
  getCabinas: async (): Promise<Cabina[]> => {
    try {
      const response = await apiClient.get<any>('/admin/cabinas/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.cabinas;
    }
  },

  createCabina: async (payload: Partial<Cabina>): Promise<Cabina> => {
    const response = await apiClient.post<any>('/admin/cabinas/', payload);
    const data = extractData<Cabina>(response);
    if (data?.id) return data;
    throw new Error('No se pudo crear la cabina.');
  },

  updateCabina: async (id: number, payload: Partial<Cabina>): Promise<Cabina> => {
    const response = await apiClient.patch<any>(`/admin/cabinas/${id}/`, payload);
    const data = extractData<Cabina>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar la cabina.');
  },

  // Usuarios
  getUsuarios: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<any>('/admin/usuarios/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.users;
    }
  },

  createUsuario: async (payload: {
    email: string;
    password?: string;
    nombre_completo: string;
    rol: 'ADMIN' | 'RECEPCIONISTA' | 'TERAPEUTA';
  }): Promise<User> => {
    const response = await apiClient.post<any>('/admin/usuarios/', payload);
    const data = extractData<User>(response);
    if (data?.id) return data;
    throw new Error('No se pudo crear el usuario.');
  },

  updateUsuario: async (id: number, payload: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<any>(`/admin/usuarios/${id}/`, payload);
    const data = extractData<User>(response);
    if (data?.id) return data;
    throw new Error('No se pudo actualizar el usuario.');
  },

  // Clientes
  getClientes: async (): Promise<Cliente[]> => {
    try {
      const response = await apiClient.get<any>('/admin/clientes/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.clientes;
    }
  },

  // Caja
  getCajaMovimientos: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await apiClient.get<any>('/admin/caja/');
      const data = extractData<any>(response);
      const list = data?.results || (Array.isArray(data) ? data : null);
      if (list) return list;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.movimientosCaja;
    }
  },

  createCajaMovimiento: async (payload: {
    tipo: 'INGRESO' | 'EGRESO';
    concepto: string;
    monto: number;
    metodo_pago: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN';
  }): Promise<MovimientoCaja> => {
    const response = await apiClient.post<any>('/admin/caja/', payload);
    const data = extractData<MovimientoCaja>(response);
    if (data?.id) return data;
    throw new Error('No se pudo registrar el movimiento de caja.');
  },
};
