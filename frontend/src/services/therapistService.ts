import { apiClient } from './api';
import { Cita, FichaAtencion, Producto, Terapeuta } from '../types/models';

export interface FichaAtencionPayload {
  cita_id?: number;
  tipo_piel: string;
  alergias_conocidas: string;
  notas_terapeuta: string;
}

export const therapistService = {
  getMiAgenda: async (
    fecha?: string
  ): Promise<{ fecha: string; terapeuta: Terapeuta; total_citas: number; citas: Cita[] }> => {
    const url = fecha ? `/terapeuta/mi-agenda/?fecha=${fecha}` : '/terapeuta/mi-agenda/';
    const response = await apiClient.get<any>(url);
    const data = response.data?.data || response.data;
    if (data?.terapeuta && Array.isArray(data?.citas)) return data;
    throw new Error('No se pudo obtener la agenda del servidor.');
  },

  getCitaDetail: async (id: number): Promise<Cita> => {
    const response = await apiClient.get<any>(`/terapeuta/citas/${id}/`);
    const data = response.data?.data || response.data;
    if (data?.id) return data;
    throw new Error('No se encontró el detalle de la cita.');
  },

  saveFichaAtencion: async (payload: FichaAtencionPayload): Promise<FichaAtencion> => {
    const response = await apiClient.post<any>('/terapeuta/fichas/', payload);
    const data = response.data?.data || response.data;
    if (data?.id) return data;
    throw new Error('No se pudo guardar la ficha clínica.');
  },

  updateFichaAtencion: async (id: number, payload: Partial<FichaAtencionPayload>): Promise<FichaAtencion> => {
    const response = await apiClient.patch<any>(`/terapeuta/fichas/${id}/`, payload);
    const data = response.data?.data || response.data;
    if (data?.id) return data;
    throw new Error('No se pudo actualizar la ficha clínica.');
  },

  addServicioAdicional: async (citaId: number, servicioId: number, cantidad: number = 1): Promise<Cita> => {
    const response = await apiClient.post<any>(`/terapeuta/citas/${citaId}/agregar-servicio/`, {
      servicio_id: servicioId,
      cantidad,
    });
    const data = response.data?.data || response.data;
    if (data?.id) return data;
    throw new Error('No se pudo agregar el servicio adicional.');
  },

  // Completar cita (descuenta insumos según receta)
  completarCita: async (citaId: number): Promise<Cita> => {
    const response = await apiClient.patch<any>(`/terapeuta/citas/${citaId}/completar/`);
    const data = response.data?.data || response.data;
    if (data?.id) return data;
    throw new Error('No se pudo completar la atención de la cita.');
  },

  getInventario: async (): Promise<Producto[]> => {
    const response = await apiClient.get<any>('/terapeuta/inventario/');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  getComprobantePDFUrl: (citaId: number): string => {
    const token = localStorage.getItem('sumaq_access_token');
    return token
      ? `http://127.0.0.1:8000/api/terapeuta/citas/${citaId}/pdf/?token=${token}`
      : `http://127.0.0.1:8000/api/terapeuta/citas/${citaId}/pdf/`;
  },
};
