import { esc } from './dom.js';
import { mensajeDeError } from './avisos.js';
import { alertaEn, leerFormulario, ocupado, validarFormulario } from './formularios.js';

/**
 * Abre un formulario en un modal. alGuardar(datos, formulario) debe devolver una promesa;
 * si falla, el error del backend se muestra dentro del modal sin cerrarlo.
 */
export function abrirFormulario({ titulo, contenido, textoGuardar = 'Guardar', alGuardar, alAbrir, ancho = '' }) {
  const dialogo = document.createElement('dialog');
  dialogo.className = `modal ${ancho}`;
  dialogo.innerHTML = `
    <form class="modal__contenido" novalidate>
      <div class="modal__encabezado">
        <h2 class="modal__titulo">${esc(titulo)}</h2>
        <button type="button" class="boton-icono" data-cerrar aria-label="Cerrar">×</button>
      </div>
      <div data-alerta></div>
      ${contenido}
      <div class="acciones-form">
        <button type="button" class="boton boton--texto" data-cerrar>Cancelar</button>
        <button type="submit" class="boton boton--primario">${esc(textoGuardar)}</button>
      </div>
    </form>`;
  document.body.append(dialogo);
  const formulario = dialogo.querySelector('form');
  const cerrar = () => cerrarDialogo(dialogo);
  dialogo.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', cerrar));
  dialogo.addEventListener('cancel', cerrar);
  dialogo.addEventListener('close', cerrar);

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!validarFormulario(formulario)) return;
    const boton = formulario.querySelector('[type="submit"]');
    alertaEn(formulario.querySelector('[data-alerta]'), '');
    ocupado(boton, true);
    try {
      await alGuardar(leerFormulario(formulario), formulario);
      cerrar();
    } catch (error) {
      alertaEn(formulario.querySelector('[data-alerta]'), mensajeDeError(error));
    } finally {
      if (dialogo.isConnected) ocupado(boton, false);
    }
  });

  alAbrir?.(formulario);
  dialogo.showModal();
  return dialogo;
}

/** Modal informativo (sólo lectura) con contenido HTML seguro. */
export function abrirDetalle({ titulo, contenido }) {
  const dialogo = document.createElement('dialog');
  dialogo.className = 'modal';
  dialogo.innerHTML = `<div class="modal__contenido">
      <div class="modal__encabezado"><h2 class="modal__titulo">${esc(titulo)}</h2>
        <button type="button" class="boton-icono" aria-label="Cerrar">×</button></div>${contenido}</div>`;
  document.body.append(dialogo);
  const cerrar = () => cerrarDialogo(dialogo);
  dialogo.querySelector('button').addEventListener('click', cerrar);
  dialogo.addEventListener('cancel', cerrar);
  dialogo.addEventListener('close', cerrar);
  dialogo.showModal();
  return dialogo;
}

/** Cierra y retira el diálogo sin depender del evento "close" (que puede llegar tarde). */
function cerrarDialogo(dialogo) {
  if (dialogo.open) dialogo.close();
  dialogo.remove();
}
