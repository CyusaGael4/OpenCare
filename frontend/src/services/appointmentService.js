import api from './api.js';

const appointmentService = {
  async getAvailability(doctorId, date) {
    const { data } = await api.get(`/appointments/doctor/${doctorId}/availability`, { params: { date } });
    return data.data;
  },

  async bookAppointment(payload) {
    const { data } = await api.post('/appointments/book', payload);
    return data.data?.appointment ?? null;
  },

  async listMyAppointments() {
    const { data } = await api.get('/appointments/me');
    return data.data?.appointments ?? [];
  },

  async cancelAppointment(id, reason) {
    const { data } = await api.patch(`/appointments/${id}/cancel`, { cancellationReason: reason ?? '' });
    return data.data?.appointment ?? null;
  },

  async updateAppointmentStatus(id, status) {
    const { data } = await api.patch(`/appointments/${id}/status`, { status });
    return data.data?.appointment ?? null;
  },
};

export default appointmentService;
