<!-- src/lib/components/organisms/CircularStatus.svelte -->
<script lang="ts">
  import CircularArc from '../atoms/CircularArc.svelte';

  // ===== Props =====
  export let title: string = 'Progreso';
  export let value: number | string = 30;
  export let total: number | null = 100;
  export let unit: string = '';
  export let status: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let opacity: number = 0.85;

  // Texto
  export let showValueInside: boolean = true;
  export let showDetailsBelow: boolean = true;
  export let insideText: string = '';
  export let labelPosition: 'inside' | 'outside' | 'both' = 'both';

  // Cálculo de porcentaje
  $: percent =
    total !== null && total > 0 ? Math.max(0, Math.min(100, (+value / total) * 100)) : 0;

  // Tamaños por variante
  const config = {
    sm: { radius: 56, strokeWidth: 5, insideFontSize: '1.1rem', svgSize: 100 },
    md: { radius: 80, strokeWidth: 7, insideFontSize: '1.5rem', svgSize: 140 },
    lg: { radius: 94, strokeWidth: 12, insideFontSize: '1.8rem', svgSize: 180 }
  } as const;

  // Variables de tema (coinciden con tu mixin define-color)
  const VARS = {
    primary: '--color--primary',
    secondary: '--color--secondary',
    success: '--color--callout-accent--success',
    warning: '--color--callout-accent--warning',
    error: '--color--callout-accent--error'
  } as const;

  const { radius, strokeWidth, insideFontSize, svgSize } = config[size];

  // Color del progreso desde el status, con fallback a --color--primary
  $: progressColorVarName = VARS[status] ?? '--color--primary';

  // Textos mostrados
  $: displayInsideText = insideText || `${Math.round(percent)}%`;
  $: displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  $: displayTotal = total !== null ? total.toLocaleString() : '';
</script>

<div
  class="circular-status"
  style="
    --bg-opacity: {opacity};
    /* Permite que el color del arco herede desde aquí si no existe la var CSS */
    color: var(--color--accent, var(--text));
  "
>
  {#if labelPosition !== 'inside'}
    <h4 class="circular-status__title">{title}</h4>
  {/if}

  <div class="circular-status__container">
    <div class="circular-status__diagram" style="width:{svgSize}px; height:{svgSize}px;">
      <CircularArc
        {percent}
        {radius}
        {strokeWidth}
        colorVarName={progressColorVarName}
        color="currentColor" 
        trackColor="color-mix(in srgb, var(--text) 15%, transparent)"
        glow={true}
        glowOpacity={0.45}
        glowWidthBoost={8}
        showTrack={true}
        showGlowPoint={true}
        pointRadius={7}
  		startAngleDeg={125}  
  		sweepAngleDeg={288}   
      />

      {#if showValueInside && labelPosition !== 'outside'}
        <div
          class="circular-status__value-inside"
          style="font-size:{insideFontSize};"
          title="{displayValue} {unit}"
        >
          {displayInsideText}
        </div>
      {/if}
    </div>

    {#if showDetailsBelow}
      <div class="circular-status__details">
        {#if labelPosition !== 'outside'}
          <div class="circular-status__detail-title">{title}</div>
        {/if}

        <div class="circular-status__detail-value">
          <span class="value-number">{displayValue}</span>
          {#if unit}<span class="value-unit"> {unit}</span>{/if}
          {#if total !== null}
            <span class="value-separator"> / </span>
            <span class="value-total">{displayTotal}</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .circular-status {
    /* ===== Design tokens locales con fallbacks (sin hardcode directo) ===== */
    --bg: var(--color--card-background, #ffffff);
    --text: var(--color--text, #1c1e26);
    --text-shade: var(--color--text-shade, #5d5f65);
    --border-radius: var(--surface-radius, 0.75rem);
    --padding: var(--surface-padding, 1rem);
    --gap: var(--space-3, 0.75rem);
    --gap-sm: var(--space-2, 0.5rem);
    --fs-title: var(--font-size-xs, 0.8rem);
    --fs-detail: var(--font-size-sm, 1rem);
    --fs-detail-sm: var(--font-size-xs, 0.9rem);
    --shadow: var(
      --card-shadow,
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06)
    );

    background: color-mix(in srgb, var(--bg), transparent calc((1 - var(--bg-opacity, 0.85)) * 100%));
    border-radius: var(--border-radius);
    padding: var(--padding);
    box-shadow: var(--shadow);
    color: var(--text);
    font-family: var(--font-family, 'Inter', 'Segoe UI', system-ui, sans-serif);
    text-align: center;

    max-width: 100%;
    margin: 0 auto;
    position: relative;
    border: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
  }

  .circular-status__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap);
  }

  .circular-status__title {
    font-size: var(--fs-title);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-shade);
    margin: 0 0 var(--gap-sm) 0;
  }

  .circular-status__diagram {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .circular-status__value-inside {
    position: absolute;
    font-weight: 700;
    color: var(--text);
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90%;
    padding: 0 0.25rem;
  }

  .circular-status__details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1, 0.25rem);
    width: 100%;
  }

  .circular-status__detail-title {
    font-size: var(--fs-title);
    font-weight: 600;
    color: var(--text-shade);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .circular-status__detail-value {
    font-size: var(--fs-detail);
    font-weight: 600;
    color: var(--text-shade);
    word-break: break-all;
  }

  .value-number { font-weight: 700; }

  .value-unit,
  .value-separator,
  .value-total {
    font-size: var(--fs-detail-sm);
    color: var(--text-shade);
  }

  /* Responsive (usa tokens para no “hardcodear”) */
  @media (max-width: 640px) {
    .circular-status {
      --padding: var(--surface-padding-sm, 0.75rem);
    }
    .circular-status__detail-value {
      --fs-detail: var(--font-size-sm, 0.9rem);
    }
    .circular-status__title,
    .circular-status__detail-title {
      --fs-title: var(--font-size-2xs, 0.7rem);
    }
  }
</style>
