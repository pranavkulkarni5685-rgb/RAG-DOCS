import api from './api';

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.post('/settings', data),
  getHealth: () => api.get('/health'),
};
