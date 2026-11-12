import { createFeedback } from './commerce-feedback.js';
import { COMMERCE_MESSAGES, FEEDBACK_TYPES } from './commerce-messages.js';
import { renderProducts } from './products-view.js';

function addProduct(store) {
  const product = store.addNextTestProduct();

  return product
    ? { message: COMMERCE_MESSAGES.productAdded(product.name), type: FEEDBACK_TYPES.SUCCESS }
    : { message: COMMERCE_MESSAGES.noTestProducts, type: FEEDBACK_TYPES.WARNING };
}

function sendDonation(store) {
  const donatedProduct = store.removeLastProduct();

  return donatedProduct
    ? { message: COMMERCE_MESSAGES.donationSent, type: FEEDBACK_TYPES.SUCCESS }
    : { message: COMMERCE_MESSAGES.noProductsToDonate, type: FEEDBACK_TYPES.WARNING };
}

const ACTIONS = Object.freeze({
  'add-product': addProduct,
  'send-donation': sendDonation,
});

export function initProductActions(root, store) {
  const feedback = createFeedback(root.querySelector('.commerce-feedback'));

  renderProducts(root, store.getProducts());

  root.querySelectorAll('[data-action]').forEach((button) => {
    const action = ACTIONS[button.dataset.action];

    button.addEventListener('click', () => {
      const { message, type } = action(store);
      renderProducts(root, store.getProducts());
      feedback.show(message, type);
    });
  });
}
