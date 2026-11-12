const ACTIVE_ITEM_CLASS = 'menu-item--active';
const OPEN_MENU_CLASS = 'commerce-menu--open';

function setMenuOpen(menu, toggle, isOpen) {
  menu.classList.toggle(OPEN_MENU_CLASS, isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
}

function showSection({ items, sections, sectionTitle }, sectionId) {
  sections.forEach((section) => {
    section.hidden = section.id !== sectionId;
  });

  items.forEach((item) => {
    const isActive = item.dataset.section === sectionId;
    item.classList.toggle(ACTIVE_ITEM_CLASS, isActive);
    item.toggleAttribute('aria-current', isActive);
    if (isActive) sectionTitle.textContent = item.textContent.trim();
  });
}

export function initSectionNavigation(root) {
  const menu = root.querySelector('.commerce-menu');
  const toggle = root.querySelector('.section-bar__toggle');
  const elements = {
    items: [...menu.querySelectorAll('.menu-item')],
    sections: [...root.querySelectorAll('.commerce-section')],
    sectionTitle: root.querySelector('.section-bar__title'),
  };

  elements.items.forEach((item) => {
    item.addEventListener('click', () => {
      showSection(elements, item.dataset.section);
      setMenuOpen(menu, toggle, false);
    });
  });

  toggle.addEventListener('click', () => {
    setMenuOpen(menu, toggle, !menu.classList.contains(OPEN_MENU_CLASS));
  });

  const activeItem = elements.items.find((item) => item.classList.contains(ACTIVE_ITEM_CLASS));
  showSection(elements, activeItem.dataset.section);
}
