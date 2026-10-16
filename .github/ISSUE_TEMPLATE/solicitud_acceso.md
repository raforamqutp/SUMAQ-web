---
name: "Solicitud de Acceso (Usuarios y Permisos)"
about: "Para solicitar creación de cuentas, reseteo de claves o cambios de rol en SUMAQ Spa."
title: "[ACCESO] REQ-2026-XXXX: "
labels: ["solicitud-acceso", "service-desk"]
assignees: []
---

### 1. Datos Generales de la Solicitud
* **Fecha:** DD/MM/AAAA
* **Solicitante:** <!-- Nombre completo del colaborador que solicita -->
* **Cargo / Área:** <!-- Recepción / Terapeutas / Administración -->
* **Nivel de Prioridad (SLA):**
  - [ ] **P1 - Crítica:** Bloqueo operativo total de acceso para personal en turno. (SLA: 2h)
  - [ ] **P2 - Alta:** Reseteo de contraseña o desbloqueo por intentos fallidos. (SLA: 4h)
  - [ ] **P3 - Media:** Alta de nuevo colaborador o cambio de turno programado. (SLA: 12h)

---

### 2. Detalle del Usuario a Configurar
* **Nombre del Colaborador:** <!-- Ej. Lic. Camila Vega -->
* **Correo Institucional Sugerido:** `usuario@sumaqspa.pe`
* **Tipo de Trámite:**
  - [ ] Alta de cuenta nueva
  - [ ] Modificación de rol / permisos
  - [ ] Desbloqueo de cuenta (superó 5 intentos fallidos)
  - [ ] Baja temporal / definitiva de acceso
* **Rol Solicitado en Sistema (Django RBAC):**
  - [ ] `TERAPEUTA`
  - [ ] `RECEPCIONISTA`
  - [ ] `ADMIN` <!-- Requiere justificación especial -->
* **Cabina de Trabajo Asignada (solo terapeutas):**
  - [ ] Cabina 1 (Holística)
  - [ ] Cabina 2 (Dermoestética)
  - [ ] Cabina 3 (Hidroterapia)
* **Motivo / Justificación:**
  <!-- Breve explicación: ej. Incorporación por incremento de demanda de tratamientos faciales. -->

---

### 3. Autorización y Seguridad (Principio de Mínimo Privilegio)
* **Aprobador Responsable:** <!-- Nombre de Gerencia / Administración General -->
* **Estado de Aprobación:**
  - [ ] Aprobado
  - [ ] Rechazado
* **Fecha y Hora de Aprobación:** <!-- DD/MM/AAAA HH:MM -->

---

### 4. Checklist Técnico (Uso exclusivo de Soporte N2)
- [ ] Usuario registrado en base de datos (tabla usuarios) con contraseña cifrada (PBKDF2).
- [ ] Rol asignado y validado contra acceso no autorizado a módulos gerenciales.
- [ ] Cabina vinculada correctamente en tabla terapeutas.
- [ ] Envío de credenciales temporales vía canal seguro con forzado de cambio de clave.
- [ ] Prueba de login exitosa en entorno de pruebas / producción.
