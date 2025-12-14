<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let filters: {
		codigo: string;
		titulo: string;
		estado_id: number | null;
		tipo_id: number | null;
		institucion_id: number | null;
		fecha_inicio_desde: string;
		fecha_inicio_hasta: string;
		para_siies: boolean | null;
	} = {
		codigo: '',
		titulo: '',
		estado_id: null,
		tipo_id: null,
		institucion_id: null,
		fecha_inicio_desde: '',
		fecha_inicio_hasta: '',
		para_siies: null
	};

	export let estados: Array<{ id: number; nombre: string }> = [];
	export let tipos: Array<{ id: number; nombre: string }> = [];
	export let instituciones: Array<{ id: number; nombre: string }> = [];

	const dispatch = createEventDispatcher();

	function applyFilters() {
		dispatch('filter', filters);
	}

	function clearFilters() {
		filters = {
			codigo: '',
			titulo: '',
			estado_id: null,
			tipo_id: null,
			institucion_id: null,
			fecha_inicio_desde: '',
			fecha_inicio_hasta: '',
			para_siies: null
		};
		dispatch('filter', filters);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			applyFilters();
		}
	}

	$: hasActiveFilters =
		filters.codigo !== '' ||
		filters.titulo !== '' ||
		filters.estado_id !== null ||
		filters.tipo_id !== null ||
		filters.institucion_id !== null ||
		filters.fecha_inicio_desde !== '' ||
		filters.fecha_inicio_hasta !== '' ||
		filters.para_siies !== null;
</script>

<div class="filters-container">
	<div class="filters-grid">
		<!-- Código -->
		<div class="filter-group">
			<label for="filter-codigo">
				<span class="icon">🔢</span>
				Código
			</label>
			<input
				id="filter-codigo"
				type="text"
				bind:value={filters.codigo}
				on:keydown={handleKeydown}
				placeholder="Ej: PRY-2024-001"
			/>
		</div>

		<!-- Título -->
		<div class="filter-group full-width">
			<label for="filter-titulo">
				<span class="icon">📝</span>
				Título
			</label>
			<input
				id="filter-titulo"
				type="text"
				bind:value={filters.titulo}
				on:keydown={handleKeydown}
				placeholder="Buscar por título del proyecto..."
			/>
		</div>

		<!-- Estado -->
		<div class="filter-group">
			<label for="filter-estado">
				<span class="icon">📊</span>
				Estado
			</label>
			<select id="filter-estado" bind:value={filters.estado_id}>
				<option value={null}>Todos los estados</option>
				{#each estados as estado}
					<option value={estado.id}>{estado.nombre}</option>
				{/each}
			</select>
		</div>

		<!-- Tipo -->
		<div class="filter-group">
			<label for="filter-tipo">
				<span class="icon">🏷️</span>
				Tipo
			</label>
			<select id="filter-tipo" bind:value={filters.tipo_id}>
				<option value={null}>Todos los tipos</option>
				{#each tipos as tipo}
					<option value={tipo.id}>{tipo.nombre}</option>
				{/each}
			</select>
		</div>

		<!-- Institución -->
		<div class="filter-group">
			<label for="filter-institucion">
				<span class="icon">🏛️</span>
				Institución
			</label>
			<select id="filter-institucion" bind:value={filters.institucion_id}>
				<option value={null}>Todas las instituciones</option>
				{#each instituciones as institucion}
					<option value={institucion.id}>{institucion.nombre}</option>
				{/each}
			</select>
		</div>

		<!-- Fecha Inicio Desde -->
		<div class="filter-group">
			<label for="filter-fecha-desde">
				<span class="icon">📅</span>
				Fecha Inicio Desde
			</label>
			<input id="filter-fecha-desde" type="date" bind:value={filters.fecha_inicio_desde} />
		</div>

		<!-- Fecha Inicio Hasta -->
		<div class="filter-group">
			<label for="filter-fecha-hasta">
				<span class="icon">📅</span>
				Fecha Inicio Hasta
			</label>
			<input id="filter-fecha-hasta" type="date" bind:value={filters.fecha_inicio_hasta} />
		</div>

		<!-- SIIES -->
		<div class="filter-group">
			<label for="filter-siies">
				<span class="icon">🎯</span>
				Para SIIES
			</label>
			<select id="filter-siies" bind:value={filters.para_siies}>
				<option value={null}>Todos</option>
				<option value={true}>Sí</option>
				<option value={false}>No</option>
			</select>
		</div>
	</div>

	<!-- Actions -->
	<div class="filter-actions">
		<button class="btn-secondary" on:click={clearFilters} disabled={!hasActiveFilters}>
			<span class="icon">🔄</span>
			Limpiar Filtros
		</button>
		<button class="btn-primary" on:click={applyFilters}>
			<span class="icon">🔍</span>
			Aplicar Filtros
		</button>
	</div>

	<!-- Active Filters Summary -->
	{#if hasActiveFilters}
		<div class="active-filters">
			<span class="label">Filtros activos:</span>
			<div class="filter-chips">
				{#if filters.codigo}
					<span class="chip">Código: {filters.codigo}</span>
				{/if}
				{#if filters.titulo}
					<span class="chip">Título: {filters.titulo}</span>
				{/if}
				{#if filters.estado_id}
					{@const estado = estados.find((e) => e.id === filters.estado_id)}
					<span class="chip">Estado: {estado?.nombre}</span>
				{/if}
				{#if filters.tipo_id}
					{@const tipo = tipos.find((t) => t.id === filters.tipo_id)}
					<span class="chip">Tipo: {tipo?.nombre}</span>
				{/if}
				{#if filters.institucion_id}
					{@const institucion = instituciones.find((i) => i.id === filters.institucion_id)}
					<span class="chip">Institución: {institucion?.nombre}</span>
				{/if}
				{#if filters.fecha_inicio_desde}
					<span class="chip">Desde: {filters.fecha_inicio_desde}</span>
				{/if}
				{#if filters.fecha_inicio_hasta}
					<span class="chip">Hasta: {filters.fecha_inicio_hasta}</span>
				{/if}
				{#if filters.para_siies !== null}
					<span class="chip">SIIES: {filters.para_siies ? 'Sí' : 'No'}</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.filters-container {
		background: transparent;
		border-radius: 0;
		padding: 0;
		box-shadow: none;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group.full-width {
		grid-column: 1 / -1;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color--text);
	}

	label .icon {
		font-size: 1.1rem;
	}

	input[type='text'],
	input[type='date'],
	select {
		padding: 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		border-radius: 8px;
		font-size: 0.95rem;
		transition: all 0.2s;
		background: var(--color--card-background);
		color: var(--color--text);
	}

	input[type='text']:focus,
	input[type='date']:focus,
	select:focus {
		outline: none;
		border-color: var(--color--primary, #6e29e7);
		box-shadow: 0 0 0 3px rgba(110, 41, 231, 0.1);
	}

	input::placeholder {
		color: rgba(var(--color--text-rgb), 0.5);
	}

	select {
		cursor: pointer;
	}

	.filter-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.btn-primary,
	.btn-secondary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: var(--color--primary, #6e29e7);
		color: white;
	}

	.btn-primary:hover {
		background: #5a1fc7;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
	}

	.btn-secondary {
		background: var(--color--card-background);
		color: rgba(var(--color--text-rgb), 0.7);
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(var(--color--text-rgb), 0.04);
		border-color: rgba(var(--color--text-rgb), 0.2);
	}

	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.active-filters {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.active-filters .label {
		font-weight: 600;
		font-size: 0.9rem;
		color: rgba(var(--color--text-rgb), 0.6);
		margin-bottom: 0.75rem;
		display: block;
	}

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.9rem;
		background: rgba(110, 41, 231, 0.1);
		color: var(--color--primary, #6e29e7);
		border-radius: 16px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.filters-container {
			padding: 1rem;
		}

		.filters-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.filter-group.full-width {
			grid-column: 1;
		}

		.filter-actions {
			flex-direction: column-reverse;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}

		.filter-chips {
			gap: 0.4rem;
		}

		.chip {
			font-size: 0.8rem;
			padding: 0.3rem 0.7rem;
		}
	}
</style>
