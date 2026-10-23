---
name: "Solicitud de Control de Cambios (RFC)"
about: "Para registrar, evaluar y aprobar cambios en Infraestructura, Aplicaciones, Documentación o Calendario (ITIL v4 / CAB)."
title: "[CAMBIO] RFC-2026-XXXX: "
labels: ["control-de-cambios", "cab-review"]
assignees: []
---

### 1. Datos Generales de la Solicitud de Cambio (RFC)
* **Código RFC:** RFC-2026-XXXX
* **Fecha de Solicitud:** DD/MM/AAAA
* **Solicitante / Líder:** <!-- Nombre del solicitante y rol -->
* **Área Afectada:**
  - [ ] Infraestructura (Servidores Azure, Redes, Nginx, MySQL Master/Slave)
  - [ ] Aplicaciones y BD (Código Django, React 19, Migraciones ORM)
  - [ ] Documentación Técnica (Manuales, Swagger OpenAPI, Diagramas, Runbooks)
  - [ ] Calendario y Despliegues (Ventanas de mantenimiento, Code Freeze)

---

### 2. Clasificación del Cambio
* **Tipo de Cambio:**
  - [ ] **Normal:** Requiere evaluación técnica previa, aprobación formal del CAB y despliegue en ventana nocturna (02:00 - 04:00 AM).
  - [ ] **Emergencia:** Corrección crítica inmediata para mitigar caída de servicio o vulnerabilidad (ECAB expedito).
  - [ ] **Estándar:** Cambio preaprobado, repetitivo y de bajo riesgo documentado (ej. backups, parches menores).
* **Nivel de Impacto y Riesgo:**
  - [ ] **Alto:** Afecta disponibilidad general o transacciones de reservas/pagos.
  - [ ] **Medio:** Afecta módulos administrativos secundarios o reportes internos.
  - [ ] **Bajo:** Modificaciones cosméticas o ajustes documentales.

---

### 3. Justificación y Descripción Técnica
* **Descripción del Cambio:** <!-- Detalle técnico claro de la modificación -->
* **Justificación / Beneficio para el Negocio:** <!-- Por qué es necesario el cambio -->
* **Componentes Afectados:**
  - Repositorio GitHub: `raforamqutp/SUMAQ-web`
  - Rama Git asociada: `feature/...` o `hotfix/...`
  - Base de Datos / Migración: <!-- Tablas modificadas o scripts -->
  - Servidor / Contenedor: Azure VM `68.155.146.110` (Docker compose)

---

### 4. Plan de Pruebas y Validación (CI/CD)
* **Pruebas en Ambiente DEV / QA:**
  - [ ] Pruebas unitarias Pytest aprobadas (20/20 tests en verde).
  - [ ] Build de frontend React 19 compilado sin errores de TypeScript.
  - [ ] Pipeline de GitHub Actions ejecutado con éxito.
* **Criterios de Aceptación:** <!-- Condiciones para declarar exitoso el despliegue -->

---

### 5. Plan de Rollback (Contingencia < 3 min)
* **Estrategia de Retroceso:**
  - Docker: `docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d <tag_anterior>`
  - Base de Datos: Restauración desde snapshot transaccional previo `/opt/sumaq/backups/pre_deploy_backup.sql`
* **Tiempo estimado de recuperación (RTO):** Menor a 3 minutos.
* **Responsable del Rollback:** DevOps Lead / DBA.

---

### 6. Aprobación del Comité de Control de Cambios (CAB)
* [ ] **Aprobado por CAB Lead / Responsable TIC**
* [ ] **Rechazado / Observado con requerimiento de ajustes**
* **Fecha de Aprobación:** DD/MM/AAAA HH:MM
* **Firma / Aprobador:** <!-- Nombre y cargo del evaluador CAB -->
