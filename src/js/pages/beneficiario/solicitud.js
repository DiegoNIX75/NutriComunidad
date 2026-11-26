import { organizacionesApi } from '../../api/organizaciones.api.js';
import { solicitudesApi } from '../../api/solicitudes.api.js';
import { ROLES } from '../../auth/roles.js';
import { montarPanel } from '../../layout/panel.js';
import { mensajeDeError } from '../../ui/avisos.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { alertaEn, campo, leerFormulario, ocupado, validarFormulario } from '../../ui/formularios.js';
import { fecha, hoyISO } from '../../ui/formato.js';
import { obtenerMiBeneficiario, pedirPerfil } from './comun.js';

const panel = montarPanel({
  rol: ROLES.BENEFICIARIO,
  pagina: 'solicitud',
  titulo: 'Enviar solicitud',
  descripcion: 'Solicita un apoyo alimentario a las organizaciones de tu zona.',
});

if (panel) {
  const { contenido } = panel;

  async function cargar() {
    mostrarCargando(contenido);
    try {
      const [beneficiario, organizaciones] = await Promise.all([obtenerMiBeneficiario(), organizacionesApi.listar()]);
      if (!beneficiario) {
        pedirPerfil(contenido);
        return;
      }
      pintarFormulario(beneficiario, organizaciones);
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  function pintarFormulario(beneficiario, organizaciones) {
    const opciones = organizaciones.map((o) => [o.idOrganizacion, [o.nombreOrganizacion, o.municipioOrganizacion].filter(Boolean).join(' · ')]);
    contenido.innerHTML = `
      <div class="columnas">
        <form class="tarjeta" data-form novalidate>
          <div class="rejilla-form">
            ${campo('fecha', 'Fecha de solicitud', { valor: fecha(hoyISO()), atributos: 'readonly' })}
            ${campo('numeroIntegrantes', 'Número de integrantes', { valor: beneficiario.numeroIntegrantes, atributos: 'readonly data-tipo="numero"', ayuda: 'Tomado de tu perfil.' })}
            ${campo('idOrganizacion', 'Organización', {
              tipo: 'select', requerido: true, completo: true, atributos: 'data-tipo="numero" data-mensaje="Elige la organización a la que envías la solicitud."',
              opciones: [['', organizaciones.length ? 'Selecciona la organización' : 'No hay organizaciones registradas'], ...opciones],
            })}
            ${campo('motivo', 'Motivo', { requerido: true, completo: true, atributos: 'maxlength="255" data-mensaje="Describe brevemente el apoyo que necesitas."', placeholder: 'Ej. Despensa básica para la semana' })}
            <div class="campo completo">
              <span class="campo__etiqueta" id="etiqueta-prioridad">Prioridad</span>
              <div class="segmentado" role="radiogroup" aria-labelledby="etiqueta-prioridad">
                <input type="radio" id="prioridad-alta" name="prioridad" value="Alta"><label for="prioridad-alta">Alta</label>
                <input type="radio" id="prioridad-media" name="prioridad" value="Media" checked><label for="prioridad-media">Media</label>
                <input type="radio" id="prioridad-baja" name="prioridad" value="Baja"><label for="prioridad-baja">Baja</label>
              </div>
            </div>
          </div>
          <div data-alerta></div>
          <div class="acciones-form">
            <a class="boton boton--texto" href="/Pages/beneficiario/menu.html">Cancelar</a>
            <button type="submit" class="boton boton--primario">Enviar solicitud</button>
          </div>
        </form>
        <aside class="tarjeta">
          <h2 class="tarjeta__titulo">¿Qué pasa después?</h2>
          <ol class="pasos">
            <li>Una organización revisa tu solicitud según su prioridad.</li>
            <li>Cuando tu apoyo esté listo, la organización registra la entrega.</li>
            <li>Consulta el estado en «Donaciones solicitadas».</li>
          </ol>
        </aside>
      </div>`;

    const formulario = contenido.querySelector('[data-form]');
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      if (!validarFormulario(formulario)) return;
      const boton = formulario.querySelector('[type="submit"]');
      const datos = leerFormulario(formulario);
      alertaEn(formulario.querySelector('[data-alerta]'), '');
      ocupado(boton, true, 'Enviando…');
      try {
        await solicitudesApi.crear({
          fechaSolicitud: hoyISO(),
          motivo: datos.motivo,
          numeroIntegrantes: beneficiario.numeroIntegrantes,
          prioridad: datos.prioridad,
          estadoSolicitud: 'Pendiente',
          idOrganizacion: datos.idOrganizacion,
          idBeneficiario: beneficiario.idBeneficiario,
        });
        window.location.assign('/Pages/beneficiario/donaciones-solicitadas.html?enviada=1');
      } catch (error) {
        alertaEn(formulario.querySelector('[data-alerta]'), mensajeDeError(error));
        ocupado(boton, false);
      }
    });
  }

  cargar();
}
