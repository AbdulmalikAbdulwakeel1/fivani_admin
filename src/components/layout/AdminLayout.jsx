import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import useSidebarStore from '../../stores/sidebarStore';
import useAuthStore from '../../stores/authStore';

export default function AdminLayout() {
  const { collapsed } = useSidebarStore();
  const { token } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <TopBar />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
