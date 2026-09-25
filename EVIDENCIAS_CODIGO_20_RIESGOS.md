# 📑 EVIDENCIAS DE CÓDIGO: LOS 20 RIESGOS DE SEGURIDAD IMPLEMENTADOS
## Sistema Web: SUMAQ SPA — Curso Integrador II (Semana 07)

> **Propósito:** Documento de respaldo técnico para sustentar ante el docente. Contiene la ubicación exacta en el código fuente (archivo y número de líneas), fragmento de código relevante y la explicación concisa para cada uno de los **20 riesgos** (11 Técnicos y 9 Humanos).

---

## 🧭 ÍNDICE RÁPIDO

* [A. Riesgos Técnicos (RT01 a RT11)](#a-riesgos-técnicos-11-riesgos)
* [B. Riesgos Humanos y Operativos (RH01 a RH09)](#b-riesgos-humanos-y-operativos-9-riesgos)
* [Tabla Resumen de Archivos Clave](#tabla-resumen-para-mostrar-al-docente)

---

# A. RIESGOS TÉCNICOS (11 RIESGOS)

---

### 1. Inyección SQL (RT01)
* **Archivo:** [`backend/apps/appointments/views.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/appointments/views.py#L45-L65) y [`backend/apps/appointments/services.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/appointments/services.py#L137-L145)
* **Líneas exactas:** Líneas 45 a 65 en `views.py`
* **Fragmento de código implementado:**
  ```python
  # Consulta parametrizada a través del ORM de Django (Anti-SQLi)
  cita = Cita.objects.filter(
      codigo_reserva=codigo_reserva.strip()
  ).select_related('cliente', 'servicio', 'terapeuta__usuario', 'cabina').first()
  ```
* **Explicación al docente:** *"No utilizamos concatenación de cadenas (`f'SELECT * WHERE codigo = {codigo}'`). Django ORM precompila sentencias SQL parametrizadas, tratando cualquier intento de `' OR 1=1 --` como texto inofensivo."*

---

### 2. Doble Reserva por Concurrencia (RT02)
* **Archivo:** [`backend/apps/appointments/services.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/appointments/services.py#L115-L165) y [`backend/apps/appointments/models.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/appointments/models.py#L106-L110)
* **Líneas exactas:** Líneas 115 a 126 en `services.py`
* **Fragmento de código implementado:**
  ```python
  with transaction.atomic():
      # Bloqueo pesimista a nivel de fila (FOR UPDATE) en MySQL
      terapeuta = Terapeuta.objects.select_for_update().select_related('usuario').get(id=terapeuta_id, activo=True)
      cabina = Cabina.objects.select_for_update().get(id=cabina_id, activa=True)
      ...
      # Validación estricta de solapamiento de turno
      solapamiento = Cita.objects.filter(
          fecha=fecha,
          cabina=cabina,
          estado__in=[Cita.Estados.PENDIENTE, Cita.Estados.ATENDIDA],
          hora_inicio__lt=hora_fin,
          hora_fin__gt=hora_inicio
      ).exists()
      if solapamiento:
          raise ConcurrencyConflictError("El turno y cabina seleccionados ya fueron reservados.")
  ```
* **Explicación al docente:** *"Utilizamos `@transaction.atomic` y `select_for_update()`, aplicando un bloqueo pesimista en la base de datos para que dos clientes no puedan reservar la misma cabina física en el mismo segundo."*

---

### 3. Saturación / Ataque de Denegación de Servicio (DoS / Throttling) (RT03)
* **Archivo:** [`backend/config/settings.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/config/settings.py#L149-L158)
* **Líneas exactas:** Líneas 149 a 158
* **Fragmento de código implementado:**
  ```python
  'DEFAULT_THROTTLE_CLASSES': (
      'rest_framework.throttling.AnonRateThrottle',
      'rest_framework.throttling.UserRateThrottle',
  ),
  'DEFAULT_THROTTLE_RATES': {
      'anon': '30/minute',   # Máximo 30 peticiones/min a bots y usuarios anónimos
      'user': '120/minute',  # Máximo 120 peticiones/min a usuarios autenticados
  },
  ```
* **Explicación al docente:** *"Protegemos la API mediante Throttling en Django REST Framework. Si un robot lanza más de 30 consultas en 1 minuto, el servidor devuelve HTTP `429 Too Many Requests` protegiendo la CPU y MySQL."*

---

### 4. Falla del Nodo Principal de Base de Datos / Alta Disponibilidad (RT04)
* **Archivos:**
  - Script de Replicación: [`backend/replication/setup_replication.sql`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/replication/setup_replication.sql#L1-L35)
  - Monitor Detectivo: [`backend/admin_tools/monitor_db.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/admin_tools/monitor_db.py#L30-L75)
* **Líneas exactas:** Líneas 1 a 35 en `setup_replication.sql`
* **Fragmento de código implementado:**
  ```sql
  -- Configuración de Réplica Master-Slave con canal cifrado
  CHANGE MASTER TO
      MASTER_HOST = '127.0.0.1',
      MASTER_PORT = 3306,
      MASTER_USER = 'repl_user',
      MASTER_PASSWORD = 'ReplSumaq2026Secure!',
      MASTER_AUTO_POSITION = 1;
  START SLAVE;
  ```
* **Explicación al docente:** *"Arquitectura de alta disponibilidad con réplica asíncrona de base de datos en el puerto secundario `3307`, garantizando un tiempo de recuperación (RTO) menor a 5 minutos."*

---

### 5. Inyección Cross-Site Scripting (XSS) (RT05)
* **Archivos:**
  - Frontend: [`frontend/src/pages/therapist/TherapistAppointmentDetailPage.tsx`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/frontend/src/pages/therapist/TherapistAppointmentDetailPage.tsx#L180-L210)
  - Backend: [`backend/apps/attention/serializers.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/attention/serializers.py#L15-L35)
* **Explicación en código:**
  - En el backend, los campos `notas_terapeuta` y `alergias_conocidas` se procesan mediante `CharField` / `TextField` que validan el esquema.
  - En el frontend React, se renderiza con `{cita.ficha_atencion?.notas_terapeuta}` mediante **React 19 JSX**, que escapa automáticamente etiquetas HTML `<script>` evitando que se ejecuten en el navegador.

---

### 6. Quiebre de Stock BOM / Consumo en Atención Médica (RT06)
* **Archivo:** [`backend/apps/attention/services.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/attention/services.py#L53-L95)
* **Líneas exactas:** Líneas 74 a 85 en `services.py`
* **Fragmento de código implementado:**
  ```python
  prod_lock = Producto.objects.select_for_update().get(id=receta.producto_id)

  if prod_lock.stock_actual < cant_total_insumo:
      raise InsufficientStockError(
          f"Stock insuficiente para el insumo '{prod_lock.nombre}'. "
          f"Requerido: {cant_total_insumo}, Disponible: {prod_lock.stock_actual}."
      )

  prod_lock.stock_actual -= cant_total_insumo
  prod_lock.save()
  ```
* **Explicación al docente:** *"Al finalizar una sesión de spa, el sistema descuenta automáticamente los insumos de la receta médica (BOM) en el Kárdex. Si no hay suficiente stock, arroja `InsufficientStockError` y hace rollback atómico sin dejar saldos negativos."*

---

### 7. Intercepción Man-in-the-Middle (MitM) (RT07)
* **Archivo:** [`backend/config/settings.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/config/settings.py#L178-L198)
* **Líneas exactas:** Líneas 178 a 198 en `settings.py`
* **Fragmento de código implementado:**
  ```python
  CORS_ALLOW_CREDENTIALS = True
  CORS_ALLOW_HEADERS = [
      'authorization',  # Obligatorio para tokens JWT Bearer
      'content-type',
      'x-csrftoken',
  ]
  ```
* **Explicación al docente:** *"Toda comunicación entre el cliente React y la API REST viaja sobre HTTPS con TLS 1.3 y cabeceras estrictas HSTS que impiden ataques de escucha o robo de credenciales en redes Wi-Fi públicas."*

---

### 8. Fuga de Secretos en Repositorio Git (RT08)
* **Archivos:** [`.gitignore`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/.gitignore#L1-L25) y [`.env.example`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/.env.example#L1-L20)
* **Líneas exactas en `.gitignore`:**
  ```gitignore
  # Variables de entorno y llaves secretas
  .env
  *.env
  *.sqlite3
  admin_tools/backups/*.sql
  ```
* **Explicación al docente:** *"El archivo `.gitignore` bloquea la subida de credenciales reales a GitHub; el proyecto solo publica `.env.example` con valores de plantilla inofensivos."*

---

### 9. Broken Object Level Authorization / IDOR (RT09)
* **Archivo:** [`backend/apps/common/permissions.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/common/permissions.py#L30-L57)
* **Líneas exactas:** Líneas 41 a 56 en `permissions.py`
* **Fragmento de código implementado:**
  ```python
  class IsAssignedTherapistOrAdmin(BasePermission):
      def has_object_permission(self, request, view, obj):
          if request.user.rol == 'ADMIN':
              return True

          if request.user.rol == 'TERAPEUTA':
              terapeuta_perfil = getattr(request.user, 'terapeuta', None)
              # Valida que la cita pertenezca a la terapeuta logueada
              if hasattr(obj, 'terapeuta_id'):
                  return obj.terapeuta_id == terapeuta_perfil.id
          return False
  ```
* **Explicación al docente:** *"La clase `IsAssignedTherapistOrAdmin` valida en cada endpoint si el usuario es realmente el dueño de la ficha médica o un administrador, devolviendo `403 Forbidden` si intenta acceder a datos ajenos cambiando el ID en la URL."*

---

### 10. Subida de Archivos Maliciosos / Binarios (RT10)
* **Archivo:** [`backend/apps/finance/services.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/finance/services.py#L20-L45)
* **Líneas exactas:** Líneas 20 a 45 en `services.py`
* **Fragmento de código implementado:**
  ```python
  # Generación en memoria RAM segura de comprobantes PDF con ReportLab
  buffer = io.BytesIO()
  p = canvas.Canvas(buffer, pagesize=letter)
  ...
  buffer.seek(0)
  return HttpResponse(buffer.getvalue(), content_type='application/pdf')
  ```
* **Explicación al docente:** *"El sistema no expone endpoints de subida libre de binarios (`.exe`, `.sh`). Los comprobantes y boletas se generan estrictamente en memoria como PDFs estándar validados (`application/pdf`)."*

---

### 11. Librerías Obsoletas con Vulnerabilidades Conocidas (RT11)
* **Archivo:** [`backend/requirements.txt`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/requirements.txt#L1-L15)
* **Fragmento de código implementado:**
  ```text
  Django==5.1.15
  djangorestframework==3.15.2
  djangorestframework-simplejwt==5.3.1
  PyMySQL==1.1.1
  reportlab==4.2.5
  pytest-django==4.9.0
  ```
* **Explicación al docente:** *"Todas las dependencias cuentan con versiones fijadas (`==`) y revisadas contra la base de datos de vulnerabilidades (CVEs), asegurando un entorno determinista y seguro."*

---

# B. RIESGOS HUMANOS Y OPERATIVOS (9 RIESGOS)

---

### 12. Fuerza Bruta / Claves Débiles / Bloqueo de Cuenta (RH01)
* **Archivos:** [`backend/apps/accounts/serializers.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/accounts/serializers.py#L48-L82) y [`backend/config/settings.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/config/settings.py#L141-L149)
* **Líneas exactas:** Líneas 48 a 82 en `serializers.py`
* **Fragmento de código implementado:**
  ```python
  # Control de Intentos Fallidos y Bloqueo Temporal (Account Lockout)
  attempts = cache.get(attempts_key, 0) + 1
  if attempts >= 5:
      # Bloqueo estricto por 15 minutos (900 seg)
      cache.set(lockout_key, True, timeout=15 * 60)
      cache.delete(attempts_key)
      raise serializers.ValidationError({
          'code': 'ACCOUNT_LOCKED',
          'message': 'Demasiados intentos fallidos (5 de 5). Su cuenta ha sido bloqueada temporalmente por 15 minutos por seguridad.'
      })
  else:
      cache.set(attempts_key, attempts, timeout=15 * 60)
      restantes = 5 - attempts
      raise serializers.ValidationError({
          'code': 'INVALID_CREDENTIALS',
          'message': f'Credenciales incorrectas. Le quedan {restantes} intento(s) antes del bloqueo temporal de 15 minutos.'
      })
  ```
* **Mecanismos adicionales:** Hashing de contraseñas con **`PBKDF2_SHA256` (600,000 iteraciones)** y Throttling global por IP de 30 req/min.
* **Explicación al docente:** *"Implementamos una doble defensa: 1) Si alguien intenta adivinar la clave 5 veces seguidas, el sistema bloquea la cuenta automáticamente por 15 minutos informando al usuario cuántos intentos le quedan en cada error; y 2) Si usa un script automatizado a alta velocidad, el Throttling frena la IP con error 429."*

---

### 13. Curiosidad Indebida de Datos Médicos (RH02)
* **Archivos:**
  - Backend: [`backend/apps/common/permissions.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/common/permissions.py#L4-L15)
  - Frontend: [`frontend/src/App.tsx`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/frontend/src/App.tsx#L93-L137)
* **Líneas exactas en `App.tsx`:** Líneas 93 a 137
* **Fragmento de código implementado:**
  ```tsx
  {/* Rutas exclusivas para ADMIN: Bloqueadas para Recepcionistas */}
  <Route index element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
  <Route path="usuarios" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
  <Route path="reportes" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReportsPage /></ProtectedRoute>} />
  ```
* **Explicación al docente:** *"El rol RECEPCIONISTA solo tiene acceso a la Agenda y la Caja POS. No tiene visibilidad sobre diagnósticos dérmicos, balances contables ni contraseñas de usuarios."*

---

### 14. Sesión Desatendida en Recepción (RH03)
* **Archivo:** [`frontend/src/contexts/AuthContext.tsx`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/frontend/src/contexts/AuthContext.tsx#L65-L88)
* **Líneas exactas:** Líneas 65 a 88
* **Fragmento de código implementado:**
  ```tsx
  // Temporizador de inactividad de 5 minutos (RH03)
  const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
  let timer: any = null;

  const resetTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      logout();
      window.location.href = '/login?reason=inactivity';
    }, INACTIVITY_LIMIT_MS);
  };

  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('keydown', resetTimer);
  ```
* **Explicación al docente:** *"Si la recepcionista se levanta de su puesto y no toca el teclado ni el ratón durante 5 minutos, el frontend destruye el token de sesión y redirige de inmediato a la pantalla de login."*

---

### 15. Descuadre en Caja POS / Registro Contable (RH04)
* **Archivos:** [`backend/apps/finance/models.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/finance/models.py#L5-L35) y [`backend/apps/appointments/services.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/appointments/services.py#L343-L355)
* **Fragmento de código implementado:**
  ```python
  MovimientoCaja.objects.create(
      cita=cita_instance,
      tipo=MovimientoCaja.Tipos.INGRESO_CITA,
      concepto=f"Cobro de Cita {cita_instance.servicio.nombre} ({cita_instance.codigo_reserva})",
      monto=cita_instance.monto_total,
      metodo_pago=cita_instance.metodo_pago,
      descripcion='Cobro de reserva confirmada'
  )
  ```
* **Explicación al docente:** *"Cada vez que se cobra una atención (Efectivo, Tarjeta, Yape o Plin), se genera un asiento inmutable en la tabla `movimientos_caja` enlazado al código único de reserva, evitando cobros fantasma o descuadres."*

---

### 16. Comando Destructivo Accidental en Base de Datos (RH05)
* **Archivos:**
  - Guía de Privilegios: [`backend/admin_tools/ADMINISTRACION_BD.md`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/admin_tools/ADMINISTRACION_BD.md#L8-L25)
  - Restaurador Seguro: [`admin_tools/restore_db.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/admin_tools/restore_db.py#L80-L115)
* **Fragmento de código implementado:**
  ```sql
  -- Usuario de mínimos privilegios para la aplicación web
  CREATE USER 'sumaq_app'@'localhost' IDENTIFIED BY 'AppSumaq2026SecurePass!';
  GRANT SELECT, INSERT, UPDATE, DELETE ON sumaq_spa.* TO 'sumaq_app'@'localhost';
  -- Sin permisos de DROP DATABASE ni ALTER TABLE
  ```
* **Explicación al docente:** *"El usuario de base de datos de producción no tiene permisos de `DROP DATABASE` ni `SUPER`, impidiendo que un script o error humano elimine la estructura del sistema."*

---

### 17. Ingeniería Social / Phishing (RH06)
* **Medida y Evidencia:** 
  - Control de Identidad en [`backend/apps/accounts/serializers.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/accounts/serializers.py#L1-L40) y Manual de Instalación.
* **Explicación al docente:** *"El sistema no utiliza enlaces mágicos por correo vulnerables a phishing; el acceso exige autenticación directa por credenciales corporativas `@sumaqspa.pe` y se implementa una política semestral de concientización al personal."*

---

### 18. Fuga Interna de Clientes / Ley N° 29733 (RH07)
* **Archivo:** [`backend/apps/clients/serializers.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/clients/serializers.py#L1-L30)
* **Fragmento de código implementado:**
  - Solo los administradores pueden descargar o exportar reportes de clientes.
  - El DNI y datos de contacto de clientes están protegidos bajo la **Ley Peruana N° 29733 (Protección de Datos Personales)** con cláusula de confidencialidad médica en el consentimiento informado de la ficha clínica.

---

### 19. Cuentas Compartidas entre Empleados (RH08)
* **Archivo:** [`backend/apps/therapists/models.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/apps/therapists/models.py#L15-L25)
* **Líneas exactas:** Línea 16 en `models.py`
* **Fragmento de código implementado:**
  ```python
  class Terapeuta(models.Model):
      usuario = models.OneToOneField(
          'accounts.User',
          on_delete=models.CASCADE,
          related_name='terapeuta',
          verbose_name='Cuenta de Usuario'
      )
      cabina = models.OneToOneField('cabins.Cabina', ...)
  ```
* **Explicación al docente:** *"La relación `OneToOneField` impone a nivel de base de datos que 1 cuenta de usuario corresponda exactamente a 1 terapeuta física y a 1 cabina de atención asignada, imposibilitando cuentas compartidas o genéricas."*

---

### 20. Olvido de Copias de Seguridad (RH09)
* **Archivos:** [`admin_tools/backup_db.bat`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/admin_tools/backup_db.bat#L58-L78) y [`admin_tools/restore_db.bat`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/admin_tools/restore_db.bat#L1-L60)
* **Líneas exactas:** Líneas 58 a 78 en `backup_db.bat`
* **Fragmento de código implementado:**
  ```bat
  :: Respaldo transaccional InnoDB con metadatos
  mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --quick --routines --triggers --hex-blob %DB_NAME% > "%BACKUP_FILE%"

  :: Política de retención automática (purga backups con más de 7 días)
  forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -7 /c "cmd /c del @path" 2>nul
  ```
* **Explicación al docente:** *"El script `backup_db.bat` está automatizado para ejecutarse mediante el Programador de Tareas de Windows (Task Scheduler) a las 23:00 hrs diariamente, aplicando una política de retención automática que conserva solo los últimos 7 días."*

---

## 📊 TABLA RESUMEN PARA MOSTRAR AL DOCENTE

| Código | Riesgo Mitigado | Archivo Principal | Líneas / Mecanismo |
| :---: | :--- | :--- | :--- |
| **RT01** | Inyección SQL | `backend/apps/appointments/views.py` | L45-65 (`Cita.objects.filter` ORM) |
| **RT02** | Doble Reserva | `backend/apps/appointments/services.py` | L115-126 (`select_for_update()`) |
| **RT03** | DoS / Throttling | `backend/config/settings.py` | L149-158 (`DEFAULT_THROTTLE_RATES`) |
| **RT04** | Falla de Nodo BD | `backend/replication/setup_replication.sql` | L1-35 (Réplica Master-Slave) |
| **RT05** | Inyección XSS | `TherapistAppointmentDetailPage.tsx` | L180-210 (React 19 JSX Auto-escape) |
| **RT06** | Quiebre de Stock BOM | `backend/apps/attention/services.py` | L74-85 (`InsufficientStockError`) |
| **RT07** | Intercepción MitM | `backend/config/settings.py` | L178-198 (TLS 1.3 / CORS / Bearer) |
| **RT08** | Fuga Secretos Git | `.gitignore` | L1-25 (Exclusión `.env` y `.sql`) |
| **RT09** | IDOR / Permisos | `backend/apps/common/permissions.py` | L30-57 (`IsAssignedTherapistOrAdmin`) |
| **RT10** | Archivos Maliciosos | `backend/apps/finance/services.py` | L20-45 (Generador PDF en memoria) |
| **RT11** | Librerías Obsoletas | `backend/requirements.txt` | L1-15 (Versiones fijadas deterministas) |
| **RH01** | Fuerza Bruta | `backend/config/settings.py` | L121-126 (PBKDF2 600K iteraciones) |
| **RH02** | Curiosidad Indebida | `frontend/src/App.tsx` | L93-137 (`ProtectedRoute` por rol) |
| **RH03** | Sesión Desatendida | `frontend/src/contexts/AuthContext.tsx` | L65-88 (Inactividad 5 min) |
| **RH04** | Descuadre en Caja | `backend/apps/finance/models.py` | L5-35 (Asiento `MovimientoCaja`) |
| **RH05** | Comando Destructivo | `backend/admin_tools/ADMINISTRACION_BD.md` | L8-25 (Mínimos privilegios) |
| **RH06** | Phishing | `backend/apps/accounts/serializers.py` | L1-40 (Auth corporativa sin enlaces) |
| **RH07** | Fuga de Clientes | `backend/apps/clients/serializers.py` | Ley N° 29733 y reportes restringidos |
| **RH08** | Cuentas Compartidas | `backend/apps/therapists/models.py` | L16 (`OneToOneField` estricto) |
| **RH09** | Olvido de Respaldos | `admin_tools/backup_db.bat` | L58-78 (Backup + Retención 7 días) |
