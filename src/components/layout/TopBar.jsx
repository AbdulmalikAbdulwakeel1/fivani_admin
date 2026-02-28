import { HiOutlineBars3, HiOutlineMoon, HiOutlineSun, HiOutlineArrowRightOnRectangle, HiOutlineUserCircle } from 'react-icons/hi2';
import useAuthStore from '../../stores/authStore';
import useThemeStore from '../../stores/themeStore';
import useSidebarStore from '../../stores/sidebarStore';
import { useNavigate, Link } from 'react-router-dom';

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const { dark, toggle: toggleTheme } = useThemeStore();
  const { collapsed, setMobileOpen } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 transition-all
        ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
    >
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <HiOutlineBars3 className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
        </button>

        <Link
          to="/profile"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#3498db] flex items-center justify-center text-white text-sm font-medium">
              {user?.fullname?.charAt(0) || 'A'}
            </div>
          )}
          <span className="text-sm font-medium">{user?.fullname || 'Admin'}</span>
        </Link>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
          title="Logout"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
