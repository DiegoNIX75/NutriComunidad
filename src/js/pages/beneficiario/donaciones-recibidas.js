import { entregasApi, solicitudesApi } from '../../api/solicitudes.api.js';
import { ROLES } from '../../auth/roles.js';
import { montarPanel } from '../../layout/panel.js';
import { mostrarCargando, mostrarError } from '../../ui/estados.js';
import { claseInsignia, fecha } from '../../ui/formato.js';
import { insignia, pintarTabla } from '../../ui/tabla.js';
import { obtenerMiBeneficiario, pedirPerfil } from './comun.js';

const panel = montarPanel({
  rol: ROLES.BENEFICIARIO,
  pagina: 'recibidas',
  titulo: 'Donaciones recibidas',
  descripcion: 'Historial de apoyos que has recibido.',
});

if (panel) {
  const { contenido } = panel;

  async function cargar() {
    mostrarCargando(contenido);
    try {
      const beneficiario = await obtenerMiBeneficiario();
      if (!beneficiario) {
        pedirPerfil(contenido);
        return;
      }
      // El backend sólo devuelve las entregas de las solicitudes de este beneficiario.
      const [entregas, solicitudes] = await Promise.all([entregasApi.listar(), solicitudesApi.listar()]);
      const motivos = new Map(solicitudes.map((s) => [s.idSolicitud, s.motivo]));
      pintarTabla(contenido, {
        filas: entregas.sort((a, b) => String(b.fechaEntrega).localeCompare(String(a.fechaEntrega))),
        vacio: { titulo: 'Aún no has recibido apoyos', texto: 'Cuando una organización registre una entrega para tus solicitudes aparecerá aquí.' },
        columnas: [
          { titulo: 'Fecha', valor: (e) => fecha(e.fechaEntrega) },
          { titulo: 'Solicitud', valor: (e) => motivos.get(e.idSolicitud) ?? `#${e.idSolicitud}` },
          { titulo: 'Responsable', valor: (e) => e.responsable },
          { titulo: 'Estado', valor: (e) => insignia(e.estado ?? 'Sin estado', claseInsignia(e.estado)) },
          { titulo: 'Observaciones', valor: (e) => e.observaciones },
        ],
      });
    } catch (error) {
      mostrarError(contenido, error, cargar);
    }
  }

  cargar();
}
