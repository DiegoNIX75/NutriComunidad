import { oNuloSi404 } from '../../api/client.js';
import { comerciosApi, donacionesApi } from '../../api/comercios.api.js';
import { html, pintar } from '../../ui/dom.js';

/** Comercio vinculado a la cuenta (GET /api/comercios/mio) o null si aún no existe. */
export const obtenerMiComercio = () => oNuloSi404(comerciosApi.mio());

/** Donaciones del comercio con sus detalles (el backend sólo devuelve las que incluyen productos propios). */
export async function donacionesConDetalle() {
  const donaciones = await donacionesApi.listar();
  return Promise.all(donaciones.map((d) => donacionesApi.obtener(d.idDonacion)));
}

export function pedirComercio(elemento) {
  pintar(elemento, html`<div class="tarjeta estado">
    <div class="estado__icono" aria-hidden="true">i</div>
    <p class="estado__titulo">Registra primero tu comercio</p>
    <p class="estado__texto">Para donar productos necesitas registrar los datos de tu establecimiento en «Mi comercio».</p>
    <a class="boton boton--primario" href="/Pages/comercio/mi-comercio.html">Ir a Mi comercio</a>
  </div>`);
}
