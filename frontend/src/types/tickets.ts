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
