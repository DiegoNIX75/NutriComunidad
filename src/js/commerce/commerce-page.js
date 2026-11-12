import { PRODUCTS } from './products-data.js';
import { renderProducts } from './products-view.js';
import { initSectionNavigation } from './section-navigation.js';

renderProducts(document.getElementById('products'), PRODUCTS);
initSectionNavigation(document.body);
