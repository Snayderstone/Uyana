<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let height = '600px';

	let mapContainer: HTMLDivElement;
	let map: any;
	let L: any;
	let markersLayer: any;

	let loading = false;
	let error = '';

	// Filtros
	let showInstituciones = true;
	let showFacultades = true;
	let showCarreras = true;

	const DEFAULT_CENTER: [number, number] = [-16.5, -68.15];
	const DEFAULT_ZOOM = 13;

	onMount(async () => {
		// Cargar Leaflet dinámicamente
		L = await import('leaflet');

		// Importar CSS de Leaflet
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
		document.head.appendChild(link);

		initializeMap();
		loadAllGeometries();
	});

	function initializeMap() {
		map = L.map(mapContainer, {
			center: DEFAULT_CENTER,
			zoom: DEFAULT_ZOOM,
			zoomControl: true
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		markersLayer = L.featureGroup().addTo(map);
	}

	async function loadAllGeometries() {
		loading = true;
		error = '';

		try {
			const [instRes, facRes, carrRes] = await Promise.all([
				fetch('/api/admin/geoespacial/instituciones'),
				fetch('/api/admin/geoespacial/facultades'),
				fetch('/api/admin/geoespacial/carreras')
			]);

			const instituciones = (await instRes.json()).data || [];
			const facultades = (await facRes.json()).data || [];
			const carreras = (await carrRes.json()).data || [];

			markersLayer.clearLayers();

			// Añadir instituciones (azul)
			instituciones.forEach((inst: any) => {
				if (inst.geometry && showInstituciones) {
					addGeometryToMap(inst.geometry, inst.nombre, 'Institución', '#3b82f6');
				}
			});

			// Añadir facultades (verde)
			facultades.forEach((fac: any) => {
				if (fac.geometry && showFacultades) {
					addGeometryToMap(fac.geometry, fac.nombre, 'Facultad', '#10b981');
				}
			});

			// Añadir carreras (naranja)
			carreras.forEach((carr: any) => {
				if (carr.geometry && showCarreras) {
					addGeometryToMap(carr.geometry, carr.nombre, 'Carrera', '#f59e0b');
				}
			});

			// Ajustar vista
			if (markersLayer.getLayers().length > 0) {
				map.fitBounds(markersLayer.getBounds(), { padding: [50, 50] });
			}
		} catch (e: any) {
			error = 'Error al cargar geometrías: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function addGeometryToMap(geometry: any, nombre: string, tipo: string, color: string) {
		if (!geometry || !L) return;

		try {
			L.geoJSON(geometry, {
				pointToLayer: (feature: any, latlng: any) => {
					return L.circleMarker(latlng, {
						radius: 8,
						fillColor: color,
						color: '#fff',
						weight: 2,
						opacity: 1,
						fillOpacity: 0.8
					});
				},
				style: {
					color: color,
					weight: 2,
					fillOpacity: 0.3
				},
				onEachFeature: (feature: any, layer: any) => {
					layer.bindPopup(`
						<div style="font-family: sans-serif;">
							<h4 style="margin: 0 0 0.5rem 0; color: ${color};">${tipo}</h4>
							<p style="margin: 0; font-weight: bold;">${nombre}</p>
							<p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">
								Tipo: ${geometry.type}
							</p>
						</div>
					`);
				}
			}).addTo(markersLayer);
		} catch (e) {
			console.error('Error al añadir geometría:', e);
		}
	}

	function handleFilterChange() {
		loadAllGeometries();
	}

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div class="map-viewer">
	<div class="controls">
		<h3>Filtros de Visualización</h3>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={showInstituciones} on:change={handleFilterChange} />
			<span class="color-indicator" style="background-color: #3b82f6;" />
			Instituciones
		</label>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={showFacultades} on:change={handleFilterChange} />
			<span class="color-indicator" style="background-color: #10b981;" />
			Facultades
		</label>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={showCarreras} on:change={handleFilterChange} />
			<span class="color-indicator" style="background-color: #f59e0b;" />
			Carreras
		</label>
	</div>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	{#if loading}
		<div class="loading-overlay">Cargando mapa...</div>
	{/if}

	<div class="map-container" bind:this={mapContainer} style="height: {height};" />
</div>

<style>
	.map-viewer {
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid #e5e7eb;
	}

	.controls {
		padding: 1rem;
		background-color: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.controls h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
	}

	.checkbox-label input[type='checkbox'] {
		cursor: pointer;
	}

	.color-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
	}

	.alert {
		margin: 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
	}

	.alert-error {
		background-color: #fee;
		color: #c00;
		border: 1px solid #fcc;
	}

	.loading-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 1rem 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		font-weight: 500;
		color: #374151;
	}

	.map-container {
		width: 100%;
		position: relative;
	}

	:global(.leaflet-container) {
		font-family: inherit;
	}
</style>
