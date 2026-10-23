import { Ticket, TicketPriority, TicketStatus, TicketType, JiraConfig } from '../types/tickets';

const STORAGE_KEY = 'sumaq_service_desk_tickets_v1';
const JIRA_CONFIG_KEY = 'sumaq_jira_config_v1';

export const DEFAULT_JIRA_CONFIG: JiraConfig = {
  enabled: true,
  domain: 'https://sumaq-dev.atlassian.net',
  email: 'rafaelramirez.utp@gmail.com',
  apiToken: '',
  projectKey: 'KAN'
};

// Semillas oficiales sincronizadas con el espacio real Sumaq Spa TI (sumaq-dev.atlassian.net)
export const SEED_TICKETS: Ticket[] = [
  {
    id: 'REQ-2026-0009',
    tipo: 'SOLICITUD_CAMBIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Desacoplamiento total de datos simulados hacia la API de Django',
    descripcion: 'Reemplazo de estados locales en frontend por endpoints REST reales y sincronización de citas en tiempo real.',
    modulo: 'Frontend & API',
    solicitanteNombre: 'Alexis _Bryan',
    solicitanteEmail: 'bryan.mango@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-24 06:06:00',
    estado: 'EN_PROCESO',
    asignadoA: 'Rafael Ramirez Quiroz (RQ)',
    resolucionTecnica: 'Endpoints en /api/ conectando servicios de citas y pagos con axios y React Query.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-9',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-9'
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
    estado: 'EN_PROCESO',
    asignadoA: 'Anthony Luque (AL)',
    resolucionTecnica: 'Script verificado con Checksum MD5 y Seconds_Behind_Master: 0 en contenedor 3309.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
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
    estado: 'EN_PROCESO',
    asignadoA: 'Anthony Luque (AL)',
    resolucionTecnica: 'Esquema de migración makemigrations generado con integridad referencial validada en tests unitarios.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
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
    estado: 'EN_PROCESO',
    asignadoA: 'Bryan Alexis Mango (BT)',
    resolucionTecnica: 'test_account_lockout_after_five_failed_attempts aprobado con código HTTP 429.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-6',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-6'
  },
  {
    id: 'INC-2026-0005',
    tipo: 'INCIDENCIA',
    prioridad: 'P1_CRITICA',
    asunto: 'Bloqueo temporal de cuenta de usuario tras 5 intentos fallidos',
    descripcion: 'Protección contra intrusiones por diccionario con bloqueo transaccional de 15 minutos verificado en test_auth.py.',
    modulo: 'Seguridad & Auth',
    solicitanteNombre: 'Sistema Automatizado de Monitoreo',
    solicitanteEmail: 'telemetria@sumaqspa.pe',
    solicitanteRol: 'SISTEMA',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 2,
    slaFechaLimite: '2026-10-23 08:06:00',
    estado: 'RESUELTO',
    asignadoA: 'Rafael Ramirez Quiroz (RQ)',
    resolucionTecnica: 'Parche aplicado con recálculo atómico en Redis / Base de datos. Estado normalizado.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-5',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-5'
  },
  {
    id: 'REQ-2026-0024',
    tipo: 'INCIDENCIA',
    prioridad: 'P2_ALTA',
    asunto: 'Orquestación multicontenedor con Docker Compose (Frontend, Backend, MySQL Master/Slave)',
    descripcion: 'Pila inmutable desplegada en Azure VM (68.155.146.110) con aislamiento de redes y volúmenes persistentes.',
    modulo: 'DevOps & Cloud',
    solicitanteNombre: 'Anthony Luque (AL)',
    solicitanteEmail: 'anthony.luque@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 8,
    slaFechaLimite: '2026-10-23 14:06:00',
    estado: 'EN_PROCESO',
    asignadoA: 'Bryan Alexis Mango (BT)',
    resolucionTecnica: 'docker-compose.yml verificado con docker compose config sin errores sintácticos.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-24',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-24'
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
    resolucionTecnica: 'Slave_IO_Running: Yes, Slave_SQL_Running: Yes, Seconds_Behind_Master: 0.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-25',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-25'
  },
  {
    id: 'REQ-2026-0026',
    tipo: 'SOLICITUD_SERVICIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Documentación de evidencias técnicas para los 20 riesgos del proyecto',
    descripcion: 'Compilación de la matriz de mitigación técnica y pruebas unitarias Pytest 20/20 pasando en el pipeline de CI.',
    modulo: 'Calidad & Auditoría',
    solicitanteNombre: 'Rafael Ramirez Quiroz (RQ)',
    solicitanteEmail: 'rafaelramirez.utp@gmail.com',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-23 06:06:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-24 06:06:00',
    estado: 'ABIERTO',
    asignadoA: 'Anthony Luque (AL)',
    resolucionTecnica: 'Suite completa en pytest backend/tests/ aprobada al 100%.',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
    jiraKey: 'KAN-26',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-26'
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
      const list = JSON.parse(data) as Ticket[];
      // Si tiene las semillas de la semana anterior (SQ-104), actualizar automáticamente a KAN
      if (list.length > 0 && list[0].jiraKey?.startsWith('SQ-')) {
        this.saveTickets(SEED_TICKETS);
        return SEED_TICKETS;
      }
      return list;
    } catch {
      return SEED_TICKETS;
    }
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

  getTicketsByUser(userEmail?: string): Ticket[] {
    const all = this.getTickets();
    if (!userEmail) return all;
    return all.filter(t => t.solicitanteEmail.toLowerCase() === userEmail.toLowerCase());
  },

  getJiraConfig(): JiraConfig {
    try {
      const data = localStorage.getItem(JIRA_CONFIG_KEY);
      if (!data) return DEFAULT_JIRA_CONFIG;
      const parsed = JSON.parse(data) as JiraConfig;
      // Si tenía el dominio anterior de prueba, actualizar al real
      if (parsed.domain?.includes('sumaqspa.atlassian.net') || parsed.projectKey === 'SQ') {
        this.saveJiraConfig(DEFAULT_JIRA_CONFIG);
        return DEFAULT_JIRA_CONFIG;
      }
      return parsed;
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
    const count = tickets.length + 10;
    const id = `${prefix}-${year}-00${count}`;

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

    const jiraKey = `${jiraConfig.projectKey || 'KAN'}-${count}`;
    const jiraUrl = `${jiraConfig.domain || 'https://sumaq-dev.atlassian.net'}/browse/${jiraKey}`;

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
      asignadoA: 'Rafael Ramirez Quiroz (RQ)',
      resolucionTecnica: '',
      githubUrl: 'https://github.com/raforamqutp/SUMAQ/tree/feature/diseno-frontend-gestion-ti',
      jiraKey: jiraConfig.enabled ? jiraKey : undefined,
      jiraUrl: jiraConfig.enabled ? jiraUrl : undefined
    };

    const updated = [newTicket, ...tickets];
    this.saveTickets(updated);

    if (jiraConfig.enabled && jiraConfig.domain) {
      fetch('/api/ti/jira/create-issue/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: jiraConfig.domain,
          email: jiraConfig.email,
          api_token: jiraConfig.apiToken,
          project_key: jiraConfig.projectKey || 'KAN',
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
          console.warn('Jira Cloud background sync fallback:', err);
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
