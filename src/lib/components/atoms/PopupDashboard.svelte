<!-- src/lib/components/atoms/PopupDashboard.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import CircularStatus from "$lib/components/molecules/CircularStatus.svelte";
  import TubeBarChart from "$lib/components/molecules/TubeBarChart.svelte";
  import { obtenerEstadisticasPorFacultad } from "$lib/services/proyectosService";

  const dispatch = createEventDispatcher();

  // Props
  export let facultad: string;
  export const tipo: string = "participacion"; // "participacion" o "estados" - para referencia externa

  // Estado interno
  let loading = true;
  let error: string | null = null;

  let totalProyectos = 0;
  let cantidadFacultad = 0;
  let estados = { ejecucion: 0, cierre: 0, cerrados: 0 };

  // Para el carrusel
  let page = 0;

  // Gráficos disponibles
  let graficos: { titulo: string; componente: any }[] = [];

  onMount(async () => {
    try {
      loading = true;
      const stats = await obtenerEstadisticasPorFacultad(facultad);

      totalProyectos = stats.totalProyectos;
      cantidadFacultad = stats.cantidadFacultad;
      estados = stats.estados;

      graficos = [
        {
          titulo: "Participación en el total",
          componente: CircularStatus, // Usamos componente directamente
        },
        {
          titulo: "Distribución por estados",
          componente: TubeBarChart,
        },
      ];
    } catch (err) {
      console.error(">>Mijn: Error cargando dashboard:", err);
      error = "No se pudieron cargar los datos";
    } finally {
      loading = false;
    }
  });

  // Datos dinámicos para cada gráfico
  function getPropsForGrafico(grafico) {
    if (grafico.componente === CircularStatus) {
      return {
        title: "Proyectos Investigación",
        value: cantidadFacultad,
        total: totalProyectos,
        unit: "#",
        status: "success",
        size: "md",
        opacity: 0.8,
        showValueInside: true,
        showDetailsBelow: true,
      };
    }

    if (grafico.componente === TubeBarChart) {
      return {
        data: [
          { label: "Ejecución", value: estados.ejecucion, colorVarName: "--color--primary" },
          { label: "Cierre", value: estados.cierre, colorVarName: "--color--secondary" },
          { label: "Cerrados", value: estados.cerrados, colorVarName: "--color--callout-accent--success" },
        ],
        unit: "#",
        title: "Estados de los proyectos",
        width: 350,
        height: 420,
        axisYWidth: 0,
        axisXHeight: 40,
        marginTop: 20,
        marginRight: 20,
        yMin: 0,
        yMax: Math.max(estados.ejecucion, estados.cierre, estados.cerrados, 1),
        yTickCount: 5,
        xRotate: 0,
        xLabel: "Estado",
        yLabel: "Cantidad",
        showGrid: true,
        tubeGapRatio: 0.8,
        tubeCornerRatio: 0.9,
        glassOpacity: 0.8,
        waveHeight: 6,
        waveSpeed: 2,
        bubbles: 30,
      };
    }

    return {};
  }
</script>

<div class="dashboard-popup">
  <header>
    <h3>{facultad}</h3>
    <button class="close-btn" on:click={() => dispatch("close")}>✕</button>
  </header>

  {#if loading}
    <p class="loading">Cargando datos...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="carousel">
      <button
        class="nav-btn"
        on:click={() => (page = (page - 1 + graficos.length) % graficos.length)}
      >
        ⟨
      </button>

      <div class="grafico">
        {#if graficos.length > 0}
          <svelte:component this={graficos[page].componente} {...getPropsForGrafico(graficos[page])} />
        {/if}
      </div>

      <button
        class="nav-btn"
        on:click={() => (page = (page + 1) % graficos.length)}
      >
        ⟩
      </button>
    </div>

    <footer>
      <span>{page + 1} / {graficos.length}</span>
      <span>{graficos[page].titulo}</span>
    </footer>
  {/if}
</div>

<style>
  .dashboard-popup {
    background: color-mix(in srgb, var(--color--card-background) 50%, transparent); ;
    border: 1px solid var(--color--primary, #00bcd4);
    box-shadow: 0 0 4px var(--color--callout-accent--info, #00bcd4);
    border-radius: 8px;
    color: white;
    padding: 8px;
    min-width: 300px;
    max-width: 360px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .close-btn {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
  }
  .carousel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }
  .grafico {
    flex: 1;
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn {
    background: #222;
    border: 1px solid var(--color--secondary);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    color: var(--color--secondary);
  }
  footer {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 0.8rem;
    opacity: 0.8;
  }
  .loading {
    text-align: center;
    font-style: italic;
    color: #aaa;
  }
  .error {
    color: red;
    text-align: center;
  }
</style>
