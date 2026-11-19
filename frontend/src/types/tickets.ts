export type TicketType = 'SOLICITUD_SERVICIO' | 'SOLICITUD_INFORMACION' | 'SOLICITUD_ACCESO' | 'INCIDENCIA' | 'SOLICITUD_CAMBIO';

export type TicketPriority = 'P1_CRITICA' | 'P2_ALTA' | 'P3_MEDIA' | 'P4_BAJA';

export type TicketStatus = 'ABIERTO' | 'EN_PROCESO' | 'PENDIENTE_APROBACION' | 'APROBADO' | 'RESUELTO' | 'CERRADO';

export type AreaCambio = 'INFRAESTRUCTURA' | 'APLICACIONES' | 'DOCUMENTACION' | 'CALENDARIO';

export type TipoCambio = 'NORMAL' | 'EMERGENCIA' | 'ESTANDAR';

export type ImpactoRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';

export interface JiraConfig {
  enabled: boolean;
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface Ticket {
  id: string;
  tipo: TicketType;
  prioridad: TicketPriority;
  asunto: string;
  descripcion: string;
  modulo: string;
  solicitanteNombre: string;
  solicitanteEmail: string;
  solicitanteRol: string;
  fechaCreacion: string;
  slaHoras: number;
  slaFechaLimite: string;
  estado: TicketStatus;
  asignadoA?: string;
  aprobadoPorGerencia?: boolean;
  aprobadorNombre?: string;
  fechaAprobacion?: string;
  resolucionTecnica?: string;
  fechaResolucion?: string;
  githubUrl?: string;
  jiraKey?: string;
  jiraUrl?: string;

  // ITIL v4 Change Management (Semana 11)
  areaCambio?: AreaCambio;
  tipoCambio?: TipoCambio;
  impactoRiesgo?: ImpactoRiesgo;
  ventanaMantenimiento?: string;
  planRollback?: string;
  cabAprobador?: string;
  cabActa?: string;
  cabFechaAprobacion?: string;
}


export interface IncidenciaModuloStat {
  modulo: string;
  count: number;
  percentage: number;
}

export interface UltimoCambioArea {
  codigo: string;
  asunto: string;
  tipo_cambio: string;
  impacto_riesgo: string;
  estado: string;
  cab_acta_numero?: string;
  cab_aprobado_por?: string;
  fecha?: string;
}

export interface ProblemaDetectado {
  modulo: string;
  incidencias_count: number;
  sugerencia_itil: string;
  estado_problema: string;
  tickets_relacionados: string[];
}

export interface IncidenciaPendiente {
  codigo: string;
  asunto: string;
  modulo: string;
  tipo: string;
  prioridad: string;
  estado: string;
  solicitante: string;
  sla_fecha_limite: string;
}

export interface ITILDashboardMetrics {
  total: number;
  abiertos: number;
  en_proceso: number;
  pendientes_aprobacion: number;
  aprobados: number;
  resueltos: number;
  sla_cumplimiento_porcentaje: number;
  total_rfcs: number;
  rfcs_aprobados: number;
  rfcs_pendientes: number;
  incidencias_por_modulo: IncidenciaModuloStat[];
  ultima_incidencia: any | null;
  ultimo_cambio_por_area: Record<string, UltimoCambioArea | null>;
  problemas_detectados: ProblemaDetectado[];
  incidencias_pendientes: IncidenciaPendiente[];
}

export interface KdbArticle {
  id: number;
  codigo: string;
  titulo: string;
  categoria: string;
  modulo: string;
  prioridad: TicketPriority | string;
  sintoma: string;
  causaRaiz: string;
  causa_raiz?: string;
  solucionWorkaround: string;
  solucion_workaround?: string;
  tiempoEstimado: string;
  tiempo_estimado?: string;
  jiraRef?: string;
  jira_ref?: string;
  activo: boolean;
  vecesUtilizado?: number;
  veces_utilizado?: number;
  created_at?: string;
  updated_at?: string;
}

export type MonitoringEventLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type MonitoringComponent =
  | 'MYSQL_MASTER'
  | 'MYSQL_SLAVE'
  | 'REDIS_CACHE'
  | 'BACKEND_API'
  | 'NGINX_GATEWAY'
  | 'PASARELA_NIUBIZ'
  | 'SEGURIDAD_AUTH'
  | 'HOST_SISTEMA';

export type MonitoringEventStatus = 'ACTIVO' | 'MITIGADO' | 'ESCALADO' | 'CERRADO';

export interface MonitoringEvent {
  id: number;
  codigo: string;
  nivel: MonitoringEventLevel;
  nivelDisplay?: string;
  componente: MonitoringComponent | string;
  componenteDisplay?: string;
  metrica: string;
  valorRegistrado: string;
  valor_registrado?: string;
  valorNumerico: number;
  valor_numerico?: number;
  umbralReferencia: string;
  umbral_referencia?: string;
  descripcion: string;
  procesoNegocio: string;
  proceso_negocio?: string;
  generaIncidente: boolean;
  genera_incidente?: boolean;
  justificacionIncidente: string;
  justificacion_incidente?: string;
  impacto: 'BAJO' | 'MEDIO' | 'ALTO';
  urgencia: 'BAJA' | 'MEDIA' | 'ALTA';
  prioridadAsignada: string;
  prioridad_asignada?: string;
  responsable: string;
  accionRespuesta: string;
  accion_respuesta?: string;
  tiempoRespuestaMax: string;
  tiempo_respuesta_max?: string;
  estado: MonitoringEventStatus;
  estadoDisplay?: string;
  ticketCodigo: string;
  ticket_codigo?: string;
  fechaDeteccion?: string;
  created_at?: string;
}

export interface PoliticaMonitoreo {
  metrica: string;
  componente: string;
  umbral_info: string;
  umbral_warning: string;
  umbral_error: string;
  umbral_critical: string;
  intervalo: string;
}

export interface MonitoringHealthResponse {
  timestamp: string;
  servicios: {
    database: {
      nombre: string;
      engine: string;
      online: boolean;
      latencia_ms: number;
      nivel: MonitoringEventLevel;
      umbral: string;
      registros_ti: number;
    };
    memory: {
      nombre: string;
      used_pct: number;
      used_gb: number;
      total_gb: number;
      free_gb: number;
      nivel: MonitoringEventLevel;
      umbral: string;
    };
    disk: {
      nombre: string;
      used_pct: number;
      used_gb: number;
      total_gb: number;
      free_gb: number;
      nivel: MonitoringEventLevel;
      umbral: string;
    };
    cache_api: {
      nombre: string;
      online: boolean;
      redis_socket: boolean;
      latencia_ms: number;
      nivel: MonitoringEventLevel;
      umbral: string;
    };
  };
  resumen_eventos: {
    total: number;
    info: number;
    warning: number;
    error: number;
    critical: number;
    incidentes_generados: number;
    activos: number;
    mitigados: number;
  };
  politicas_monitoreo: PoliticaMonitoreo[];
}

