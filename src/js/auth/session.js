import { USER_ROLES } from './credentials.js';
 
const STORAGE_PREFIX = 'nutricomunidad.';
const SESSION_KEY = `${STORAGE_PREFIX}session`;
 
export const LOGIN_ROUTE = '/login.html';
 
export function saveSession({ role, username }) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, username }));
}
 
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
 
    const session = JSON.parse(raw);
    return Object.values(USER_ROLES).includes(session.role) ? session : null;
  } catch {
    return null;
  }
}
 

export function clearSession() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}
 

export function requireRole(role) {
  const session = getSession();
 
  if (!session || session.role !== role) {
    window.location.replace(LOGIN_ROUTE);
    return null;
  }
 
  return session;
}
 
export function logout() {
  clearSession();
  window.location.assign(LOGIN_ROUTE);
}