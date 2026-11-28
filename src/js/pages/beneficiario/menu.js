import { beneficiariosApi } from '../../api/beneficiarios.api.js';
import { recetasApi } from '../../api/catalogo.api.js';
import { ROLES } from '../../auth/roles.js';
import { agregarAccion, montarPanel } from '../../layout/panel.js';
import { mostrarCargando, mostrarError, mostrarVacio } from '../../ui/estados.js';
import { abrirDetalle } from '../../ui/modal.js';
import { avisar, mensajeDeError } from '../../ui/avisos.js';
import { detalleReceta, tarjetaReceta } from '../../ui/recetas.js';
import { obtenerMiBeneficiario } from './comun.js';

const panel = montarPanel({
  rol: ROLES.BENEFICIARIO,
  pagina: 'menu',
  titulo: 'Menú de la semana',
  descripcion: 'Recetas accesibles con los alimentos disponibles en tu comunidad.',
});

/** Minutos a partir de un texto libre como "30 min", "1 h" o "1 h 20 min" (null si no se entiende). */
function minutos(texto) {
  if (!texto) return null;
  const t = texto.toLowerCase();
  const horas = Number(t.match(/(\d+(?:[.,]\d+)?)\s*h/)?.[1]?.replace(',', '.') ?? 0);
  const mins = Number(t.match(/(\d+)\s*min/)?.[1] ?? (horas ? 0 : t.match(/^\s*(\d+)\s*$/)?.[1] ?? NaN));
  const total = horas * 60 + (Number.isNaN(mins) ? 0 : mins);
  return total || null;
}

if (panel) {
  const { contenido, acciones } = panel;
  let recetas = [];
  let excluidas = new Set();
  let filtro = 'todas';
  let costoPromedio = Infinity;
  let rejilla = false;

  contenido.innerHTML = `
    <div class="chips seccion" role="group" aria-label="Filtrar recetas">
      <button type="button" class="chip" data-filtro="todas" aria-pressed="true">Todas</button>
      <button type="button" class="chip" data-filtro="rapidas" aria-pressed="false">Menos de 30 min</button>
      <button type="button" class="chip" data-filtro="economicas" aria-pressed="false">Bajo costo</button>
    </div>
    <section class="seccion" aria-labelledby="titulo-comunes">
      <div class="seccion__encabezado"><h2 class="seccion__titulo" id="titulo-comunes">Recetas comunes</h2>
        <div class="controles-carrusel" data-controles="comunes">
          <button type="button" class="boton-icono" data-mover="-1" aria-label="Recetas anteriores">‹</button>
          <button type="button" class="boton-icono" data-mover="1" aria-label="Recetas siguientes">›</button></div></div>
      <div data-carrusel="comunes"></div>
    </section>
    <section class="seccion" aria-labelledby="titulo-preferencias">
      <div class="seccion__encabezado"><h2 class="seccion__titulo" id="titulo-preferencias">Según tus preferencias</h2>
        <div class="controles-carrusel" data-controles="preferencias">
          <button type="button" class="boton-icono" data-mover="-1" aria-label="Recetas anteriores">‹</button>
          <button type="button" class="boton-icono" data-mover="1" aria-label="Recetas siguientes">›</button></div></div>
      <p class="campo__ayuda" data-nota-preferencias></p>
      <div data-carrusel="preferencias"></div>
    </section>`;

  const carruseles = {
    comunes: contenido.querySelector('[data-carrusel="comunes"]'),
    preferencias: contenido.querySelector('[data-carrusel="preferencias"]'),
  };
  const nota = contenido.querySelector('[data-nota-preferencias]');
  const botonTodo = agregarAccion(acciones, 'Mostrar todo', 'boton--contorno', () => {
    rejilla = !rejilla;
    botonTodo.textContent = rejilla ? 'Ver en carrusel' : 'Mostrar todo';
    pintar();
  });

  contenido.querySelectorAll('[data-filtro]').forEach((chip) => chip.addEventListener('click', () => {
    contenido.querySelectorAll('[data-filtro]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    filtro = chip.dataset.filtro;
    pintar();
  }));
  contenido.querySelectorAll('[data-controles]').forEach((grupo) => grupo.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-mover]');
    const pista = carruseles[grupo.dataset.controles].querySelector('.recetas');
    if (boton && pista) pista.scrollBy({ left: Number(boton.dataset.mover) * pista.clientWidth * 0.8 });
  }));

  function aplicarFiltro(lista) {
    if (filtro === 'rapidas') return lista.filter((r) => (minutos(r.tiempoPreparacion) ?? Infinity) < 30);
    if (filtro === 'economicas') return lista.filter((r) => r.costoEstimado != null && Number(r.costoEstimado) <= costoPromedio);
    return lista;
  }

  function pintarCarrusel(elemento, lista, vacio) {
    if (!lista.length) {
      mostrarVacio(elemento, vacio);
      return;
    }
    elemento.innerHTML = `<div class="recetas ${rejilla ? 'recetas--rejilla' : ''}">${lista.map((r) => tarjetaReceta(r).__html).join('')}</div>`;
    elemento.querySelectorAll('[data-receta]').forEach((tarjeta) => tarjeta.addEventListener('click', () => verReceta(tarjeta.dataset.receta)));
  }

  function pintar() {
    contenido.querySelectorAll('[data-controles]').forEach((c) => { c.hidden = rejilla; });
    const visibles = aplicarFiltro(recetas);
    pintarCarrusel(carruseles.comunes, visibles, { titulo: 'No hay recetas con este filtro' });
    pintarCarrusel(carruseles.preferencias, visibles.filter((r) => !excluidas.has(r.idReceta)), {
      titulo: 'No hay recetas compatibles', texto: 'Ninguna receta disponible evita todos tus alimentos con alergia.',
    });
  }

  async function verReceta(id) {
    try {
      const receta = await recetasApi.obtener(id);
      abrirDetalle({ titulo: receta.nombreReceta, contenido: detalleReceta(receta).__html });
    } catch (error) {
      avisar(mensajeDeError(error), 'error');
    }
  }

  async function cargar() {
    Object.values(carruseles).forEach((c) => mostrarCargando(c, 'Cargando recetas…'));
    try {
      const [todas, beneficiario] = await Promise.all([recetasApi.listar(), obtenerMiBeneficiario()]);
      recetas = todas;
      const costos = recetas.map((r) => Number(r.costoEstimado)).filter((c) => !Number.isNaN(c) && c > 0);
      costoPromedio = costos.length ? costos.reduce((a, b) => a + b, 0) / costos.length : Infinity;

      // «Según tus preferencias»: se excluyen las recetas que usan algún alimento con alergia registrada.
      excluidas = new Set();
      if (beneficiario) {
        const alergias = await beneficiariosApi.alergias(beneficiario.idBeneficiario);
        const conAlergeno = await Promise.all(alergias.map((a) => recetasApi.listar({ idAlimento: a.idAlimento })));
        conAlergeno.flat().forEach((r) => excluidas.add(r.idReceta));
        nota.textContent = alergias.length
          ? `Se ocultan las recetas que contienen: ${alergias.map((a) => a.nombreAlimento).join(', ')}.`
          : 'Registra tus alergias en «Mi perfil» para filtrar estas recetas.';
      } else {
        nota.textContent = 'Completa tus datos en «Mi perfil» para personalizar estas recetas.';
      }
      pintar();
    } catch (error) {
      Object.values(carruseles).forEach((c) => mostrarError(c, error, cargar));
    }
  }

  cargar();
}
