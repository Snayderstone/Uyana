<script lang="ts">
	import LeafletMapComponent from '$lib/components/atoms/LeafletMap.svelte';
	import MapFilters from '$lib/components/molecules/MapFilters.svelte';
	import MapSearch from '$lib/components/molecules/MapSearch.svelte';
	import MapLegend from '$lib/components/molecules/MapLegend.svelte';
	import { onMount } from 'svelte';
	import type { Map, LatLngTuple, Marker } from 'leaflet';

	// Props para el mapa
	export let center: LatLngTuple = [40.416775, -3.70379]; // Madrid por defecto
	export let zoom = 13;

	// Categorías para el filtro
	export let categories = ['Restaurantes', 'Hoteles', 'Tiendas', 'Atracciones'];
	let selectedCategory = '';

	// Referencias
	let map: Map;
	let mapComponent: LeafletMapComponent;

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
</script>

<div class="map-container">
	<div class="map-header">
		<MapFilters {categories} bind:selectedCategory />
		<MapSearch on:search={handleSearch} />
	</div>

	<div class="map-body">
		<LeafletMapComponent bind:this={mapComponent} id="main-map" {center} {zoom} />

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
</style>
