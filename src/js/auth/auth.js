import { ROLE_ROUTES, TEST_USERS } from './credentials.js';
 
const normalizeIdentifier = (identifier) => identifier.trim().toLowerCase();
 
function findUserByIdentifier(identifier) {
  const normalized = normalizeIdentifier(identifier);
 
  return TEST_USERS.find((user) => user.username === normalized || user.email === normalized);
}
 
export function authenticate({ identifier, password }) {
  const user = findUserByIdentifier(identifier);
 
  if (!user || user.password !== password) return null;
 
  return { role: user.role, username: user.username, redirectTo: ROLE_ROUTES[user.role] };
}
 