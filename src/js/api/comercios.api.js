import { api } from './client.js';

/** /api/comercios y /api/donaciones. */
export const comerciosApi = {
  listar: (filtros) => api.get('/api/comercios', filtros),
  obtener: (id) => api.get(`/api/comercios/${id}`),
  crear: (datos) => api.post('/api/comercios', datos),
  actualizar: (id, datos) => api.put(`/api/comercios/${id}`, datos),
  eliminar: (id) => api.delete(`/api/comercios/${id}`),
  mio: () => api.get('/api/comercios/mio'),
  actualizarMio: (datos) => api.put('/api/comercios/mio', datos),
};

export const donacionesApi = {
  listar: (filtros) => api.get('/api/donaciones', filtros),
  obtener: (id) => api.get(`/api/donaciones/${id}`),
  crear: (datos) => api.post('/api/donaciones', datos),
};
