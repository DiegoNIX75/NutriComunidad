import { COMMERCE_MESSAGES } from './commerce-messages.js';
import { PRODUCT_STATUSES, QUANTITY_UNIT } from './products-data.js';
import { calculateTotals, countExpiring } from './products-summary.js';

const STATUS_BADGES = Object.freeze({
  [PRODUCT_STATUSES.AVAILABLE]: { label: 'Disponible', modifier: 'success' },
  [PRODUCT_STATUSES.EXPIRING]: { label: 'Por vencer', modifier: 'warning' },
  [PRODUCT_STATUSES.PENDING]: { label: 'Pendiente', modifier: 'pending' },
});

const NUTRITION_LABELS = Object.freeze({
  calories: 'Calorías',
  protein: 'Proteínas (g)',
  carbs: 'Carbohidr. (g)',
  fat: 'Grasas (g)',
  quantity: 'Cantidad',
});

const DETAIL_SEPARATOR = '  ·  ';

function renderBadge(status) {
  const { label, modifier } = STATUS_BADGES[status];
  return `<span class="badge badge--${modifier}">${label}</span>`;
}

function renderCell(content, modifier = '') {
  const modifierClass = modifier ? ` products-table__cell--${modifier}` : '';
  return `<td class="products-table__cell${modifierClass}">${content}</td>`;
}

function renderTableRow(product) {
  return `<tr>
    ${renderCell(product.name)}
    ${renderCell(product.description, 'optional')}
    ${renderCell(product.unit, 'optional')}
    ${renderCell(product.calories)}
    ${renderCell(product.protein)}
    ${renderCell(product.carbs)}
    ${renderCell(product.fat, 'optional')}
    ${renderCell(renderBadge(product.status), 'badge')}
    ${renderCell(product.quantity)}
  </tr>`;
}

function renderTotalCell(content, modifier = '') {
  const modifierClass = modifier ? ` products-table__total--${modifier}` : '';
  return `<td class="products-table__total${modifierClass}">${content}</td>`;
}

function renderTableTotal(totals) {
  return `<tr>
    ${renderTotalCell('Total')}
    ${renderTotalCell('', 'optional')}
    ${renderTotalCell('', 'optional')}
    ${renderTotalCell(totals.calories)}
    ${renderTotalCell(totals.protein)}
    ${renderTotalCell(totals.carbs)}
    ${renderTotalCell(totals.fat, 'optional')}
    ${renderTotalCell('')}
    ${renderTotalCell(totals.quantity)}
  </tr>`;
}

function formatDetails(entries) {
  return entries.map(([label, value]) => `${label}: ${value}`).join(DETAIL_SEPARATOR);
}

function renderProductCard(product) {
  const details = formatDetails([
    ['Descripción', product.description],
    ['Unidad', product.unit],
    ...Object.entries(NUTRITION_LABELS).map(([field, label]) => [label, product[field]]),
  ]);

  return `<li class="product-card">
    <div class="product-card__header">
      <p class="product-card__name">${product.name}</p>
      ${renderBadge(product.status)}
    </div>
    <p class="product-card__details">${details}</p>
  </li>`;
}

function renderTotalCard(totals) {
  const details = formatDetails(
    Object.entries(NUTRITION_LABELS).map(([field, label]) => [label, totals[field]]),
  );

  return `<li class="product-card product-card--total">
    <div class="product-card__header">
      <p class="product-card__name">Total</p>
    </div>
    <p class="product-card__details">${details}</p>
  </li>`;
}

function renderMetrics(root, products, totals) {
  const metrics = {
    'products-count': products.length,
    'total-quantity': `${totals.quantity} ${QUANTITY_UNIT}`,
    'expiring-count': countExpiring(products),
  };

  Object.entries(metrics).forEach(([name, value]) => {
    root.querySelector(`[data-metric="${name}"]`).textContent = value;
  });
}

function renderEmptyRow(columnCount) {
  return `<tr>
    <td class="products-table__empty" colspan="${columnCount}">${COMMERCE_MESSAGES.emptyTable}</td>
  </tr>`;
}

function renderEmptyCard() {
  return `<li class="product-cards__empty">${COMMERCE_MESSAGES.emptyTable}</li>`;
}

function renderTable(root, products, totals) {
  const columnCount = root.querySelectorAll('.products-table__heading').length;
  const hasProducts = products.length > 0;

  root.querySelector('[data-products-rows]').innerHTML = hasProducts
    ? products.map(renderTableRow).join('')
    : renderEmptyRow(columnCount);
  root.querySelector('[data-products-total]').innerHTML = hasProducts ? renderTableTotal(totals) : '';
}

function renderCards(root, products, totals) {
  root.querySelector('[data-product-cards]').innerHTML =
    products.length > 0
      ? [...products.map(renderProductCard), renderTotalCard(totals)].join('')
      : renderEmptyCard();
}

export function renderProducts(root, products) {
  const totals = calculateTotals(products);

  renderTable(root, products, totals);
  renderCards(root, products, totals);
  renderMetrics(root, products, totals);
}
