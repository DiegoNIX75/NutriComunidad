import { authApi } from '../../api/auth.api.js';
import { beneficiariosApi, preferenciasApi } from '../../api/beneficiarios.api.js';
import { alimentosApi } from '../../api/catalogo.api.js';
import { ROLES } from '../../auth/roles.js';
import { actualizarUsuario } from '../../auth/session.js';
import { montarPanel } from '../../layout/panel.js';
import { avisar, mensajeDeError } from '../../ui/avisos.js';
import { camposBeneficiario, camposCuenta } from '../../ui/campos-entidades.js';
import { html } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { alertaEn, campo, leerFormulario, ocupado, validarFormulario } from '../../ui/formularios.js';
import { obtenerMiBeneficiario } from './comun.js';

const panel = montarPanel({
  rol: ROLES.BENEFICIARIO,
  pagina: 'perfil',
  titulo: 'Mi perfil',
  descripcion: 'Tus datos personales y tus preferencias para recomendarte recetas.',
});

// Preferencias del diseño (se guardan como registros de PREFERENCIAS con tipo «Dieta»).
const DIETAS = ['Vegetariano', 'Sin gluten', 'Sin lácteos', 'Bajo en azúcar', 'Bajo en sal', 'Alto en proteína'];
const TIPO_DIETA = 'Dieta';
const TIPO_ALERGIA = 'Alergia';
const TIPO_RESTRICCION = 'Restricción';
const CAMPOS_CUENTA = ['nombreUsuario', 'apUsuario', 'amUsuario', 'telefonoUsuario'];

if (panel) {
  const { contenido, sesion } = panel;
  let beneficiario = null;
  let usuario = sesion.usuario;

  async function cargar() {
    mostrarCargando(contenido);
    try {
      const [yo, propio, alimentos] = await Promise.all([authApi.yo(), obtenerMiBeneficiario(), alimentosApi.listar({ estado: 'Activo' })]);
      usuario = yo;
      beneficiario = propio;
      const [preferencias, alergias] = beneficiario
        ? await Promise.all([beneficiariosApi.preferencias(beneficiario.idBeneficiario), beneficiariosApi.alergias(beneficiario.idBeneficiario)])
        : [[], []];
      pintarPagina(alimentos, preferencias, alergias);
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  function pintarPagina(alimentos, preferencias, alergias) {
    const dietasActivas = new Set(preferencias.filter((p) => p.tipoPreferencia === TIPO_DIETA).map((p) => p.descripcionPreferencia));
    const alergiasActivas = new Set(alergias.map((a) => a.idAlimento));
    const restriccion = preferencias.find((p) => p.tipoPreferencia === TIPO_RESTRICCION);

    contenido.innerHTML = `
      <div class="columnas">
        <div>
          <section class="tarjeta seccion" aria-labelledby="titulo-datos">
            <h2 class="tarjeta__titulo" id="titulo-datos">Datos personales</h2>
            ${beneficiario ? '' : '<div class="alerta alerta--info">Tu cuenta aún no tiene los datos de tu familia. Complétalos y guarda para activar tus solicitudes y recomendaciones.</div><br>'}
            <form data-form-datos novalidate>
              <div class="rejilla-form">
                ${camposCuenta(usuario, { conCorreo: false })}
                ${campo('correoCuenta', 'Correo', { tipo: 'email', valor: usuario.correoUsuario, atributos: 'readonly', ayuda: 'Para cambiar tu correo contacta a un administrador.' })}
                ${camposBeneficiario(beneficiario ?? {}, { sinContacto: true })}
              </div>
              <div data-alerta-datos></div>
              <div class="acciones-form"><button type="submit" class="boton boton--primario">Guardar cambios</button></div>
            </form>
          </section>

          <section class="tarjeta" aria-labelledby="titulo-contrasena">
            <h2 class="tarjeta__titulo" id="titulo-contrasena">Contraseña</h2>
            <form data-form-contrasena novalidate>
              <div class="rejilla-form rejilla-form--3">
                ${campo('contrasenaActual', 'Contraseña actual', { tipo: 'password', requerido: true, atributos: 'autocomplete="current-password"' })}
                ${campo('contrasenaNueva', 'Contraseña nueva', { tipo: 'password', requerido: true, atributos: 'minlength="8" maxlength="72" autocomplete="new-password" data-mensaje="Entre 8 y 72 caracteres."' })}
                ${campo('confirmacion', 'Confirmar contraseña', { tipo: 'password', requerido: true, atributos: 'autocomplete="new-password"' })}
              </div>
              <div data-alerta-contrasena></div>
              <div class="acciones-form"><button type="submit" class="boton boton--contorno">Cambiar contraseña</button></div>
            </form>
          </section>
        </div>

        <section class="tarjeta" aria-labelledby="titulo-preferencias">
          <h2 class="tarjeta__titulo" id="titulo-preferencias">Preferencias y alergias</h2>
          <p class="tarjeta__descripcion">Las usamos para «Recetas según tus preferencias» y para evitar alimentos que no puedes consumir.</p>
          <fieldset class="sin-marco" ${beneficiario ? "" : "disabled"}>
            <p class="campo__etiqueta">Preferencias alimentarias</p><br>
            <div class="chips" data-dietas>${DIETAS.map((d) => html`<button type="button" class="chip chip--seleccion" data-dieta="${d}" aria-pressed="${dietasActivas.has(d)}">${d}</button>`.__html).join('')}</div>
            <br><p class="campo__etiqueta">Alergias</p>
            <p class="campo__ayuda">Elige los alimentos del catálogo que no puedes consumir.</p><br>
            <div class="chips" data-alergias>${alimentos.length
              ? alimentos.map((a) => html`<button type="button" class="chip chip--seleccion" data-alimento="${a.idAlimento}" aria-pressed="${alergiasActivas.has(a.idAlimento)}">${a.nombreAlimento}</button>`.__html).join('')
              : '<span class="campo__ayuda">Aún no hay alimentos en el catálogo.</span>'}</div>
            <br>${campo('restriccion', 'Otras alergias o restricciones', { valor: restriccion?.descripcionPreferencia ?? '', atributos: 'maxlength="255"', placeholder: 'Ej. Intolerancia a la fresa' })}
            <div data-alerta-preferencias></div><br>
            <button type="button" class="boton boton--contorno boton--bloque" data-guardar-preferencias>Guardar preferencias</button>
          </fieldset>
          ${beneficiario ? '' : '<p class="campo__ayuda">Guarda primero tus datos personales para registrar preferencias.</p>'}
        </section>
      </div>`;

    contenido.querySelectorAll('.chip--seleccion').forEach((chip) => chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
    }));
    contenido.querySelector('[data-form-datos]').addEventListener('submit', guardarDatos);
    contenido.querySelector('[data-form-contrasena]').addEventListener('submit', cambiarContrasena);
    contenido.querySelector('[data-guardar-preferencias]').addEventListener('click', () => guardarPreferencias(preferencias, alergias));
  }

  async function guardarDatos(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!validarFormulario(formulario)) return;
    const boton = formulario.querySelector('[type="submit"]');
    const alerta = formulario.querySelector('[data-alerta-datos]');
    const datos = leerFormulario(formulario);
    const cuenta = Object.fromEntries(CAMPOS_CUENTA.map((c) => [c, datos[c]]));
    const familia = Object.fromEntries(Object.entries(datos).filter(([c]) => !CAMPOS_CUENTA.includes(c) && c !== 'correoCuenta'));
    Object.assign(familia, {
      nombreBeneficiario: cuenta.nombreUsuario, ap: cuenta.apUsuario, am: cuenta.amUsuario,
      telefono: cuenta.telefonoUsuario, correo: usuario.correoUsuario,
    });
    alertaEn(alerta, '');
    ocupado(boton, true);
    try {
      usuario = await authApi.actualizarPerfil(cuenta);
      actualizarUsuario(usuario);
      beneficiario = beneficiario ? await beneficiariosApi.actualizarMio(familia) : await beneficiariosApi.crear(familia);
      avisar('Datos guardados', 'exito');
      cargar();
    } catch (error) {
      alertaEn(alerta, mensajeDeError(error));
      ocupado(boton, false);
    }
  }

  async function cambiarContrasena(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const confirmacion = formulario.elements.confirmacion;
    confirmacion.setCustomValidity(confirmacion.value !== formulario.elements.contrasenaNueva.value ? 'Las contraseñas no coinciden.' : '');
    if (!validarFormulario(formulario)) return;
    const boton = formulario.querySelector('[type="submit"]');
    const alerta = formulario.querySelector('[data-alerta-contrasena]');
    const { contrasenaActual, contrasenaNueva } = leerFormulario(formulario);
    alertaEn(alerta, '');
    ocupado(boton, true);
    try {
      await authApi.cambiarContrasena(contrasenaActual, contrasenaNueva);
      formulario.reset();
      alertaEn(alerta, 'Contraseña actualizada correctamente.', 'exito');
    } catch (error) {
      alertaEn(alerta, mensajeDeError(error));
    } finally {
      ocupado(boton, false);
    }
  }

  /** Sincroniza los chips con los registros de PREFERENCIAS y ALERGIAS (crea y elimina lo necesario). */
  async function guardarPreferencias(preferencias, alergias) {
    const id = beneficiario.idBeneficiario;
    const boton = contenido.querySelector('[data-guardar-preferencias]');
    const alerta = contenido.querySelector('[data-alerta-preferencias]');
    const dietas = new Set([...contenido.querySelectorAll('[data-dieta][aria-pressed="true"]')].map((c) => c.dataset.dieta));
    const alimentos = new Set([...contenido.querySelectorAll('[data-alimento][aria-pressed="true"]')].map((c) => Number(c.dataset.alimento)));
    const textoRestriccion = contenido.querySelector('input[name="restriccion"]').value.trim();
    const nueva = (tipo, descripcion) => preferenciasApi.crear({ tipoPreferencia: tipo, descripcionPreferencia: descripcion, idBeneficiario: id });

    alertaEn(alerta, '');
    ocupado(boton, true);
    try {
      const actuales = preferencias.filter((p) => p.tipoPreferencia === TIPO_DIETA);
      await Promise.all([
        ...actuales.filter((p) => !dietas.has(p.descripcionPreferencia)).map((p) => preferenciasApi.eliminar(p.idPreferencias)),
        ...[...dietas].filter((d) => !actuales.some((p) => p.descripcionPreferencia === d)).map((d) => nueva(TIPO_DIETA, d)),
      ]);

      const restriccion = preferencias.find((p) => p.tipoPreferencia === TIPO_RESTRICCION);
      if (textoRestriccion && restriccion) {
        await preferenciasApi.actualizar(restriccion.idPreferencias, { tipoPreferencia: TIPO_RESTRICCION, descripcionPreferencia: textoRestriccion, idBeneficiario: id });
      } else if (textoRestriccion) {
        await nueva(TIPO_RESTRICCION, textoRestriccion);
      } else if (restriccion) {
        await preferenciasApi.eliminar(restriccion.idPreferencias);
      }

      // Cada alergia se asocia a una preferencia de tipo «Alergia» del mismo beneficiario.
      let contenedor = preferencias.find((p) => p.tipoPreferencia === TIPO_ALERGIA);
      if (!contenedor && alimentos.size) contenedor = await nueva(TIPO_ALERGIA, 'Alergias alimentarias');
      await Promise.all([
        ...alergias.filter((a) => !alimentos.has(a.idAlimento)).map((a) => beneficiariosApi.eliminarAlergia(id, a.idPreferencias, a.idAlimento)),
        ...[...alimentos].filter((idA) => !alergias.some((a) => a.idAlimento === idA))
          .map((idA) => beneficiariosApi.agregarAlergia(id, contenedor.idPreferencias, idA)),
      ]);
      avisar('Preferencias guardadas', 'exito');
      cargar();
    } catch (error) {
      alertaEn(alerta, mensajeDeError(error));
      ocupado(boton, false);
    }
  }

  cargar();
}
