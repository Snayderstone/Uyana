<!-- src/lib/components/molecules/ProjectFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Proyecto } from '$lib/services/proyectosService';
	import { fly, fade } from 'svelte/transition';
	import ButtonSvelte from '$lib/components/atoms/Button.svelte';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';
	import type { MapLevel } from '$lib/models/map.model'; // o desde project.model si ahí definiste MapLevel

	export let proyectos: Proyecto[] = [];
	export let mapLevel: MapLevel = 'faculty';

	const dispatch = createEventDispatcher();

		// Opciones para filtros (se generan automáticamente de los datos)
	let facultades: string[] = [];
	let estados: string[] = [];
	let camposAmplios: string[] = [];
	let tiposProyecto: string[] = [];
	let fuentesFinanciamiento: string[] = [];
	let instituciones: string[] = [];

	// Filtros seleccionados
	let filtroFacultad: string = '';
	let filtroEstado: string = '';
	let filtroCampoAmplio: string = '';
	let filtroTipoProyecto: string = '';
	let filtroFuenteFinanciamiento: string = '';
	let filtroTexto: string = '';

	// 🔹 Nuevo: filtro "Con / Sin investigadores acreditados"
	// valores posibles: '', 'con', 'sin'
	let filtroAcreditados: string = '';

	// 🔹 Nuevo: checkbox "Solo proyectos para SIIES"
	let soloParaSIIES: boolean = false;

	// 🔹 Nuevo: rango de año de inicio
	let minAnioInicio: number | null = null;
	let maxAnioInicio: number | null = null;
	let filtroAnioInicioDesde: number | '' = '';
	let filtroAnioInicioHasta: number | '' = '';
	// 🔹 Modelo para chips de filtros activos
	type ActiveFilter = {
		name: string;
		value: string;
		clear: () => void;
	};

	let activeFilterCount = 0;
	let activeFilters: ActiveFilter[] = [];

	// Panel de filtros expandido/colapsado
	let filtersExpanded = false;

	// Mensaje de éxito para limpiar filtros
	let showClearSuccess = false;
	let filteredProyectos: Proyecto[] = [];

	// 🔹 Cuando cambia mapLevel (faculty ↔ institution), limpiamos el filtro principal
	$: if (mapLevel) {
		filtroFacultad = '';
	}
	$: console.log('[ProjectFilters] prop proyectos cambió, length =', proyectos.length);
	// Extraer opciones únicas de los datos de proyectos
		$: {
		if (proyectos.length > 0) {
			facultades = [
				...new Set(proyectos.map((p) => p.facultad_o_entidad_o_area_responsable).filter(Boolean))
			].sort();
			instituciones = [
				...new Set(proyectos.map((p) => p.institucion).filter(Boolean))
			].sort();
			estados = [...new Set(proyectos.map((p) => p.estado).filter(Boolean))].sort();
			camposAmplios = [...new Set(proyectos.map((p) => p.campo_amplio).filter(Boolean))].sort();
			tiposProyecto = [...new Set(proyectos.map((p) => p.tipo_proyecto).filter(Boolean))].sort();
			fuentesFinanciamiento = [
				...new Set(proyectos.map((p) => p.fuente_financiamiento).filter(Boolean))
			].sort();
			console.log('Ejemplo de proyectos:', proyectos.slice(0, 3));
			console.log('Fuentes únicas:', fuentesFinanciamiento);
			// 🔹 Cálculo de rango de años de inicio
			const anios = proyectos
				.map((p) => p.anio_inicio)
				.filter((a): a is number => typeof a === 'number');
			if (anios.length) {
				minAnioInicio = Math.min(...anios);
				maxAnioInicio = Math.max(...anios);
				// Si el usuario no ha tocado aún los filtros de año, inicializamos al rango completo
				if (filtroAnioInicioDesde === '') {
					filtroAnioInicioDesde = minAnioInicio;
				}
				if (filtroAnioInicioHasta === '') {
					filtroAnioInicioHasta = maxAnioInicio;
				}
			} else {
				minAnioInicio = null;
				maxAnioInicio = null;
				filtroAnioInicioDesde = '';
				filtroAnioInicioHasta = '';
			}
		}
	}
		function aplicarFiltros() {
		// Aplicar filtros a los proyectos
		filteredProyectos = proyectos.filter((proyecto) => {
			const query = filtroTexto.toLowerCase();
			// 🔎 Filtro de texto (búsqueda en título, objetivo, coordinador, facultad)
			const textMatch =
				!filtroTexto ||
				proyecto.titulo?.toLowerCase().includes(query) ||
				proyecto.objetivo?.toLowerCase().includes(query) ||
				proyecto.coordinador_director?.toLowerCase().includes(query) ||
				proyecto.facultad_o_entidad_o_area_responsable?.toLowerCase().includes(query) ||
				proyecto.institucion?.toLowerCase().includes(query);

			// 🎓 Filtros de selección básicos
			const facultadMatch =
				!filtroFacultad ||
				(mapLevel === 'faculty'
					? proyecto.facultad_o_entidad_o_area_responsable === filtroFacultad
					: proyecto.institucion === filtroFacultad);

			const estadoMatch = !filtroEstado || proyecto.estado === filtroEstado;

			const campoMatch = !filtroCampoAmplio || proyecto.campo_amplio === filtroCampoAmplio;

			const tipoMatch = !filtroTipoProyecto || proyecto.tipo_proyecto === filtroTipoProyecto;

			const financiamientoMatch =
				!filtroFuenteFinanciamiento ||
				proyecto.fuente_financiamiento === filtroFuenteFinanciamiento;

			// 🧪 Nuevo: Con / sin investigadores acreditados
			const acreditadosMatch =
				!filtroAcreditados ||
				(filtroAcreditados === 'con' && proyecto.tiene_investigadores_acreditados) ||
				(filtroAcreditados === 'sin' && !proyecto.tiene_investigadores_acreditados);

			// 🏛️ Nuevo: Solo proyectos para SIIES
			const siiesMatch = !soloParaSIIES || proyecto.para_siies === true;
			// 📅 Nuevo: Rango de año de inicio
			let anioMatch = true;
			const anio = proyecto.anio_inicio;
			if (typeof filtroAnioInicioDesde === 'number' && anio != null) {
				anioMatch = anioMatch && anio >= filtroAnioInicioDesde;
			}
			if (typeof filtroAnioInicioHasta === 'number' && anio != null) {
				anioMatch = anioMatch && anio <= filtroAnioInicioHasta;
			}
			// Nota: si anio es null, lo dejamos pasar (anioMatch se queda en true)
			return (
				textMatch &&
				facultadMatch &&
				estadoMatch &&
				campoMatch &&
				tipoMatch &&
				financiamientoMatch &&
				acreditadosMatch &&
				siiesMatch &&
				anioMatch
			);
		});

		// Emitir evento cuando cambian los proyectos filtrados
				{
			dispatch('filter', filteredProyectos);

			if (filtroFacultad) {
				if (mapLevel === 'faculty') {
					dispatch('facultadSelected', filtroFacultad);
				} else {
					dispatch('institucionSelected', filtroFacultad);
				}
			} else {
				// Si se limpió la selección, notificamos al padre también
				if (mapLevel === 'faculty') {
					dispatch('facultadSelected', '');
				} else {
					dispatch('institucionSelected', '');
				}
			}
		}
	}
		// Contar filtros activos
	$: {
		const baseFilters = [
			filtroFacultad,
			filtroEstado,
			filtroCampoAmplio,
			filtroTipoProyecto,
			filtroFuenteFinanciamiento,
			filtroAcreditados,
			soloParaSIIES ? 'siies' : ''
		];

		const yearFilterActive =
			typeof filtroAnioInicioDesde === 'number' ||
			typeof filtroAnioInicioHasta === 'number';

		let count = baseFilters.filter(Boolean).length;

		if (yearFilterActive) count += 1;
		if (filtroTexto) count += 1;

		activeFilterCount = count;
	}

	// Arreglo con los filtros activos para mostrar
	$: {
		let yearLabel = '';
		const desde = filtroAnioInicioDesde;
		const hasta = filtroAnioInicioHasta;

		if (typeof desde === 'number' || typeof hasta === 'number') {
			if (typeof desde === 'number' && typeof hasta === 'number') {
				yearLabel = `${desde}–${hasta}`;
			} else if (typeof desde === 'number') {
				yearLabel = `Desde ${desde}`;
			} else if (typeof hasta === 'number') {
				yearLabel = `Hasta ${hasta}`;
			}
		}

		activeFilters = [
			{ name: 'Texto', value: filtroTexto, clear: () => (filtroTexto = '') },
			{
				name: mapLevel === 'faculty' ? 'Facultad' : 'Institución',
				value: filtroFacultad,
				clear: () => (filtroFacultad = '')
			},
			{ name: 'Estado', value: filtroEstado, clear: () => (filtroEstado = '') },
			{
				name: 'Área de conocimiento',
				value: filtroCampoAmplio,
				clear: () => (filtroCampoAmplio = '')
			},
			{ name: 'Tipo', value: filtroTipoProyecto, clear: () => (filtroTipoProyecto = '') },
			{
				name: 'Financiamiento',
				value: filtroFuenteFinanciamiento,
				clear: () => (filtroFuenteFinanciamiento = '')
			},
			{
				name: 'Acreditados',
				value:
					filtroAcreditados === 'con'
						? 'Con acreditados'
						: filtroAcreditados === 'sin'
						? 'Sin acreditados'
						: '',
				clear: () => (filtroAcreditados = '')
			},
			{
				name: 'SIIES',
				value: soloParaSIIES ? 'Solo proyectos SIIES' : '',
				clear: () => (soloParaSIIES = false)
			},
			{
				name: 'Año inicio',
				value: yearLabel,
				clear: () => {
					if (minAnioInicio != null && maxAnioInicio != null) {
						filtroAnioInicioDesde = minAnioInicio;
						filtroAnioInicioHasta = maxAnioInicio;
					} else {
						filtroAnioInicioDesde = '';
						filtroAnioInicioHasta = '';
					}
				}
			}
		].filter((filter) => filter.value);
	}
	// Limpiar todos los filtros
		function limpiarFiltros() {
		filtroFacultad = '';
		filtroEstado = '';
		filtroCampoAmplio = '';
		filtroTipoProyecto = '';
		filtroFuenteFinanciamiento = '';
		filtroTexto = '';
		filtroAcreditados = '';
		soloParaSIIES = false;

		if (minAnioInicio != null && maxAnioInicio != null) {
			filtroAnioInicioDesde = minAnioInicio;
			filtroAnioInicioHasta = maxAnioInicio;
		} else {
			filtroAnioInicioDesde = '';
			filtroAnioInicioHasta = '';
		}

		// Notificar que se ha eliminado la selección de facultad/institución
		if (mapLevel === 'faculty') {
			dispatch('facultadSelected', '');
		} else {
			dispatch('institucionSelected', '');
		}

		// Mostrar mensaje de éxito
		showClearSuccess = true;
		setTimeout(() => {
			showClearSuccess = false;
		}, 2000);
	}

	// Alternar panel de filtros expandido
	function toggleFilters() {
		filtersExpanded = !filtersExpanded;
	}

	// Función para presionar Enter en el campo de búsqueda
	function handleSearchEnter(event: KeyboardEvent) {
		if (event.key === 'Enter' && !filtersExpanded) {
			filtersExpanded = true;
		}
	}
</script>

<div class="project-filters">
	<div class="filters-header">
		<div class="search-container">
			<input
				type="text"
				placeholder="Buscar proyectos por título, coordinador, objetivo, facultad o institución..."
				class="search-input"
				bind:value={filtroTexto}
				on:keydown={handleSearchEnter}
				aria-label="Buscar proyectos"
			/>
			<div class="search-icon" class:has-value={filtroTexto}>
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
			{#if filtroTexto}
				<button
					class="clear-text-btn"
					on:click={() => (filtroTexto = '')}
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
			aria-label={filtersExpanded ? 'Colapsar filtros' : 'Expandir filtros'}
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

	<!-- Mostrar chips para filtros activos -->
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
    Facultad / Entidad
  {:else}
    Institución
  {/if}
					</label>
					<select id="facultad" bind:value={filtroFacultad}>
  {#if mapLevel === 'faculty'}
    <option value="">Todas las facultades</option>
    {#each facultades as facultad}
      <option value={facultad}>{facultad}</option>
    {/each}
  {:else}
    <option value="">Todas las instituciones</option>
    {#each instituciones as institucion}
      <option value={institucion}>{institucion}</option>
    {/each}
  {/if}
</select>
				</div>

				<div class="filter-group">
					<label for="estado">
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
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
							<polyline points="22 4 12 14.01 9 11.01" />
						</svg>
						Estado
					</label>
					<select id="estado" bind:value={filtroEstado}>
						<option value="">Todos los estados</option>
						{#each estados as estado}
							<option value={estado}>{estado}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="campo">
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
							<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
							<line x1="12" y1="22.08" x2="12" y2="12" />
						</svg>
						Área de Conocimiento
					</label>
					<select id="campo" bind:value={filtroCampoAmplio}>
						<option value="">Todos las areas</option>
						{#each camposAmplios as campo}
							<option value={campo}>{campo}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="tipo">
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
							<rect x="3" y="3" width="7" height="7" />
							<rect x="14" y="3" width="7" height="7" />
							<rect x="14" y="14" width="7" height="7" />
							<rect x="3" y="14" width="7" height="7" />
						</svg>
						Tipo de Proyecto
					</label>
					<select id="tipo" bind:value={filtroTipoProyecto}>
						<option value="">Todos los tipos</option>
						{#each tiposProyecto as tipo}
							<option value={tipo}>{tipo}</option>
						{/each}
					</select>
				</div>
				<div class="filter-group">
					<label for="financiamiento">
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
							<line x1="12" y1="1" x2="12" y2="23" />
							<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
						</svg>
						Fuente Financiamiento
					</label>
					<select id="financiamiento" bind:value={filtroFuenteFinanciamiento}>

						<option value="">Todas las fuentes</option>
						{#each fuentesFinanciamiento as fuente}
							<option value={fuente}>
								{fuente === 'FONDOS_CONCURSABLES_INTERNO_IES'
									? 'Fondos Concursables'
									: fuente === 'ASIGNACION_REGULAR_IES'
									? 'Asignación Regular'
									: fuente}
							</option>
						{/each}
					</select>
				</div>
								<div class="filter-group">
					<label for="acreditados">
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
						Investigadores acreditados
					</label>
					<select id="acreditados" bind:value={filtroAcreditados}>
						<option value="">Todos</option>
						<option value="con">Con acreditados</option>
						<option value="sin">Sin acreditados</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="anio-desde">
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
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						Año de inicio
					</label>
					<div class="year-range">
						<input
							id="anio-desde"
							type="number"
							min={minAnioInicio ?? undefined}
							max={maxAnioInicio ?? undefined}
							bind:value={filtroAnioInicioDesde}
							placeholder={minAnioInicio != null ? String(minAnioInicio) : 'Desde'}
						/>
						<span class="year-separator">–</span>
						<input
							id="anio-hasta"
							type="number"
							min={minAnioInicio ?? undefined}
							max={maxAnioInicio ?? undefined}
							bind:value={filtroAnioInicioHasta}
							placeholder={maxAnioInicio != null ? String(maxAnioInicio) : 'Hasta'}
						/>
					</div>

					<label class="siies-checkbox">
						<input type="checkbox" bind:checked={soloParaSIIES} />
						Solo proyectos para SIIES
					</label>
				</div>
			</div>

			<div class="filters-actions">
				<button
					class="clear-btn"
					on:click={limpiarFiltros}
					disabled={activeFilterCount === 0}
					aria-label="Limpiar todos los filtros"
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
						<path d="M3 3h18v18H3zM15 9l-6 6m0-6l6 6" />
					</svg>
					Limpiar filtros
				</button>
				<Sparkles>
				<ButtonSvelte on:click={aplicarFiltros} color="secondary"> Aplicar </ButtonSvelte>
				</Sparkles>
				<div class="filter-stats">
					<span class="results-count">
						<strong>{filteredProyectos.length}</strong> de {proyectos.length} proyectos
					</span>
					{#if filteredProyectos.length < proyectos.length}
						<span class="filtered-percent">
							({Math.round((filteredProyectos.length / proyectos.length) * 100)}%)
						</span>
					{/if}
				</div>
			</div>

			<!-- Mensaje de éxito al limpiar filtros -->
			{#if showClearSuccess}
				<div class="clear-success" transition:fly={{ y: -10, duration: 200 }}>
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
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
						<polyline points="22 4 12 14.01 9 11.01" />
					</svg>
					Filtros limpiados correctamente
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.project-filters {
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

		@include for-phone-only {
			max-width: 100%;
		}
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
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

		&:focus {
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--color--primary) 25%, transparent),
				0 3px 8px rgba(0, 0, 0, 0.1);
			transform: translateY(-1px);
		}

		&::placeholder {
			color: var(--color--text-shade);
			opacity: 0.6;
		}
	}

	.search-icon {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color--text-shade);
		pointer-events: none;
		transition: all 0.3s ease;

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
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;

		&:hover {
			background: color-mix(in srgb, var(--color--text) 25%, transparent);
			transform: translateY(-50%) scale(1.1);
		}
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
		transition: all 0.2s ease;
		box-shadow: 0 3px 8px color-mix(in srgb, var(--color--primary) 30%, transparent);

		&:hover {
			filter: brightness(1.1);
			transform: translateY(-2px);
			box-shadow: 0 5px 12px color-mix(in srgb, var(--color--primary) 40%, transparent);
		}

		svg {
			transition: transform 0.3s ease;

			&.rotate {
				transform: rotate(180deg);
			}
		}
	}

	.filter-count {
		font-size: 0.95rem;
		position: relative;
		display: flex;
		align-items: center;
		gap: 4px;
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
		color: var(--color--primary);
		gap: 5px;
		transition: all 0.2s ease;

		&:hover {
			background: color-mix(in srgb, var(--color--primary) 20%, transparent);
			transform: translateY(-1px);
		}

		.filter-name {
			font-weight: 600;
		}

		.filter-value {
			max-width: 150px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.remove-filter {
			background: none;
			border: none;
			padding: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			color: var(--color--primary);
			opacity: 0.7;
			transition: all 0.2s ease;
			margin-left: 2px;

			&:hover {
				opacity: 1;
				transform: scale(1.2);
			}
		}
	}

	.clear-all-chip {
		background: color-mix(in srgb, var(--color--text) 10%, transparent);
		border: none;
		border-radius: 20px;
		padding: 5px 12px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background: color-mix(in srgb, var(--color--text) 15%, transparent);
			transform: translateY(-1px);
		}
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

			svg {
				color: var(--color--primary);
			}
		}

		select {
			padding: 10px 12px;
			border-radius: 8px;
			border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
			background: var(--color--card-background);
			color: var(--color--text);
			font-size: 0.95rem;
			appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-position: right 12px center;
			background-size: 16px;
			padding-right: 36px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
			transition: all 0.2s ease;

			&:focus {
				border-color: var(--color--primary);
				outline: none;
				box-shadow: 0 0 0 2px color-mix(in srgb, var(--color--primary) 20%, transparent),
					0 3px 8px rgba(0, 0, 0, 0.08);
				transform: translateY(-1px);
			}

			&:hover:not(:focus) {
				border-color: color-mix(in srgb, var(--color--primary) 90%, transparent);
				background: color-mix(in srgb, var(--color--primary) 30%, transparent);
			}
		}
				.year-range {
			display: flex;
			align-items: center;
			gap: 8px;

			input {
				flex: 1;
				padding: 8px 10px;
				border-radius: 8px;
				border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
				background: var(--color--card-background);
				color: var(--color--text);
				font-size: 0.9rem;

				&:focus {
					border-color: var(--color--primary);
					outline: none;
					box-shadow: 0 0 0 2px
							color-mix(in srgb, var(--color--primary) 20%, transparent),
						0 3px 8px rgba(0, 0, 0, 0.08);
				}
			}

			.year-separator {
				color: var(--color--text-shade);
				font-size: 0.9rem;
			}
		}

		.siies-checkbox {
			margin-top: 6px;
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.85rem;
			color: var(--color--text-shade);

			input[type='checkbox'] {
				accent-color: var(--color--primary);
			}
		}
	}

	.filters-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20px;
		padding-top: 15px;
		border-top: 1px dashed color-mix(in srgb, var(--color--text) 10%, transparent);

		@include for-phone-only {
			flex-direction: column;
			gap: 15px;
			align-items: stretch;
		}
	}

	.clear-btn {
		background: color-mix(in srgb, var(--color--text) 10%, transparent);
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		color: var(--color--text);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;

		&:hover:not(:disabled) {
			background: color-mix(in srgb, var(--color--text) 15%, transparent);
			transform: translateY(-1px);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		svg {
			color: var(--color--text-shade);
		}
	}

	.filter-stats {
		font-size: 0.95rem;
		color: var(--color--text-shade);
		display: flex;
		gap: 5px;
		align-items: center;

		strong {
			color: var(--color--primary);
			font-weight: 700;
			font-size: 1.1rem;
		}

		.filtered-percent {
			color: var(--color--text-shade);
			font-size: 0.85rem;
		}
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
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);

		svg {
			filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
		}
	}
</style>
