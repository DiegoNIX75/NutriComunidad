import { api } from './client.js';

/** /api/beneficiarios, /api/preferencias y alergias (subrecurso del beneficiario). */
export const beneficiariosApi = {
  listar: (filtros) => api.get('/api/beneficiarios', filtros),
  obtener: (id) => api.get(`/api/beneficiarios/${id}`),
  crear: (datos) => api.post('/api/beneficiarios', datos),
  actualizar: (id, datos) => api.put(`/api/beneficiarios/${id}`, datos),
  eliminar: (id) => api.delete(`/api/beneficiarios/${id}`),
  mio: () => api.get('/api/beneficiarios/mio'),
  actualizarMio: (datos) => api.put('/api/beneficiarios/mio', datos),
  solicitudes: (id) => api.get(`/api/beneficiarios/${id}/solicitudes`),
  preferencias: (id) => api.get(`/api/beneficiarios/${id}/preferencias`),
  alergias: (id) => api.get(`/api/beneficiarios/${id}/alergias`),
  agregarAlergia: (id, idPreferencias, idAlimento) =>
    api.post(`/api/beneficiarios/${id}/alergias`, { idPreferencias, idAlimento }),
  eliminarAlergia: (id, idPreferencias, idAlimento) =>
    api.delete(`/api/beneficiarios/${id}/alergias/${idPreferencias}/${idAlimento}`),
};

export const preferenciasApi = {
  crear: (datos) => api.post('/api/preferencias', datos),
  actualizar: (id, datos) => api.put(`/api/preferencias/${id}`, datos),
  eliminar: (id) => api.delete(`/api/preferencias/${id}`),
};
