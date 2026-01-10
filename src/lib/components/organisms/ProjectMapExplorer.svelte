<!-- src/lib/components/organisms/ProjectMapExplorer.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade, slide } from 'svelte/transition';
	import LeafletMapComponent from '$lib/components/atoms/LeafletMap.svelte';
	import ProjectFilters from '$lib/components/molecules/ProjectFilters.svelte';
	import ProjectsDetail from '$lib/components/molecules/ProjectsDetail.svelte';
	import ProjectsChoropleth from '$lib/components/molecules/ProjectsChoropleth.svelte';
	import ProjectsMapLegend from '$lib/components/molecules/ProjectsMapLegend.svelte';
	import { obtenerProyectos, type Proyecto } from '$lib/services/proyectosService';
	import Sparkles from '../atoms/Sparkles.svelte';
	import ProjectsDashboard from '$lib/components/molecules/ProjectsDashboard.svelte';
	import type { MapLevel } from '$lib/models/map.model';
	import type { Map, LatLngTuple } from 'leaflet';
	import { ProjectService } from '$lib/services/project.service';
	import { createEventDispatcher } from 'svelte';
	import MapNetworkLayer from '$lib/components/molecules/MapNetworkLayer.svelte';
	import { NetworkService } from '$lib/services/network.service';
	import NetworkPanel from '$lib/components/molecules/MapNetworkPanel.svelte';
	import { tick } from 'svelte';
	import TimeLineProject from '$lib/components/molecules/TimeLineProject.svelte';

	const dispatch = createEventDispatcher();

	// 🔹 Mismas funciones de normalización que usa ProjectsChoropleth
	function normalizarNombreFacultad(nombre: string): string {
		if (!nombre) return 'No especificada';

		// Pasamos todo a minúsculas para normalizar
		let s = nombre.trim().toLowerCase();

		// Quitamos prefijos "facultad de" o "facultad"
		s = s.replace(/^facultad\s+de\s+/, '');
		s = s.replace(/^facultad\s+/, '');

		// Normalizamos espacios
		s = s.replace(/\s+/g, ' ');

		// Capitalizamos cada palabra ("ciencias agrícolas" → "Ciencias Agrícolas")
		const title = s
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');

		// Formato final que coincide con el GeoJSON:
		// "Facultad De Ciencias Agrícolas"
		return `Facultad De ${title}`;
	}

	function getEntityKey(level: MapLevel, rawName?: string | null): string {
		if (!rawName) return 'No especificado';

		const trimmed = rawName.trim();

		if (level === 'faculty') {
			return normalizarNombreFacultad(trimmed);
		}

		// Para instituciones, por ahora solo recortamos espacios
		return trimmed;
	}

	// Props para el mapa
	export let center: LatLngTuple = [-0.1992, -78.5059]; // Quito - UCE por defecto
	export let zoom = 16;
	let centroidesByLevel: Record<MapLevel, Record<string, [number, number]>> = {
		faculty: {},
		institution: {}
	};

	let mapLevel: MapLevel = 'faculty';
	let lastMapLevel: MapLevel = mapLevel;
	let showDashboard = false;
	// Referencias
	let map: Map | null = null;
	let mapComponent: LeafletMapComponent;

	// Estado
	let loading = true;
	let error: string | null = null;
	let proyectos: Proyecto[] = [];
	let filteredProyectos: Proyecto[] = [];
	let selectedFacultad: string | null = null;
	let isFullscreenMap = false;
	let highlightedFacultad: string | null = null; // Facultad que debe resaltarse en el mapa

	// Estado de paneles
	let showFiltersPanel = false;
	let showResultsPanel = false;
	let showStatsPanel = true; // Mostrar estadísticas por defecto
	let activePanelTab: 'filters' | 'results' | 'network' | 'timeline' = 'filters';

	// Estadísticas para la leyenda
	let minProyectos = 0;
	let maxProyectos = 0;
	let facultadConMasProyectos = '';

	// Estadísticas calculadas
	let totalFacultades = 0;
	let facultadesConProyectos = 0;
	// Indica si hay filtros activos (lista filtrada distinta de la lista completa)
	let hasActiveFilters = false;
	let nombresInstituciones: string[] = [];
	// Estado del panel de red de colaboración
	let showNetworkPanel = false;
	let selectedNetworkType: 'projects' | 'participants' | 'international' | 'area' = 'projects';
	let networkData = null;
	let facultyOptions: string[] = [];
	let institutionOptions: string[] = [];
	// Estado del panel de línea de tiempo
	let showTimelinePanel = false;
	let timelineYear: number | null = null;
	let timelineValueById: Record<string, number> = {};

	onMount(async () => {
		const rows = await ProjectService.getProjectsByInstitutionForMap();
		nombresInstituciones = [...new Set(rows.map((r) => r.titulo))].sort();
	});

	$: facultyOptions = Object.keys(centroidesByLevel.faculty || {}).sort();
	$: institutionOptions = nombresInstituciones || [];
	$: timelineHasData = Object.keys(timelineValueById).length > 0;

	// Cuando cambia el nivel del mapa (facultad/institución), limpiamos selección y filtros actuales
	$: if (mapLevel !== lastMapLevel) {
		lastMapLevel = mapLevel;
		filteredProyectos = proyectos;
		selectedFacultad = null;
		highlightedFacultad = null;
		mapLevel;
	}
	function handleTimelineChange(detail: { periodType: 'year' | 'month'; key: string }) {
		const { periodType, key } = detail;

		// Conteo acumulado HASTA ese periodo (año o mes)
		const countByKey: Record<string, number> = {};

		for (const p of proyectos as any[]) {
			// 1) decidir si el proyecto entra según el periodo
			let projectPeriodKey: string | null = null;

			if (periodType === 'year') {
				if (p.anio_inicio) projectPeriodKey = String(p.anio_inicio);
				else if (p.fecha_inicio) {
					// doble parser simple aquí también
					const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.fecha_inicio);
					if (iso) projectPeriodKey = iso[1];
					else {
						const parts = String(p.fecha_inicio).split('/');
						if (parts.length === 3) projectPeriodKey = parts[2];
					}
				}
			} else {
				// month: "YYYY-MM"
				if (p.fecha_inicio) {
					const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.fecha_inicio);
					if (iso) projectPeriodKey = `${iso[1]}-${iso[2]}`;
					else {
						const parts = String(p.fecha_inicio).split('/');
						if (parts.length === 3) {
							const mm = String(Number(parts[1])).padStart(2, '0');
							projectPeriodKey = `${parts[2]}-${mm}`;
						}
					}
				}
			}

			if (!projectPeriodKey) continue;

			// acumulado hasta "key"
			if (projectPeriodKey > key) continue;

			// 2) contar en la entidad (faculty o institution)
			const rawName =
				mapLevel === 'faculty' ? p.facultad_o_entidad_o_area_responsable : p.institucion;

			const entityKey = getEntityKey(mapLevel, rawName);
			countByKey[entityKey] = (countByKey[entityKey] ?? 0) + 1;
		}

		timelineValueById = countByKey;
	}

	$: hasActiveFilters = filteredProyectos.length > 0 && filteredProyectos.length < proyectos.length;
	// Recalcular estadísticas para la leyenda y el resumen según el nivel del mapa
	$: {
		if (!proyectos || proyectos.length === 0) {
			minProyectos = 0;
			maxProyectos = 0;
			facultadConMasProyectos = '';
			totalFacultades = 0;
			facultadesConProyectos = 0;
		} else {
			const countByRegion: Record<string, number> = {};

			proyectos.forEach((p) => {
				const key =
					mapLevel === 'faculty'
						? p.facultad_o_entidad_o_area_responsable || 'No especificado'
						: p.institucion || 'Sin institución';

				countByRegion[key] = (countByRegion[key] || 0) + 1;
			});

			const valores = Object.values(countByRegion);

			if (valores.length > 0) {
				minProyectos = Math.min(...valores);
				maxProyectos = Math.max(...valores);
				facultadConMasProyectos = Object.keys(countByRegion).reduce((a, b) =>
					countByRegion[a] > countByRegion[b] ? a : b
				);
			} else {
				minProyectos = 0;
				maxProyectos = 0;
				facultadConMasProyectos = '';
			}

			totalFacultades = new Set(Object.keys(countByRegion)).size;
			facultadesConProyectos = Object.keys(countByRegion).length;
		}
	}
	function handleCentroidesReady(
		e: CustomEvent<{ level: MapLevel; centroides: Record<string, [number, number]> }>
	) {
		const { level, centroides } = e.detail;
		centroidesByLevel[level] = centroides;
	}

	// Cargar datos de proyectos
	async function cargarProyectos() {
		try {
			loading = true;
			error = null;

			proyectos = await obtenerProyectos();
			filteredProyectos = proyectos;
			console.log('[ProjectMapExplorer] proyectos cargados:', {
				total: proyectos.length,
				ejemplo: proyectos[0] ?? null
			});
		} catch (err) {
			console.error('Error al cargar proyectos:', err);
			error = 'Error al cargar los datos de proyectos';
		} finally {
			loading = false;
		}
	}

	// Manejar filtros
	function handleFilter(event: CustomEvent<Proyecto[]>) {
		filteredProyectos = event.detail;

		// 🔹 Cuando hay UNA sola región filtrada, centramos/zoom como antes
		if (mapLevel === 'faculty') {
			// Usamos el nombre original para mostrar en UI
			const rawFacultades = [
				...new Set(
					filteredProyectos
						.map((p) => p.facultad_o_entidad_o_area_responsable || 'No especificado')
						.filter(Boolean)
				)
			];

			if (rawFacultades.length === 1) {
				// Etiqueta bonita en el panel
				selectedFacultad = rawFacultades[0];
				// Nombre normalizado para que coincida con el id del GeoJSON
				highlightedFacultad = getEntityKey('faculty', rawFacultades[0]);
			} else {
				highlightedFacultad = null;
			}
		} else {
			// Nivel institución
			const rawInsts = [
				...new Set(filteredProyectos.map((p) => p.institucion || 'Sin institución').filter(Boolean))
			];

			if (rawInsts.length === 1) {
				selectedFacultad = rawInsts[0];
				// Para instituciones casi no cambia, pero lo pasamos por getEntityKey para ser consistentes
				highlightedFacultad = getEntityKey('institution', rawInsts[0]);
			} else {
				highlightedFacultad = null;
			}
		}

		// Si hay filtros aplicados, mostrar automáticamente el panel de resultados
		if (filteredProyectos.length < proyectos.length) {
			showResultsPanel = true;
			showFiltersPanel = false;
			activePanelTab = 'results';

			setTimeout(() => {
				if (map) {
					map.invalidateSize();
				}
			}, 300);
		}
	}

	// Manejar selección de facultad específica desde el filtro
	function handleFacultadSelected(event: CustomEvent<string>) {
		const facultad = event.detail;
		if (facultad) {
			// Texto original para mostrar en el título del panel
			selectedFacultad = facultad;
			// Nombre normalizado para que el mapa pueda encontrar la feature y hacer zoom
			highlightedFacultad = getEntityKey('faculty', facultad);

			// Mostrar los resultados cuando se selecciona una facultad específica
			showFiltersPanel = false;
			showResultsPanel = true;
			activePanelTab = 'results';

			setTimeout(() => {
				showResultsPanel = true;
				activePanelTab = 'results';
				if (map) {
					map.invalidateSize();
				}
			}, 500);
		} else {
			highlightedFacultad = null;
			selectedFacultad = null;
		}
	}
	// Manejar selección de institución específica desde el filtro (cuando mapLevel === 'institution')
	function handleInstitutionSelected(event: CustomEvent<string>) {
		const institucion = event.detail;
		if (institucion) {
			selectedFacultad = institucion;
			// Por si acaso en futuro normalizas instituciones también
			highlightedFacultad = getEntityKey('institution', institucion);

			showFiltersPanel = false;
			showResultsPanel = true;
			activePanelTab = 'results';

			setTimeout(() => {
				showResultsPanel = true;
				activePanelTab = 'results';
				if (map) {
					map.invalidateSize();
				}
			}, 500);
		} else {
			highlightedFacultad = null;
			selectedFacultad = null;
		}
	}

	// Manejar selección de facultad desde el mapa
	function handleViewFacultyProjects(event: CustomEvent<string>) {
		selectedFacultad = event.detail;
		showResultsPanel = true;
		activePanelTab = 'results';

		// Cerrar cualquier popup abierto
		// Esta parte ya se maneja directamente en el evento view-faculty-projects

		// Invalidar el tamaño del mapa después de mostrar el panel de resultados
		setTimeout(() => {
			if (map) {
				map.invalidateSize();
			}
		}, 300);
	}

	// Manejar clic en el mapa para cerrar los paneles
	function handleMapClick(event: CustomEvent) {
		// Verificar si el clic fue sobre un popup (en ese caso no cerrar los paneles)
		const isPopupClick = event.detail?.originalEvent?.originalTarget?.closest('.leaflet-popup');

		if (!isPopupClick) {
			// Cerrar los paneles cuando se hace clic en el mapa
			showFiltersPanel = false;
			showResultsPanel = false;

			// Invalidar tamaño del mapa después de cerrar los paneles
			setTimeout(() => map?.invalidateSize(), 300);
		}
	}

	// Alternar vista de pantalla completa del mapa
	function toggleFullscreenMap() {
		isFullscreenMap = !isFullscreenMap;

		// Dar tiempo para que el mapa se redimensione y luego invalidar su tamaño
		setTimeout(() => {
			if (map) {
				map.invalidateSize();
			}
		}, 300);
	}

	// Alternar panel de filtros
	function toggleFiltersPanel() {
		if (activePanelTab !== 'filters') {
			activePanelTab = 'filters';
			showFiltersPanel = true;
			showResultsPanel = false;
		} else {
			showFiltersPanel = !showFiltersPanel;
		}

		// Invalidar tamaño del mapa después de mostrar/ocultar panel
		setTimeout(() => map?.invalidateSize(), 300);
	}

	// Alternar panel de resultados
	function toggleResultsPanel() {
		if (activePanelTab !== 'results') {
			activePanelTab = 'results';
			showResultsPanel = true;
			showFiltersPanel = false;
		} else {
			showResultsPanel = !showResultsPanel;
		}

		// Invalidar tamaño del mapa después de mostrar/ocultar panel
		setTimeout(() => map?.invalidateSize(), 300);
	}

	// Alternar panel de estadísticas
	function toggleStatsPanel() {
		showStatsPanel = !showStatsPanel;
	}

	// Funciones para controlar el zoom del mapa
	function zoomIn() {
		if (map) {
			map.zoomIn();
		}
	}

	function zoomOut() {
		if (map) {
			map.zoomOut();
		}
	}

	// Función para restablecer todos los filtros y el mapa
	function resetAll() {
		// Restablecer filtros
		filteredProyectos = proyectos;

		// Restablecer selección de facultad
		selectedFacultad = null;
		highlightedFacultad = null;

		// Cerrar paneles
		showFiltersPanel = false;
		showResultsPanel = false;

		// Notificar a los componentes hijos para que limpien su estado
		const resetEvent = new CustomEvent('reset-highlights');
		document.dispatchEvent(resetEvent);

		// Restablecer posición del mapa
		if (map) {
			map.setView(center, zoom);
			setTimeout(() => {
				if (map) {
					// Verificar que map no sea null dentro del setTimeout
					map.invalidateSize();
				}
			}, 100);
		}

		// Mostrar notificación visual al usuario
		const notification = document.createElement('div');
		notification.className = 'reset-notification';
		notification.textContent = 'Mapa restablecido';
		document.querySelector('.project-map-explorer')?.appendChild(notification);

		// Eliminar la notificación después de 2 segundos
		setTimeout(() => {
			notification.classList.add('fade-out');
			setTimeout(() => notification.remove(), 500);
		}, 1500);
	} // Inicializar
	onMount(() => {
		cargarProyectos();

		// Detectar cuando se presiona la tecla Escape para salir del modo pantalla completa
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isFullscreenMap) {
				isFullscreenMap = false;
				setTimeout(() => map?.invalidateSize(), 300);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	// Manejar cuando el mapa está listo
	function onMapReady(e: CustomEvent<{ map: Map }>) {
		map = e.detail.map;
	}

	// Manejar cambio de tamaño del mapa
	onDestroy(() => {
		if (map) {
			map.off();
			map = null;
		}
	});
	// Manejar aplicación de red de colaboración
	async function handleApplyNetwork(e: CustomEvent) {
		console.log('🔥 applyNetwork payload:', e.detail);
		// ✅ limpia visualmente antes de construir la nueva
		networkData = null;
		await tick();
		networkData = await NetworkService.buildNetwork(e.detail, centroidesByLevel, filteredProyectos);

		console.log('🔥 networkData generada:', networkData);
		showNetworkPanel = false;
	}
</script>

<div class="project-map-explorer" class:fullscreen={isFullscreenMap}>
	{#if loading}
		<div class="loading-overlay" transition:fade={{ duration: 200 }}>
			<div class="loader" />
			<div class="loading-text">Cargando datos de proyectos...</div>
		</div>
	{:else if error}
		<div class="error-message" in:fly={{ y: 20, duration: 300 }}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<p>{error}</p>
			<button on:click={cargarProyectos}>Intentar nuevamente</button>
		</div>
	{:else}
		<!-- Mapa con coropleta -->
		<div class="map-container" in:fly={{ y: 10, duration: 300 }}>
			<LeafletMapComponent
				bind:this={mapComponent}
				id="projects-map"
				{center}
				{zoom}
				on:ready={onMapReady}
			/>

			{#if map}
				<ProjectsChoropleth
					{map}
					{mapLevel}
					{proyectos}
					{filteredProyectos}
					{highlightedFacultad}
					{hasActiveFilters}
					externalValueById={showTimelinePanel && timelineHasData ? timelineValueById : null}
					on:viewFacultyProjects={handleViewFacultyProjects}
					on:mapClick={handleMapClick}
					on:centroidesReady={handleCentroidesReady}
					on:resetHighlights={() => (highlightedFacultad = null)}
				/>
			{/if}
			{#if networkData}
				{console.log('📡 ENVIANDO networkData AL COMPONENTE', networkData)}
				<MapNetworkLayer {map} nodes={networkData.nodes} edges={networkData.edges} />
			{/if}
			<div class="map-legend-container">
				<ProjectsMapLegend
					title={mapLevel === 'faculty'
						? 'Proyectos por Facultad/Entidad'
						: 'Proyectos por Institución'}
					minValue={minProyectos}
					maxValue={maxProyectos}
				/>
			</div>

			<!-- Controles de mapa integrados -->
			<div class="map-controls">
				<!-- Botón para alternar pantalla completa -->
				<button
					class="map-control-btn"
					on:click={toggleFullscreenMap}
					aria-label="Alternar vista de pantalla completa"
				>
					{#if isFullscreenMap}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="4 14 10 14 10 20" />
							<polyline points="20 10 14 10 14 4" />
							<line x1="14" y1="10" x2="21" y2="3" />
							<line x1="3" y1="21" x2="10" y2="14" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M8 3H5a2 2 0 0 0-2 2v3" />
							<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
							<path d="M3 16v3a2 2 0 0 0 2 2h3" />
							<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
						</svg>
					{/if}
				</button>
				<!-- Botón para estadísticas -->
				<button
					class="map-control-btn"
					class:active={showStatsPanel}
					on:click={toggleStatsPanel}
					aria-label="Mostrar estadísticas"
					title="Mostrar estadísticas"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 20V10" />
						<path d="M12 20V4" />
						<path d="M6 20v-6" />
					</svg>
				</button>
				<div class="map-level-toggle">
					<!-- Botón para ver por facultades -->
					<button
						class="map-control-btn"
						class:active={mapLevel === 'faculty'}
						on:click={() => (mapLevel = 'faculty')}
						aria-label="Ver por facultades"
						title="Facultades"
					>
						<!-- Ícono: bandera (Facultades) -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 21h18" />
							<path d="M5 21V8l7-4 7 4v13" />
							<path d="M9 21v-6h6v6" />
							<path d="M9 10h.01" />
							<path d="M12 10h.01" />
							<path d="M15 10h.01" />
						</svg>
					</button>
					<button
						class="map-control-btn"
						class:active={mapLevel === 'institution'}
						on:click={() => (mapLevel = 'institution')}
						aria-label="Ver por instituciones"
						title="Instituciones"
					>
						<!-- Ícono: edificio/academia -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 20h18" />
							<path d="M4 20V10c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v10" />
							<path d="M9 20V7c0-.6.4-1 1-1h5c.6 0 1 .4 1 1v13" />
							<path d="M6 13h.01" />
							<path d="M12 10h1.5" />
							<path d="M12 13h1.5" />
						</svg>
					</button>
				</div>
				<!-- Botón para filtros -->

				<button
					class="map-control-btn"
					class:active={activePanelTab === 'filters' && showFiltersPanel}
					on:click={toggleFiltersPanel}
					aria-label="Mostrar filtros"
					title="Mostrar filtros"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
					</svg>
					{#if filteredProyectos.length < proyectos.length}
						<span class="control-badge">{proyectos.length - filteredProyectos.length}</span>
					{/if}
				</button>

				<!-- Botón para resultados -->
				<button
					class="map-control-btn"
					class:active={activePanelTab === 'results' && showResultsPanel}
					on:click={toggleResultsPanel}
					aria-label="Mostrar resultados"
					title="Mostrar resultados"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10 9 9 9 8 9" />
					</svg>
					<span class="control-badge">{filteredProyectos.length}</span>
				</button>

				<!-- Botón para restablecer todo -->
				<button
					class="map-control-btn reset-btn"
					on:click={resetAll}
					aria-label="Restablecer mapa y filtros"
					title="Restablecer mapa y filtros"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 2v6h6" />
						<path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
						<path d="M21 22v-6h-6" />
						<path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
					</svg>
				</button>
				<!-- Controles de zoom -->
				<div class="zoom-controls">
					<!-- Botón zoom in -->
					<button
						class="map-control-btn zoom-btn"
						on:click={zoomIn}
						aria-label="Acercar mapa"
						title="Acercar mapa"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
							<line x1="11" y1="8" x2="11" y2="14" />
							<line x1="8" y1="11" x2="14" y2="11" />
						</svg>
					</button>

					<!-- Botón zoom out -->
					<button
						class="map-control-btn zoom-btn"
						on:click={zoomOut}
						aria-label="Alejar mapa"
						title="Alejar mapa"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
							<line x1="8" y1="11" x2="14" y2="11" />
						</svg>
					</button>
				</div>
				<!-- Botón para panel de red -->
				<button
					class="map-control-btn"
					class:active={showNetworkPanel}
					on:click={() => {
						showNetworkPanel = !showNetworkPanel;
						activePanelTab = 'network';
						showFiltersPanel = false;
						showResultsPanel = false;
					}}
					aria-label="Mostrar red"
					title="Red de colaboración"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<!-- Ícono de red -->
						<circle cx="6" cy="6" r="3" />
						<circle cx="18" cy="6" r="3" />
						<circle cx="12" cy="18" r="3" />
						<line x1="8.5" y1="7.5" x2="15.5" y2="7.5" />
						<line x1="7.5" y1="8.5" x2="10.5" y2="15" />
						<line x1="16.5" y1="8.5" x2="13.5" y2="15" />
					</svg>
				</button>
				<button
					class="map-control-btn"
					class:active={showTimelinePanel}
					on:click={() => {
						showTimelinePanel = !showTimelinePanel;
						activePanelTab = 'timeline';
						// cerrar otros paneles
						showFiltersPanel = false;
						showResultsPanel = false;
						showNetworkPanel = false;
						setTimeout(() => map?.invalidateSize(), 300);
					}}
					aria-label="Mostrar línea de tiempo"
					title="Línea de tiempo"
				>
					<!-- Ícono play + timeline -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
				</button>
			</div>
			<!-- Panel lateral integrado -->
			<div
				class="map-side-panel"
				class:visible={showFiltersPanel ||
					showResultsPanel ||
					showNetworkPanel ||
					showTimelinePanel}
			>
				<!-- Pestaña de filtros -->
				{#if activePanelTab === 'filters'}
					<Sparkles />
					<div class="panel-header">
						<h2>Filtros de proyectos</h2>
						<button
							class="close-panel-btn"
							on:click={() => {
								showFiltersPanel = false;
								// Invalidar el tamaño del mapa cuando se cierra el panel
								setTimeout(() => {
									if (map) {
										map.invalidateSize();
									}
								}, 300);
							}}
							aria-label="Cerrar panel"
							title="Cerrar panel"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
					<div class="panel-content filters-panel">
						<ProjectFilters
							{proyectos}
							{mapLevel}
							institucionesDisponibles={nombresInstituciones}
							on:filter={handleFilter}
							on:facultadSelected={handleFacultadSelected}
							on:institucionSelected={handleInstitutionSelected}
						/>
					</div>
				{/if}

				<!-- Pestaña de resultados -->
				{#if activePanelTab === 'results'}
					<div class="panel-header">
						<h2>
							{#if selectedFacultad}
								Proyectos de {selectedFacultad}
							{:else}
								Proyectos encontrados
							{/if}
							<span class="count-badge">{filteredProyectos.length}</span>
						</h2>
						<button
							class="close-panel-btn"
							on:click={() => {
								showResultsPanel = false;
								// Invalidar el tamaño del mapa cuando se cierra el panel
								setTimeout(() => {
									if (map) {
										map.invalidateSize();
									}
								}, 300);
							}}
							aria-label="Cerrar panel"
							title="Cerrar panel"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
					<!-- 🔹 Aquí va el botón fijo -->
					<Sparkles>
						<div class="panel-toggle">
							<button on:click={() => (showDashboard = !showDashboard)}>
								{showDashboard ? 'Ver Proyectos en Lista' : 'Ver Proyectos en Gráfico'}
							</button>
						</div>
					</Sparkles>
					<!-- 🔹 Aquí va el contenido que se desliza -->
					<div class="panel-content results-panel">
						{#if showDashboard}
							<ProjectsDashboard
								proyectos={filteredProyectos}
								totalGeneral={proyectos.length}
								proyectosTotales={proyectos}
							/>
						{:else}
							<ProjectsDetail
								proyectos={filteredProyectos}
								isVisible={true}
								{selectedFacultad}
								{mapLevel}
							/>
						{/if}
					</div>
				{/if}
				{#if activePanelTab === 'network'}
					<NetworkPanel
						bind:selectedNetworkType
						{mapLevel}
						{facultyOptions}
						{institutionOptions}
						on:applyNetwork={handleApplyNetwork}
						on:clearNetwork={() => (networkData = null)}
						on:close={() => (showNetworkPanel = false)}
					/>
				{/if}
				{#if activePanelTab === 'timeline'}
					<TimeLineProject
						{proyectos}
						{mapLevel}
						on:change={(e) => handleTimelineChange(e.detail)}
						on:reset={() => {
							timelineYear = null;
							timelineValueById = {};
						}}
					/>
				{/if}
			</div>

			<!-- Estadísticas del mapa -->
			{#if showStatsPanel}
				<div class="map-stats" transition:fade={{ duration: 200 }}>
					<div class="stat-group">
						<div class="stat">
							<div class="stat-value">{proyectos.length}</div>
							<div class="stat-label">Proyectos totales</div>
						</div>
						<div class="stat">
							<div class="stat-value">{filteredProyectos.length}</div>
							<div class="stat-label">Proyectos filtrados</div>
						</div>

						{#if !isFullscreenMap}
							<div class="stat stat-faculty">
								<div class="stat-value">{maxProyectos}</div>
								<div class="stat-label">{facultadConMasProyectos}</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Mensaje flotante en modo pantalla completa -->
		{#if isFullscreenMap}
			<div class="fullscreen-message" transition:fade={{ duration: 200 }}>
				<p>Presiona ESC para salir del modo pantalla completa</p>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.project-map-explorer {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 1400px;
		height: 100%;
		position: relative;
		margin: 0 auto;
		transition: all 0.3s ease-in-out;

		&.fullscreen {
			max-width: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1100;
			background-color: var(--color--page-background);
			padding: 20px;

			.map-container {
				height: 100vh !important;
				border-radius: 0;
				box-shadow: none;
			}

			.map-legend-container {
				bottom: 10px;
				right: 30px;
			}

			.map-side-panel {
				height: calc(100% - 60px);
				max-height: none;
			}
		}
	}
	/* --- Responsive --- */
	@media (max-width: 600px) {
		.map-legend-container {
			top: auto; /* desactivamos top */
			bottom: 0px !important; /* la bajamos 50px desde abajo */
			left: 50%; /* centrada */
			transform: translateX(-50%);
			width: 80%; /* ancho del contenedor (80% de la pantalla) */
			height: 90px; /* altura automática (ajusta al contenido) */
		}
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: color-mix(in srgb, var(--color--page-background) 85%, transparent);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(3px);

		.loader {
			border: 4px solid color-mix(in srgb, var(--color--primary) 30%, transparent);
			border-radius: 50%;
			border-top: 4px solid var(--color--primary);
			width: 50px;
			height: 50px;
			animation: spin 1s linear infinite;
			margin-bottom: 20px;
			box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		.loading-text {
			font-size: 1.1rem;
			font-weight: 500;
			color: var(--color--text);
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		}
	}

	.error-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		text-align: center;
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow);

		svg {
			color: var(--color--callout-accent--error);
			margin-bottom: 15px;
			filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.1));
		}

		p {
			margin-bottom: 20px;
			color: var(--color--text);
			font-size: 1rem;
		}

		button {
			background: var(--color--primary);
			color: white;
			border: none;
			border-radius: 8px;
			padding: 10px 20px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				filter: brightness(1.1);
				transform: translateY(-2px);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
			}
		}
	}

	.map-container {
		position: relative;
		width: 100%;
		height: 80vh;
		min-height: 550px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow:
			var(--card-shadow),
			0 8px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease-in-out;

		@include for-phone-only {
			height: calc(100vh - 100px);
			min-height: 500px;
			border-radius: 8px;
		}
	}

	.map-legend-container {
		position: absolute;
		bottom: 20px;
		right: 20px;
		z-index: 500;
		transition: all 0.3s ease;

		@include for-phone-only {
			display: none;
		}
	}

	.map-controls {
		position: absolute;
		top: 15px;
		left: 15px;
		z-index: 500;
		display: flex;
		flex-direction: column;
		gap: 10px;

		@include for-phone-only {
			top: 10px;
			left: 10px;
			gap: 6px;
		}
	}

	.zoom-controls {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin-top: 5px;

		.zoom-btn {
			height: 35px;
			width: 35px;

			@include for-phone-only {
				height: 32px;
				width: 32px;
			}
		}
	}

	.map-control-btn {
		background: var(--color--card-background);
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		color: var(--color--text);
		transition: all 0.2s ease;
		position: relative;

		@include for-phone-only {
			width: 36px;
			height: 36px;
			border-radius: 6px;

			svg {
				width: 18px;
				height: 18px;
			}
		}

		&:hover {
			transform: translateY(-2px);
			background: color-mix(in srgb, var(--color--primary) 10%, var(--color--card-background));
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
			color: var(--color--primary);
		}

		&.active {
			background: var(--color--primary);
			color: white;

			&:hover {
				transform: translateY(-2px);
				filter: brightness(1.1);
			}

			.control-badge {
				background: white;
				color: var(--color--primary);
			}
		}

		&.reset-btn {
			&:hover {
				color: var(--color--text);
				transform: translateY(-2px) rotate(45deg);
			}

			svg {
				transition: transform 0.3s ease;
			}
		}
	}

	.control-badge {
		position: absolute;
		top: -5px;
		right: -5px;
		background: var(--color--primary);
		color: white;
		font-size: 0.5rem;
		font-weight: 300;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

		@include for-phone-only {
			width: 18px;
			height: 18px;
			font-size: 0.45rem;
			top: -4px;
			right: -4px;
		}
	}

	.map-side-panel {
		position: absolute;
		top: 15px;
		left: 70px;
		width: 55%; // panel ocupa 35% del ancho disponible
		max-width: calc(100% - 100px);
		max-height: calc(100% - 30px);
		//background: var(--color--card-background);
		background: color-mix(in srgb, var(--color--card-background) 60%, transparent);
		border-radius: 22px;
		box-shadow: 0 50px 100px var(--color--text-shade);
		z-index: 600;
		display: flex;
		flex-direction: column;
		transform: translateX(-120%);
		transition: transform 0.3s ease-in-out;
		overflow: hidden;

		&.visible {
			transform: translateX(0);
		}

		@include for-phone-only {
			left: 10px;
			width: calc(100% - 20px);
			max-width: calc(100% - 20px);
			top: auto;
			bottom: 10px;
			max-height: 65vh;
			border-radius: 16px;
			transform: translateY(120%);

			&.visible {
				transform: translateY(0);
			}
		}

		.panel-header {
			padding: 15px 20px;
			border-bottom: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
			display: flex;
			justify-content: space-between;
			align-items: center;

			@include for-phone-only {
				padding: 12px 15px;
			}

			h2 {
				margin: 0;
				font-size: 1.2rem;
				font-weight: 700;
				color: var(--color--text);
				display: flex;
				align-items: center;
				gap: 8px;

				@include for-phone-only {
					font-size: 1rem;
					gap: 6px;
				}
			}

			.close-panel-btn {
				background: none;
				border: none;
				color: var(--color--text-shade);
				cursor: pointer;
				padding: 5px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 4px;
				transition: all 0.2s ease;

				&:hover {
					background: color-mix(in srgb, var(--color--text) 10%, transparent);
					color: var(--color--text);
				}
			}
		}
		.panel-content {
			overflow-y: auto;
			padding: 5px;
			flex: 1;
			max-height: calc(100% - 60px);

			&.filters-panel :global(.project-filters) {
				box-shadow: none;
				border-radius: 0;
				padding: 15px 10px;
				background: color-mix(in srgb, var(--color--card-background) 60%, transparent);
			}

			&.results-panel {
				:global(.projects-detail) {
					box-shadow: none;
					border-radius: 0;
					margin-top: 0;
					padding: 10px;
					background: color-mix(in srgb, var(--color--card-background) 10%, transparent);
				}
			}
		}
	}

	.fullscreen-message {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px 20px;
		border-radius: 20px;
		font-size: 0.9rem;
		z-index: 1200;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

		p {
			margin: 0;
		}
	}

	.map-stats {
		position: absolute;
		top: 15px;
		right: 15px;
		z-index: 500;
		display: flex;
		gap: 10px;
		max-width: 70%;
		flex-wrap: wrap;
		justify-content: flex-end;
		pointer-events: none;

		@include for-phone-only {
			flex-direction: column;
			gap: 4px;
			max-width: calc(100% - 60px);
			top: 10px;
			right: 10px;
		}

		.stat-group {
			display: flex;
			gap: 6px;
			flex-wrap: wrap;

			@include for-phone-only {
				flex-direction: column;
				gap: 4px;
			}
		}

		.stat {
			background: var(--color--card-background);
			padding: 6px 10px;
			border-radius: 6px;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
			text-align: center;
			pointer-events: auto;
			transition: all 0.2s ease;
			border: 1px solid transparent;

			@include for-phone-only {
				padding: 4px 8px;
				border-radius: 4px;
			}

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				border-color: color-mix(in srgb, var(--color--primary) 30%, transparent);
			}

			.stat-value {
				font-weight: 700;
				font-size: 0.7rem;
				color: var(--color--primary);
				text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

				@include for-phone-only {
					font-size: 0.65rem;
				}
			}

			.stat-label {
				font-size: 0.7rem;
				color: var(--color--text-shade);
				white-space: nowrap;

				@include for-phone-only {
					font-size: 0.6rem;
				}
			}

			&.stat-faculty {
				display: flex;
				align-items: center;
				gap: 8px;

				.stat-value {
					white-space: nowrap;
				}

				.stat-label {
					text-align: left;
					white-space: normal;
					overflow: hidden;
					text-overflow: ellipsis;
					max-width: 140px;
				}
			}
		}
	}

	.count-badge {
		background: var(--color--primary);
		color: white;
		font-size: 0.8rem;
		padding: 2px 8px;
		border-radius: 15px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.map-side-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	/* Encabezado fijo */
	.panel-header {
		flex-shrink: 0;
		padding: 10px;
		border-color: color-mix(in srgb, var(--color--card-background) 30%, transparent);
		border-bottom: 1px solid #ccc;
	}

	/* Botón fijo */
	.panel-toggle {
		flex-shrink: 0;
		padding: 10px;
		border-color: color-mix(in srgb, var(--color--card-background) 30%, transparent);
		border-bottom: 1px solid #ccc;
		position: sticky; /* este truco hace que quede pegado */
		top: 0; /* lo fija arriba dentro del panel */
		z-index: 10;

		button {
			width: 100%;
			padding: 8px 12px;
			border: none;
			border-radius: 8px;
			background: color-mix(in srgb, var(--color--primary) 50%, transparent);
			color: var(--color--text);
			font-weight: 600;
			cursor: pointer;

			&:hover {
				filter: brightness(1.1);
				background: color-mix(in srgb, var(--color--secondary) 80%, transparent);
			}
		}
	}

	/* Contenido que se puede deslizar */
	.panel-content {
		flex: 1; /* ocupa todo el espacio restante */
		overflow-y: auto; /* aquí está el scroll */
		padding: 10px;
	}
	.map-level-toggle {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;

		@include for-phone-only {
			gap: 3px;
			margin-top: 6px;
		}
	}
</style>
