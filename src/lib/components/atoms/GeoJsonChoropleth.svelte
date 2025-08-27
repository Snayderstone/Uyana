<!-- src/lib/components/atoms/GeoJsonChoropleth.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Map } from 'leaflet';

	// === Props principales =====================================================
	export let map: Map | null = null; // instancia Leaflet ya creada
	export let dataUrl: string | null = null; // URL del GeoJSON (opción A)
	export let data: any | null = null; // objeto GeoJSON ya cargado (opción B)

	// Cómo obtener el ID de cada feature para cruzar valores (por defecto 'facultad')
	export let idProperty: string = 'facultad';

	// Valores dinámicos: { [id]: number } (0..1, 0..100, o el rango que tú mandes)
	export let valueById: Record<string, number> = {};

	// Si se especifican, anulan el auto-cálculo
	export let min: number | null = null;
	export let max: number | null = null;

	// Estilo base
	export let lineColor = 'color-mix(in srgb, var(--color--text, #1c1e26) 40%, transparent)';
	export let lineWeight = 1;
	export let baseFillOpacity = 0.65;

	// Hover
	export let hoverEnabled = true;
	export let hoverLineColor = 'var(--color--primary, #6E29E7)';

	// Popup
	export let popupEnabled = true;
	// Función para renderizar el cuerpo del popup (HTML string)
	export let popupFormatter: (props: any, id: string, value: number | null) => string = (
		p,
		id,
		value
	) => {
		const vtxt = value == null ? '–' : String(value);
		const rows = Object.entries(p || {})
			.map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
			.join('');
		return `<div class="uce-popup">
      <div style="font-weight:700; margin-bottom:.25rem;">${p?.facultad ?? id ?? 'Detalle'}</div>
      ${rows}
      <div style="margin-top:.35rem; opacity:.8;">Valor: ${vtxt}</div>
    </div>`;
	};

	// Paleta tipo “calor”: rojo → amarillo → blanco con variables globales.
	// Usamos color-mix en runtime (soporta var(...) y es ligero).
	export let colorAt: (t: number) => string = (t: number) => {
		const clamped = Math.max(0, Math.min(1, t));
		if (clamped <= 0.5) {
			const p = Math.round(clamped * 200); // 0..100
			return `color-mix(in srgb, var(--color--callout-accent--warning, #ffd60a) ${p}%, var(--color--callout-accent--error, #ff3b30))`;
		} else {
			const p = Math.round((clamped - 0.5) * 200); // 0..100
			return `color-mix(in srgb, var(--color--card-background, #ffffff) ${p}%, var(--color--callout-accent--warning, #ffd60a))`;
		}
	};

	// Normalizador de valores → [0,1]
	function to01(v: number, lo: number, hi: number) {
		const span = hi - lo || 1;
		return Math.max(0, Math.min(1, (v - lo) / span));
	}

	let L: typeof import('leaflet') | null = null;
	let geoLayer: any = null;
	let loadedData: any = null;

	// Recalcula min/max si no vienen dados
	function computeDomain(values: number[]): { lo: number; hi: number } {
		if (!values.length) return { lo: 0, hi: 1 };
		const lo = min ?? Math.min(...values);
		const hi = max ?? Math.max(...values);
		return { lo, hi: lo === hi ? lo + 1 : hi }; // evita span = 0
	}

	async function ensureLeaflet() {
		if (!L) L = await import('leaflet');
	}

	async function loadDataIfNeeded() {
		if (data) {
			loadedData = data;
			return;
		}
		if (dataUrl) {
			const res = await fetch(dataUrl);
			loadedData = await res.json();
		}
	}

	function styleForFeature(f: any) {
		const id = f?.properties?.[idProperty];
		const v = id != null ? valueById[id] : undefined;
		const domain = computeDomain(Object.values(valueById).filter((x) => typeof x === 'number'));
		const t = typeof v === 'number' ? to01(v, domain.lo, domain.hi) : 0;
		const fill = colorAt(t);
		return {
			color: lineColor,
			weight: lineWeight,
			fillColor: fill,
			fillOpacity: baseFillOpacity
		};
	}

	function bindEvents(feature: any, layer: any) {
		if (!hoverEnabled && !popupEnabled) return;

		layer.on('mouseover', (e: any) => {
			if (!hoverEnabled) return;
			e.target.setStyle({
				color: hoverLineColor,
				weight: Math.max(2, lineWeight + 1),
				fillOpacity: Math.min(1, baseFillOpacity + 0.1)
			});
			// leve glow en el SVG path
			const path: SVGPathElement | null = (e.target as any)?._path ?? null;
			if (path)
				path.style.filter =
					'drop-shadow(0 0 6px rgba(110,41,231,.55)) drop-shadow(0 0 14px rgba(110,41,231,.28))';
			e.target.bringToFront?.();
		});

		layer.on('mouseout', (e: any) => {
			if (!geoLayer || !L) return;
			geoLayer.resetStyle(e.target);
			const path: SVGPathElement | null = (e.target as any)?._path ?? null;
			if (path) path.style.filter = '';
		});

		if (popupEnabled) {
			const id = feature?.properties?.[idProperty];
			const v = id != null ? valueById[id] : null;
			const html = popupFormatter(feature?.properties ?? {}, id, typeof v === 'number' ? v : null);
			layer.bindPopup(html);
		}
	}

	async function buildLayer() {
		if (!map || !loadedData || !L) return;
		destroyLayer();

		geoLayer = L!.geoJSON(loadedData, {
			style: styleForFeature,
			onEachFeature: bindEvents
		});
		geoLayer.addTo(map);
	}

	function restyleLayer() {
		if (!geoLayer) return;
		geoLayer.setStyle(styleForFeature);
	}

	function destroyLayer() {
		if (geoLayer && map) {
			map.removeLayer(geoLayer);
			geoLayer = null;
		}
	}

	onMount(async () => {
		await ensureLeaflet();
		await loadDataIfNeeded();
		await buildLayer();
	});

	onDestroy(() => {
		destroyLayer();
	});

	// Si cambia el mapa, data, url o los valores: reconstuye o re-estiliza
	$: (async () => {
		if (!map) return;
		if (data || dataUrl) {
			await ensureLeaflet();
			await loadDataIfNeeded();
			await buildLayer();
		}
	})();

	$: restyleLayer(); // se ejecuta cuando cambian reactivos usados en styleForFeature
</script>

<style>
	/* popup mínimo (se usa si no tienes tu propio theme para Leaflet) */
	:global(.leaflet-popup-content .uce-popup) {
		font-family: inherit;
		color: var(--color--text, #1c1e26);
	}
</style>
