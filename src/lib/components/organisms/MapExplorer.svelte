<script lang="ts">
	import LeafletMapComponent from '$lib/components/atoms/LeafletMap.svelte';
	import MapFilters from '$lib/components/molecules/MapFilters.svelte';
	import MapSearch from '$lib/components/molecules/MapSearch.svelte';
	import MapLegend from '$lib/components/molecules/MapLegend.svelte';
	import { onMount } from 'svelte';
	import type { Map, LatLngTuple, Marker } from 'leaflet';
	/* CÓDIGO ROCKET */
	import RocketMapOverlay from '$lib/components/molecules/RocketMapOverlay.svelte';
	/* CÓDIGO BORDES FACULTADES */
	import UCEFacultyChoropleth from '$lib/components/molecules/UCEFacultyChoropleth.svelte';

	// Props para el mapa
	export let center: LatLngTuple = [40.416775, -3.70379]; // Madrid por defecto
	export let zoom = 13;

	// Categorías para el filtro
	export let categories = ['Restaurantes', 'Hoteles', 'Tiendas', 'Atracciones'];
	let selectedCategory = '';

	// Referencias
	let map: Map;
	let mapComponent: LeafletMapComponent;
	let rocket: any; // referencia a la overlay para llamar launch/land/toggle

	// Datos de ejemplo para marcadores
	const sampleMarkers = [
		{ id: 1, latlng: [40.416775, -3.70379], title: 'Puerta del Sol', category: 'Atracciones' },
		{ id: 2, latlng: [40.420886, -3.705675], title: 'Palacio Real', category: 'Atracciones' },
		{ id: 3, latlng: [40.413994, -3.693872], title: 'Museo del Prado', category: 'Atracciones' },
		{ id: 4, latlng: [40.425512, -3.715293], title: 'Hotel Palace', category: 'Hoteles' },
		{ id: 5, latlng: [40.417438, -3.699968], title: 'Restaurante Botín', category: 'Restaurantes' },
		{ id: 6, latlng: [40.423698, -3.711842], title: 'El Corte Inglés', category: 'Tiendas' }
	];

	// Creamos los marcadores cuando el mapa está listo
	function handleMapReady() {
		if (mapComponent) {
			map = mapComponent.getMap();

			// Esperar un momento para asegurarse de que el mapa está totalmente cargado
			setTimeout(() => {
				if (map && typeof map.addLayer === 'function') {
					addSampleMarkers();
				}
			}, 500);
		}
	}

	// Añadir marcadores de ejemplo al mapa usando nuestros marcadores personalizados
	async function addSampleMarkers() {
		if (!map || !mapComponent) return;

		// Añadimos cada marcador con un pequeño retraso para crear un efecto de carga
		for (let i = 0; i < sampleMarkers.length; i++) {
			const markerData = sampleMarkers[i];

			setTimeout(() => {
				mapComponent.createCustomMarker(
					markerData.latlng as LatLngTuple,
					markerData.category,
					markerData.title,
					`Información sobre ${markerData.title}. Haz clic para más detalles.`
				);
			}, i * 200); // Añadir cada marcador con un retraso de 200ms
		}
	}

	// Manejar la búsqueda
	function handleSearch(event: CustomEvent<string>) {
		const query = event.detail.toLowerCase();
		console.log('Búsqueda:', query);

		// Aquí implementaríamos la lógica de búsqueda real
		// Por ahora, simplemente buscamos en nuestros marcadores de ejemplo
		const found = sampleMarkers.find((marker) => marker.title.toLowerCase().includes(query));

		if (found && map) {
			map.setView(found.latlng as LatLngTuple, 16);
		}
	}

	// Filtrar marcadores por categoría
	$: if (map && selectedCategory) {
		// Aquí implementaríamos la lógica real para filtrar marcadores
		console.log('Filtrando por:', selectedCategory);
	}

	onMount(() => {
		handleMapReady();
	});
	// --- nos llega el map real desde el hijo
	function onMapReady(e: CustomEvent<{ map: Map }>) {
		map = e.detail.map;
		// cargar marcadores cuando el mapa ya está OK
		setTimeout(addSampleMarkers, 300);
	}
</script>

<div class="map-container">
	<div class="map-header">
		<MapFilters {categories} bind:selectedCategory />
		<MapSearch on:search={handleSearch} />
		<!-- Controles del cohete -->
		<div class="rocket-controls">
			<button on:click={() => rocket?.toggle()}>Despegar / Aterrizar</button>
			<button on:click={() => rocket?.launch()}>Despegar</button>
			<button on:click={() => rocket?.land()}>Aterrizar</button>
		</div>
	</div>

	<div class="map-body">
		<LeafletMapComponent
			bind:this={mapComponent}
			id="main-map"
			{center}
			{zoom}
			on:ready={onMapReady}
		/>
		<!-- CÓDIGO FACULTADES: capa choropleth de facultades -->
		<UCEFacultyChoropleth
			{map}
			src="/geo/map_uce_facultades_v5.geojson"
			valueProp="value"
			strokeVar="var(--color--primary)"
			baseOpacity={0.6}
			hoverOpacity={1.85}
		/>
		<!-- CÓDIGO ROCKET: Overlay del cohete -->
		<RocketMapOverlay
			bind:this={rocket}
			{center}
			{map}
			nearZoom={zoom}
			farZoom={4}
			duration={2}
			borderRadius="var(--map-radius, 10px)"
			lengthRatio={0.44}
			holeRatio={0.33}
			holeFeather={10}
			blur={6}
			intensity={1}
		/>

		<div class="map-legend-container">
			<MapLegend />
		</div>
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.map-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		gap: 20px;
	}

	.map-header {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		width: 100%;
		align-items: flex-start;
		justify-content: space-between;

		@include for-phone-only {
			flex-direction: column;
			align-items: stretch;

			:global(.search-container) {
				max-width: 100%;
			}
		}
	}

	.map-body {
		flex: 1;
		position: relative;
		height: 100%;
		width: 100%;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: var(--card-shadow);
		min-height: 500px;
		--map-radius: 10px;
	}

	.map-legend-container {
		position: absolute;
		bottom: 20px;
		right: 20px;
		z-index: 1000;

		@include for-phone-only {
			bottom: 10px;
			right: 10px;
		}
	}
	/* CÓDIGO para el ROCKET */
	.rocket-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.rocket-controls button {
		padding: 0.45rem 0.75rem;
		border-radius: 0.6rem;
		border: 1px solid color-mix(in srgb, var(--color--text, #1c1e26) 16%, transparent);
		background: color-mix(in srgb, var(--color--card-background, #fff) 94%, transparent);
		cursor: pointer;
	}
</style>
