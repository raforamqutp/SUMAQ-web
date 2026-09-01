import { apiClient } from './api';
import { ApiResponse } from '../types/api';
import { User } from '../types/models';
import { MOCK_USERS } from './mockData';

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
      const data = response.data.data;
      localStorage.setItem('sumaq_access_token', data.access);
      localStorage.setItem('sumaq_refresh_token', data.refresh);
      localStorage.setItem('sumaq_user', JSON.stringify(data.user));
      if (data.terapeuta_id) {
        localStorage.setItem('sumaq_terapeuta_id', data.terapeuta_id.toString());
      } else {
        localStorage.removeItem('sumaq_terapeuta_id');
      }
      return data;
    } catch {
      // Standalone Fallback
      const normalizedEmail = email.trim().toLowerCase();
      let matchedUser = MOCK_USERS.find((u) => u.email.toLowerCase() === normalizedEmail);
      let terapeutaId: number | null = null;

      if (normalizedEmail.includes('recepcion')) {
        matchedUser = MOCK_USERS.find((u) => u.rol === 'RECEPCIONISTA') || MOCK_USERS[1];
      } else if (normalizedEmail.includes('elena')) {
        terapeutaId = 1;
        matchedUser = MOCK_USERS.find((u) => u.email.includes('elena')) || MOCK_USERS[2];
      } else if (normalizedEmail.includes('camila')) {
        terapeutaId = 2;
        matchedUser = MOCK_USERS.find((u) => u.email.includes('camila')) || MOCK_USERS[3];
      } else if (normalizedEmail.includes('lucia')) {
        terapeutaId = 3;
        matchedUser = MOCK_USERS.find((u) => u.email.includes('lucia')) || MOCK_USERS[4];
      } else if (!matchedUser) {
        // Default to Admin
        matchedUser = MOCK_USERS[0];
      }

      const mockData: LoginResponseData = {
        user: matchedUser || MOCK_USERS[0],
        terapeuta_id: terapeutaId,
        access: `mock-jwt-access-${Date.now()}`,
        refresh: `mock-jwt-refresh-${Date.now()}`,
      };

      localStorage.setItem('sumaq_access_token', mockData.access);
      localStorage.setItem('sumaq_refresh_token', mockData.refresh);
      localStorage.setItem('sumaq_user', JSON.stringify(mockData.user));
      if (terapeutaId) {
        localStorage.setItem('sumaq_terapeuta_id', terapeutaId.toString());
      } else {
        localStorage.removeItem('sumaq_terapeuta_id');
      }

      return mockData;
    }
  },

  getCurrentUser: async (): Promise<{ user: User; terapeuta_id?: number | null }> => {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User; terapeuta_id?: number | null }>>('/auth/me/');
      if (response.data?.data) return response.data.data;
      const stored = authService.getStoredUser();
      const tId = authService.getStoredTherapistId();
      return { user: stored || MOCK_USERS[0], terapeuta_id: tId };
    } catch {
      const stored = authService.getStoredUser();
      const tId = authService.getStoredTherapistId();
      return { user: stored || MOCK_USERS[0], terapeuta_id: tId };
    }
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
