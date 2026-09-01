import { apiClient } from './api';
import { ApiResponse } from '../types/api';
import { Cita, FichaAtencion, Producto, Terapeuta } from '../types/models';
import { mockStore } from './mockData';

/**
 * ============================================================================
 * SERVICIO DEL TERAPEUTA (therapistService.ts)
 * ============================================================================
 * Métodos para la gestión de atención clínica en cabina:
 * - getMiAgenda(): Lista citas de la especialista conectada.
 * - getCitaDetalle(): Obtiene datos del cliente, servicio y ficha clínica.
 * - guardarFichaAtencion(): Registra notas médicas y finaliza la cita deduciendo insumos.
 * - getMisInsumos(): Consulta stock de insumos asignados a su cabina.
 * ============================================================================
 */
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
    try {
      const url = fecha ? `/terapeuta/mi-agenda/?fecha=${fecha}` : '/terapeuta/mi-agenda/';
      const response = await apiClient.get<ApiResponse<{ fecha: string; terapeuta: Terapeuta; total_citas: number; citas: Cita[] }>>(url);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const targetFecha = fecha || new Date().toISOString().split('T')[0];
      const tId = Number(localStorage.getItem('sumaq_terapeuta_id') || '1');
      const terapeuta = mockStore.terapeutas.find((t) => t.id === tId) || mockStore.terapeutas[0];
      const citas = mockStore.citas.filter((c) => c.fecha === targetFecha && c.terapeuta.id === terapeuta.id);
      return {
        fecha: targetFecha,
        terapeuta,
        total_citas: citas.length,
        citas: citas.length > 0 ? citas : mockStore.citas.filter((c) => c.terapeuta.id === terapeuta.id),
      };
    }
  },

  getCitaDetail: async (id: number): Promise<Cita> => {
    try {
      const response = await apiClient.get<ApiResponse<Cita>>(`/terapeuta/citas/${id}/`);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      return mockStore.citas.find((c) => c.id === Number(id)) || mockStore.citas[0];
    }
  },

  saveFichaAtencion: async (payload: FichaAtencionPayload): Promise<FichaAtencion> => {
    try {
      const response = await apiClient.post<ApiResponse<FichaAtencion>>('/terapeuta/fichas/', payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cita = mockStore.citas.find((c) => c.id === payload.cita_id) || mockStore.citas[0];
      const ficha: FichaAtencion = {
        id: cita.ficha_atencion?.id || 1,
        tipo_piel: payload.tipo_piel,
        alergias_conocidas: payload.alergias_conocidas,
        notas_terapeuta: payload.notas_terapeuta,
        servicios_adicionales: cita.ficha_atencion?.servicios_adicionales || [],
        fecha_registro: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      cita.ficha_atencion = ficha;
      return ficha;
    }
  },

  updateFichaAtencion: async (id: number, payload: Partial<FichaAtencionPayload>): Promise<FichaAtencion> => {
    try {
      const response = await apiClient.patch<ApiResponse<FichaAtencion>>(`/terapeuta/fichas/${id}/`, payload);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cita = mockStore.citas.find((c) => c.ficha_atencion?.id === id) || mockStore.citas[0];
      if (cita.ficha_atencion) {
        if (payload.tipo_piel) cita.ficha_atencion.tipo_piel = payload.tipo_piel;
        if (payload.alergias_conocidas) cita.ficha_atencion.alergias_conocidas = payload.alergias_conocidas;
        if (payload.notas_terapeuta) cita.ficha_atencion.notas_terapeuta = payload.notas_terapeuta;
        cita.ficha_atencion.updated_at = new Date().toISOString();
        return cita.ficha_atencion;
      }
      return {
        id,
        tipo_piel: payload.tipo_piel || 'Piel Mixta',
        alergias_conocidas: payload.alergias_conocidas || 'Sin alergias declaradas',
        notas_terapeuta: payload.notas_terapeuta || '',
        servicios_adicionales: [],
        fecha_registro: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  addServicioAdicional: async (citaId: number, servicioId: number, cantidad: number = 1): Promise<Cita> => {
    try {
      const response = await apiClient.post<ApiResponse<Cita>>(`/terapeuta/citas/${citaId}/agregar-servicio/`, {
        servicio_id: servicioId,
        cantidad,
      });
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cita = mockStore.citas.find((c) => c.id === Number(citaId)) || mockStore.citas[0];
      const extraServ = mockStore.servicios.find((s) => s.id === Number(servicioId)) || mockStore.servicios[1];
      const extraCost = Number(extraServ.precio_publico) * cantidad;

      if (!cita.ficha_atencion) {
        cita.ficha_atencion = {
          id: 1,
          tipo_piel: 'Piel Sensible',
          alergias_conocidas: 'Ninguna',
          notas_terapeuta: '',
          servicios_adicionales: [],
          fecha_registro: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      cita.ficha_atencion.servicios_adicionales.push({
        id: Date.now(),
        servicio: extraServ.id,
        servicio_nombre: extraServ.nombre,
        cantidad,
        precio_unitario_historico: extraServ.precio_publico,
        subtotal: extraCost.toFixed(2),
        created_at: new Date().toISOString(),
      });

      const newSubtotal = Number(cita.subtotal) + extraCost;
      const newTotal = Number(cita.monto_total) + extraCost;
      cita.subtotal = newSubtotal.toFixed(2);
      cita.monto_total = newTotal.toFixed(2);

      return { ...cita };
    }
  },

  completarCita: async (citaId: number): Promise<Cita> => {
    try {
      const response = await apiClient.patch<ApiResponse<Cita>>(`/terapeuta/citas/${citaId}/completar/`);
      if (response.data?.data) return response.data.data;
      throw new Error('Fallback needed');
    } catch {
      const cita = mockStore.citas.find((c) => c.id === Number(citaId)) || mockStore.citas[0];
      cita.estado = 'ATENDIDA';

      // Discount inventory
      if (cita.servicio?.recetas) {
        for (const r of cita.servicio.recetas) {
          const prod = mockStore.productos.find((p) => p.id === r.producto);
          if (prod) {
            const current = Number(prod.stock_actual);
            const req = Number(r.cantidad_requerida);
            prod.stock_actual = Math.max(0, current - req).toFixed(2);
          }
        }
      }

      return { ...cita };
    }
  },

  getInventario: async (): Promise<Producto[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Producto[]>>('/terapeuta/inventario/');
      if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
      return mockStore.productos;
    } catch {
      return mockStore.productos;
    }
  },

  getComprobantePDFUrl: (citaId: number): string => {
    const token = localStorage.getItem('sumaq_access_token');
    return token
      ? `http://127.0.0.1:8000/api/terapeuta/citas/${citaId}/pdf/?token=${token}`
      : `http://127.0.0.1:8000/api/terapeuta/citas/${citaId}/pdf/`;
  },
};
