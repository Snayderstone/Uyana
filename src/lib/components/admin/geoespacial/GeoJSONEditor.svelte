<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { GeoJSONGeometry } from '$lib/models/admin';
	import {
		geometryToFeatureCollection,
		featureCollectionToGeometry,
		getGeometryCenter,
		normalizeFeature
	} from '$lib/utils/geojson.utils';
	import { searchAddress, type SearchResult } from '$lib/services/nominatim.service';

	// Props
	export let geometry: GeoJSONGeometry = null;
	export let onChange: (newGeometry: GeoJSONGeometry) => void = () => {};
	export let height = '400px';
	export let readonly = false;
	export let autoCenter = true; // Centrar automáticamente al cargar geometría

	let mapContainer: HTMLDivElement;
	let map: any;
	let L: any;
	let drawnItems: any;
	let drawControl: any;
	let currentLayer: any = null;

	// Buscador
	let searchQuery = '';
	let searchResults: SearchResult[] = [];
	let searching = false;
	let showResults = false;
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Configuración inicial del mapa
	const DEFAULT_CENTER: [number, number] = [-16.5, -68.15]; // La Paz, Bolivia
	const DEFAULT_ZOOM = 13;

	onMount(async () => {
		// Cargar Leaflet dinámicamente
		await import('leaflet');
		await import('leaflet-draw');

		// Usar el objeto global de Leaflet (window.L)
		L = (window as any).L;

		// Importar CSS de Leaflet
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
		document.head.appendChild(link);

		const drawLink = document.createElement('link');
		drawLink.rel = 'stylesheet';
		drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
		document.head.appendChild(drawLink);

		// Inicializar mapa
		initializeMap();
	});

	// Manejar búsqueda con debounce
	async function handleSearch() {
		if (searchQuery.trim().length < 3) {
			searchResults = [];
			showResults = false;
			return;
		}

		searching = true;
		const results = await searchAddress(searchQuery, 5);
		searchResults = results;
		showResults = results.length > 0;
		searching = false;
	}

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			handleSearch();
		}, 500);
	}

	function selectSearchResult(result: SearchResult) {
		if (map && L) {
			// Centrar mapa en el resultado
			map.flyTo([result.lat, result.lng], 16, {
				duration: 1.5,
				easeLinearity: 0.25
			});

			// Cerrar resultados
			showResults = false;
			searchQuery = result.displayName;
		}
	}

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		showResults = false;
	}

	function initializeMap() {
		// Crear mapa
		map = L.map(mapContainer, {
			center: DEFAULT_CENTER,
			zoom: DEFAULT_ZOOM,
			zoomControl: true
		});

		// Añadir capa de OpenStreetMap
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		// Crear capa para elementos dibujados
		drawnItems = new L.FeatureGroup();
		map.addLayer(drawnItems);

		if (!readonly) {
			// Configurar controles de dibujo
			drawControl = new L.Control.Draw({
				draw: {
					polygon: {
						allowIntersection: false,
						showArea: true,
						shapeOptions: {
							color: '#3b82f6',
							fillOpacity: 0.3
						}
					},
					marker: {
						icon: L.icon({
							iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
							iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
							shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
							iconSize: [25, 41],
							iconAnchor: [12, 41]
						})
					},
					polyline: false,
					circle: false,
					rectangle: false,
					circlemarker: false
				},
				edit: {
					featureGroup: drawnItems,
					remove: true
				}
			});
			map.addControl(drawControl);

			// Event listeners para dibujo
			map.on(L.Draw.Event.CREATED, handleDrawCreated);
			map.on(L.Draw.Event.EDITED, handleDrawEdited);
			map.on(L.Draw.Event.DELETED, handleDrawDeleted);
		}

		// Cargar geometría existente si hay
		if (geometry) {
			loadGeometry(geometry);
		}
	}

	function handleDrawCreated(e: any) {
		// Eliminar capa anterior si existe
		if (currentLayer) {
			drawnItems.removeLayer(currentLayer);
		}

		// Añadir nueva capa
		currentLayer = e.layer;
		drawnItems.addLayer(currentLayer);

		// Convertir a GeoJSON y notificar cambio
		const geoJSON = currentLayer.toGeoJSON();

		// Convertir Feature a formato DB (minúsculas)
		const geometry: GeoJSONGeometry = {
			type: geoJSON.geometry.type,
			coordinates: geoJSON.geometry.coordinates
		};

		onChange(geometry);
	}

	function handleDrawEdited(e: any) {
		const layers = e.layers;
		layers.eachLayer((layer: any) => {
			currentLayer = layer;
			const geoJSON = layer.toGeoJSON();

			const geometry: GeoJSONGeometry = {
				type: geoJSON.geometry.type,
				coordinates: geoJSON.geometry.coordinates
			};

			onChange(geometry);
		});
	}

	function handleDrawDeleted() {
		currentLayer = null;
		onChange(null);
	}

	// Función pública para centrar el mapa en una geometría
	export function centerOnGeometry(geom: GeoJSONGeometry) {
		if (!map || !geom) return;

		const center = getGeometryCenter(geom);
		if (center) {
			map.flyTo(center, 15, {
				duration: 1.5,
				easeLinearity: 0.25
			});
		}
	}

	function loadGeometry(geom: GeoJSONGeometry) {
		if (!geom || !map || !L) return;

		// Limpiar capas existentes
		drawnItems.clearLayers();

		try {
			// Extraer geometría si es un Feature
			const geomAny = geom as any;
			let actualGeometry = geom;

			if (geomAny.type?.toLowerCase() === 'feature' && geomAny.geometry) {
				actualGeometry = geomAny.geometry;
			}

			// Normalizar la geometría si viene con type en minúsculas
			let normalizedGeom: any = actualGeometry;
			const actualGeomAny = actualGeometry as any;

			// Si la geometría tiene type en minúsculas, capitalizarla
			if (actualGeomAny.type && actualGeomAny.type === actualGeomAny.type.toLowerCase()) {
				const capitalizedType =
					actualGeomAny.type.charAt(0).toUpperCase() + actualGeomAny.type.slice(1);
				if (capitalizedType === 'Point') {
					normalizedGeom = {
						type: 'Point',
						coordinates: actualGeomAny.coordinates as [number, number]
					};
				} else if (capitalizedType === 'Polygon') {
					normalizedGeom = {
						type: 'Polygon',
						coordinates: actualGeomAny.coordinates as [number, number][][]
					};
				}
			}

			// Crear capa desde GeoJSON
			const geoJsonLayer = L.geoJSON(normalizedGeom, {
				pointToLayer: (feature: any, latlng: any) => {
					return L.marker(latlng, {
						icon: L.icon({
							iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
							iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
							shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
							iconSize: [25, 41],
							iconAnchor: [12, 41]
						})
					});
				},
				style: {
					color: '#3b82f6',
					fillOpacity: 0.3
				}
			});

			// Añadir todas las capas al FeatureGroup
			geoJsonLayer.eachLayer((layer: any) => {
				currentLayer = layer;
				drawnItems.addLayer(layer);
			});

			// Ajustar vista del mapa para mostrar la geometría si autoCenter está activo
			if (autoCenter && drawnItems.getBounds().isValid()) {
				map.fitBounds(drawnItems.getBounds(), {
					padding: [50, 50],
					maxZoom: 15
				});
			}
		} catch (error) {
			console.error('Error al cargar geometría:', error);
		}
	}

	// Función pública para limpiar el mapa
	export function clearGeometry() {
		if (drawnItems) {
			drawnItems.clearLayers();
			currentLayer = null;
			onChange(null);
		}
	}

	// Actualizar geometría cuando cambie desde afuera
	$: if (map && geometry !== undefined) {
		loadGeometry(geometry);
	}

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div class="geojson-editor">
	<!-- Buscador de direcciones -->
	{#if !readonly}
		<div class="search-container">
			<div class="search-input-wrapper">
				<svg
					class="search-icon"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
					/>
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					on:input={handleSearchInput}
					on:focus={() => (showResults = searchResults.length > 0)}
					placeholder="Buscar dirección (ej: Universidad de Alicante España)"
					class="search-input"
				/>
				{#if searchQuery}
					<button type="button" class="clear-button" on:click={clearSearch}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
				{#if searching}
					<div class="spinner" />
				{/if}
			</div>

			<!-- Resultados de búsqueda -->
			{#if showResults && searchResults.length > 0}
				<div class="search-results">
					{#each searchResults as result}
						<button
							type="button"
							class="search-result-item"
							on:click={() => selectSearchResult(result)}
						>
							<svg
								class="location-icon"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
								/>
							</svg>
							<div class="result-content">
								<div class="result-name">{result.displayName}</div>
								<div class="result-address">{result.address}</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<div class="map-container" bind:this={mapContainer} style="height: {height};" />

	{#if !readonly}
		<div class="instructions">
			<p>
				<strong>Instrucciones:</strong>
				Busque una dirección arriba o use las herramientas del mapa para dibujar un punto (marcador)
				o un polígono. Solo puede tener una geometría a la vez.
			</p>
		</div>
	{/if}
</div>

<style>
	.geojson-editor {
		width: 100%;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid #e5e7eb;
		position: relative;
	}

	/* Buscador */
	.search-container {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 90%;
		max-width: 500px;
		z-index: 1000;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		background: white;
		border-radius: 0.5rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		width: 1.25rem;
		height: 1.25rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 2.75rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		outline: none;
		background: transparent;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.clear-button {
		position: absolute;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.clear-button:hover {
		background-color: #f3f4f6;
	}

	.clear-button svg {
		width: 1rem;
		height: 1rem;
	}

	.spinner {
		position: absolute;
		right: 0.75rem;
		width: 1rem;
		height: 1rem;
		border: 2px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.search-results {
		margin-top: 0.5rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		max-height: 300px;
		overflow-y: auto;
	}

	.search-result-item {
		width: 100%;
		display: flex;
		align-items: start;
		gap: 0.75rem;
		padding: 0.75rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		border-bottom: 1px solid #f3f4f6;
		transition: background-color 0.2s;
	}

	.search-result-item:last-child {
		border-bottom: none;
	}

	.search-result-item:hover {
		background-color: #f9fafb;
	}

	.location-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #3b82f6;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.result-content {
		flex: 1;
		min-width: 0;
	}

	.result-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.result-address {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.map-container {
		width: 100%;
		position: relative;
		z-index: 1;
	}

	.instructions {
		padding: 1rem;
		background-color: #f9fafb;
		border-top: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.instructions p {
		margin: 0;
	}

	.instructions strong {
		color: #374151;
	}

	/* Fix para iconos de Leaflet */
	:global(.leaflet-container) {
		font-family: inherit;
	}

	:global(.leaflet-draw-actions) {
		left: 26px !important;
	}
</style>
