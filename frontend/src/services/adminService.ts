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

export const adminService = {
  // Dashboard & Analytics
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<ApiResponse<DashboardData>>('/admin/dashboard/');
      if (response.data?.data) return response.data.data;
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
      const response = await apiClient.get<ApiResponse<ReporteData>>(`/admin/reportes/?${params.toString()}`);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
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
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
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
    try {
      const response = await apiClient.patch<ApiResponse<Cita>>(`/admin/citas/${id}/`, { estado });
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cita = mockStore.citas.find((c) => c.id === id) || mockStore.citas[0];
      cita.estado = estado;
      return { ...cita };
    }
  },

  // Inventario
  getProductos: async (estado?: 'NORMAL' | 'BAJO' | 'CRITICO'): Promise<Producto[]> => {
    try {
      const params = estado ? `?estado=${estado}` : '';
      const response = await apiClient.get<any>(`/admin/inventario/${params}`);
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      if (estado) {
        return mockStore.productos.filter((p) => p.estado_stock === estado);
      }
      return mockStore.productos;
    }
  },

  createProducto: async (payload: Partial<Producto>): Promise<Producto> => {
    try {
      const response = await apiClient.post<ApiResponse<Producto>>('/admin/inventario/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const newProd: Producto = {
        id: mockStore.productos.length + 1,
        nombre: payload.nombre || 'Nuevo Insumo',
        descripcion: payload.descripcion || '',
        costo_unitario: payload.costo_unitario || '10.00',
        stock_actual: payload.stock_actual || '10.00',
        stock_minimo_alerta: payload.stock_minimo_alerta || '5.00',
        unidad_medida: payload.unidad_medida || 'unidades',
        estado_stock: 'NORMAL',
        activo: true,
      };
      mockStore.productos.push(newProd);
      return newProd;
    }
  },

  updateProducto: async (id: number, payload: Partial<Producto>): Promise<Producto> => {
    try {
      const response = await apiClient.patch<ApiResponse<Producto>>(`/admin/inventario/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const prod = mockStore.productos.find((p) => p.id === id) || mockStore.productos[0];
      Object.assign(prod, payload);
      return { ...prod };
    }
  },

  deleteProducto: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/admin/inventario/${id}/`);
    } catch {
      mockStore.productos = mockStore.productos.filter((p) => p.id !== id);
    }
  },

  getMovimientosInventario: async (productoId?: number): Promise<MovimientoInventario[]> => {
    try {
      const params = productoId ? `?producto_id=${productoId}` : '';
      const response = await apiClient.get<any>(`/admin/inventario/movimientos/${params}`);
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      if (productoId) {
        return mockStore.movimientosInventario.filter((m) => m.producto === productoId);
      }
      return mockStore.movimientosInventario;
    }
  },

  registrarMovimientoManual: async (payload: {
    producto_id: number;
    tipo: string;
    cantidad: number;
    costo_unitario?: number;
    descripcion?: string;
  }): Promise<MovimientoInventario> => {
    try {
      const response = await apiClient.post<ApiResponse<MovimientoInventario>>('/admin/inventario/movimientos/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const prod = mockStore.productos.find((p) => p.id === payload.producto_id) || mockStore.productos[0];
      const currentStock = Number(prod.stock_actual);
      if (payload.tipo.includes('ENTRADA') || payload.tipo.includes('POSITIVO')) {
        prod.stock_actual = (currentStock + payload.cantidad).toFixed(2);
      } else {
        prod.stock_actual = Math.max(0, currentStock - payload.cantidad).toFixed(2);
      }

      const newMov: MovimientoInventario = {
        id: mockStore.movimientosInventario.length + 1,
        producto: prod.id,
        producto_nombre: prod.nombre,
        unidad_medida: prod.unidad_medida,
        tipo: payload.tipo as any,
        cantidad: payload.cantidad.toFixed(2),
        costo_unitario: (payload.costo_unitario || Number(prod.costo_unitario)).toFixed(2),
        referencia_tipo: 'AJUSTE_MANUAL',
        fecha_registro: new Date().toISOString().replace('T', ' ').substring(0, 19),
        descripcion: payload.descripcion || 'Movimiento de inventario manual',
      };
      mockStore.movimientosInventario.unshift(newMov);
      return newMov;
    }
  },

  // Marketing & Cupones
  getPromociones: async (): Promise<Promocion[]> => {
    try {
      const response = await apiClient.get<any>('/admin/marketing/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      return mockStore.promociones;
    }
  },

  createPromocion: async (payload: Partial<Promocion>): Promise<Promocion> => {
    try {
      const response = await apiClient.post<ApiResponse<Promocion>>('/admin/marketing/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const newPromo: Promocion = {
        id: mockStore.promociones.length + 1,
        titulo: payload.titulo || 'Nueva Promoción',
        descripcion: payload.descripcion || '',
        codigo_cupon: payload.codigo_cupon?.toUpperCase() || 'PROMO10',
        porcentaje_descuento: payload.porcentaje_descuento || '10.00',
        fecha_inicio: payload.fecha_inicio || '2026-01-01',
        fecha_fin: payload.fecha_fin || '2026-12-31',
        activo: true,
      };
      mockStore.promociones.push(newPromo);
      return newPromo;
    }
  },

  updatePromocion: async (id: number, payload: Partial<Promocion>): Promise<Promocion> => {
    try {
      const response = await apiClient.patch<ApiResponse<Promocion>>(`/admin/marketing/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const promo = mockStore.promociones.find((p) => p.id === id) || mockStore.promociones[0];
      Object.assign(promo, payload);
      return { ...promo };
    }
  },

  deletePromocion: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/admin/marketing/${id}/`);
    } catch {
      mockStore.promociones = mockStore.promociones.filter((p) => p.id !== id);
    }
  },

  // Servicios & Recetas (BOM)
  getServicios: async (): Promise<Servicio[]> => {
    try {
      const response = await apiClient.get<any>('/admin/servicios/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      return mockStore.servicios;
    }
  },

  createServicio: async (payload: Partial<Servicio>): Promise<Servicio> => {
    try {
      const response = await apiClient.post<ApiResponse<Servicio>>('/admin/servicios/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const newServ: Servicio = {
        id: mockStore.servicios.length + 1,
        nombre: payload.nombre || 'Nuevo Servicio',
        descripcion: payload.descripcion || '',
        precio_publico: payload.precio_publico || '100.00',
        duracion_min: payload.duracion_min || 60,
        imagen_url: payload.imagen_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
        activo: true,
        recetas: [],
      };
      mockStore.servicios.push(newServ);
      return newServ;
    }
  },

  updateServicio: async (id: number, payload: Partial<Servicio>): Promise<Servicio> => {
    try {
      const response = await apiClient.patch<ApiResponse<Servicio>>(`/admin/servicios/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const serv = mockStore.servicios.find((s) => s.id === id) || mockStore.servicios[0];
      Object.assign(serv, payload);
      return { ...serv };
    }
  },

  deleteServicio: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/admin/servicios/${id}/`);
    } catch {
      mockStore.servicios = mockStore.servicios.filter((s) => s.id !== id);
    }
  },

  addRecetaItem: async (
    servicioId: number,
    payload: { producto_id: number; cantidad_requerida: number }
  ): Promise<Servicio> => {
    try {
      const response = await apiClient.post<ApiResponse<Servicio>>(
        `/admin/servicios/${servicioId}/recetas/`,
        payload
      );
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const serv = mockStore.servicios.find((s) => s.id === servicioId) || mockStore.servicios[0];
      const prod = mockStore.productos.find((p) => p.id === payload.producto_id) || mockStore.productos[0];
      if (!serv.recetas) serv.recetas = [];
      serv.recetas.push({
        id: Date.now(),
        producto: prod.id,
        producto_nombre: prod.nombre,
        unidad_medida: prod.unidad_medida,
        costo_unitario: prod.costo_unitario,
        cantidad_requerida: payload.cantidad_requerida.toFixed(2),
      });
      return { ...serv };
    }
  },

  deleteRecetaItem: async (servicioId: number, recetaId: number): Promise<Servicio> => {
    try {
      const response = await apiClient.delete<ApiResponse<Servicio>>(
        `/admin/servicios/${servicioId}/recetas/${recetaId}/`
      );
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const serv = mockStore.servicios.find((s) => s.id === servicioId) || mockStore.servicios[0];
      if (serv.recetas) {
        serv.recetas = serv.recetas.filter((r) => r.id !== recetaId);
      }
      return { ...serv };
    }
  },

  // Terapeutas
  getTerapeutas: async (): Promise<Terapeuta[]> => {
    try {
      const response = await apiClient.get<any>('/admin/terapeutas/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      return mockStore.terapeutas;
    }
  },

  createTerapeuta: async (payload: Partial<Terapeuta>): Promise<Terapeuta> => {
    try {
      const response = await apiClient.post<ApiResponse<Terapeuta>>('/admin/terapeutas/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cabina = mockStore.cabinas.find((c) => c.id === payload.cabina_id) || mockStore.cabinas[0];
      const newTer: Terapeuta = {
        id: mockStore.terapeutas.length + 1,
        nombre_completo: payload.nombre_completo || 'Nueva Terapeuta',
        email: payload.email || 'terapeuta@sumaqspa.pe',
        especialidad: payload.especialidad || 'Masajes Relajantes',
        cabina,
        cabina_id: cabina.id,
        foto_url: payload.foto_url || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600',
        activo: true,
      };
      mockStore.terapeutas.push(newTer);
      return newTer;
    }
  },

  updateTerapeuta: async (id: number, payload: Partial<Terapeuta>): Promise<Terapeuta> => {
    try {
      const response = await apiClient.patch<ApiResponse<Terapeuta>>(`/admin/terapeutas/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const ter = mockStore.terapeutas.find((t) => t.id === id) || mockStore.terapeutas[0];
      Object.assign(ter, payload);
      return { ...ter };
    }
  },

  // Cabinas
  getCabinas: async (): Promise<Cabina[]> => {
    try {
      const response = await apiClient.get<any>('/admin/cabinas/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      return mockStore.cabinas;
    }
  },

  createCabina: async (payload: Partial<Cabina>): Promise<Cabina> => {
    try {
      const response = await apiClient.post<ApiResponse<Cabina>>('/admin/cabinas/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const newCab: Cabina = {
        id: mockStore.cabinas.length + 1,
        nombre: payload.nombre || 'Nueva Cabina',
        tipo: payload.tipo || 'Especializada',
        descripcion: payload.descripcion || '',
        activa: true,
      };
      mockStore.cabinas.push(newCab);
      return newCab;
    }
  },

  updateCabina: async (id: number, payload: Partial<Cabina>): Promise<Cabina> => {
    try {
      const response = await apiClient.patch<ApiResponse<Cabina>>(`/admin/cabinas/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cab = mockStore.cabinas.find((c) => c.id === id) || mockStore.cabinas[0];
      Object.assign(cab, payload);
      return { ...cab };
    }
  },

  // Usuarios
  getUsuarios: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<any>('/admin/usuarios/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
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
    try {
      const response = await apiClient.post<ApiResponse<User>>('/admin/usuarios/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const newUser: User = {
        id: mockStore.users.length + 1,
        email: payload.email,
        nombre_completo: payload.nombre_completo,
        rol: payload.rol,
        activo: true,
      };
      mockStore.users.push(newUser);
      return newUser;
    }
  },

  updateUsuario: async (id: number, payload: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.patch<ApiResponse<User>>(`/admin/usuarios/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const u = mockStore.users.find((user) => user.id === id) || mockStore.users[0];
      Object.assign(u, payload);
      return { ...u };
    }
  },

  // Clientes
  getClientes: async (): Promise<Cliente[]> => {
    try {
      const response = await apiClient.get<any>('/admin/clientes/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
      throw new Error('Fallback needed');
    } catch {
      return mockStore.clientes;
    }
  },

  // Caja
  getCajaMovimientos: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await apiClient.get<any>('/admin/caja/');
      if (response.data?.data?.results || response.data?.data) {
        return response.data.data?.results || response.data.data;
      }
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
    try {
      const response = await apiClient.post<ApiResponse<MovimientoCaja>>('/admin/caja/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const newMov: MovimientoCaja = {
        id: mockStore.movimientosCaja.length + 1,
        tipo: payload.tipo,
        concepto: payload.concepto,
        monto: payload.monto.toFixed(2),
        metodo_pago: payload.metodo_pago,
        fecha_registro: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      mockStore.movimientosCaja.unshift(newMov);
      return newMov;
    }
  },
};
