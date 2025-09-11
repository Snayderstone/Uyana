<!-- src/lib/components/molecules/ProjectsDashboard.svelte -->
<script lang="ts">
  import type { Proyecto } from '$lib/services/proyectosService';
  import CircularStatus from '../molecules/CircularStatus.svelte';
  import DonutChart from './DonutChart.svelte';
  import TubeBarChart from './TubeBarChart.svelte';

  export let proyectos: Proyecto[] = []; // los filtrados
  export let totalGeneral: number = 167; // quemado por ahora

  // ================== Helpers ==================
  function contarPorCampo<T extends string>(
    lista: Proyecto[],
    key: keyof Proyecto,
    format?: (v: any) => string
  ): { label: string; value: number }[] {
    const counts: Record<string, number> = {};
    for (const p of lista) {
      let v: any = p[key] ?? 'No especificado';
      if (format) v = format(v);
      counts[v] = (counts[v] || 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  function parseYear(dateStr: string) {
    if (!dateStr) return 'No especificado';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return parts[2];
    }
    return 'No especificado';
  }

  function calcularDuracionMeses(inicio: string, fin: string) {
    if (!inicio || !fin) return null;
    const i = inicio.split('/');
    const f = fin.split('/');
    if (i.length !== 3 || f.length !== 3) return null;
    const start = new Date(+i[2], +i[1] - 1, +i[0]);
    const end = new Date(+f[2], +f[1] - 1, +f[0]);
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }

  // ================== Datasets ==================
  // 1. General (filtrados vs total)
  $: dataGeneral = [
    { label: 'Filtrados', value: proyectos.length },
    { label: 'Total general', value: totalGeneral }
  ];

  // 2. Por facultad
  $: dataFacultad = contarPorCampo(proyectos, 'facultad_o_entidad_o_area_responsable');

  // 3. Por tipo de proyecto
  $: dataTipo = contarPorCampo(proyectos, 'tipo_proyecto');

  // 4. Por campo amplio
  $: dataCampo = contarPorCampo(proyectos, 'campo_amplio');

  // 5. Por estado
  $: dataEstado = contarPorCampo(proyectos, 'estado');

  // 6. Por financiamiento
  function formatFinanciamiento(f: string) {
    switch (f) {
      case 'FONDOS_CONCURSABLES_INTERNO_IES': return 'Fondos Concursables';
      case 'ASIGNACION_REGULAR_IES': return 'Asignación Regular';
      default: return f || 'No especificado';
    }
  }
  $: dataFinanciamiento = contarPorCampo(proyectos, 'fuente_financiamiento', formatFinanciamiento);

  // 7. Iniciados por año
  $: dataInicioYear = contarPorCampo(proyectos, 'fecha_inicio', parseYear);

  // 8. Finalizados por año
  $: dataFinYear = contarPorCampo(proyectos, 'fecha_fin_planeado', parseYear);

  // 9. Duración proyectos
  $: dataDuracion = proyectos
    .map(p => calcularDuracionMeses(p.fecha_inicio, p.fecha_fin_planeado))
    .filter(v => v !== null) as number[];
    // 10. Top 10 coordinadores
$: dataCoordinadores = contarPorCampo(proyectos, 'coordinador_director')
  .sort((a, b) => b.value - a.value) // ordenamos de mayor a menor
  .slice(0, 10); // tomamos solo los 10 primeros
  
  // ================= Colorear datasets ==================
  function asignarColores(data: { label: string; value: number }[]) {
  if (!data || data.length === 0) return [];

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));

  return data.map(item => {
    const ratio = item.value / maxVal; // valor relativo al máximo (0–1)

    let colorVarName = '--color--secondary'; // por defecto (medio)
    if (ratio >= 0.75) {
      colorVarName = '--color--callout-accent--success'; // valores grandes
    } else if (ratio >= 0.5) {
      colorVarName = '--color--primary'; // valores medio-altos
    } else if (ratio >= 0.25) {
      colorVarName = '--color--callout-accent--warning'; // valores bajos
    } else {
      colorVarName = '--color--callout-accent--error'; // valores muy bajos
    }

    return { ...item, colorVarName };
  });
}


</script>

<div class="dashboard">
  <!-- 1. Circular filtrados vs total -->
  <CircularStatus
    title="Proyectos filtrados"
    value={proyectos.length}
    total={totalGeneral}
    unit="Proyectos"
    status="primary"
    size="md"
  />

  <!-- 2. Facultades -->
  <TubeBarChart
    title="Proyectos por Facultad"
    data={asignarColores(dataFacultad)}
    yLabel="Proyectos"
    height={300}
    xRotate={-45}
    performanceMode="low"
  />

  <!-- 3. Tipos -->
  <DonutChart
    title="Proyectos por Tipo"
    data={dataTipo}
    width={300}
    height={300}
  />

  <!-- 4. Campos amplios -->
  <TubeBarChart
    title="Proyectos por Campo Amplio"
    data={asignarColores(dataCampo)}
    yLabel="Proyectos"
    height={300}
    performanceMode="low"
  />

  <!-- 5. Estados -->
  <DonutChart
    title="Proyectos por Estado"
    data={dataEstado}
    width={300}
    height={300}
  />

  <!-- 6. Financiamiento -->
  <TubeBarChart
    title="Proyectos por Financiamiento"
    data={asignarColores(dataFinanciamiento)}
    yLabel="Proyectos"
    height={300}
    performanceMode="low"
  />

  <!-- 7. Iniciados por año -->
  <TubeBarChart
    title="Proyectos iniciados por año"
    data={asignarColores(dataInicioYear)}
    yLabel="Proyectos"
    height={300}
    performanceMode="low"
  />

  <!-- 8. Finalizados por año -->
  <TubeBarChart
  title="Proyectos finalizados por año"
  data={asignarColores(dataFinYear)}
  yLabel="Proyectos"
  height={300}
  performanceMode="low"
/>

  <!-- 9. Duración (como histograma simple por intervalos) -->
  <TubeBarChart
    title="Duración de proyectos (meses)"
    data={[
      { label: '0-6', value: dataDuracion.filter(d => d <= 6).length, colorVarName: '--color--primary'  },
      { label: '7-12', value: dataDuracion.filter(d => d > 6 && d <= 12).length, colorVarName: '--color--secondary'  },
      { label: '13-18', value: dataDuracion.filter(d => d > 12 && d <= 18).length, colorVarName: '--color--primary'  },
      { label: '19-24', value: dataDuracion.filter(d => d > 18 && d <= 24).length, colorVarName: '--color--callout-accent--success'  },
      { label: '25+', value: dataDuracion.filter(d => d > 24).length, colorVarName: '--color--callout-accent--error'  },
    ]}
    yLabel="Proyectos"
    height={300}
  />
  <!-- 10. Top 10 Coordinadores -->
<TubeBarChart
  title="Top 10 Coordinadores con más proyectos"
  data={asignarColores(dataCoordinadores)}
  yLabel="Proyectos"
  height={400}
/>

</div>

<style lang="scss">
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}
</style>
