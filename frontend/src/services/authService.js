import api from './api.js';

/**
 * Auth endpoints. Every call relies on the httpOnly session cookie, so there are
 * no tokens to pass around or store.
 */
export const authService = {
  async me() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  async logout() {
    const { data } = await api.post('/auth/logout');
    return data.data;
  },
};

export default authService;
