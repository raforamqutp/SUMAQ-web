export type TicketType = 'SOLICITUD_SERVICIO' | 'SOLICITUD_INFORMACION' | 'SOLICITUD_ACCESO' | 'INCIDENCIA';

export type TicketPriority = 'P1_CRITICA' | 'P2_ALTA' | 'P3_MEDIA' | 'P4_BAJA';

export type TicketStatus = 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';

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
  resolucionTecnica?: string;
  fechaResolucion?: string;
  githubUrl?: string;
}
