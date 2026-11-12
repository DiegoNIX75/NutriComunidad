import { ORGANIZATION_PROFILE } from './organization-data.js';
 
const PROFILE_KEY = 'nutricomunidad.organization-profile';
 
export function loadProfile() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PROFILE_KEY) ?? '{}');
    return { ...ORGANIZATION_PROFILE, ...saved };
  } catch {
    return { ...ORGANIZATION_PROFILE };
  }
}
 
export function saveProfile(profile) {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
 