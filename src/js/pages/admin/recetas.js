import { alimentosApi, recetasApi } from '../../api/catalogo.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { listaConDetalle } from '../../ui/detalle.js';
import { esc, html, pintar, seguro } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { moneda } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { imagenReceta, metaReceta } from '../../ui/recetas.js';
import { pintarTabla } from '../../ui/tabla.js';

const panel = montarPanel({
  rol: ROLES.ADMIN,
  pagina: 'recetas',
  titulo: 'Recetas',
  descripcion: 'Catálogo de recetas accesibles y sus ingredientes.',
});

const numeroDecimal = (min) => `step="0.01" min="${min}" data-tipo="numero"`;

function camposReceta(r = {}) {
  return `<div class="rejilla-form">
    ${campo('nombreReceta', 'Nombre de la receta', { requerido: true, valor: r.nombreReceta, atributos: 'maxlength="150"', completo: true })}
    ${campo('tiempoPreparacion', 'Tiempo de preparación', { valor: r.tiempoPreparacion, atributos: 'maxlength="50"', placeholder: 'Ej. 30 min' })}
    ${campo('proporciones', 'Porciones', { valor: r.proporciones, atributos: 'maxlength="50"', placeholder: 'Ej. 4 porciones' })}
    ${campo('costoEstimado', 'Costo estimado (MXN)', { tipo: 'number', valor: r.costoEstimado, atributos: numeroDecimal(0) })}
    ${campo('descripcion', 'Descripción / preparación', { tipo: 'textarea', valor: r.descripcion, atributos: 'maxlength="5000"', completo: true })}
  </div>`;
}

if (panel) {
  const { contenido, acciones } = panel;
  const filtros = { buscar: '' };
  let alimentos = [];
  let seleccionada = null;

  const { lista, detalle } = listaConDetalle(contenido, campo('buscar', 'Buscar', { tipo: 'search', placeholder: 'Nombre o descripción' }));
  agregarAccion(acciones, 'Imprimir datos', 'boton--texto', () => window.print());
  agregarAccion(acciones, 'Nueva receta', 'boton--primario', nueva);

  let espera;
  contenido.querySelector('input[name="buscar"]').addEventListener('input', (e) => {
    filtros.buscar = e.target.value.trim();
    clearTimeout(espera);
    espera = setTimeout(cargar, 350);
  });

  alimentosApi.listar().then((datos) => { alimentos = datos; }).catch((e) => avisar(mensajeDeError(e), 'error'));

  async function cargar() {
    mostrarCargando(lista);
    try {
      const recetas = await recetasApi.listar(filtros);
      pintarTabla(lista, {
        filas: recetas,
        idFila: (r) => r.idReceta,
        seleccionada: seleccionada?.idReceta,
        alSeleccionar: (r) => mostrarDetalle(r.idReceta),
        vacio: { titulo: 'No hay recetas registradas', texto: 'Crea la primera con «Nueva receta».' },
        columnas: [
          { titulo: 'Receta', valor: (r) => r.nombreReceta },
          { titulo: 'Tiempo', valor: (r) => r.tiempoPreparacion },
          { titulo: 'Porciones', valor: (r) => r.proporciones },
          { titulo: 'Costo estimado', valor: (r) => moneda(r.costoEstimado), clase: 'num' },
        ],
      });
    } catch (error) {
      mostrarError(lista, error, cargar);
    }
  }

  async function mostrarDetalle(idReceta) {
    mostrarCargando(detalle);
    try {
      const receta = await recetasApi.obtener(idReceta);
      seleccionada = receta;
      pintar(detalle, html`
        ${imagenReceta(receta, 'receta__imagen')}<br>
        <div class="detalle__encabezado"><div><h2 class="detalle__titulo">${receta.nombreReceta}</h2>
          <p class="detalle__subtitulo">${metaReceta(receta)}</p></div></div>
        <p class="detalle__nota">${receta.descripcion ?? 'Sin descripción.'}</p><br>
        <h3 class="seccion__titulo">Ingredientes</h3><br>
        ${receta.ingredientes.length
          ? seguro(`<ul class="movimientos">${receta.ingredientes.map((i) => `<li><span>${esc(i.nombreAlimento)} · ${esc(i.cantidad)} ${esc(i.unidadMedida ?? '')}</span>
              <button type="button" class="boton boton--peligro-texto boton--chico no-imprimir" data-quitar="${i.idDetalleReceta}">Quitar</button></li>`).join('')}</ul>`)
          : html`<p class="detalle__nota">Aún no tiene ingredientes.</p>`}
        <div class="detalle__acciones no-imprimir">
          <button type="button" class="boton boton--peligro-texto boton--chico" data-eliminar>Eliminar</button>
          <button type="button" class="boton boton--texto boton--chico" data-ingrediente>Agregar ingrediente</button>
          <button type="button" class="boton boton--contorno boton--chico" data-editar>Editar</button>
        </div>`);
      detalle.querySelector('[data-editar]').addEventListener('click', () => editar(receta));
      detalle.querySelector('[data-eliminar]').addEventListener('click', () => eliminar(receta));
      detalle.querySelector('[data-ingrediente]').addEventListener('click', () => agregarIngrediente(receta));
      detalle.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => quitarIngrediente(receta, b.dataset.quitar)));
    } catch (error) {
      mostrarError(detalle, error, () => mostrarDetalle(idReceta));
    }
  }

  function nueva() {
    abrirFormulario({
      titulo: 'Nueva receta',
      contenido: `${camposReceta()}<p class="campo__ayuda">Después de crearla podrás agregar sus ingredientes.</p>`,
      textoGuardar: 'Crear receta',
      alGuardar: async (datos) => {
        const creada = await recetasApi.crear({ ...datos, ingredientes: [] });
        avisar('Receta creada', 'exito');
        await cargar();
        mostrarDetalle(creada.idReceta);
      },
    });
  }

  function editar(receta) {
    abrirFormulario({
      titulo: 'Editar receta',
      contenido: camposReceta(receta),
      alGuardar: async (datos) => {
        await recetasApi.actualizar(receta.idReceta, datos);
        avisar('Receta actualizada', 'exito');
        await cargar();
        mostrarDetalle(receta.idReceta);
      },
    });
  }

  function agregarIngrediente(receta) {
    if (!alimentos.length) {
      avisar('Primero registra alimentos en el catálogo.', 'error');
      return;
    }
    abrirFormulario({
      titulo: 'Agregar ingrediente',
      ancho: 'modal--chico',
      contenido: `<div class="rejilla-form">
        ${campo('idAlimento', 'Alimento', { tipo: 'select', requerido: true, completo: true, atributos: 'data-tipo="numero"',
          opciones: [['', 'Selecciona el alimento'], ...alimentos.map((a) => [a.idAlimento, a.nombreAlimento])] })}
        ${campo('cantidad', 'Cantidad', { tipo: 'number', requerido: true, atributos: numeroDecimal(0.01) })}
        ${campo('unidadMedida', 'Unidad', { atributos: 'maxlength="20"', placeholder: 'kg, pza, taza…' })}</div>`,
      textoGuardar: 'Agregar',
      alGuardar: async (datos) => {
        await recetasApi.agregarIngrediente(receta.idReceta, datos);
        avisar('Ingrediente agregado', 'exito');
        mostrarDetalle(receta.idReceta);
      },
    });
  }

  async function quitarIngrediente(receta, idDetalle) {
    if (!(await confirmar({ titulo: 'Quitar ingrediente', mensaje: '¿Quitar este ingrediente de la receta?', textoConfirmar: 'Quitar', peligro: true }))) return;
    try {
      await recetasApi.eliminarIngrediente(receta.idReceta, idDetalle);
      avisar('Ingrediente quitado', 'exito');
      mostrarDetalle(receta.idReceta);
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  async function eliminar(receta) {
    const ok = await confirmar({ titulo: 'Eliminar receta', mensaje: `Se eliminará «${receta.nombreReceta}» con sus ingredientes.`, textoConfirmar: 'Eliminar', peligro: true });
    if (!ok) return;
    try {
      await recetasApi.eliminar(receta.idReceta);
      avisar('Receta eliminada', 'exito');
      seleccionada = null;
      detalle.innerHTML = '<p class="estado__texto">Selecciona un registro para ver su información.</p>';
      cargar();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  cargar();
}
