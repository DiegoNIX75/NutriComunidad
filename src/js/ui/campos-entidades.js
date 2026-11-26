import { campo } from './formularios.js';

/** Reglas iguales a las del backend (Validaciones.java). */
// Escapado para el modo «v» que usan los navegadores en el atributo pattern.
export const PATRON_TELEFONO = '^[0-9+\\(\\)\\-\\s]{7,20}$';
export const PATRON_CP = '^\\d{5}$';
const telefono = `pattern="${PATRON_TELEFONO}" maxlength="20" data-mensaje="Entre 7 y 20 dígitos o símbolos (+, -, paréntesis)."`;
const cp = `pattern="${PATRON_CP}" inputmode="numeric" maxlength="5" data-mensaje="El código postal debe tener 5 dígitos."`;
const correo = 'maxlength="150" data-mensaje="Escribe un correo válido."';

export const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México',
  'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán',
  'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];
const opcionesEstado = [['', 'Selecciona el estado'], ...ESTADOS_MX.map((e) => [e, e])];

/** Sugerencias para campos de texto libre (el backend acepta cualquier valor). */
export const TIPOS_COMERCIO = ['Abarrotes', 'Supermercado', 'Frutería', 'Panadería', 'Mercado', 'Restaurante', 'Productor local'];
export const TIPOS_ORGANIZACION = ['Asociación civil', 'Banco de alimentos', 'Comedor comunitario', 'Fundación', 'Organización religiosa'];

export const datalist = (id, opciones) => `<datalist id="${id}">${opciones.map((o) => `<option value="${o}"></option>`).join('')}</datalist>`;

/** Campos de domicilio comunes (sufijo según la entidad: '', 'Comercio', 'Organizacion'). */
function domicilio(sufijo, estadoNombre, datos) {
  const n = (base) => (sufijo ? `${base}${sufijo}` : base);
  return [
    campo(n('calle'), 'Calle', { valor: datos[n('calle')], atributos: 'maxlength="150"', placeholder: 'Ej. Av. Juárez' }),
    campo(n('numeroExterior'), 'Número exterior', { valor: datos[n('numeroExterior')], atributos: 'maxlength="20"' }),
    campo(n('numeroInterior'), 'Número interior', { valor: datos[n('numeroInterior')], atributos: 'maxlength="20"' }),
    campo(n('colonia'), 'Colonia', { valor: datos[n('colonia')], atributos: 'maxlength="100"', placeholder: 'Ej. Centro' }),
    campo(n('codigoPostal'), 'Código postal', { valor: datos[n('codigoPostal')], atributos: cp }),
    campo(n('municipio'), 'Municipio', { valor: datos[n('municipio')], atributos: 'maxlength="100"' }),
    campo(estadoNombre, 'Estado', { tipo: 'select', opciones: opcionesEstado, valor: datos[estadoNombre] }),
  ].join('');
}

/** Campos del beneficiario (BeneficiarioRequest). sinContacto omite nombre/apellidos/teléfono/correo. */
export function camposBeneficiario(datos = {}, { sinContacto = false } = {}) {
  const contacto = sinContacto ? '' : [
    campo('nombreBeneficiario', 'Nombre', { requerido: true, valor: datos.nombreBeneficiario, atributos: 'maxlength="100"' }),
    campo('ap', 'Apellido paterno', { requerido: true, valor: datos.ap, atributos: 'maxlength="100"' }),
    campo('am', 'Apellido materno', { valor: datos.am, atributos: 'maxlength="100"' }),
    campo('telefono', 'Teléfono', { tipo: 'tel', valor: datos.telefono, atributos: telefono }),
    campo('correo', 'Correo', { tipo: 'email', valor: datos.correo, atributos: correo, completo: true }),
  ].join('');
  return contacto + campo('numeroIntegrantes', 'Integrantes de la familia', {
    tipo: 'number', requerido: true, valor: datos.numeroIntegrantes, placeholder: 'Ej. 4',
    atributos: 'min="1" max="99" data-tipo="numero" data-mensaje="Indica cuántas personas integran la familia (mínimo 1)."',
  }) + domicilio('', 'estadoBeneficiario', datos);
}

/** Campos del comercio (ComercioRequest). */
export function camposComercio(datos = {}, { sinContacto = false } = {}) {
  return [
    campo('nombreComercio', 'Nombre comercial', { requerido: true, valor: datos.nombreComercio, atributos: 'maxlength="150"', placeholder: 'Ej. Frutería La Huerta' }),
    campo('razonSocial', 'Razón social', { valor: datos.razonSocial, atributos: 'maxlength="200"', placeholder: 'Ej. La Huerta S.A. de C.V.' }),
    campo('tipoComercio', 'Tipo de comercio', { valor: datos.tipoComercio, atributos: 'maxlength="100" list="tipos-comercio"', placeholder: 'Escribe o elige el tipo' }),
    sinContacto ? '' : campo('telefonoComercio', 'Teléfono', { tipo: 'tel', valor: datos.telefonoComercio, atributos: telefono }),
    sinContacto ? '' : campo('correoComercio', 'Correo', { tipo: 'email', valor: datos.correoComercio, atributos: correo }),
    domicilio('Comercio', 'estadoComercio', datos),
    datalist('tipos-comercio', TIPOS_COMERCIO),
  ].join('');
}

/** Campos de la organización (OrganizacionRequest). */
export function camposOrganizacion(datos = {}, { sinContacto = false } = {}) {
  return [
    campo('nombreOrganizacion', 'Nombre de la organización', { requerido: true, valor: datos.nombreOrganizacion, atributos: 'maxlength="150"', placeholder: 'Ej. Banco de Alimentos Norte' }),
    campo('tipoOrganizacion', 'Tipo de organización', { valor: datos.tipoOrganizacion, atributos: 'maxlength="100" list="tipos-organizacion"', placeholder: 'Escribe o elige el tipo' }),
    campo('responsableOrganizacion', 'Responsable', { valor: datos.responsableOrganizacion, atributos: 'maxlength="150"', placeholder: 'Nombre completo' }),
    sinContacto ? '' : campo('telefonoOrganizacion', 'Teléfono', { tipo: 'tel', valor: datos.telefonoOrganizacion, atributos: telefono }),
    sinContacto ? '' : campo('correoOrganizacion', 'Correo', { tipo: 'email', valor: datos.correoOrganizacion, atributos: correo }),
    domicilio('Organizacion', 'estadoOrganizacion', datos),
    datalist('tipos-organizacion', TIPOS_ORGANIZACION),
  ].join('');
}

/** Campos de la cuenta de usuario (registro / perfil). */
export function camposCuenta(datos = {}, { conCorreo = true, conContrasena = false } = {}) {
  return [
    campo('nombreUsuario', 'Nombre', { requerido: true, valor: datos.nombreUsuario, atributos: 'maxlength="100" autocomplete="given-name"', placeholder: 'Ej. María' }),
    campo('apUsuario', 'Apellido paterno', { requerido: true, valor: datos.apUsuario, atributos: 'maxlength="100" autocomplete="family-name"', placeholder: 'Ej. López' }),
    campo('amUsuario', 'Apellido materno', { valor: datos.amUsuario, atributos: 'maxlength="100"', placeholder: 'Ej. Pérez' }),
    campo('telefonoUsuario', 'Teléfono', { tipo: 'tel', valor: datos.telefonoUsuario, atributos: `${telefono} autocomplete="tel"`, placeholder: '55 0000 0000' }),
    conCorreo ? campo('correoUsuario', 'Correo', { tipo: 'email', requerido: true, valor: datos.correoUsuario, atributos: `${correo} autocomplete="email"`, placeholder: 'correo@ejemplo.com', completo: !conContrasena }) : '',
    conContrasena ? campo('contrasena', 'Contraseña', { tipo: 'password', requerido: true, atributos: 'minlength="8" maxlength="72" autocomplete="new-password" data-mensaje="La contraseña debe tener entre 8 y 72 caracteres."', ayuda: 'Entre 8 y 72 caracteres.' }) : '',
    conContrasena ? campo('confirmacion', 'Confirmar contraseña', { tipo: 'password', requerido: true, atributos: 'autocomplete="new-password" data-mensaje="Confirma tu contraseña."' }) : '',
  ].join('');
}
