import { esc, html, seguro } from './dom.js';
import { moneda } from './formato.js';

/**
 * Imágenes de recetas. Coloca los archivos en src/img/recetas/ con el nombre
 * receta-{idReceta}.{webp|jpg|jpeg|png} (por ejemplo receta-3.webp). Vite los detecta en el
 * build; si una receta no tiene imagen se muestra el espacio reservado del diseño.
 */
const archivos = import.meta.glob('../../img/recetas/receta-*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const IMAGENES = Object.fromEntries(
  Object.entries(archivos).map(([ruta, url]) => [ruta.match(/receta-(\d+)\./)[1], url]),
);

export function imagenReceta(receta, clase = '') {
  const url = IMAGENES[String(receta.idReceta)];
  return seguro(url
    ? `<div class="marcador-imagen ${clase}"><img src="${esc(url)}" alt="${esc(receta.nombreReceta)}" loading="lazy"></div>`
    : `<div class="marcador-imagen ${clase}" role="img" aria-label="Imagen de ${esc(receta.nombreReceta)} (pendiente)"></div>`);
}

export const metaReceta = (r) => [r.tiempoPreparacion, r.proporciones, r.costoEstimado != null && moneda(r.costoEstimado)]
  .filter(Boolean)
  .join(' · ');

/** Tarjeta de receta (Figma: imagen, título, descripción y meta). */
export function tarjetaReceta(receta) {
  return html`<button type="button" class="receta" data-receta="${receta.idReceta}">
      ${imagenReceta(receta, 'receta__imagen')}
      <span class="receta__cuerpo">
        <span class="receta__titulo">${receta.nombreReceta}</span>
        <span class="receta__texto">${receta.descripcion ?? ''}</span>
        <span class="receta__meta">${metaReceta(receta)}</span>
      </span>
    </button>`;
}

/** Contenido del detalle de una receta con sus ingredientes. */
export function detalleReceta(receta) {
  return html`
    ${imagenReceta(receta, 'receta__imagen')}
    <br>
    <p class="receta__meta">${metaReceta(receta)}</p><br>
    <p>${receta.descripcion ?? 'Sin descripción.'}</p><br>
    <h3 class="seccion__titulo">Ingredientes</h3><br>
    ${receta.ingredientes?.length
      ? seguro(`<ul class="movimientos">${receta.ingredientes
        .map((i) => `<li><span>${esc(i.nombreAlimento)}</span><span>${esc(i.cantidad)} ${esc(i.unidadMedida ?? '')}</span></li>`)
        .join('')}</ul>`)
      : html`<p class="detalle__nota">Esta receta aún no tiene ingredientes registrados.</p>`}`;
}
