const DEFAULT_SECTION = 'profile';
const ACTIVE_ITEM_CLASS = 'side-menu__item--active';
 
export function initNavigation(root) {
  const items = [...root.querySelectorAll('.side-menu__item')];
  const sections = [...root.querySelectorAll('.org-section')];
  const sectionIds = items.map((item) => item.dataset.section);
 
  function showSection(requestedId) {
    const sectionId = sectionIds.includes(requestedId) ? requestedId : DEFAULT_SECTION;
 
    sections.forEach((section) => {
      section.hidden = section.dataset.section !== sectionId;
    });
 
    items.forEach((item) => {
      const isActive = item.dataset.section === sectionId;
      item.classList.toggle(ACTIVE_ITEM_CLASS, isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'page');
        document.title = `${item.textContent.trim()} — NutriComunidad`;
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }
 
  window.addEventListener('hashchange', () => showSection(window.location.hash.slice(1)));
  showSection(window.location.hash.slice(1));
}
 