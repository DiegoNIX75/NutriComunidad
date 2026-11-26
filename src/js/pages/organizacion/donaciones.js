import { donacionesApi } from '../../api/comercios.api.js';
import { inventariosApi, lotesApi } from '../../api/organizaciones.api.js';
import { ROLES } from '../../auth/roles.js';
import { montarPanel, mostrarNombreEnEncabezado } from '../../layout/panel.js';
import { avisar, mensajeDeError } from '../../ui/avisos.js';
import { datos } from '../../ui/detalle.js';
import { esc, html, pintar, seguro } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { claseInsignia, fecha, hoyISO, numero } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';
import { obtenerMiOrganizacion, pedirOrganizacion } from './comun.js';

const panel = montarPanel({
  rol: ROLES.ORGANIZACION,
  pagina: 'donaciones',
  titulo: 'Donaciones recibidas',
  descripcion: 'Suministros entregados por los comercios y su registro en tu inventario.',
});

const comerciosDe = (donacion) => [...new Set(donacion?.detalles.map((d) => d.nombreComercio) ?? [])].join(', ') || '—';
const decimal = (min) => `step="0.01" min="${min}" data-tipo="numero"`;

if (panel) {
  const { contenido } = panel;
  let organizacion = null;
  let inventarios = [];
  let donaciones = new Map();

  async function cargar() {
    mostrarCargando(contenido);
    try {
      organizacion = await obtenerMiOrganizacion();
      if (!organizacion) {
        pedirOrganizacion(contenido);
        return;
      }
      mostrarNombreEnEncabezado(organizacion.nombreOrganizacion);
      const [inv, todas] = await Promise.all([inventariosApi.listar(), donacionesApi.listar()]);
      inventarios = inv;
      donaciones = new Map((await Promise.all(todas.map((d) => donacionesApi.obtener(d.idDonacion)))).map((d) => [d.idDonacion, d]));
      pintarPagina();
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  function pintarPagina() {
    const registradas = new Set(inventarios.map((i) => i.idDonacion));
    contenido.innerHTML = `
      <section class="seccion" aria-labelledby="titulo-inventario">
        <h2 class="seccion__titulo" id="titulo-inventario">Mi inventario</h2>
        <div class="lista-detalle"><div data-inventario></div>
          <aside class="tarjeta detalle" data-detalle><p class="estado__texto">Selecciona un inventario para ver sus productos y lotes.</p></aside></div>
      </section>
      <section class="seccion" aria-labelledby="titulo-disponibles">
        <h2 class="seccion__titulo" id="titulo-disponibles">Donaciones de comercios</h2>
        <p class="detalle__nota">Registra en tu inventario las donaciones que recibiste físicamente.</p>
        <div data-disponibles></div>
      </section>`;

    pintarTabla(contenido.querySelector('[data-inventario]'), {
      filas: inventarios,
      idFila: (i) => i.idInventario,
      alSeleccionar: mostrarInventario,
      vacio: { titulo: 'Tu inventario está vacío', texto: 'Registra una donación desde la tabla inferior.' },
      columnas: [
        { titulo: 'Donación', valor: (i) => fecha(donaciones.get(i.idDonacion)?.fechaDonacion) },
        { titulo: 'Comercio', valor: (i) => comerciosDe(donaciones.get(i.idDonacion)) },
        { titulo: 'Disponible', valor: (i) => numero(i.cantidadDisponible), clase: 'num' },
        { titulo: 'Estado', valor: (i) => insignia(i.estadoInventario ?? 'Sin estado', claseInsignia(i.estadoInventario)) },
        { titulo: 'Actualizado', valor: (i) => fecha(i.fechaActualizacion) },
      ],
    });

    pintarTabla(contenido.querySelector('[data-disponibles]'), {
      filas: [...donaciones.values()].sort((a, b) => String(b.fechaDonacion).localeCompare(String(a.fechaDonacion))),
      vacio: { titulo: 'No hay donaciones registradas por comercios' },
      columnas: [
        { titulo: 'Fecha', valor: (d) => fecha(d.fechaDonacion) },
        { titulo: 'Comercio', valor: (d) => comerciosDe(d) },
        { titulo: 'Productos', valor: (d) => d.detalles.length, clase: 'num' },
        { titulo: 'Cantidad total', valor: (d) => numero(d.cantidadTotal), clase: 'num' },
        { titulo: 'Estado', valor: (d) => insignia(d.estadoDonacion ?? 'Sin estado', claseInsignia(d.estadoDonacion)) },
        {
          titulo: '', valor: (d) => (registradas.has(d.idDonacion)
            ? html`<span class="campo__ayuda">En tu inventario</span>`
            : html`<button type="button" class="boton boton--contorno boton--chico" data-registrar="${d.idDonacion}">Registrar en inventario</button>`),
        },
      ],
    });
    contenido.querySelectorAll('[data-registrar]').forEach((b) => b.addEventListener('click', () => registrar(donaciones.get(Number(b.dataset.registrar)))));
  }

  async function mostrarInventario(inventario) {
    const detalle = contenido.querySelector('[data-detalle]');
    mostrarCargando(detalle);
    try {
      const lotes = await inventariosApi.lotes(inventario.idInventario);
      const donacion = donaciones.get(inventario.idDonacion);
      pintar(detalle, html`
        <div class="detalle__encabezado"><div><h2 class="detalle__titulo">Inventario #${inventario.idInventario}</h2>
          <p class="detalle__subtitulo">${comerciosDe(donacion)}</p></div></div>
        ${datos([['Donación', fecha(donacion?.fechaDonacion)], ['Disponible', numero(inventario.cantidadDisponible)],
          ['Estado', inventario.estadoInventario], ['Actualizado', fecha(inventario.fechaActualizacion)]])}
        <h3 class="seccion__titulo">Productos</h3><br>
        ${seguro(`<ul class="movimientos">${(donacion?.detalles ?? []).map((d) => `<li><span>${esc(d.nombreAlimento)}</span><span>${esc(numero(d.cantidadDetalleDonacion))} ${esc(d.unidadMedidaDetalleDonacion ?? '')}</span></li>`).join('')}</ul>`)}
        <br><h3 class="seccion__titulo">Lotes</h3><br>
        ${lotes.length
          ? seguro(`<ul class="movimientos">${lotes.map((l) => `<li><span>${esc(l.numeroLote)} · caduca ${esc(fecha(l.fechaCaducidad))}</span><span>${esc(numero(l.cantidadActual))} / ${esc(numero(l.cantidadInicial))}</span></li>`).join('')}</ul>`)
          : html`<p class="detalle__nota">Sin lotes registrados.</p>`}
        <div class="detalle__acciones">
          <button type="button" class="boton boton--texto boton--chico" data-actualizar>Actualizar existencias</button>
          <button type="button" class="boton boton--contorno boton--chico" data-lote>Agregar lote</button>
        </div>`);
      detalle.querySelector('[data-actualizar]').addEventListener('click', () => actualizarExistencias(inventario));
      detalle.querySelector('[data-lote]').addEventListener('click', () => agregarLote(inventario));
    } catch (error) {
      mostrarError(detalle, error, () => mostrarInventario(inventario));
    }
  }

  function registrar(donacion) {
    abrirFormulario({
      titulo: 'Registrar en inventario',
      ancho: 'modal--chico',
      contenido: `<p class="modal__texto">${esc(comerciosDe(donacion))} · ${esc(fecha(donacion.fechaDonacion))}</p><br>
        <div class="rejilla-form">
          ${campo('cantidadDisponible', 'Cantidad disponible', { tipo: 'number', requerido: true, valor: donacion.cantidadTotal, atributos: decimal(0) })}
          ${campo('estadoInventario', 'Estado', { tipo: 'select', valor: 'Disponible', opciones: [['Disponible', 'Disponible'], ['Agotado', 'Agotado']] })}
        </div>`,
      textoGuardar: 'Registrar',
      alGuardar: async (formulario) => {
        await inventariosApi.crear({ ...formulario, idDonacion: donacion.idDonacion, idOrganizacion: organizacion.idOrganizacion });
        avisar('Donación registrada en tu inventario', 'exito');
        cargar();
      },
    });
  }

  function actualizarExistencias(inventario) {
    abrirFormulario({
      titulo: 'Actualizar existencias',
      ancho: 'modal--chico',
      contenido: `<div class="rejilla-form">
        ${campo('cantidadDisponible', 'Cantidad disponible', { tipo: 'number', requerido: true, valor: inventario.cantidadDisponible, atributos: decimal(0) })}
        ${campo('estadoInventario', 'Estado', { tipo: 'select', valor: inventario.estadoInventario ?? 'Disponible', opciones: [['Disponible', 'Disponible'], ['Agotado', 'Agotado']] })}
      </div>`,
      alGuardar: async (formulario) => {
        await inventariosApi.actualizar(inventario.idInventario, { ...formulario, idDonacion: inventario.idDonacion, idOrganizacion: inventario.idOrganizacion });
        avisar('Inventario actualizado', 'exito');
        cargar();
      },
    });
  }

  function agregarLote(inventario) {
    abrirFormulario({
      titulo: 'Agregar lote',
      contenido: `<div class="rejilla-form">
        ${campo('numeroLote', 'Número de lote', { requerido: true, atributos: 'maxlength="50"', placeholder: 'Ej. LT-2026-001' })}
        ${campo('fechaRecepcion', 'Fecha de recepción', { tipo: 'date', requerido: true, valor: hoyISO(), atributos: `max="${hoyISO()}"` })}
        ${campo('fechaCaducidad', 'Fecha de caducidad', { tipo: 'date' })}
        ${campo('fechaConsumo', 'Consumo preferente', { tipo: 'date' })}
        ${campo('cantidadInicial', 'Cantidad inicial', { tipo: 'number', requerido: true, atributos: decimal(0.01) })}
        ${campo('cantidadActual', 'Cantidad actual', { tipo: 'number', requerido: true, atributos: decimal(0) })}
      </div>`,
      textoGuardar: 'Agregar lote',
      alGuardar: async (formulario) => {
        await lotesApi.crear({ ...formulario, idInventario: inventario.idInventario });
        avisar('Lote agregado', 'exito');
        mostrarInventario(inventario);
      },
    });
  }

  cargar();
}
