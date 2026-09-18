// Cliente HTTP centralizado con Axios, inyección de token JWT y auto-refresh

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes: adjunta el token JWT de acceso en cabeceras de autorización
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sumaq_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: renueva el access token con el refresh token si expira (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('sumaq_refresh_token');
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('sumaq_access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('sumaq_access_token');
          localStorage.removeItem('sumaq_refresh_token');
          localStorage.removeItem('sumaq_user');
          // En caso de fallo de refresh, la sesión se invalida y el contexto redirigirá a login
        }
      }
    }
    return Promise.reject(error);
  }
);

// Descarga segura de comprobantes PDF mediante streaming Blob con fallback a URL autenticada
export async function downloadPdf(endpointUrl: string, defaultFilename: string = 'Comprobante_Sumaq.pdf') {
  try {
    const response = await apiClient.get(endpointUrl, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Error descargando PDF mediante blob:', error);
    const token = localStorage.getItem('sumaq_access_token');
    const separator = endpointUrl.includes('?') ? '&' : '?';
    const fullUrl = endpointUrl.startsWith('http')
      ? endpointUrl
      : `${API_BASE_URL}${endpointUrl.startsWith('/') ? '' : '/'}${endpointUrl}`;
    const targetUrl = token ? `${fullUrl}${separator}token=${token}` : fullUrl;
    window.open(targetUrl, '_blank');
  }
}

