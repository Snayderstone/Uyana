<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ProyectoResponseDTO } from '$lib/models/admin';

	export let projects: ProyectoResponseDTO[] = [];
	export let currentPage: number = 1;
	export let itemsPerPage: number = 10;
	export let totalPages: number = 1;
	export let totalProjects: number = 0;

	const dispatch = createEventDispatcher();

	let selectedIds: number[] = [];
	let selectAll = false;

	function toggleSelectAll() {
		if (selectAll) {
			selectedIds = projects.map((p) => p.id);
		} else {
			selectedIds = [];
		}
		dispatch('selectionChange', selectedIds);
	}

	function toggleSelect(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((sid) => sid !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
		selectAll = selectedIds.length === projects.length;
		dispatch('selectionChange', selectedIds);
	}

	function handleView(id: number) {
		dispatch('view', id);
	}

	function handleEdit(id: number) {
		dispatch('edit', id);
	}

	function handleDelete(id: number) {
		dispatch('delete', id);
	}

	function changePage(page: number) {
		if (page >= 1 && page <= totalPages) {
			dispatch('pageChange', page);
		}
	}

	function changeItemsPerPage(items: number) {
		dispatch('itemsPerPageChange', items);
	}

	function getStatusColor(avance: number): string {
		if (avance === 0) return 'gray';
		if (avance < 30) return 'red';
		if (avance < 70) return 'yellow';
		if (avance < 100) return 'blue';
		return 'green';
	}

	function formatCurrency(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function formatBudgetShort(value: number): string {
		if (value >= 1000000) {
			return `$${(value / 1000000).toFixed(2)}M`;
		} else if (value >= 1000) {
			return `$${(value / 1000).toFixed(2)}K`;
		}
		return `$${value.toFixed(2)}`;
	}

	function formatBudgetFull(value: number): string {
		return `$${value.toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('es-EC', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	$: {
		selectAll = selectedIds.length === projects.length && projects.length > 0;
	}
</script>

<div class="table-container">
	<!-- Table Controls -->
	<div class="table-controls">
		<div class="control-group">
			<span class="showing-text">
				Mostrando {projects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -
				{Math.min(currentPage * itemsPerPage, totalProjects)} de {totalProjects} proyectos
			</span>
		</div>
		<div class="control-group">
			<label for="items-per-page">Mostrar:</label>
			<select
				id="items-per-page"
				value={itemsPerPage}
				on:change={(e) => changeItemsPerPage(Number(e.currentTarget.value))}
			>
				<option value="5">5</option>
				<option value="10">10</option>
				<option value="25">25</option>
				<option value="50">50</option>
			</select>
		</div>
	</div>

	<!-- Table -->
	<div class="table-wrapper">
		<table class="projects-table">
			<thead>
				<tr>
					<th class="checkbox-col">
						<input type="checkbox" bind:checked={selectAll} on:change={toggleSelectAll} />
					</th>
					<th>Código</th>
					<th>Título</th>
					<th>Estado</th>
					<th>Avance</th>
					<th>Presupuesto</th>
					<th>Fecha Inicio</th>
					<th>Participantes</th>
					<th class="actions-col">Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each projects as project (project.id)}
					<tr class="project-row">
						<td class="checkbox-col">
							<input
								type="checkbox"
								checked={selectedIds.includes(project.id)}
								on:change={() => toggleSelect(project.id)}
							/>
						</td>
						<td class="codigo-cell">
							<span class="codigo">{project.codigo}</span>
							{#if project.para_siies}
								<span class="badge siies">SIIES</span>
							{/if}
						</td>
						<td class="titulo-cell">
							<div class="titulo-content">
								<span class="titulo">{project.titulo}</span>
								<span class="tipos">{project.tipos.map((t) => t.nombre).join(', ')}</span>
							</div>
						</td>
						<td>
							<span class="badge estado-{project.estado.nombre.toLowerCase().replace(/\s+/g, '-')}">
								{project.estado.nombre}
							</span>
						</td>
						<td>
							<div class="progress-container">
								<div class="progress-bar">
									<div
										class="progress-fill {getStatusColor(project.porcentaje_avance)}"
										style="width: {project.porcentaje_avance}%"
									/>
								</div>
								<span class="progress-text">{project.porcentaje_avance}%</span>
							</div>
						</td>
						<td
							class="currency budget-cell"
							title={formatBudgetFull(project.monto_presupuesto_total)}
						>
							<span class="budget-short">{formatBudgetShort(project.monto_presupuesto_total)}</span>
						</td>
						<td class="date">
							{formatDate(project.fecha_inicio_planeada)}
						</td>
						<td class="center">
							<span class="badge count">{project.participantes.length}</span>
						</td>
						<td class="actions-col">
							<div class="actions">
								<button
									class="action-btn view"
									on:click={() => handleView(project.id)}
									title="Ver detalles"
								>
									👁️
								</button>
								<button
									class="action-btn edit"
									on:click={() => handleEdit(project.id)}
									title="Editar"
								>
									✏️
								</button>
								<button
									class="action-btn delete"
									on:click={() => handleDelete(project.id)}
									title="Eliminar"
								>
									🗑️
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="pagination">
			<button class="page-btn" disabled={currentPage === 1} on:click={() => changePage(1)}>
				⏮️ Primera
			</button>
			<button
				class="page-btn"
				disabled={currentPage === 1}
				on:click={() => changePage(currentPage - 1)}
			>
				◀️ Anterior
			</button>

			<div class="page-numbers">
				{#each Array(totalPages) as _, i}
					{#if i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 2 && i + 1 <= currentPage + 2)}
						<button
							class="page-number"
							class:active={currentPage === i + 1}
							on:click={() => changePage(i + 1)}
						>
							{i + 1}
						</button>
					{:else if i + 1 === currentPage - 3 || i + 1 === currentPage + 3}
						<span class="ellipsis">...</span>
					{/if}
				{/each}
			</div>

			<button
				class="page-btn"
				disabled={currentPage === totalPages}
				on:click={() => changePage(currentPage + 1)}
			>
				Siguiente ▶️
			</button>
			<button
				class="page-btn"
				disabled={currentPage === totalPages}
				on:click={() => changePage(totalPages)}
			>
				Última ⏭️
			</button>
		</div>
	{/if}
</div>

<style>
	.table-container {
		width: 100%;
	}

	.table-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.showing-text {
		color: rgba(var(--color--text-rgb), 0.6);
		font-size: 0.9rem;
	}

	select {
		padding: 0.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		background: var(--color--card-background);
		color: var(--color--text);
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.projects-table {
		width: 100%;
		border-collapse: collapse;
	}

	.projects-table thead {
		background: rgba(var(--color--text-rgb), 0.03);
	}

	.projects-table th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		color: rgba(var(--color--text-rgb), 0.6);
		white-space: nowrap;
	}

	.projects-table td {
		padding: 1rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.project-row {
		transition: background-color 0.2s;
	}

	.project-row:hover {
		background-color: rgba(var(--color--text-rgb), 0.02);
	}

	.checkbox-col {
		width: 40px;
		text-align: center;
	}

	.actions-col {
		width: 140px;
	}

	.codigo-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.codigo {
		font-family: monospace;
		font-weight: 600;
		color: #6e29e7;
	}

	.titulo-cell {
		max-width: 300px;
	}

	.titulo-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.titulo {
		font-weight: 600;
		color: var(--color--text);
	}

	.tipos {
		font-size: 0.8rem;
		color: rgba(var(--color--text-rgb), 0.6);
	}

	.budget-cell {
		font-weight: 600;
		color: #10b981;
		white-space: nowrap;
		cursor: help;
		position: relative;
	}

	.budget-short {
		font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
		font-size: 0.9375rem;
	}

	.budget-cell:hover {
		color: #059669;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.badge.siies {
		background: #4caf50;
		color: white;
	}

	.badge.count {
		background: #e3f2fd;
		color: #1976d2;
	}

	.badge[class*='estado-'] {
		background: #e0e0e0;
		color: #333;
	}

	.badge.estado-en-ejecución,
	.badge.estado-activo {
		background: #4caf50;
		color: white;
	}

	.badge.estado-completado {
		background: #2196f3;
		color: white;
	}

	.badge.estado-planificado,
	.badge.estado-pendiente {
		background: #ff9800;
		color: white;
	}

	.badge.estado-cancelado {
		background: #f44336;
		color: white;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 120px;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: rgba(var(--color--text-rgb), 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s;
	}

	.progress-fill.gray {
		background: #9e9e9e;
	}
	.progress-fill.red {
		background: #f44336;
	}
	.progress-fill.yellow {
		background: #ff9800;
	}
	.progress-fill.blue {
		background: #2196f3;
	}
	.progress-fill.green {
		background: #4caf50;
	}

	.progress-text {
		font-size: 0.85rem;
		font-weight: 600;
		min-width: 35px;
	}

	.currency {
		font-weight: 600;
		color: #10b981;
		white-space: nowrap;
	}

	.date {
		color: rgba(var(--color--text-rgb), 0.6);
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.center {
		text-align: center;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.action-btn {
		padding: 0.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: 1.2rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: rgba(var(--color--text-rgb), 0.05);
		transform: scale(1.1);
	}

	.action-btn.delete:hover {
		background: rgba(244, 67, 54, 0.1);
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		flex-wrap: wrap;
	}

	.page-btn,
	.page-number {
		padding: 0.5rem 1rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.12);
		background: var(--color--card-background);
		color: var(--color--text);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.page-btn:hover:not(:disabled),
	.page-number:hover {
		background: rgba(var(--color--text-rgb), 0.04);
		border-color: var(--color--primary, #6e29e7);
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-number.active {
		background: var(--color--primary, #6e29e7);
		color: white;
		border-color: var(--color--primary, #6e29e7);
	}

	.page-numbers {
		display: flex;
		gap: 0.25rem;
	}

	.ellipsis {
		padding: 0.5rem;
		color: rgba(var(--color--text-rgb), 0.5);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.titulo-cell {
			max-width: 200px;
		}
	}

	@media (max-width: 768px) {
		.table-controls {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.control-group {
			justify-content: space-between;
		}

		.projects-table th,
		.projects-table td {
			padding: 0.75rem 0.5rem;
			font-size: 0.85rem;
		}

		.titulo-cell {
			max-width: 150px;
		}

		.tipos {
			display: none;
		}

		.pagination {
			gap: 0.25rem;
		}

		.page-btn,
		.page-number {
			padding: 0.4rem 0.7rem;
			font-size: 0.85rem;
		}
	}
</style>
