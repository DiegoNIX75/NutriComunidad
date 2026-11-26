/** Roles reales del backend (tabla roles / com.nutricomunidad.security.Roles). */
export const ROLES = Object.freeze({
  ADMIN: 'Administrador',
  BENEFICIARIO: 'Beneficiario',
  COMERCIO: 'Comercio',
  ORGANIZACION: 'Organizacion',
});

/** Nombre visible de cada rol (como aparece en el Figma). */
export const ETIQUETAS_ROL = Object.freeze({
  [ROLES.ADMIN]: 'Administrador TI',
  [ROLES.BENEFICIARIO]: 'Familia beneficiaria',
  [ROLES.COMERCIO]: 'Comercio',
  [ROLES.ORGANIZACION]: 'Organización social',
});

/** Página de inicio de cada rol después del login. */
export const INICIO_POR_ROL = Object.freeze({
  [ROLES.ADMIN]: '/Pages/admin/usuarios.html',
  [ROLES.BENEFICIARIO]: '/Pages/beneficiario/menu.html',
  [ROLES.COMERCIO]: '/Pages/comercio/mi-comercio.html',
  [ROLES.ORGANIZACION]: '/Pages/organizacion/mi-organizacion.html',
});

/** Menú lateral de cada rol. */
export const MENU_POR_ROL = Object.freeze({
  [ROLES.ADMIN]: [
    { id: 'usuarios', texto: 'Usuarios generales', href: '/Pages/admin/usuarios.html' },
    { id: 'comercios', texto: 'Comercios', href: '/Pages/admin/comercios.html' },
    { id: 'organizaciones', texto: 'Organizaciones', href: '/Pages/admin/organizaciones.html' },
    { id: 'beneficiarios', texto: 'Beneficiarios', href: '/Pages/admin/beneficiarios.html' },
    { id: 'recetas', texto: 'Recetas', href: '/Pages/admin/recetas.html' },
    { id: 'alimentos', texto: 'Alimentos', href: '/Pages/admin/alimentos.html' },
  ],
  [ROLES.BENEFICIARIO]: [
    { id: 'menu', texto: 'Menú', href: '/Pages/beneficiario/menu.html' },
    { id: 'perfil', texto: 'Mi perfil', href: '/Pages/beneficiario/perfil.html' },
    { id: 'solicitud', texto: 'Enviar solicitud', href: '/Pages/beneficiario/solicitud.html' },
    { id: 'recibidas', texto: 'Donaciones recibidas', href: '/Pages/beneficiario/donaciones-recibidas.html' },
    { id: 'solicitadas', texto: 'Donaciones solicitadas', href: '/Pages/beneficiario/donaciones-solicitadas.html' },
  ],
  [ROLES.COMERCIO]: [
    { id: 'mi-comercio', texto: 'Mi comercio', href: '/Pages/comercio/mi-comercio.html' },
    { id: 'productos', texto: 'Productos a donar', href: '/Pages/comercio/productos.html' },
  ],
  [ROLES.ORGANIZACION]: [
    { id: 'mi-organizacion', texto: 'Mi organización', href: '/Pages/organizacion/mi-organizacion.html' },
    { id: 'solicitudes', texto: 'Solicitudes recibidas', href: '/Pages/organizacion/solicitudes.html' },
    { id: 'donaciones', texto: 'Donaciones recibidas', href: '/Pages/organizacion/donaciones.html' },
  ],
});

export const RUTA_LOGIN = '/login.html';
