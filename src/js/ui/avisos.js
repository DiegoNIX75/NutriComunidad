import { ApiError } from '../api/client.js';
import { esc } from './dom.js';

function contenedor() {
  let caja = document.querySelector('.avisos');
  if (!caja) {
    caja = document.createElement('div');
    caja.className = 'avisos';
    caja.setAttribute('role', 'status');
    caja.setAttribute('aria-live', 'polite');
    document.body.append(caja);
  }
  return caja;
}

/** Aviso temporal (toast). tipo: 'info' | 'exito' | 'error'. */
export function avisar(mensaje, tipo = 'info') {
  const aviso = document.createElement('div');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.textContent = mensaje;
  contenedor().append(aviso);
  setTimeout(() => aviso.remove(), tipo === 'error' ? 6000 : 3500);
}

export function mensajeDeError(error) {
  if (error instanceof ApiError) return error.message;
  console.error(error);
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}

/**
 * Diálogo de confirmación para acciones importantes. Devuelve una promesa con true/false.
 * La respuesta se resuelve en el clic (no depende del evento "close", que el navegador puede
 * retrasar si la pestaña no está visible).
 */
export function confirmar({ titulo, mensaje, textoConfirmar = 'Confirmar', peligro = false }) {
  return new Promise((resolver) => {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'modal modal--chico';
    dialogo.innerHTML = `
      <div class="modal__contenido">
        <div class="modal__encabezado"><h2 class="modal__titulo">${esc(titulo)}</h2></div>
        <p class="modal__texto">${esc(mensaje)}</p>
        <div class="acciones-form">
          <button type="button" class="boton boton--texto" data-respuesta="no">Cancelar</button>
          <button type="button" class="boton ${peligro ? 'boton--peligro' : 'boton--primario'}" data-respuesta="si">${esc(textoConfirmar)}</button>
        </div>
      </div>`;
    let resuelto = false;
    const terminar = (respuesta) => {
      if (resuelto) return;
      resuelto = true;
      if (dialogo.open) dialogo.close();
      dialogo.remove();
      resolver(respuesta);
    };
    dialogo.querySelectorAll('[data-respuesta]').forEach((b) => b.addEventListener('click', () => terminar(b.dataset.respuesta === 'si')));
    dialogo.addEventListener('cancel', () => terminar(false));
    dialogo.addEventListener('close', () => terminar(false));
    document.body.append(dialogo);
    dialogo.showModal();
  });
}
