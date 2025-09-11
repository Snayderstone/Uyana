<!-- src/lib/components/atoms/TestTubeBar.svelte -->
<script lang="ts">
  export let width = 48;
  export let height = 160;
  export let strokeWidth = 2;
  export let glassOpacity = 0.35;
  export let cornerRatio = 0.5;

  export let value = 0;
  export let max = 100;
  export let label = '';
  export let unit = '';

  // color del líquido
  export let colorVarName: string | null = '--color--text';
  // color de las burbujas (puede ser distinto)
  export let colorVarNameText: string | null = '--color--text';
  export let colorFallback = 'currentColor';

  // --- Olas (ya NO se usan si enableWaves=false) ---
  export let waveHeight = 8;
  export let waveSpeed = 3.5;
  export let wavePeriods = 8;

  // Burbujas
  export let bubbles = 8;
  export let bubbleSpeedMin = 2;
  export let bubbleSpeedMax = 5;
  export let bubbleSizeMin = 2;
  export let bubbleSizeMax = 4;

  // tamaño explícito del <svg> y etiqueta inferior opcional
  export let svgWidth: number | null = null;
  export let svgHeight: number | null = null;
  export let labelSpace = 28;
  export let showLabel = false;

  // === Rendimiento ======================================
  export let performanceMode: 'high' | 'balanced' | 'low' = 'balanced';
  $: blurStd = performanceMode === 'high' ? 1.2 : performanceMode === 'balanced' ? 0.8 : 0.5;
  $: bubblesEff = performanceMode === 'high' ? bubbles : performanceMode === 'balanced' ? Math.min(bubbles, 6) : Math.min(bubbles, 3);
  $: wavePeriodsEff = performanceMode === 'high' ? wavePeriods : performanceMode === 'balanced' ? Math.max(6, wavePeriods - 2) : Math.max(4, wavePeriods - 4);
  $: waveSpeedEff = performanceMode === 'low' ? waveSpeed * 1.3 : waveSpeed;
  // ======================================================

  // --- CÓDIGO NUEVO: apagar/encender olas (por defecto apagadas) ---
  export let enableWaves: boolean = false;
  // -----------------------------------------------------------------

  $: W = Math.max(16, width);
  $: H = Math.max(60, height);
  $: rx = Math.min(W * cornerRatio, W / 2);

  $: level = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  $: fillH = H * level;

  $: liquidColor = colorVarName ? `var(${colorVarName}, ${colorFallback})` : colorFallback;
  $: bubbleColor = colorVarNameText ? `var(${colorVarNameText}, ${colorFallback})` : liquidColor;

  const uid = `tube-${Math.random().toString(36).slice(2)}`;

  // (re)sembrar burbujas cuando cambien W, bubblesEff o strokeWidth
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  $: bubbleSeeds = Array.from({ length: bubblesEff }, () => ({
    x: rand(strokeWidth + 2, W - strokeWidth - 2),
    delay: rand(0, 2),
    dur: rand(bubbleSpeedMin, bubbleSpeedMax),
    r: rand(bubbleSizeMin, bubbleSizeMax)
  }));

  // Generador de ola (solo se usará si enableWaves=true)
  const makeWave = (periodWidth: number, amp: number, periods: number) => {
    const A = Math.max(0.1, amp);
    const L = periodWidth;
    let d = `M 0 0`;
    for (let i = 0; i < periods; i++) {
      d += ` c ${L / 4} ${-A}, ${(L * 3) / 4} ${A}, ${L} 0`;
    }
    d += ` L ${periods * L} ${H} L 0 ${H} Z`;
    return d;
  };
</script>

<svg
  class="test-tube"
  width={svgWidth ?? W}
  height={svgHeight ?? (H + (showLabel && label ? labelSpace : 0))}
  viewBox={`0 0 ${W} ${H + (showLabel && label ? labelSpace : 0)}`}
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label={`${label ? label + ': ' : ''}${value}${unit ? ' ' + unit : ''} de ${max}${unit ? ' ' + unit : ''}`}
>
  <title>{label ? `${label}: ` : ''}{value}{unit ? ` ${unit}` : ''} / {max}{unit ? ` ${unit}` : ''}</title>

  <defs>
    <clipPath id="{uid}-clip">
      <rect
        x={strokeWidth}
        y={strokeWidth}
        width={W - 2 * strokeWidth}
        height={H - strokeWidth}
        rx={rx - strokeWidth / 2}
        ry={rx - strokeWidth / 2}
      />
    </clipPath>

    <filter id="{uid}-glass" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation={blurStd} result="blur" />
      <feOffset dx="0" dy="1" result="off" />
      <feMerge><feMergeNode in="off" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>

    <linearGradient id="{uid}-liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color={liquidColor} stop-opacity="0.95" />
      <stop offset="80%" stop-color={liquidColor} stop-opacity="0.8" />
      <stop offset="100%" stop-color={liquidColor} stop-opacity="0.75" />
    </linearGradient>

    <linearGradient id="{uid}-glass-shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="white" stop-opacity="0.22" />
      <stop offset="10%"  stop-color="white" stop-opacity="0.08" />
      <stop offset="50%"  stop-color="white" stop-opacity="0" />
      <stop offset="90%"  stop-color="white" stop-opacity="0.06" />
      <stop offset="100%" stop-color="white" stop-opacity="0.16" />
    </linearGradient>

    <!-- CÓDIGO NUEVO: solo definimos el path de ola si enableWaves -->
    {#if enableWaves}
      <path id="{uid}-wavepath" d={makeWave(W, waveHeight, wavePeriodsEff)} />
    {/if}
  </defs>

  <!-- Vidrio -->
  <g filter="url(#{uid}-glass)" aria-hidden="true">
    <rect
      x="0" y="0"
      width={W} height={H}
      rx={rx} ry={rx}
      fill="url(#{uid}-glass-shine)"
      stroke="color-mix(in srgb, var(--text, #1c1e26) 15%, transparent)"
      stroke-width={strokeWidth}
      vector-effect="non-scaling-stroke"
      fill-opacity={glassOpacity}
    />
  </g>

  <!-- Líquido (estático) + burbujas -->
  <g clip-path="url(#{uid}-clip)">
    <rect x="0" y={H - fillH} width={W} height={fillH} fill="url(#{uid}-liquid)" />

    <!-- CÓDIGO NUEVO: olas eliminadas por defecto -->
    {#if enableWaves}
      <!-- Ola 1 -->
      <g transform={`translate(${-W * 3}, ${H - fillH - waveHeight})`} opacity="0.9" shape-rendering="optimizeSpeed">
        <use href={`#${uid}-wavepath`} fill={`url(#${uid}-liquid)`}>
          <animateTransform attributeName="transform" type="translate"
            from={`${-W * 3} 0`} to={`${-W * 2} 0`} dur={`${waveSpeedEff}s`} repeatCount="indefinite" />
        </use>
      </g>
      <!-- Ola 2 (parallax) -->
      <g transform={`translate(${-W * 2.5}, ${H - fillH - waveHeight / 2})`} opacity="0.65" shape-rendering="optimizeSpeed">
        <use href={`#${uid}-wavepath`} fill={`url(#${uid}-liquid)`}>
          <animateTransform attributeName="transform" type="translate"
            from={`${-W * 2.5} 0`} to={`${-W * 3.5} 0`} dur={`${waveSpeedEff * 1.5}s`} repeatCount="indefinite" />
        </use>
      </g>
    {/if}

    {#each bubbleSeeds as b, i (i)}
      <circle
        cx={b.x}
        cy={H - strokeWidth}
        r={b.r}
        fill-opacity="0.8"
        fill={bubbleColor}
        stroke="white"
        stroke-opacity="0.25"
      >
        <animate attributeName="cy" from={H - strokeWidth} to={H - fillH + rx} dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.95;0" dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite" />
        <animate attributeName="r" values={`${b.r};${b.r * 0.7};${b.r}`} dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite" />
        <animate attributeName="cx" values={`${b.x - 3};${b.x + 3};${b.x - 3}`} dur={`${b.dur * 1.2}s`} begin={`${b.delay}s`} repeatCount="indefinite" />
      </circle>
    {/each}
  </g>

  {#if showLabel && label}
    <g transform={`translate(${W / 2}, ${H + labelSpace / 2})`}>
      <text
        text-anchor="middle"
        dominant-baseline="middle"
        fill="var(--text, #1c1e26)"
        font-size="var(--axis-font-size, 0.8rem)"
        font-weight="600"
      >
        {label}{unit ? ` (${unit})` : ''} / {max}{unit ? ` ${unit}` : ''}
      </text>
    </g>
  {/if}
</svg>

<style>
  .test-tube { display: block; }
</style>
