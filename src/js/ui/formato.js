/** "2026-11-09" -> "09/11/2026" (sin desfases de zona horaria). */
export function fecha(iso) {
  if (!iso) return '—';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return d && m && a ? `${d}/${m}/${a}` : String(iso);
}

/** Fecha local de hoy en formato ISO (AAAA-MM-DD). */
export function hoyISO() {
  const hoy = new Date();
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function numero(valor, decimales = 2) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return Number(valor).toLocaleString('es-MX', { maximumFractionDigits: decimales });
}

export function moneda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

export function iniciales(texto) {
  return String(texto ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';
}

export const nombreCompleto = (...partes) => partes.filter(Boolean).join(' ');

/** Suma una propiedad numérica de una lista. */
export const sumar = (lista, prop) => lista.reduce((acc, x) => acc + Number(x[prop] ?? 0), 0);

/** Clase de insignia según la prioridad o el estado (textos libres del backend). */
export function claseInsignia(texto) {
  const t = String(texto ?? '').toLowerCase();
  if (t === 'alta') return 'insignia--alta';
  if (t === 'media') return 'insignia--media';
  if (['activo', 'aprobada', 'entregada', 'disponible', 'recibida', 'clasificada'].includes(t)) return 'insignia--verde';
  if (['pendiente', 'programada', 'en revisión', 'en revision', 'enviada'].includes(t)) return 'insignia--aviso';
  if (['inactivo', 'rechazada', 'agotado', 'cancelada'].includes(t)) return 'insignia--error';
  return '';
}
