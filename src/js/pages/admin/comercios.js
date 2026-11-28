import { comerciosApi, donacionesApi } from '../../api/comercios.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { camposComercio } from '../../ui/campos-entidades.js';
import { datos, direccion, listaConDetalle, metricas } from '../../ui/detalle.js';
import { html, pintar } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { numero } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { pintarTabla } from '../../ui/tabla.js';

const panel = montarPanel({
  rol: ROLES.ADMIN,
  pagina: 'comercios',
  titulo: 'Comercios',
  descripcion: 'Consulta los comercios registrados y las donaciones que han realizado.',
});

if (panel) {
  const { contenido, acciones } = panel;
  const filtros = { buscar: '', tipo: '' };
  let comercios = [];
  let seleccionado = null;

  const { lista, detalle } = listaConDetalle(contenido, `
    ${campo('buscar', 'Buscar', { tipo: 'search', placeholder: 'Nombre comercial o razón social' })}
    <div class="campo campo--corto"><label class="campo__etiqueta" for="filtro-tipo">Tipo de comercio</label>
      <select class="selector" id="filtro-tipo"><option value="">Todos</option></select></div>`);
  const selectorTipo = contenido.querySelector('#filtro-tipo');

  agregarAccion(acciones, 'Imprimir datos', 'boton--texto', () => window.print());
  agregarAccion(acciones, 'Mostrar listado', 'boton--primario', cargar);

  let espera;
  contenido.querySelector('input[name="buscar"]').addEventListener('input', (e) => {
    filtros.buscar = e.target.value.trim();
    clearTimeout(espera);
    espera = setTimeout(cargar, 350);
  });
  selectorTipo.addEventListener('change', () => {
    filtros.tipo = selectorTipo.value;
    cargar();
  });

  async function cargar() {
    mostrarCargando(lista);
    try {
      comercios = await comerciosApi.listar(filtros);
      actualizarTipos();
      pintarTabla(lista, {
        filas: comercios,
        idFila: (c) => c.idComercio,
        seleccionada: seleccionado?.idComercio,
        alSeleccionar: mostrarDetalle,
        vacio: { titulo: 'No hay comercios registrados', texto: 'Los comercios aparecen aquí cuando se registran.' },
        columnas: [
          { titulo: 'Nombre comercial', valor: (c) => c.nombreComercio },
          { titulo: 'Razón social', valor: (c) => c.razonSocial },
          { titulo: 'Tipo', valor: (c) => c.tipoComercio },
          { titulo: 'Teléfono', valor: (c) => c.telefonoComercio },
          { titulo: 'Colonia', valor: (c) => c.coloniaComercio },
        ],
      });
    } catch (error) {
      mostrarError(lista, error, cargar);
    }
  }

  function actualizarTipos() {
    if (filtros.tipo) return;
    const tipos = [...new Set(comercios.map((c) => c.tipoComercio).filter(Boolean))].sort();
    selectorTipo.innerHTML = `<option value="">Todos</option>${tipos.map((t) => html`<option>${t}</option>`.__html).join('')}`;
  }

  async function mostrarDetalle(comercio) {
    seleccionado = comercio;
    mostrarCargando(detalle, 'Calculando donaciones…');
    try {
      const donaciones = await donacionesApi.listar({ idComercio: comercio.idComercio });
      const completas = await Promise.all(donaciones.map((d) => donacionesApi.obtener(d.idDonacion)));
      const propios = completas.flatMap((d) => d.detalles).filter((d) => d.idComercio === comercio.idComercio);
      const cantidad = propios.reduce((acc, d) => acc + Number(d.cantidadDetalleDonacion), 0);
      const alimentos = new Set(propios.map((d) => d.idAlimento)).size;

      pintar(detalle, html`
        <div class="detalle__encabezado"><div>
          <h2 class="detalle__titulo">${comercio.nombreComercio}</h2>
          <p class="detalle__subtitulo">${comercio.correoComercio ?? 'Sin correo registrado'}</p></div></div>
        ${metricas([['Donaciones', donaciones.length], ['Cantidad donada', numero(cantidad)], ['Alimentos', alimentos]])}
        ${datos([
          ['Razón social', comercio.razonSocial], ['Tipo', comercio.tipoComercio], ['Teléfono', comercio.telefonoComercio],
          ['Dirección', direccion(comercio.calleComercio, comercio.numeroExteriorComercio, comercio.numeroInteriorComercio,
            comercio.coloniaComercio, comercio.codigoPostalComercio, comercio.municipioComercio, comercio.estadoComercio)],
          ['Cuenta vinculada', comercio.idUsuario ? 'Sí' : 'No'],
        ])}
        <p class="detalle__nota">El sistema no registra productos iniciales ni merma, por eso no se muestra el porcentaje de desperdicio del diseño.</p>
        <div class="detalle__acciones no-imprimir">
          <button type="button" class="boton boton--peligro-texto boton--chico" data-eliminar>Eliminar</button>
          <button type="button" class="boton boton--contorno boton--chico" data-editar>Editar</button>
        </div>`);
      detalle.querySelector('[data-editar]').addEventListener('click', () => editar(comercio));
      detalle.querySelector('[data-eliminar]').addEventListener('click', () => eliminar(comercio));
    } catch (error) {
      mostrarError(detalle, error, () => mostrarDetalle(comercio));
    }
  }

  function editar(comercio) {
    abrirFormulario({
      titulo: 'Editar comercio',
      contenido: `<div class="rejilla-form">${camposComercio(comercio)}</div>`,
      alGuardar: async (formulario) => {
        const actualizado = await comerciosApi.actualizar(comercio.idComercio, formulario);
        avisar('Comercio actualizado', 'exito');
        await cargar();
        mostrarDetalle(actualizado);
      },
    });
  }

  async function eliminar(comercio) {
    const ok = await confirmar({
      titulo: 'Eliminar comercio',
      mensaje: `Se eliminará «${comercio.nombreComercio}». Si tiene donaciones registradas, el sistema no lo permitirá.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      await comerciosApi.eliminar(comercio.idComercio);
      avisar('Comercio eliminado', 'exito');
      seleccionado = null;
      detalle.innerHTML = '<p class="estado__texto">Selecciona un registro para ver su información.</p>';
      cargar();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  cargar();
}
