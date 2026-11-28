import { INICIO_POR_ROL, RUTA_LOGIN } from './roles.js';
import { cerrarSesionLocal, obtenerSesion } from './session.js';

/** Redirige al login, recordando el motivo (por ejemplo, sesión expirada). */
export function irAlLogin(motivo) {
  const url = motivo ? `${RUTA_LOGIN}?motivo=${encodeURIComponent(motivo)}` : RUTA_LOGIN;
  window.location.replace(url);
}

/**
 * Protección básica de páginas privadas: exige sesión vigente y uno de los roles permitidos.
 * Si el rol no corresponde, envía al usuario a la página de inicio de su propio rol.
 */
export function exigirRol(...rolesPermitidos) {
  const sesion = obtenerSesion();
  if (!sesion) {
    irAlLogin('sesion');
    return null;
  }
  if (!rolesPermitidos.includes(sesion.rol)) {
    const inicio = INICIO_POR_ROL[sesion.rol];
    if (inicio) {
      window.location.replace(inicio);
    } else {
      cerrarSesionLocal();
      irAlLogin('rol');
    }
    return null;
  }
  return sesion;
}

export function cerrarSesion() {
  cerrarSesionLocal();
  window.location.assign(RUTA_LOGIN);
}
