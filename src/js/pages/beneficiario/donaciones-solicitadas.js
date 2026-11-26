import { organizacionesApi } from '../../api/organizaciones.api.js';
import { solicitudesApi } from '../../api/solicitudes.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { avisar } from '../../ui/avisos.js';
import { html } from '../../ui/dom.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { claseInsignia, fecha } from '../../ui/formato.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';
import { obtenerMiBeneficiario, pedirPerfil } from './comun.js';

const panel = montarPanel({
  rol: ROLES.BENEFICIARIO,
  pagina: 'solicitadas',
  titulo: 'Donaciones solicitadas',
  descripcion: 'Historial de las solicitudes que has enviado.',
});

const FILTROS = [
  ['todas', 'Todas', () => true],
  ['pendientes', 'Pendientes', (s) => ['pendiente', 'en revisión', 'en revision'].includes(s)],
  ['aprobadas', 'Aprobadas', (s) => ['aprobada', 'entregada'].includes(s)],
  ['rechazadas', 'Rechazadas', (s) => s === 'rechazada'],
];

if (panel) {
  const { contenido, acciones } = panel;
  let solicitudes = [];
  let organizaciones = new Map();
  let filtro = 'todas';
  agregarAccion(acciones, 'Nueva solicitud', 'boton--primario', () => window.location.assign('/Pages/beneficiario/solicitud.html'));

  function pintar() {
    const estado = (s) => String(s.estadoSolicitud ?? '').toLowerCase();
    contenido.innerHTML = `<div class="seccion">
      <div class="chips" role="group" aria-label="Filtrar por estado">${FILTROS.map(([id, texto, regla]) => html`
        <button type="button" class="chip" data-filtro="${id}" aria-pressed="${id === filtro}">${texto} (${solicitudes.filter((s) => regla(estado(s))).length})</button>`.__html).join('')}</div>
      <div data-tabla></div></div>`;
    contenido.querySelectorAll('[data-filtro]').forEach((chip) => chip.addEventListener('click', () => {
      filtro = chip.dataset.filtro;
      pintar();
    }));
    const regla = FILTROS.find(([id]) => id === filtro)[2];
    pintarTabla(contenido.querySelector('[data-tabla]'), {
      filas: solicitudes.filter((s) => regla(estado(s))),
      vacio: { titulo: 'No tienes solicitudes en esta categoría', texto: 'Envía una desde «Enviar solicitud».' },
      columnas: [
        { titulo: 'Fecha', valor: (s) => fecha(s.fechaSolicitud) },
        { titulo: 'Motivo', valor: (s) => s.motivo },
        { titulo: 'Organización', valor: (s) => organizaciones.get(s.idOrganizacion) ?? `#${s.idOrganizacion}` },
        { titulo: 'Integrantes', valor: (s) => s.numeroIntegrantes, clase: 'num' },
        { titulo: 'Prioridad', valor: (s) => insignia(s.prioridad, claseInsignia(s.prioridad)) },
        { titulo: 'Estado', valor: (s) => insignia(s.estadoSolicitud ?? 'Sin estado', claseInsignia(s.estadoSolicitud)) },
      ],
    });
  }

  async function cargar() {
    mostrarCargando(contenido);
    try {
      const beneficiario = await obtenerMiBeneficiario();
      if (!beneficiario) {
        pedirPerfil(contenido);
        return;
      }
      const [lista, orgs] = await Promise.all([solicitudesApi.listar(), organizacionesApi.listar()]);
      solicitudes = lista.sort((a, b) => String(b.fechaSolicitud).localeCompare(String(a.fechaSolicitud)));
      organizaciones = new Map(orgs.map((o) => [o.idOrganizacion, o.nombreOrganizacion]));
      pintar();
      if (new URLSearchParams(window.location.search).has('enviada')) {
        avisar('Solicitud enviada. La organización la revisará pronto.', 'exito');
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  cargar();
}
