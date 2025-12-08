<!-- src/lib/components/molecules/ProjectsTable.svelte -->
<script lang="ts">
	import type { Proyecto } from '$lib/services/proyectosService';

	export let projects: Proyecto[] = [];
	export let itemsPerPage = 5;

	let currentPage = 1;
	let searchQuery = '';
	let sortField = 'titulo';
	let sortDirection: 'asc' | 'desc' = 'asc';
	let selectedProject: Proyecto | null = null;
	let showDetailModal = false;

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

	// Funciones para el modal de detalle
	function openProjectDetail(project: Proyecto) {
		selectedProject = project;
		showDetailModal = true;
	}

	function closeProjectDetail() {
		selectedProject = null;
		showDetailModal = false;
	}

	// Cerrar modal con tecla Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showDetailModal) {
			closeProjectDetail();
		}
	}

	// Opciones de columnas
	const columns = [
		{ field: 'codigo', label: 'Código', width: '10%' },
		{ field: 'titulo', label: 'Título', width: '28%' },
		{ field: 'facultad_o_entidad_o_area_responsable', label: 'Facultad', width: '18%' },
		{ field: 'coordinador_director', label: 'Coordinador', width: '16%' },
		{ field: 'estado', label: 'Estado', width: '10%' },
		{ field: 'fecha_inicio', label: 'Inicio', width: '8%' },
		{ field: 'actions', label: 'Acciones', width: '10%' }
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
						<th
							style="width: {column.width}"
							on:click={() => column.field !== 'actions' && toggleSort(column.field)}
							class:sortable={column.field !== 'actions'}
						>
							{column.label}
							{#if sortField === column.field && column.field !== 'actions'}
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
							<td>
								<button
									class="detail-btn"
									on:click={() => openProjectDetail(project)}
									title="Ver detalles completos del proyecto"
								>
									<svg viewBox="0 0 24 24" width="16" height="16">
										<path
											fill="currentColor"
											d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
										/>
									</svg>
									<span class="detail-btn-text">Ver</span>
								</button>
							</td>
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

<!-- Modal de detalle del proyecto -->
{#if showDetailModal && selectedProject}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={closeProjectDetail} on:keydown={handleKeydown}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2 class="modal-title">Detalle del Proyecto</h2>
				<button class="modal-close-btn" on:click={closeProjectDetail} title="Cerrar">
					<svg viewBox="0 0 24 24" width="24" height="24">
						<path
							fill="currentColor"
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
						/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="project-detail-grid">
					<div class="detail-item">
						<label class="detail-label">Código:</label>
						<span class="detail-value">{selectedProject.codigo || 'No especificado'}</span>
					</div>

					<div class="detail-item full-width">
						<label class="detail-label">Título:</label>
						<span class="detail-value">{selectedProject.titulo || 'No especificado'}</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Tipo de Proyecto:</label>
						<span class="detail-value">{selectedProject.tipo_proyecto || 'No especificado'}</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Estado:</label>
						<span
							class="status-badge"
							class:active={selectedProject.estado === 'En ejecución'}
							class:closing={selectedProject.estado === 'En cierre'}
							class:closed={selectedProject.estado === 'Cerrado' ||
								selectedProject.estado === 'Finalizado'}
							class:unknown={!selectedProject.estado}
						>
							{selectedProject.estado || 'Desconocido'}
						</span>
					</div>

					<div class="detail-item full-width">
						<label class="detail-label">Objetivo:</label>
						<span class="detail-value">{selectedProject.objetivo || 'No especificado'}</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Facultad/Entidad:</label>
						<span class="detail-value"
							>{selectedProject.facultad_o_entidad_o_area_responsable || 'No especificado'}</span
						>
					</div>

					<div class="detail-item">
						<label class="detail-label">Coordinador/Director:</label>
						<span class="detail-value"
							>{selectedProject.coordinador_director || 'No especificado'}</span
						>
					</div>

					<div class="detail-item">
						<label class="detail-label">Correo Electrónico:</label>
						<span class="detail-value">
							{#if selectedProject.correo_electronico_coordinador}
								<a
									href="mailto:{selectedProject.correo_electronico_coordinador}"
									class="email-link"
								>
									{selectedProject.correo_electronico_coordinador}
								</a>
							{:else}
								No especificado
							{/if}
						</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Fecha de Inicio:</label>
						<span class="detail-value">{selectedProject.fecha_inicio || 'No especificado'}</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Fecha de Fin Planeada:</label>
						<span class="detail-value"
							>{selectedProject.fecha_fin_planeado || 'No especificado'}</span
						>
					</div>

					<div class="detail-item">
						<label class="detail-label">Campo Amplio:</label>
						<span class="detail-value">{selectedProject.campo_amplio || 'No especificado'}</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Campo Específico:</label>
						<span class="detail-value">{selectedProject.campo_especifico || 'No especificado'}</span
						>
					</div>

					<div class="detail-item">
						<label class="detail-label">Campo Detallado:</label>
						<span class="detail-value">{selectedProject.campo_detallado || 'No especificado'}</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Alcance Territorial:</label>
						<span class="detail-value"
							>{selectedProject.alcance_territorial || 'No especificado'}</span
						>
					</div>

					<div class="detail-item">
						<label class="detail-label">Investigadores Acreditados SENESCYT:</label>
						<span class="detail-value">
							<span
								class="acredited-badge"
								class:yes={selectedProject.investigadores_acreditados_senescyt === 'SI'}
								class:no={selectedProject.investigadores_acreditados_senescyt === 'NO'}
							>
								{selectedProject.investigadores_acreditados_senescyt || 'No especificado'}
							</span>
						</span>
					</div>

					<div class="detail-item">
						<label class="detail-label">Fuente de Financiamiento:</label>
						<span class="detail-value"
							>{selectedProject.fuente_financiamiento || 'No especificado'}</span
						>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" on:click={closeProjectDetail}> Cerrar </button>
			</div>
		</div>
	</div>
{/if}

<!-- Event listener para cerrar con Escape -->
<svelte:window on:keydown={handleKeydown} />

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';
	@import '$lib/scss/mixins.scss';

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
			position: relative;
			user-select: none;

			&.sortable {
				cursor: pointer;

				&:hover {
					background-color: color-mix(in srgb, var(--color--primary) 10%, transparent);
				}
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

	.detail-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid color-mix(in srgb, var(--color--primary) 40%, transparent);
		border-radius: 6px;
		background-color: color-mix(in srgb, var(--color--primary) 8%, transparent);
		color: var(--color--primary);
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 500;
		transition: all 0.2s ease;

		&:hover {
			background-color: var(--color--primary);
			color: white;
			transform: translateY(-1px);
			box-shadow: 0 2px 8px color-mix(in srgb, var(--color--primary) 25%, transparent);
		}

		&:active {
			transform: translateY(0);
		}

		svg {
			transition: transform 0.2s ease;
		}

		&:hover svg {
			transform: scale(1.1);
		}

		.detail-btn-text {
			@include for-phone-only {
				display: none;
			}
		}
	}

	.acredited-badge {
		display: inline-block;
		padding: 0.2rem 0.4rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;

		&.yes {
			background-color: #d1f8ea;
			color: #00714e;
		}

		&.no {
			background-color: #ffebee;
			color: #c62828;
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

	// Modal styles
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-content {
		background: var(--color--card-background);
		border-radius: 16px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04),
			0 0 0 1px color-mix(in srgb, var(--color--text) 10%, transparent);
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s ease-out;

		@include for-phone-only {
			max-width: 95vw;
			margin: 0.5rem;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 2rem 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);

		@include for-phone-only {
			padding: 1rem 1.5rem 0.75rem;
		}
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;

		@include for-phone-only {
			font-size: 1.25rem;
		}
	}

	.modal-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 50%;
		background-color: color-mix(in srgb, var(--color--text) 8%, transparent);
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background-color: color-mix(in srgb, var(--color--text) 15%, transparent);
			color: var(--color--text);
			transform: scale(1.05);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem 2rem;

		@include for-phone-only {
			padding: 1rem 1.5rem;
		}
	}

	.project-detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;

		@include for-phone-only {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	.detail-item {
		&.full-width {
			grid-column: 1 / -1;
		}
	}

	.detail-label {
		display: block;
		font-weight: 600;
		color: var(--color--text);
		margin-bottom: 0.4rem;
		font-size: 0.9rem;
	}

	.detail-value {
		display: block;
		color: var(--color--text-shade);
		line-height: 1.5;
		word-wrap: break-word;
	}

	.email-link {
		color: var(--color--primary);
		text-decoration: none;
		transition: color 0.2s ease;

		&:hover {
			color: color-mix(in srgb, var(--color--primary) 80%, black);
			text-decoration: underline;
		}
	}

	.modal-footer {
		padding: 1rem 2rem 1.5rem;
		border-top: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		display: flex;
		justify-content: flex-end;

		@include for-phone-only {
			padding: 1rem 1.5rem;
		}
	}

	.btn-secondary {
		padding: 0.6rem 1.5rem;
		border: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
		border-radius: 8px;
		background-color: transparent;
		color: var(--color--text);
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;

		&:hover {
			background-color: color-mix(in srgb, var(--color--text) 8%, transparent);
			border-color: var(--color--text);
		}

		&:active {
			transform: translateY(1px);
		}
	}

	// Animations
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(2rem) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
