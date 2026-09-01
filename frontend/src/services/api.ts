import axios from 'axios';

/**
 * ============================================================================
 * CAPA DE COMUNICACIÓN HTTP: AXIOS CLIENT & JWT INTERCEPTORS
 * ============================================================================
 * Centraliza las peticiones hacia el Backend RESTful (Django/FastAPI):
 * - baseURL: Inyecta la variable de entorno VITE_API_URL o fallback a localhost:8000.
 * - Request Interceptor: Inyecta automáticamente 'Authorization: Bearer <token>'
 *   en cada petición si el usuario ha iniciado sesión.
 * - Response Interceptor: Si recibe un código 401 (Token Expirado), intenta
 *   renovar el access_token utilizando el refresh_token de forma transparente.
 * ============================================================================
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitudes: Adjunta token JWT si existe en localStorage
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

// Response interceptor: standard error extraction & token refresh handling
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
          // If on a protected route, could redirect
        }
      }
    }
    return Promise.reject(error);
  }
);

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

