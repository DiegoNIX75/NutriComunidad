import { esc } from './dom.js';
import { mensajeDeError } from './avisos.js';

export function mostrarCargando(elemento, texto = 'Cargando información…') {
  elemento.innerHTML = `<div class="estado" aria-busy="true"><div class="cargando"></div><p class="estado__texto">${esc(texto)}</p></div>`;
}

export function mostrarVacio(elemento, { titulo = 'No hay datos a mostrar', texto = '', icono = '⌧' } = {}) {
  elemento.innerHTML = `<div class="estado"><div class="estado__icono" aria-hidden="true">${esc(icono)}</div>
    <p class="estado__titulo">${esc(titulo)}</p>${texto ? `<p class="estado__texto">${esc(texto)}</p>` : ''}</div>`;
}

/** Muestra un error comprensible y, opcionalmente, un botón para reintentar. */
export function mostrarError(elemento, error, reintentar) {
  elemento.innerHTML = `<div class="estado estado--error" role="alert"><div class="estado__icono" aria-hidden="true">!</div>
    <p class="estado__titulo">No se pudo cargar la información</p><p class="estado__texto">${esc(mensajeDeError(error))}</p>
    ${reintentar ? '<button type="button" class="boton boton--contorno boton--chico">Reintentar</button>' : ''}</div>`;
  if (reintentar) elemento.querySelector('button').addEventListener('click', reintentar);
}
