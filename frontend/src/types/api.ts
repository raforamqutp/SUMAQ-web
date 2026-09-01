/**
 * ============================================================================
 * CONTRATOS DE RESPUESTAS HTTP (API Response Interfaces)
 * ============================================================================
 * Estandariza la estructura JSON que retorna el backend Django/FastAPI:
 * - ApiResponse<T>: Envoltorio genérico estándar con éxito y datos.
 * - ApiPaginatedData<T>: Paginación con total de registros y páginas.
 * - ApiError: Formato homogéneo de captura y reporte de errores.
 * ============================================================================
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiPaginatedData<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
