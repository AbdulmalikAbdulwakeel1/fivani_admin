import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useThemeStore from './stores/themeStore';
import useAuthStore from './stores/authStore';

import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import UserDetailPage from './pages/users/UserDetailPage';
import AdminUsersPage from './pages/admin-users/AdminUsersPage';
import ContractsPage from './pages/contracts/ContractsPage';
import ContractDetailPage from './pages/contracts/ContractDetailPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import AnalysisPage from './pages/analysis/AnalysisPage';
import WorkflowAnalysisPage from './pages/analysis/WorkflowAnalysisPage';
import RiskNegotiationPage from './pages/analysis/RiskNegotiationPage';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import SettingsPage from './pages/settings/SettingsPage';
import PermissionsPage from './pages/permissions/PermissionsPage';
import StripePage from './pages/stripe/StripePage';
import ProfilePage from './pages/profile/ProfilePage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import BlogPage from './pages/blog/BlogPage';
import ReportsPage from './pages/reports/ReportsPage';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { dark } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Analysis (priority pages) */}
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="analysis/workflow" element={<WorkflowAnalysisPage />} />
          <Route path="analysis/risk-negotiation" element={<RiskNegotiationPage />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* Users */}
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="admin-users" element={<AdminUsersPage />} />

          {/* Integrations */}
          <Route path="integrations" element={<IntegrationsPage />} />

          {/* Contracts & Projects */}
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/:contractAuth" element={<ContractDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />

          {/* Subscriptions & Stripe */}
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="stripe" element={<StripePage />} />

          {/* Blog */}
          <Route path="blog" element={<BlogPage />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="user-types" element={<PermissionsPage />} />

          {/* Profile */}
          <Route path="profile" element={<ProfilePage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
