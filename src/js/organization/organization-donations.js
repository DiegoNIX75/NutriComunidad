import { DONATION_METRICS, DONATION_STATUSES, DONATIONS } from './organization-data.js';
import { escapeHtml } from './dom-utils.js';

export function initDonationsSection(root) {
  const metricsElement = root.querySelector('[data-role="donation-metrics"]');
  const rowsElement = root.querySelector('[data-role="donation-rows"]');
  const tableCard = root.querySelector('[data-role="donation-table"]');
  const showListButton = root.querySelector('[data-action="show-list"]');

  metricsElement.innerHTML = DONATION_METRICS.map(
    ({ label, value, hint }) => `
      <article class="metric-card">
        <p class="metric-card__label">${escapeHtml(label)}</p>
        <p class="metric-card__value">${escapeHtml(value)}</p>
        <p class="metric-card__hint">${escapeHtml(hint)}</p>
      </article>`,
  ).join('');

  rowsElement.innerHTML = DONATIONS.map(
    (item) => `
      <tr class="data-table__row">
        <td class="data-table__cell">${escapeHtml(item.date)}</td>
        <td class="data-table__cell">${escapeHtml(item.commerce)}</td>
        <td class="data-table__cell">${escapeHtml(item.food)}</td>
        <td class="data-table__cell">${item.quantity}</td>
        <td class="data-table__cell">${escapeHtml(item.unit)}</td>
        <td class="data-table__cell">
          <span class="badge badge--${item.status}">${DONATION_STATUSES[item.status].label}</span>
        </td>
      </tr>`,
  ).join('');

  showListButton.addEventListener('click', () => {
    tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    tableCard.focus({ preventScroll: true });
  });
}