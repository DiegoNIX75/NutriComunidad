import { authApi } from '../api/auth.api.js';
import { INICIO_POR_ROL } from '../auth/roles.js';
import { guardarSesion, obtenerSesion } from '../auth/session.js';
import { mensajeDeError } from '../ui/avisos.js';
import { alertaEn, leerFormulario, ocupado, validarFormulario } from '../ui/formularios.js';

const formulario = document.querySelector('[data-formulario-login]');
const alerta = document.querySelector('[data-alerta]');

// Si ya hay una sesión vigente, no tiene sentido volver a iniciar sesión.
const sesionActual = obtenerSesion();
if (sesionActual && INICIO_POR_ROL[sesionActual.rol]) {
  window.location.replace(INICIO_POR_ROL[sesionActual.rol]);
}

const MOTIVOS = {
  expirada: ['Tu sesión expiró. Inicia sesión nuevamente.', 'aviso'],
  sesion: ['Inicia sesión para continuar.', 'info'],
  rol: ['Tu cuenta no tiene un panel asignado. Contacta a un administrador.', 'aviso'],
  registro: ['Cuenta creada correctamente. Ya puedes iniciar sesión.', 'exito'],
};
const motivo = MOTIVOS[new URLSearchParams(window.location.search).get('motivo')];
if (motivo) alertaEn(alerta, ...motivo);

let enviando = false;

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (enviando || !validarFormulario(formulario)) return;

  const { correo, contrasena } = leerFormulario(formulario);
  const boton = formulario.querySelector('[type="submit"]');
  enviando = true;
  alertaEn(alerta, '');
  ocupado(boton, true, 'Verificando…');

  try {
    // POST /api/auth/login -> { token, tipo, expiraEnHoras, usuario: { ..., nombreRol } }
    const respuesta = await authApi.login(correo, contrasena);
    guardarSesion(respuesta.token, respuesta.usuario);
    const destino = INICIO_POR_ROL[obtenerSesion()?.rol];
    if (!destino) throw new Error('Rol sin panel');
    window.location.assign(destino);
  } catch (error) {
    alertaEn(alerta, error.message === 'Rol sin panel' ? MOTIVOS.rol[0] : mensajeDeError(error));
    ocupado(boton, false);
    enviando = false;
  }
});
