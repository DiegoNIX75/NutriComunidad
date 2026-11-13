import { PRODUCT_STATUSES } from './products-data.js';

const TOTAL_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'quantity'];

const roundToOneDecimal = (value) => Math.round(value * 10) / 10;

export function calculateTotals(products) {
  return Object.fromEntries(
    TOTAL_FIELDS.map((field) => [
      field,
      roundToOneDecimal(products.reduce((sum, product) => sum + product[field], 0)),
    ]),
  );
}

export function countExpiring(products) {
  return products.filter((product) => product.status === PRODUCT_STATUSES.EXPIRING).length;
}
