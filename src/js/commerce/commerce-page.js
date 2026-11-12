import { initProductActions } from './products-actions.js';
import { createProductsStore } from './products-store.js';
import { initSectionNavigation } from './section-navigation.js';

initProductActions(document.getElementById('products'), createProductsStore());
initSectionNavigation(document.body);
