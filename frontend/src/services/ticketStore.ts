import { Ticket, TicketPriority, TicketStatus, TicketType } from '../types/tickets';

const STORAGE_KEY = 'sumaq_service_desk_tickets_v1';

// Semillas iniciales con los casos reales desarrollados para SUMAQ Spa (ITIL v4)
const SEED_TICKETS: Ticket[] = [
  {
    id: 'REQ-2026-0104',
    tipo: 'SOLICITUD_ACCESO',
    prioridad: 'P3_MEDIA',
    asunto: 'Alta de cuenta y acceso con rol TERAPEUTA',
    descripcion: 'Se solicita creación de credenciales para la terapeuta Camila Vega, asignada a Cabina 2 (Sede Miraflores) con permisos restringidos de solo lectura en inventario.',
    modulo: 'Usuarios y Accesos',
    solicitanteNombre: 'Administración Spa',
    solicitanteEmail: 'admin@sumaqspa.com',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-14 09:30:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-15 09:30:00',
    estado: 'RESUELTO',
    asignadoA: 'Ing. TI - Soporte N2',
    resolucionTecnica: 'Usuario cvega@sumaqspa.com creado exitosamente en tabla usuarios con hash Argon2. Rol TERAPEUTA asignado bajo principio de menor privilegio.',
    fechaResolucion: '2026-10-14 11:45:00',
    githubUrl: ''
  },
  {
    id: 'REQ-2026-0105',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Carga de receta BOM para Ritual Geotermal',
    descripcion: 'Requerimiento para dar de alta en el catálogo el tratamiento "Ritual Geotermal Descontracturante" (80 min) y configurar su descuento automático de insumos (Piedras volcánicas, Aceite de lavanda 30ml, Crema base).',
    modulo: 'Servicios y Recetas (BOM)',
    solicitanteNombre: 'Carla Recepción',
    solicitanteEmail: 'recepcion@sumaqspa.com',
    solicitanteRol: 'RECEPCIONISTA',
    fechaCreacion: '2026-10-15 14:10:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-16 14:10:00',
    estado: 'EN_PROCESO',
    asignadoA: 'Especialista Sistemas TI',
    resolucionTecnica: 'Parámetros del servicio validados. Procediendo a asociar consumibles en el módulo de inventario.',
    githubUrl: 'https://github.com/alexi/SUMAQ-web/issues/52'
  },
  {
    id: 'REQ-2026-0106',
    tipo: 'SOLICITUD_INFORMACION',
    prioridad: 'P2_ALTA',
    asunto: 'Reporte trimestral de rotación kardex y ventas',
    descripcion: 'Se requiere reporte consolidado en CSV/Excel de todas las atenciones y consumo de insumos del último trimestre para auditoría contable.',
    modulo: 'Inventario y Kardex',
    solicitanteNombre: 'Administración Spa',
    solicitanteEmail: 'admin@sumaqspa.com',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-16 10:15:00',
    slaHoras: 8,
    slaFechaLimite: '2026-10-16 18:15:00',
    estado: 'ABIERTO',
    asignadoA: 'DBA / Soporte TI',
    resolucionTecnica: 'En cola de ejecución para consulta SQL de solo lectura sobre el nodo de réplica MySQL Slave (puerto 3309).',
    githubUrl: ''
  },
  {
    id: 'INC-2026-0089',
    tipo: 'INCIDENCIA',
    prioridad: 'P1_CRITICA',
    asunto: 'Bloqueo intermitente al confirmar citas en Cabina 1',
    descripcion: 'Al intentar confirmar citas consecutivas a las 11:00 am se presentó un mensaje de tiempo de espera agotado (Timeout) en el frontend.',
    modulo: 'Agenda / Citas',
    solicitanteNombre: 'Elena Torres (Terapeuta)',
    solicitanteEmail: 'terapeuta@sumaqspa.com',
    solicitanteRol: 'TERAPEUTA',
    fechaCreacion: '2026-10-13 16:00:00',
    slaHoras: 2,
    slaFechaLimite: '2026-10-13 18:00:00',
    estado: 'RESUELTO',
    asignadoA: 'Ing. DevOps TI',
    resolucionTecnica: 'Se optimizó la transacción en DisponibilidadService con select_for_update para evitar bloqueos de fila. RFC desplegado en VM Azure.',
    fechaResolucion: '2026-10-13 17:25:00',
    githubUrl: 'https://github.com/alexi/SUMAQ-web/pull/48'
  }
];

export const TicketStore = {
  getTickets(): Ticket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveTickets(SEED_TICKETS);
        return SEED_TICKETS;
      }
      return JSON.parse(data) as Ticket[];
    } catch {
      return SEED_TICKETS;
    }
  },

  saveTickets(tickets: Ticket[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      window.dispatchEvent(new Event('sumaq_tickets_updated'));
    } catch (e) {
      console.error('Error saving tickets to localStorage', e);
    }
  },

  getTicketsByUser(userEmail?: string): Ticket[] {
    const all = this.getTickets();
    if (!userEmail) return all;
    return all.filter(t => t.solicitanteEmail.toLowerCase() === userEmail.toLowerCase());
  },

  createTicket(payload: {
    tipo: TicketType;
    prioridad: TicketPriority;
    asunto: string;
    descripcion: string;
    modulo: string;
    solicitanteNombre: string;
    solicitanteEmail: string;
    solicitanteRol: string;
  }): Ticket {
    const tickets = this.getTickets();
    const isIncident = payload.tipo === 'INCIDENCIA';
    const prefix = isIncident ? 'INC' : 'REQ';
    const year = new Date().getFullYear();
    const count = tickets.filter(t => t.id.startsWith(prefix)).length + 101;
    const id = `${prefix}-${year}-0${count}`;

    // Cálculo de horas de SLA según matriz ITIL de Semana 10
    let slaHoras = 24;
    if (payload.prioridad === 'P1_CRITICA') slaHoras = 2;
    else if (payload.prioridad === 'P2_ALTA') slaHoras = 8;
    else if (payload.prioridad === 'P3_MEDIA') slaHoras = 24;
    else if (payload.prioridad === 'P4_BAJA') slaHoras = 48;

    const now = new Date();
    const limite = new Date(now.getTime() + slaHoras * 60 * 60 * 1000);

    const formatDateTime = (d: Date) => {
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const newTicket: Ticket = {
      id,
      tipo: payload.tipo,
      prioridad: payload.prioridad,
      asunto: payload.asunto.trim(),
      descripcion: payload.descripcion.trim(),
      modulo: payload.modulo,
      solicitanteNombre: payload.solicitanteNombre || 'Usuario Sumaq',
      solicitanteEmail: payload.solicitanteEmail || 'usuario@sumaqspa.com',
      solicitanteRol: payload.solicitanteRol || 'TERAPEUTA',
      fechaCreacion: formatDateTime(now),
      slaHoras,
      slaFechaLimite: formatDateTime(limite),
      estado: 'ABIERTO',
      asignadoA: 'Mesa de Ayuda TI (Nivel 1)',
      resolucionTecnica: '',
      githubUrl: ''
    };

    const updated = [newTicket, ...tickets];
    this.saveTickets(updated);
    return newTicket;
  },

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | null {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return null;

    const current = tickets[index];
    const updatedTicket: Ticket = {
      ...current,
      ...updates
    };

    if (updates.estado === 'RESUELTO' && !updatedTicket.fechaResolucion) {
      const now = new Date();
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      updatedTicket.fechaResolucion = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  resetDefaults(): void {
    this.saveTickets(SEED_TICKETS);
  }
};
