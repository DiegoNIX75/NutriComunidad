import { api } from './client.js';

/** /api/solicitudes y /api/entregas. */
export const solicitudesApi = {
  listar: (filtros) => api.get('/api/solicitudes', filtros),
  obtener: (id) => api.get(`/api/solicitudes/${id}`),
  crear: (datos) => api.post('/api/solicitudes', datos),
  actualizar: (id, datos) => api.put(`/api/solicitudes/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/api/solicitudes/${id}/estado`, { estado }),
  entregas: (id) => api.get(`/api/solicitudes/${id}/entregas`),
};

export const entregasApi = {
  listar: (filtros) => api.get('/api/entregas', filtros),
  crear: (datos) => api.post('/api/entregas', datos),
  cambiarEstado: (id, estado) => api.patch(`/api/entregas/${id}/estado`, { estado }),
};
