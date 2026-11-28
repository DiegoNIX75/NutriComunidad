import { api } from './client.js';

/** /api/usuarios y /api/roles (administración). */
export const usuariosApi = {
  listar: (filtros) => api.get('/api/usuarios', filtros),
  obtener: (id) => api.get(`/api/usuarios/${id}`),
  crear: (datos) => api.post('/api/usuarios', datos),
  actualizar: (id, datos) => api.put(`/api/usuarios/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/api/usuarios/${id}/estado`, { estado }),
  cambiarRol: (id, idRol) => api.patch(`/api/usuarios/${id}/rol`, { idRol }),
  eliminar: (id) => api.delete(`/api/usuarios/${id}`),
};

export const rolesApi = {
  listar: () => api.get('/api/roles'),
};
