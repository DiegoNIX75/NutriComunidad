import { esc, html } from './dom.js';
import { mostrarVacio } from './estados.js';

/**
 * Pinta una tabla. columnas: [{ titulo, valor: (fila) => texto | html``, clase }].
 * Si se indica alSeleccionar, las filas son seleccionables (clic o Enter).
 */
export function pintarTabla(elemento, { columnas, filas, vacio, alSeleccionar, idFila, seleccionada, pie }) {
  if (!filas.length) {
    mostrarVacio(elemento, vacio);
    return;
  }
  const contenido = (valor) => (valor && typeof valor === 'object' && '__html' in valor ? valor.__html : esc(valor ?? '—'));
  const cuerpo = filas.map((fila, i) => {
    const id = idFila ? idFila(fila) : i;
    const atributos = alSeleccionar
      ? `data-seleccionable data-id="${esc(id)}" tabindex="0" aria-selected="${String(id) === String(seleccionada)}"`
      : '';
    return `<tr ${atributos}>${columnas.map((c) => `<td class="${c.clase ?? ''}">${contenido(c.valor(fila))}</td>`).join('')}</tr>`;
  }).join('');
  const piePagina = pie
    ? `<tfoot><tr>${columnas.map((c, i) => `<td class="${c.clase ?? ''}">${contenido(pie[i] ?? '')}</td>`).join('')}</tr></tfoot>`
    : '';

  elemento.innerHTML = `<div class="tabla-envoltura"><table class="tabla">
    <thead><tr>${columnas.map((c) => `<th scope="col" class="${c.clase ?? ''}">${esc(c.titulo)}</th>`).join('')}</tr></thead>
    <tbody>${cuerpo}</tbody>${piePagina}</table></div>`;

  if (alSeleccionar) {
    const elegir = (tr) => {
      elemento.querySelectorAll('tr[aria-selected]').forEach((f) => f.setAttribute('aria-selected', 'false'));
      tr.setAttribute('aria-selected', 'true');
      alSeleccionar(filas.find((f, i) => String(idFila ? idFila(f) : i) === tr.dataset.id));
    };
    elemento.querySelectorAll('tr[data-seleccionable]').forEach((tr) => {
      tr.addEventListener('click', (e) => {
        if (!e.target.closest('button, a')) elegir(tr);
      });
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target === tr) elegir(tr);
      });
    });
  }
}

export const insignia = (texto, clase) => (texto ? html`<span class="insignia ${clase ?? ''}">${texto}</span>` : '—');
