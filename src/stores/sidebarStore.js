import { create } from 'zustand';

const useSidebarStore = create((set) => ({
  collapsed: localStorage.getItem('sidebar') === 'collapsed',
  mobileOpen: false,
  toggle: () =>
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
      return { collapsed: next };
    }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}));

export default useSidebarStore;
