<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CatalogoItemDTO } from '$lib/models/admin';

	export let items: CatalogoItemDTO[] = [];
	export let loading = false;
	export let catalogLabel = 'Catálogo';
	export let showActions = true;

	const dispatch = createEventDispatcher<{
		edit: CatalogoItemDTO;
		delete: CatalogoItemDTO;
	}>();

	let searchTerm = '';
	let sortBy: 'nombre' | 'id' = 'nombre';
	let sortOrder: 'asc' | 'desc' = 'asc';

	$: filteredItems = items
		.filter((item) => {
			const search = searchTerm.toLowerCase();
			return (
				item.nombre.toLowerCase().includes(search) ||
				item.descripcion?.toLowerCase().includes(search)
			);
		})
		.sort((a, b) => {
			const aValue = sortBy === 'nombre' ? a.nombre : a.id;
			const bValue = sortBy === 'nombre' ? b.nombre : b.id;

			const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			return sortOrder === 'asc' ? comparison : -comparison;
		});

	function handleEdit(item: CatalogoItemDTO) {
		dispatch('edit', item);
	}

	function handleDelete(item: CatalogoItemDTO) {
		dispatch('delete', item);
	}

	function toggleSort(field: 'nombre' | 'id') {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}
</script>

<div class="catalog-table">
	<!-- Barra de búsqueda -->
	<div class="search-bar">
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="🔍 Buscar por nombre o descripción..."
			class="search-input"
			aria-label="Buscar en {catalogLabel}"
		/>
		<span class="results-count">
			{filteredItems.length} de {items.length} elementos
		</span>
	</div>

	<!-- Tabla -->
	<div class="table-container">
		{#if loading}
			<div class="loading-state">
				<div class="spinner" />
				<p>Cargando {catalogLabel}...</p>
			</div>
		{:else if filteredItems.length === 0}
			<div class="empty-state">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="empty-icon"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<p class="empty-title">
					{searchTerm ? 'No se encontraron resultados' : 'No hay elementos aún'}
				</p>
				<p class="empty-description">
					{searchTerm
						? `Intenta buscar con otros términos`
						: `Haz clic en "Agregar nuevo elemento" para comenzar`}
				</p>
			</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th class="sortable" on:click={() => toggleSort('id')}>
							ID
							{#if sortBy === 'id'}
								<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</th>
						<th class="sortable" on:click={() => toggleSort('nombre')}>
							Nombre
							{#if sortBy === 'nombre'}
								<span class="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</th>
						<th>Descripción</th>
						{#if showActions}
							<th class="actions-column">Acciones</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each filteredItems as item (item.id)}
						<tr>
							<td class="id-column">{item.id}</td>
							<td class="nombre-column">{item.nombre}</td>
							<td class="descripcion-column">
								{item.descripcion || '-'}
							</td>
							{#if showActions}
								<td class="actions-column">
									<button
										class="btn-edit"
										on:click={() => handleEdit(item)}
										title="Editar este elemento"
										aria-label="Editar {item.nombre}"
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
											<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
										</svg>
									</button>
									<button
										class="btn-delete"
										on:click={() => handleDelete(item)}
										title="Eliminar este elemento"
										aria-label="Eliminar {item.nombre}"
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
											<polyline points="3 6 5 6 21 6" />
											<path
												d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
											/>
											<line x1="10" y1="11" x2="10" y2="17" />
											<line x1="14" y1="11" x2="14" y2="17" />
										</svg>
									</button>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style lang="scss">
	.catalog-table {
		display: flex;
		flex-direction: column;
		gap: 0;
		height: 100%;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--color--card-background);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.search-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		border-radius: 6px;
		font-size: 0.8125rem;
		font-family: var(--font--default);
		background: var(--color--page-background);
		color: var(--color--text);
		transition: all 0.15s ease;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.1);
		}
	}

	.results-count {
		color: var(--color--text-shade);
		font-size: 0.8125rem;
		font-family: var(--font--default);
		white-space: nowrap;
	}

	.table-container {
		flex: 1;
		overflow: auto;
		background: var(--color--card-background);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		position: sticky;
		top: 0;
		background: var(--color--card-background);
		z-index: 10;
		box-shadow: 0 1px 0 rgba(var(--color--text-rgb), 0.08);
	}

	th {
		padding: 0.75rem 1.5rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.75rem;
		color: var(--color--text-shade);
		font-family: var(--font--default);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		&.sortable {
			cursor: pointer;
			user-select: none;
			transition: color 0.15s ease;

			&:hover {
				color: var(--color--text);
			}
		}
	}

	.sort-indicator {
		margin-left: 0.375rem;
		color: var(--color--primary);
		font-size: 0.625rem;
	}

	td {
		padding: 0.875rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.06);
		font-size: 0.8125rem;
		font-family: var(--font--default);
	}

	tbody tr {
		transition: background-color 0.1s ease;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.02);
		}

		&:last-child td {
			border-bottom: none;
		}
	}

	.id-column {
		width: 80px;
		color: var(--color--text-shade);
		font-size: 0.75rem;
		font-family: var(--font--mono);
	}

	.nombre-column {
		font-weight: 500;
		color: var(--color--text);
	}

	.descripcion-column {
		color: var(--color--text-shade);
		max-width: 400px;
		line-height: 1.5;
	}

	.actions-column {
		width: 120px;
		text-align: center;
	}

	.btn-edit,
	.btn-delete {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		transition: all 0.15s ease;
		border-radius: 4px;
		margin: 0 0.25rem;

		&:hover {
			transform: translateY(-1px);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.btn-edit {
		color: #0ea5e9;

		&:hover {
			background: rgba(14, 165, 233, 0.1);
			border-color: rgba(14, 165, 233, 0.2);
		}
	}

	.btn-delete {
		color: #ef4444;

		&:hover {
			background: rgba(239, 68, 68, 0.1);
			border-color: rgba(239, 68, 68, 0.2);
		}
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		padding: 2rem;
		text-align: center;
	}

	.empty-icon {
		color: var(--color--text-shade);
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.empty-title {
		margin: 0 0 0.5rem 0;
		color: var(--color--text);
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--font--default);
	}

	.empty-description {
		margin: 0;
		color: var(--color--text-shade);
		font-size: 0.875rem;
		font-family: var(--font--default);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.search-bar {
			padding: 1rem;
			flex-direction: column;
			align-items: stretch;
		}

		.results-count {
			text-align: right;
		}

		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 600px;
		}

		th,
		td {
			padding: 0.75rem 1rem;
		}
	}
</style>
