import { NavLink } from 'react-router-dom';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineShieldCheck, HiOutlineDocumentText,
  HiOutlineFolder, HiOutlineChartBar, HiOutlineCreditCard, HiOutlineCog6Tooth,
  HiOutlineKey, HiOutlineBanknotes, HiOutlineChevronLeft, HiOutlineXMark,
  HiOutlineUserGroup, HiOutlineDocumentMagnifyingGlass, HiOutlineBeaker,
  HiOutlineSquares2X2, HiOutlineArrowsRightLeft, HiOutlineNewspaper,
  HiOutlineDocumentChartBar,
} from 'react-icons/hi2';
import useSidebarStore from '../../stores/sidebarStore';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { divider: true, label: 'Analytics' },
  { to: '/analysis/workflow', icon: HiOutlineDocumentMagnifyingGlass, label: 'Workflow Analysis' },
  { to: '/analysis/risk-negotiation', icon: HiOutlineBeaker, label: 'Risk & Negotiation' },
  { to: '/analysis', icon: HiOutlineChartBar, label: 'Analysis Overview' },
  { to: '/reports', icon: HiOutlineDocumentChartBar, label: 'Reports' },
  { divider: true, label: 'Content' },
  { to: '/blog', icon: HiOutlineNewspaper, label: 'Blog' },
  { divider: true, label: 'Management' },
  { to: '/users', icon: HiOutlineUsers, label: 'Users' },
  { to: '/admin-users', icon: HiOutlineShieldCheck, label: 'Admin Users' },
  { to: '/integrations', icon: HiOutlineArrowsRightLeft, label: 'Integrations' },
  { to: '/subscriptions', icon: HiOutlineCreditCard, label: 'Subscriptions' },
  { to: '/stripe', icon: HiOutlineBanknotes, label: 'Stripe' },
  { divider: true, label: 'Contracts & Projects' },
  { to: '/contracts', icon: HiOutlineDocumentText, label: 'Contracts' },
  { to: '/projects', icon: HiOutlineFolder, label: 'Projects' },
  { divider: true, label: 'Settings' },
  { to: '/settings', icon: HiOutlineCog6Tooth, label: 'Settings' },
  { to: '/permissions', icon: HiOutlineKey, label: 'Permissions' },
  { to: '/user-types', icon: HiOutlineUserGroup, label: 'User Types' },
];

export default function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[#002633] text-white transition-all duration-300 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="https://app.new-staging.fivani.com/assets/logo-CEj-s_PU.svg" alt="Fivani" className="h-7" />
            </div>
          )}
          {collapsed && (
            <img src="https://app.new-staging.fivani.com/assets/logo-CEj-s_PU.svg" alt="F" className="h-6 mx-auto" />
          )}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded hover:bg-white/10">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item, i) =>
            item.divider ? (
              <div key={i} className="pt-4 pb-1">
                {!collapsed && item.label && (
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">{item.label}</p>
                )}
                {collapsed && <div className="border-t border-white/10 mx-2" />}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          )}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center h-12 border-t border-white/10 hover:bg-white/10 transition-colors"
        >
          <HiOutlineChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
}
