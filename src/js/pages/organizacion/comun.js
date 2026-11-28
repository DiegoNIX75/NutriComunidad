import { oNuloSi404 } from '../../api/client.js';
import { organizacionesApi } from '../../api/organizaciones.api.js';
import { html, pintar } from '../../ui/dom.js';

/** Organización vinculada a la cuenta (GET /api/organizaciones/mio) o null si aún no existe. */
export const obtenerMiOrganizacion = () => oNuloSi404(organizacionesApi.mia());

export function pedirOrganizacion(elemento) {
  pintar(elemento, html`<div class="tarjeta estado">
    <div class="estado__icono" aria-hidden="true">i</div>
    <p class="estado__titulo">Registra primero tu organización</p>
    <p class="estado__texto">Para recibir solicitudes y donaciones registra los datos de tu organización en «Mi organización».</p>
    <a class="boton boton--primario" href="/Pages/organizacion/mi-organizacion.html">Ir a Mi organización</a>
  </div>`);
}
