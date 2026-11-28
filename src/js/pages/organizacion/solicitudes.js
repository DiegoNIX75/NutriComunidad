import { beneficiariosApi } from '../../api/beneficiarios.api.js';
import { donacionesApi } from '../../api/comercios.api.js';
import { inventariosApi } from '../../api/organizaciones.api.js';
import { entregasApi, solicitudesApi } from '../../api/solicitudes.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel, mostrarNombreEnEncabezado } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { listaConDetalle } from '../../ui/detalle.js';
import { esc, html, pintar, seguro } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo, leerFormulario, validarFormulario } from '../../ui/formularios.js';
import { claseInsignia, fecha, hoyISO, nombreCompleto, numero } from '../../ui/formato.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';
import { obtenerMiOrganizacion, pedirOrganizacion } from './comun.js';

const panel = montarPanel({
  rol: ROLES.ORGANIZACION,
  pagina: 'solicitudes',
  titulo: 'Solicitudes recibidas',
  descripcion: 'Procesa y despacha las solicitudes de las familias según su prioridad.',
});

const PRIORIDADES = ['Todas', 'Alta', 'Media', 'Baja'];
const CERRADAS = ['rechazada', 'entregada'];

if (panel) {
  const { contenido, acciones } = panel;
  let organizacion = null;
  let solicitudes = [];
  let familias = new Map();
  let inventarios = [];
  let prioridad = 'Todas';
  let seleccionada = null;
  let vista;

  agregarAccion(acciones, 'Imprimir datos', 'boton--texto', () => window.print());

  async function cargar() {
    mostrarCargando(contenido);
    try {
      organizacion = await obtenerMiOrganizacion();
      if (!organizacion) {
        acciones.innerHTML = '';
        pedirOrganizacion(contenido);
        return;
      }
      mostrarNombreEnEncabezado(organizacion.nombreOrganizacion);
      const [lista, beneficiarios, inv] = await Promise.all([solicitudesApi.listar(), beneficiariosApi.listar(), inventariosApi.listar()]);
      solicitudes = lista.sort((a, b) => String(b.fechaSolicitud).localeCompare(String(a.fechaSolicitud)));
      familias = new Map(beneficiarios.map((b) => [b.idBeneficiario, nombreCompleto(b.nombreBeneficiario, b.ap, b.am)]));
      const donaciones = new Map((await Promise.all(inv.map((i) => donacionesApi.obtener(i.idDonacion)))).map((d) => [d.idDonacion, d]));
      inventarios = inv.map((i) => ({ ...i, donacion: donaciones.get(i.idDonacion) }));
      vista = listaConDetalle(contenido, '<div class="chips" role="group" aria-label="Filtrar por prioridad" data-chips></div>');
      pintarLista();
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  function pintarLista() {
    const contar = (p) => solicitudes.filter((s) => p === 'Todas' || String(s.prioridad).toLowerCase() === p.toLowerCase()).length;
    const chips = contenido.querySelector('[data-chips]');
    chips.innerHTML = PRIORIDADES.map((p) => html`<button type="button" class="chip" data-prioridad="${p}" aria-pressed="${p === prioridad}">${p} (${contar(p)})</button>`.__html).join('');
    chips.querySelectorAll('[data-prioridad]').forEach((chip) => chip.addEventListener('click', () => {
      prioridad = chip.dataset.prioridad;
      pintarLista();
    }));
    pintarTabla(vista.lista, {
      filas: solicitudes.filter((s) => prioridad === 'Todas' || String(s.prioridad).toLowerCase() === prioridad.toLowerCase()),
      idFila: (s) => s.idSolicitud,
      seleccionada: seleccionada?.idSolicitud,
      alSeleccionar: mostrarDetalle,
      vacio: { titulo: 'No hay solicitudes', texto: 'Las solicitudes que las familias envíen a tu organización aparecerán aquí.' },
      columnas: [
        { titulo: 'Fecha', valor: (s) => fecha(s.fechaSolicitud) },
        { titulo: 'Familia', valor: (s) => familias.get(s.idBeneficiario) ?? `#${s.idBeneficiario}` },
        { titulo: 'Motivo', valor: (s) => s.motivo },
        { titulo: 'Integrantes', valor: (s) => s.numeroIntegrantes, clase: 'num' },
        { titulo: 'Prioridad', valor: (s) => insignia(s.prioridad, claseInsignia(s.prioridad)) },
        { titulo: 'Estado', valor: (s) => insignia(s.estadoSolicitud ?? 'Sin estado', claseInsignia(s.estadoSolicitud)) },
      ],
    });
  }

  async function mostrarDetalle(solicitud) {
    seleccionada = solicitud;
    const { detalle } = vista;
    mostrarCargando(detalle);
    try {
      const entregas = await solicitudesApi.entregas(solicitud.idSolicitud);
      const cerrada = CERRADAS.includes(String(solicitud.estadoSolicitud).toLowerCase());
      const opcionesInventario = [['', 'Sin asignar'], ...inventarios.map((i) => [i.idInventario,
        `Inventario #${i.idInventario} · ${[...new Set(i.donacion?.detalles.map((d) => d.nombreComercio) ?? [])].join(', ') || 'Donación'} · disp. ${numero(i.cantidadDisponible)}`])];

      pintar(detalle, html`
        <div class="detalle__encabezado">
          <h2 class="detalle__titulo">${familias.get(solicitud.idBeneficiario) ?? 'Familia'}</h2>
          ${insignia(solicitud.prioridad, claseInsignia(solicitud.prioridad))}
        </div>
        <div class="rejilla-form">
          ${seguro(campo('f', 'Fecha', { valor: fecha(solicitud.fechaSolicitud), atributos: 'readonly' }))}
          ${seguro(campo('i', 'Integrantes', { valor: solicitud.numeroIntegrantes ?? '—', atributos: 'readonly' }))}
          ${seguro(campo('m', 'Motivo', { valor: solicitud.motivo, atributos: 'readonly', completo: true }))}
        </div>
        <br><p class="campo__etiqueta">Estado: ${insignia(solicitud.estadoSolicitud ?? 'Sin estado', claseInsignia(solicitud.estadoSolicitud))}</p>
        ${entregas.length ? seguro(`<br><h3 class="seccion__titulo">Entregas registradas</h3><br><ul class="movimientos">${entregas.map((e) => `<li><span>${esc(fecha(e.fechaEntrega))} · ${esc(e.responsable)}<br><small>${esc(e.observaciones ?? '')}</small></span>
            <span>${esc(e.estado ?? '')} ${String(e.estado).toLowerCase() !== 'entregada' ? `<button type="button" class="boton boton--texto boton--chico no-imprimir" data-entregada="${e.idEntrega}">Marcar entregada</button>` : ''}</span></li>`).join('')}</ul>`) : ''}
        ${cerrada ? html`<p class="detalle__nota">Esta solicitud ya está cerrada.</p>` : html`
          <form class="no-imprimir" data-despacho novalidate><br>
            <div class="rejilla-form">
              ${seguro(campo('idInventario', 'Asignar donación', { tipo: 'select', opciones: opcionesInventario, completo: true, ayuda: 'Se registra en las observaciones de la entrega.' }))}
              ${seguro(campo('responsable', 'Responsable de la entrega', { requerido: true, valor: organizacion.responsableOrganizacion ?? '', atributos: 'maxlength="150"', completo: true }))}
              ${seguro(campo('fechaEntrega', 'Fecha de entrega', { tipo: 'date', requerido: true, valor: hoyISO(), completo: true }))}
            </div>
            <div class="detalle__acciones">
              <button type="button" class="boton boton--texto" data-rechazar>Rechazar</button>
              <button type="submit" class="boton boton--primario">Despachar</button>
            </div>
          </form>`}`);

      detalle.querySelector('[data-rechazar]')?.addEventListener('click', () => rechazar(solicitud));
      detalle.querySelector('[data-despacho]')?.addEventListener('submit', (e) => despachar(e, solicitud));
      detalle.querySelectorAll('[data-entregada]').forEach((b) => b.addEventListener('click', () => marcarEntregada(solicitud, b.dataset.entregada)));
    } catch (error) {
      mostrarError(detalle, error, () => mostrarDetalle(solicitud));
    }
  }

  async function actualizarSolicitud(solicitud, estado) {
    const actualizada = await solicitudesApi.cambiarEstado(solicitud.idSolicitud, estado);
    solicitudes = solicitudes.map((s) => (s.idSolicitud === actualizada.idSolicitud ? actualizada : s));
    pintarLista();
    mostrarDetalle(actualizada);
  }

  async function rechazar(solicitud) {
    const ok = await confirmar({ titulo: 'Rechazar solicitud', mensaje: 'La familia verá la solicitud como «Rechazada».', textoConfirmar: 'Rechazar', peligro: true });
    if (!ok) return;
    try {
      await actualizarSolicitud(solicitud, 'Rechazada');
      avisar('Solicitud rechazada', 'exito');
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  async function despachar(evento, solicitud) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!validarFormulario(formulario)) return;
    const { idInventario, responsable, fechaEntrega } = leerFormulario(formulario);
    const inventario = inventarios.find((i) => String(i.idInventario) === String(idInventario));
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    try {
      await entregasApi.crear({
        fechaEntrega,
        responsable,
        estado: 'Programada',
        observaciones: inventario ? `Asignada desde el inventario #${inventario.idInventario}` : null,
        idSolicitud: solicitud.idSolicitud,
      });
      await actualizarSolicitud(solicitud, 'Aprobada');
      avisar('Solicitud despachada: se programó la entrega', 'exito');
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
      boton.disabled = false;
    }
  }

  async function marcarEntregada(solicitud, idEntrega) {
    try {
      await entregasApi.cambiarEstado(idEntrega, 'Entregada');
      await actualizarSolicitud(solicitud, 'Entregada');
      avisar('Entrega registrada como entregada', 'exito');
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  cargar();
}
