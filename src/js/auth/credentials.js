export const USER_ROLES = Object.freeze({
  COMMERCE: 'commerce',
  ORGANIZATION: 'organization',
  BENEFICIARY: 'beneficiary',
});

export const ROLE_ROUTES = Object.freeze({
  [USER_ROLES.COMMERCE]: '/pages/commerce.html',
  [USER_ROLES.ORGANIZATION]: '/pages/organization.html',
  [USER_ROLES.BENEFICIARY]: '/pages/beneficiary.html',
});

export const TEST_USERS = Object.freeze([
  {
    username: 'comercio',
    email: 'comercio@nutricomunidad.test',
    password: 'comercio123',
    role: USER_ROLES.COMMERCE,
  },
  {
    username: 'organizacion',
    email: 'organizacion@nutricomunidad.test',
    password: 'org123',
    role: USER_ROLES.ORGANIZATION,
  },
  {
    username: 'beneficiario',
    email: 'beneficiario@nutricomunidad.test',
    password: 'bene123',
    role: USER_ROLES.BENEFICIARY,
  },
]);
