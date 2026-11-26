import { api, solicitar } from './client.js';

/** /api/auth: registro, login y perfil del usuario autenticado. */
export const authApi = {
  login: (correo, contrasena) =>
    solicitar('/api/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena }, autenticado: false }),
  registrar: (datos) => solicitar('/api/auth/registro', { metodo: 'POST', cuerpo: datos, autenticado: false }),
  yo: () => api.get('/api/auth/yo'),
  actualizarPerfil: (datos) => api.put('/api/auth/yo', datos),
  cambiarContrasena: (contrasenaActual, contrasenaNueva) =>
    api.put('/api/auth/yo/contrasena', { contrasenaActual, contrasenaNueva }),
};
