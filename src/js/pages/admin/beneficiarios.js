import { beneficiariosApi } from '../../api/beneficiarios.api.js';
import { entregasApi } from '../../api/solicitudes.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { camposBeneficiario } from '../../ui/campos-entidades.js';
import { datos, direccion, listaConDetalle, metricas } from '../../ui/detalle.js';
import { esc, html, pintar, seguro } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { fecha, nombreCompleto } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { pintarTabla } from '../../ui/tabla.js';

const panel = montarPanel({
  rol: ROLES.ADMIN,
  pagina: 'beneficiarios',
  titulo: 'Beneficiarios',
  descripcion: 'Familias registradas, apoyos recibidos y solicitudes enviadas.',
});

if (panel) {
  const { contenido, acciones } = panel;
  const filtros = { buscar: '' };
  let seleccionado = null;

  const { lista, detalle } = listaConDetalle(contenido, campo('buscar', 'Buscar', { tipo: 'search', placeholder: 'Nombre, apellido o correo' }));

  agregarAccion(acciones, 'Imprimir datos', 'boton--texto', () => window.print());
  agregarAccion(acciones, 'Mostrar listado', 'boton--primario', cargar);

  let espera;
  contenido.querySelector('input[name="buscar"]').addEventListener('input', (e) => {
    filtros.buscar = e.target.value.trim();
    clearTimeout(espera);
    espera = setTimeout(cargar, 350);
  });

  async function cargar() {
    mostrarCargando(lista);
    try {
      const beneficiarios = await beneficiariosApi.listar(filtros);
      pintarTabla(lista, {
        filas: beneficiarios,
        idFila: (b) => b.idBeneficiario,
        seleccionada: seleccionado?.idBeneficiario,
        alSeleccionar: mostrarDetalle,
        vacio: { titulo: 'No hay familias registradas' },
        columnas: [
          { titulo: 'Nombre', valor: (b) => nombreCompleto(b.nombreBeneficiario, b.ap, b.am) },
          { titulo: 'Integrantes', valor: (b) => b.numeroIntegrantes, clase: 'num' },
          { titulo: 'Teléfono', valor: (b) => b.telefono },
          { titulo: 'Colonia', valor: (b) => b.colonia },
          { titulo: 'Municipio', valor: (b) => b.municipio },
        ],
      });
    } catch (error) {
      mostrarError(lista, error, cargar);
    }
  }

  async function mostrarDetalle(b) {
    seleccionado = b;
    mostrarCargando(detalle);
    try {
      const [solicitudes, entregas] = await Promise.all([beneficiariosApi.solicitudes(b.idBeneficiario), entregasApi.listar()]);
      const idsSolicitudes = new Set(solicitudes.map((s) => s.idSolicitud));
      const apoyos = entregas.filter((e) => idsSolicitudes.has(e.idSolicitud));
      const pendientes = solicitudes.filter((s) => String(s.estadoSolicitud).toLowerCase() === 'pendiente').length;
      const movimientos = [
        ...solicitudes.map((s) => ({ fecha: s.fechaSolicitud, texto: `Solicitud · ${s.motivo}` })),
        ...apoyos.map((e) => ({ fecha: e.fechaEntrega, texto: `Apoyo ${String(e.estado ?? 'registrado').toLowerCase()} · ${e.responsable}` })),
      ].sort((x, y) => String(y.fecha).localeCompare(String(x.fecha))).slice(0, 5);

      pintar(detalle, html`
        <div class="detalle__encabezado"><div>
          <h2 class="detalle__titulo">${nombreCompleto(b.nombreBeneficiario, b.ap, b.am)}</h2>
          <p class="detalle__subtitulo">${[b.correo, b.numeroIntegrantes && `${b.numeroIntegrantes} integrantes`].filter(Boolean).join(' · ')}</p></div></div>
        ${metricas([['Apoyos', apoyos.length], ['Solicitudes', solicitudes.length], ['Pendientes', pendientes]])}
        ${datos([
          ['Teléfono', b.telefono],
          ['Dirección', direccion(b.calle, b.numeroExterior, b.numeroInterior, b.colonia, b.codigoPostal, b.municipio, b.estadoBeneficiario)],
          ['Cuenta vinculada', b.idUsuario ? 'Sí' : 'No'],
        ])}
        <h3 class="seccion__titulo">Últimos movimientos</h3><br>
        ${movimientos.length
          ? seguro(`<ul class="movimientos">${movimientos.map((m) => `<li><span>${esc(m.texto)}</span><span>${esc(fecha(m.fecha))}</span></li>`).join('')}</ul>`)
          : html`<p class="detalle__nota">Sin movimientos registrados.</p>`}
        <div class="detalle__acciones no-imprimir">
          <button type="button" class="boton boton--peligro-texto boton--chico" data-eliminar>Eliminar</button>
          <button type="button" class="boton boton--contorno boton--chico" data-editar>Editar</button>
        </div>`);
      detalle.querySelector('[data-editar]').addEventListener('click', () => editar(b));
      detalle.querySelector('[data-eliminar]').addEventListener('click', () => eliminar(b));
    } catch (error) {
      mostrarError(detalle, error, () => mostrarDetalle(b));
    }
  }

  function editar(b) {
    abrirFormulario({
      titulo: 'Editar beneficiario',
      contenido: `<div class="rejilla-form">${camposBeneficiario(b)}</div>`,
      alGuardar: async (formulario) => {
        const actualizado = await beneficiariosApi.actualizar(b.idBeneficiario, formulario);
        avisar('Beneficiario actualizado', 'exito');
        await cargar();
        mostrarDetalle(actualizado);
      },
    });
  }

  async function eliminar(b) {
    const ok = await confirmar({
      titulo: 'Eliminar beneficiario',
      mensaje: `Se eliminará a ${nombreCompleto(b.nombreBeneficiario, b.ap)} junto con sus preferencias y alergias. Si tiene solicitudes, el sistema no lo permitirá.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      await beneficiariosApi.eliminar(b.idBeneficiario);
      avisar('Beneficiario eliminado', 'exito');
      seleccionado = null;
      detalle.innerHTML = '<p class="estado__texto">Selecciona un registro para ver su información.</p>';
      cargar();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  cargar();
}
