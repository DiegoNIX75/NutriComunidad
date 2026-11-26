import { authApi } from '../../api/auth.api.js';
import { donacionesApi } from '../../api/comercios.api.js';
import { inventariosApi, organizacionesApi } from '../../api/organizaciones.api.js';
import { solicitudesApi } from '../../api/solicitudes.api.js';
import { ROLES } from '../../auth/roles.js';
import { montarPanel, mostrarNombreEnEncabezado } from '../../layout/panel.js';
import { avisar, mensajeDeError } from '../../ui/avisos.js';
import { camposOrganizacion } from '../../ui/campos-entidades.js';
import { html, pintar } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { alertaEn, leerFormulario, ocupado, validarFormulario } from '../../ui/formularios.js';
import { hoyISO, iniciales, nombreCompleto } from '../../ui/formato.js';
import { obtenerMiOrganizacion } from './comun.js';

const panel = montarPanel({
  rol: ROLES.ORGANIZACION,
  pagina: 'mi-organizacion',
  titulo: 'Mi organización',
  descripcion: 'Datos de la organización y de la persona responsable.',
});

const miembroDesde = (iso) => (iso
  ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
  : '—');

if (panel) {
  const { contenido } = panel;

  async function estadisticas() {
    const [solicitudes, inventarios] = await Promise.all([solicitudesApi.listar(), inventariosApi.listar()]);
    const mes = hoyISO().slice(0, 7);
    const donaciones = await Promise.all([...new Set(inventarios.map((i) => i.idDonacion))].map((id) => donacionesApi.obtener(id)));
    return {
      familias: new Set(solicitudes.map((s) => s.idBeneficiario)).size,
      esteMes: solicitudes.filter((s) => String(s.fechaSolicitud).startsWith(mes)).length,
      comercios: new Set(donaciones.flatMap((d) => d.detalles.map((x) => x.idComercio))).size,
    };
  }

  async function cargar() {
    mostrarCargando(contenido);
    try {
      const [usuario, org] = await Promise.all([authApi.yo(), obtenerMiOrganizacion()]);
      const stats = org ? await estadisticas() : null;
      if (org) mostrarNombreEnEncabezado(org.nombreOrganizacion);

      pintar(contenido, html`
        ${org ? html`
          <div class="ficha">
            <span class="avatar" aria-hidden="true">${iniciales(org.nombreOrganizacion)}</span>
            <div><h2 class="ficha__nombre">${org.nombreOrganizacion}</h2>
              <p class="detalle__subtitulo">Miembro desde ${miembroDesde(usuario.fechaRegistro)}</p></div>
          </div>
          <div class="estadisticas seccion">
            <div class="estadistica"><p class="estadistica__etiqueta">Familias atendidas</p><p class="estadistica__valor">${stats.familias}</p>
              <p class="estadistica__nota">Familias distintas que te han enviado solicitudes</p></div>
            <div class="estadistica"><p class="estadistica__etiqueta">Solicitudes este mes</p><p class="estadistica__valor">${stats.esteMes}</p></div>
            <div class="estadistica"><p class="estadistica__etiqueta">Comercios vinculados</p><p class="estadistica__valor">${stats.comercios}</p>
              <p class="estadistica__nota">Comercios de las donaciones en tu inventario</p></div>
          </div>` : html`<div class="alerta alerta--info seccion">Tu cuenta aún no tiene una organización registrada. Completa los datos para recibir solicitudes.</div>`}
        <form class="tarjeta" data-form novalidate>
          <h2 class="tarjeta__titulo">Datos de la organización</h2>
          <div class="rejilla-form" data-campos></div>
          <div data-alerta></div>
          <div class="acciones-form"><button type="submit" class="boton boton--primario">${org ? 'Guardar cambios' : 'Registrar organización'}</button></div>
        </form>`);

      const formulario = contenido.querySelector('[data-form]');
      formulario.querySelector('[data-campos]').innerHTML = camposOrganizacion(org ?? {
        correoOrganizacion: usuario.correoUsuario,
        telefonoOrganizacion: usuario.telefonoUsuario,
        responsableOrganizacion: nombreCompleto(usuario.nombreUsuario, usuario.apUsuario, usuario.amUsuario),
      });
      formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!validarFormulario(formulario)) return;
        const boton = formulario.querySelector('[type="submit"]');
        alertaEn(formulario.querySelector('[data-alerta]'), '');
        ocupado(boton, true);
        try {
          const datos = leerFormulario(formulario);
          if (org) await organizacionesApi.actualizarMia(datos);
          else await organizacionesApi.crear(datos);
          avisar(org ? 'Datos actualizados' : 'Organización registrada', 'exito');
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
