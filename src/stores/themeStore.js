import { create } from 'zustand';

const useThemeStore = create((set) => ({
  dark: localStorage.getItem('theme') === 'dark',
  toggle: () =>
    set((state) => {
      const next = !state.dark;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return { dark: next };
    }),
  init: () => {
    const dark = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    set({ dark });
  },
}));

export default useThemeStore;
