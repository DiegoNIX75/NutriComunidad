import { ORGANIZATION_STATS, ORGANIZATION_TYPES, STATES } from './organization-data.js';
import { saveProfile } from './organization-store.js';
import { bindText, getInitials, showFeedback } from './dom-utils.js';
 
function fillSelect(select, options, selected) {
  select.replaceChildren(
    ...options.map((option) => {
      const element = new Option(option, option);
      element.selected = option === selected;
      return element;
    }),
  );
}
 
export function renderIdentity(root, profile) {
  bindText(root, 'org-name', profile.name);
  bindText(root, 'org-initials', getInitials(profile.name));
}
 
export function initProfileSection(root, profile, username) {
  const form = root.querySelector('#profile-form');
  const feedback = root.querySelector('[data-role="profile-feedback"]');
 
  fillSelect(form.elements.type, ORGANIZATION_TYPES, profile.type);
  fillSelect(form.elements.state, STATES, profile.state);
  ['name', 'responsible', 'phone', 'email'].forEach((field) => {
    form.elements[field].value = profile[field];
  });
  form.elements.username.value = username;
 
  bindText(root, 'stat-member-since', ORGANIZATION_STATS.memberSince);
  bindText(root, 'stat-families', ORGANIZATION_STATS.familiesServed);
  bindText(root, 'stat-requests', ORGANIZATION_STATS.requestsThisMonth);
  bindText(root, 'stat-commerces', ORGANIZATION_STATS.linkedCommerces);
 
  form.addEventListener('input', () => showFeedback(feedback, ''));
 
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
 
    const updated = Object.fromEntries(
      ['name', 'type', 'responsible', 'phone', 'email', 'state'].map((field) => [
        field,
        form.elements[field].value.trim(),
      ]),
    );
 
    saveProfile(updated);
    renderIdentity(root, updated);
    form.elements.password.value = '';
    showFeedback(feedback, 'Cambios guardados correctamente.');
  });
}