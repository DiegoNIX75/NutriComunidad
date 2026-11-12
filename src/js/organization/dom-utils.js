const HTML_ESCAPES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});
 
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
 
export function bindText(root, name, value) {
  root.querySelectorAll(`[data-bind="${name}"]`).forEach((element) => {
    element.textContent = value;
  });
}
 
export function showFeedback(element, message) {
  element.textContent = message;
  element.hidden = message === '';
}
 
export function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
 