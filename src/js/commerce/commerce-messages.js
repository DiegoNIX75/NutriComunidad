export const FEEDBACK_TYPES = Object.freeze({
  SUCCESS: 'success',
  WARNING: 'warning',
});

export const COMMERCE_MESSAGES = Object.freeze({
  productAdded: (name) => `Se agregó «${name}» a los productos a donar.`,
  noTestProducts: 'Ya se agregaron todos los productos de prueba disponibles.',
  donationSent: '¡Donación enviada correctamente!',
  noProductsToDonate: 'No hay productos para donar.',
  emptyTable: 'No hay datos disponibles',
});
