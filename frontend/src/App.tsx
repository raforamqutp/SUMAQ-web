import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { TherapistLayout } from './layouts/TherapistLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages (Lazy Loaded for WPO & Fast LCP)
const LandingPage = lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const ServicesCatalogPage = lazy(() => import('./pages/public/ServicesCatalogPage').then(m => ({ default: m.ServicesCatalogPage })));
const BookingWizardPage = lazy(() => import('./pages/public/BookingWizardPage').then(m => ({ default: m.BookingWizardPage })));
const BookingConfirmationPage = lazy(() => import('./pages/public/BookingConfirmationPage').then(m => ({ default: m.BookingConfirmationPage })));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const UnauthorizedPage = lazy(() => import('./pages/auth/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));
const NotFoundPage = lazy(() => import('./pages/auth/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Therapist Pages
const TherapistAgendaPage = lazy(() => import('./pages/therapist/TherapistAgendaPage').then(m => ({ default: m.TherapistAgendaPage })));
const TherapistAppointmentDetailPage = lazy(() => import('./pages/therapist/TherapistAppointmentDetailPage').then(m => ({ default: m.TherapistAppointmentDetailPage })));
const TherapistInventoryPage = lazy(() => import('./pages/therapist/TherapistInventoryPage').then(m => ({ default: m.TherapistInventoryPage })));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const GlobalAgendaPage = lazy(() => import('./pages/admin/GlobalAgendaPage').then(m => ({ default: m.GlobalAgendaPage })));
const AdminAppointmentsPage = lazy(() => import('./pages/admin/AdminAppointmentsPage').then(m => ({ default: m.AdminAppointmentsPage })));
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage').then(m => ({ default: m.AdminInventoryPage })));
const AdminMarketingPage = lazy(() => import('./pages/admin/AdminMarketingPage').then(m => ({ default: m.AdminMarketingPage })));
const AdminServicesPage = lazy(() => import('./pages/admin/AdminServicesPage').then(m => ({ default: m.AdminServicesPage })));
const AdminTherapistsPage = lazy(() => import('./pages/admin/AdminTherapistsPage').then(m => ({ default: m.AdminTherapistsPage })));
const AdminCabinsPage = lazy(() => import('./pages/admin/AdminCabinsPage').then(m => ({ default: m.AdminCabinsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const AdminCashRegisterPage = lazy(() => import('./pages/admin/AdminCashRegisterPage').then(m => ({ default: m.AdminCashRegisterPage })));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public Flow */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/servicios" element={<ServicesCatalogPage />} />
              <Route path="/reservar" element={<BookingWizardPage />} />
              <Route path="/confirmacion" element={<BookingConfirmationPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Therapist Flow (Protected) */}
            <Route
              path="/terapeuta"
              element={
                <ProtectedRoute allowedRoles={['TERAPEUTA', 'ADMIN']}>
                  <TherapistLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TherapistAgendaPage />} />
              <Route path="citas/:id" element={<TherapistAppointmentDetailPage />} />
              <Route path="inventario" element={<TherapistInventoryPage />} />
            </Route>

            {/* Admin / Operations Flow (Protected) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="agenda" element={<GlobalAgendaPage />} />
              <Route path="citas" element={<AdminAppointmentsPage />} />
              <Route path="caja" element={<AdminCashRegisterPage />} />
              <Route path="inventario" element={<AdminInventoryPage />} />
              <Route
                path="marketing"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminMarketingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="servicios" element={<AdminServicesPage />} />
              <Route path="terapeutas" element={<AdminTherapistsPage />} />
              <Route
                path="cabinas"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminCabinsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="usuarios"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reportes"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminReportsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  </Router>
);
};

export default App;
