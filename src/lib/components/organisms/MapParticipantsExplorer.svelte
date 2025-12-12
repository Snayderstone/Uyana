<!-- src/lib/components/organisms/MapParticipantsExplorer.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import LeafletMapComponent from '$lib/components/atoms/LeafletMap.svelte';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';
	import MapParticipantsFilters from '$lib/components/molecules/MapParticipantsFilters.svelte';
    import MapParticipantsDetail from '$lib/components/molecules/MapParticipantsDetail.svelte';
    import MapParticipantsDashboard from '$lib/components/molecules/MapParticipantsDashboard.svelte';
	import MapParticipantsChoropleth from '$lib/components/molecules/MapParticipantsChoropleth.svelte';
	import ProjectsMapLegend from '$lib/components/molecules/ProjectsMapLegend.svelte';

	import type { Map, LatLngTuple } from 'leaflet';
	import type { MapLevel } from '$lib/models/map.model';
	import {
		MapParticipantsService
	} from '$lib/services/map-participants.service';
	import type {
		MapParticipantForUI,
		MapParticipantsFilterOptions,
		MapParticipantsFilterState,
		MapParticipantsRegionAggregation,
		MapParticipantsStatsSummary
	} from '$lib/models/map-participants.model';

	// Centro por defecto: UCE
	export let center: LatLngTuple = [-0.1992, -78.5059];
	export let zoom = 16;

	let mapLevel: MapLevel = 'faculty';
	let lastMapLevel: MapLevel = mapLevel;

	let map: Map | null = null;
	let mapComponent: LeafletMapComponent;

	let loading = true;
	let error: string | null = null;

	let participants: MapParticipantForUI[] = [];
	let filterOptions: MapParticipantsFilterOptions | null = null;
	let stats: MapParticipantsStatsSummary | null = null;
	let byFaculty: MapParticipantsRegionAggregation[] = [];
	let byInstitution: MapParticipantsRegionAggregation[] = [];

	let filterState: MapParticipantsFilterState = {};

	// UI / paneles
	let showDashboard = false;
	let showFiltersPanel = false;
	let showResultsPanel = false;
	let showStatsPanel = false;
	let activePanelTab: 'filters' | 'results' = 'filters';
	let isFullscreenMap = false;

	let hasActiveFilters = false;
	let selectedRegionName: string | null = null;
	let highlightedRegionKey: string | null = null;

	// Stats para la leyenda / resumen
	let minParticipants = 0;
	let maxParticipants = 0;
	let regionWithMaxParticipants = '';

	// Para poder resetear filtros desde el padre
	let filtersResetCounter = 0;

	// ----------------------------------------------------------
	// Normalización de nombres (igual idea que ProjectMapExplorer)
	// ----------------------------------------------------------

	function normalizarNombreFacultad(nombre: string): string {
		if (!nombre) return 'No especificada';

		let s = nombre.trim().toLowerCase();

		s = s.replace(/^facultad\s+de\s+/, '');
		s = s.replace(/^facultad\s+/, '');

		s = s.replace(/\s+/g, ' ');

		const title = s
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');

		return `Facultad De ${title}`;
	}

	function getEntityKey(level: MapLevel, rawName?: string | null): string {
		if (!rawName) return 'No especificado';
		const trimmed = rawName.trim();
		if (level === 'faculty') return normalizarNombreFacultad(trimmed);
		return trimmed;
	}

	// ----------------------------------------------------------
	// Carga de datos
	// ----------------------------------------------------------

	async function loadData(state: MapParticipantsFilterState = {}) {
		try {
			loading = true;
			error = null;

			const data = await MapParticipantsService.getMapParticipantsData(state);

			participants = data.participants;
			filterOptions = data.filterOptions;
			stats = data.stats;
			byFaculty = data.byFaculty;
			byInstitution = data.byInstitution;
			filterState = state;

			console.log('[MapParticipantsExplorer] data cargada:', {
				total: stats?.totalParticipants,
				filtrados: participants.length
			});
		} catch (err) {
			console.error('[MapParticipantsExplorer] Error al cargar participantes:', err);
			error = 'Error al cargar los datos de participantes';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData({});

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

	onDestroy(() => {
		if (map) {
			map.off();
			map = null;
		}
	});

	function onMapReady(e: CustomEvent<{ map: Map }>) {
		map = e.detail.map;
	}

	// ----------------------------------------------------------
	// Reacciones
	// ----------------------------------------------------------

	// Cuando cambia el nivel del mapa, limpiamos selección y (opcionalmente) filtros por facultad/institución
	$: if (mapLevel !== lastMapLevel) {
		lastMapLevel = mapLevel;
		selectedRegionName = null;
		highlightedRegionKey = null;

		const { facultadIds, institucionIds, ...rest } = filterState;
		// Para no mezclar dimensiones de faculty vs institution
		const cleanState: MapParticipantsFilterState = { ...rest };
		loadData(cleanState);
	}

	// ¿Hay filtros activos?
	$: {
		if (stats) {
			hasActiveFilters = participants.length < stats.totalParticipants;
		} else {
			hasActiveFilters = false;
		}
	}

	// Stats para leyenda y resumen según nivel
	$: {
		const aggregations =
			mapLevel === 'faculty' ? byFaculty ?? [] : byInstitution ?? [];

		if (!aggregations || aggregations.length === 0) {
			minParticipants = 0;
			maxParticipants = 0;
			regionWithMaxParticipants = '';
		} else {
			const values = aggregations.map((a) => a.totalParticipants);
			minParticipants = Math.min(...values);
			maxParticipants = Math.max(...values);

			const maxAgg = aggregations.reduce((acc, a) =>
				a.totalParticipants > acc.totalParticipants ? a : acc
			, aggregations[0]);
			regionWithMaxParticipants = maxAgg.regionName;
		}
	}

	// ----------------------------------------------------------
	// Manejo de filtros
	// ----------------------------------------------------------

	function handleFilterChange(event: CustomEvent<MapParticipantsFilterState>) {
		const newState = event.detail ?? {};

		selectedRegionName = null;
		highlightedRegionKey = null;

		loadData(newState).then(() => {
			showResultsPanel = true;
			showFiltersPanel = false;
			activePanelTab = 'results';

			setTimeout(() => {
				if (map) map.invalidateSize();
			}, 300);
		});
	}

	function handleFiltersCleared() {
		selectedRegionName = null;
		highlightedRegionKey = null;
		loadData({});
	}

	// ----------------------------------------------------------
	// Manejo de selección desde mapa / UI
	// ----------------------------------------------------------

	function handleRegionFromMap(event: CustomEvent<string>) {
		const regionName = event.detail;
		selectedRegionName = regionName;
		highlightedRegionKey = getEntityKey(mapLevel, regionName);

		showResultsPanel = true;
		activePanelTab = 'results';

		setTimeout(() => map?.invalidateSize(), 300);
	}

	function handleMapClick(event: CustomEvent) {
		const isPopupClick = event.detail?.originalEvent?.originalTarget?.closest?.(
			'.leaflet-popup'
		);

		if (!isPopupClick) {
			showFiltersPanel = false;
			showResultsPanel = false;

			setTimeout(() => map?.invalidateSize(), 300);
		}
	}

	// ----------------------------------------------------------
	// Controles de mapa / panel
	// ----------------------------------------------------------

	function toggleFullscreenMap() {
		isFullscreenMap = !isFullscreenMap;
		setTimeout(() => map?.invalidateSize(), 300);
	}

	function toggleFiltersPanel() {
		if (activePanelTab !== 'filters') {
			activePanelTab = 'filters';
			showFiltersPanel = true;
			showResultsPanel = false;
		} else {
			showFiltersPanel = !showFiltersPanel;
		}
		setTimeout(() => map?.invalidateSize(), 300);
	}

	function toggleResultsPanel() {
		if (activePanelTab !== 'results') {
			activePanelTab = 'results';
			showResultsPanel = true;
			showFiltersPanel = false;
		} else {
			showResultsPanel = !showResultsPanel;
		}
		setTimeout(() => map?.invalidateSize(), 300);
	}

	function toggleStatsPanel() {
		showStatsPanel = !showStatsPanel;
	}

	function zoomIn() {
		map?.zoomIn();
	}

	function zoomOut() {
		map?.zoomOut();
	}

	function resetAll() {
		selectedRegionName = null;
		highlightedRegionKey = null;
		showFiltersPanel = false;
		showResultsPanel = false;

		filterState = {};
		filtersResetCounter += 1; // hará que el componente de filtros se resetee
		loadData({});

		if (map) {
			map.setView(center, zoom);
			setTimeout(() => map?.invalidateSize(), 100);
		}

		const notification = document.createElement('div');
		notification.className = 'reset-notification';
		notification.textContent = 'Mapa de participantes restablecido';
		document.querySelector('.participants-map-explorer')?.appendChild(notification);

		setTimeout(() => {
			notification.classList.add('fade-out');
			setTimeout(() => notification.remove(), 500);
		}, 1500);
	}
</script>

<div class="participants-map-explorer" class:fullscreen={isFullscreenMap}>
	{#if loading}
		<div class="loading-overlay" transition:fade={{ duration: 200 }}>
			<div class="loader" />
			<div class="loading-text">Cargando datos de participantes...</div>
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
			<button on:click={() => loadData(filterState)}>Intentar nuevamente</button>
		</div>
	{:else}
		<div class="map-container" in:fly={{ y: 10, duration: 300 }}>
			<LeafletMapComponent
				bind:this={mapComponent}
				id="participants-map"
				{center}
				{zoom}
				on:ready={onMapReady}
			/>

			{#if map}
				<MapParticipantsChoropleth
					{map}
					{mapLevel}
					aggregations={mapLevel === 'faculty' ? byFaculty : byInstitution}
					highlightedRegionKey={highlightedRegionKey}
					{hasActiveFilters}
					on:viewRegionParticipants={handleRegionFromMap}
					on:mapClick={handleMapClick}
					on:resetHighlights={() => (highlightedRegionKey = null)}
				/>
			{/if}

			<div class="map-legend-container">
				<ProjectsMapLegend
					title={mapLevel === 'faculty'
						? 'Participantes por Facultad'
						: 'Participantes por Institución'}
					minValue={minParticipants}
					maxValue={maxParticipants}
				/>
			</div>

			<!-- Controles de mapa -->
			<div class="map-controls">
				<div class="map-level-toggle">
					<button
						class="map-level-btn"
						class:active={mapLevel === 'faculty'}
						on:click={() => (mapLevel = 'faculty')}
					>
						Facultades
					</button>
					<button
						class="map-level-btn"
						class:active={mapLevel === 'institution'}
						on:click={() => (mapLevel = 'institution')}
					>
						Instituciones
					</button>
				</div>

				<button
					class="map-control-btn"
					on:click={toggleFullscreenMap}
					aria-label="Alternar vista de pantalla completa"
				>
					{#if isFullscreenMap}
						<!-- icono salir fullscreen -->
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
						<!-- icono entrar fullscreen -->
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

				<!-- Botón stats -->
				<button
					class="map-control-btn"
					class:active={showStatsPanel}
					on:click={toggleStatsPanel}
					aria-label="Mostrar estadísticas"
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

				<!-- Botón filtros -->
				<Sparkles>
					<button
						class="map-control-btn"
						class:active={activePanelTab === 'filters' && showFiltersPanel}
						on:click={toggleFiltersPanel}
						aria-label="Mostrar filtros"
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
						{#if stats && participants.length < stats.totalParticipants}
							<span class="control-badge">
								{stats.totalParticipants - participants.length}
							</span>
						{/if}
					</button>
				</Sparkles>

				<!-- Botón resultados -->
				<button
					class="map-control-btn"
					class:active={activePanelTab === 'results' && showResultsPanel}
					on:click={toggleResultsPanel}
					aria-label="Mostrar resultados"
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
					<span class="control-badge">{participants.length}</span>
				</button>

				<!-- Reset -->
				<button
					class="map-control-btn reset-btn"
					on:click={resetAll}
					aria-label="Restablecer mapa y filtros"
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

				<!-- Zoom -->
				<div class="zoom-controls">
					<button
						class="map-control-btn zoom-btn"
						on:click={zoomIn}
						aria-label="Acercar mapa"
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
					<button
						class="map-control-btn zoom-btn"
						on:click={zoomOut}
						aria-label="Alejar mapa"
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
			</div>

			<!-- Panel lateral -->
			<div class="map-side-panel" class:visible={showFiltersPanel || showResultsPanel}>
				{#if activePanelTab === 'filters'}
					<div class="panel-header">
						<h2>Filtros de participantes</h2>
						<button
							class="close-panel-btn"
							on:click={() => {
								showFiltersPanel = false;
								setTimeout(() => map?.invalidateSize(), 300);
							}}
							aria-label="Cerrar panel"
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
						{#if filterOptions}
							<MapParticipantsFilters
								options={filterOptions}
								{mapLevel}
								resetCounter={filtersResetCounter}
								on:change={handleFilterChange}
								on:cleared={handleFiltersCleared}
							/>
						{/if}
					</div>
				{/if}

				{#if activePanelTab === 'results'}
					<div class="panel-header">
						<h2>
							{#if selectedRegionName}
								Participantes en {selectedRegionName}
							{:else}
								Participantes encontrados
							{/if}
							<span class="count-badge">{participants.length}</span>
						</h2>
						<button
							class="close-panel-btn"
							on:click={() => {
								showResultsPanel = false;
								setTimeout(() => map?.invalidateSize(), 300);
							}}
							aria-label="Cerrar panel"
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

					<Sparkles>
						<div class="panel-toggle">
							<button on:click={() => (showDashboard = !showDashboard)}>
								{showDashboard ? 'Ver participantes en lista' : 'Ver participantes en gráfico'}
							</button>
						</div>
					</Sparkles>

					<div class="panel-content results-panel">
						{#if showDashboard}
							<MapParticipantsDashboard participants={participants} />
						{:else}
							<MapParticipantsDetail
								{participants}
								isVisible={true}
								selectedRegionName={selectedRegionName}
								{mapLevel}
							/>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Stats -->
			{#if showStatsPanel && stats}
				<div class="map-stats" transition:fade={{ duration: 200 }}>
					<div class="stat-group">
						<div class="stat">
							<div class="stat-value">{stats.totalParticipants}</div>
							<div class="stat-label">Participantes totales</div>
						</div>
						<div class="stat">
							<div class="stat-value">{participants.length}</div>
							<div class="stat-label">Participantes después de filtros</div>
						</div>
						{#if regionWithMaxParticipants}
							<div class="stat stat-faculty">
								<div class="stat-value">{maxParticipants}</div>
								<div class="stat-label">{regionWithMaxParticipants}</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		{#if isFullscreenMap}
			<div class="fullscreen-message" transition:fade={{ duration: 200 }}>
				<p>Presiona ESC para salir del modo pantalla completa</p>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.participants-map-explorer {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: relative;
		transition: all 0.3s ease-in-out;

		&.fullscreen {
			position: fixed;
			inset: 0;
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

	.map-container {
		position: relative;
		width: 100%;
		height: 80vh;
		min-height: 550px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--card-shadow), 0 8px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease-in-out;

		@include for-phone-only {
			height: 70vh;
			min-height: 450px;
		}
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
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
		}

		@keyframes spin {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		.loading-text {
			font-size: 1.1rem;
			font-weight: 500;
		}
	}

	.map-legend-container {
		position: absolute;
		bottom: 20px;
		right: 20px;
		z-index: 500;

		@include for-phone-only {
			bottom: 60px;
			right: 10px;
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
	}

	.zoom-controls {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin-top: 5px;

		.zoom-btn {
			width: 35px;
			height: 35px;
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

		&:hover {
			transform: translateY(-2px);
			background: color-mix(in srgb, var(--color--primary) 10%, var(--color--card-background));
			color: var(--color--primary);
		}

		&.active {
			background: var(--color--primary);
			color: white;
		}

		&.reset-btn:hover {
			transform: translateY(-2px) rotate(45deg);
		}
	}

	.control-badge {
		position: absolute;
		top: -5px;
		right: -5px;
		background: var(--color--primary);
		color: white;
		font-size: 0.7rem;
		font-weight: 700;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.map-level-toggle {
		display: flex;
		gap: 4px;
		margin-top: 8px;

		.map-level-btn {
			background: var(--color--card-background);
			border: 1px solid color-mix(in srgb, var(--color--text) 15%, transparent);
			border-radius: 999px;
			padding: 4px 10px;
			font-size: 0.75rem;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.map-level-btn.active {
			background: var(--color--primary);
			color: white;
		}
	}

	.map-side-panel {
		position: absolute;
		top: 15px;
		left: 70px;
		width: 55%;
		max-width: calc(100% - 100px);
		max-height: calc(100% - 30px);
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
			left: 15px;
			width: 90%;
			max-width: calc(100% - 30px);
			top: auto;
			bottom: 15px;
			max-height: 70%;
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

			h2 {
				margin: 0;
				font-size: 1.2rem;
				display: flex;
				gap: 8px;
				align-items: center;
			}
		}

		.panel-content {
			overflow-y: auto;
			padding: 5px;
			flex: 1;
			max-height: calc(100% - 60px);
		}
	}

	.panel-toggle {
		flex-shrink: 0;
		padding: 10px;
		border-bottom: 1px solid color-mix(in srgb, var(--color--card-background) 30%, transparent);
		position: sticky;
		top: 0;
		z-index: 10;

		button {
			width: 100%;
			padding: 8px 12px;
			border: none;
			border-radius: 8px;
			background: color-mix(in srgb, var(--color--primary) 50%, transparent);
			cursor: pointer;
			font-weight: 600;
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
	}

	.count-badge {
		background: var(--color--primary);
		color: white;
		font-size: 0.8rem;
		padding: 2px 8px;
		border-radius: 15px;
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
		z-index: 1200;
	}

	.reset-notification {
		position: absolute;
		bottom: 15px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 0.85rem;
		transition: opacity 0.3s ease, transform 0.3s ease;

		&.fade-out {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
	}
</style>
