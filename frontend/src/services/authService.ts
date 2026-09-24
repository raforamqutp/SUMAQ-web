import { apiClient } from './api';
import { ApiResponse } from '../types/api';
import { User } from '../types/models';

export interface LoginResponseData {
  user: User;
  terapeuta_id?: number | null;
  access: string;
  refresh: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponseData> => {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login/', {
        email,
        password,
      });
      const data = response.data?.data || (response.data as any);
      if (!data?.access) {
        throw new Error('Respuesta inválida del servidor de autenticación.');
      }
      localStorage.setItem('sumaq_access_token', data.access);
      localStorage.setItem('sumaq_refresh_token', data.refresh);
      localStorage.setItem('sumaq_user', JSON.stringify(data.user));
      if (data.terapeuta_id) {
        localStorage.setItem('sumaq_terapeuta_id', data.terapeuta_id.toString());
      } else {
        localStorage.removeItem('sumaq_terapeuta_id');
      }
      // Limpiar mocks residuales de pruebas locales
      localStorage.removeItem('sumaq_mock_citas');
      localStorage.removeItem('sumaq_mock_productos');

      return data;
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        (err.response?.data?.non_field_errors && err.response.data.non_field_errors[0]) ||
        err.message ||
        'Error de conexión o credenciales incorrectas.';
      throw new Error(serverMsg);
    }
  },

  getCurrentUser: async (): Promise<{ user: User; terapeuta_id?: number | null }> => {
    const response = await apiClient.get<ApiResponse<{ user: User; terapeuta_id?: number | null }>>('/auth/me/');
    if (response.data?.data) return response.data.data;
    if ((response.data as any)?.user) return response.data as any;
    throw new Error('No se pudo validar la sesión actual.');
  },

  logout: () => {
    localStorage.removeItem('sumaq_access_token');
    localStorage.removeItem('sumaq_refresh_token');
    localStorage.removeItem('sumaq_user');
    localStorage.removeItem('sumaq_terapeuta_id');
  },

  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('sumaq_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getStoredTherapistId: (): number | null => {
    const tId = localStorage.getItem('sumaq_terapeuta_id');
    return tId ? parseInt(tId, 10) : null;
  },
};
