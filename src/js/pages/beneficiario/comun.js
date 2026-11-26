import { oNuloSi404 } from '../../api/client.js';
import { beneficiariosApi } from '../../api/beneficiarios.api.js';
import { html, pintar } from '../../ui/dom.js';

/** Beneficiario vinculado a la cuenta (GET /api/beneficiarios/mio) o null si aún no existe. */
export const obtenerMiBeneficiario = () => oNuloSi404(beneficiariosApi.mio());

/** Mensaje para cuentas que todavía no registran los datos de su familia. */
export function pedirPerfil(elemento) {
  pintar(elemento, html`<div class="tarjeta estado">
    <div class="estado__icono" aria-hidden="true">i</div>
    <p class="estado__titulo">Completa los datos de tu familia</p>
    <p class="estado__texto">Para usar esta sección primero registra los datos de tu familia en «Mi perfil».</p>
    <a class="boton boton--primario" href="/Pages/beneficiario/perfil.html">Ir a Mi perfil</a>
  </div>`);
}
