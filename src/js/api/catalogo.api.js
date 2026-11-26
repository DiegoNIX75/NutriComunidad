import { api } from './client.js';

/** /api/categorias, /api/alimentos y /api/recetas (catálogo). */
export const categoriasApi = {
  listar: (filtros) => api.get('/api/categorias', filtros),
  crear: (datos) => api.post('/api/categorias', datos),
  actualizar: (id, datos) => api.put(`/api/categorias/${id}`, datos),
  eliminar: (id) => api.delete(`/api/categorias/${id}`),
};

export const alimentosApi = {
  listar: (filtros) => api.get('/api/alimentos', filtros),
  crear: (datos) => api.post('/api/alimentos', datos),
  actualizar: (id, datos) => api.put(`/api/alimentos/${id}`, datos),
  eliminar: (id) => api.delete(`/api/alimentos/${id}`),
};

export const recetasApi = {
  listar: (filtros) => api.get('/api/recetas', filtros),
  obtener: (id) => api.get(`/api/recetas/${id}`),
  crear: (datos) => api.post('/api/recetas', datos),
  actualizar: (id, datos) => api.put(`/api/recetas/${id}`, datos),
  eliminar: (id) => api.delete(`/api/recetas/${id}`),
  agregarIngrediente: (id, datos) => api.post(`/api/recetas/${id}/ingredientes`, datos),
  eliminarIngrediente: (id, idDetalle) => api.delete(`/api/recetas/${id}/ingredientes/${idDetalle}`),
};
