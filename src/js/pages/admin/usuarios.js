import { rolesApi, usuariosApi } from '../../api/usuarios.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar, confirmar, mensajeDeError } from '../../ui/avisos.js';
import { camposCuenta } from '../../ui/campos-entidades.js';
import { html } from '../../ui/dom.js';
import { mostrarCargando, mostrarError, mostrarVacio } from '../../ui/estados.js';
import { campo } from '../../ui/formularios.js';
import { claseInsignia, fecha, nombreCompleto } from '../../ui/formato.js';
import { abrirFormulario } from '../../ui/modal.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';

const panel = montarPanel({
  rol: ROLES.ADMIN,
  pagina: 'usuarios',
  titulo: 'Usuarios generales',
  descripcion: 'Usuarios activos y registrados en la plataforma.',
});

if (panel) {
  const { contenido, acciones, sesion } = panel;
  let roles = [];
  let cargado = false;
  const filtros = { estado: '', buscar: '', idRol: '' };

  contenido.innerHTML = `
    <div class="seccion">
      <div class="herramientas no-imprimir">
        <div class="chips" role="group" aria-label="Filtrar por estado">
          <button type="button" class="chip" data-estado="" aria-pressed="true">Todos</button>
          <button type="button" class="chip" data-estado="Activo" aria-pressed="false">Activos</button>
          <button type="button" class="chip" data-estado="Inactivo" aria-pressed="false">Dados de baja</button>
        </div>
        ${campo('buscar', 'Buscar', { tipo: 'search', placeholder: 'Nombre o correo' })}
        <div class="campo campo--corto"><label class="campo__etiqueta" for="filtro-rol">Rol</label>
          <select class="selector" id="filtro-rol"><option value="">Todos</option></select></div>
      </div>
      <div data-lista></div>
    </div>`;

  const lista = contenido.querySelector('[data-lista]');
  const selectorRol = contenido.querySelector('#filtro-rol');
  mostrarVacio(lista, { titulo: 'No hay datos a mostrar', texto: 'Pulsa «Mostrar listado» para cargar la información.' });

  agregarAccion(acciones, 'Imprimir datos', 'boton--texto', () => window.print());
  agregarAccion(acciones, 'Nuevo usuario', 'boton--contorno', abrirNuevo);
  agregarAccion(acciones, 'Mostrar listado', 'boton--primario', cargar);

  rolesApi.listar()
    .then((datos) => {
      roles = datos;
      selectorRol.insertAdjacentHTML('beforeend', roles.map((r) => html`<option value="${r.idRol}">${r.nombreRol}</option>`.__html).join(''));
    })
    .catch((error) => avisar(mensajeDeError(error), 'error'));

  contenido.querySelectorAll('[data-estado]').forEach((chip) => chip.addEventListener('click', () => {
    contenido.querySelectorAll('[data-estado]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    filtros.estado = chip.dataset.estado;
    if (cargado) cargar();
  }));
  let espera;
  contenido.querySelector('input[name="buscar"]').addEventListener('input', (e) => {
    filtros.buscar = e.target.value.trim();
    clearTimeout(espera);
    espera = setTimeout(() => cargado && cargar(), 350);
  });
  selectorRol.addEventListener('change', () => {
    filtros.idRol = selectorRol.value;
    if (cargado) cargar();
  });

  async function cargar() {
    cargado = true;
    mostrarCargando(lista);
    try {
      const usuarios = await usuariosApi.listar(filtros);
      pintarTabla(lista, {
        filas: usuarios,
        vacio: { titulo: 'No hay usuarios con esos filtros' },
        columnas: [
          { titulo: 'Nombre', valor: (u) => nombreCompleto(u.nombreUsuario, u.apUsuario, u.amUsuario) },
          { titulo: 'Rol', valor: (u) => u.nombreRol },
          { titulo: 'Correo', valor: (u) => u.correoUsuario },
          { titulo: 'Fecha de registro', valor: (u) => fecha(u.fechaRegistro) },
          { titulo: 'Estado', valor: (u) => insignia(u.estado, claseInsignia(u.estado)) },
          {
            titulo: 'Acciones', clase: 'no-imprimir',
            valor: (u) => (u.idUsuario === sesion.idUsuario ? html`<span class="campo__ayuda">Tu cuenta</span>` : html`
              <div class="acciones-celda">
                <button type="button" class="boton boton--texto boton--chico" data-accion="estado" data-id="${u.idUsuario}">
                  ${u.estado?.toLowerCase() === 'activo' ? 'Dar de baja' : 'Reactivar'}</button>
                <button type="button" class="boton boton--texto boton--chico" data-accion="rol" data-id="${u.idUsuario}">Cambiar rol</button>
                <button type="button" class="boton boton--peligro-texto boton--chico" data-accion="eliminar" data-id="${u.idUsuario}">Eliminar</button>
              </div>`),
          },
        ],
      });
      lista.querySelectorAll('[data-accion]').forEach((boton) => boton.addEventListener('click', () => {
        const usuario = usuarios.find((u) => String(u.idUsuario) === boton.dataset.id);
        ({ estado: cambiarEstado, rol: cambiarRol, eliminar })[boton.dataset.accion](usuario);
      }));
    } catch (error) {
      mostrarError(lista, error, cargar);
    }
  }

  async function cambiarEstado(usuario) {
    const activo = usuario.estado?.toLowerCase() === 'activo';
    const ok = await confirmar({
      titulo: activo ? 'Dar de baja usuario' : 'Reactivar usuario',
      mensaje: activo
        ? `${usuario.correoUsuario} ya no podrá iniciar sesión.`
        : `${usuario.correoUsuario} podrá volver a iniciar sesión.`,
      textoConfirmar: activo ? 'Dar de baja' : 'Reactivar',
      peligro: activo,
    });
    if (!ok) return;
    try {
      await usuariosApi.cambiarEstado(usuario.idUsuario, activo ? 'Inactivo' : 'Activo');
      avisar('Estado actualizado', 'exito');
      cargar();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  function cambiarRol(usuario) {
    abrirFormulario({
      titulo: 'Cambiar rol',
      ancho: 'modal--chico',
      contenido: `<p class="modal__texto">${html`${usuario.correoUsuario}`.__html}</p><br>
        ${campo('idRol', 'Nuevo rol', { tipo: 'select', requerido: true, valor: usuario.idRol, opciones: roles.map((r) => [r.idRol, r.nombreRol]), atributos: 'data-tipo="numero"' })}`,
      alGuardar: async ({ idRol }) => {
        await usuariosApi.cambiarRol(usuario.idUsuario, idRol);
        avisar('Rol actualizado. El cambio aplica en su próximo inicio de sesión.', 'exito');
        cargar();
      },
    });
  }

  async function eliminar(usuario) {
    const ok = await confirmar({
      titulo: 'Eliminar usuario',
      mensaje: `Se eliminará la cuenta ${usuario.correoUsuario}. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      await usuariosApi.eliminar(usuario.idUsuario);
      avisar('Usuario eliminado', 'exito');
      cargar();
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  function abrirNuevo() {
    abrirFormulario({
      titulo: 'Nuevo usuario',
      contenido: `<div class="rejilla-form">${camposCuenta({}, { conContrasena: true })}
        ${campo('idRol', 'Rol', { tipo: 'select', requerido: true, opciones: [['', 'Selecciona el rol'], ...roles.map((r) => [r.idRol, r.nombreRol])], atributos: 'data-tipo="numero"' })}</div>`,
      textoGuardar: 'Crear usuario',
      alAbrir: (formulario) => {
        const confirmacion = formulario.elements.confirmacion;
        confirmacion.addEventListener('input', () => confirmacion.setCustomValidity(
          confirmacion.value !== formulario.elements.contrasena.value ? 'Las contraseñas no coinciden.' : ''));
      },
      alGuardar: async ({ confirmacion, ...datos }) => {
        await usuariosApi.crear(datos);
        avisar('Usuario creado', 'exito');
        cargar();
      },
    });
  }
}
