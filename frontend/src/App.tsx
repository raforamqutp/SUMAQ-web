import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { TherapistLayout } from './layouts/TherapistLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { ServicesCatalogPage } from './pages/public/ServicesCatalogPage';
import { BookingWizardPage } from './pages/public/BookingWizardPage';
import { BookingConfirmationPage } from './pages/public/BookingConfirmationPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { NotFoundPage } from './pages/auth/NotFoundPage';

// Therapist Pages
import { TherapistAgendaPage } from './pages/therapist/TherapistAgendaPage';
import { TherapistAppointmentDetailPage } from './pages/therapist/TherapistAppointmentDetailPage';
import { TherapistInventoryPage } from './pages/therapist/TherapistInventoryPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { GlobalAgendaPage } from './pages/admin/GlobalAgendaPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminMarketingPage } from './pages/admin/AdminMarketingPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminTherapistsPage } from './pages/admin/AdminTherapistsPage';
import { AdminCabinsPage } from './pages/admin/AdminCabinsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCashRegisterPage } from './pages/admin/AdminCashRegisterPage';

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
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
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
