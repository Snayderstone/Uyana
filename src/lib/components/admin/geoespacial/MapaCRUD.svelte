<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type {
		InstitucionConFacultades,
		FacultadConCarreras,
		CarreraConRelaciones,
		GeoJSONGeometry
	} from '$lib/models/admin';
	import TopBar from './TopBar.svelte';

	// Suprimir errores de extensiones del navegador globalmente
	if (typeof window !== 'undefined') {
		const handleGlobalError = (event: ErrorEvent) => {
			const message = event.message?.toString() || '';
			if (
				message.includes('message channel closed') ||
				message.includes('Extension context invalidated') ||
				message.includes('listener indicated an asynchronous response')
			) {
				event.preventDefault();
				return true;
			}
		};
		window.addEventListener('error', handleGlobalError);
	}

	// Props
	export let height = '600px';

	// Estado del mapa
	let mapContainer: HTMLDivElement;
	let map: any;
	let L: any;
	let drawnItems: any;
	let drawControl: any;

	// Estado de la aplicación
	let loading = false;
	let error = '';
	let success = '';

	// Datos
	let instituciones: InstitucionConFacultades[] = [];
	let facultades: FacultadConCarreras[] = [];
	let carreras: CarreraConRelaciones[] = [];

	// Capas del mapa
	let institucionesLayer: any;
	let facultadesLayer: any;
	let carrerasLayer: any;

	// Estados de UI
	let selectedEntity: any = null;
	let selectedType: 'institucion' | 'facultad' | 'carrera' | null = null;
	let editMode: 'create' | 'edit' | 'view' = 'view';
	let fullscreenEditMode = false;
	let showSidebarPanel = true;

	// Filtros de visualización
	let showInstituciones = true;
	let showFacultades = true;
	let showCarreras = true;

	// Modal de creación
	let showCreateModal = false;
	let createType: 'institucion' | 'facultad' | 'carrera' = 'institucion';
	let showLocationSearch = false;
	let locationSearchQuery = '';
	let locationSearchResults: any[] = [];

	// Búsqueda de ubicación en modo creación (inline en mapa)
	let showMapLocationSearch = false;
	let mapLocationQuery = '';
	let mapLocationResults: any[] = [];

	// Modal de confirmación de eliminación
	let showDeleteModal = false;
	let entityToDelete: { name: string; type: string } | null = null;

	// Formulario
	let formData = {
		nombre: '',
		sigla: '',
		pais: '',
		// Para facultades
		institucion_id: null as number | null,
		decano: '',
		subdecano: '',
		// Para carreras
		facultad_id: null as number | null,
		geometry: null as GeoJSONGeometry
	};

	// Colores
	const COLORS = {
		institucion: '#3b82f6', // Azul
		facultad: '#10b981', // Verde
		carrera: '#f59e0b' // Naranja
	};

	onMount(async () => {
		// Suprimir errores de extensiones del navegador
		const originalError = console.error;
		console.error = (...args: any[]) => {
			const message = args[0]?.toString() || '';
			// Ignorar errores de extensiones del navegador
			if (
				message.includes('message channel closed') ||
				message.includes('Extension context invalidated') ||
				message.includes('listener indicated an asynchronous response')
			) {
				return;
			}
			originalError.apply(console, args);
		};

		// Suprimir advertencias de leaflet-draw sobre métodos deprecados
		const originalWarn = console.warn;
		console.warn = (...args: any[]) => {
			const message = args[0]?.toString() || '';
			// Ignorar advertencias de leaflet-draw sobre _flat deprecado
			if (message.includes('Deprecated use of _flat') || message.includes('L.LineUtil.isFlat')) {
				return;
			}
			originalWarn.apply(console, args);
		};

		// Suprimir errores no capturados de extensiones del navegador
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const message = event.reason?.message?.toString() || event.reason?.toString() || '';
			if (
				message.includes('message channel closed') ||
				message.includes('Extension context invalidated') ||
				message.includes('listener indicated an asynchronous response')
			) {
				event.preventDefault();
				return;
			}
		};

		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		await initMap();
		await loadAllData();

		// Cleanup
		return () => {
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	// Reactive: Ajustar el mapa cuando cambie el modo fullscreen o el panel lateral
	$: if (map && (fullscreenEditMode !== undefined || showSidebarPanel !== undefined)) {
		setTimeout(() => {
			map.invalidateSize();
		}, 300);
	}

	async function initMap() {
		try {
			// Importar Leaflet primero
			await import('leaflet');

			// Usar el objeto global de Leaflet (window.L)
			L = (window as any).L;

			// Asegurar que el CSS de Leaflet esté cargado
			if (!document.querySelector('link[href*="leaflet.css"]')) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
				document.head.appendChild(link);
			}

			// Importar Leaflet Draw (se auto-registra en window.L)
			await import('leaflet-draw');

			// Asegurar que el CSS de Leaflet Draw esté cargado
			if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
				const drawLink = document.createElement('link');
				drawLink.rel = 'stylesheet';
				drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
				document.head.appendChild(drawLink);
			}

			// Verificar que se haya cargado correctamente
			if (!L.Draw) {
				console.error('⚠️ Leaflet Draw no se cargó correctamente');
				console.log('L:', L);
			} else {
				console.log('✅ Leaflet Draw cargado correctamente');
			}

			// Fix icon paths
			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
			});

			// Inicializar mapa
			map = L.map(mapContainer, {
				attributionControl: true
			}).setView([-16.5, -68.15], 13); // La Paz, Bolivia

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				maxZoom: 19
			}).addTo(map);

			// Inicializar capas
			institucionesLayer = L.layerGroup().addTo(map);
			facultadesLayer = L.layerGroup().addTo(map);
			carrerasLayer = L.layerGroup().addTo(map);

			// Inicializar capa de dibujo
			drawnItems = new L.FeatureGroup();
			map.addLayer(drawnItems);

			// Asegurar que el mapa se ajuste al contenedor
			setTimeout(() => {
				map.invalidateSize();
			}, 100);
		} catch (err) {
			console.error('Error inicializando mapa:', err);
			error = 'Error al cargar el mapa';
		}
	}

	async function loadAllData() {
		loading = true;
		error = '';
		try {
			// Cargar en paralelo pero no fallar si una falla
			const results = await Promise.allSettled([
				loadInstituciones(),
				loadFacultades(),
				loadCarreras()
			]);

			// Verificar si hubo errores
			const errors = results.filter((r) => r.status === 'rejected');
			if (errors.length > 0) {
				console.warn('Algunos datos no se pudieron cargar:', errors);
				// No mostrar error si al menos una carga fue exitosa
				if (errors.length === 3) {
					error = 'Error al cargar los datos';
				}
			}

			// Ajustar vista del mapa a todos los datos cargados
			fitMapToAllData();
		} catch (err) {
			console.error('Error cargando datos:', err);
			error = 'Error al cargar los datos';
		} finally {
			loading = false;
		}
	}

	function fitMapToAllData() {
		if (!map || !L) return;

		try {
			const allLayers: any[] = [];

			// Recolectar todas las capas con geometría
			institucionesLayer?.eachLayer((layer: any) => allLayers.push(layer));
			facultadesLayer?.eachLayer((layer: any) => allLayers.push(layer));
			carrerasLayer?.eachLayer((layer: any) => allLayers.push(layer));

			if (allLayers.length > 0) {
				const group = L.featureGroup(allLayers);
				map.fitBounds(group.getBounds(), {
					padding: [50, 50],
					maxZoom: 15
				});
			}
		} catch (err) {
			console.log('No se pudo ajustar la vista del mapa:', err);
		}
	}

	async function loadInstituciones() {
		try {
			const response = await fetch('/api/admin/geoespacial/instituciones');
			if (!response.ok) {
				const errorData = await response.text();
				console.error('Error response instituciones:', errorData);
				throw new Error('Error cargando instituciones');
			}
			const data = await response.json();
			// Asegurar que sea un array
			if (Array.isArray(data)) {
				instituciones = data;
			} else if (data && Array.isArray(data.data)) {
				instituciones = data.data;
			} else {
				console.warn('Formato inesperado de instituciones:', data);
				instituciones = [];
			}
			renderInstituciones();
		} catch (err) {
			console.error('Error en loadInstituciones:', err);
			instituciones = [];
			throw err;
		}
	}

	async function loadFacultades() {
		try {
			const response = await fetch('/api/admin/geoespacial/facultades');
			if (!response.ok) {
				const errorData = await response.text();
				console.error('Error response facultades:', errorData);
				throw new Error('Error cargando facultades');
			}
			const data = await response.json();
			// Asegurar que sea un array
			if (Array.isArray(data)) {
				facultades = data;
			} else if (data && Array.isArray(data.data)) {
				facultades = data.data;
			} else {
				console.warn('Formato inesperado de facultades:', data);
				facultades = [];
			}
			renderFacultades();
		} catch (err) {
			console.error('Error en loadFacultades:', err);
			facultades = [];
			throw err;
		}
	}

	async function loadCarreras() {
		try {
			const response = await fetch('/api/admin/geoespacial/carreras');
			if (!response.ok) {
				const errorData = await response.text();
				console.error('Error response carreras:', errorData);
				throw new Error('Error cargando carreras');
			}
			const data = await response.json();
			// Asegurar que sea un array
			if (Array.isArray(data)) {
				carreras = data;
			} else if (data && Array.isArray(data.data)) {
				carreras = data.data;
			} else {
				console.warn('Formato inesperado de carreras:', data);
				carreras = [];
			}
			renderCarreras();
		} catch (err) {
			console.error('Error en loadCarreras:', err);
			carreras = [];
			throw err;
		}
	}

	function toggleFilter(type: 'institucion' | 'facultad' | 'carrera') {
		if (type === 'institucion') {
			showInstituciones = !showInstituciones;
			if (showInstituciones) {
				map.addLayer(institucionesLayer);
			} else {
				map.removeLayer(institucionesLayer);
			}
		} else if (type === 'facultad') {
			showFacultades = !showFacultades;
			if (showFacultades) {
				map.addLayer(facultadesLayer);
			} else {
				map.removeLayer(facultadesLayer);
			}
		} else if (type === 'carrera') {
			showCarreras = !showCarreras;
			if (showCarreras) {
				map.addLayer(carrerasLayer);
			} else {
				map.removeLayer(carrerasLayer);
			}
		}
	}

	function renderInstituciones() {
		if (!institucionesLayer || !L) return;
		institucionesLayer.clearLayers();

		instituciones.forEach((inst) => {
			if (!inst.geometry) {
				console.log(`Institución sin geometría: ${inst.nombre}`);
				return;
			}

			try {
				const feature = featureToGeoJSON(inst.geometry);
				if (!feature) {
					console.warn(`No se pudo convertir geometría de: ${inst.nombre}`, inst.geometry);
					return;
				}

				// En modo edición, solo mostrar la entidad seleccionada en gris
				if (editMode === 'edit' && selectedEntity && selectedEntity.id !== inst.id) {
					return; // No renderizar otras entidades
				}

				const color =
					editMode === 'edit' && selectedEntity && selectedEntity.id === inst.id
						? '#808080'
						: COLORS.institucion;
				const layer = L.geoJSON(feature, {
					style: {
						color: color,
						weight: 3,
						opacity: 0.8,
						fillOpacity: 0.3
					},
					pointToLayer: (feature: any, latlng: any) => {
						return L.circleMarker(latlng, {
							radius: 8,
							fillColor: color,
							color: '#fff',
							weight: 2,
							opacity: 1,
							fillOpacity: 0.8
						});
					}
				});

				layer.on('click', () => selectEntity(inst, 'institucion', layer));

				layer.addTo(institucionesLayer);
			} catch (err) {
				console.error(`Error renderizando institución ${inst.nombre}:`, err, inst.geometry);
			}
		});
	}

	function renderFacultades() {
		if (!facultadesLayer || !L) return;
		facultadesLayer.clearLayers();

		facultades.forEach((fac) => {
			// En modo edición, solo mostrar la entidad seleccionada
			if (editMode === 'edit' && selectedEntity && selectedEntity.id !== fac.id) {
				return;
			}

			if (!fac.geometry) {
				console.log(`Facultad sin geometría: ${fac.nombre}`);
				return;
			}
			try {
				const feature = featureToGeoJSON(fac.geometry);
				if (!feature) {
					console.warn(`No se pudo convertir geometría de: ${fac.nombre}`, fac.geometry);
					return;
				}

				const color =
					editMode === 'edit' && selectedEntity && selectedEntity.id === fac.id
						? '#808080'
						: COLORS.facultad;

				const layer = L.geoJSON(feature, {
					style: {
						color: color,
						weight: 3,
						opacity: 0.8,
						fillOpacity: 0.3
					},
					pointToLayer: (feature: any, latlng: any) => {
						return L.circleMarker(latlng, {
							radius: 8,
							fillColor: color,
							color: '#fff',
							weight: 2,
							opacity: 1,
							fillOpacity: 0.8
						});
					}
				});

				layer.on('click', () => selectEntity(fac, 'facultad', layer));

				layer.addTo(facultadesLayer);
			} catch (err) {
				console.error(`Error renderizando facultad ${fac.nombre}:`, err, fac.geometry);
			}
		});
	}

	function renderCarreras() {
		if (!carrerasLayer || !L) return;
		carrerasLayer.clearLayers();

		carreras.forEach((carr) => {
			// En modo edición, solo mostrar la entidad seleccionada
			if (editMode === 'edit' && selectedEntity && selectedEntity.id !== carr.id) {
				return;
			}

			if (!carr.geometry) {
				console.log(`Carrera sin geometría: ${carr.nombre}`);
				return;
			}

			try {
				const feature = featureToGeoJSON(carr.geometry);
				if (!feature) {
					console.warn(`No se pudo convertir geometría de: ${carr.nombre}`, carr.geometry);
					return;
				}

				const color =
					editMode === 'edit' && selectedEntity && selectedEntity.id === carr.id
						? '#808080'
						: COLORS.carrera;

				const layer = L.geoJSON(feature, {
					style: {
						color: color,
						weight: 3,
						opacity: 0.8,
						fillOpacity: 0.3
					},
					pointToLayer: (feature: any, latlng: any) => {
						return L.circleMarker(latlng, {
							radius: 8,
							fillColor: color,
							color: '#fff',
							weight: 2,
							opacity: 1,
							fillOpacity: 0.8
						});
					}
				});
				layer.on('click', () => selectEntity(carr, 'carrera', layer));

				layer.addTo(carrerasLayer);
			} catch (err) {
				console.error(`Error renderizando carrera ${carr.nombre}:`, err, carr.geometry);
			}
		});
	}

	function featureToGeoJSON(geometry: GeoJSONGeometry): any {
		if (!geometry) return null;

		const geom = geometry as any;

		// Normalizar el tipo a mayúscula inicial
		const normalizeType = (type: string) => {
			if (!type) return null;
			return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
		};

		// Si es un Feature (con mayúscula o minúscula)
		if (geom.type && normalizeType(geom.type) === 'Feature') {
			// Asegurar que el geometry interno también esté normalizado
			if (geom.geometry) {
				const normalizedGeometry = {
					...geom.geometry,
					type: normalizeType(geom.geometry.type)
				};
				return {
					type: 'Feature',
					properties: geom.properties || {},
					geometry: normalizedGeometry
				};
			}
		}

		// Si es geometría directa (Point, Polygon, etc)
		const normalizedType = normalizeType(geom.type);
		if (normalizedType === 'Point' || normalizedType === 'Polygon') {
			return {
				type: 'Feature',
				properties: {},
				geometry: {
					...geom,
					type: normalizedType
				}
			};
		}

		console.warn('Formato de geometría no reconocido:', geometry);
		return null;
	}

	function geoJSONToFeature(geoJSON: any): GeoJSONGeometry {
		if (!geoJSON) return null;

		let feature: any;

		// Si es FeatureCollection, tomar el primer feature
		if (geoJSON.type === 'FeatureCollection') {
			feature = geoJSON.features[0];
		}
		// Si es Feature, usarlo directamente
		else if (geoJSON.type === 'Feature') {
			feature = geoJSON;
		}
		// Si es geometría directa, crear un Feature
		else if (geoJSON.type === 'Point' || geoJSON.type === 'Polygon') {
			feature = {
				type: 'Feature',
				geometry: geoJSON,
				properties: {}
			};
		}

		if (!feature) return null;

		// Normalizar tipos a minúsculas para coincidir con formato esperado
		return {
			type: 'feature',
			geometry: {
				type: feature.geometry.type.toLowerCase(),
				coordinates: feature.geometry.coordinates
			},
			properties: feature.properties || {}
		};
	}

	function selectEntity(entity: any, type: 'institucion' | 'facultad' | 'carrera', layer: any) {
		selectedEntity = entity;
		selectedType = type;
		editMode = 'view';

		// Centrar el mapa en la entidad
		if (layer && layer.getBounds) {
			map.fitBounds(layer.getBounds(), { padding: [50, 50] });
		} else if (layer && layer.getLatLng) {
			map.setView(layer.getLatLng(), 15);
		}
	}

	function handleSearchQuery(
		query: string,
		type: 'institucion' | 'facultad' | 'carrera',
		field: string
	): any[] {
		if (!query.trim()) {
			return [];
		}

		const searchLower = query.toLowerCase();
		const results: any[] = [];

		// Buscar según el tipo seleccionado
		if (type === 'institucion') {
			const campo = field as 'todos' | 'nombre' | 'sigla' | 'pais';
			instituciones.forEach((inst) => {
				let matches = false;

				if (campo === 'todos') {
					matches =
						inst.nombre.toLowerCase().includes(searchLower) ||
						inst.sigla?.toLowerCase().includes(searchLower) ||
						inst.pais?.toLowerCase().includes(searchLower);
				} else if (campo === 'nombre') {
					matches = inst.nombre.toLowerCase().includes(searchLower);
				} else if (campo === 'sigla') {
					matches = inst.sigla?.toLowerCase().includes(searchLower);
				} else if (campo === 'pais') {
					matches = inst.pais?.toLowerCase().includes(searchLower);
				}

				if (matches) {
					results.push({ ...inst, type: 'institucion' });
				}
			});
		} else if (type === 'facultad') {
			const campo = field as 'todos' | 'nombre' | 'sigla' | 'decano' | 'subdecano';
			facultades.forEach((fac) => {
				let matches = false;

				if (campo === 'todos') {
					matches =
						fac.nombre.toLowerCase().includes(searchLower) ||
						fac.sigla?.toLowerCase().includes(searchLower) ||
						fac.decano?.toLowerCase().includes(searchLower) ||
						fac.subdecano?.toLowerCase().includes(searchLower);
				} else if (campo === 'nombre') {
					matches = fac.nombre.toLowerCase().includes(searchLower);
				} else if (campo === 'sigla') {
					matches = fac.sigla?.toLowerCase().includes(searchLower);
				} else if (campo === 'decano') {
					matches = fac.decano?.toLowerCase().includes(searchLower);
				} else if (campo === 'subdecano') {
					matches = fac.subdecano?.toLowerCase().includes(searchLower);
				}

				if (matches) {
					results.push({ ...fac, type: 'facultad' });
				}
			});
		} else if (type === 'carrera') {
			const campo = field as 'todos' | 'nombre';
			carreras.forEach((carr) => {
				let matches = false;

				if (campo === 'todos' || campo === 'nombre') {
					matches = carr.nombre.toLowerCase().includes(searchLower);
				}

				if (matches) {
					results.push({ ...carr, type: 'carrera' });
				}
			});
		}

		return results;
	}

	function selectSearchResult(result: any) {
		// Seleccionar la entidad
		selectedEntity = result;
		selectedType = result.type;
		editMode = 'view';

		// Centrar el mapa en la geometría
		if (result.geometry && L) {
			const feature = featureToGeoJSON(result.geometry);
			if (feature) {
				const tempLayer = L.geoJSON(feature);
				if (tempLayer.getBounds) {
					map.fitBounds(tempLayer.getBounds(), { padding: [50, 50], maxZoom: 16 });
				} else {
					// Para puntos
					const coords =
						(result.geometry as any).coordinates || (result.geometry as any).geometry?.coordinates;
					if (coords && coords.length === 2) {
						map.setView([coords[1], coords[0]], 15);
					}
				}
			}
		}
	}

	function findLayerByEntity(entity: any): any {
		// Simplificado - en producción necesitarías un tracking más robusto
		return null;
	}

	function disableLayerInteractions() {
		// Deshabilitar clicks en todas las capas durante la edición
		if (institucionesLayer) {
			institucionesLayer.eachLayer((layer: any) => {
				if (layer.closePopup) layer.closePopup();
				if (layer.off) layer.off('click');
			});
		}
		if (facultadesLayer) {
			facultadesLayer.eachLayer((layer: any) => {
				if (layer.closePopup) layer.closePopup();
				if (layer.off) layer.off('click');
			});
		}
		if (carrerasLayer) {
			carrerasLayer.eachLayer((layer: any) => {
				if (layer.closePopup) layer.closePopup();
				if (layer.off) layer.off('click');
			});
		}
	}

	function enableLayerInteractions() {
		// Re-renderizar para restaurar los eventos
		renderInstituciones();
		renderFacultades();
		renderCarreras();
	}

	function hideAllLayers() {
		// Ocultar todas las capas
		if (institucionesLayer) institucionesLayer.clearLayers();
		if (facultadesLayer) facultadesLayer.clearLayers();
		if (carrerasLayer) carrerasLayer.clearLayers();
	}

	function showAllLayers() {
		// Volver a renderizar todas las capas
		setTimeout(() => {
			renderInstituciones();
			renderFacultades();
			renderCarreras();
		}, 100);
	}

	function startEdit() {
		if (!selectedEntity) return;

		// Cerrar todos los popups abiertos
		if (map) {
			map.closePopup();
		}

		editMode = 'edit';
		fullscreenEditMode = false; // Mantener en modo normal, no pantalla completa

		// Ocultar todas las capas del mapa
		hideAllLayers(); // Renderizar solo la entidad seleccionada en gris
		setTimeout(() => {
			if (selectedType === 'institucion') {
				renderInstituciones();
			} else if (selectedType === 'facultad') {
				renderFacultades();
			} else if (selectedType === 'carrera') {
				renderCarreras();
			}
		}, 50);

		// Llenar formulario
		formData = {
			nombre: selectedEntity.nombre,
			sigla: selectedEntity.sigla || '',
			pais: selectedEntity.pais || '',
			institucion_id: selectedEntity.institucion_id || null,
			decano: selectedEntity.decano || '',
			subdecano: selectedEntity.subdecano || '',
			facultad_id: selectedEntity.facultad_id || null,
			geometry: selectedEntity.geometry
		};

		// Activar herramientas de edición
		setTimeout(() => {
			enableDrawControls();
			loadGeometryForEdit(selectedEntity.geometry);
		}, 100);
	}

	function enableDrawControls() {
		if (!L || !map || !drawnItems) return;

		// Verificar que L.Draw esté disponible
		if (!L.Draw || !L.Draw.Event) {
			console.error('L.Draw no está disponible');
			return;
		}

		if (drawControl) {
			map.removeControl(drawControl);
		}

		drawnItems.clearLayers();

		drawControl = new L.Control.Draw({
			edit: {
				featureGroup: drawnItems,
				edit: {
					selectedPathOptions: {
						maintainColor: false,
						weight: 3,
						opacity: 0.5
					}
				},
				remove: true
			},
			draw: {
				polygon: {
					allowIntersection: false,
					showArea: true,
					repeatMode: false,
					drawError: {
						color: '#e74c3c',
						message: 'Error: Las líneas no pueden cruzarse'
					},
					shapeOptions: {
						color: selectedType ? COLORS[selectedType] : '#3b82f6',
						weight: 3,
						fillOpacity: 0.3
					}
				},
				marker: true,
				circle: false,
				rectangle: false,
				polyline: false,
				circlemarker: false
			}
		});

		map.addControl(drawControl);

		map.on(L.Draw.Event.CREATED, handleDrawCreated);
		map.on(L.Draw.Event.EDITED, handleDrawEdited);
	}

	function loadGeometryForEdit(geometry: GeoJSONGeometry) {
		if (!geometry || !L || !map) return;

		drawnItems.clearLayers();

		const feature = featureToGeoJSON(geometry);
		if (!feature) return;

		try {
			const layer = L.geoJSON(feature, {
				style: {
					color: selectedType ? COLORS[selectedType] : '#3b82f6',
					weight: 3,
					fillOpacity: 0.3
				}
			});

			layer.eachLayer((l: any) => {
				drawnItems.addLayer(l);
			});

			if (drawnItems.getLayers().length > 0) {
				map.fitBounds(drawnItems.getBounds(), { padding: [50, 50] });
			}
		} catch (err) {
			console.error('Error cargando geometría para edición:', err);
		}
	}

	function handleDrawCreated(e: any) {
		const layer = e.layer;
		drawnItems.clearLayers();
		drawnItems.addLayer(layer);
		const newGeometry = geoJSONToFeature(layer.toGeoJSON());
		formData.geometry = newGeometry;
		// Forzar actualización reactiva
		formData = { ...formData };
	}

	function handleDrawEdited(e: any) {
		const layers = e.layers;
		layers.eachLayer((layer: any) => {
			const newGeometry = geoJSONToFeature(layer.toGeoJSON());
			formData.geometry = newGeometry;
			// Forzar actualización reactiva
			formData = { ...formData };
		});
	}

	async function saveEdit() {
		if (!selectedEntity || !selectedType) return;

		loading = true;
		error = '';
		success = '';

		try {
			const endpoint = `/api/admin/geoespacial/${
				selectedType === 'institucion'
					? 'instituciones'
					: selectedType === 'facultad'
						? 'facultades'
						: 'carreras'
			}/${selectedEntity.id}`;

			const response = await fetch(endpoint, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Error al actualizar');
			}

			success = 'Actualizado correctamente';
			await loadAllData();
			cancelEdit();
			// Asegurar que el mapa vuelva al estado normal
			setTimeout(() => {
				if (map) map.closePopup();
			}, 150);
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function cancelEdit() {
		editMode = 'view';
		fullscreenEditMode = false;
		selectedEntity = null;
		selectedType = null;

		// Mostrar todas las capas nuevamente
		showAllLayers();
		if (drawnItems) {
			drawnItems.clearLayers();
		}
		if (drawControl && map) {
			map.removeControl(drawControl);
			drawControl = null;
		}
		formData = {
			nombre: '',
			sigla: '',
			pais: '',
			institucion_id: null,
			decano: '',
			subdecano: '',
			facultad_id: null,
			geometry: null
		};
		// Volver a renderizar las capas
		setTimeout(() => {
			renderInstituciones();
			renderFacultades();
			renderCarreras();
		}, 100);
	}

	function confirmDelete() {
		if (!selectedEntity || !selectedType) return;

		entityToDelete = {
			name: selectedEntity.nombre || 'esta entidad',
			type: selectedType === 'institucion' ? 'institución' : selectedType
		};
		showDeleteModal = true;
	}

	async function deleteEntity() {
		if (!selectedEntity || !selectedType) return;

		showDeleteModal = false;
		loading = true;
		error = '';

		try {
			const endpoint = `/api/admin/geoespacial/${
				selectedType === 'institucion'
					? 'instituciones'
					: selectedType === 'facultad'
						? 'facultades'
						: 'carreras'
			}/${selectedEntity.id}`;

			const response = await fetch(endpoint, { method: 'DELETE' });

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Error al eliminar');
			}

			success = 'Eliminado correctamente';
			await loadAllData();
			cancelEdit();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
			entityToDelete = null;
		}
	}

	function cancelDelete() {
		showDeleteModal = false;
		entityToDelete = null;
	}

	function openCreateModal(type: 'institucion' | 'facultad' | 'carrera') {
		createType = type;
		selectedType = type;
		editMode = 'create';

		// Crear entidad temporal para el panel
		selectedEntity = {
			id: null,
			nombre: '',
			sigla: '',
			pais: '',
			institucion_id: null,
			decano: '',
			subdecano: '',
			facultad_id: null,
			geometry: null
		};

		formData = {
			nombre: '',
			sigla: '',
			pais: '',
			institucion_id: null,
			decano: '',
			subdecano: '',
			facultad_id: null,
			geometry: null
		};

		// Ocultar todas las capas
		hideAllLayers();

		// Activar herramientas de dibujo
		setTimeout(() => {
			enableDrawControlsForCreate();
		}, 100);
	}

	async function searchLocation() {
		if (!locationSearchQuery.trim()) return;

		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					locationSearchQuery
				)}&limit=5`
			);
			locationSearchResults = await response.json();
		} catch (err) {
			console.error('Error buscando ubicación:', err);
		}
	}

	async function searchMapLocation() {
		if (!mapLocationQuery.trim()) {
			mapLocationResults = [];
			return;
		}

		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					mapLocationQuery
				)}&limit=5`
			);
			mapLocationResults = await response.json();
		} catch (err) {
			console.error('Error buscando ubicación:', err);
			mapLocationResults = [];
		}
	}

	function selectMapLocation(result: any) {
		const lat = parseFloat(result.lat);
		const lon = parseFloat(result.lon);

		map.setView([lat, lon], 15);

		showMapLocationSearch = false;
		mapLocationQuery = '';
		mapLocationResults = [];
	}

	function toggleMapLocationSearch() {
		showMapLocationSearch = !showMapLocationSearch;
		if (!showMapLocationSearch) {
			mapLocationQuery = '';
			mapLocationResults = [];
		}
	}

	function selectLocation(result: any) {
		const lat = parseFloat(result.lat);
		const lon = parseFloat(result.lon);

		map.setView([lat, lon], 15);

		showLocationSearch = false;
		locationSearchQuery = '';
		locationSearchResults = [];

		// Activar herramientas de dibujo
		enableDrawControlsForCreate();
	}

	function enableDrawControlsForCreate() {
		if (!L || !map || !drawnItems) {
			console.log('⏳ Esperando L, map o drawnItems');
			return;
		}

		// Verificar que L.Draw esté disponible
		if (!L.Draw || !L.Draw.Event) {
			console.error('❌ L.Draw no está disponible. L.Draw:', L.Draw);
			return;
		}

		console.log('✅ Activando controles de dibujo para crear:', createType);

		if (drawControl) {
			map.removeControl(drawControl);
		}

		drawnItems.clearLayers();

		// Para carreras usamos marker (punto), para otros usamos polygon
		const isCarrera = createType === 'carrera';

		drawControl = new L.Control.Draw({
			edit: {
				featureGroup: drawnItems,
				edit: {
					selectedPathOptions: {
						maintainColor: false,
						weight: 3,
						opacity: 0.5
					}
				},
				remove: false
			},
			draw: {
				polygon: isCarrera
					? false
					: {
							allowIntersection: false,
							showArea: false, // Deshabilitado para evitar error de leaflet-draw
							repeatMode: false,
							drawError: {
								color: '#e74c3c',
								message: 'Error: Las líneas no pueden cruzarse'
							},
							shapeOptions: {
								color: '#808080',
								weight: 3,
								fillOpacity: 0.3
							},
							metric: false,
							feet: false,
							nautic: false
						},
				marker: isCarrera ? {} : false,
				circle: false,
				rectangle: false,
				polyline: false,
				circlemarker: false
			}
		});

		map.addControl(drawControl);

		// Agregar botón de búsqueda personalizado
		setTimeout(() => {
			const toolbar = document.querySelector('.leaflet-draw-toolbar');
			if (toolbar) {
				// Eliminar botón anterior si existe
				const existingBtn = toolbar.querySelector('.custom-search-location-btn');
				if (existingBtn) existingBtn.remove();

				// Crear botón de búsqueda
				const searchBtn = document.createElement('a');
				searchBtn.href = '#';
				searchBtn.className = 'custom-search-location-btn';
				searchBtn.title = 'Buscar ubicación';
				searchBtn.innerHTML = '<span class="sr-only">Buscar ubicación</span>🔍';
				searchBtn.style.cssText = `
					display: block;
					width: 26px;
					height: 26px;
					line-height: 26px;
					text-align: center;
					text-decoration: none;
					font-size: 16px;
					background: white;
					border-bottom: 1px solid #ccc;
					cursor: pointer;
				`;
				searchBtn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					toggleMapLocationSearch();
				});

				// Insertar al inicio de la toolbar
				toolbar.insertBefore(searchBtn, toolbar.firstChild);
			}
		}, 100);

		map.on(L.Draw.Event.CREATED, handleDrawCreated);
		map.on(L.Draw.Event.EDITED, handleDrawEdited);
	}

	async function createEntity() {
		loading = true;
		error = '';
		success = '';

		try {
			const endpoint = `/api/admin/geoespacial/${
				selectedType === 'institucion'
					? 'instituciones'
					: selectedType === 'facultad'
						? 'facultades'
						: 'carreras'
			}`;

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Error al crear');
			}

			success = 'Creado correctamente';
			await loadAllData();
			cancelEdit();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function closeCreateModal() {
		showCreateModal = false;
		showLocationSearch = false;
		drawnItems.clearLayers();
		if (drawControl) {
			map.removeControl(drawControl);
		}
		formData = {
			nombre: '',
			sigla: '',
			pais: '',
			institucion_id: null,
			decano: '',
			subdecano: '',
			facultad_id: null,
			geometry: null
		};
	}
</script>

<div class="mapa-crud" style="height: {height};">
	<!-- Barra superior con filtros y acciones -->
	{#if !fullscreenEditMode}
		<TopBar
			{instituciones}
			{facultades}
			{carreras}
			{showInstituciones}
			{showFacultades}
			{showCarreras}
			onToggleFilter={toggleFilter}
			onOpenCreate={openCreateModal}
			onSearch={handleSearchQuery}
			onSelectResult={selectSearchResult}
		/>
	{/if}

	<!-- Panel de entidad seleccionada (oculto en modo edición) -->
	{#if selectedEntity && editMode === 'view' && !fullscreenEditMode}
		<div class="entity-panel">
			<div class="entity-header">
				<h3>{selectedEntity.nombre}</h3>
				<button class="btn-close" on:click={cancelEdit}>×</button>
			</div>
			<div class="entity-body">
				{#if selectedEntity.sigla}
					<p><strong>Sigla:</strong> {selectedEntity.sigla}</p>
				{/if}
				{#if selectedEntity.pais}
					<p><strong>País:</strong> {selectedEntity.pais}</p>
				{/if}
				{#if selectedType === 'facultad'}
					{#if selectedEntity.decano}
						<p><strong>Decano:</strong> {selectedEntity.decano}</p>
					{/if}
					{#if selectedEntity.institucion_nombre}
						<p><strong>Institución:</strong> {selectedEntity.institucion_nombre}</p>
					{/if}
				{/if}
				{#if selectedType === 'carrera'}
					{#if selectedEntity.facultad_nombre}
						<p><strong>Facultad:</strong> {selectedEntity.facultad_nombre}</p>
					{/if}
					{#if selectedEntity.institucion_nombre}
						<p><strong>Institución:</strong> {selectedEntity.institucion_nombre}</p>
					{/if}
				{/if}
			</div>
			<div class="entity-actions">
				<button class="btn-edit" on:click={startEdit}>Editar</button>
				<button class="btn-delete" on:click={confirmDelete}>Eliminar</button>
			</div>
		</div>
	{/if}

	<!-- Panel de edición/creación (reemplaza el panel de vista) -->
	{#if (editMode === 'edit' || editMode === 'create') && selectedEntity}
		<div class="entity-panel edit-panel">
			<div class="entity-header">
				<h3>
					{#if editMode === 'create'}
						➕ Nueva {selectedType === 'institucion'
							? 'Institución'
							: selectedType === 'facultad'
								? 'Facultad'
								: 'Carrera'}
					{:else}
						✏️ Editando {selectedType === 'institucion'
							? 'Institución'
							: selectedType === 'facultad'
								? 'Facultad'
								: 'Carrera'}
					{/if}
				</h3>
				<button class="btn-close" on:click={cancelEdit}>×</button>
			</div>

			<div class="entity-body">
				<form on:submit|preventDefault={editMode === 'create' ? createEntity : saveEdit}>
					<div class="form-group">
						<label for="edit-nombre">Nombre *</label>
						<input id="edit-nombre" type="text" bind:value={formData.nombre} required />
					</div>

					<div class="form-group">
						<label for="edit-sigla">Sigla</label>
						<input id="edit-sigla" type="text" bind:value={formData.sigla} />
					</div>

					{#if selectedType === 'institucion'}
						<div class="form-group">
							<label for="edit-pais">País</label>
							<input id="edit-pais" type="text" bind:value={formData.pais} />
						</div>
					{/if}

					{#if selectedType === 'facultad'}
						<div class="form-group">
							<label for="edit-institucion">Institución *</label>
							<select id="edit-institucion" bind:value={formData.institucion_id} required>
								<option value={null}>Seleccione una institución</option>
								{#each instituciones as inst}
									<option value={inst.id}>{inst.nombre}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label for="edit-decano">Decano</label>
							<input id="edit-decano" type="text" bind:value={formData.decano} />
						</div>
						<div class="form-group">
							<label for="edit-subdecano">Subdecano</label>
							<input id="edit-subdecano" type="text" bind:value={formData.subdecano} />
						</div>
					{/if}

					{#if selectedType === 'carrera'}
						<div class="form-group">
							<label for="edit-facultad">Facultad *</label>
							<select id="edit-facultad" bind:value={formData.facultad_id} required>
								<option value={null}>Seleccione una facultad</option>
								{#each facultades as fac}
									<option value={fac.id}>{fac.nombre}</option>
								{/each}
							</select>
						</div>
					{/if}
					<div class="form-group">
						<label for="edit-geometry">Geometría (GeoJSON)</label>
						<p class="help-text">Use las herramientas del mapa para editar</p>
						<textarea
							id="edit-geometry"
							readonly
							rows="6"
							value={formData.geometry
								? JSON.stringify(formData.geometry, null, 2)
								: 'Sin geometría'}
							class="geometry-viewer"
						/>
					</div>

					<div class="entity-actions">
						<button type="button" class="btn-cancel" on:click={cancelEdit}>Cancelar</button>
						<button type="submit" class="btn-save" disabled={loading}>
							{#if editMode === 'create'}
								{loading ? 'Creando...' : 'Crear'}
							{:else}
								{loading ? 'Guardando...' : 'Guardar'}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Contenedor del mapa y panel lateral -->
	<div class="map-wrapper" class:has-side-panel={showCreateModal}>
		<!-- Mapa -->
		<div
			bind:this={mapContainer}
			class="map-container"
			class:create-mode={editMode === 'create'}
			class:create-carrera={editMode === 'create' && createType === 'carrera'}
			class:create-polygon={editMode === 'create' && createType !== 'carrera'}
		/>

		<!-- Panel lateral de creación/edición -->
		{#if showCreateModal}
			<div class="side-panel">
				<div class="panel-header">
					<h3>
						Nueva {createType === 'institucion'
							? 'Institución'
							: createType === 'facultad'
								? 'Facultad'
								: 'Carrera'}
					</h3>
					<button class="btn-close-panel" on:click={closeCreateModal}>×</button>
				</div>

				<div class="panel-body">
					{#if !showLocationSearch}
						<button class="btn-search-location" on:click={() => (showLocationSearch = true)}>
							🔍 Buscar ubicación
						</button>
					{/if}

					{#if showLocationSearch}
						<div class="location-search">
							<div class="location-search-input">
								<input
									type="text"
									bind:value={locationSearchQuery}
									placeholder="Ej: Universidad de Alicante, España"
									on:keydown={(e) => e.key === 'Enter' && searchLocation()}
								/>
								<button type="button" on:click={searchLocation}>Buscar</button>
							</div>
							{#if locationSearchResults.length > 0}
								<div class="location-results">
									{#each locationSearchResults as result}
										<button class="location-result-item" on:click={() => selectLocation(result)}>
											<div class="location-name">{result.display_name}</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<form on:submit|preventDefault={createEntity} class="create-form">
						<div class="form-group">
							<label for="create-nombre">Nombre *</label>
							<input id="create-nombre" type="text" bind:value={formData.nombre} required />
						</div>
						<div class="form-group">
							<label for="create-sigla">Sigla</label>
							<input id="create-sigla" type="text" bind:value={formData.sigla} />
						</div>
						{#if createType === 'institucion'}
							<div class="form-group">
								<label for="create-pais">País</label>
								<input id="create-pais" type="text" bind:value={formData.pais} />
							</div>
						{/if}
						{#if createType === 'facultad'}
							<div class="form-group">
								<label for="create-institucion">Institución *</label>
								<select id="create-institucion" bind:value={formData.institucion_id} required>
									<option value={null}>Seleccione una institución</option>
									{#each instituciones as inst}
										<option value={inst.id}>{inst.nombre}</option>
									{/each}
								</select>
							</div>
							<div class="form-group">
								<label for="create-decano">Decano</label>
								<input id="create-decano" type="text" bind:value={formData.decano} />
							</div>
						{/if}
						{#if createType === 'carrera'}
							<div class="form-group">
								<label for="create-facultad">Facultad *</label>
								<select id="create-facultad" bind:value={formData.facultad_id} required>
									<option value={null}>Seleccione una facultad</option>
									{#each facultades as fac}
										<option value={fac.id}>{fac.nombre}</option>
									{/each}
								</select>
							</div>
						{/if}
						<p class="help-text">
							{#if createType === 'carrera'}
								Haga clic en el botón de marcador y coloque un punto en el mapa
							{:else}
								Dibuje el polígono en el mapa usando la herramienta de dibujo
							{/if}
						</p>
						<div class="form-actions">
							<button type="button" class="btn-cancel" on:click={closeCreateModal}>
								Cancelar
							</button>
							<button type="submit" class="btn-save" disabled={loading || !formData.geometry}>
								{loading ? 'Creando...' : 'Crear'}
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>

	<!-- Barra de búsqueda flotante en el mapa (modo creación) -->
	{#if showMapLocationSearch && editMode === 'create'}
		<div class="map-search-bar">
			<div class="map-search-header">
				<input
					type="text"
					bind:value={mapLocationQuery}
					on:input={searchMapLocation}
					placeholder="Buscar ciudad, país, dirección..."
					class="map-search-input"
				/>
				<button class="map-search-close" on:click={toggleMapLocationSearch}>×</button>
			</div>
			{#if mapLocationResults.length > 0}
				<div class="map-search-results">
					{#each mapLocationResults as result}
						<button class="map-search-result-item" on:click={() => selectMapLocation(result)}>
							<span class="location-icon">📍</span>
							<div class="location-info">
								<div class="location-name">{result.display_name}</div>
							</div>
						</button>
					{/each}
				</div>
			{:else if mapLocationQuery.trim()}
				<div class="map-search-no-results">No se encontraron ubicaciones</div>
			{/if}
		</div>
	{/if}

	<!-- Modal de confirmación de eliminación -->
	{#if showDeleteModal && entityToDelete}
		<div
			class="modal-overlay"
			on:click={cancelDelete}
			on:keydown={(e) => e.key === 'Escape' && cancelDelete()}
			role="button"
			tabindex="-1"
		>
			<div class="modal-delete" on:click|stopPropagation on:keydown role="dialog" tabindex="-1">
				<div class="modal-header-delete">
					<h3>⚠️ Confirmar eliminación</h3>
				</div>
				<div class="modal-body-delete">
					<p>¿Estás seguro de que deseas eliminar <strong>{entityToDelete.name}</strong>?</p>
					<p class="warning-text">Esta acción no se puede deshacer.</p>
				</div>
				<div class="modal-footer-delete">
					<button class="btn-cancel" on:click={cancelDelete}>Cancelar</button>
					<button class="btn-delete-confirm" on:click={deleteEntity}>Eliminar</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Mensajes -->
	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}
	{#if success}
		<div class="alert alert-success">{success}</div>
	{/if}
</div>

<style>
	.mapa-crud {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
		overflow: hidden;
		border-radius: 0.5rem;
		background: var(--color--page-background, #f9fafb);
		display: flex;
		flex-direction: column;
	}

	.map-wrapper {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr;
		min-height: 0;
		overflow: hidden;
	}

	.map-wrapper.has-side-panel {
		grid-template-columns: 1fr 280px;
	}

	.map-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
		z-index: 1;
		background: #e5e7eb;
	}

	/* Ocultar controles de zoom siempre */
	:global(.leaflet-control-zoom) {
		display: none !important;
	}

	/* Ocultar control de remove siempre */
	:global(.leaflet-draw-edit-remove) {
		display: none !important;
	}

	/* Ocultar botones de dibujo por defecto */
	:global(.leaflet-draw-draw-marker),
	:global(.leaflet-draw-draw-polygon) {
		display: none !important;
	}

	/* Mostrar botón de polígono solo para instituciones y facultades */
	.create-polygon :global(.leaflet-draw-draw-polygon) {
		display: block !important;
	}

	/* Mostrar botón de marker (punto) solo para carreras */
	.create-carrera :global(.leaflet-draw-draw-marker) {
		display: block !important;
	}

	/* Barra de búsqueda flotante en el mapa */
	.map-search-bar {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		min-width: 340px;
		max-width: 90vw;
		overflow: hidden;
		animation: slideDown 0.25s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.map-search-header {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.625rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.map-search-input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: none;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		outline: none;
		transition: background 0.2s;
	}

	.map-search-input:focus {
		background: white;
	}

	.map-search-close {
		margin-left: 0.375rem;
		padding: 0;
		border: none;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border-radius: 0.25rem;
		font-size: 1.125rem;
		font-weight: bold;
		cursor: pointer;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.map-search-close:hover {
		background: rgba(255, 255, 255, 0.25);
		transform: scale(1.05);
	}

	.map-search-results {
		max-height: 200px;
		overflow-y: auto;
	}

	.map-search-result-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border: none;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.06);
		background: var(--color--card-background, white);
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
	}

	.map-search-result-item:hover {
		background: rgba(102, 126, 234, 0.05);
	}

	.map-search-result-item:last-child {
		border-bottom: none;
	}

	.location-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.location-info {
		flex: 1;
		min-width: 0;
	}

	.location-name {
		font-size: 0.75rem;
		color: var(--color--text, #374151);
		line-height: 1.3;
	}

	.map-search-no-results {
		padding: 0.75rem;
		text-align: center;
		color: var(--color--text-shade, #9ca3af);
		font-size: 0.75rem;
	}

	/* Barra superior */
	/* Panel de entidad */
	.entity-panel {
		position: absolute;
		right: 0.75rem;
		bottom: 0.75rem;
		width: 300px;
		background: var(--color--card-background, white);
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		z-index: 999;
		max-height: calc(100vh - 100px);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.entity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.625rem 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 0.5rem 0.5rem 0 0;
	}

	.entity-header h3 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.btn-close {
		background: rgba(255, 255, 255, 0.15);
		border: none;
		font-size: 1.125rem;
		color: white;
		cursor: pointer;
		padding: 0;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.btn-close:hover {
		background: rgba(255, 255, 255, 0.25);
		transform: scale(1.05);
	}

	.entity-body {
		padding: 0.625rem 0.75rem;
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.entity-body p {
		margin: 0.375rem 0;
		font-size: 0.75rem;
		color: var(--color--text, #374151);
		line-height: 1.35;
	}

	.entity-body form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.form-group label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color--text-shade, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		padding: 0.375rem 0.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		transition: all 0.2s;
		background: var(--color--page-background, #f9fafb);
		color: var(--color--text, #111827);
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
		background: var(--color--card-background, white);
	}

	.help-text {
		font-size: 0.625rem;
		color: var(--color--text-shade, #9ca3af);
		margin-top: -0.125rem;
		font-style: italic;
	}

	.geometry-viewer {
		font-family: 'Courier New', monospace;
		font-size: 0.6875rem;
		background: var(--color--page-background, #f9fafb);
		color: var(--color--text, #111827);
		resize: vertical;
		min-height: 60px;
	}

	.entity-actions {
		display: flex;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: var(--color--page-background, #f9fafb);
		border-radius: 0 0 0.5rem 0.5rem;
	}

	.btn-edit,
	.btn-delete,
	.btn-cancel,
	.btn-save {
		flex: 1;
		padding: 0.375rem 0.625rem;
		border: none;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 0.6875rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.btn-edit {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}

	.btn-edit:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-delete {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
	}

	.btn-delete:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
	}

	.btn-cancel {
		background: rgba(var(--color--text-rgb), 0.05);
		color: var(--color--text-shade, #6b7280);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.btn-cancel:hover {
		background: rgba(var(--color--text-rgb), 0.08);
		color: var(--color--text, #374151);
		transform: translateY(-1px);
	}

	.btn-save {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
	}

	.btn-save:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Formulario de creación */
	.create-form {
		padding: 0;
	}

	.form-group {
		margin-bottom: 0.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 600;
		font-size: 0.6875rem;
		color: var(--color--text-shade, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		background: var(--color--page-background, #f9fafb);
		color: var(--color--text, #111827);
		transition: all 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
		background: var(--color--card-background, white);
		box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
	}

	.help-text {
		font-size: 0.625rem;
		color: var(--color--text-shade, #9ca3af);
		margin: 0.5rem 0;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.625rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.06);
	}

	/* Panel lateral incrustado */
	.side-panel {
		background: var(--color--card-background, white);
		border-left: 1px solid rgba(var(--color--text-rgb), 0.08);
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		z-index: 10;
		box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.625rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		flex-shrink: 0;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.btn-close-panel {
		background: rgba(255, 255, 255, 0.15);
		border: none;
		font-size: 1.25rem;
		color: white;
		cursor: pointer;
		padding: 0;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.btn-close-panel:hover {
		background: rgba(255, 255, 255, 0.25);
		transform: scale(1.05);
	}

	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.625rem;
		min-height: 0;
	}

	.btn-search-location {
		display: block;
		width: 100%;
		margin-bottom: 0.5rem;
		padding: 0.4rem 0.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3);
	}

	.btn-search-location:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
	}

	/* Búsqueda de ubicación */
	.location-search {
		margin-bottom: 0.5rem;
	}

	.location-search-input {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.location-search-input input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		background: var(--color--page-background, #f9fafb);
		color: var(--color--text, #111827);
	}

	.location-search-input button {
		padding: 0.375rem 0.625rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.location-search-input button:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
	}

	.location-results {
		max-height: 100px;
		overflow-y: auto;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 0.25rem;
		background: var(--color--card-background, white);
	}

	.location-result-item {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.05);
		transition: background 0.15s;
	}

	.location-result-item:hover {
		background: rgba(102, 126, 234, 0.05);
	}

	.location-result-item:last-child {
		border-bottom: none;
	}

	.location-name {
		font-size: 0.75rem;
		color: var(--color--text, #374151);
		line-height: 1.3;
	}

	/* Alertas */
	.alert {
		position: absolute;
		bottom: 0.75rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.625rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		z-index: 1000;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		font-weight: 500;
		animation: slideUp 0.3s ease-out;
	}

	.alert-error {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
		color: white;
		border: none;
	}

	.alert-success {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%);
		color: white;
		border: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.map-wrapper.has-side-panel {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 45vh;
		}

		.side-panel {
			border-left: none;
			border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
			box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
		}

		.entity-panel {
			width: calc(100% - 1.5rem);
			right: 0.75rem;
			left: 0.75rem;
			top: auto;
			bottom: 0.75rem;
			max-height: 45vh;
		}

		.map-search-bar {
			min-width: calc(100% - 1.5rem);
			max-width: calc(100% - 1.5rem);
		}

		.modal-delete {
			max-width: calc(100% - 2rem);
		}
	}

	/* Modal de confirmación de eliminación */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
	}

	.modal-delete {
		background: var(--color--card-background, white);
		border-radius: 0.5rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		max-width: 320px;
		width: 90%;
		overflow: hidden;
		animation: scaleIn 0.2s ease-out;
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-header-delete {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.modal-header-delete h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.modal-body-delete {
		padding: 0.875rem 1rem;
	}

	.modal-body-delete p {
		margin: 0 0 0.5rem;
		color: var(--color--text, #374151);
		line-height: 1.35;
		font-size: 0.8125rem;
	}

	.modal-body-delete p:last-child {
		margin-bottom: 0;
	}

	.warning-text {
		font-size: 0.75rem;
		color: var(--color--text-shade, #9ca3af);
		font-style: italic;
	}

	.modal-footer-delete {
		padding: 0.625rem 1rem;
		background: var(--color--page-background, #f9fafb);
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
	}

	.btn-cancel {
		padding: 0.375rem 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		background: var(--color--card-background, white);
		color: var(--color--text, #374151);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-cancel:hover {
		background: var(--color--page-background, #f3f4f6);
		border-color: rgba(var(--color--text-rgb), 0.2);
		transform: translateY(-1px);
	}

	.btn-delete-confirm {
		padding: 0.375rem 0.75rem;
		border: none;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(245, 87, 108, 0.3);
	}

	.btn-delete-confirm:hover {
		transform: translateY(-1px);
		box-shadow: 0 3px 8px rgba(245, 87, 108, 0.4);
	}

	.btn-delete-confirm:active {
		transform: translateY(0);
	}
</style>
