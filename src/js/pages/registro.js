import { authApi } from '../api/auth.api.js';
import { ROLES } from '../auth/roles.js';
import { mensajeDeError } from '../ui/avisos.js';
import { camposBeneficiario, camposComercio, camposCuenta, camposOrganizacion } from '../ui/campos-entidades.js';
import { alertaEn, leerFormulario, ocupado, validarFormulario } from '../ui/formularios.js';

/**
 * Registro conectado a POST /api/auth/registro. La cuenta y los datos del rol
 * (beneficiario / comercio / organización) se guardan juntos y quedan vinculados.
 */
const formulario = document.querySelector('[data-formulario-registro]');
const contenedorEntidad = document.querySelector('[data-campos-entidad]');
const tituloEntidad = document.querySelector('[data-titulo-entidad]');
const alerta = document.querySelector('[data-alerta]');

const NOMBRE_ROL = { [ROLES.BENEFICIARIO]: 'beneficiario', [ROLES.COMERCIO]: 'comercio', [ROLES.ORGANIZACION]: 'organización' };
const CAMPOS_CUENTA = ['nombreUsuario', 'apUsuario', 'amUsuario', 'telefonoUsuario', 'correoUsuario', 'contrasena', 'confirmacion', 'rol'];

const POR_ROL = {
  [ROLES.BENEFICIARIO]: { titulo: 'Datos de la familia', clave: 'beneficiario', campos: () => camposBeneficiario({}, { sinContacto: true }) },
  [ROLES.COMERCIO]: { titulo: 'Datos del comercio', clave: 'comercio', campos: () => camposComercio({}, { sinContacto: true }) },
  [ROLES.ORGANIZACION]: { titulo: 'Datos de la organización', clave: 'organizacion', campos: () => camposOrganizacion({}, { sinContacto: true }) },
};

document.querySelector('[data-campos-cuenta]').innerHTML = camposCuenta({}, { conContrasena: true });

function rolSeleccionado() {
  return formulario.querySelector('input[name="rol"]:checked').value;
}

function mostrarCamposDelRol() {
  const config = POR_ROL[rolSeleccionado()];
  tituloEntidad.textContent = config.titulo;
  contenedorEntidad.innerHTML = config.campos();
  alertaEn(alerta, '');
}

formulario.querySelectorAll('input[name="rol"]').forEach((radio) => radio.addEventListener('change', mostrarCamposDelRol));
mostrarCamposDelRol();

/** Arma el cuerpo de RegistroRequest; el contacto de la entidad se toma de la cuenta. */
function construirSolicitud(datos) {
  const rol = datos.rol;
  const entidad = Object.fromEntries(Object.entries(datos).filter(([clave]) => !CAMPOS_CUENTA.includes(clave)));
  const nombreCompleto = [datos.nombreUsuario, datos.apUsuario, datos.amUsuario].filter(Boolean).join(' ');

  if (rol === ROLES.BENEFICIARIO) {
    Object.assign(entidad, {
      nombreBeneficiario: datos.nombreUsuario, ap: datos.apUsuario, am: datos.amUsuario,
      telefono: datos.telefonoUsuario, correo: datos.correoUsuario,
    });
  } else if (rol === ROLES.COMERCIO) {
    Object.assign(entidad, { telefonoComercio: datos.telefonoUsuario, correoComercio: datos.correoUsuario });
  } else {
    Object.assign(entidad, {
      telefonoOrganizacion: datos.telefonoUsuario, correoOrganizacion: datos.correoUsuario,
      responsableOrganizacion: entidad.responsableOrganizacion ?? nombreCompleto,
    });
  }

  return {
    nombreUsuario: datos.nombreUsuario,
    apUsuario: datos.apUsuario,
    amUsuario: datos.amUsuario,
    telefonoUsuario: datos.telefonoUsuario,
    correoUsuario: datos.correoUsuario,
    contrasena: datos.contrasena,
    rol,
    [POR_ROL[rol].clave]: entidad,
  };
}

let enviando = false;

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (enviando) return;
  const confirmacion = formulario.elements.confirmacion;
  confirmacion.setCustomValidity(confirmacion.value && confirmacion.value !== formulario.elements.contrasena.value
    ? 'Las contraseñas no coinciden.' : '');
  confirmacion.dataset.mensaje = confirmacion.validity.customError ? 'Las contraseñas no coinciden.' : 'Confirma tu contraseña.';
  if (!validarFormulario(formulario)) return;

  const boton = formulario.querySelector('[type="submit"]');
  enviando = true;
  alertaEn(alerta, '');
  ocupado(boton, true, 'Creando cuenta…');
  try {
    const usuario = await authApi.registrar(construirSolicitud(leerFormulario(formulario)));
    document.querySelector('[data-registro]').hidden = true;
    document.querySelector('[data-texto-exito]').textContent =
      `Registramos tu cuenta de ${NOMBRE_ROL[usuario.nombreRol] ?? usuario.nombreRol} con el correo ${usuario.correoUsuario}. Inicia sesión para entrar a tu panel.`;
    document.querySelector('[data-exito]').hidden = false;
  } catch (error) {
    alertaEn(alerta, mensajeDeError(error));
    ocupado(boton, false);
    enviando = false;
  }
});
