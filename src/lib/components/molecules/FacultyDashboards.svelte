<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Estado de dashboards abiertos
  let activeDashboards: { tipo: string; facultad: string }[] = [];

  onMount(() => {
    const handlerOpen = (e: any) => {
      const { facultad, tipo } = e.detail;
      // Evitar duplicados
      if (!activeDashboards.find(d => d.tipo === tipo && d.facultad === facultad)) {
        activeDashboards = [...activeDashboards, { facultad, tipo }];
      }
    };

    const handlerClose = () => {
      activeDashboards = [];
    };

    document.addEventListener('open-dashboard', handlerOpen);
    document.addEventListener('close-dashboards', handlerClose);

    return () => {
      document.removeEventListener('open-dashboard', handlerOpen);
      document.removeEventListener('close-dashboards', handlerClose);
    };
  });

  function close(tipo: string) {
    activeDashboards = activeDashboards.filter(d => d.tipo !== tipo);
  }
</script>

<div class="faculty-dashboards">
  {#each activeDashboards as dash (dash.tipo)}
    <div class="dashboard-panel {dash.tipo}">
      <div class="header">
        <h4>{dash.tipo} - {dash.facultad}</h4>
        <button on:click={() => close(dash.tipo)}>×</button>
      </div>
      <div class="content">
        <!-- Aquí luego metemos tus componentes -->
        <p>Dashboard: {dash.tipo}</p>
      </div>
    </div>
  {/each}
</div>

<style>
  .faculty-dashboards {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none; /* deja que el mapa siga interactivo */
  }
  .dashboard-panel {
    position: absolute;
    top: 100px; /* ajusta según el popup principal */
    width: 320px;
    min-height: 200px;
    background: var(--color--card-background, white);
    border: 2px solid var(--color--primary);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    pointer-events: auto;
    transition: transform 0.3s ease;
  }
  .dashboard-panel.left { left: -340px; }
  .dashboard-panel.right { left: 340px; }
  .dashboard-panel .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
