<!-- src/lib/components/atoms/CircularArc.svelte -->
<script lang="ts">
  import GlowPoint from './GlowPoint.svelte';

  /* ====================== PROPS ====================== */
  export let percent: number = 0;          // 0..100 (progreso sobre el arco)
  export let radius: number = 50;          // radio del arco
  export let strokeWidth: number = 10;     // grosor del trazo

  // Color del progreso: usa variable CSS por nombre (con fallback) o color directo
  export let color: string = 'red';
  export let colorVarName: string | null = null;

  // Pista (fondo)
  export let showTrack: boolean = true;
  export let trackColor: string = '#e0e0e0';

  // Glow/halo del arco
  export let glow: boolean = true;
  export let glowOpacity: number = 0.5;
  export let glowWidthBoost: number = 6;

  // Punto luminoso al final del progreso
  export let showGlowPoint: boolean = true;
  export let pointRadius: number = 7;

  // Transición del progreso (ms)
  export let transitionMs: number = 5600;

  /* ===== CÓDIGO NUEVO: control de inicio/longitud del arco ===== */
  // 0° = derecha, 90° = abajo, 180° = izquierda, 270° = arriba
  export let startAngleDeg: number = 180;   // ángulo de inicio (por defecto: izquierda)
  export let sweepAngleDeg: number = 180;   // longitud del arco en grados (180 = semicírculo)
  /* ============================================================= */

  /* ====================== DERIVADOS ====================== */
  const cx = 100;  // centro X en el viewBox
  const cy = 100;  // centro Y en el viewBox

  $: pct = Math.max(0, Math.min(100, percent));

  // Normaliza y limita ángulos
  const deg2rad = (d: number) => (d * Math.PI) / 180;
  $: startDeg = ((startAngleDeg % 360) + 360) % 360;
  $: sweepDeg = Math.max(0.001, Math.min(359.999, sweepAngleDeg)); // evita 0 y 360 exactos

  $: startRad = deg2rad(startDeg);
  $: sweepRad = deg2rad(sweepDeg);
  $: endRad   = startRad + sweepRad;

  // Puntos inicio/fin sobre el círculo
  $: sx = cx + radius * Math.cos(startRad);
  $: sy = cy + radius * Math.sin(startRad);
  $: ex = cx + radius * Math.cos(endRad);
  $: ey = cy + radius * Math.sin(endRad);

  // Flags del comando A (arco elíptico)
  $: largeArcFlag = sweepDeg > 180 ? 1 : 0;
  $: sweepFlag = 1; // 1 = horario (clockwise)

  // Path del arco (track y progreso comparten geometría)
  $: pathD = `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${ex} ${ey}`;

  // Longitud del arco y dash (progreso)
  $: arcLength = radius * sweepRad; // L = r * θ
  $: dashArray = arcLength;
  $: dashOffset = arcLength * (1 - pct / 100);

  // Color final resuelto
  $: strokeResolved = colorVarName ? `var(${colorVarName}, ${color})` : color;

  // Glow
  $: glowBlur = Math.max(1, strokeWidth * 1.2);
  const uid = `arc-${Math.random().toString(36).slice(2)}`;

  // Punta del progreso (para GlowPoint): avanza del ángulo inicial según pct
  $: tipTheta = startRad + (pct / 100) * sweepRad;
  $: tipX = cx + radius * Math.cos(tipTheta);
  $: tipY = cy + radius * Math.sin(tipTheta);
</script>

<!-- CÓDIGO NUEVO: viewBox cuadrado para soportar arcos > 180° sin recortes -->
<svg
  viewBox="0 0 200 200"
  class="circular-arc"
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label="Progress chart"
>
  <!-- Filtro para halo suave del arco -->
  <defs>
    <filter id="{uid}-outerGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={glowBlur} result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Pista -->
  {#if showTrack}
    <path
      d={pathD}
      fill="none"
      stroke={trackColor}
      stroke-width={strokeWidth}
      stroke-linecap="round"
    />
  {/if}

  <!-- Halo del progreso -->
  {#if glow}
    <path
      d={pathD}
      fill="none"
      stroke-width={strokeWidth + glowWidthBoost}
      stroke-linecap="round"
      stroke-opacity={glowOpacity}
      stroke-dasharray={dashArray}
      stroke-dashoffset={dashOffset}
      style={`stroke: ${strokeResolved};`}
      filter={`url(#${uid}-outerGlow)`}
      pointer-events="none"
    />
  {/if}

  <!-- Progreso -->
  <path
    d={pathD}
    fill="none"
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-dasharray={dashArray}
    stroke-dashoffset={dashOffset}
    style={`stroke: ${strokeResolved}; transition: stroke-dashoffset ${transitionMs}ms cubic-bezier(0.4,0,0.2,1);`}
  />

  <!-- Punto luminoso al final -->
  {#if showGlowPoint}
    <GlowPoint x={tipX} y={tipY} r={pointRadius} color={strokeResolved} />
  {/if}
</svg>

<style>
  .circular-arc {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
