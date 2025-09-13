<!-- src/lib/components/atoms/AxisX.svelte -->
<script lang="ts">
  export let width = 400;
  export let height = 320;
  export let categories: string[] = [];
  export let label = '';
  export let rotate = 0;

  export let svgWidth: number | null = null;
  export let svgHeight: number | null = null;
  export let x = 0;
  export let y = 0;

  $: W = Math.max(1, width);
  $: H = Math.max(160, height);
  $: n = Math.max(0, categories.length);
  $: step = n > 0 ? W / n : W;

  const xPos = (i: number) => i * step + step / 2;
</script>

<svg
  class="axis-x"
  {x}
  {y}
  width={svgWidth ?? W}
  height={svgHeight ?? H}
  viewBox={`0 0 ${W} ${H}`}
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <!-- Línea base -->
  <line
    class="axis-x__line"
    x1="0"
    y1="1"
    x2={W}
    y2="1"
  />

  <!-- Etiquetas de categorías -->
  {#each categories as c, i}
    <g transform={`translate(${xPos(i)}, ${H - 2})`}>
      <text
        class="axis-x__label"
        text-anchor="end"
        dominant-baseline="hanging"
        transform={`rotate(${rotate}, 0, 0)`}
      >
        {c}
      </text>
    </g>
  {/each}

  <!-- Título del eje -->
  {#if label}
    <text
      class="axis-x__title"
      x={W / 2}
      y={H - 2}
      text-anchor="middle"
    >
      {label}
    </text>
  {/if}
</svg>

<style>
  .axis-x {
    display: block;
  }

  .axis-x__line {
    stroke: var(--axis-color, color-mix(in srgb, var(--text, #1c1e26) 50%, transparent));
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    shape-rendering: crispEdges;

  }

  .axis-x__label {
    fill: var(--axis-label, var(--text, #1c1e26));
    font-size: var(--axis-font-size, 0.8rem);
    font-weight: 600;
  }

  .axis-x__title {
    fill: var(--axis-title, var(--text, #1c1e26));
    font-size: var(--axis-title-size, 0.8rem);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
</style>
