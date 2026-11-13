export const ORGANIZATION_PROFILE = Object.freeze({
  name: 'Banco de Alimentos Norte',
  type: 'Banco de alimentos',
  responsible: 'Laura Méndez',
  phone: '55 4455 6677',
  email: 'laura.mendez@banconorte.org',
  state: 'Ciudad de México',
});
 
export const ORGANIZATION_STATS = Object.freeze({
  memberSince: 'Julio 2026',
  familiesServed: 128,
  requestsThisMonth: 6,
  linkedCommerces: 6,
});
 
export const ORGANIZATION_TYPES = Object.freeze([
  'Banco de alimentos',
  'Comedor comunitario',
  'Casa hogar',
  'Asociación civil',
]);
 
export const STATES = Object.freeze([
  'Ciudad de México',
  'Estado de México',
  'Jalisco',
  'Nuevo León',
  'Puebla',
]);
 
export const PRIORITIES = Object.freeze({
  high: { label: 'Alta' },
  medium: { label: 'Media' },
  low: { label: 'Baja' },
});
 
export const REQUESTS = Object.freeze([
  { id: 1, date: '09/11/2026', family: 'Familia López', reason: 'Despensa básica', members: 4, priority: 'high', notes: 'Sin lácteos. Entregar por la tarde.' },
  { id: 2, date: '09/11/2026', family: 'Familia Ruiz', reason: 'Leche para bebé', members: 3, priority: 'high', notes: 'Sin observaciones.' },
  { id: 3, date: '08/11/2026', family: 'Familia Gómez', reason: 'Verduras y frutas', members: 5, priority: 'medium', notes: 'Sin observaciones.' },
  { id: 4, date: '08/11/2026', family: 'Familia Pérez', reason: 'Granos y cereales', members: 6, priority: 'medium', notes: 'Sin observaciones.' },
  { id: 5, date: '07/11/2026', family: 'Familia Díaz', reason: 'Despensa básica', members: 2, priority: 'medium', notes: 'Sin observaciones.' },
  { id: 6, date: '06/11/2026', family: 'Familia Soto', reason: 'Pan y lácteos', members: 3, priority: 'low', notes: 'Sin observaciones.' },
]);
 
export const DONATION_LOTS = Object.freeze([
  'Lote 24 · Frutería La Huerta',
  'Lote 23 · Panadería San José',
  'Lote 22 · Súper Ahorro',
]);
 
export const DONATION_METRICS = Object.freeze([
  { label: 'Donaciones este mes', value: '18', hint: 'De 6 comercios vinculados' },
  { label: 'Cantidad recibida', value: '312 kg', hint: 'Alimentos recuperados' },
  { label: 'Entregado a familias', value: '264 kg', hint: '85 % de lo recibido' },
]);
 
export const DONATION_STATUSES = Object.freeze({
  stored: { label: 'En almacén' },
  expiring: { label: 'Por vencer' },
  delivered: { label: 'Entregado' },
});
 
export const DONATIONS = Object.freeze([
  { date: '09/11/2026', commerce: 'Frutería La Huerta', food: 'Manzana', quantity: 20, unit: 'kg', status: 'stored' },
  { date: '08/11/2026', commerce: 'Panadería San José', food: 'Pan de caja', quantity: 12, unit: 'pieza', status: 'expiring' },
  { date: '08/11/2026', commerce: 'Súper Ahorro', food: 'Frijol negro', quantity: 40, unit: 'kg', status: 'delivered' },
  { date: '07/11/2026', commerce: 'Carnes El Rancho', food: 'Pollo', quantity: 15, unit: 'kg', status: 'delivered' },
  { date: '06/11/2026', commerce: 'Verduras Doña Lupe', food: 'Zanahoria', quantity: 25, unit: 'kg', status: 'delivered' },
]);
 