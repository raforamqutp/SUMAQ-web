// Envoltorios genéricos estándar para respuestas del backend Django REST Framework

// Estructura estándar de respuesta exitosa con payload genérico
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Estructura de paginación server-side con metadatos de navegación
export interface ApiPaginatedData<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Estructura normalizada de errores HTTP (4xx / 5xx) con detalle de validación de campos
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
