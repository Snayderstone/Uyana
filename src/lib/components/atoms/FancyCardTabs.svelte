<!-- ====== BLOQUE DROP-IN: Cards en columna con panel por item ====== -->
<script>
  // EDITA tus items aquí
  let items = [
    { title: 'Unidad de Administración Financiera', text: 'Es responsable de planificar, gestionar y ejecutar los procesos de adquisición de bienes, servicios y personal requeridos para los proyectos de investigación de la UCE. Elabora y controla el Plan Anual de Contratación (PAC-DI), asesora técnicamente a los directores de proyectos en la elaboración de términos de referencia y presupuestos, y supervisa la ejecución presupuestaria. Garantiza que todas las contrataciones se realicen de manera transparente, eficiente y conforme a la normativa nacional e institucional.' },
    { title: 'Unidad de Investigación Formativa', text: 'Promueve la formación en competencias básicas de investigación a través de proyectos Semilla, que son investigaciones iniciales de corta duración y bajo financiamiento. Coordina talleres de formulación de protocolos, análisis de datos y redacción científica, aprueba y financia proyectos, y realiza seguimiento técnico y administrativo. Fomenta la publicación de resultados en revistas indexadas y su difusión en eventos académicos, contribuyendo a consolidar la cultura investigativa en la UCE.' },
    { title: 'Unidad de Formación Continua en Investigación', text: 'Fortalece las capacidades investigativas de los docentes mediante cursos, talleres y programas formativos en metodología de investigación, análisis de datos, redacción científica y publicación. Implementa modalidades presenciales, semipresenciales y virtuales, acreditando a los participantes como tutores de trabajos de investigación de pregrado y posgrado. También organiza ciclos de conferencias y actividades académicas que fomentan la actualización y el intercambio de conocimientos.' },
    { title: 'Unidad de Proyectos Avanzados', text: 'Coordina y supervisa proyectos científicos avanzados propuestos por docentes, asegurando su calidad científica, rigor académico y relevancia social. Gestiona iniciativas financiadas por fondos de la UCE, externos o de facultades, así como proyectos de doctorado, implementando procedimientos para su registro, seguimiento, evaluación y cierre. La unidad vela por que los proyectos se desarrollen conforme a estándares éticos y técnicos, y que sus resultados se difundan adecuadamente.' },
    { title: 'Unidad de Divulgación Científica', text: 'Se encarga de difundir los resultados de investigación, la evidencia científica, la innovación tecnológica y la producción artística de la Universidad Central del Ecuador hacia la academia y la sociedad. Su principal medio es la revista cuatrimestral Investiga UCE, que informa sobre actividades de investigación, innovación, arte y cultura. La unidad gestiona un repositorio digital con acceso a números anteriores, artículos y equipo editorial, y coordina el trabajo de comunicación para asegurar la visibilidad y el impacto del conocimiento generado.' },
  ];

  let active = -1;

  /** @param {number} i */
  function select(i) {
    active = (active === i) ? -1 : i; // click de nuevo cierra
  }

  function closeOnLeave() {
    active = -1;
  }
</script>

<!-- Contenedor general (se cierra al sacar el puntero) -->
<div class="cards-stack" on:mouseleave={closeOnLeave} style="--accent: var(--color--primary); --card-width: min(720px, 100%); --gap: 14px;">
  <div class="stack-inner">
    {#each items as it, i}
      <!-- CARD (título) -->
      <button
        class="card"
        on:click={() => select(i)}
        data-active={active === i}
        title={it.title}
      >
        <span class="card-title">{it.title}</span>
      </button>

      <!-- PANEL (debajo de la card activa) -->
      {#if active === i}
        <div class="panel open" aria-hidden="false">
          <div class="panel-inner">
            <p>{it.text}</p>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style lang="scss">
  /* ====== Layout en columna, uniforme y centrado ====== */
  .cards-stack {
    --accent: var(--color--secondary);
    --card-width: min(720px, 100%); /* ajusta el ancho uniforme aquí */
    --gap: 14px;

    display: flex;
    justify-content: center;
    padding: 4px;
  }

  .stack-inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;   /* centra el stack */
    gap: var(--gap);
  }

  /* ====== Card (título) ====== */
  .card {
    width: var(--card-width);
    position: relative;
    border: none;
    background: transparent;
    color: inherit;
    padding: 16px 18px;
    border-radius: 12px;
    cursor: pointer;
    outline: none;
    isolation: isolate;

    /* sombra base suave */
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: transform 120ms ease, box-shadow 160ms ease, background 160ms ease;

    text-align: center; /* títulos centrados */
  }

  .card-title {
    font-weight: 600;
    line-height: 1.35;
    /* permite saltos de línea para títulos largos */
    white-space: normal;
    word-wrap: break-word;
  }

  /* borde + halo sin modificar el layout (pseudo-elemento) */
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    box-shadow:
      inset 0 0 0 2px transparent,   /* borde interno */
      0 0 0 0 transparent,           /* anillo externo */
      0 0 0 0 transparent;           /* halo */
    transition: box-shadow 180ms ease, opacity 180ms ease;
  }

  .card:hover {
    transform: translateY(-1px);
  }
  .card:hover::after {
    opacity: 1;
    box-shadow:
      inset 0 0 0 1px var(--accent),
      0 0 0 1px var(--accent),
      0 6px 18px var(--accent); /* halo */
  }

  .card[data-active="true"]::after {
    opacity: 1;
    box-shadow:
      inset 0 0 0 2px var(--accent),
      0 0 0 2px var(--accent),
      0 10px 24px var(--accent);
  }

  /* ====== Panel (debajo de la card activa) ====== */
  .panel {
    width: var(--card-width);
    position: relative;
    border-radius: 12px;
    overflow: clip;

    /* animación sin Svelte: grid-rows 0fr -> 1fr */
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 200ms ease, opacity 160ms ease, transform 160ms ease;
    opacity: 0;
    transform: translateY(-4px);
  }
  .panel.open {
    grid-template-rows: 1fr;
    opacity: 1;
    transform: translateY(0);
  }

  .panel::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    box-shadow:
      inset 0 0 0 1px var(--accent),
      0 0 0 1px var(--accent),
      0 10px 28px var(--accent);
    opacity: 0.8;
  }

  .panel-inner {
    overflow: hidden; /* necesario para 0fr/1fr */
    background: var(--panel-bg, var(--color--post-page-background, #fff));
    padding: 18px 20px;
    line-height: 1.55;
    text-align: center; /* texto centrado por uniformidad */
  }

  @media (max-width: 520px) {
    .card { padding: 14px 14px; border-radius: 10px; }
    .panel-inner { padding: 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .panel {
      transition: none !important;
    }
  }
</style>
