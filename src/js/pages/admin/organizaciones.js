import { inventariosApi, organizacionesApi } from '../../api/organizaciones.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { camposOrganizacion } from '../../ui/campos-entidades.js';
import { datos, direccion, listaConDetalle, metricas } from '../../ui/detalle.js';
import { html, pintar } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { numero, sumar } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { pintarTabla } from '../../ui/tabla.js';

const panel = montarPanel({
  rol: ROLES.ADMIN,
  pagina: 'organizaciones',
  titulo: 'Organizaciones',
  descripcion: 'Consulta las organizaciones sociales, su inventario y las solicitudes que atienden.',
});

if (panel) {
  const { contenido, acciones } = panel;
  const filtros = { buscar: '' };
  let seleccionada = null;

  const { lista, detalle } = listaConDetalle(contenido, campo('buscar', 'Buscar', { tipo: 'search', placeholder: 'Nombre o responsable' }));

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
      const organizaciones = await organizacionesApi.listar(filtros);
      pintarTabla(lista, {
        filas: organizaciones,
        idFila: (o) => o.idOrganizacion,
        seleccionada: seleccionada?.idOrganizacion,
        alSeleccionar: mostrarDetalle,
        vacio: { titulo: 'No hay organizaciones registradas' },
        columnas: [
          { titulo: 'Organización', valor: (o) => o.nombreOrganizacion },
          { titulo: 'Tipo', valor: (o) => o.tipoOrganizacion },
          { titulo: 'Responsable', valor: (o) => o.responsableOrganizacion },
          { titulo: 'Teléfono', valor: (o) => o.telefonoOrganizacion },
          { titulo: 'Estado', valor: (o) => o.estadoOrganizacion },
        ],
      });
    } catch (error) {
      mostrarError(lista, error, cargar);
    }
  }

  async function mostrarDetalle(org) {
    seleccionada = org;
    mostrarCargando(detalle);
    try {
      const [solicitudes, inventarios] = await Promise.all([
        organizacionesApi.solicitudes(org.idOrganizacion),
        inventariosApi.listar({ idOrganizacion: org.idOrganizacion }),
      ]);
      const atendidas = solicitudes.filter((s) => ['aprobada', 'entregada'].includes(String(s.estadoSolicitud).toLowerCase())).length;
      pintar(detalle, html`
        <div class="detalle__encabezado"><div>
          <h2 class="detalle__titulo">${org.nombreOrganizacion}</h2>
          <p class="detalle__subtitulo">${org.correoOrganizacion ?? 'Sin correo registrado'}</p></div></div>
        ${metricas([['Solicitudes', solicitudes.length], ['Atendidas', atendidas], ['En almacén', numero(sumar(inventarios, 'cantidadDisponible'))]])}
        ${datos([
          ['Tipo', org.tipoOrganizacion], ['Responsable', org.responsableOrganizacion], ['Teléfono', org.telefonoOrganizacion],
          ['Inventarios', inventarios.length],
          ['Dirección', direccion(org.calleOrganizacion, org.numeroExteriorOrganizacion, org.numeroInteriorOrganizacion,
            org.coloniaOrganizacion, org.codigoPostalOrganizacion, org.municipioOrganizacion, org.estadoOrganizacion)],
          ['Cuenta vinculada', org.idUsuario ? 'Sí' : 'No'],
        ])}
        <p class="detalle__nota">«En almacén» es la suma de la cantidad disponible de sus inventarios.</p>
        <div class="detalle__acciones no-imprimir">
          <button type="button" class="boton boton--peligro-texto boton--chico" data-eliminar>Eliminar</button>
          <button type="button" class="boton boton--contorno boton--chico" data-editar>Editar</button>
        </div>`);
      detalle.querySelector('[data-editar]').addEventListener('click', () => editar(org));
      detalle.querySelector('[data-eliminar]').addEventListener('click', () => eliminar(org));
    } catch (error) {
      mostrarError(detalle, error, () => mostrarDetalle(org));
    }
  }

  function editar(org) {
    abrirFormulario({
      titulo: 'Editar organización',
      contenido: `<div class="rejilla-form">${camposOrganizacion(org)}</div>`,
      alGuardar: async (formulario) => {
        const actualizada = await organizacionesApi.actualizar(org.idOrganizacion, formulario);
        avisar('Organización actualizada', 'exito');
        await cargar();
        mostrarDetalle(actualizada);
      },
    });
  }

  async function eliminar(org) {
    const ok = await confirmar({
      titulo: 'Eliminar organización',
      mensaje: `Se eliminará «${org.nombreOrganizacion}». Si tiene solicitudes o inventarios, el sistema no lo permitirá.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      await organizacionesApi.eliminar(org.idOrganizacion);
      avisar('Organización eliminada', 'exito');
      seleccionada = null;
      detalle.innerHTML = '<p class="estado__texto">Selecciona un registro para ver su información.</p>';
      cargar();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  cargar();
}
