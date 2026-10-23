import { Ticket, TicketPriority, TicketType, JiraConfig } from '../types/tickets';

const STORAGE_KEY = 'sumaq_itil_tickets_v1';
const JIRA_CONFIG_KEY = 'sumaq_jira_config_v1';

const DEFAULT_JIRA_CONFIG: JiraConfig = {
  enabled: true,
  domain: 'https://sumaq-dev.atlassian.net',
  email: 'rafaelramirez.utp@gmail.com',
  apiToken: 'ATATT3xFfGF08u8nxmTYWYA6tO8DXXnlt-VwiaRooWs_U6BVL91xLOvnbB0JvZ3V-WqEQ2UIpnyQTo5ry8-4KlViLK3OnIXF527t4wT6jdFk2RZ38iiYZGyADe9_KzeovB9N7eZaBLBG0nVquqVhKd-nU32-4BKyLkx7oNVqnYMS6WrHyF7ZTGc=E4530C32',
  projectKey: 'KAN'
};

const SEED_TICKETS: Ticket[] = [
  {
    id: 'REQ-2026-0001',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Desacoplamiento total de datos simulados hacia API REST real',
    descripcion: 'Reemplazo de estados estáticos en frontend por endpoints Django /api/ en citas, inventario y finanzas.',
    modulo: 'Frontend & APIs',
    solicitanteNombre: 'Rafael Ramirez Quiroz (RQ)',
    solicitanteEmail: 'rafaelramirez.utp@gmail.com',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-24 06:06:00',
    estado: 'RESUELTO',
    asignadoA: 'Rafael Ramirez Quiroz (RQ)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'Rafael Ramirez (Gerente General)',
    resolucionTecnica: 'Endpoints en /api/ conectando servicios de citas y pagos con axios y React Query.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-1',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-1'
  },
  {
    id: 'REQ-2026-0008',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Scripts de backup y restore transaccional con detección de MySQL 8.0',
    descripcion: 'Ejecución de backup_docker.bat con mysqldump --single-transaction --quick y compresión gzip hacia el esclavo 3309.',
    modulo: 'Infraestructura & BD',
    solicitanteNombre: 'Anthony Luque (AL)',
    solicitanteEmail: 'anthony.luque@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-24 06:06:00',
    estado: 'RESUELTO',
    asignadoA: 'Anthony Luque (AL)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'Rafael Ramirez (Gerente General)',
    resolucionTecnica: 'Script verificado con Checksum MD5 y Seconds_Behind_Master: 0 en contenedor 3309.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-8',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-8'
  },
  {
    id: 'REQ-2026-0007',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Ajuste de sintaxis SQL reemplazando ON DELETE PROTECT por RESTRICT',
    descripcion: 'Normalización de restricciones de integridad referencial para compatibilidad estricta con MySQL 8.0 y Django ORM.',
    modulo: 'Base de Datos MySQL',
    solicitanteNombre: 'Anthony Luque (AL)',
    solicitanteEmail: 'anthony.luque@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-24 06:06:00',
    estado: 'RESUELTO',
    asignadoA: 'Anthony Luque (AL)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'Rafael Ramirez (Gerente General)',
    resolucionTecnica: 'Esquema de migración makemigrations generado con integridad referencial validada en tests unitarios.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-7',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-7'
  },
  {
    id: 'REQ-2026-0006',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Implementación de Rate Limiting y auto-logout por inactividad',
    descripcion: 'Middleware de seguridad contra ataques de fuerza bruta y expiración de tokens JWT en 120 minutos.',
    modulo: 'Seguridad & Auth',
    solicitanteNombre: 'Rafael Ramirez Quiroz (RQ)',
    solicitanteEmail: 'rafaelramirez.utp@gmail.com',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-24 06:06:00',
    estado: 'RESUELTO',
    asignadoA: 'Bryan Alexis Mango (BT)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'Rafael Ramirez (Gerente General)',
    resolucionTecnica: 'Seguridad RBAC configurada en común permissions.py y middleware de expiración de sesión.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-6',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-6'
  },
  {
    id: 'REQ-2026-0015',
    tipo: 'SOLICITUD_ACCESO',
    prioridad: 'P2_ALTA',
    asunto: 'Alta de cuenta para nueva recepcionista Camila Vega (Turno Tarde)',
    descripcion: 'Creación de usuario en el sistema con permisos de cobro POS, agenda y emisión de boletas tributarias.',
    modulo: 'Usuarios & Roles',
    solicitanteNombre: 'Recepcionista Principal',
    solicitanteEmail: 'recepcion@sumaqspa.pe',
    solicitanteRol: 'RECEPCIONISTA',
    fechaCreacion: '2026-10-23 09:30:00',
    slaHoras: 8,
    slaFechaLimite: '2026-10-23 17:30:00',
    estado: 'PENDIENTE_APROBACION',
    asignadoA: 'Anthony Luque (AL)',
    aprobadoPorGerencia: false,
    resolucionTecnica: '',
    jiraKey: 'KAN-15',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-15',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti'
  },
  {
    id: 'REQ-2026-0025',
    tipo: 'INCIDENCIA',
    prioridad: 'P2_ALTA',
    asunto: 'Implementación de arquitectura y monitor de replicación MySQL Master-Slave',
    descripcion: 'Configuración de nodo 3308 como maestro transaccional y 3309 como réplica de lectura para analítica de caja.',
    modulo: 'Base de Datos MySQL',
    solicitanteNombre: 'Bryan Mango (BT)',
    solicitanteEmail: 'bryan.mango@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 8,
    slaFechaLimite: '2026-10-23 14:06:00',
    estado: 'EN_PROCESO',
    asignadoA: 'Rafael Ramirez Quiroz (RQ)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'Rafael Ramirez (Gerente General)',
    resolucionTecnica: 'Slave_IO_Running: Yes, Slave_SQL_Running: Yes, Seconds_Behind_Master: 0.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-25',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-25'
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

  async syncWithBackend(): Promise<Ticket[]> {
    try {
      const resp = await fetch('/api/ti/tickets/');
      if (resp.ok) {
        const data = await resp.json();
        const list: Ticket[] = Array.isArray(data) ? data : (data.results || []);
        if (list.length > 0) {
          this.saveTickets(list);
          return list;
        }
      }
    } catch (e) {
      console.warn('[TicketStore] Backend offline, usando caché local:', e);
    }
    return this.getTickets();
  },

  saveTickets(tickets: Ticket[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      window.dispatchEvent(new Event('sumaq_tickets_updated'));
    } catch (e) {
      console.error('Error saving tickets', e);
    }
  },

  getTicketById(id: string): Ticket | undefined {
    return this.getTickets().find(t => t.id === id);
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

  async createTicket(payload: {
    tipo: TicketType;
    prioridad: TicketPriority;
    asunto: string;
    descripcion: string;
    modulo: string;
    solicitanteNombre: string;
    solicitanteEmail: string;
    solicitanteRol: string;
  }): Promise<Ticket> {
    const isIncident = payload.tipo === 'INCIDENCIA';
    const isAccess = payload.tipo === 'SOLICITUD_ACCESO';
    const prefix = isIncident ? 'INC' : 'REQ';
    const year = new Date().getFullYear();
    const count = this.getTickets().length + 10;
    const localId = `${prefix}-${year}-00${count}`;

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

    const optimisticTicket: Ticket = {
      id: localId,
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
      estado: isAccess ? 'PENDIENTE_APROBACION' : 'ABIERTO',
      asignadoA: 'Rafael Ramirez Quiroz (RQ)',
      aprobadoPorGerencia: !isAccess,
      resolucionTecnica: '',
      githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestion-ti'
    };

    // Guardar optimísticamente en local
    const current = this.getTickets();
    this.saveTickets([optimisticTicket, ...current]);

    // Enviar al Backend Django REST
    try {
      const resp = await fetch('/api/ti/tickets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: payload.tipo,
          prioridad: payload.prioridad,
          modulo: payload.modulo,
          asunto: payload.asunto.trim(),
          descripcion: payload.descripcion.trim(),
          solicitante_nombre: payload.solicitanteNombre,
          solicitante_email: payload.solicitanteEmail,
          solicitante_rol: payload.solicitanteRol
        })
      });

      if (resp.ok) {
        const created: Ticket = await resp.json();
        // Reemplazar ticket local con datos del backend (incluyendo Jira key)
        const updated = this.getTickets().map(t => t.id === localId ? created : t);
        this.saveTickets(updated);
        return created;
      }
    } catch (e) {
      console.warn('[TicketStore] Error enviando a backend, conservando copia local:', e);
    }

    return optimisticTicket;
  },

  async approveTicket(id: string, aprobadorNombre?: string): Promise<boolean> {
    try {
      const resp = await fetch(`/api/ti/tickets/${id}/aprobar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobador_nombre: aprobadorNombre || 'Gerencia General (Dueño)' })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ticket) {
          this.updateLocalTicket(id, data.ticket);
          return true;
        }
      }
    } catch (e) {
      console.warn('[TicketStore] Fallo en API aprobar, aplicando local:', e);
    }

    // Fallback local
    this.updateLocalTicket(id, {
      estado: 'APROBADO',
      aprobadoPorGerencia: true,
      aprobadorNombre: aprobadorNombre || 'Rafael Ramirez (Gerente General)',
      fechaAprobacion: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    return true;
  },

  async resolveTicket(id: string, payload: {
    resolucionTecnica: string;
    asignadoA?: string;
    githubUrl?: string;
    jiraKey?: string;
  }): Promise<boolean> {
    try {
      const resp = await fetch(`/api/ti/tickets/${id}/resolver/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolucion_tecnica: payload.resolucionTecnica,
          asignado_a: payload.asignadoA,
          github_url: payload.githubUrl,
          jira_key: payload.jiraKey
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ticket) {
          this.updateLocalTicket(id, data.ticket);
          return true;
        }
      }
    } catch (e) {
      console.warn('[TicketStore] Fallo en API resolver, aplicando local:', e);
    }

    // Fallback local
    this.updateLocalTicket(id, {
      estado: 'RESUELTO',
      resolucionTecnica: payload.resolucionTecnica,
      asignadoA: payload.asignadoA,
      githubUrl: payload.githubUrl,
      jiraKey: payload.jiraKey,
      fechaResolucion: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    return true;
  },

  updateLocalTicket(id: string, updates: Partial<Ticket>): Ticket | null {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return null;

    const updated = { ...tickets[index], ...updates };
    tickets[index] = updated;
    this.saveTickets(tickets);
    return updated;
  },

  resetDefaults(): void {
    this.saveTickets(SEED_TICKETS);
  }
};
