import emblema from '../../img/emblema.png';
import plantillaLateral from '../../partials/barra-lateral.html?raw';
import plantillaEncabezado from '../../partials/encabezado-panel.html?raw';
import plantillaPagina from '../../partials/encabezado-pagina.html?raw';
import { cerrarSesion, exigirRol } from '../auth/guard.js';
import { ETIQUETAS_ROL, INICIO_POR_ROL, MENU_POR_ROL } from '../auth/roles.js';
import { esc, rellenar } from '../ui/dom.js';
import { iniciales, nombreCompleto } from '../ui/formato.js';

/**
 * Monta el layout de un panel privado (encabezado, menú lateral y título) y protege la página.
 * Devuelve { sesion, contenido, acciones } o null si el usuario no tiene acceso (ya redirigido).
 */
export function montarPanel({ rol, pagina, titulo, descripcion }) {
  const sesion = exigirRol(rol);
  if (!sesion) return null;

  const usuario = sesion.usuario ?? {};
  const nombre = nombreCompleto(usuario.nombreUsuario, usuario.apUsuario) || 'Usuario';
  const etiquetaRol = ETIQUETAS_ROL[sesion.rol] ?? sesion.rol;
  const app = document.getElementById('app');

  app.innerHTML = `
    ${rellenar(plantillaEncabezado, { inicio: INICIO_POR_ROL[sesion.rol], emblema, iniciales: iniciales(nombre), nombre, rol: etiquetaRol })}
    <div class="panel">
      ${rellenar(plantillaLateral, { emblema, rol: etiquetaRol })}
      <div class="panel__fondo" data-cerrar-menu hidden></div>
      <main class="panel__principal" id="principal">
        ${rellenar(plantillaPagina, { titulo, descripcion })}
        <div data-contenido></div>
      </main>
    </div>`;

  app.querySelector('[data-menu-lista]').innerHTML = MENU_POR_ROL[sesion.rol]
    .map((item) => `<li><a class="barra-lateral__enlace" href="${esc(item.href)}" ${item.id === pagina ? 'aria-current="page"' : ''}>${esc(item.texto)}</a></li>`)
    .join('');

  configurarMenuMovil(app);
  app.querySelector('[data-cerrar-sesion]').addEventListener('click', cerrarSesion);
  document.title = `${titulo} · NutriComunidad`;

  return { sesion, contenido: app.querySelector('[data-contenido]'), acciones: app.querySelector('[data-acciones]') };
}

function configurarMenuMovil(app) {
  const boton = app.querySelector('[data-abrir-menu]');
  const lateral = app.querySelector('.barra-lateral');
  const fondo = app.querySelector('[data-cerrar-menu]');
  const alternar = (abrir) => {
    lateral.classList.toggle('barra-lateral--abierta', abrir);
    boton.setAttribute('aria-expanded', String(abrir));
    fondo.hidden = !abrir;
  };
  boton.addEventListener('click', () => alternar(!lateral.classList.contains('barra-lateral--abierta')));
  fondo.addEventListener('click', () => alternar(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') alternar(false);
  });
}

/** Agrega un botón a la zona de acciones del encabezado de la página. */
export function agregarAccion(acciones, texto, clase, alPulsar) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `boton ${clase}`;
  boton.textContent = texto;
  boton.addEventListener('click', alPulsar);
  acciones.append(boton);
  return boton;
}

/** Muestra el nombre del comercio/organización en el encabezado (como en el Figma). */
export function mostrarNombreEnEncabezado(nombre) {
  const destino = document.querySelector('[data-nombre-visible]');
  if (destino && nombre) destino.textContent = nombre;
}
