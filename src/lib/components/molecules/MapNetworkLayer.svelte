<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Map } from 'leaflet';

	export let map: Map;
	export let nodes = [];
	export let edges = [];
	export let centroides: Record<string, [number, number]> = {};

	let L: any = null; // ← Leaflet se cargará aquí dinámicamente
	let layerGroup: any = null;
	console.log('🟦 MapNetworkLayer MONTADO');
	async function loadLeaflet() {
		if (!L) {
			console.log('📦 Cargando Leaflet...');
			const leafletModule = await import('leaflet'); // ← IMPORT DINÁMICO
			L = leafletModule;
			console.log('📦 Leaflet cargado:', L);
		}
	}

	function clearLayer() {
		if (layerGroup && map) {
			layerGroup.clearLayers();
			map.removeLayer(layerGroup);
		}
		if (L) {
			layerGroup = L.layerGroup().addTo(map);
		}
	}

	function drawNetwork() {
		console.log('🟩 drawNetwork() EJECUTADO');
		console.log('🟩 Nodes:', nodes);
		console.log('🟩 Edges:', edges);

		if (!L || !map) return;
		clearLayer();
		// ✅ Si no hay datos, listo: queda limpio visualmente
		if (!nodes || nodes.length === 0) return;

		// --- DIBUJAR ARCOS ---
		edges.forEach((e) => {
			console.log('➡️ DIBUJANDO ARCO:', e);
			const from = nodes.find((n) => n.id === e.source);
			const to = nodes.find((n) => n.id === e.target);

			if (!from || !to) return;
			if (from.lat == null || from.lng == null || to.lat == null || to.lng == null) return;

			const weight = 2 + e.normalized * 6;

			L.polyline(
				[
					[from.lat, from.lng],
					[to.lat, to.lng]
				],
				{
					color: `rgba(0,0,150,${0.2 + e.normalized * 0.8})`,
					weight,
					opacity: 0.9
				}
			)
				.addTo(layerGroup)
				.bindTooltip(`<b>${from.label}</b> ↔ <b>${to.label}</b><br> Peso: ${e.weight}`, {
					sticky: true
				});
		});

		// --- DIBUJAR NODOS ---
		nodes.forEach((n) => {
			console.log('➡️ DIBUJANDO NODO:', n);
			if (n.lat == null || n.lng == null) return;

			L.circleMarker([n.lat, n.lng], {
				radius: 6 + Math.sqrt(n.projectCount),
				color: '#0044cc',
				fillColor: '#6699ff',
				fillOpacity: 0.9,
				weight: 2
			})
				.addTo(layerGroup)
				.bindTooltip(`<b>${n.label}</b><br> Proyectos: ${n.projectCount}`, { sticky: true });
		});
		if (!nodes || nodes.length === 0) {
			clearLayer();
			return;
		}
	}

	onMount(async () => {
		await loadLeaflet(); // ← Se carga Leaflet solo en el navegador
		drawNetwork();
	});

	$: if (map && L) {
		drawNetwork(); // drawNetwork ya hace clearLayer() y no pinta si no hay datos
	}

	onDestroy(() => {
		clearLayer();
	});
</script>

<div class="network-legend">
	<b>Red de colaboración</b><br />
	• Grosor = fuerza del vínculo<br />
	• Color = intensidad del vínculo<br />
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
