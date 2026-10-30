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
