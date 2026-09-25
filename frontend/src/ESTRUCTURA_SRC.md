# Guía de Arquitectura y Estructura del Código: Directorio `src`
**Proyecto:** SUMAQ - Centro de Spa & Bienestar  
**Tecnologías:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router DOM v7, Axios, Lucide React

---

## 1. Visión General de la Arquitectura

La carpeta `src` (`frontend/src`) contiene el núcleo de la aplicación Frontend de **SUMAQ**. Está diseñada siguiendo una arquitectura modular orientada a roles y separación de responsabilidades:
- **Flujo Público:** Experiencia del cliente final (navegación de servicios, cabinas, promociones y wizard de reserva en 4 pasos con cupón).
- **Flujo Terapeuta:** Gestión operativa del profesional (agenda personal, registro de ficha clínica del cliente, adición de consumos extras y cierre de sesión con descarga de comprobante).
- **Flujo Administrativo & Recepción:** Panel de control integral (KPIs y dashboard financiero, agenda global simultánea para 3 cabinas, gestión de citas, caja/POS con cálculo de IGV, inventario con Kardex y recetas técnicas BOM, promociones y usuarios).
- **Mecanismo Híbrido API/Mock:** Los servicios enlazan con el backend Django REST (`http://127.0.0.1:8000/api`), pero cuentan con un motor in-memory (`mockStore`) que garantiza funcionalidad completa autónoma (standalone fallback).

---

## 2. Árbol de Directorios

```text
frontend/src/
├── assets/                          # Recursos gráficos estáticos locales
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── components/                      # Componentes UI reutilizables
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Footer.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   └── StatCard.tsx
├── contexts/                        # Proveedores de estado global (React Context)
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── layouts/                         # Estructuras envolventes maestras por rol
│   ├── AdminLayout.tsx
│   ├── PublicLayout.tsx
│   └── TherapistLayout.tsx
├── pages/                           # Vistas y pantallas del sistema agrupadas por dominio
│   ├── admin/                       # Módulos de administración, finanzas y operaciones
│   │   ├── AdminAppointmentsPage.tsx
│   │   ├── AdminCabinsPage.tsx
│   │   ├── AdminCashRegisterPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminInventoryPage.tsx
│   │   ├── AdminMarketingPage.tsx
│   │   ├── AdminReportsPage.tsx
│   │   ├── AdminServicesPage.tsx
│   │   ├── AdminTherapistsPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   └── GlobalAgendaPage.tsx
│   ├── auth/                        # Autenticación y control de accesos
│   │   ├── LoginPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── UnauthorizedPage.tsx
│   ├── public/                      # Portal web y reserva para clientes
│   │   ├── BookingConfirmationPage.tsx
│   │   ├── BookingWizardPage.tsx
│   │   ├── LandingPage.tsx
│   │   └── ServicesCatalogPage.tsx
│   └── therapist/                   # Portal exclusivo de terapeutas
│       ├── TherapistAgendaPage.tsx
│       ├── TherapistAppointmentDetailPage.tsx
│       └── TherapistInventoryPage.tsx
├── services/                        # Capa de comunicación HTTP y simulación de datos
│   ├── adminService.ts
│   ├── api.ts
│   ├── authService.ts
│   ├── mockData.ts
│   ├── publicService.ts
│   └── therapistService.ts
├── types/                           # Declaraciones de tipos e interfaces TypeScript
│   ├── api.ts
│   └── models.ts
├── App.css                          # Estilos auxiliares / componentes demo
├── App.tsx                          # Router principal y punto neurálgico de rutas
├── index.css                        # Configuración de Tailwind CSS v4 y tema de colores
└── main.tsx                         # Entrada raíz que monta la aplicación en el DOM
```

---

## 3. Detalle de Archivos en la Raíz de `src/`

- **`main.tsx`**:  
  **Función:** Punto de entrada de la aplicación. Se encarga de inicializar React mediante `createRoot`, vincular el elemento `#root` de `index.html` y montar el componente principal `<App />` dentro de `StrictMode`.
- **`App.tsx`**:  
  **Función:** Configurador de rutas maestras (`react-router-dom`) y orquestador global. Envuelve toda la aplicación en `ToastProvider` y `AuthProvider`. Implementa carga perezosa (`React.lazy`) para optimizar rendimiento (WPO/LCP) y define las rutas públicas, de terapeuta y de administrador protegidas por roles con `<ProtectedRoute>`.
- **`index.css`**:  
  **Función:** Estilos globales y configuración temática con `@theme` de Tailwind CSS v4. Define la paleta de colores de spa (tonos tierra, beige, rosas, dorados, verdes salvia), tipografías de lujo (`Cormorant Garamond` y `Plus Jakarta Sans`), scrollbars personalizados y clases para efectos de cristal (*glassmorphism*).
- **`App.css`**:  
  **Función:** Estilos complementarios y reglas CSS específicas de componentes heredados o demostrativos (animaciones 3D, espaciados y componentes de demostración).

---

## 4. `src/assets/` — Recursos Gráficos Estáticos

**Propósito de la carpeta:** Almacenar imágenes, vectores y elementos multimedia locales que se importan en los componentes.
- **`hero.png`**: Imagen de fondo/presentación de alto impacto visual para la cabecera principal de la Landing Page.
- **`react.svg`**: Isotipo vectorial de React.
- **`vite.svg`**: Isotipo vectorial de la plataforma de empaquetado Vite.

---

## 5. `src/components/` — Componentes UI Reutilizables

**Propósito de la carpeta:** Contener componentes visuales atómicos y funcionales comunes que se reutilizan en múltiples páginas y layouts.
- **`Badge.tsx`**: Etiqueta visual para indicar estados dinámicos con códigos de color específicos (estados de citas: `PENDIENTE`, `ATENDIDA`, `CANCELADA`; niveles de inventario: `NORMAL`, `BAJO`, `CRÍTICO`; y roles: `ADMIN`, `RECEPCIONISTA`, `TERAPEUTA`).
- **`Button.tsx`**: Botón estandarizado con múltiples variantes estéticas (`primary`, `secondary`, `outline`, `danger`, `ghost`), soporte de tamaños (`sm`, `md`, `lg`), estados de carga (`spinner`) y renderizado de íconos.
- **`Footer.tsx`**: Pie de página institucional del portal público con enlaces de navegación rápida, filosofía del centro, horarios de atención (08:00 AM - 05:00 PM) e información de contacto/ubicación.
- **`Modal.tsx`**: Ventana modal flotante accesible que incluye backdrop con desenfoque (`backdrop-blur`), cierre al presionar la tecla `Escape` o clic fuera, bloqueo del scroll del fondo y títulos configurables.
- **`Navbar.tsx`**: Barra de navegación superior para el portal público. Incluye logotipo de la marca, enlaces de navegación, accesos según el estado de la sesión (`Iniciar Sesión`, `Cerrar Sesión` o acceso al panel correspondiente) y menú colapsable para dispositivos móviles.
- **`ProtectedRoute.tsx`**: Envoltorio de seguridad para rutas privadas. Valida que el usuario tenga una sesión activa y que su rol pertenezca a la lista de roles permitidos (`allowedRoles`). Si no está autenticado redirige a `/login`, y si no tiene permisos redirige a `/unauthorized`.
- **`StatCard.tsx`**: Tarjeta métrica para dashboards. Muestra un título, valor principal numérico/monetario, ícono temático, subtítulo y badge con porcentaje comparativo de tendencia positiva o negativa.

---

## 6. `src/contexts/` — Proveedores de Estado Global

**Propósito de la carpeta:** Administrar el estado compartido de la aplicación utilizando la API Context de React y custom hooks.
- **`AuthContext.tsx`**:  
  **Función:** Gestiona el ciclo de vida de la autenticación de usuarios. Proporciona el usuario actual, roles (`isAdmin`, `isTherapist`), tokens JWT (o simulación en `mockStore`), ID del terapeuta asignado, y métodos `login` y `logout`. Expone el hook `useAuth()`.
- **`ToastContext.tsx`**:  
  **Función:** Sistema global de notificaciones toast flotantes. Permite disparar mensajes interactivos y auto-removibles de éxito (`success`), error (`error`), advertencia (`warning`) e información (`info`) desde cualquier pantalla mediante el hook `useToast()`.

---

## 7. `src/layouts/` — Plantillas de Diseño Estructural

**Propósito de la carpeta:** Proporcionar la estructura contenedora común (headers, barras laterales, footers y áreas `<Outlet />`) según el perfil del usuario.
- **`PublicLayout.tsx`**: Plantilla minimalista para las páginas abiertas al público; posiciona de forma fija el `Navbar`, el contenido principal expandible y el `Footer`.
- **`TherapistLayout.tsx`**: Plantilla orientada al flujo de trabajo del terapeuta; provee un encabezado superior especializado con accesos rápidos a "Mi Agenda Diaria", "Insumos de Trabajo", datos del profesional y botón de cierre de sesión.
- **`AdminLayout.tsx`**: Plantilla completa tipo panel de control administrativo. Cuenta con barra lateral (*sidebar*) responsiva, navegación diferenciada por permisos (Administrador vs. Recepcionista), accesos a módulos operativos y cabecera de sesión.

---

## 8. `src/pages/` — Pantallas y Vistas del Sistema

### 8.1. `src/pages/auth/` — Control de Acceso y Errores de Navegación
- **`LoginPage.tsx`**: Formulario de inicio de sesión con validaciones, botones de acceso rápido para pruebas (Admin, Recepción, Terapeutas) y redirección automática según el rol asignado.
- **`NotFoundPage.tsx`**: Vista amigable de error 404 para URLs no encontradas, permitiendo retornar al inicio.
- **`UnauthorizedPage.tsx`**: Vista de error 403 (Acceso Denegado) mostrada cuando un usuario autenticado intenta ingresar a un módulo que supera sus privilegios.

### 8.2. `src/pages/public/` — Portal de Clientes
- **`LandingPage.tsx`**: Página principal del spa. Presenta el Hero de bienvenida, valores diferenciales, galería de cabinas exclusivas, presentación del equipo de terapeutas, servicios destacados y promociones vigentes con cupones que pueden copiarse en un clic.
- **`ServicesCatalogPage.tsx`**: Catálogo completo de servicios, masajes y rituales organizados en tarjetas detalladas que muestran duración (60 min), precio público, imagen botánica y acceso directo a reserva.
- **`BookingWizardPage.tsx`**: Asistente de reserva interactivo en 4 pasos:
  1. *Paso 1:* Datos de contacto del cliente (DNI, nombre, teléfono, email).
  2. *Paso 2:* Selección del servicio, terapeuta de preferencia y cabina asignada.
  3. *Paso 3:* Selección de fecha y selección de turno/slot disponible en tiempo real.
  4. *Paso 4:* Elección de método de pago (Tarjeta, Yape, Plin, Efectivo), aplicación de cupones con descuento automático y confirmación de la cita.
- **`BookingConfirmationPage.tsx`**: Pantalla de confirmación de reserva exitosa. Muestra el resumen completo de la cita, el código alfanumérico único generado y botones para descargar el comprobante en PDF.

### 8.3. `src/pages/therapist/` — Portal Operativo del Terapeuta
- **`TherapistAgendaPage.tsx`**: Agenda diaria del terapeuta autenticado. Permite seleccionar una fecha en el calendario, filtrar citas por estado (`TODOS`, `PENDIENTE`, `ATENDIDA`) e ingresar a la atención de cada cliente.
- **`TherapistAppointmentDetailPage.tsx`**: Centro de atención clínica de la cita. Permite:
  - Completar y actualizar la **Ficha de Atención** (tipo de piel, alergias conocidas y observaciones).
  - Agregar **Servicios o Insumos Adicionales** consumidos en sesión con recálculo de montos.
  - Finalizar la atención ("Completar Cita"), acción que descuenta automáticamente los insumos del inventario según la receta y emite el comprobante de pago PDF.
- **`TherapistInventoryPage.tsx`**: Consulta visual de stock en tiempo real de los insumos de cabina (aceites, cremas, sales, mascarillas) con indicadores de nivel de stock y alertas de reposición.

### 8.4. `src/pages/admin/` — Administración, Operaciones y Finanzas
- **`AdminDashboardPage.tsx`**: Panel ejecutivo de control (exclusivo Admin) con métricas financieras (ingresos, costos de insumos, ganancia operativa neta), operaciones diarias, porcentaje de ocupación, alertas de insumos en estado crítico, tendencia de 7 días y servicios más solicitados.
- **`GlobalAgendaPage.tsx`**: Matriz de agenda global simultánea. Muestra una vista horaria (08:00 a 16:00, 9 turnos) distribuida en columnas para las 3 cabinas del spa (Holística, Dermoestética e Hidroterapia), indicando el estado de cada horario y cliente asignado.
- **`AdminAppointmentsPage.tsx`**: Tabla maestra para buscar, filtrar por fecha/estado, inspeccionar y actualizar el estado de cualquier cita del sistema, así como descargar comprobantes PDF.
- **`AdminCashRegisterPage.tsx`**: Punto de Venta (POS) y Caja Registradora para recepción y administración. Permite gestionar turnos, vincular clientes con su código de historial, agregar servicios y productos al carrito, aplicar cupones, desglosar la base imponible con 18% de IGV, calcular cambio/vuelto e imprimir el ticket de venta.
- **`AdminInventoryPage.tsx`**: Gestión integral de suministros con dos vistas:
  - *Stock:* Control de existencias actuales, costos unitarios, stock mínimo de alerta y estados (`NORMAL`, `BAJO`, `CRÍTICO`).
  - *Kardex:* Historial cronológico de movimientos de entrada por compras, consumo automático por servicios y ajustes manuales.
- **`AdminMarketingPage.tsx`**: Módulo para la creación y gestión de campañas de marketing, promociones y cupones de descuento con porcentajes y rangos de fechas de validez.
- **`AdminServicesPage.tsx`**: Catálogo maestro de servicios y configuración de **Recetas Técnicas (BOM / Bill of Materials)**, vinculando los insumos requeridos y dosis por cada tratamiento para el descuento automático de stock.
- **`AdminTherapistsPage.tsx`**: Gestión del staff de terapeutas, asignación de cabinas de trabajo, especialidades, fotos de perfil y vinculación con cuentas de usuario del sistema.
- **`AdminCabinsPage.tsx`**: Administración de las 3 cabinas físicas (nombre, tipo y descripción de equipamiento disponible).
- **`AdminUsersPage.tsx`**: Gestión de usuarios y credenciales del sistema; creación y asignación de roles (`ADMIN`, `RECEPCIONISTA`, `TERAPEUTA`).
- **`AdminReportsPage.tsx`**: Módulo de análisis financiero que permite filtrar rangos de fechas para calcular ingresos totales, costos de insumos consumidos, ganancia operativa y desglose de productividad y facturación individual por terapeuta.

---

## 9. `src/services/` — Capa de Servicios y Datos

**Propósito de la carpeta:** Centralizar la lógica de llamadas HTTP hacia el backend, manejo de autenticación, interceptores y persistencia local simulada.
- **`api.ts`**: Configuración del cliente `axios` con la URL base del backend (`/api`), interceptores para adjuntar tokens JWT Bearer en cada petición, lógica de reintento/refresco de token ante respuestas 401, y función utilitaria `downloadPdf` con soporte de blobs.
- **`authService.ts`**: Métodos para iniciar sesión (`login`), cerrar sesión (`logout`), recuperar el usuario en sesión (`getCurrentUser`) y consultar datos persistidos en `localStorage`. Cuenta con fallback automático a usuarios mock.
- **`publicService.ts`**: Métodos de acceso público para obtener listas de servicios, terapeutas, cabinas, promociones activas, verificar slots de disponibilidad horaria por fecha (`getDisponibilidad`) y crear citas vía web (`reservarWeb`).
- **`therapistService.ts`**: Métodos para el portal del terapeuta: consulta de agenda diaria (`getMiAgenda`), detalle de cita (`getCitaDetail`), guardado/actualización de la ficha de atención (`saveFichaAtencion`), adición de servicios extra y cierre de cita con descuento de stock (`completarCita`).
- **`adminService.ts`**: Centralización de todas las operaciones administrativas (CRUD completo de productos, servicios y recetas BOM, promociones, terapeutas, cabinas, usuarios, reporte de caja y reportes financieros por rango).
- **`mockData.ts`**: Base de datos en memoria (`mockStore`) y datos semilla (*seed data*) con cabinas, terapeutas, productos, recetas, citas y usuarios. Permite que toda la interfaz funcione de manera interactiva sin depender obligatoriamente de una base de datos externa activa.

---

## 10. `src/types/` — Definiciones de Tipos TypeScript

**Propósito de la carpeta:** Tipado estático para garantizar consistencia entre el backend y los componentes visuales.
- **`api.ts`**: Interfaces de respuesta estándar del API (`ApiResponse<T>`), respuestas paginadas (`ApiPaginatedData<T>`) y estructura estándar de errores (`ApiError`).
- **`models.ts`**: Entidades del dominio del negocio de Sumaq Spa:
  - `User`, `Cliente`, `Cabina`, `Terapeuta`
  - `Producto`, `MovimientoInventario`, `RecetaServicio`
  - `Servicio`, `Promocion`, `ServicioAdicionalAtencion`, `FichaAtencion`
  - `Cita`, `MovimientoCaja`, `SlotDisponibilidad`
  - `DashboardData`, `ReporteData`
