import api from './api';

export const chatService = {
  sendMessage: (sessionId, question, documentIds) =>
    api.post('/chat', {
      sessionId: sessionId || null,
      question,
      documentIds: documentIds && documentIds.length > 0 ? documentIds : null,
    }),
  getSessions: () => api.get('/chat/sessions'),
  createSession: (title) => api.post('/chat/sessions', { title }),
  getSessionById: (id) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
};
