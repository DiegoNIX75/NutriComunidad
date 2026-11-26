import { authApi } from '../../api/auth.api.js';
import { comerciosApi } from '../../api/comercios.api.js';
import { ROLES } from '../../auth/roles.js';
import { montarPanel, mostrarNombreEnEncabezado } from '../../layout/panel.js';
import { avisar, mensajeDeError } from '../../ui/avisos.js';
import { camposComercio } from '../../ui/campos-entidades.js';
import { html, pintar } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { alertaEn, leerFormulario, ocupado, validarFormulario } from '../../ui/formularios.js';
import { iniciales, numero } from '../../ui/formato.js';
import { donacionesConDetalle, obtenerMiComercio } from './comun.js';

const panel = montarPanel({
  rol: ROLES.COMERCIO,
  pagina: 'mi-comercio',
  titulo: 'Mi comercio',
  descripcion: 'Información general de tu establecimiento.',
});

const miembroDesde = (iso) => (iso
  ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
  : '—');

if (panel) {
  const { contenido } = panel;

  async function cargar() {
    mostrarCargando(contenido);
    try {
      const [usuario, comercio] = await Promise.all([authApi.yo(), obtenerMiComercio()]);
      const donaciones = comercio ? await donacionesConDetalle() : [];
      const propios = donaciones.flatMap((d) => d.detalles).filter((d) => d.idComercio === comercio?.idComercio);
      if (comercio) mostrarNombreEnEncabezado(comercio.nombreComercio);

      pintar(contenido, html`
        ${comercio ? html`
          <div class="ficha">
            <span class="avatar" aria-hidden="true">${iniciales(comercio.nombreComercio)}</span>
            <div><h2 class="ficha__nombre">${comercio.nombreComercio}</h2>
              <p class="detalle__subtitulo">Miembro desde ${miembroDesde(usuario.fechaRegistro)}</p></div>
          </div>
          <div class="estadisticas seccion">
            <div class="estadistica"><p class="estadistica__etiqueta">Donaciones realizadas</p><p class="estadistica__valor">${donaciones.length}</p></div>
            <div class="estadistica"><p class="estadistica__etiqueta">Cantidad donada</p><p class="estadistica__valor">${numero(propios.reduce((a, d) => a + Number(d.cantidadDetalleDonacion), 0))}</p>
              <p class="estadistica__nota">Suma de las cantidades de tus productos donados</p></div>
            <div class="estadistica"><p class="estadistica__etiqueta">Alimentos distintos</p><p class="estadistica__valor">${new Set(propios.map((d) => d.idAlimento)).size}</p></div>
          </div>` : html`<div class="alerta alerta--info seccion">Tu cuenta aún no tiene un comercio registrado. Completa los datos para empezar a donar.</div>`}
        <form class="tarjeta" data-form novalidate>
          <h2 class="tarjeta__titulo">Datos del establecimiento</h2>
          <div class="rejilla-form" data-campos></div>
          <div data-alerta></div>
          <div class="acciones-form"><button type="submit" class="boton boton--primario">${comercio ? 'Guardar cambios' : 'Registrar comercio'}</button></div>
        </form>`);

      const formulario = contenido.querySelector('[data-form]');
      formulario.querySelector('[data-campos]').innerHTML = camposComercio(comercio ?? { correoComercio: usuario.correoUsuario, telefonoComercio: usuario.telefonoUsuario });
      formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!validarFormulario(formulario)) return;
        const boton = formulario.querySelector('[type="submit"]');
        alertaEn(formulario.querySelector('[data-alerta]'), '');
        ocupado(boton, true);
        try {
          const datos = leerFormulario(formulario);
          if (comercio) await comerciosApi.actualizarMio(datos);
          else await comerciosApi.crear(datos);
          avisar(comercio ? 'Datos actualizados' : 'Comercio registrado', 'exito');
          cargar();
        } catch (error) {
          alertaEn(formulario.querySelector('[data-alerta]'), mensajeDeError(error));
          ocupado(boton, false);
        }
      });
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  cargar();
}
