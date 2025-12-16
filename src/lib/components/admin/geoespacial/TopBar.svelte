<script lang="ts">
	import type {
		InstitucionConFacultades,
		FacultadConCarreras,
		CarreraConRelaciones
	} from '$lib/models/admin';

	// Props
	export let instituciones: InstitucionConFacultades[] = [];
	export let facultades: FacultadConCarreras[] = [];
	export let carreras: CarreraConRelaciones[] = [];
	export let showInstituciones = true;
	export let showFacultades = true;
	export let showCarreras = true;
	export let onToggleFilter: (type: 'institucion' | 'facultad' | 'carrera') => void;
	export let onOpenCreate: (type: 'institucion' | 'facultad' | 'carrera') => void;
	export let onSearch: (
		query: string,
		type: 'institucion' | 'facultad' | 'carrera',
		field: string
	) => any[];
	export let onSelectResult: (result: any) => void;

	// Colores
	const COLORS = {
		institucion: '#3b82f6',
		facultad: '#10b981',
		carrera: '#f59e0b'
	};

	// Estados locales
	let showAddDropdown = false;
	let showSearchDropdown = false;
	let searchType: 'institucion' | 'facultad' | 'carrera' = 'institucion';
	let searchQuery = '';
	let searchResults: any[] = [];
	let searchFilters = {
		institucion: {
			campo: 'todos' as 'todos' | 'nombre' | 'sigla' | 'pais'
		},
		facultad: {
			campo: 'todos' as 'todos' | 'nombre' | 'sigla' | 'decano' | 'subdecano'
		},
		carrera: {
			campo: 'todos' as 'todos' | 'nombre'
		}
	};

	function handleSearch() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		const field = searchFilters[searchType].campo;
		searchResults = onSearch(searchQuery, searchType, field);
	}

	function selectSearchResult(result: any) {
		onSelectResult(result);
		showSearchDropdown = false;
		searchQuery = '';
		searchResults = [];
	}
</script>

<div class="top-bar">
	<!-- Filtros de visualización -->
	<div class="filters">
		<button
			class="filter-chip"
			class:active={showInstituciones}
			style="--chip-color: {COLORS.institucion}"
			on:click={() => onToggleFilter('institucion')}
		>
			<span class="chip-dot" />
			Instituciones ({instituciones.length})
		</button>
		<button
			class="filter-chip"
			class:active={showFacultades}
			style="--chip-color: {COLORS.facultad}"
			on:click={() => onToggleFilter('facultad')}
		>
			<span class="chip-dot" />
			Facultades ({facultades.length})
		</button>
		<button
			class="filter-chip"
			class:active={showCarreras}
			style="--chip-color: {COLORS.carrera}"
			on:click={() => onToggleFilter('carrera')}
		>
			<span class="chip-dot" />
			Carreras ({carreras.length})
		</button>
	</div>

	<!-- Controles de acción -->
	<div class="action-buttons">
		<!-- Botón de agregar -->
		<div class="dropdown-container">
			<button class="btn-action btn-add-main" on:click={() => (showAddDropdown = !showAddDropdown)}>
				<span class="icon">+</span>
				Agregar
			</button>
			{#if showAddDropdown}
				<div class="dropdown add-dropdown">
					<button
						class="dropdown-item"
						on:click={() => {
							onOpenCreate('institucion');
							showAddDropdown = false;
						}}
					>
						<span class="item-icon" style="background-color: {COLORS.institucion};">🏛️</span>
						<div class="item-content">
							<div class="item-title">Nueva Institución</div>
							<div class="item-desc">Agregar una nueva institución educativa</div>
						</div>
					</button>
					<button
						class="dropdown-item"
						on:click={() => {
							onOpenCreate('facultad');
							showAddDropdown = false;
						}}
					>
						<span class="item-icon" style="background-color: {COLORS.facultad};">📚</span>
						<div class="item-content">
							<div class="item-title">Nueva Facultad</div>
							<div class="item-desc">Agregar una nueva facultad</div>
						</div>
					</button>
					<button
						class="dropdown-item"
						on:click={() => {
							onOpenCreate('carrera');
							showAddDropdown = false;
						}}
					>
						<span class="item-icon" style="background-color: {COLORS.carrera};">🎓</span>
						<div class="item-content">
							<div class="item-title">Nueva Carrera</div>
							<div class="item-desc">Agregar una nueva carrera</div>
						</div>
					</button>
				</div>
			{/if}
		</div>

		<!-- Botón de búsqueda -->
		<div class="dropdown-container">
			<button
				class="btn-action btn-search"
				on:click={() => (showSearchDropdown = !showSearchDropdown)}
			>
				<span class="icon">🔍</span>
				Buscar
			</button>
			{#if showSearchDropdown}
				<div class="dropdown search-dropdown">
					<div class="dropdown-header">
						<h4>Buscar por tipo</h4>
						<button class="btn-close-dropdown" on:click={() => (showSearchDropdown = false)}>
							×
						</button>
					</div>
					<div class="search-type-tabs">
						<button
							class="search-tab"
							class:active={searchType === 'institucion'}
							on:click={() => {
								searchType = 'institucion';
								searchQuery = '';
								searchResults = [];
							}}
						>
							🏛️ Institución
						</button>
						<button
							class="search-tab"
							class:active={searchType === 'facultad'}
							on:click={() => {
								searchType = 'facultad';
								searchQuery = '';
								searchResults = [];
							}}
						>
							📚 Facultad
						</button>
						<button
							class="search-tab"
							class:active={searchType === 'carrera'}
							on:click={() => {
								searchType = 'carrera';
								searchQuery = '';
								searchResults = [];
							}}
						>
							🎓 Carrera
						</button>
					</div>

					<!-- Filtro por campo -->
					<div class="search-filter-container">
						<span class="filter-label">Buscar en:</span>
						{#if searchType === 'institucion'}
							<select
								bind:value={searchFilters.institucion.campo}
								on:change={handleSearch}
								class="filter-select"
							>
								<option value="todos">Todos los campos</option>
								<option value="nombre">Nombre</option>
								<option value="sigla">Sigla</option>
								<option value="pais">País</option>
							</select>
						{:else if searchType === 'facultad'}
							<select
								bind:value={searchFilters.facultad.campo}
								on:change={handleSearch}
								class="filter-select"
							>
								<option value="todos">Todos los campos</option>
								<option value="nombre">Nombre</option>
								<option value="sigla">Sigla</option>
								<option value="decano">Decano</option>
								<option value="subdecano">Subdecano</option>
							</select>
						{:else if searchType === 'carrera'}
							<select
								bind:value={searchFilters.carrera.campo}
								on:change={handleSearch}
								class="filter-select"
							>
								<option value="todos">Todos los campos</option>
								<option value="nombre">Nombre</option>
							</select>
						{/if}
					</div>

					<div class="search-input-container">
						<input
							type="text"
							bind:value={searchQuery}
							on:input={handleSearch}
							placeholder="Escribe para buscar..."
							class="search-input"
						/>
					</div>
					{#if searchResults.length > 0}
						<div class="search-results">
							{#each searchResults as result}
								<button class="search-result-item" on:click={() => selectSearchResult(result)}>
									<div class="result-info">
										<div class="result-name">{result.nombre}</div>
										<div class="result-meta">
											{#if result.type === 'institucion'}
												{#if result.sigla}<span class="meta-tag">Sigla: {result.sigla}</span>{/if}
												{#if result.pais}<span class="meta-tag">País: {result.pais}</span>{/if}
											{:else if result.type === 'facultad'}
												{#if result.sigla}<span class="meta-tag">Sigla: {result.sigla}</span>{/if}
												{#if result.decano}<span class="meta-tag">Decano: {result.decano}</span
													>{/if}
												{#if result.subdecano}<span class="meta-tag"
														>Subdecano: {result.subdecano}</span
													>{/if}
												{#if result.institucion_nombre}<span class="meta-tag"
														>📍 {result.institucion_nombre}</span
													>{/if}
											{:else if result.type === 'carrera'}
												{#if result.facultad_nombre}<span class="meta-tag"
														>📍 {result.facultad_nombre}</span
													>{/if}
											{/if}
										</div>
									</div>
								</button>
							{/each}
						</div>
					{:else if searchQuery.trim()}
						<div class="no-results">No se encontraron resultados</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.top-bar {
		position: sticky;
		top: 0;
		background: var(--color--card-background, white);
		box-shadow: var(--card-shadow, 0 2px 8px rgba(0, 0, 0, 0.15));
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.75rem;
		gap: 0.75rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		z-index: 200;
	}

	.filters {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.filter-chip {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--color--card-background, white);
		border: 1.5px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 1.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color--text-shade, #6b7280);
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-chip:hover {
		border-color: var(--chip-color);
		color: var(--chip-color);
	}

	.filter-chip.active {
		background: var(--chip-color);
		border-color: var(--chip-color);
		color: white;
	}

	.chip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}

	.action-buttons {
		display: flex;
		gap: 0.4rem;
	}

	.dropdown-container {
		position: relative;
	}

	.btn-action {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--color--card-background, white);
		border: 1.5px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color--text, #374151);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-action:hover {
		background: var(--color--page-background, #f9fafb);
		border-color: rgba(var(--color--text-rgb), 0.15);
	}

	.btn-add-main {
		background: var(--color--primary, #3b82f6);
		border-color: var(--color--primary, #3b82f6);
		color: white;
	}

	.btn-add-main:hover {
		background: rgba(var(--color--primary-rgb), 0.9);
		border-color: rgba(var(--color--primary-rgb), 0.9);
	}

	.btn-search {
		background: var(--color--card-background, white);
	}

	.icon {
		font-size: 1rem;
		line-height: 1;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 0.375rem);
		right: 0;
		background: var(--color--card-background, white);
		border-radius: 0.375rem;
		box-shadow: var(--card-shadow, 0 3px 10px rgba(0, 0, 0, 0.12));
		min-width: 260px;
		z-index: 1001;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.dropdown-header h4 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color--text, #111827);
	}

	.btn-close-dropdown {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--color--text-shade, #6b7280);
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.btn-close-dropdown:hover {
		color: var(--color--text, #111827);
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border: none;
		background: var(--color--card-background, white);
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.05);
	}

	.dropdown-item:hover {
		background: var(--color--page-background, #f9fafb);
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.item-icon {
		width: 32px;
		height: 32px;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.item-content {
		flex: 1;
	}

	.item-title {
		font-weight: 600;
		font-size: 0.8125rem;
		color: var(--color--text, #111827);
		margin-bottom: 0.125rem;
	}

	.item-desc {
		font-size: 0.6875rem;
		color: var(--color--text-shade, #6b7280);
	}

	.search-type-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.search-tab {
		flex: 1;
		padding: 0.375rem 0.5rem;
		background: var(--color--card-background, white);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		color: var(--color--text-shade, #6b7280);
		cursor: pointer;
		transition: all 0.2s;
	}

	.search-tab:hover {
		background: var(--color--page-background, #f9fafb);
	}

	.search-tab.active {
		background: var(--color--primary, #3b82f6);
		color: white;
		border-color: var(--color--primary, #3b82f6);
	}

	.search-filter-container {
		padding: 0.5rem;
		padding-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.filter-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--color--text-shade, #6b7280);
		white-space: nowrap;
	}

	.filter-select {
		flex: 1;
		padding: 0.3rem 0.4rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 0.3rem;
		font-size: 0.6875rem;
		background: var(--color--card-background, white);
		color: var(--color--text, #111827);
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-select:hover {
		border-color: rgba(var(--color--text-rgb), 0.3);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--color--primary, #3b82f6);
		box-shadow: 0 0 0 2px rgba(var(--color--primary-rgb), 0.1);
	}

	.search-input-container {
		padding: 0.5rem;
	}

	.search-input {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 0.3rem;
		font-size: 0.8125rem;
		background: var(--color--card-background, white);
		color: var(--color--text, #111827);
	}

	.search-results {
		max-height: 200px;
		overflow-y: auto;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.search-result-item {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: none;
		background: var(--color--card-background, white);
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.05);
	}

	.search-result-item:hover {
		background: var(--color--page-background, #f9fafb);
	}

	.result-info {
		flex: 1;
	}

	.result-name {
		font-weight: 600;
		font-size: 0.8125rem;
		color: var(--color--text, #111827);
	}

	.result-meta {
		font-size: 0.6875rem;
		color: var(--color--text-shade, #6b7280);
		margin-top: 0.125rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.meta-tag {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		background: rgba(var(--color--text-rgb), 0.05);
		border-radius: 0.25rem;
		font-size: 0.625rem;
		color: var(--color--text-shade, #4b5563);
		font-weight: 500;
	}

	.no-results {
		padding: 1.5rem;
		text-align: center;
		color: var(--color--text-shade, #9ca3af);
		font-size: 0.8125rem;
	}
</style>
