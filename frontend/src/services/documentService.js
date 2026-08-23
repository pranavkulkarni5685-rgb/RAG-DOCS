import api from './api';

export const documentService = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
  delete: (id) => api.delete(`/documents/${id}`),
};
