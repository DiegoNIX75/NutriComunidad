import { DONATION_LOTS, PRIORITIES, REQUESTS } from './organization-data.js';
import { escapeHtml, showFeedback } from './dom-utils.js';
 
const FILTERS = Object.freeze([
  { id: 'all', label: 'Todas' },
  ...Object.entries(PRIORITIES).map(([id, { label }]) => ({ id, label })),
]);
 
const renderBadge = (priority) =>
  `<span class="badge badge--${priority}">${PRIORITIES[priority].label}</span>`;
 
export function initRequestsSection(root) {
  const filtersElement = root.querySelector('[data-role="request-filters"]');
  const rowsElement = root.querySelector('[data-role="request-rows"]');
  const detailElement = root.querySelector('[data-role="request-detail"]');
  const feedbackElement = root.querySelector('[data-role="request-feedback"]');
 
  let requests = [...REQUESTS];
  let activeFilter = 'all';
  let selectedId = requests[0]?.id ?? null;
 
  const countFor = (filterId) =>
    filterId === 'all' ? requests.length : requests.filter((item) => item.priority === filterId).length;
 
  const getVisible = () =>
    activeFilter === 'all' ? requests : requests.filter((item) => item.priority === activeFilter);
 
  function renderFilters() {
    filtersElement.innerHTML = FILTERS.map(
      ({ id, label }) => `
        <button class="filter-tabs__tab${id === activeFilter ? ' filter-tabs__tab--active' : ''}"
          type="button" data-filter="${id}" aria-pressed="${id === activeFilter}">
          ${label} (${countFor(id)})
        </button>`,
    ).join('');
  }
 
  function renderRows(visible) {
    if (visible.length === 0) {
      rowsElement.innerHTML =
        '<tr><td class="data-table__empty" colspan="5">No hay solicitudes en esta categoría.</td></tr>';
      return;
    }
 
    rowsElement.innerHTML = visible
      .map(
        (item) => `
        <tr class="data-table__row data-table__row--selectable${item.id === selectedId ? ' data-table__row--selected' : ''}"
          data-id="${item.id}" tabindex="0" aria-selected="${item.id === selectedId}">
          <td class="data-table__cell">${escapeHtml(item.date)}</td>
          <td class="data-table__cell">${escapeHtml(item.family)}</td>
          <td class="data-table__cell">${escapeHtml(item.reason)}</td>
          <td class="data-table__cell">${item.members}</td>
          <td class="data-table__cell">${renderBadge(item.priority)}</td>
        </tr>`,
      )
      .join('');
  }
 
  function renderDetail() {
    const item = requests.find((request) => request.id === selectedId);
 
    if (!item) {
      detailElement.innerHTML =
        '<p class="request-detail__empty">No hay solicitudes pendientes por atender.</p>';
      return;
    }
 
    detailElement.innerHTML = `
      <header class="request-detail__header">
        <h3 class="request-detail__title">${escapeHtml(item.family)}</h3>
        ${renderBadge(item.priority)}
      </header>
      <div class="request-detail__pair">
        <div class="form-field">
          <span class="form-field__label">Fecha</span>
          <p class="form-field__input form-field__input--readonly">${escapeHtml(item.date)}</p>
        </div>
        <div class="form-field">
          <span class="form-field__label">Integrantes</span>
          <p class="form-field__input form-field__input--readonly">${item.members}</p>
        </div>
      </div>
      <div class="form-field">
        <span class="form-field__label">Motivo</span>
        <p class="form-field__input form-field__input--readonly">${escapeHtml(item.reason)}</p>
      </div>
      <div class="form-field">
        <span class="form-field__label">Observaciones</span>
        <p class="form-field__input form-field__input--readonly">${escapeHtml(item.notes)}</p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="donation-lot">Asignar donación</label>
        <select class="form-field__input" id="donation-lot">
          ${DONATION_LOTS.map((lot) => `<option>${escapeHtml(lot)}</option>`).join('')}
        </select>
      </div>
      <div class="request-detail__actions">
        <button class="button button--ghost" type="button" data-action="reject">Rechazar</button>
        <button class="button button--primary" type="button" data-action="dispatch">Despachar</button>
      </div>`;
  }
 
  function render() {
    const visible = getVisible();
    if (!visible.some((item) => item.id === selectedId)) selectedId = visible[0]?.id ?? null;
 
    renderFilters();
    renderRows(visible);
    renderDetail();
  }
 
  function selectRow(row) {
    if (!row) return;
    selectedId = Number(row.dataset.id);
    render();
    rowsElement.querySelector(`[data-id="${selectedId}"]`)?.focus();
  }
 
  filtersElement.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-filter]');
    if (!tab) return;
 
    activeFilter = tab.dataset.filter;
    render();
  });
 
  rowsElement.addEventListener('click', (event) => selectRow(event.target.closest('[data-id]')));
  rowsElement.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectRow(event.target.closest('[data-id]'));
  });
 
  detailElement.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    const item = requests.find((request) => request.id === selectedId);
    if (!button || !item) return;
 
    const message =
      button.dataset.action === 'dispatch'
        ? `Solicitud de ${item.family} despachada con ${detailElement.querySelector('#donation-lot').value}.`
        : `Solicitud de ${item.family} rechazada.`;
 
    requests = requests.filter((request) => request.id !== item.id);
    render();
    showFeedback(feedbackElement, message);
  });
 
  render();
}