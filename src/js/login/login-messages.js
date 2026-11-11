import { LOGIN_ERRORS } from './login-validation.js';

export const FORM_MESSAGES = Object.freeze({
  [LOGIN_ERRORS.EMPTY_FIELDS]: 'Completa los campos de usuario o correo y contraseña para continuar.',
  [LOGIN_ERRORS.INVALID_CREDENTIALS]: 'Usuario, correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
});

export const FIELD_MESSAGES = Object.freeze({
  [LOGIN_ERRORS.EMPTY_IDENTIFIER]: 'El usuario o correo es obligatorio.',
  [LOGIN_ERRORS.EMPTY_PASSWORD]: 'La contraseña es obligatoria.',
});
