import { alimentosApi } from '../../api/catalogo.api.js';
import { donacionesApi } from '../../api/comercios.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel, mostrarNombreEnEncabezado } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { esc, html, pintar, seguro } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { claseInsignia, fecha, hoyISO, numero } from '../../ui/formato.js';
import { abrirDetalle, abrirFormulario } from '../../ui/modal.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';
import { donacionesConDetalle, obtenerMiComercio, pedirComercio } from './comun.js';

const panel = montarPanel({
  rol: ROLES.COMERCIO,
  pagina: 'productos',
  titulo: 'Productos a donar',
  descripcion: 'Prepara tu donación con su información nutricional. Los totales se calculan automáticamente.',
});

const nutricion = [
  ['caloriasPorPorcion', 'Calorías'], ['proteinas', 'Proteínas (g)'], ['carbohidratos', 'Carbohidr. (g)'], ['grasas', 'Grasas (g)'],
];

if (panel) {
  const { contenido, acciones } = panel;
  let comercio = null;
  let alimentos = [];
  let enviadas = [];
  let borrador = [];
  const claveBorrador = () => `nutricomunidad.borrador-donacion.${comercio.idComercio}`;

  const guardarBorrador = () => sessionStorage.setItem(claveBorrador(), JSON.stringify(borrador));
  const leerBorrador = () => {
    try {
      return JSON.parse(sessionStorage.getItem(claveBorrador())) ?? [];
    } catch {
      return [];
    }
  };

  async function cargar() {
    mostrarCargando(contenido);
    try {
      comercio = await obtenerMiComercio();
      if (!comercio) {
        acciones.innerHTML = '';
        pedirComercio(contenido);
        return;
      }
      mostrarNombreEnEncabezado(comercio.nombreComercio);
      [alimentos, enviadas] = await Promise.all([alimentosApi.listar({ estado: 'Activo' }), donacionesConDetalle()]);
      borrador = leerBorrador().filter((p) => alimentos.some((a) => a.idAlimento === p.idAlimento));
      prepararAcciones();
      pintarPagina();
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  function prepararAcciones() {
    acciones.innerHTML = '';
    agregarAccion(acciones, 'Agregar producto', 'boton--contorno', agregarProducto);
    agregarAccion(acciones, 'Enviar donación', 'boton--primario', enviarDonacion).dataset.enviar = '';
  }

  function pintarPagina() {
    const total = borrador.reduce((a, p) => a + p.cantidad, 0);
    pintar(contenido, html`
      <div class="estadisticas seccion">
        <div class="estadistica"><p class="estadistica__etiqueta">Productos por enviar</p><p class="estadistica__valor">${borrador.length}</p>
          <p class="estadistica__nota">Listos para la próxima donación</p></div>
        <div class="estadistica"><p class="estadistica__etiqueta">Cantidad total</p><p class="estadistica__valor">${numero(total)}</p>
          <p class="estadistica__nota">Suma de la columna «Cantidad»</p></div>
        <div class="estadistica"><p class="estadistica__etiqueta">Donaciones enviadas</p><p class="estadistica__valor">${enviadas.length}</p>
          <p class="estadistica__nota">Historial en la parte inferior</p></div>
      </div>
      <section class="seccion" aria-labelledby="titulo-borrador">
        <h2 class="seccion__titulo" id="titulo-borrador">Donación en preparación</h2>
        <div data-borrador></div>
        <p class="detalle__nota">Valores nutricionales por porción o por unidad de medida, según el catálogo de alimentos.</p>
      </section>
      <section class="seccion" aria-labelledby="titulo-enviadas">
        <h2 class="seccion__titulo" id="titulo-enviadas">Donaciones enviadas</h2>
        <div data-enviadas></div>
      </section>`);

    const porId = new Map(alimentos.map((a) => [a.idAlimento, a]));
    const filas = borrador.map((p, indice) => ({ ...porId.get(p.idAlimento), ...p, indice }));
    const sumaNutricion = (clave) => numero(filas.reduce((a, f) => a + Number(f[clave] ?? 0), 0));
    pintarTabla(contenido.querySelector('[data-borrador]'), {
      filas,
      vacio: { titulo: 'Aún no agregas productos', texto: 'Usa «Agregar producto» para preparar tu donación.' },
      columnas: [
        { titulo: 'Alimento', valor: (f) => f.nombreAlimento },
        { titulo: 'Descripción', valor: (f) => f.descripcion },
        { titulo: 'Unidad', valor: (f) => f.unidadMedida },
        ...nutricion.map(([clave, titulo]) => ({ titulo, valor: (f) => numero(f[clave]), clase: 'num' })),
        { titulo: 'Cantidad', valor: (f) => numero(f.cantidad), clase: 'num' },
        { titulo: '', valor: (f) => html`<button type="button" class="boton boton--peligro-texto boton--chico" data-quitar="${f.indice}">Quitar</button>` },
      ],
      pie: ['Total', '', '', ...nutricion.map(([clave]) => sumaNutricion(clave)), numero(total), ''],
    });
    contenido.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => {
      borrador.splice(Number(b.dataset.quitar), 1);
      guardarBorrador();
      pintarPagina();
    }));
    const botonEnviar = acciones.querySelector('[data-enviar]');
    if (botonEnviar) botonEnviar.disabled = !borrador.length;

    pintarTabla(contenido.querySelector('[data-enviadas]'), {
      filas: [...enviadas].sort((a, b) => String(b.fechaDonacion).localeCompare(String(a.fechaDonacion))),
      idFila: (d) => d.idDonacion,
      alSeleccionar: verDonacion,
      vacio: { titulo: 'Todavía no has enviado donaciones' },
      columnas: [
        { titulo: 'Fecha', valor: (d) => fecha(d.fechaDonacion) },
        { titulo: 'Productos', valor: (d) => d.detalles.filter((x) => x.idComercio === comercio.idComercio).length, clase: 'num' },
        { titulo: 'Cantidad total', valor: (d) => numero(d.cantidadTotal), clase: 'num' },
        { titulo: 'Estado', valor: (d) => insignia(d.estadoDonacion ?? 'Sin estado', claseInsignia(d.estadoDonacion)) },
        { titulo: 'Observaciones', valor: (d) => d.observacionesDonacion },
      ],
    });
  }

  function agregarProducto() {
    if (!alimentos.length) {
      avisar('No hay alimentos activos en el catálogo. Pide a un administrador que los registre.', 'error');
      return;
    }
    abrirFormulario({
      titulo: 'Agregar producto',
      ancho: 'modal--chico',
      contenido: `<div class="rejilla-form">
        ${campo('idAlimento', 'Alimento', { tipo: 'select', requerido: true, completo: true, atributos: 'data-tipo="numero"',
          opciones: [['', 'Selecciona el alimento'], ...alimentos.map((a) => [a.idAlimento, `${a.nombreAlimento}${a.unidadMedida ? ` (${a.unidadMedida})` : ''}`])] })}
        ${campo('cantidad', 'Cantidad', { tipo: 'number', requerido: true, atributos: 'step="0.01" min="0.01" data-tipo="numero" data-mensaje="Indica una cantidad mayor que cero."' })}
        ${campo('unidad', 'Unidad', { atributos: 'maxlength="20"', placeholder: 'kg, lt, pza' })}
        <p class="campo__ayuda completo" data-nutricion></p></div>`,
      textoGuardar: 'Agregar',
      alAbrir: (formulario) => formulario.elements.idAlimento.addEventListener('change', (e) => {
        const alimento = alimentos.find((a) => String(a.idAlimento) === e.target.value);
        formulario.elements.unidad.value = alimento?.unidadMedida ?? '';
        formulario.querySelector('[data-nutricion]').textContent = alimento
          ? `Por porción: ${numero(alimento.caloriasPorPorcion)} kcal · ${numero(alimento.proteinas)} g proteínas · ${numero(alimento.carbohidratos)} g carbohidratos · ${numero(alimento.grasas)} g grasas`
          : '';
      }),
      alGuardar: async ({ idAlimento, cantidad, unidad }) => {
        borrador.push({ idAlimento, cantidad, unidad });
        guardarBorrador();
        pintarPagina();
      },
    });
  }

  async function enviarDonacion() {
    if (!borrador.length) return;
    const total = borrador.reduce((a, p) => a + p.cantidad, 0);
    const ok = await confirmar({
      titulo: 'Enviar donación',
      mensaje: `Se registrará una donación con ${borrador.length} producto(s) y una cantidad total de ${numero(total)}.`,
      textoConfirmar: 'Enviar donación',
    });
    if (!ok) return;
    try {
      await donacionesApi.crear({
        fechaDonacion: hoyISO(),
        estadoDonacion: 'Enviada',
        detalles: borrador.map((p) => ({
          cantidadDetalleDonacion: p.cantidad,
          unidadMedidaDetalleDonacion: p.unidad,
          idAlimento: p.idAlimento,
          idComercio: comercio.idComercio,
        })),
      });
      borrador = [];
      guardarBorrador();
      avisar('Donación enviada', 'exito');
      enviadas = await donacionesConDetalle();
      pintarPagina();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  function verDonacion(donacion) {
    const filas = donacion.detalles
      .map((d) => `<li><span>${esc(d.nombreAlimento)}</span><span>${esc(numero(d.cantidadDetalleDonacion))} ${esc(d.unidadMedidaDetalleDonacion ?? '')}</span></li>`)
      .join('');
    abrirDetalle({
      titulo: `Donación del ${fecha(donacion.fechaDonacion)}`,
      contenido: html`<p class="modal__texto">Estado: ${donacion.estadoDonacion ?? 'Sin estado'} · Total: ${numero(donacion.cantidadTotal)}</p><br>
        ${seguro(`<ul class="movimientos">${filas}</ul>`)}`.__html,
    });
  }

  cargar();
}
