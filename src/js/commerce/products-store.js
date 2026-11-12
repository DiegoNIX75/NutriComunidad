import { INITIAL_PRODUCTS, TEST_PRODUCTS } from './products-data.js';

export function createProductsStore(initialProducts = INITIAL_PRODUCTS, testProducts = TEST_PRODUCTS) {
  let products = [...initialProducts];
  const unusedTestProducts = [...testProducts];

  const isInTable = (id) => products.some((product) => product.id === id);

  return {
    getProducts() {
      return [...products];
    },

    addNextTestProduct() {
      const index = unusedTestProducts.findIndex((product) => !isInTable(product.id));
      if (index === -1) return null;

      const [product] = unusedTestProducts.splice(index, 1);
      products = [...products, product];
      return product;
    },

    removeLastProduct() {
      if (products.length === 0) return null;

      const removedProduct = products.at(-1);
      products = products.slice(0, -1);
      return removedProduct;
    },
  };
}
