/**
 * Sesión en localStorage. El backend usa JWT (HMAC256): el token incluye sub (id de usuario),
 * nombre, rol y exp. Aquí sólo se lee su contenido para la navegación; quien valida la firma y
 * los permisos de cada petición es el backend.
 */
const CLAVE_TOKEN = 'nutricomunidad.token';
const CLAVE_USUARIO = 'nutricomunidad.usuario';

function decodificarCarga(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function actualizarUsuario(usuario) {
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

/** Devuelve { token, usuario, rol, expira } o null si no hay sesión válida (o ya expiró). */
export function obtenerSesion() {
  const token = obtenerToken();
  if (!token) return null;

  const carga = decodificarCarga(token);
  if (!carga?.exp || carga.exp * 1000 <= Date.now()) {
    cerrarSesionLocal();
    return null;
  }

  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO));
  } catch {
    usuario = null;
  }
  return { token, usuario, rol: carga.rol, idUsuario: Number(carga.sub), expira: new Date(carga.exp * 1000) };
}

export function cerrarSesionLocal() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}
