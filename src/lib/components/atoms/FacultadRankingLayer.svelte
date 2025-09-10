<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { Map, LeafletMouseEvent } from "leaflet";

  export let map: Map | null = null;
  export let data: { facultad: string; cantidad: number; center: [number, number] | null }[] = [];

  let L: typeof import("leaflet") | null = null;
  let markers: any[] = [];

  async function ensureLeaflet() {
    if (!L) L = await import("leaflet");
  }

  function clearMarkers() {
    markers.forEach(m => map?.removeLayer(m));
    markers = [];
  }

  function drawMarkers() {
    if (!map || !L) return;
    clearMarkers();

    const ordenadas = data
      .filter(d => d.cantidad > 0 && d.center) 
      .sort((a, b) => b.cantidad - a.cantidad)
      .map((d, i) => ({ ...d, rank: i + 1 }));

    ordenadas.forEach(({ rank, center }) => {
      const icon = L!.divIcon({
        className: "faculty-rank-icon",
        html: `<div>${rank}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L!.marker(center as [number, number], { 
        icon, 
        interactive: false,
        keyboard: false
      }).addTo(map);

      marker.on('click dblclick mousedown mouseover contextmenu', (e: LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
      });

      markers.push(marker);
    });
  }

  onMount(async () => {
    await ensureLeaflet();
    drawMarkers();
  });

  onDestroy(() => {
    clearMarkers();
  });

  $: if (data && map) {
    drawMarkers();
  }
</script>

<!-- 👇 Esto evita el warning de "No scopable elements found" -->
<div style="display:none;"></div>

<style>
  :global(.faculty-rank-icon) {
    pointer-events: none !important;
  }

  :global(.faculty-rank-icon div) {
    background: var(--color--text);
    color: var(--color--callout-background);
    font-weight: bold;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
  }
</style>
