const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para insertarlo en HTML (evita XSS con datos del backend). */
export const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);

/** Marca un fragmento como HTML ya seguro para que html`` no lo escape. */
export const seguro = (fragmento) => ({ __html: String(fragmento ?? '') });

function convertir(valor) {
  if (valor === null || valor === undefined || valor === false) return '';
  if (Array.isArray(valor)) return valor.map(convertir).join('');
  if (typeof valor === 'object' && '__html' in valor) return valor.__html;
  return esc(valor);
}

/** Plantilla que escapa automáticamente los valores interpolados. Devuelve HTML seguro. */
export function html(cadenas, ...valores) {
  return seguro(cadenas.reduce((acc, cadena, i) => acc + cadena + (i < valores.length ? convertir(valores[i]) : ''), ''));
}

/** Inserta HTML seguro (resultado de html``) en un elemento. */
export function pintar(elemento, fragmento) {
  elemento.innerHTML = typeof fragmento === 'string' ? esc(fragmento) : fragmento.__html;
}

/** Reemplaza {{clave}} en una plantilla HTML (partials) con valores escapados. */
export function rellenar(plantilla, datos) {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, clave) => esc(datos[clave]));
}

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
