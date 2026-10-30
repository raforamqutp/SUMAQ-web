import { Ticket, TicketPriority, TicketType, JiraConfig, AreaCambio, TipoCambio, ImpactoRiesgo, ITILDashboardMetrics } from '../types/tickets';

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
  // =========================================================================
  // MESA DE AYUDA / SERVICE DESK (ITIL v4)
  // =========================================================================
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
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestión-ti',
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
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestión-ti',
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
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestión-ti',
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
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestión-ti',
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
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestión-ti'
  },
  {
    id: 'REQ-2026-0025',
    tipo: 'INCIDENCIA',
    prioridad: 'P2_ALTA',
    asunto: 'Implementación de arquitectura y monitor de réplicación MySQL Master-Slave',
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
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/diseno-frontend-gestión-ti',
    jiraKey: 'KAN-25',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-25'
  },

  // =========================================================================
  // CONTROL DE CAMBIOS RFC & COMITÉ CAB (ITIL v4)
  // =========================================================================
  // ÁREA 1: INFRAESTRUCTURA (Redes, Switch Cisco, VLANs 10/20/30)
  {
    id: 'RFC-2026-0050',
    tipo: 'SOLICITUD_CAMBIO',
    prioridad: 'P2_ALTA',
    asunto: 'Reemplazo de Switch Administrable y Segmentación de VLANs 10, 20 y 30',
    descripcion: 'Sustitución de switch de borde no administrable por Switch Cisco Catalyst Gigabit 24p administrable con 802.1Q. Segmentación: VLAN 10 (Gestión/POS/Servidor Local 3307), VLAN 20 (Tablets Cabinas 1, 2 y 3) y VLAN 30 (Wi-Fi Clientes con Client Isolation para evitar accesos a BD).',
    modulo: 'Redes & Hardware',
    areaCambio: 'INFRAESTRUCTURA',
    tipoCambio: 'NORMAL',
    impactoRiesgo: 'ALTO',
    ventanaMantenimiento: 'Martes 02:00 AM - 04:00 AM (Ventana Nocturna No Invasiva)',
    planRollback: 'Reconexión inmediata de patch cords al switch anterior en rack físico en menos de 10 minutos si fallan pruebas de ping a Gateway o transacción POS de prueba.',
    solicitanteNombre: 'Bryan Mango (DBA / Infraestructura)',
    solicitanteEmail: 'bryan.mango@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-29 18:00:00',
    slaHoras: 48,
    slaFechaLimite: '2026-10-31 18:00:00',
    estado: 'APROBADO',
    asignadoA: 'Bryan Mango (Infraestructura)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)',
    cabAprobador: 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)',
    cabActa: 'ACTA-CAB-2026-W11-050',
    cabFechaAprobacion: '2026-10-29 19:30:00',
    resolucionTecnica: 'Pre-configuración en staging completada. VLANs 10, 20 y 30 etiquetadas. Listo para swap físico en ventana.',
    jiraKey: 'KAN-40',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-40',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo'
  },
  // ÁREA 2: APLICACIONES Y BD (Pasarela Niubiz & Replicación)
  {
    id: 'RFC-2026-0042',
    tipo: 'SOLICITUD_CAMBIO',
    prioridad: 'P2_ALTA',
    asunto: 'Despliegue de Pasarela de Pagos Niubiz y Replicación Asíncrona MySQL',
    descripcion: 'Incorporación del SDK de pasarela de pagos para reservas web y activación de réplicación transaccional con nodo MySQL Slave 3309 para descarga de lecturas de caja.',
    modulo: 'Aplicaciones & BD',
    areaCambio: 'APLICACIONES',
    tipoCambio: 'NORMAL',
    impactoRiesgo: 'MEDIO',
    ventanaMantenimiento: 'Jueves 02:30 AM - 03:30 AM',
    planRollback: 'Reversión de imagen de backend Docker a v1.0.4-stable y ejecución de migrate reversa en < 5 minutos.',
    solicitanteNombre: 'Anthony Luque (DevOps / Frontend)',
    solicitanteEmail: 'anthony.luque@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-29 14:00:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-30 14:00:00',
    estado: 'APROBADO',
    asignadoA: 'Anthony Luque (DevOps)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)',
    cabAprobador: 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)',
    cabActa: 'ACTA-CAB-2026-W11-042',
    cabFechaAprobacion: '2026-10-29 18:30:00',
    resolucionTecnica: 'Pipeline CI/CD en GitHub Actions verificado con Pytest 100% pass y scan de seguridad Trivy.',
    jiraKey: 'KAN-41',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-41',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo'
  },
  // ÁREA 3: DOCUMENTACIÓN (Topología de Red, C4 y Contingencia)
  {
    id: 'RFC-2026-0043',
    tipo: 'SOLICITUD_CAMBIO',
    prioridad: 'P3_MEDIA',
    asunto: 'Actualización de Topología de Red y Manual Operativo de Contingencia Offline',
    descripcion: 'Publicación del nuevo plano arquitectónico de red del Spa, mapa de puertos del rack, diagrama de clases C4 y protocolo de cobro manual ante pérdida de enlace con Azure VM.',
    modulo: 'Documentación & Calidad',
    areaCambio: 'DOCUMENTACION',
    tipoCambio: 'ESTANDAR',
    impactoRiesgo: 'BAJO',
    ventanaMantenimiento: 'Horario Laboral Diurno (Procedimiento Documental No Invasivo)',
    planRollback: 'Restauración de versión v1.2 de la documentación en la wiki interna de TI.',
    solicitanteNombre: 'Rafael Ramirez (Product Owner)',
    solicitanteEmail: 'rafaelramirez.utp@gmail.com',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-28 10:00:00',
    slaHoras: 24,
    slaFechaLimite: '2026-10-29 10:00:00',
    estado: 'RESUELTO',
    asignadoA: 'Rafael Ramirez (PO)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'Rafael Ramirez (Change Manager)',
    cabAprobador: 'Rafael Ramirez (Change Manager)',
    cabActa: 'ACTA-CAB-2026-W11-043',
    cabFechaAprobacion: '2026-10-28 12:00:00',
    resolucionTecnica: 'Manuales y diagramas aprobados y distribuidos a recepción y cabinas de masajes.',
    fechaResolucion: '2026-10-29 16:00:00',
    jiraKey: 'KAN-42',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-42',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo'
  },
  // ÁREA 4: CALENDARIO (Change Freeze Campaña San Valentín)
  {
    id: 'RFC-2026-0030',
    tipo: 'SOLICITUD_CAMBIO',
    prioridad: 'P2_ALTA',
    asunto: 'Definición de Ventana de Congelamiento (Change Freeze) Campaña San Valentín',
    descripcion: 'Establecimiento del periodo de Change Freeze con bloqueo estricto de despliegues a producción en código backend y base de datos desde el 10 al 16 de Febrero, protegiendo las reservas de tratamientos para parejas.',
    modulo: 'Operaciones & Calendario',
    areaCambio: 'CALENDARIO',
    tipoCambio: 'NORMAL',
    impactoRiesgo: 'MEDIO',
    ventanaMantenimiento: '10 de Febrero 00:00 hrs al 16 de Febrero 23:59 hrs',
    planRollback: "Desbloqueo de emergencia de pipeline CI/CD con flag 'OVERRIDE_FREEZE=true' previa autorización unánime del CAB.",
    solicitanteNombre: 'Administradora General SUMAQ',
    solicitanteEmail: 'administracion@sumaqspa.pe',
    solicitanteRol: 'ADMIN',
    fechaCreacion: '2026-10-28 09:00:00',
    slaHoras: 48,
    slaFechaLimite: '2026-10-30 09:00:00',
    estado: 'APROBADO',
    asignadoA: 'Rafael Ramirez (Change Manager)',
    aprobadoPorGerencia: true,
    aprobadorNombre: 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)',
    cabAprobador: 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)',
    cabActa: 'ACTA-CAB-2026-W11-030',
    cabFechaAprobacion: '2026-10-28 15:00:00',
    resolucionTecnica: 'Calendario de despliegues actualizado en GitHub Releases y notificado a todo el personal.',
    jiraKey: 'KAN-43',
    jiraUrl: 'https://sumaq-dev.atlassian.net/browse/KAN-43',
    githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo'
  }
];

function normalizeTicket(item: any): Ticket {
  return {
    id: String(item.codigo || item.id),
    tipo: item.tipo,
    prioridad: item.prioridad,
    modulo: item.modulo,
    asunto: item.asunto,
    descripcion: item.descripcion,
    solicitanteNombre: item.solicitanteNombre || item.solicitante_nombre || '',
    solicitanteEmail: item.solicitanteEmail || item.solicitante_email || '',
    solicitanteRol: item.solicitanteRol || item.solicitante_rol || 'ADMIN',
    slaHoras: Number(item.slaHoras || item.sla_horas || 24),
    slaFechaLimite: item.slaFechaLimite || item.sla_fecha_limite || '',
    fechaCreacion: item.fechaCreacion || item.created_at || '',
    estado: item.estado,
    asignadoA: item.asignadoA || item.asignado_a || '',
    aprobadoPorGerencia: Boolean(item.aprobadoPorGerencia ?? item.aprobado_por_gerencia ?? false),
    aprobadorNombre: item.aprobadorNombre || item.aprobador_nombre || '',
    fechaAprobacion: item.fechaAprobacion || item.fecha_aprobacion || '',
    resolucionTecnica: item.resolucionTecnica || item.resolucion_tecnica || '',
    fechaResolucion: item.fechaResolucion || item.fecha_resolucion || '',
    jiraKey: item.jiraKey || item.jira_key || '',
    jiraUrl: item.jiraUrl || item.jira_url || '',
    githubUrl: item.githubUrl || item.github_url || '',
    areaCambio: item.areaCambio || item.area_cambio,
    tipoCambio: item.tipoCambio || item.tipo_cambio || 'NORMAL',
    impactoRiesgo: item.impactoRiesgo || item.impacto_riesgo || 'MEDIO',
    ventanaMantenimiento: item.ventanaMantenimiento || item.ventana_mantenimiento || '',
    planRollback: item.planRollback || item.plan_rollback || '',
    cabAprobador: item.cabAprobador || item.cab_aprobado_por || '',
    cabActa: item.cabActa || item.cab_acta_numero || '',
    cabFechaAprobacion: item.cabFechaAprobacion || item.cab_fecha_aprobacion || ''
  };
}

export const TicketStore = {
  getTickets(): Ticket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveTickets(SEED_TICKETS, false);
        return SEED_TICKETS;
      }
      const rawParsed = JSON.parse(data) as any[];
      const parsed = rawParsed.map(normalizeTicket);
      // Si la caché local tiene menos tickets que la semilla completa (por ejemplo le faltan los RFCs), fusionar
      if (parsed.length < SEED_TICKETS.length) {
        const merged = [...parsed];
        for (const seed of SEED_TICKETS) {
          if (!merged.some(t => t.id === seed.id)) {
            merged.push(seed);
          }
        }
        this.saveTickets(merged, false);
        return merged;
      }
      return parsed;
    } catch {
      return SEED_TICKETS;
    }
  },

  async syncWithBackend(): Promise<Ticket[]> {
    try {
      const resp = await fetch('/api/ti/tickets/');
      if (resp.ok) {
        const data = await resp.json();
        const rawList: any[] = Array.isArray(data) ? data : (data.results || []);
        if (rawList.length > 0) {
          const list: Ticket[] = rawList.map(normalizeTicket);
          this.saveTickets(list, false);
          return list;
        }
      }
    } catch (e) {
      console.warn('[TicketStore] Backend offline, usando caché local:', e);
    }
    return this.getTickets();
  },

  saveTickets(tickets: Ticket[], notify: boolean = true): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      if (notify) {
        window.dispatchEvent(new Event('sumaq_tickets_updated'));
      }
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
    areaCambio?: AreaCambio;
    tipoCambio?: TipoCambio;
    impactoRiesgo?: ImpactoRiesgo;
    ventanaMantenimiento?: string;
    planRollback?: string;
  }): Promise<Ticket> {
    const isIncident = payload.tipo === 'INCIDENCIA';
    const isAccess = payload.tipo === 'SOLICITUD_ACCESO';
    const isChange = payload.tipo === 'SOLICITUD_CAMBIO';
    const prefix = isChange ? 'RFC' : (isIncident ? 'INC' : 'REQ');
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
      estado: (isAccess || isChange) ? 'PENDIENTE_APROBACION' : 'ABIERTO',
      asignadoA: 'Rafael Ramirez Quiroz (RQ)',
      aprobadoPorGerencia: (!isAccess && !isChange),
      resolucionTecnica: '',
      githubUrl: 'https://github.com/raforamqutp/SUMAQ-web/tree/feature/prueba-ti-v2-completo',
      areaCambio: payload.areaCambio,
      tipoCambio: payload.tipoCambio || 'NORMAL',
      impactoRiesgo: payload.impactoRiesgo || 'MEDIO',
      ventanaMantenimiento: payload.ventanaMantenimiento || '',
      planRollback: payload.planRollback || ''
    };

    const current = this.getTickets();
    this.saveTickets([optimisticTicket, ...current]);

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
          solicitante_rol: payload.solicitanteRol,
          area_cambio: payload.areaCambio,
          tipo_cambio: payload.tipoCambio,
          impacto_riesgo: payload.impactoRiesgo,
          ventana_mantenimiento: payload.ventanaMantenimiento,
          plan_rollback: payload.planRollback
        })
      });

      if (resp.ok) {
        const created: Ticket = await resp.json();
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

    this.updateLocalTicket(id, {
      estado: 'APROBADO',
      aprobadoPorGerencia: true,
      aprobadorNombre: aprobadorNombre || 'Rafael Ramirez (Gerente General)',
      fechaAprobacion: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    return true;
  },

  async approveCabTicket(id: string, cabAprobador?: string, cabActa?: string): Promise<boolean> {
    const aprobador = cabAprobador || 'MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)';
    const acta = cabActa || `ACTA-CAB-2026-W11-${id.split('-').pop() || '042'}`;
    const fechaAprob = new Date().toISOString().replace('T', ' ').substring(0, 19);

    try {
      const resp = await fetch(`/api/ti/tickets/${id}/cab-aprobar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cab_aprobador: aprobador, cab_acta: acta })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ticket) {
          this.updateLocalTicket(id, data.ticket);
          return true;
        }
      }
    } catch (e) {
      console.warn('[TicketStore] Fallo en API CAB aprobar, aplicando local:', e);
    }

    this.updateLocalTicket(id, {
      estado: 'APROBADO',
      aprobadoPorGerencia: true,
      aprobadorNombre: aprobador,
      cabAprobador: aprobador,
      cabActa: acta,
      cabFechaAprobacion: fechaAprob,
      fechaAprobacion: fechaAprob
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


  async getDashboardMetrics(): Promise<ITILDashboardMetrics | null> {
    try {
      const resp = await fetch('/api/ti/tickets/metricas/');
      if (resp.ok) {
        return (await resp.json()) as ITILDashboardMetrics;
      }
    } catch (e) {
      console.warn('[TicketStore] Fallo al obtener métricas:', e);
    }
    return null;
  },

  resetDefaults(): void {
    this.saveTickets(SEED_TICKETS, false);
  }
};
