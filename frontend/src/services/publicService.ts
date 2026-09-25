import { apiClient } from './api';
import { Servicio, Cabina, Terapeuta, Promocion, SlotDisponibilidad, Cita } from '../types/models';
import { mockStore } from './mockData';

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
      const response = await apiClient.get<any>('/servicios/');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return mockStore.servicios;
    } catch {
      return mockStore.servicios;
    }
  },

  getServicioById: async (id: number): Promise<Servicio> => {
    try {
      const response = await apiClient.get<any>(`/servicios/${id}/`);
      const data = response.data?.data || response.data;
      if (data?.id) return data;
      return mockStore.servicios.find((s) => s.id === id) || mockStore.servicios[0];
    } catch {
      return mockStore.servicios.find((s) => s.id === id) || mockStore.servicios[0];
    }
  },

  getCabinas: async (): Promise<Cabina[]> => {
    try {
      const response = await apiClient.get<any>('/cabinas/');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return mockStore.cabinas;
    } catch {
      return mockStore.cabinas;
    }
  },

  getTerapeutas: async (): Promise<Terapeuta[]> => {
    try {
      const response = await apiClient.get<any>('/terapeutas/');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return mockStore.terapeutas;
    } catch {
      return mockStore.terapeutas;
    }
  },

  getPromocionesActivas: async (): Promise<Promocion[]> => {
    try {
      const response = await apiClient.get<any>('/promociones/activas/');
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) return data;
      return mockStore.promociones;
    } catch {
      return mockStore.promociones;
    }
  },

  // Disponibilidad horaria por fecha y filtros opcionales
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

      const response = await apiClient.get<any>(`/disponibilidad/?${params.toString()}`);
      const data = response.data?.data || response.data;
      if (data?.slots) return data;
      return mockStore.getDisponibilidad(fecha, servicioId, terapeutaId, cabinaId);
    } catch {
      return mockStore.getDisponibilidad(fecha, servicioId, terapeutaId, cabinaId);
    }
  },

  reservarWeb: async (payload: ReservaPayload): Promise<Cita> => {
    const response = await apiClient.post<any>('/citas/reservar-web/', payload);
    const data = response.data?.data || response.data;
    if (data?.codigo_reserva) return data;
    throw new Error('No se recibió la confirmación de la cita desde el servidor.');
  },

  consultarCita: async (
    codigoReserva: string,
    dni: string
  ): Promise<{
    cita: Cita;
    horas_restantes: number;
    puede_modificar: boolean;
    motivo_bloqueo: string | null;
  }> => {
    const response = await apiClient.post<any>('/citas/consultar/', {
      codigo_reserva: codigoReserva,
      dni,
    });
    const data = response.data?.data || response.data;
    if (data?.cita) return data;
    throw new Error('No se encontró la cita con los datos proporcionados.');
  },

  // Cancelación de cita (valida límite de 24h en backend)
  cancelarCitaWeb: async (codigoReserva: string, dni: string, motivo?: string): Promise<Cita> => {
    const response = await apiClient.post<any>('/citas/cancelar-web/', {
      codigo_reserva: codigoReserva,
      dni,
      motivo,
    });
    const data = response.data?.data || response.data;
    if (data?.codigo_reserva) return data;
    throw new Error('No fue posible procesar la cancelación.');
  },

  // Reprogramación de cita (valida límite de 24h en backend)
  reprogramarCitaWeb: async (
    codigoReserva: string,
    dni: string,
    nuevaFecha: string,
    nuevaHoraInicio: string
  ): Promise<Cita> => {
    const response = await apiClient.post<any>('/citas/reprogramar-web/', {
      codigo_reserva: codigoReserva,
      dni,
      fecha: nuevaFecha,
      hora_inicio: nuevaHoraInicio,
    });
    const data = response.data?.data || response.data;
    if (data?.codigo_reserva) return data;
    throw new Error('No fue posible procesar la reprogramación.');
  },
};


