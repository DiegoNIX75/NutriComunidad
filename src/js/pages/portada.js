import { INICIO_POR_ROL } from '../auth/roles.js';
import { obtenerSesion } from '../auth/session.js';

// La portada es pública. Si ya hay una sesión vigente, los botones llevan directo al panel del rol.
const sesion = obtenerSesion();
const inicio = sesion && INICIO_POR_ROL[sesion.rol];

if (inicio) {
  document.querySelectorAll('[data-enlace-acceso]').forEach((enlace) => {
    enlace.href = inicio;
    enlace.textContent = 'Ir a mi panel';
  });
}
