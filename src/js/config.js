/**
 * Configuración global. La URL del backend sale de la variable de entorno VITE_API_URL
 * (.env.local en desarrollo, variables del proyecto en Vercel).
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

if (!API_URL) {
  console.error('Falta VITE_API_URL: define la URL del backend en .env.local o en las variables de entorno de Vercel.');
}
