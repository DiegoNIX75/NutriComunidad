import { authenticate } from '../auth/auth.js';
import { saveSession } from '../auth/session.js';
import { INVALID_CREDENTIALS_ERROR, validateLoginFields } from './login-validation.js';
import { FIELD_MESSAGES, FORM_MESSAGES } from './login-messages.js';
 
function setFieldState(input, { invalid = false, message = '' } = {}) {
  const errorElement = document.getElementById(input.getAttribute('aria-describedby'));
 
  input.closest('.field').classList.toggle('field--invalid', invalid);
  input.setAttribute('aria-invalid', String(invalid));
  errorElement.textContent = message;
  errorElement.hidden = message === '';
}
 
function setFormAlert(alertElement, message = '') {
  alertElement.textContent = message;
  alertElement.hidden = message === '';
}
 
function readCredentials(inputs) {
  return {
    identifier: inputs.identifier.value,
    password: inputs.password.value,
  };
}
 
function showError(error, inputs, alertElement) {
  const fieldMessage = FIELD_MESSAGES[error.code];
 
  error.fields.forEach((name) => setFieldState(inputs[name], { invalid: true, message: fieldMessage }));
  setFormAlert(alertElement, FORM_MESSAGES[error.code]);
  inputs[error.fields[0]].focus();
}
 
function resetErrors(inputs, alertElement) {
  Object.values(inputs).forEach((input) => setFieldState(input));
  setFormAlert(alertElement);
}
 
export function initLoginForm(form) {
  const inputs = {
    identifier: form.elements.identifier,
    password: form.elements.password,
  };
  const alertElement = form.querySelector('.login__alert');
 
  Object.values(inputs).forEach((input) => {
    input.addEventListener('input', () => {
      setFieldState(input);
      setFormAlert(alertElement);
    });
  });
 
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    resetErrors(inputs, alertElement);
 
    const credentials = readCredentials(inputs);
    const validationError = validateLoginFields(credentials);
    if (validationError) {
      showError(validationError, inputs, alertElement);
      return;
    }
 
    const session = authenticate(credentials);
    if (!session) {
      showError(INVALID_CREDENTIALS_ERROR, inputs, alertElement);
      return;
    }
 
    saveSession(session);
    window.location.assign(session.redirectTo);
  });
}
 