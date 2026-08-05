import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/toaster';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CompanySettingsPage } from './pages/dashboard/CompanySettingsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { ClientsListPage } from './pages/clients/ClientsListPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';
import { ClientDetailsPage } from './pages/clients/ClientDetailsPage';
import { InvoicesListPage } from './pages/invoices/InvoicesListPage';
import { InvoiceBuilderPage } from './pages/invoices/InvoiceBuilderPage';
import { InvoiceDetailsPage } from './pages/invoices/InvoiceDetailsPage';
import { ExpensesListPage } from './pages/expenses/ExpensesListPage';
import { ExpenseFormPage } from './pages/expenses/ExpenseFormPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AdminRoute } from './components/shared/AdminRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBusinessesPage } from './pages/admin/AdminBusinessesPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';

import { PublicPaymentPage } from './pages/payment/PublicPaymentPage';
import { ActivityPage } from './pages/activity/ActivityPage';
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/pay" element={<PublicPaymentPage />} />
      <Route path="/unauthorized" element={<AccessDeniedPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<CompanySettingsPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/new" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientDetailsPage />} />
          <Route path="/clients/:id/edit" element={<ClientFormPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/new" element={<InvoiceBuilderPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceBuilderPage />} />
          <Route path="/expenses" element={<ExpensesListPage />} />
          <Route path="/expenses/new" element={<ExpenseFormPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
        </Route>
      </Route>
      
      {/* Super Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
          <Route path="/admin/logs" element={<AdminLogsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Toaster />
      <AuthProvider>
        <CompanyProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
