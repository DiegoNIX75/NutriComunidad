import { esc } from './dom.js';

/**
 * Lee un formulario como objeto: textos recortados (vacío -> null) y campos con
 * data-tipo="numero" convertidos a número.
 */
export function leerFormulario(formulario) {
  const datos = {};
  for (const control of formulario.elements) {
    if (!control.name || control.disabled || ['button', 'submit'].includes(control.type)) continue;
    if (control.type === 'radio' && !control.checked) continue;
    let valor = control.type === 'checkbox' ? control.checked : control.value.trim();
    if (valor === '') valor = null;
    if (valor !== null && control.dataset.tipo === 'numero') valor = Number(valor);
    datos[control.name] = valor;
  }
  return datos;
}

export function llenarFormulario(formulario, datos) {
  for (const control of formulario.elements) {
    if (!control.name || !(control.name in datos)) continue;
    if (control.type === 'radio') control.checked = String(datos[control.name]) === control.value;
    else control.value = datos[control.name] ?? '';
  }
}

/** Valida con las reglas HTML (required, pattern, min…) y muestra el mensaje bajo cada campo. */
export function validarFormulario(formulario) {
  let primerInvalido = null;
  for (const control of formulario.elements) {
    if (!control.willValidate || !control.name) continue;
    const contenedor = control.closest('.campo');
    contenedor?.querySelector('.campo__error')?.remove();
    control.removeAttribute('aria-invalid');
    if (!control.checkValidity()) {
      control.setAttribute('aria-invalid', 'true');
      const mensaje = control.dataset.mensaje || control.validationMessage;
      contenedor?.insertAdjacentHTML('beforeend', `<span class="campo__error">${esc(mensaje)}</span>`);
      primerInvalido ??= control;
    }
  }
  primerInvalido?.focus();
  return !primerInvalido;
}

/** Deshabilita un botón mientras se procesa una petición (evita envíos duplicados). */
export function ocupado(boton, estaOcupado, textoOcupado = 'Guardando…') {
  if (!boton) return;
  if (estaOcupado) {
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = textoOcupado;
    boton.disabled = true;
    boton.setAttribute('aria-busy', 'true');
  } else {
    boton.textContent = boton.dataset.textoOriginal ?? boton.textContent;
    boton.disabled = false;
    boton.removeAttribute('aria-busy');
  }
}

/** Muestra (o limpia, con mensaje vacío) una alerta dentro de un contenedor. */
export function alertaEn(contenedor, mensaje, tipo = 'error') {
  if (!contenedor) return;
  contenedor.innerHTML = mensaje ? `<div class="alerta alerta--${tipo}" role="alert">${esc(mensaje)}</div>` : '';
}

let contador = 0;

/**
 * Campo de formulario estándar (etiqueta + control).
 * opciones: { tipo, requerido, ayuda, atributos, completo, valor, placeholder, opciones: [[valor, texto]] }
 */
export function campo(nombre, etiqueta, opciones = {}) {
  const { tipo = 'text', requerido = false, ayuda, atributos = '', completo = false, valor = '', placeholder = '' } = opciones;
  const id = `c-${nombre}-${(contador += 1)}`;
  const req = requerido ? 'required' : '';
  const opcional = requerido || tipo === 'search' || atributos.includes('readonly') ? '' : ' <span class="campo__opcional">(opcional)</span>';
  let control;
  if (tipo === 'textarea') {
    control = `<textarea class="area-texto" id="${id}" name="${nombre}" ${req} ${atributos} placeholder="${esc(placeholder)}">${esc(valor)}</textarea>`;
  } else if (tipo === 'select') {
    const items = (opciones.opciones ?? [])
      .map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(valor) ? 'selected' : ''}>${esc(t)}</option>`)
      .join('');
    control = `<select class="selector" id="${id}" name="${nombre}" ${req} ${atributos}>${items}</select>`;
  } else {
    control = `<input class="entrada" id="${id}" name="${nombre}" type="${tipo}" value="${esc(valor)}" placeholder="${esc(placeholder)}" ${req} ${atributos}>`;
  }
  return `<div class="campo${completo ? ' completo' : ''}"><label class="campo__etiqueta" for="${id}">${esc(etiqueta)}${opcional}</label>${control}${ayuda ? `<span class="campo__ayuda">${esc(ayuda)}</span>` : ''}</div>`;
}
