export const LOGIN_ERRORS = Object.freeze({
  EMPTY_FIELDS: 'EMPTY_FIELDS',
  EMPTY_IDENTIFIER: 'EMPTY_IDENTIFIER',
  EMPTY_PASSWORD: 'EMPTY_PASSWORD',
});

const isBlank = (value) => value.trim() === '';

export function validateLoginFields({ identifier, password }) {
  const isIdentifierBlank = isBlank(identifier);
  const isPasswordBlank = isBlank(password);

  if (isIdentifierBlank && isPasswordBlank) {
    return { code: LOGIN_ERRORS.EMPTY_FIELDS, fields: ['identifier', 'password'] };
  }

  if (isIdentifierBlank) {
    return { code: LOGIN_ERRORS.EMPTY_IDENTIFIER, fields: ['identifier'] };
  }

  if (isPasswordBlank) {
    return { code: LOGIN_ERRORS.EMPTY_PASSWORD, fields: ['password'] };
  }

  return null;
}
