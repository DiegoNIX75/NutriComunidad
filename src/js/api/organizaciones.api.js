import { api } from './client.js';

/** /api/organizaciones, /api/inventarios y /api/lotes. */
export const organizacionesApi = {
  listar: (filtros) => api.get('/api/organizaciones', filtros),
  obtener: (id) => api.get(`/api/organizaciones/${id}`),
  crear: (datos) => api.post('/api/organizaciones', datos),
  actualizar: (id, datos) => api.put(`/api/organizaciones/${id}`, datos),
  eliminar: (id) => api.delete(`/api/organizaciones/${id}`),
  mia: () => api.get('/api/organizaciones/mio'),
  actualizarMia: (datos) => api.put('/api/organizaciones/mio', datos),
  solicitudes: (id) => api.get(`/api/organizaciones/${id}/solicitudes`),
  inventarios: (id) => api.get(`/api/organizaciones/${id}/inventarios`),
};

export const inventariosApi = {
  listar: (filtros) => api.get('/api/inventarios', filtros),
  obtener: (id) => api.get(`/api/inventarios/${id}`),
  crear: (datos) => api.post('/api/inventarios', datos),
  actualizar: (id, datos) => api.put(`/api/inventarios/${id}`, datos),
  lotes: (id) => api.get(`/api/inventarios/${id}/lotes`),
};

export const lotesApi = {
  listar: (filtros) => api.get('/api/lotes', filtros),
  crear: (datos) => api.post('/api/lotes', datos),
};
