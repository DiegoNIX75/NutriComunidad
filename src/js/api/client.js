import { irAlLogin } from '../auth/guard.js';
import { cerrarSesionLocal, obtenerToken } from '../auth/session.js';
import { API_URL } from '../config.js';

/** Error HTTP con el mensaje que devuelve el backend ({"mensaje": "..."}). */
export class ApiError extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;
  }
}

const MENSAJES_POR_ESTADO = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No se encontró la información solicitada.',
  409: 'La operación entra en conflicto con datos existentes.',
  500: 'Ocurrió un error en el servidor. Intenta más tarde.',
  503: 'El servicio no está disponible en este momento. Intenta más tarde.',
};

function construirUrl(ruta, parametros) {
  const url = new URL(`${API_URL}${ruta}`);
  Object.entries(parametros ?? {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
  });
  return url;
}

async function leerCuerpo(respuesta) {
  if (respuesta.status === 204) return null;
  const tipo = respuesta.headers.get('Content-Type') ?? '';
  if (tipo.includes('application/json')) return respuesta.json();
  const texto = await respuesta.text();
  return texto || null;
}

/**
 * Petición central a la API. Agrega el JWT (si existe), serializa JSON, maneja 204 y convierte
 * los errores en ApiError con un mensaje comprensible. Un 401 en una petición autenticada
 * cierra la sesión y redirige al login.
 */
export async function solicitar(ruta, { metodo = 'GET', cuerpo, parametros, autenticado = true } = {}) {
  if (!API_URL) throw new ApiError(0, 'La aplicación no tiene configurada la URL del backend (VITE_API_URL).');

  const encabezados = { Accept: 'application/json' };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  const token = autenticado ? obtenerToken() : null;
  if (token) encabezados.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(construirUrl(ruta, parametros), {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No fue posible conectar con el servidor. Revisa tu conexión o que el backend esté en línea.');
  }

  const datos = await leerCuerpo(respuesta).catch(() => null);
  if (respuesta.ok) return datos;

  const mensaje = (datos && typeof datos === 'object' && datos.mensaje) || MENSAJES_POR_ESTADO[respuesta.status]
    || `Error inesperado (${respuesta.status}).`;

  if (respuesta.status === 401 && token) {
    cerrarSesionLocal();
    irAlLogin('expirada');
  }
  throw new ApiError(respuesta.status, mensaje);
}

export const api = {
  get: (ruta, parametros) => solicitar(ruta, { parametros }),
  post: (ruta, cuerpo) => solicitar(ruta, { metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo) => solicitar(ruta, { metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo) => solicitar(ruta, { metodo: 'PATCH', cuerpo }),
  delete: (ruta) => solicitar(ruta, { metodo: 'DELETE' }),
};

/** Devuelve null cuando el recurso no existe (404) en lugar de lanzar el error. */
export async function oNuloSi404(promesa) {
  try {
    return await promesa;
  } catch (error) {
    if (error instanceof ApiError && error.estado === 404) return null;
    throw error;
  }
}
