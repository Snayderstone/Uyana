<!-- src/lib/components/molecules/UCEFacultyChoropleth.svelte -->
<script lang="ts">
  import type { Map } from 'leaflet';
  import { onMount } from 'svelte';

  /* === PROPS ============================================================ */
  export let map: Map | null = null;                  // <-- requerido
  export let src: string | null = '/geo/map_uce_facultades_v5.geojson'; // ruta geojson
  export let valueProp = 'value';                      // propiedad numérica (eje calor)
  export let getValue: ((props: Record<string, any>) => number) | null = null; // alternativa
  export let fitToData: boolean = true;               // encuadrar al cargar

  // Estilos (variables CSS con fallback)
  export let strokeVar = 'var(--color--primary, #6e29e7)';
  export let fillMin = '#e53935';   // rojo base (fallback)
  export let fillMid = '#ffb300';   // amarillo base (fallback)
  export let fillMax = '#fffef5';   // casi blanco

  export let strokeWeight = 1.2;
  export let baseOpacity = 0.65;    // opacidad del relleno
  export let hoverOpacity = 0.85;   // al hover
  export let hoverWeight = 2.2;     // borde al hover
  export let shadowGlow = true;     // glow exterior al hover

  let L: typeof import('leaflet') | null = null;
  let layer: import('leaflet').GeoJSON | null = null;

  /* === HELPERS ========================================================== */
  function lerp(a:number,b:number,t:number){ return a+(b-a)*t; }
  function hexToRgb(h:string){
    const m = h.replace('#','');
    const n = m.length===3 ? m.split('').map(c=>c+c).join('') : m;
    const num = parseInt(n,16);
    return {r:(num>>16)&255, g:(num>>8)&255, b:num&255};
  }
  function mix(aHex:string,bHex:string,t:number){
    const a=hexToRgb(aHex), b=hexToRgb(bHex);
    const r=Math.round(lerp(a.r,b.r,t));
    const g=Math.round(lerp(a.g,b.g,t));
    const b2=Math.round(lerp(a.b,b.b,t));
    return `rgb(${r}, ${g}, ${b2})`;
  }
  // gradiente 3 puntos: min(0) -> mid(0.5) -> max(1)
  function colorScale(t:number){
    const x = Math.max(0, Math.min(1, t));
    return x < 0.5
      ? mix(fillMin, fillMid, x/0.5)
      : mix(fillMid, fillMax, (x-0.5)/0.5);
  }

  function getVal(props:Record<string,any>): number {
    if (getValue) return +getValue(props) || 0;
    return +(props?.[valueProp] ?? 0);
  }

  /* === CARGA ============================================================ */
  async function ensureLeaflet(){
    if (!L) L = await import('leaflet');
  }

  async function loadLayer(){
    if (!map || !src) return;
    await ensureLeaflet();
    const res = await fetch(src);
    const gj = await res.json();

    // min/max para normalizar
    let vMin = Infinity, vMax = -Infinity;
    for (const f of gj.features ?? []) {
      const v = getVal(f.properties||{});
      if (!Number.isFinite(v)) continue;
      vMin = Math.min(vMin, v);
      vMax = Math.max(vMax, v);
    }
    if (!Number.isFinite(vMin) || !Number.isFinite(vMax) || vMin===vMax) {
      vMin = 0; vMax = 1;
    }

    const style = (feature:any) => {
      const v = getVal(feature?.properties||{});
      const t = (v - vMin) / (vMax - vMin || 1);
      return {
        color: strokeVar,
        weight: strokeWeight,
        fillColor: colorScale(t),
        fillOpacity: baseOpacity
      } as import('leaflet').PathOptions;
    };

    // limpia anterior
    if (layer) { layer.remove(); layer = null; }

    layer = L!.geoJSON(gj, { style })
      .on('mouseover', (e: any) => {
        const l = e.layer as import('leaflet').Path;
        l.setStyle({ weight: hoverWeight, fillOpacity: hoverOpacity });
        if (shadowGlow) {
          (l as any).bringToFront?.();
          // sombra suave (SVG filter via CSS)
          (l as any)._path?.classList?.add('uce-hover-glow');
        }
      })
      .on('mouseout', (e: any) => {
        const l = e.layer as import('leaflet').Path;
        l.setStyle({ weight: strokeWeight, fillOpacity: baseOpacity });
        (l as any)._path?.classList?.remove('uce-hover-glow');
      })
      .on('click', (e: any) => {
        const p = e.layer.feature?.properties || {};
        const title = p.nombre ?? p.name ?? 'Facultad';
        const html = `
          <div class="uce-popup">
            <h3>${title}</h3>
            <div class="uce-popup-grid">
              ${Object.entries(p)
                .map(([k,v])=>`<div><strong>${k}</strong>: ${String(v)}</div>`)
                .join('')}
            </div>
          </div>`;
        L!.popup({autoPan:true, className:'uce-popup-wrap'})
          .setLatLng(e.latlng)
          .setContent(html)
          .openOn(map!);
      })
      .addTo(map!);

    if (fitToData) {
      try { map!.fitBounds(layer.getBounds(), { padding:[24,24] }); } catch {}
    }
  }

  onMount(loadLayer);

  // si cambian props claves, recargamos
  $: (map && src) && loadLayer();
</script>

<!-- No dibuja DOM visible: todo es capa Leaflet. Sólo estilos globales -->
<style>
  /* glow elegante al hover */
  :global(.uce-hover-glow) {
    filter: drop-shadow(0 0 60px color-mix(in srgb, var(--color--primary, #6e29e7) 65%, transparent))
            drop-shadow(0 0 140px color-mix(in srgb, var(--color--primary, #6e29e7) 45%, transparent));
    transition: filter .2s ease;
  }
  /* popup base */
  :global(.leaflet-popup-content .uce-popup) {
    font: inherit;
    color: var(--color--text, #1c1e26);
  }
  :global(.leaflet-popup-content .uce-popup h3) {
    margin: 0 0 .5rem 0;
    font-weight: 700;
    font-size: .95rem;
    color: var(--color--primary, #6e29e7);
  }
  :global(.leaflet-popup-content .uce-popup-grid) {
    display: grid;
    gap: .35rem;
  }
</style>
