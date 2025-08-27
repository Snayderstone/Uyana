<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type { Map, LatLngTuple } from 'leaflet';

	export let id = 'map';
	export let height = '100%';
	export let width = '100%';
	export let zoom = 13;
	export let center: LatLngTuple = [51.505, -0.09]; // Latitud y longitud por defecto (Londres)

	let mapElement: HTMLElement;
	let map: Map;
	let leafletLoaded = false;
	const dispatch = createEventDispatcher();

	// Exposición de la instancia del mapa para que los componentes padre puedan interactuar con ella
	export function getMap() {
		return map;
	}

	// Crear un marcador personalizado
	export async function createCustomMarker(
		latlng: LatLngTuple,
		category: string,
		title: string,
		content: string
	) {
		if (!map || !browser) return null;

		const L = await import('leaflet');

		// Definimos colores según la categoría
		const colors: Record<string, string> = {
			Restaurantes: '#FF5733',
			Hoteles: '#33A1FF',
			Tiendas: '#33FF57',
			Atracciones: '#F033FF'
		};

		// Creamos un icono personalizado
		const categoryColor = (colors as any)[category] || '#6E29E7'; // Color primario como fallback

		const customIcon = L.divIcon({
			className: `custom-marker-icon ${category.toLowerCase()}`,
			html: `<div style="background-color: ${categoryColor}; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);"></div>`,
			iconSize: [24, 24],
			iconAnchor: [12, 12],
			popupAnchor: [0, -12]
		});

		// Creamos y devolvemos el marcador
		const marker = L.marker(latlng, { icon: customIcon }).addTo(map).bindPopup(`
				<div class="map-popup-content">
					<h3>${title}</h3>
					<p>${content}</p>
					<p>Categoría: ${category}</p>
				</div>
			`);

		// Añadimos una clase para animar
		const markerElement = marker.getElement();
		if (markerElement) {
			markerElement.classList.add('animated-marker');
		}

		return marker;
	}

	onMount(async () => {
		if (browser) {
			// Importamos Leaflet dinámicamente ya que es una librería del lado del cliente
			const L = await import('leaflet');

			// Añadimos estilos de Leaflet
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);

			// Inicializamos el mapa con opciones mejoradas y sin controles por defecto
			map = L.map(id, {
				zoomControl: false, // Desactivamos los controles de zoom nativos
				attributionControl: false, // Desactivamos la atribución en la esquina inferior derecha
				scrollWheelZoom: true,
				doubleClickZoom: true,
				dragging: true,
				zoomAnimation: true,
				fadeAnimation: true,
				markerZoomAnimation: true
			}).setView(center, zoom);

			// Añadimos una capa de mapa más estética
			//https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png (Original del Luis)
			//https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png (Original de StreetMap)
			//https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png (Dark)
			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				attribution: '', // Eliminamos el texto de atribución
				subdomains: 'abcd',
				maxZoom: 19
			}).addTo(map); // Arreglamos el problema de los íconos de Leaflet para casos donde no usamos marcadores personalizados
			const defaultIcon = L.icon({
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				tooltipAnchor: [16, -28],
				shadowSize: [41, 41]
			});
			L.Marker.prototype.options.icon = defaultIcon;

			// Invalidar tamaño de mapa cuando esté completamente cargado
			setTimeout(() => {
				map.invalidateSize();
				leafletLoaded = true;
				dispatch('ready', { map });
			}, 100);
		}
	});

	onDestroy(() => {
		// Limpiamos el mapa cuando el componente se destruye
		if (map) {
			map.remove();
		}
	});

	// Actualizar vista cuando cambian las props
	$: if (map && leafletLoaded) {
		map.setView(center, zoom);
	}
</script>

<div {id} bind:this={mapElement} style:height style:width />

<style>
	div {
		width: 100%;
		height: 100%;
		z-index: 1;
		background-color: rgba(var(--color--page-background), 0.05);
		border-radius: 10px;
	}
</style>
