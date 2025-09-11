<!-- src/lib/components/molecules/TubeBarChart.svelte -->
<script lang="ts">
  import AxisY from '../atoms/AxisY.svelte';
  import AxisX from '../atoms/AxisX.svelte';
  import TestTubeBar from '../atoms/TestTubeBar.svelte';

  export let data: Array<{ label: string; value: number; colorVarName?: string | null }> = [];
  export let unit = '';
  export let title = '';

  export let width = 640;
  export let height = 360;

  export let marginTop = 24;
  export let marginRight = 16;
  export let marginBottom = 100;
  export let marginLeft = 56;

  export let axisYWidth = 56;
  export let axisXHeight = 56;

  export let yMin = 0;
  export let yMax: number | null = null;
  export let yTickCount = 5;
  export let xRotate = 0;
  export let xLabel = '';
  export let yLabel = '';
  export let showGrid = true;

  export let tubeWidth: number | null = null;
  export let tubeGapRatio = 0.3;
  export let tubeCornerRatio = 0.5;
  export let glassOpacity = 0.35;

  export let waveHeight = 8;
  export let waveSpeed = 3.5;
  export let bubbles = 8;

  export let tubeLabelSpace = 28;

  // Perf forwarding
  export let performanceMode: 'high' | 'balanced' | 'low' = 'balanced';
    //===================== Cálculos reactivos para el tooltip ==========
  let tooltip = { show: false, x: 0, y: 0, text: '' };
  let chartEl: HTMLDivElement; // referencia al contenedor

  $: W = Math.max(200, width);
$: H = Math.max(180, height + axisXHeight);

  $: mlEff = Math.max(marginLeft, axisYWidth);
  $: mbEff = Math.max(marginBottom, axisXHeight);
  $: mtEff = Math.max(0, marginTop);
  $: mrEff = Math.max(0, marginRight);

  $: innerW = Math.max(1, W - mlEff - mrEff);
  $: innerH = Math.max(1, H - mtEff - mbEff);

  $: categories = data.map(d => d.label);

  $: maxData = Math.max(1, ...data.map(d => d.value || 0));
  $: yMaxEff = yMax == null ? Math.ceil(maxData * 1.1) : yMax;
  $: yMinEff = Math.min(yMin, yMaxEff - 1);

  $: n = Math.max(0, data.length);
  $: cellW = n > 0 ? innerW / n : innerW;
  $: gap = Math.min(cellW * tubeGapRatio, cellW * 0.5);
  $: tubeW = tubeWidth ?? Math.max(8, cellW - gap);

  const xPos = (i: number) => mlEff + i * cellW + (cellW - tubeW) / 2;
</script>

<div
  class="tube-chart"
  bind:this={chartEl}
  style="
    --bg: var(--color--card-background, #ffffff);
    --text: var(--color--text, #1c1e26);
    --text-shade: var(--color--text-shade, #5d5f65);
    --shadow: var(--card-shadow, 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06));
    --radius: var(--surface-radius, 0.75rem);
    --padding: var(--surface-padding, 1rem);
  "
>
  {#if title}
    <h3 class="tube-chart__title">{title}</h3>
  {/if}

  <svg class="tube-chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
    <!-- Plano -->
    <rect
      x={mlEff}
      y={mtEff}
      width={innerW}
      height={innerH}
      rx="8" ry="8"
      fill="color-mix(in srgb, var(--bg) 95%, transparent)"
      stroke="color-mix(in srgb, var(--text) 10%, transparent)"
      stroke-width="1"
      vector-effect="non-scaling-stroke"
      shape-rendering="crispEdges"
    />

    <!-- Eje Y -->
    <AxisY
      height={innerH}
      min={yMinEff}
      max={yMaxEff}
      tickCount={yTickCount}
      {unit}
      label={yLabel}
      align="left"
      gridWidth={showGrid ? innerW : 0}
      svgWidth={innerW}
      svgHeight={innerH}
      x={mlEff}
      y={mtEff}
      padTop={8}
      padBottom={8}
      labelInsideOffset={18}
    />

    <!-- Título del eje Y en el margen (si quieres mantenerlo también fuera) -->
    {#if yLabel || unit}
      <text
        x={mlEff - Math.max(12, axisYWidth * 0.5)}
        y={mtEff + innerH / 2}
        transform={`rotate(-90, ${mlEff - Math.max(12, axisYWidth * 0.5)}, ${mtEff + innerH / 2})`}
        text-anchor="middle"
        fill="var(--axis-title, var(--text, #1c1e26))"
        font-size="var(--axis-title-size, 0.8rem)"
        font-weight="700"
        style="letter-spacing:0.05em; text-transform:uppercase;"
      >
        {yLabel}{unit ? ` (${unit})` : ''}
      </text>
    {/if}

    <!-- Eje X -->
    <AxisX
      width={innerW}
      height={axisXHeight}
      {categories}
      rotate={xRotate}
      label={xLabel}
      svgWidth={innerW}
      svgHeight={axisXHeight}
      x={mlEff}
      y={mtEff + innerH}
    />

    <!-- Tubos -->
    {#each data as d, i}
      <g transform={`translate(${xPos(i)}, ${mtEff})`}
      on:mouseenter={(e) => {
    const rect = chartEl.getBoundingClientRect();
    tooltip = {
      show: true,
      x: e.clientX - rect.left + 10, // relativo al chart
      y: e.clientY - rect.top - 20, // relativo al chart
      text: `${d.label}: ${d.value} ${unit}`
    };
  }}
  on:mousemove={(e) => {
    const rect = chartEl.getBoundingClientRect();
    tooltip = {
      ...tooltip,
      x: e.clientX - rect.left - 150,
      y: e.clientY - rect.top - 40
    };
  }}
  on:mouseleave={() => (tooltip.show = false)}
      >
        <TestTubeBar
          width={tubeW}
          height={innerH}
          svgWidth={tubeW}
          svgHeight={innerH}
          labelSpace={tubeLabelSpace}
          showLabel={false}
          strokeWidth={2}
          {glassOpacity}
          cornerRatio={tubeCornerRatio}
          value={d.value}
          max={yMaxEff}
          label={d.label}
          unit={unit}
          colorVarName={d.colorVarName ?? '--color--secondary'}  
          colorFallback="currentColor"
          {waveHeight}
          waveSpeed={waveSpeed}
          {bubbles}
          performanceMode={performanceMode}
        />
      </g>
    {/each}
  </svg>
  {#if tooltip.show}
  <div
    class="chart-tooltip"
    style="top:{tooltip.y}px; left:{tooltip.x}px;"
  >
    {tooltip.text}
  </div>
{/if}
</div>

<style>
  .tube-chart {
    background: color-mix(in srgb, var(--bg), transparent 0%);
    border-radius: var(--radius);
    padding: var(--padding);
    box-shadow: var(--shadow);
    color: var(--text);
    position: relative; /* asegura stacking context */
  overflow: visible;  /* deja salir el tooltip */
  }
  .tube-chart__title {
    margin: 0 0 0.75rem 0;
    font-size: var(--font-size-md, 1rem);
    font-weight: 700;
    color: var(--text);
    letter-spacing: 0.02em;
  }
  .tube-chart__svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .chart-tooltip {
  position: absolute;
  background: var(--color--card-background);
  border: 1px solid var(--color--text-shade);
  padding: 6px 10px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  pointer-events: none;
  font-size: 0.85rem;
  font-weight: 500;
  z-index: 2000;
}

</style>
