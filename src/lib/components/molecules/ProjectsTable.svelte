<!-- src/lib/components/molecules/ProjectsTable.svelte -->
<script lang="ts">
	import type { Proyecto } from '$lib/services/proyectosService';

	export let projects: Proyecto[] = [];
	export let itemsPerPage = 5;

	let currentPage = 1;
	let searchQuery = '';
	let sortField = 'titulo';
	let sortDirection: 'asc' | 'desc' = 'asc';

	// Filtrado y paginación
	$: filteredProjects = projects.filter((project) => {
		// Si no hay búsqueda, mostrar todos
		if (!searchQuery) return true;

		// Buscar en varios campos
		const query = searchQuery.toLowerCase();
		return (
			project.titulo?.toLowerCase().includes(query) ||
			false ||
			project.codigo?.toLowerCase().includes(query) ||
			false ||
			project.facultad_o_entidad_o_area_responsable?.toLowerCase().includes(query) ||
			false ||
			project.coordinador_director?.toLowerCase().includes(query) ||
			false ||
			project.estado?.toLowerCase().includes(query) ||
			false
		);
	});

	// Ordenamiento
	$: sortedProjects = [...filteredProjects].sort((a, b) => {
		const valueA = a[sortField as keyof Proyecto] || '';
		const valueB = b[sortField as keyof Proyecto] || '';

		if (typeof valueA === 'number' && typeof valueB === 'number') {
			return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
		} else {
			const strA = String(valueA).toLowerCase();
			const strB = String(valueB).toLowerCase();
			return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
		}
	});

	// Paginación
	$: totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
	$: paginatedProjects = sortedProjects.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	function changePage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	function toggleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

	// Mostrar truncado
	function truncateText(text: string | null, maxLength = 50) {
		if (!text) return '';
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	// Opciones de columnas
	const columns = [
		{ field: 'codigo', label: 'Código', width: '12%' },
		{ field: 'titulo', label: 'Título', width: '30%' },
		{ field: 'facultad_o_entidad_o_area_responsable', label: 'Facultad', width: '20%' },
		{ field: 'coordinador_director', label: 'Coordinador', width: '18%' },
		{ field: 'estado', label: 'Estado', width: '10%' },
		{ field: 'fecha_inicio', label: 'Inicio', width: '10%' }
	];
</script>

<div class="projects-table-container">
	<div class="table-actions">
		<div class="search-box">
			<input
				type="text"
				placeholder="Buscar proyectos..."
				bind:value={searchQuery}
				class="search-input"
			/>
			<svg class="search-icon" viewBox="0 0 24 24" width="18" height="18">
				<path
					fill="currentColor"
					d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
				/>
			</svg>
		</div>
		<div class="table-info">
			<span>Mostrando {paginatedProjects.length} de {filteredProjects.length} proyectos</span>
		</div>
	</div>

	<div class="table-wrapper">
		<table class="projects-table">
			<thead>
				<tr>
					{#each columns as column}
						<th style="width: {column.width}" on:click={() => toggleSort(column.field)}>
							{column.label}
							{#if sortField === column.field}
								<span class="sort-icon">
									{sortDirection === 'asc' ? '↑' : '↓'}
								</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if paginatedProjects.length === 0}
					<tr>
						<td colspan={columns.length} class="no-results">
							{filteredProjects.length === 0
								? 'No se encontraron proyectos'
								: 'Cargando proyectos...'}
						</td>
					</tr>
				{:else}
					{#each paginatedProjects as project}
						<tr>
							<td title={project.codigo}>{project.codigo || 'N/A'}</td>
							<td title={project.titulo}>{truncateText(project.titulo, 60)}</td>
							<td title={project.facultad_o_entidad_o_area_responsable}>
								{truncateText(project.facultad_o_entidad_o_area_responsable, 30)}
							</td>
							<td title={project.coordinador_director}>
								{truncateText(project.coordinador_director, 25)}
							</td>
							<td>
								<span
									class="status-badge"
									class:active={project.estado === 'En ejecución'}
									class:closing={project.estado === 'En cierre'}
									class:closed={project.estado === 'Cerrado' || project.estado === 'Finalizado'}
									class:unknown={!project.estado}
								>
									{project.estado || 'Desconocido'}
								</span>
							</td>
							<td>{project.fecha_inicio || 'N/A'}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="pagination">
			<button class="pagination-btn" disabled={currentPage === 1} on:click={() => changePage(1)}>
				&laquo;
			</button>
			<button
				class="pagination-btn"
				disabled={currentPage === 1}
				on:click={() => changePage(currentPage - 1)}
			>
				&lsaquo;
			</button>

			{#each Array(totalPages) as _, i}
				{#if i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
					<button
						class="pagination-btn"
						class:active={currentPage === i + 1}
						on:click={() => changePage(i + 1)}
					>
						{i + 1}
					</button>
				{:else if (i + 1 === 2 && currentPage > 3) || (i + 1 === totalPages - 1 && currentPage < totalPages - 2)}
					<span class="pagination-ellipsis">...</span>
				{/if}
			{/each}

			<button
				class="pagination-btn"
				disabled={currentPage === totalPages}
				on:click={() => changePage(currentPage + 1)}
			>
				&rsaquo;
			</button>
			<button
				class="pagination-btn"
				disabled={currentPage === totalPages}
				on:click={() => changePage(totalPages)}
			>
				&raquo;
			</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.projects-table-container {
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
		padding: 1.25rem;
		color: var(--color--text);
		width: 100%;
		overflow: hidden;
	}

	.table-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;

		@include for-phone-only {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.search-box {
		position: relative;
		width: 300px;
		max-width: 100%;

		@include for-phone-only {
			width: 100%;
		}
	}

	.search-input {
		width: 100%;
		padding: 0.6rem 1rem 0.6rem 2.5rem;
		border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
		border-radius: 8px;
		font-size: 0.9rem;
		background-color: color-mix(in srgb, var(--color--card-background) 80%, transparent);
		color: var(--color--text);

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--color--primary) 25%, transparent);
		}
	}

	.search-icon {
		position: absolute;
		left: 0.8rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color--text-shade);
	}

	.table-info {
		font-size: 0.85rem;
		color: var(--color--text-shade);
	}

	.table-wrapper {
		width: 100%;
		overflow-x: auto;
	}

	.projects-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;

		th,
		td {
			padding: 0.75rem 1rem;
			text-align: left;
			border-bottom: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		}

		th {
			font-weight: 600;
			background-color: color-mix(in srgb, var(--color--primary) 5%, transparent);
			cursor: pointer;
			position: relative;
			user-select: none;

			&:hover {
				background-color: color-mix(in srgb, var(--color--primary) 10%, transparent);
			}
		}

		tbody tr {
			transition: background-color 0.2s;

			&:hover {
				background-color: color-mix(in srgb, var(--color--primary) 5%, transparent);
			}

			&:last-child td {
				border-bottom: none;
			}
		}
	}

	.sort-icon {
		margin-left: 0.5rem;
		font-size: 0.8rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 500;
		text-align: center;
		background-color: #e0e0e0;
		color: #505050;

		&.active {
			background-color: #d1f8ea;
			color: #00714e;
		}

		&.closing {
			background-color: #fff2d9;
			color: #946500;
		}

		&.closed {
			background-color: #f2f2f2;
			color: #707070;
		}

		&.unknown {
			background-color: #e9e9e9;
			color: #888888;
		}
	}

	.no-results {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--color--text-shade);
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 1.5rem;
		gap: 0.3rem;

		&-btn {
			padding: 0.4rem 0.7rem;
			border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
			border-radius: 6px;
			background-color: transparent;
			cursor: pointer;
			font-size: 0.9rem;
			color: var(--color--text);
			transition: all 0.2s;

			&:hover:not(:disabled) {
				background-color: color-mix(in srgb, var(--color--primary) 10%, transparent);
				border-color: var(--color--primary);
			}

			&.active {
				background-color: var(--color--primary);
				color: white;
				border-color: var(--color--primary);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}

		&-ellipsis {
			padding: 0.4rem 0.4rem;
			color: var(--color--text-shade);
		}
	}
</style>
