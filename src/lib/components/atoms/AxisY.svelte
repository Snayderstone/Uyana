<!-- src/lib/components/atoms/AxisY.svelte -->
<script lang="ts">
  export let height = 200;
  export let min = 0;
  export let max = 100;
  export let tickCount = 5;
  export let unit = '';
  export let label = '';
  export let align: 'left' | 'right' = 'left';
  export let gridWidth = 0;

  export let svgWidth: number | null = null;
  export let svgHeight: number | null = null;
  export let x = 0;
  export let y = 0;

  // Padding para no cortar extremos y empujar el título dentro del eje
  export let padTop = 8;
  export let padBottom = 8;
  export let labelInsideOffset = 12;

  const fmt = (v: number) => {
    const span = Math.abs(max - min);
    return span >= 10 ? Math.round(v).toString() : v.toFixed(2);
  };

  $: H = Math.max(0, height);
  $: lo = Math.min(min, max);
  $: hi = Math.max(min, max);
  $: n = Math.max(2, Math.round(tickCount));
  $: ticks = Array.from({ length: n }, (_, i) => lo + (i * (hi - lo)) / (n - 1)).reverse();

  // Altura efectiva del eje (restando padding)
  $: Heff = Math.max(0, height - padTop - padBottom);

  // POSICIÓN X DEL TÍTULO DEL EJE (izq/der)
  $: labelX = align === 'left' ? labelInsideOffset : Math.max(0, gridWidth - labelInsideOffset);

  // Posición Y con padding
  const yPosWithPad = (v: number) => {
    const t = (v - lo) / (hi - lo || 1);
    return padTop + (1 - t) * Heff;
  };
</script>

<svg
  class="axis-y"
  x={x}
  y={y}
  width={(svgWidth ?? gridWidth) || 1}
  height={svgHeight ?? H}
  viewBox={`0 0 ${Math.max(1, gridWidth || 1)} ${H}`}
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <line
    x1={align === 'left' ? 0 : gridWidth}
    y1={padTop}
    x2={align === 'left' ? 0 : gridWidth}
    y2={padTop + Heff}
    stroke="var(--axis-color, color-mix(in srgb, var(--text, #1c1e26) 50%, transparent))"
    stroke-width="1"
    vector-effect="non-scaling-stroke"
    shape-rendering="crispEdges"
  />

  {#each ticks as tVal}
    <g transform={`translate(0, ${yPosWithPad(tVal)})`} pointer-events="none">
      {#if gridWidth > 0}
        <line
          x1="0"
          y1="0.5"
          x2={gridWidth}
          y2="0.5"
          stroke="var(--grid-color, color-mix(in srgb, var(--text, #1c1e26) 10%, transparent))"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
          shape-rendering="crispEdges"
        />
      {/if}
      <line
        x1={align === 'left' ? 0 : gridWidth}
        y1="0.5"
        x2={align === 'left' ? 6 : gridWidth - 6}
        y2="0.5"
        stroke="var(--axis-color, color-mix(in srgb, var(--text, #1c1e26) 50%, transparent))"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
        shape-rendering="crispEdges"
      />
      <text
        x={align === 'left' ? 8 : gridWidth - 8}
        y="0"
        dominant-baseline="middle"
        text-anchor={align === 'left' ? 'start' : 'end'}
        fill="var(--axis-label, var(--text, #1c1e26))"
        font-size="var(--axis-font-size, 0.8rem)"
        font-weight="600"
      >
        {fmt(tVal)}
      </text>
    </g>
  {/each}

  {#if label || unit}
    <text
      x={labelX}
      y={padTop}
      transform={`rotate(-90, ${labelX}, ${padTop})`}
      text-anchor="start"
      fill="var(--axis-title, var(--text, #1c1e26))"
      font-size="var(--axis-title-size, 0.8rem)"
      font-weight="700"
      style="letter-spacing:0.05em; text-transform:uppercase;"
    >
      {label}{unit ? ` (${unit})` : ''}
    </text>
  {/if}
</svg>

<style>
  .axis-y { display: block; }
</style>
