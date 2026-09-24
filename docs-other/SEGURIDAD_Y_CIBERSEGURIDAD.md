# MANUAL Y ANÁLISIS DE SEGURIDAD, CIBERSEGURIDAD Y DEFENSAS TÉCNICAS — SUMAQ SPA

Este documento detalla la arquitectura de seguridad integral, los mecanismos de ciberseguridad y las estrategias de defensa contra ataques básicos y avanzados implementadas en la plataforma **SUMAQ Spa & Centro de Bienestar** (Backend Django REST Framework + Frontend React + Base de Datos MySQL/MariaDB InnoDB).

---

## 1. Matriz de Amenazas y Mecanismos de Defensa Mitigados

| Amenaza / Vector de Ataque | Mecanismo Implementado en SUMAQ | Nivel de Mitigación | Archivo / Componente Principal |
| :--- | :--- | :---: | :--- |
| **IDOR / BOLA** *(Insecure Direct Object Reference)* | Verificación a nivel de objeto (`has_object_permission`) en fichas clínicas y doble factor de consulta (`codigo_reserva` + `dni`) | Total | [backend/apps/common/permissions.py](file:///d:/Projects/SUMAQ/backend/apps/common/permissions.py)<br>[backend/apps/appointments/services.py](file:///d:/Projects/SUMAQ/backend/apps/appointments/services.py) |
| **Condiciones de Carrera** *(Race Conditions / Double Booking)* | Bloqueo pesimista de filas (`select_for_update()`) dentro de transacciones atómicas ACID | Total | [backend/apps/appointments/services.py](file:///d:/Projects/SUMAQ/backend/apps/appointments/services.py)<br>[backend/tests/test_concurrency.py](file:///d:/Projects/SUMAQ/backend/tests/test_concurrency.py) |
| **Inyección SQL (SQLi)** | ORM estricto de Django (Prepared Statements) y sentencias parametrizadas (`%s`) sin concatenación cruda | Total | [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py)<br>[admin_tools/monitor_db.py](file:///d:/Projects/SUMAQ/admin_tools/monitor_db.py) |
| **Robo / Fuga de Contraseñas** | Hashing criptográfico PBKDF2 con HMAC-SHA256, sal aleatoria por usuario y >600,000 iteraciones (Estándar NIST) | Total | [backend/apps/accounts/models.py](file:///d:/Projects/SUMAQ/backend/apps/accounts/models.py)<br>[backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py) |
| **Escalamiento de Privilegios (Broken Access Control)** | RBAC estricto en Backend (`IsAdminUserRole`, `IsTherapistUserRole`) y Route Guards en Frontend | Total | [backend/apps/common/permissions.py](file:///d:/Projects/SUMAQ/backend/apps/common/permissions.py)<br>[frontend/src/components/ProtectedRoute.tsx](file:///d:/Projects/SUMAQ/frontend/src/components/ProtectedRoute.tsx) |
| **Secuestro de Sesión / Ataques Replay** | Tokens JWT con expiración corta (120 min), rotación estricta de Refresh Tokens y revocación al fallar | Total | [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py)<br>[frontend/src/services/api.ts](file:///d:/Projects/SUMAQ/frontend/src/services/api.ts) |
| **Cross-Site Scripting (XSS)** | Escape nativo de React JSX, serialización tipada DRF y generación nativa vectorial de PDF sin renderizado HTML | Total | [backend/apps/common/pdf.py](file:///d:/Projects/SUMAQ/backend/apps/common/pdf.py)<br>[frontend/src/App.tsx](file:///d:/Projects/SUMAQ/frontend/src/App.tsx) |
| **Clickjacking (UI Redressing)** | Middleware `XFrameOptionsMiddleware` inyectando encabezados HTTP `X-Frame-Options: SAMEORIGIN` | Total | [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py) |
| **Cross-Origin Resource Sharing (CORS)** | `django-cors-headers` configurado con lista blanca estricta de dominios autorizados | Total | [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py) |
| **Host Header Injection** | Validación obligatoria de lista blanca en `ALLOWED_HOSTS` cargada vía variables de entorno | Total | [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py) |
| **Fuga de Información Técnica (Info Disclosure)** | Manejador de excepciones estandarizado (`custom_exception_handler`) que encapsula fallos en JSON | Total | [backend/apps/common/exceptions.py](file:///d:/Projects/SUMAQ/backend/apps/common/exceptions.py) |
| **Pérdida de Datos y Desastres** | Estrategia de Respaldo 3-2-1, volcados InnoDB no bloqueantes, retención 7 días y replicación Master-Slave | Total | [admin_tools/ADMINISTRACION_BD.md](file:///d:/Projects/SUMAQ/admin_tools/ADMINISTRACION_BD.md)<br>[admin_tools/backup_db.bat](file:///d:/Projects/SUMAQ/admin_tools/backup_db.bat) |

---

## 2. Autenticación y Gestión de Identidades (IAM)

### A. Almacenamiento Criptográfico de Contraseñas
- **Ubicación:** [backend/apps/accounts/models.py](file:///d:/Projects/SUMAQ/backend/apps/accounts/models.py) y [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py).
- **Cómo funciona:**
  - El modelo `User` extiende de `AbstractBaseUser` de Django.
  - Las contraseñas nunca se persisten en texto claro. Al invocar `user.set_password()`, se ejecuta el algoritmo **PBKDF2 (Password-Based Key Derivation Function 2)** con un pseudorandom generator **HMAC-SHA256**.
  - A cada contraseña se le añade una **sal (salt) criptográfica aleatoria única**, lo que anula cualquier intento de ataque mediante tablas arcoíris (*rainbow tables*).
  - Cuenta con un factor de trabajo (*work factor*) superior a **600,000 iteraciones**, siguiendo las directrices del NIST (SP 800-63B).
- **Validación de Complejidad:**
  - En `AUTH_PASSWORD_VALIDATORS` se impone longitud mínima de seguridad.
  - En [UserCreateUpdateSerializer](file:///d:/Projects/SUMAQ/backend/apps/accounts/serializers.py), el campo `password` se define con `min_length=6` y `write_only=True`, garantizando que la contraseña nunca sea serializada ni devuelta en las respuestas JSON de la API.

### B. Tokens de Sesión Stateless (JWT — JSON Web Tokens)
- **Ubicación:** [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py), [backend/apps/accounts/serializers.py](file:///d:/Projects/SUMAQ/backend/apps/accounts/serializers.py) y [frontend/src/services/api.ts](file:///d:/Projects/SUMAQ/frontend/src/services/api.ts).
- **Cómo funciona:**
  - Se implementa `rest_framework_simplejwt`.
  - **Access Token:** Vida útil configurable (`JWT_ACCESS_MINUTES = 120`). Se envía en cada cabecera HTTP: `Authorization: Bearer <token>`.
  - **Refresh Token:** Vida útil de 7 días (`JWT_REFRESH_DAYS = 7`).
  - **Rotación Obligatoria (`ROTATE_REFRESH_TOKENS = True`):** Cada vez que se renueva el access token, el refresh token anterior queda invalidado y se emite uno nuevo.
  - **Payload Criptográfico:** En `LoginSerializer`, el token inyecta el `rol`, `email` y `user_id` firmados con la `SECRET_KEY` del backend, permitiendo la verificación descentralizada sin sobrecargar la base de datos.
- **Frontend Interceptor (Auto-refresh silencioso):**
  - En `api.ts`, un interceptor de Axios detecta respuestas con código `401 Unauthorized`.
  - Si existe un refresh token, realiza una petición en segundo plano a `/api/auth/refresh/`, actualiza el token en memoria/storage y reintenta la solicitud fallida de manera totalmente transparente para el usuario.
  - Si el refresh token también expiró o fue revocado, limpia automáticamente el estado local y expulsa la sesión hacia la pantalla de login.

### C. Bloqueo Inmediato de Cuentas Inactivas
- **Ubicación:** [backend/apps/accounts/serializers.py](file:///d:/Projects/SUMAQ/backend/apps/accounts/serializers.py#L57-L61).
- **Cómo funciona:** Durante la validación de credenciales en `LoginSerializer`, el sistema verifica `user.activo`. Si un colaborador fue desactivado (`activo = False`), el servidor deniega la entrada con el código `USER_INACTIVE`, aun cuando la contraseña ingresada sea correcta.

---

## 3. Control de Acceso Basado en Roles (RBAC) y Mitigación de IDOR

### A. Política por Defecto: Secure by Default
En [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py#L145-L147), el framework REST está configurado como:
```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    ...
}
```
Esto impone que **ningún endpoint es público por omisión**. Para exponer una ruta pública (como el catálogo o reserva web), el desarrollador debe declarar intencionalmente `permission_classes = [AllowAny]`.

### B. Segregación de Roles en Backend
Definidos en [backend/apps/common/permissions.py](file:///d:/Projects/SUMAQ/backend/apps/common/permissions.py):
- **`IsAdminUserRole`**: Acceso exclusivo a usuarios con rol `ADMIN`. Protege el panel de control, reportes financieros, auditoría de usuarios, kárdex y parametrización de cabinas y servicios.
- **`IsTherapistUserRole`**: Acceso a terapeutas y administradores para operaciones de atención y agenda de cabina.

### C. Protección Anti-IDOR (Insecure Direct Object Reference / BOLA)
El ataque IDOR se produce cuando un usuario autenticado modifica un identificador numérico en una petición para acceder a recursos pertenecientes a otro usuario.
1. **Protección en el Módulo Asistencial:**
   - La clase `IsAssignedTherapistOrAdmin` implementa el método `has_object_permission`:
     ```python
     def has_object_permission(self, request, view, obj):
         if request.user.rol == 'ADMIN':
             return True
         if request.user.rol == 'TERAPEUTA':
             terapeuta_perfil = getattr(request.user, 'terapeuta', None)
             if not terapeuta_perfil:
                 return False
             if hasattr(obj, 'terapeuta_id'):
                 return obj.terapeuta_id == terapeuta_perfil.id
             if hasattr(obj, 'cita') and hasattr(obj.cita, 'terapeuta_id'):
                 return obj.cita.terapeuta_id == terapeuta_perfil.id
         return False
     ```
   - En [backend/apps/attention/views.py](file:///d:/Projects/SUMAQ/backend/apps/attention/views.py) (detalle de cita, agregar servicios, completar atención), se invoca explícitamente `self.check_object_permissions(request, cita)`.
   - Si una terapeuta intenta visualizar o alterar la cita o historia clínica asignada a otra profesional, el backend emite un **HTTP 403 Forbidden**.
2. **Protección en el Portal Público de Reservas:**
   - En [backend/apps/appointments/services.py](file:///d:/Projects/SUMAQ/backend/apps/appointments/services.py#L240-L283), los endpoints de consulta, cancelación y reprogramación online **no aceptan un simple ID numérico secuencial**.
   - Se exige un **doble factor de identificación**:
     1. El `codigo_reserva` alfanumérico generado con entropía criptográfica UUID (`SQ-YYYYMMDD-XXXXX`).
     2. El `dni` registrado del titular.
   - Si ambos parámetros no coinciden exactamente, el sistema responde `404 Not Found`, anulando ataques de enumeración o adivinación secuencial.

### D. Route Guards y Protección de Navegación en Frontend
- En [frontend/src/components/ProtectedRoute.tsx](file:///d:/Projects/SUMAQ/frontend/src/components/ProtectedRoute.tsx), ningún componente administrativo o asistencial se monta en memoria si el usuario no cuenta con una sesión válida y con su rol listado en `allowedRoles`.
- Enrutamiento segmentado con cargas diferidas (*lazy loading*) en [frontend/src/App.tsx](file:///d:/Projects/SUMAQ/frontend/src/App.tsx).

---

## 4. Control de Concurrencia, Transacciones Atómicas y Mitigación de Race Conditions

### A. Prevención de Sobrereserva (Anti-Double Booking)
- **Vulnerabilidad Evitada:** Condición de carrera (Race Condition / TOCTOU) donde dos usuarios intentan apartar la misma cabina o terapeuta en el mismo horario con milisegundos de diferencia.
- **Implementación:** En [backend/apps/appointments/services.py](file:///d:/Projects/SUMAQ/backend/apps/appointments/services.py#L115-L188):
  ```python
  with transaction.atomic():
      terapeuta = Terapeuta.objects.select_for_update().select_related('usuario').get(id=terapeuta_id, activo=True)
      cabina = Cabina.objects.select_for_update().get(id=cabina_id, activa=True)
      ...
  ```
- **Mecanismo:**
  1. `transaction.atomic()` inicia una transacción en MySQL/MariaDB bajo el motor InnoDB.
  2. `select_for_update()` adquiere un **bloqueo pesimista a nivel de fila (Row-Level Exclusive Lock)** sobre los registros de la terapeuta y la cabina.
  3. Cualquier solicitud paralela que compita por los mismos recursos queda retenida a nivel de base de datos hasta que la primera transacción haga `COMMIT` o `ROLLBACK`.
  4. Cuando la segunda solicitud adquiere el turno de lectura, detecta el nuevo registro de cita generado y se aborta de forma segura con `RESOURCE_CONFLICT` (HTTP 409).

### B. Integridad de Insumos y Prevención de Stock Negativo
- **Implementación:** En [backend/apps/attention/services.py](file:///d:/Projects/SUMAQ/backend/apps/attention/services.py#L53-L98):
  - Al completar una sesión, los insumos de la receta técnica (BOM) se bloquean con `Producto.objects.select_for_update()`.
  - Si `stock_actual < cant_total_insumo`, se lanza `InsufficientStockError`, provocando un rollback automático de la transacción e impidiendo inconsistencias financieras o inventarios negativos.

### C. Reglas de Negocio Defensivas
1. **Límite de 1 Cita por Cliente al Día:** En `ReservaService.crear_reserva_web`, se verifica si el DNI ya posee una cita activa para la fecha elegida, previniendo acaparamientos abusivos o reservas masivas por bots.
2. **Ventana de Modificación de 24 Horas:** En `consultar_cita_web`, se calcula la diferencia en horas contra la hora actual (`diff_seconds / 3600.0`). Las cancelaciones o reprogramaciones se bloquean si restan menos de 24 horas (`horas_restantes < 24.0`).

---

## 5. Defensas contra Ataques Web del OWASP Top 10

### A. Inyección SQL (SQL Injection - SQLi)
- El 100% de la lógica transaccional de negocio utiliza el ORM de Django, el cual abstrae las consultas en sentencias preparadas (*Prepared Statements*) parametrizadas a nivel del driver `PyMySQL`.
- En scripts de mantenimiento directo como [admin_tools/monitor_db.py](file:///d:/Projects/SUMAQ/admin_tools/monitor_db.py), se utiliza parametrización con marcadores `%s`:
  ```python
  cursor.execute("SELECT ... WHERE TABLE_SCHEMA = %s", (DB_NAME,))
  ```
  lo que garantiza que los valores nunca sean evaluados como código ejecutable por el motor SQL.

### B. Cross-Site Scripting (XSS) y Generación Segura de Documentos
- **Frontend:** React escapa por diseño cualquier contenido inyectado en plantillas JSX `{variable}`, mitigando inyecciones de scripts reflejadas o persistentes.
- **Generación Vectorial de PDFs:** En [backend/apps/common/pdf.py](file:///d:/Projects/SUMAQ/backend/apps/common/pdf.py), los comprobantes oficiales se renderizan en memoria utilizando **ReportLab** (`SimpleDocTemplate` y `Paragraph`). Al no emplear navegadores headless ni motores HTML-to-PDF externos (como wkhtmltopdf), se erradican los riesgos de **Server-Side Request Forgery (SSRF)**, inyección de scripts y lectura local de archivos (**Local File Inclusion - LFI**).

### C. Clickjacking y Cabeceras de Seguridad HTTP
En [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py#L49-L58):
- **`XFrameOptionsMiddleware`:** Inyecta automáticamente el encabezado HTTP `X-Frame-Options: SAMEORIGIN` (o `DENY`), impidiendo que el portal sea cargado dentro de marcos `<iframe>` externos para perpetrar ataques de secuestro de clic (*UI redressing*).
- **`SecurityMiddleware`:** Activa protecciones estándar para evitar que el navegador adivine tipos MIME fuera de los declarados (`X-Content-Type-Options: nosniff`).

### D. Host Header Injection
- La directiva `ALLOWED_HOSTS` en [backend/config/settings.py](file:///d:/Projects/SUMAQ/backend/config/settings.py#L18-L22) se obtiene de la variable de entorno `ALLOWED_HOSTS` con una lista blanca estricta (`localhost,127.0.0.1,0.0.0.0`). Cualquier petición con una cabecera `Host` falsificada es rechazada inmediatamente por Django con un error HTTP 400 Bad Request.

### E. Cross-Origin Resource Sharing (CORS)
- Integración de `django-cors-headers` (`corsheaders.middleware.CorsMiddleware`) posicionado como primer middleware de la cadena.
- `CORS_ALLOWED_ORIGINS` lee desde variables de entorno los orígenes de confianza autorizados para consultar la API (ej: `http://localhost:5173`).
- `CORS_ALLOW_HEADERS` restringe los encabezados aceptados a los estrictamente requeridos para la operación del cliente web.

### F. Control de Excepciones y Prevención de Fuga de Información Técnica
- En [backend/apps/common/exceptions.py](file:///d:/Projects/SUMAQ/backend/apps/common/exceptions.py), el manejador `custom_exception_handler` captura errores del framework y de lógica de negocio, devolviendo un cuerpo JSON estructurado (`{success: false, error: {...}}`).
- Esto evita que fallos de validación o excepciones de base de datos filtren trazas de código (*stack traces*), nombres de tablas, estructuras de esquemas o credenciales al cliente web.

---

## 6. Resiliencia de Datos, Recuperación ante Desastres (DR) y Mínimo Privilegio

### A. Política de Respaldos 3-2-1
Documentada formalmente en [admin_tools/ADMINISTRACION_BD.md](file:///d:/Projects/SUMAQ/admin_tools/ADMINISTRACION_BD.md):
- **3 Copias:** Datos en producción (nodo Master), Réplica en caliente (nodo Slave) y respaldos históricos en frío.
- **2 Medios distintos:** Almacenamiento local en disco NVMe y archivo comprimido en repositorio secundario.
- **1 Copia fuera de sitio (Offsite):** Volcado sincronizado en almacenamiento remoto o servidor de contingencia.
- **Consistencia Transaccional:** El script [admin_tools/backup_db.bat](file:///d:/Projects/SUMAQ/admin_tools/backup_db.bat) ejecuta `mysqldump` con los flags:
  ```bat
  mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --quick --routines --triggers --hex-blob %DB_NAME% > "%BACKUP_FILE%"
  ```
  `--single-transaction` garantiza un volcado consistente de tablas InnoDB sin necesidad de bloquear lecturas ni escrituras durante el horario comercial.
- **Retención Automática:** Incluye instrucción `forfiles` para purgar respaldos con antigüedad superior a 7 días.
- **Restauración Controlada:** Procedimiento automatizado en [admin_tools/restore_db.bat](file:///d:/Projects/SUMAQ/admin_tools/restore_db.bat).

### B. Principio de Mínimo Privilegio en Base de Datos
En [backend/replication/setup_replication.sql](file:///d:/Projects/SUMAQ/backend/replication/setup_replication.sql), se aplica la segregación de usuarios:
- El usuario `repl_user` solo tiene asignados los permisos estrictos `REPLICATION SLAVE, REPLICATION CLIENT`.
- Se definen perfiles de conexión diferenciados:
  - `sumaq_app`: Permisos DML estándar (`SELECT, INSERT, UPDATE, DELETE`).
  - `sumaq_admin`: Permisos DDL exclusivos para ejecución de migraciones.
  - `sumaq_backup`: Permisos de solo lectura para respaldos (`SELECT, LOCK TABLES, SHOW VIEW`).

### C. Telemetría y Monitoreo de Integridad
- **Health Check Endpoint:** `GET /api/health/` ([backend/apps/common/health.py](file:///d:/Projects/SUMAQ/backend/apps/common/health.py)) realiza una verificación viva con `SELECT 1;` midiendo la latencia de respuesta en milisegundos. Si el servicio se desconecta, responde HTTP 503, alertando de inmediato a proxies inversos o balanceadores.
- **Auditoría de Tablas:** En [admin_tools/monitor_db.py](file:///d:/Projects/SUMAQ/admin_tools/monitor_db.py), se ejecuta `CHECK TABLE` sobre tablas críticas (`citas`, `fichas_atencion`, `movimientos_caja`, `usuarios`) para validar la integridad física de las páginas de disco.

---

## 7. Suite de Pruebas Automatizadas de Seguridad (Security Test Suite)

La seguridad del sistema está respaldada y validada mediante pruebas unitarias y de integración automatizadas en [backend/tests/](file:///d:/Projects/SUMAQ/backend/tests/):

1. **[test_rbac_security.py](file:///d:/Projects/SUMAQ/backend/tests/test_rbac_security.py)**:
   - `test_therapist_cannot_access_admin_dashboard`: Comprueba que un terapeuta autenticado recibe 403 Forbidden al solicitar métricas o paneles administrativos.
   - `test_unauthenticated_cannot_access_therapist_agenda`: Valida que usuarios anónimos son rechazados con 401 Unauthorized.
   - `test_therapist_cannot_modify_other_therapist_appointment`: Certifica que la regla **Anti-IDOR** impide que una terapeuta modifique o cierre citas asignadas a otra terapeuta.
2. **[test_concurrency.py](file:///d:/Projects/SUMAQ/backend/tests/test_concurrency.py)**:
   - `test_concurrency_anti_double_booking`: Ejecuta hilos paralelos (`threading.Thread`) que intentan reservar simultáneamente la misma cabina y terapeuta. Comprueba que el bloqueo pesimista garantiza exactamente 1 éxito y 1 rechazo por conflicto.
3. **[test_auth.py](file:///d:/Projects/SUMAQ/backend/tests/test_auth.py)**:
   - Valida el flujo exitoso de login con emisión de tokens JWT.
   - Comprueba el rechazo ante contraseñas incorrectas.
   - Verifica el bloqueo inmediato de credenciales para usuarios marcados como inactivos.

---

## 8. Gestión de Secretos y Variables de Entorno

- Toda configuración sensible (`SECRET_KEY`, credenciales de base de datos, orígenes CORS permitidos) se administra mediante variables de entorno a través de `python-dotenv`.
- El archivo de producción `.env` está expresamente excluido del repositorio de código mediante el archivo [.gitignore](file:///d:/Projects/SUMAQ/.gitignore), evitando fugas de secretos en el control de versiones.
- Se mantiene un archivo de plantilla [.env.example](file:///d:/Projects/SUMAQ/backend/.env.example) con valores de muestra neutrales para la inicialización segura de entornos de desarrollo y staging.

---

## 9. Recomendaciones de Hardening para Producción

Para complementar las defensas ya existentes al realizar el despliegue final en servidores de producción:

1. **Directivas SSL/TLS y Cookies Seguras:**
   - Fijar en `settings.py` (con `DEBUG = False`):
     ```python
     SECURE_SSL_REDIRECT = True
     SESSION_COOKIE_SECURE = True
     CSRF_COOKIE_SECURE = True
     SECURE_HSTS_SECONDS = 31536000
     SECURE_HSTS_INCLUDE_SUBDOMAINS = True
     SECURE_HSTS_PRELOAD = True
     ```
2. **Limitador de Tasa de Peticiones (Rate Limiting / Throttling):**
   - Configurar en `REST_FRAMEWORK` de `settings.py`:
     ```python
     'DEFAULT_THROTTLE_CLASSES': [
         'rest_framework.throttling.AnonRateThrottle',
         'rest_framework.throttling.UserRateThrottle'
     ],
     'DEFAULT_THROTTLE_RATES': {
         'anon': '100/day',
         'user': '1000/day'
     }
     ```
   - Aplicar límites específicos a los endpoints de autenticación (`/api/auth/login/`) y reserva pública (`/api/citas/reservar-web/`) para mitigar ataques de fuerza bruta y denegación de servicio (DoS).
3. **Lista Negra de Tokens JWT (Token Blacklist):**
   - Habilitar `rest_framework_simplejwt.token_blacklist` en `INSTALLED_APPS` y activar `BLACKLIST_AFTER_ROTATION = True` para invalidar permanentemente en base de datos los refresh tokens rotados o revocados tras un cierre de sesión explícito.
