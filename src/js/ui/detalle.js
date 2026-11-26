import { esc, html, seguro } from './dom.js';

/** Lista de pares etiqueta/valor (se omiten los valores vacíos). */
export function datos(pares) {
  const filas = pares
    .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
    .map(([etiqueta, valor]) => `<div><dt>${esc(etiqueta)}</dt><dd>${esc(valor)}</dd></div>`)
    .join('');
  return seguro(`<dl class="detalle__datos">${filas}</dl>`);
}

/** Tres métricas pequeñas (Figma: Iniciales / Donados / Desperdicio, etc.). */
export function metricas(lista) {
  return seguro(`<div class="detalle__metricas">${lista
    .map(([etiqueta, valor]) => html`<div class="estadistica estadistica--mini"><p class="estadistica__etiqueta">${etiqueta}</p><p class="estadistica__valor">${valor}</p></div>`.__html)
    .join('')}</div>`);
}

export const direccion = (calle, exterior, interior, colonia, cp, municipio, estado) =>
  [[calle, exterior && `#${exterior}`, interior && `int. ${interior}`].filter(Boolean).join(' '), colonia, cp && `C.P. ${cp}`, municipio, estado]
    .filter(Boolean)
    .join(', ');

/** Estructura "lista + ficha de detalle" con una barra de herramientas opcional. */
export function listaConDetalle(contenido, herramientas = '') {
  contenido.innerHTML = `
    <div class="seccion">
      ${herramientas ? `<div class="herramientas no-imprimir">${herramientas}</div>` : ''}
      <div class="lista-detalle">
        <div data-lista></div>
        <aside class="tarjeta detalle" data-detalle aria-live="polite">
          <p class="estado__texto">Selecciona un registro para ver su información.</p>
        </aside>
      </div>
    </div>`;
  return { lista: contenido.querySelector('[data-lista]'), detalle: contenido.querySelector('[data-detalle]') };
}
