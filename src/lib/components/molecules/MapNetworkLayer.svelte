<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Map } from 'leaflet';

	export let map: Map;
	export let nodes = [];
	export let edges = [];
	export let centroides: Record<string, [number, number]> = {};

	let L: any = null;
	let layerGroup: any = null;

	// 🎨 Colores que usaremos según el tema
	let themeColors = {
		edge: '#0044cc',
		nodeStroke: '#0044cc',
		nodeFill: '#6699ff'
	};

	let themeObserver: MutationObserver | null = null;
	let mql: MediaQueryList | null = null;

	async function loadLeaflet() {
		if (!L) {
			const leafletModule = await import('leaflet');
			L = leafletModule;
		}
	}

	function ensureLayer() {
		if (!layerGroup && L && map) {
			layerGroup = L.layerGroup().addTo(map);
		}
	}

	function clearLayer() {
		if (layerGroup) layerGroup.clearLayers();
	}

	// Detecta tema real: light/dark/auto (auto depende del sistema)
	function getResolvedTheme(): 'light' | 'dark' {
		const t = document.documentElement.getAttribute('data-theme');

		if (t === 'dark') return 'dark';
		if (t === 'light') return 'light';

		// auto o null → depende del sistema
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	// Lee variables CSS del tema, pero elige primary o secondary según light/dark
	function readThemeColors() {
		const resolved = getResolvedTheme();
		const s = getComputedStyle(document.documentElement);

		// En claro -> primary; en oscuro -> secondary
		const main = resolved === 'dark' ? 'secondary' : 'callout-accent--success';
		const shade = `${main}-shade`;

		themeColors = {
			edge: s.getPropertyValue(`--color--${main}`).trim() || themeColors.edge,
			nodeStroke: s.getPropertyValue(`--color--${main}`).trim() || themeColors.nodeStroke,
			nodeFill: s.getPropertyValue(`--color--${shade}`).trim() || themeColors.nodeFill
		};
	}

	function drawNetwork() {
		if (!L || !map) return;
		ensureLayer();
		clearLayer();
		if (!nodes || nodes.length === 0) return;

		// --- EDGES ---
		edges.forEach((e) => {
			const from = nodes.find((n) => n.id === e.source);
			const to = nodes.find((n) => n.id === e.target);

			if (!from || !to) return;
			if (from.lat == null || from.lng == null || to.lat == null || to.lng == null) return;

			const weight = 2 + e.normalized * 6;
			const opacity = 0.2 + e.normalized * 0.8;

			const line = L.polyline(
				[
					[from.lat, from.lng],
					[to.lat, to.lng]
				],
				{
					color: themeColors.edge,
					weight,
					opacity
				}
			)
				.addTo(layerGroup)
				.bindTooltip(`<b>${from.label}</b> ↔ <b>${to.label}</b><br> Peso: ${e.weight}`, {
					sticky: true
				});

			// (Opcional) si quieres controlar hover tú mismo, aquí podrías:
			// line.on('mouseover', () => line.setStyle({ weight: weight + 2, opacity: 1 }));
			// line.on('mouseout', () => line.setStyle({ weight, opacity }));
		});

		// --- NODES ---
		nodes.forEach((n) => {
			if (n.lat == null || n.lng == null) return;

			L.circleMarker([n.lat, n.lng], {
				radius: 6 + Math.sqrt(n.projectCount),
				color: themeColors.nodeStroke,
				fillColor: themeColors.nodeFill,
				fillOpacity: 0.9,
				weight: 2
			})
				.addTo(layerGroup)
				.bindTooltip(`<b>${n.label}</b><br> Proyectos: ${n.projectCount}`, { sticky: true });
		});
	}

	function refreshThemeAndRedraw() {
		readThemeColors();
		drawNetwork();
	}

	onMount(async () => {
		await loadLeaflet();
		refreshThemeAndRedraw();

		// 1) Cambios en data-theme (light/dark/auto)
		themeObserver = new MutationObserver(() => {
			refreshThemeAndRedraw();
		});

		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		// 2) Si data-theme = auto, y cambia el tema del sistema
		mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener?.('change', () => {
			// solo importa si estás en auto (o sin data-theme)
			const t = document.documentElement.getAttribute('data-theme');
			if (!t || t === 'auto') refreshThemeAndRedraw();
		});
	});

	// ✅ Redibuja cuando cambien nodes/edges/map o cuando L esté listo
	$: if (map && L) {
		nodes;
		edges;
		readThemeColors();
		drawNetwork();
	}

	onDestroy(() => {
		themeObserver?.disconnect();
		mql?.removeEventListener?.('change', refreshThemeAndRedraw as any);
		clearLayer();
	});
</script>

<div class="network-legend">
	<b>Red de colaboración</b><br />
	• Grosor = fuerza del vínculo<br />
	• Intensidad = opacidad del vínculo<br />
</div>

<style>
	.network-legend {
		position: absolute;
		bottom: 10px;
		left: 10px;
		background: white;
		padding: 6px 10px;
		border-radius: 6px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
		font-size: 0.8rem;
	}
</style>
