import api from './api.js';

const doctorService = {
  async listPublicDoctors() {
    const { data } = await api.get('/doctors/public');
    return data.data;
  },

  async getMyProfile() {
    const { data } = await api.get('/doctors/me');
    return data.data?.profile ?? null;
  },

  async saveProfile(payload) {
    const { data } = await api.put('/doctors/me', payload);
    return data.data?.profile ?? null;
  },
};

export default doctorService;
