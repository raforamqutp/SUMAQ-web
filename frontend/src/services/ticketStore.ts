import { Ticket, TicketPriority, TicketStatus, TicketType, JiraConfig } from '../types/tickets';

const STORAGE_KEY = 'sumaq_service_desk_tickets_v1';
const JIRA_CONFIG_KEY = 'sumaq_jira_config_v1';

const DEFAULT_JIRA_CONFIG: JiraConfig = {
  enabled: false,
  domain: 'https://sumaqspa.atlassian.net',
  email: 'admin@sumaqspa.pe',
  apiToken: '',
  projectKey: 'SQ'
};

// Semillas iniciales con los casos reales desarrollados para SUMAQ Spa (ITIL v4)
const SEED_TICKETS: Ticket[] = [
  {
    id: 'REQ-2026-0104',
    tipo: 'SOLICITUD_ACCESO',
    prioridad: 'P3_MEDIA',
    asunto: 'Alta de cuenta y acceso con rol TERAPEUTA',
    descripcion: 'Se solicita creación de credenciales para la terapeuta Camila Vega, asignada a Cabina 2 (Dermoestética) con permisos restringidos de solo lectura en inventario.',
    modulo: 'Usuarios y Accesos',
    solicitanteNombre: 'Elena Morales (Terapeuta Líder)',
    solicitanteEmail: 'elena.morales@sumaqspa.pe',
    solicitanteRol: 'TERAPEUTA',
    fechaCreacion: '2026-10-14 09:30:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-15 09:30:00',
    estado: 'RESUELTO',
    asignadoA: 'Anthony Luque (DevOps Lead)',
    resolucionTecnica: 'Usuario camila.vega@sumaqspa.pe creado en tabla usuarios con hash PBKDF2-SHA256. Rol TERAPEUTA asignado bajo principio de mínimo privilegio y Anti-IDOR verificado.',
    fechaResolucion: '2026-10-14 11:45:00',
    githubUrl: '',
    jiraKey: 'SQ-104',
    jiraUrl: 'https://sumaqspa.atlassian.net/browse/SQ-104'
  },
  {
    id: 'REQ-2026-0105',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Carga de receta BOM para Ritual Geotermal',
    descripcion: 'Requerimiento para dar de alta en el catálogo el tratamiento "Ritual Geotermal con Piedras Volcánicas" (60 min - S/ 160.00) y configurar su descuento automático de insumos (Aceite de Eucalipto 30ml, 2 toallas descartables).',
    modulo: 'Servicios y Recetas (BOM)',
    solicitanteNombre: 'Valeria Quispe (Recepción)',
    solicitanteEmail: 'recepcion@sumaqspa.pe',
    solicitanteRol: 'RECEPCIONISTA',
    fechaCreacion: '2026-10-15 14:10:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-16 14:10:00',
    estado: 'EN_PROCESO',
    asignadoA: 'Bryan Mango (DB & Backend Lead)',
    resolucionTecnica: 'Parámetros del servicio validados en catálogo. Procediendo a asociar insumos en la tabla recetas_servicio y prueba transaccional en Azure VM.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/issues/52',
    jiraKey: 'SQ-105',
    jiraUrl: 'https://sumaqspa.atlassian.net/browse/SQ-105'
  },
  {
    id: 'REQ-2026-0106',
    tipo: 'SOLICITUD_INFORMACION',
    prioridad: 'P2_ALTA',
    asunto: 'Reporte trimestral de rotación Kárdex y ventas para auditoría',
    descripcion: 'Se requiere reporte consolidado en CSV/Excel de todas las transacciones de caja chica y movimientos de Kárdex del último trimestre para auditoría tributaria externa.',
    modulo: 'Inventario y Kardex',
    solicitanteNombre: 'Administración General',
    solicitanteEmail: 'admin@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-16 10:15:00',
    slaHoras: 8,
    slaFechaLimite: '2026-10-16 18:15:00',
    estado: 'ABIERTO',
    asignadoA: 'Bryan Mango (Database Lead)',
    resolucionTecnica: 'En cola de ejecución para consulta SQL de solo lectura sobre el nodo de réplica MySQL Slave (puerto 3309), protegiendo el nodo Master 3308.',
    githubUrl: '',
    jiraKey: 'SQ-106',
    jiraUrl: 'https://sumaqspa.atlassian.net/browse/SQ-106'
  },
  {
    id: 'INC-2026-0089',
    tipo: 'INCIDENCIA',
    prioridad: 'P1_CRITICA',
    asunto: 'Bloqueo intermitente al confirmar citas en Cabina 1',
    descripcion: 'Al intentar confirmar citas consecutivas en Cabina 1 (Holística) se presentó contención de hilos en Gunicorn por solapamiento de bloqueos.',
    modulo: 'Agenda / Citas',
    solicitanteNombre: 'Elena Morales (Terapeuta)',
    solicitanteEmail: 'elena.morales@sumaqspa.pe',
    solicitanteRol: 'TERAPEUTA',
    fechaCreacion: '2026-10-13 16:00:00',
    slaHoras: 2,
    slaFechaLimite: '2026-10-13 18:00:00',
    estado: 'RESUELTO',
    asignadoA: 'Anthony Luque (DevOps) & Bryan Mango (Backend)',
    resolucionTecnica: 'Se optimizó la transacción en DisponibilidadService con select_for_update a nivel de fila y aislamiento ACID. Hotfix CHE-2026-001 desplegado en Azure VM.',
    fechaResolucion: '2026-10-13 17:25:00',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/pull/48',
    jiraKey: 'SQ-89',
    jiraUrl: 'https://sumaqspa.atlassian.net/browse/SQ-89'
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

  getJiraConfig(): JiraConfig {
    try {
      const data = localStorage.getItem(JIRA_CONFIG_KEY);
      if (!data) return DEFAULT_JIRA_CONFIG;
      return JSON.parse(data) as JiraConfig;
    } catch {
      return DEFAULT_JIRA_CONFIG;
    }
  },

  saveJiraConfig(config: JiraConfig): void {
    try {
      localStorage.setItem(JIRA_CONFIG_KEY, JSON.stringify(config));
      window.dispatchEvent(new Event('sumaq_jira_config_updated'));
    } catch (e) {
      console.error('Error saving Jira config', e);
    }
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
    const jiraConfig = this.getJiraConfig();
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

    const jiraKey = `${jiraConfig.projectKey || 'SQ'}-${count}`;
    const jiraUrl = `${jiraConfig.domain || 'https://sumaqspa.atlassian.net'}/browse/${jiraKey}`;

    const newTicket: Ticket = {
      id,
      tipo: payload.tipo,
      prioridad: payload.prioridad,
      asunto: payload.asunto.trim(),
      descripcion: payload.descripcion.trim(),
      modulo: payload.modulo,
      solicitanteNombre: payload.solicitanteNombre || 'Usuario Sumaq',
      solicitanteEmail: payload.solicitanteEmail || 'recepcion@sumaqspa.pe',
      solicitanteRol: payload.solicitanteRol || 'RECEPCIONISTA',
      fechaCreacion: formatDateTime(now),
      slaHoras,
      slaFechaLimite: formatDateTime(limite),
      estado: 'ABIERTO',
      asignadoA: 'Mesa de Ayuda TI (Nivel 1)',
      resolucionTecnica: '',
      githubUrl: '',
      jiraKey: jiraConfig.enabled ? jiraKey : undefined,
      jiraUrl: jiraConfig.enabled ? jiraUrl : undefined
    };

    const updated = [newTicket, ...tickets];
    this.saveTickets(updated);

    // Si Jira Cloud está habilitado con credenciales, sincronizar en vivo con la API v3
    if (jiraConfig.enabled && jiraConfig.apiToken && jiraConfig.domain) {
      fetch('/api/ti/jira/create-issue/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: jiraConfig.domain,
          email: jiraConfig.email,
          api_token: jiraConfig.apiToken,
          project_key: jiraConfig.projectKey || 'SQ',
          summary: `[${id}] ${payload.asunto}`,
          description: payload.descripcion,
          issue_type: isIncident ? 'Bug' : 'Task'
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.key) {
            this.updateTicket(id, { jiraKey: data.key, jiraUrl: data.url });
          }
        })
        .catch(err => {
          console.warn('Jira Cloud background sync fallback to local key:', err);
        });
    }

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
