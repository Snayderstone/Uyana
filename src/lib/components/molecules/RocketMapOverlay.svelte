<!-- src/lib/components/molecules/RocketMapOverlay.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import type { Map, LatLngTuple } from 'leaflet';
  import BorderFlames from '$lib/components/atoms/BorderFlames.svelte';

  export let map: Map | null = null;
  export let center: LatLngTuple | null = null;
  export let nearZoom = 13;
  export let farZoom = 4;
  export let duration = 2;

  /* CÓDIGO: props visuales */
  export let borderRadius = 'var(--map-radius, 10px)';
  export let lengthRatio = 0.40;  // 0..0.5
  export let holeRatio = 0.33;    // 0..0.5
  export let holeFeather = 10;    // px

  export let blur = 6;            // px
  export let intensity = 1;       // 0..1

  // Colores (opcional: puedes no tocarlos si usas tus variables globales)
  export let colorRedVar    = 'var(--color--callout-accent--error, #ff3b30)';
  export let colorYellowVar = 'var(--color--callout-accent--warning, #ffd60a)';
  export let colorWhiteVar  = 'var(--color--card-background, #ffffff)';

  let isLaunching = false;
  let showFlame = false;

  export function launch() {
    if (!browser || !map) return;
    const c = center ?? map.getCenter();
    showFlame = true;
    isLaunching = true;
    map.flyTo(c, farZoom, { animate: true, duration });
    setTimeout(() => { showFlame = false; }, duration * 1000);
  }

  export function land() {
    if (!browser || !map) return;
    const c = center ?? map.getCenter();
    showFlame = true;
    isLaunching = false;
    map.flyTo(c, nearZoom, { animate: true, duration });
    setTimeout(() => { showFlame = false; }, duration * 1000);
  }

  export function toggle() {
    isLaunching ? land() : launch();
  }
</script>

<div class="rocket-overlay" aria-hidden="true">
  <BorderFlames
    active={showFlame}
    borderRadius={borderRadius}
    lengthRatio={lengthRatio}
    holeRatio={holeRatio}
    holeFeather={holeFeather}
    blur={blur}
    intensity={intensity}
    colorRedVar={colorRedVar}
    colorYellowVar={colorYellowVar}
    colorWhiteVar={colorWhiteVar}
  />
</div>

<style>
  .rocket-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 50; /* sobresale sobre el mapa/markers */
  }
</style>
