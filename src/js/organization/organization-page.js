import { USER_ROLES } from '../auth/credentials.js';
import { logout, requireRole } from '../auth/session.js';
import { initDonationsSection } from './organization-donations.js';
import { initNavigation } from './organization-navigation.js';
import { initProfileSection, renderIdentity } from './organization-profile.js';
import { initRequestsSection } from './organization-requests.js';
import { loadProfile } from './organization-store.js';
 
function initOrganizationPage(session) {
  const shell = document.querySelector('.app__shell');
  const profile = loadProfile();
 
  renderIdentity(shell, profile);
  initNavigation(shell);
  initProfileSection(shell, profile, session.username);
  initRequestsSection(shell);
  initDonationsSection(shell);
 
  document.getElementById('logout-button').addEventListener('click', logout);
  shell.querySelectorAll('[data-action="print"]').forEach((button) => {
    button.addEventListener('click', () => window.print());
  });
 
  shell.hidden = false;
}
 
const session = requireRole(USER_ROLES.ORGANIZATION);
if (session) initOrganizationPage(session);
 

window.addEventListener('pageshow', (event) => {
  if (event.persisted) requireRole(USER_ROLES.ORGANIZATION);
});