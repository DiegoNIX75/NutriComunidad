import { alimentosApi, categoriasApi } from '../../api/catalogo.api.js';
import { donacionesApi } from '../../api/comercios.api.js';
import { inventariosApi, lotesApi } from '../../api/organizaciones.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { datos } from '../../ui/detalle.js';
import { html, pintar } from '../../ui/dom.js';
import { mostrarCargando, mostrarError, mostrarVacio } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { claseInsignia, fecha, numero } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';

const panel = montarPanel({
  rol: ROLES.ADMIN,
  pagina: 'alimentos',
  titulo: 'Alimentos',
  descripcion: 'Catálogo de alimentos con su información nutricional y consulta por lote.',
});

const decimal = 'type="number" step="0.01" min="0" data-tipo="numero"';
const columnasNutricion = [
  { titulo: 'Calorías', valor: (a) => numero(a.caloriasPorPorcion), clase: 'num' },
  { titulo: 'Proteínas (g)', valor: (a) => numero(a.proteinas), clase: 'num' },
  { titulo: 'Carbohidr. (g)', valor: (a) => numero(a.carbohidratos), clase: 'num' },
  { titulo: 'Grasas (g)', valor: (a) => numero(a.grasas), clase: 'num' },
];

if (panel) {
  const { contenido, acciones } = panel;
  const filtros = { buscar: '', idCategoria: '' };
  let categorias = [];
  let alimentos = [];

  contenido.innerHTML = `
    <section class="seccion" aria-labelledby="titulo-catalogo">
      <div class="seccion__encabezado"><h2 class="seccion__titulo" id="titulo-catalogo">Catálogo</h2></div>
      <div class="herramientas no-imprimir">
        ${campo('buscar', 'Buscar', { tipo: 'search', placeholder: 'Nombre o descripción' })}
        <div class="campo campo--corto"><label class="campo__etiqueta" for="filtro-categoria">Categoría</label>
          <select class="selector" id="filtro-categoria"><option value="">Todas</option></select></div>
      </div>
      <div data-catalogo></div>
    </section>
    <section class="seccion" aria-labelledby="titulo-lote">
      <div class="seccion__encabezado">
        <h2 class="seccion__titulo" id="titulo-lote">Alimentos por lote</h2>
        <div class="campo campo--corto no-imprimir"><label class="campo__etiqueta" for="filtro-lote">Lote</label>
          <select class="selector" id="filtro-lote"><option value="">Selecciona un lote</option></select></div>
      </div>
      <div data-lote></div>
      <p class="detalle__nota">Valores nutricionales por porción o por unidad de medida. Cambia el lote para ver otros inventarios.</p>
    </section>`;

  const catalogo = contenido.querySelector('[data-catalogo]');
  const vistaLote = contenido.querySelector('[data-lote]');
  const selectorCategoria = contenido.querySelector('#filtro-categoria');
  const selectorLote = contenido.querySelector('#filtro-lote');
  mostrarVacio(vistaLote, { titulo: 'Selecciona un lote', texto: 'Verás los alimentos de la donación que dio origen a ese inventario.' });

  agregarAccion(acciones, 'Categorías', 'boton--texto', gestionarCategorias);
  agregarAccion(acciones, 'Nuevo alimento', 'boton--primario', () => editarAlimento());

  let espera;
  contenido.querySelector('input[name="buscar"]').addEventListener('input', (e) => {
    filtros.buscar = e.target.value.trim();
    clearTimeout(espera);
    espera = setTimeout(cargarCatalogo, 350);
  });
  selectorCategoria.addEventListener('change', () => {
    filtros.idCategoria = selectorCategoria.value;
    cargarCatalogo();
  });
  selectorLote.addEventListener('change', () => mostrarLote(selectorLote.value));

  async function cargarCategorias() {
    categorias = await categoriasApi.listar();
    selectorCategoria.innerHTML = `<option value="">Todas</option>${categorias
      .map((c) => html`<option value="${c.idCategoria}" ${String(c.idCategoria) === filtros.idCategoria ? 'selected' : ''}>${c.nombreCategoria}</option>`.__html).join('')}`;
  }

  async function cargarCatalogo() {
    mostrarCargando(catalogo);
    try {
      alimentos = await alimentosApi.listar(filtros);
      pintarTabla(catalogo, {
        filas: alimentos,
        vacio: { titulo: 'No hay alimentos registrados', texto: 'Agrega uno con «Nuevo alimento».' },
        columnas: [
          { titulo: 'Alimento', valor: (a) => a.nombreAlimento },
          { titulo: 'Categoría', valor: (a) => a.nombreCategoria },
          { titulo: 'Unidad', valor: (a) => a.unidadMedida },
          ...columnasNutricion,
          { titulo: 'Estado', valor: (a) => insignia(a.estadoAlimento, claseInsignia(a.estadoAlimento)) },
          {
            titulo: 'Acciones', clase: 'no-imprimir',
            valor: (a) => html`<div class="acciones-celda">
              <button type="button" class="boton boton--texto boton--chico" data-editar="${a.idAlimento}">Editar</button>
              <button type="button" class="boton boton--peligro-texto boton--chico" data-eliminar="${a.idAlimento}">Eliminar</button></div>`,
          },
        ],
      });
      catalogo.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click',
        () => editarAlimento(alimentos.find((a) => String(a.idAlimento) === b.dataset.editar))));
      catalogo.querySelectorAll('[data-eliminar]').forEach((b) => b.addEventListener('click',
        () => eliminarAlimento(alimentos.find((a) => String(a.idAlimento) === b.dataset.eliminar))));
    } catch (error) {
      mostrarError(catalogo, error, cargarCatalogo);
    }
  }

  function editarAlimento(alimento = {}) {
    if (!categorias.length) {
      avisar('Primero crea una categoría con el botón «Categorías».', 'error');
      return;
    }
    abrirFormulario({
      titulo: alimento.idAlimento ? 'Editar alimento' : 'Nuevo alimento',
      contenido: `<div class="rejilla-form">
        ${campo('nombreAlimento', 'Nombre', { requerido: true, valor: alimento.nombreAlimento, atributos: 'maxlength="100"' })}
        ${campo('idCategoria', 'Categoría', { tipo: 'select', requerido: true, valor: alimento.idCategoria, atributos: 'data-tipo="numero"',
          opciones: [['', 'Selecciona la categoría'], ...categorias.map((c) => [c.idCategoria, c.nombreCategoria])] })}
        ${campo('descripcion', 'Descripción', { valor: alimento.descripcion, atributos: 'maxlength="255"', completo: true })}
        ${campo('unidadMedida', 'Unidad de medida', { valor: alimento.unidadMedida, atributos: 'maxlength="20"', placeholder: 'kg, lt, pza' })}
        ${campo('estadoAlimento', 'Estado', { tipo: 'select', valor: alimento.estadoAlimento ?? 'Activo', opciones: [['Activo', 'Activo'], ['Inactivo', 'Inactivo']] })}
        ${campo('caloriasPorPorcion', 'Calorías por porción', { valor: alimento.caloriasPorPorcion, atributos: decimal })}
        ${campo('proteinas', 'Proteínas (g)', { valor: alimento.proteinas, atributos: decimal })}
        ${campo('carbohidratos', 'Carbohidratos (g)', { valor: alimento.carbohidratos, atributos: decimal })}
        ${campo('grasas', 'Grasas (g)', { valor: alimento.grasas, atributos: decimal })}
      </div>`,
      alGuardar: async (datosForm) => {
        if (alimento.idAlimento) await alimentosApi.actualizar(alimento.idAlimento, datosForm);
        else await alimentosApi.crear(datosForm);
        avisar(alimento.idAlimento ? 'Alimento actualizado' : 'Alimento creado', 'exito');
        cargarCatalogo();
      },
    });
  }

  async function eliminarAlimento(alimento) {
    const ok = await confirmar({ titulo: 'Eliminar alimento', mensaje: `Se eliminará «${alimento.nombreAlimento}». Si está en recetas o donaciones, el sistema no lo permitirá.`, textoConfirmar: 'Eliminar', peligro: true });
    if (!ok) return;
    try {
      await alimentosApi.eliminar(alimento.idAlimento);
      avisar('Alimento eliminado', 'exito');
      cargarCatalogo();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  function gestionarCategorias() {
    const filas = categorias.map((c) => html`<li><span>${c.nombreCategoria} ${insignia(c.estadoCategoria, claseInsignia(c.estadoCategoria))}</span>
      <button type="button" class="boton boton--peligro-texto boton--chico" data-borrar-categoria="${c.idCategoria}">Eliminar</button></li>`.__html).join('');
    const dialogo = abrirFormulario({
      titulo: 'Categorías de alimentos',
      contenido: `<ul class="movimientos">${filas || '<li>No hay categorías todavía.</li>'}</ul><br>
        <h3 class="seccion__titulo">Nueva categoría</h3><br>
        <div class="rejilla-form">
          ${campo('nombreCategoria', 'Nombre', { requerido: true, atributos: 'maxlength="100"' })}
          ${campo('descripcionCategoria', 'Descripción', { atributos: 'maxlength="255"' })}
        </div>`,
      textoGuardar: 'Agregar categoría',
      alGuardar: async (datosForm) => {
        await categoriasApi.crear(datosForm);
        avisar('Categoría creada', 'exito');
        await cargarCategorias();
      },
    });
    dialogo.querySelectorAll('[data-borrar-categoria]').forEach((boton) => boton.addEventListener('click', async () => {
      try {
        await categoriasApi.eliminar(boton.dataset.borrarCategoria);
        boton.closest('li').remove();
        avisar('Categoría eliminada', 'exito');
        await cargarCategorias();
      } catch (error) {
        avisar(mensajeDeError(error), 'error');
      }
    }));
  }

  async function cargarLotes() {
    const lotes = await lotesApi.listar();
    selectorLote.innerHTML = `<option value="">Selecciona un lote</option>${lotes
      .map((l) => html`<option value="${l.idLote}" data-inventario="${l.idInventario}">${l.numeroLote} · recibido ${fecha(l.fechaRecepcion)}</option>`.__html).join('')}`;
    selectorLote.lotes = lotes;
  }

  async function mostrarLote(idLote) {
    const lote = (selectorLote.lotes ?? []).find((l) => String(l.idLote) === idLote);
    if (!lote) {
      mostrarVacio(vistaLote, { titulo: 'Selecciona un lote' });
      return;
    }
    mostrarCargando(vistaLote);
    try {
      const inventario = await inventariosApi.obtener(lote.idInventario);
      const donacion = await donacionesApi.obtener(inventario.idDonacion);
      const porId = new Map(alimentos.map((a) => [a.idAlimento, a]));
      const comercios = [...new Set(donacion.detalles.map((d) => d.nombreComercio))].join(', ');
      pintar(vistaLote, html`<div class="tarjeta">${datos([
        ['Recibido', fecha(lote.fechaRecepcion)], ['Comercio', comercios], ['Alimentos en la donación', donacion.detalles.length],
        ['Caducidad', fecha(lote.fechaCaducidad)], ['Cantidad actual / inicial', `${numero(lote.cantidadActual)} / ${numero(lote.cantidadInicial)}`],
      ])}<div data-tabla-lote></div></div>`);
      pintarTabla(vistaLote.querySelector('[data-tabla-lote]'), {
        filas: donacion.detalles.map((d) => ({ ...porId.get(d.idAlimento), ...d })),
        vacio: { titulo: 'La donación no tiene alimentos registrados' },
        columnas: [
          { titulo: 'Alimento', valor: (d) => d.nombreAlimento },
          { titulo: 'Cantidad', valor: (d) => `${numero(d.cantidadDetalleDonacion)} ${d.unidadMedidaDetalleDonacion ?? ''}`, clase: 'num' },
          ...columnasNutricion,
        ],
      });
    } catch (error) {
      mostrarError(vistaLote, error, () => mostrarLote(idLote));
    }
  }

  cargarCategorias().then(cargarCatalogo).catch((error) => mostrarError(catalogo, error, cargarCatalogo));
  cargarLotes().catch((error) => avisar(mensajeDeError(error), 'error'));
}
