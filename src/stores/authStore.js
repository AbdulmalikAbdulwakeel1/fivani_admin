import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,

  login: async (email, password, two_factor_code) => {
    set({ loading: true });
    try {
      const body = { email, password };
      if (two_factor_code) body.two_factor_code = two_factor_code;
      const { data } = await api.post('/login', body);
      if (data.status === 'success') {
        if (!data.user?.is_admin) {
          set({ loading: false });
          return { success: false, data: { message: 'Access denied. Admin accounts only.' } };
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, loading: false });
        return { success: true };
      }
      return { success: false, data };
    } catch (err) {
      set({ loading: false });
      const resp = err.response?.data;
      return { success: false, data: resp || { message: 'Network error' } };
    }
  },

  logout: async () => {
    try { await api.post('/logout'); } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/profile');
      const user = data.data || data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch { }
  },
}));

export default useAuthStore;
