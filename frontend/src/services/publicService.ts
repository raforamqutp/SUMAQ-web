// Servicios de consumo público: catálogo de tratamientos, cálculo de disponibilidad por cabina y reserva web

import { apiClient } from './api';
import { ApiResponse } from '../types/api';
import { Servicio, Cabina, Terapeuta, Promocion, SlotDisponibilidad, Cita } from '../types/models';
import { mockStore } from './mockData';

// Estructura del payload requerida para la creación de una cita en el endpoint público
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
  // Obtiene catálogo completo de servicios y recetas
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

  // Consulta cabinas activas para asignación de citas
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

  // Consulta terapeutas activos vinculados a sus cabinas físicas
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

  // Lista cupones vigentes aplicables en el motor de reservas
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

  // Calcula en tiempo real los slots horarios libres filtrando por fecha, terapeuta y cabina
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

  // Envía la solicitud de reserva atómica y genera el código único de cita
  reservarWeb: async (payload: ReservaPayload): Promise<Cita> => {
    try {
      const response = await apiClient.post<ApiResponse<Cita>>('/citas/reservar-web/', payload);
      if (response.data?.data) return response.data.data;
      return mockStore.reservarWeb(payload);
    } catch {
      return mockStore.reservarWeb(payload);
    }
  },

  // Consulta el estado de una cita mediante Código de Reserva + DNI
  consultarCita: async (
    codigoReserva: string,
    dni: string
  ): Promise<{
    cita: Cita;
    horas_restantes: number;
    puede_modificar: boolean;
    motivo_bloqueo: string | null;
  }> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{
          cita: Cita;
          horas_restantes: number;
          puede_modificar: boolean;
          motivo_bloqueo: string | null;
        }>
      >('/citas/consultar/', { codigo_reserva: codigoReserva, dni });
      if (response.data?.data) return response.data.data;
      return mockStore.consultarCita(codigoReserva, dni);
    } catch {
      return mockStore.consultarCita(codigoReserva, dni);
    }
  },

  // Cancela una cita registrada por el cliente si restan al menos 24 horas antes del turno
  cancelarCitaWeb: async (codigoReserva: string, dni: string, motivo?: string): Promise<Cita> => {
    try {
      const response = await apiClient.post<ApiResponse<Cita>>('/citas/cancelar-web/', {
        codigo_reserva: codigoReserva,
        dni,
        motivo,
      });
      if (response.data?.data) return response.data.data;
      return mockStore.cancelarCitaWeb(codigoReserva, dni, motivo);
    } catch {
      return mockStore.cancelarCitaWeb(codigoReserva, dni, motivo);
    }
  },

  // Reprograma fecha y hora de la cita si restan al menos 24 horas antes del turno pactado
  reprogramarCitaWeb: async (
    codigoReserva: string,
    dni: string,
    nuevaFecha: string,
    nuevaHoraInicio: string
  ): Promise<Cita> => {
    try {
      const response = await apiClient.post<ApiResponse<Cita>>('/citas/reprogramar-web/', {
        codigo_reserva: codigoReserva,
        dni,
        fecha: nuevaFecha,
        hora_inicio: nuevaHoraInicio,
      });
      if (response.data?.data) return response.data.data;
      return mockStore.reprogramarCitaWeb(codigoReserva, dni, nuevaFecha, nuevaHoraInicio);
    } catch {
      return mockStore.reprogramarCitaWeb(codigoReserva, dni, nuevaFecha, nuevaHoraInicio);
    }
  },
};


