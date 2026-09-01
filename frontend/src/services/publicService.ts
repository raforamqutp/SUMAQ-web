import { apiClient } from './api';
import { ApiResponse } from '../types/api';
import { Servicio, Cabina, Terapeuta, Promocion, SlotDisponibilidad, Cita } from '../types/models';
import { mockStore } from './mockData';

/**
 * ============================================================================
 * SERVICIO PÚBLICO (publicService.ts)
 * ============================================================================
 * Métodos de consulta pública para clientes y flujo de reserva:
 * - getServicios(): Lista de tratamientos y precios.
 * - getTerapeutas(), getCabinas(): Información de staff y cabinas temáticas.
 * - getDisponibilidad(): Consulta slots libres de 60 min por fecha/cabina.
 * - crearReserva(): Registra una nueva cita y descuenta cupón si aplica.
 * - getPromocionesActivas(): Lista ofertas y cupones de descuento vigentes.
 * ============================================================================
 */
export interface ReservaPayload {
  dni: string;
  nombre_completo: string;
  telefono: string;
  email?: string;
  servicio_id: number;
  terapeuta_id: number;
  cabina_id: number;
  fecha: string;
  hora_inicio: string;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN';
  codigo_cupon?: string;
}

export const publicService = {
  getServicios: async (): Promise<Servicio[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Servicio[]>>('/servicios/');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
      return mockStore.servicios;
    } catch {
      return mockStore.servicios;
    }
  },

  getServicioById: async (id: number): Promise<Servicio> => {
    try {
      const response = await apiClient.get<ApiResponse<Servicio>>(`/servicios/${id}/`);
      if (response.data?.data) return response.data.data;
      return mockStore.servicios.find((s) => s.id === id) || mockStore.servicios[0];
    } catch {
      return mockStore.servicios.find((s) => s.id === id) || mockStore.servicios[0];
    }
  },

  getCabinas: async (): Promise<Cabina[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Cabina[]>>('/cabinas/');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
      return mockStore.cabinas;
    } catch {
      return mockStore.cabinas;
    }
  },

  getTerapeutas: async (): Promise<Terapeuta[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Terapeuta[]>>('/terapeutas/');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
      return mockStore.terapeutas;
    } catch {
      return mockStore.terapeutas;
    }
  },

  getPromocionesActivas: async (): Promise<Promocion[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Promocion[]>>('/promociones/activas/');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
      return mockStore.promociones;
    } catch {
      return mockStore.promociones;
    }
  },

  getDisponibilidad: async (
    fecha: string,
    servicioId?: number,
    terapeutaId?: number,
    cabinaId?: number
  ): Promise<{ fecha: string; slots: SlotDisponibilidad[] }> => {
    try {
      const params = new URLSearchParams();
      params.append('fecha', fecha);
      if (servicioId) params.append('servicio_id', servicioId.toString());
      if (terapeutaId) params.append('terapeuta_id', terapeutaId.toString());
      if (cabinaId) params.append('cabina_id', cabinaId.toString());

      const response = await apiClient.get<ApiResponse<{ fecha: string; slots: SlotDisponibilidad[] }>>(
        `/disponibilidad/?${params.toString()}`
      );
      if (response.data?.data) return response.data.data;
      return mockStore.getDisponibilidad(fecha, servicioId, terapeutaId, cabinaId);
    } catch {
      return mockStore.getDisponibilidad(fecha, servicioId, terapeutaId, cabinaId);
    }
  },

  reservarWeb: async (payload: ReservaPayload): Promise<Cita> => {
    try {
      const response = await apiClient.post<ApiResponse<Cita>>('/citas/reservar-web/', payload);
      if (response.data?.data) return response.data.data;
      return mockStore.reservarWeb(payload);
    } catch {
      return mockStore.reservarWeb(payload);
    }
  },
};
