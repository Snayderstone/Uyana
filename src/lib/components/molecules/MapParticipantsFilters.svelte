<!-- src/lib/components/molecules/MapParticipantsFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import Button from '$lib/components/atoms/Button.svelte';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';
	import type { MapLevel } from '$lib/models/map.model';
	import type {
		MapParticipantsFilterOptions,
		MapParticipantsFilterState
	} from '$lib/models/map-participants.model';

	const dispatch = createEventDispatcher<{
		change: MapParticipantsFilterState;
		cleared: void;
	}>();

	export let options: MapParticipantsFilterOptions;
	export let mapLevel: MapLevel = 'faculty';

	// Para reset desde el padre (se incrementa un contador)
	export let resetCounter = 0;
	let lastResetCounter = 0;

	// Estado interno de filtros
	let searchText = '';

	let selectedFacultadId = '';
	let selectedInstitucionId = '';
	let selectedCarreraId = '';
	let selectedGenero = '';
	let selectedPais = '';
	let acreditadoFilter: '' | 'true' | 'false' = '';
	// Nuevos filtros de proyectos
	let selectedCargo = '';
	let selectedRegimen = '';
	let selectedArea = '';
	let selectedLinea = '';
	let selectedTipoProyecto = '';
	let selectedEstadoProyecto = '';

	// UI
	let filtersExpanded = false;
	let activeFilterCount = 0;

	type ActiveChip = {
		name: string;
		value: string;
		clear: () => void;
	};

	let activeFilters: ActiveChip[] = [];
	let showClearSuccess = false;

	// Reset cuando el padre incrementa el counter
	$: if (resetCounter !== lastResetCounter) {
		lastResetCounter = resetCounter;
		internalClearFilters(false);
	}

	function buildFilterState(): MapParticipantsFilterState {
		const state: MapParticipantsFilterState = {};

		if (searchText.trim()) state.searchText = searchText.trim();

		// Facultad / Institución según nivel
		if (mapLevel === 'faculty') {
			if (selectedFacultadId) {
				state.facultadIds = [Number(selectedFacultadId)];
			}
		} else {
			if (selectedInstitucionId) {
				state.institucionIds = [Number(selectedInstitucionId)];
			}
		}

		// Carrera
		if (selectedCarreraId) {
			state.carreraIds = [Number(selectedCarreraId)];
		}

		// Género
		if (selectedGenero) {
			state.generos = [selectedGenero];
		}

		// Acreditado
		if (acreditadoFilter === 'true') {
			state.acreditado = true;
		} else if (acreditadoFilter === 'false') {
			state.acreditado = false;
		}

		// País institución
		if (selectedPais) {
			state.paisesInstitucion = [selectedPais];
		}
		// Filtros de proyectos
		if (selectedCargo) {
			state.cargos = [selectedCargo];
		}
		if (selectedRegimen) {
			state.regimenesDedicacion = [selectedRegimen];
		}
		if (selectedArea) {
			state.areasConocimiento = [selectedArea];
		}
		if (selectedLinea) {
			state.lineasInvestigacion = [selectedLinea];
		}
		if (selectedTipoProyecto) {
			state.tiposProyecto = [selectedTipoProyecto];
		}
		if (selectedEstadoProyecto) {
			state.estadosProyecto = [selectedEstadoProyecto];
		}
		return state;
	}

	function aplicarFiltros() {
		const state = buildFilterState();
		dispatch('change', state);
		recalcularChips(state);
	}

	function internalClearFilters(showMessage = true) {
		searchText = '';
		selectedFacultadId = '';
		selectedInstitucionId = '';
		selectedCarreraId = '';
		selectedGenero = '';
		selectedPais = '';
		acreditadoFilter = '';
		// Nuevos filtros
		selectedCargo = '';
		selectedRegimen = '';
		selectedArea = '';
		selectedLinea = '';
		selectedTipoProyecto = '';
		selectedEstadoProyecto = '';

		activeFilters = [];
		activeFilterCount = 0;

		if (showMessage) {
			dispatch('change', {});
			dispatch('cleared');
			showClearSuccess = true;
			setTimeout(() => (showClearSuccess = false), 2000);
		}
	}

	function limpiarFiltros() {
		internalClearFilters(true);
	}

	function toggleFilters() {
		filtersExpanded = !filtersExpanded;
	}

	function handleSearchEnter(event: KeyboardEvent) {
		if (event.key === 'Enter' && !filtersExpanded) {
			filtersExpanded = true;
		}
	}

	// Recalcular chips
	function recalcularChips(state: MapParticipantsFilterState) {
		const chips: ActiveChip[] = [];

		if (state.searchText) {
			chips.push({
				name: 'Texto',
				value: state.searchText,
				clear: () => (searchText = '')
			});
		}

		if (state.facultadIds && state.facultadIds.length) {
			const id = state.facultadIds[0];
			const opt = options.facultades.find((o) => Number(o.value) === id);
			if (opt) {
				chips.push({
					name: 'Facultad',
					value: opt.label,
					clear: () => (selectedFacultadId = '')
				});
			}
		}

		if (state.institucionIds && state.institucionIds.length) {
			const id = state.institucionIds[0];
			const opt = options.instituciones.find((o) => Number(o.value) === id);
			if (opt) {
				chips.push({
					name: 'Institución',
					value: opt.label,
					clear: () => (selectedInstitucionId = '')
				});
			}
		}

		if (state.carreraIds && state.carreraIds.length) {
			const id = state.carreraIds[0];
			const opt = options.carreras.find((o) => Number(o.value) === id);
			if (opt) {
				chips.push({
					name: 'Carrera',
					value: opt.label,
					clear: () => (selectedCarreraId = '')
				});
			}
		}

		if (state.generos && state.generos.length) {
			const generoLabel = options.generos.find((o) => state.generos!.includes(o.value))?.label;
			if (generoLabel) {
				chips.push({
					name: 'Género',
					value: generoLabel,
					clear: () => (selectedGenero = '')
				});
			}
		}

		if (state.acreditado !== undefined && state.acreditado !== null) {
			const label = state.acreditado ? 'Acreditados' : 'No acreditados';
			chips.push({
				name: 'Acreditación',
				value: label,
				clear: () => (acreditadoFilter = '')
			});
		}

		if (state.paisesInstitucion && state.paisesInstitucion.length) {
			const value = state.paisesInstitucion[0];
			const opt = options.paisesInstitucion.find((o) => o.value === value);
			chips.push({
				name: 'País institución',
				value: opt?.label ?? value,
				clear: () => (selectedPais = '')
			});
		}
		// Cargos
		if (state.cargos && state.cargos.length) {
			const value = state.cargos[0];
			const opt = options.cargos.find((o) => o.value === value);
			chips.push({
				name: 'Cargo',
				value: opt?.label ?? value,
				clear: () => (selectedCargo = '')
			});
		}

		// Regímenes de dedicación
		if (state.regimenesDedicacion && state.regimenesDedicacion.length) {
			const value = state.regimenesDedicacion[0];
			const opt = options.regimenesDedicacion.find((o) => o.value === value);
			chips.push({
				name: 'Régimen',
				value: opt?.label ?? value,
				clear: () => (selectedRegimen = '')
			});
		}

		// Áreas de conocimiento
		if (state.areasConocimiento && state.areasConocimiento.length) {
			const value = state.areasConocimiento[0];
			const opt = options.areasConocimiento.find((o) => o.value === value);
			chips.push({
				name: 'Área',
				value: opt?.label ?? value,
				clear: () => (selectedArea = '')
			});
		}

		// Líneas de investigación
		if (state.lineasInvestigacion && state.lineasInvestigacion.length) {
			const value = state.lineasInvestigacion[0];
			const opt = options.lineasInvestigacion.find((o) => o.value === value);
			chips.push({
				name: 'Línea',
				value: opt?.label ?? value,
				clear: () => (selectedLinea = '')
			});
		}

		// Tipos de proyecto
		if (state.tiposProyecto && state.tiposProyecto.length) {
			const value = state.tiposProyecto[0];
			const opt = options.tiposProyecto.find((o) => o.value === value);
			chips.push({
				name: 'Tipo proyecto',
				value: opt?.label ?? value,
				clear: () => (selectedTipoProyecto = '')
			});
		}

		// Estados de proyecto
		if (state.estadosProyecto && state.estadosProyecto.length) {
			const value = state.estadosProyecto[0];
			const opt = options.estadosProyecto.find((o) => o.value === value);
			chips.push({
				name: 'Estado proyecto',
				value: opt?.label ?? value,
				clear: () => (selectedEstadoProyecto = '')
			});
		}

		activeFilters = chips;
		activeFilterCount = chips.length;
	}
</script>

<div class="participants-filters">
	<div class="filters-header">
		<div class="search-container">
			<input
				type="text"
				placeholder="Buscar por nombre, correo, carrera, facultad o institución..."
				class="search-input"
				bind:value={searchText}
				on:keydown={handleSearchEnter}
				aria-label="Buscar participantes"
			/>
			<div class="search-icon" class:has-value={searchText}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
			</div>
			{#if searchText}
				<button
					class="clear-text-btn"
					on:click={() => (searchText = '')}
					aria-label="Limpiar texto de búsqueda"
					transition:fade={{ duration: 150 }}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
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
			{/if}
		</div>
		<Sparkles>
			<div
				class="filters-toggle"
				on:click={toggleFilters}
				on:keydown={(e) => e.key === 'Enter' && toggleFilters()}
				tabindex="0"
				role="button"
				aria-expanded={filtersExpanded}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
				</svg>
				<span class="filter-count">
					{#if activeFilterCount}
						<span class="filter-badge">{activeFilterCount}</span>
					{/if}
					Filtros
				</span>
				<svg
					class:rotate={filtersExpanded}
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</div>
		</Sparkles>
	</div>

	{#if activeFilterCount > 0}
		<div class="active-filters" transition:fly={{ y: 5, duration: 200 }}>
			{#each activeFilters as filter}
				<div class="filter-chip">
					<span class="filter-name">{filter.name}:</span>
					<span class="filter-value">{filter.value}</span>
					<button
						class="remove-filter"
						on:click={filter.clear}
						aria-label={`Quitar filtro ${filter.name}`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
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
			{/each}
			<Sparkles>
				<button
					class="clear-all-chip"
					on:click={limpiarFiltros}
					aria-label="Limpiar todos los filtros"
				>
					Limpiar todo
				</button>
			</Sparkles>
		</div>
	{/if}

	{#if filtersExpanded}
		<div class="filters-expanded" transition:fly={{ y: -10, duration: 300 }}>
			<div class="filters-grid">
				<!-- Facultad / Institución -->
				<div class="filter-group">
					<label for="facultad">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
							<polyline points="9 22 9 12 15 12 15 22" />
						</svg>
						{#if mapLevel === 'faculty'}
							Facultad
						{:else}
							Institución
						{/if}
					</label>
					{#if mapLevel === 'faculty'}
						<select id="facultad" bind:value={selectedFacultadId}>
							<option value="">Todas las facultades</option>
							{#each options.facultades as opt}
								<option value={opt.value}>
									{opt.label}
									{#if opt.count}({opt.count}){/if}
								</option>
							{/each}
						</select>
					{:else}
						<select id="institucion" bind:value={selectedInstitucionId}>
							<option value="">Todas las instituciones</option>
							{#each options.instituciones as opt}
								<option value={opt.value}>
									{opt.label}
									{#if opt.count}({opt.count}){/if}
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- Carrera -->
				<div class="filter-group">
					<label for="carrera">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
							/>
						</svg>
						Carrera
					</label>
					<select id="carrera" bind:value={selectedCarreraId}>
						<option value="">Todas las carreras</option>
						{#each options.carreras as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Género -->
				<div class="filter-group">
					<label for="genero">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="8" r="4" />
							<path d="M6 20v-1a6 6 0 0 1 12 0v1" />
						</svg>
						Género
					</label>
					<select id="genero" bind:value={selectedGenero}>
						<option value="">Todos</option>
						{#each options.generos as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Acreditación -->
				<div class="filter-group">
					<label for="acreditado">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M9 11l3 3L22 4" />
							<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
						</svg>
						Acreditación
					</label>
					<select id="acreditado" bind:value={acreditadoFilter}>
						<option value="">Todos</option>
						<option value="true">Sólo acreditados</option>
						<option value="false">Sólo no acreditados</option>
					</select>
				</div>

				<!-- País institución -->
				<div class="filter-group">
					<label for="pais">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M2 12h20" />
							<path
								d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
							/>
						</svg>
						País de institución
					</label>
					<select id="pais" bind:value={selectedPais}>
						<option value="">Todos los países</option>
						{#each options.paisesInstitucion as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>
				<!-- Cargo -->
				<div class="filter-group">
					<label for="cargo">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
							<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
						</svg>
						Cargo en proyectos
					</label>
					<select id="cargo" bind:value={selectedCargo}>
						<option value="">Todos</option>
						{#each options.cargos as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Régimen de dedicación -->
				<div class="filter-group">
					<label for="regimen">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 6v6l3 3" />
						</svg>
						Régimen de dedicación
					</label>
					<select id="regimen" bind:value={selectedRegimen}>
						<option value="">Todos</option>
						{#each options.regimenesDedicacion as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Área de conocimiento -->
				<div class="filter-group">
					<label for="area">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M3 9h18" />
							<path d="M9 21V9" />
						</svg>
						Área de conocimiento
					</label>
					<select id="area" bind:value={selectedArea}>
						<option value="">Todas</option>
						{#each options.areasConocimiento as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Línea de investigación -->
				<div class="filter-group">
					<label for="linea">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="3 17 9 11 13 15 21 7" />
							<polyline points="14 7 21 7 21 14" />
						</svg>
						Línea de investigación
					</label>
					<select id="linea" bind:value={selectedLinea}>
						<option value="">Todas</option>
						{#each options.lineasInvestigacion as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Tipo de proyecto -->
				<div class="filter-group">
					<label for="tipoProyecto">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 2l4 4-4 4-4-4 4-4z" />
							<path d="M6 10l-4 4 4 4 4-4-4-4z" />
							<path d="M18 10l-4 4 4 4 4-4-4-4z" />
						</svg>
						Tipo de proyecto
					</label>
					<select id="tipoProyecto" bind:value={selectedTipoProyecto}>
						<option value="">Todos</option>
						{#each options.tiposProyecto as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>

				<!-- Estado de proyecto -->
				<div class="filter-group">
					<label for="estadoProyecto">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M9 12l2 2 4-4" />
						</svg>
						Estado de proyecto
					</label>
					<select id="estadoProyecto" bind:value={selectedEstadoProyecto}>
						<option value="">Todos</option>
						{#each options.estadosProyecto as opt}
							<option value={opt.value}>
								{opt.label}
								{#if opt.count}({opt.count}){/if}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="filters-actions">
				<button class="clear-btn" on:click={limpiarFiltros} disabled={activeFilterCount === 0}>
					Limpiar filtros
				</button>
				<Sparkles>
					<Button on:click={aplicarFiltros} color="secondary">Aplicar</Button>
				</Sparkles>
			</div>

			{#if showClearSuccess}
				<div class="clear-success" transition:fly={{ y: -10, duration: 200 }}>
					Filtros de participantes limpiados correctamente
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.participants-filters {
		width: 100%;
		background: var(--color--card-background);
		border-radius: 12px;
		padding: 18px;
		box-shadow: var(--card-shadow), 0 5px 15px rgba(0, 0, 0, 0.05);
		color: var(--color--text);
		position: relative;
		overflow: hidden;
	}

	.filters-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 15px;

		@include for-phone-only {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.search-container {
		position: relative;
		flex: 1;
		max-width: 500px;
	}

	.search-input {
		width: 100%;
		padding: 12px 40px 12px 15px;
		border-radius: 8px;
		border: 2px solid color-mix(in srgb, var(--color--text) 20%, transparent);
		background: var(--color--card-background);
		color: var(--color--text);
		font-size: 1rem;
		outline: none;
		transition: all 0.2s ease;
	}

	.search-icon {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color--text-shade);

		&.has-value {
			color: var(--color--primary);
		}
	}

	.clear-text-btn {
		position: absolute;
		right: 38px;
		top: 50%;
		transform: translateY(-50%);
		background: color-mix(in srgb, var(--color--text) 15%, transparent);
		border: none;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.filters-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--color--primary);
		color: white;
		padding: 10px 15px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;

		svg.rotate {
			transform: rotate(180deg);
			transition: transform 0.3s ease;
		}
	}

	.filter-count {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.filter-badge {
		background: white;
		color: var(--color--primary);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.active-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 15px;
	}

	.filter-chip {
		display: flex;
		align-items: center;
		background: color-mix(in srgb, var(--color--primary) 15%, transparent);
		border-radius: 20px;
		padding: 5px 10px;
		font-size: 0.85rem;
		gap: 5px;
	}

	.clear-all-chip {
		background: color-mix(in srgb, var(--color--text) 10%, transparent);
		border: none;
		border-radius: 20px;
		padding: 5px 12px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.filters-expanded {
		margin-top: 15px;
		border-top: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		padding-top: 15px;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 18px;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 8px;

		label {
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--color--text-shade);
			display: flex;
			align-items: center;
			gap: 6px;
		}

		select {
			padding: 10px 12px;
			border-radius: 8px;
			border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
			background: var(--color--card-background);
			color: var(--color--text);
			font-size: 0.95rem;
		}
	}

	.filters-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20px;
		padding-top: 15px;
		border-top: 1px dashed color-mix(in srgb, var(--color--text) 10%, transparent);
	}

	.clear-btn {
		background: color-mix(in srgb, var(--color--text) 10%, transparent);
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-weight: 600;
		cursor: pointer;
	}

	.clear-success {
		position: absolute;
		bottom: 15px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color--callout-accent--success);
		color: white;
		padding: 8px 16px;
		border-radius: 30px;
		font-size: 0.9rem;
	}
</style>
