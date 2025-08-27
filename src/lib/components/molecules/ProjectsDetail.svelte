<!-- src/lib/components/molecules/ProjectsDetail.svelte -->
<script lang="ts">
	import type { Proyecto } from '$lib/services/proyectosService';
	import { fly } from 'svelte/transition';

	export let proyectos: Proyecto[] = [];
	export let isVisible: boolean = false;
	export let selectedFacultad: string | null = null;

	// Paginación
	let itemsPerPage = 5;
	let currentPage = 1;

	// Proyectos filtrados por facultad seleccionada (si existe)
	$: filteredProjects = selectedFacultad
		? proyectos.filter((p) => p.facultad_o_entidad_o_area_responsable === selectedFacultad)
		: proyectos;

	// Proyectos paginados
	$: paginatedProjects = filteredProjects.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Total de páginas
	$: totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

	// Navegar a la página siguiente
	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	// Navegar a la página anterior
	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	// Reformatear el texto de fuente de financiamiento
	function formatFinanciamiento(fuente: string) {
		switch (fuente) {
			case 'FONDOS_CONCURSABLES_INTERNO_IES':
				return 'Fondos Concursables';
			case 'ASIGNACION_REGULAR_IES':
				return 'Asignación Regular';
			default:
				return fuente || 'No especificado';
		}
	}

	// Convertir formato de fecha DD/MM/YYYY a objeto Date
	function parseDate(dateStr: string) {
		if (!dateStr) return null;

		const parts = dateStr.split('/');
		if (parts.length !== 3) return null;

		return new Date(
			parseInt(parts[2]), // año
			parseInt(parts[1]) - 1, // mes (0-indexed)
			parseInt(parts[0]) // día
		);
	}

	// Calcular duración del proyecto en meses
	function calcularDuracionProyecto(inicio: string, fin: string) {
		const fechaInicio = parseDate(inicio);
		const fechaFin = parseDate(fin);

		if (!fechaInicio || !fechaFin) return 'No disponible';

		const diffMonths =
			(fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 +
			(fechaFin.getMonth() - fechaInicio.getMonth());

		return `${diffMonths} meses`;
	}

	// Calcular el color de badge según el estado
	function getEstadoColor(estado: string): string {
		switch (estado) {
			case 'En ejecución':
				return 'success';
			case 'En cierre':
				return 'warning';
			case 'Cerrado':
			case 'Finalizado':
				return 'muted';
			default:
				return 'primary';
		}
	}
</script>

{#if isVisible && filteredProjects.length > 0}
	<div class="projects-detail" in:fly={{ y: 20, duration: 300 }}>
		<div class="projects-header">
			<h2>
				{#if selectedFacultad}
					Proyectos de {selectedFacultad}
				{:else}
					Proyectos encontrados
				{/if}
				<span class="count-badge">{filteredProjects.length}</span>
			</h2>
		</div>

		<div class="projects-list">
			{#each paginatedProjects as proyecto (proyecto.id)}
				<div class="project-card" in:fly={{ y: 10, duration: 200, delay: 100 }}>
					<div class="project-header">
						<div class="project-title">{proyecto.titulo}</div>
						<div class="project-code">{proyecto.codigo || 'Sin código'}</div>
					</div>

					<div class="project-content">
						<div class="project-details">
							<div class="detail-row">
								<span class="detail-label">Facultad:</span>
								<span class="detail-value"
									>{proyecto.facultad_o_entidad_o_area_responsable || 'No especificada'}</span
								>
							</div>

							<div class="detail-row">
								<span class="detail-label">Tipo:</span>
								<span class="detail-value">{proyecto.tipo_proyecto || 'No especificado'}</span>
							</div>

							<div class="detail-row">
								<span class="detail-label">Coordinador:</span>
								<span class="detail-value"
									>{proyecto.coordinador_director || 'No especificado'}</span
								>
							</div>

							<div class="detail-row">
								<span class="detail-label">Campo amplio:</span>
								<span class="detail-value">{proyecto.campo_amplio || 'No especificado'}</span>
							</div>

							<div class="detail-row">
								<span class="detail-label">Duración:</span>
								<span class="detail-value">
									{calcularDuracionProyecto(proyecto.fecha_inicio, proyecto.fecha_fin_planeado)}
								</span>
							</div>

							<div class="detail-row">
								<span class="detail-label">Financiamiento:</span>
								<span class="detail-value">
									{formatFinanciamiento(proyecto.fuente_financiamiento)}
								</span>
							</div>
						</div>

						<div class="project-info">
							<div class="project-status">
								<div class="badge badge-{getEstadoColor(proyecto.estado || '')}">
									{proyecto.estado || 'No especificado'}
								</div>
							</div>

							<div class="project-dates">
								<div class="date-item">
									<span class="date-label">Inicio:</span>
									<span class="date-value">{proyecto.fecha_inicio || 'No especificado'}</span>
								</div>
								<div class="date-item">
									<span class="date-label">Fin planeado:</span>
									<span class="date-value">{proyecto.fecha_fin_planeado || 'No especificado'}</span>
								</div>
							</div>
						</div>
					</div>

					{#if proyecto.objetivo}
						<div class="project-objective">
							<div class="objective-label">Objetivo:</div>
							<div class="objective-text">{proyecto.objetivo}</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="pagination">
				<button class="pagination-btn" disabled={currentPage === 1} on:click={prevPage}>
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
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Anterior
				</button>

				<div class="pagination-info">
					Página {currentPage} de {totalPages}
				</div>

				<button class="pagination-btn" disabled={currentPage === totalPages} on:click={nextPage}>
					Siguiente
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
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			</div>
		{/if}
	</div>
{:else if isVisible}
	<div class="projects-detail no-results" in:fly={{ y: 20, duration: 300 }}>
		<div class="no-results-message">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<path d="M16 16s-1.5-2-4-2-4 2-4 2" />
				<line x1="9" y1="9" x2="9.01" y2="9" />
				<line x1="15" y1="9" x2="15.01" y2="9" />
			</svg>
			<h3>No se encontraron proyectos</h3>
			<p>Intente con diferentes criterios de búsqueda o filtros.</p>
		</div>
	</div>
{/if}

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.projects-detail {
		width: 100%;
		background: var(--color--card-background);
		border-radius: 12px;
		padding: 20px;
		box-shadow: var(--card-shadow);
		color: var(--color--text);
		margin-top: 20px;

		&.no-results {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 300px;
		}
	}

	.projects-header {
		margin-bottom: 20px;

		h2 {
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--color--text);
			margin: 0;
			display: flex;
			align-items: center;
			gap: 10px;

			@include for-phone-only {
				font-size: 1.3rem;
			}
		}
	}

	.count-badge {
		background: var(--color--primary);
		color: white;
		font-size: 0.9rem;
		padding: 3px 10px;
		border-radius: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.projects-list {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.project-card {
		border: 1px solid color-mix(in srgb, var(--color--text) 15%, transparent);
		border-radius: 10px;
		padding: 15px;
		background: color-mix(in srgb, var(--color--card-background) 70%, transparent);
		transition: all 0.2s ease;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
			border-color: color-mix(in srgb, var(--color--primary) 30%, transparent);
		}
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 15px;
		gap: 15px;

		@include for-phone-only {
			flex-direction: column;
		}
	}

	.project-title {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--color--primary);
		flex: 1;

		@include for-phone-only {
			font-size: 1rem;
		}
	}

	.project-code {
		font-size: 0.85rem;
		padding: 3px 10px;
		background: color-mix(in srgb, var(--color--secondary) 20%, transparent);
		color: var(--color--secondary);
		border-radius: 20px;
		font-weight: 600;
		white-space: nowrap;
	}

	.project-content {
		display: flex;
		gap: 20px;
		margin-bottom: 15px;

		@include for-phone-only {
			flex-direction: column;
		}
	}

	.project-details {
		flex: 2;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px 20px;

		@include for-phone-only {
			grid-template-columns: 1fr;
		}
	}

	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.detail-label {
		font-size: 0.75rem;
		color: var(--color--text-shade);
	}

	.detail-value {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.project-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.project-status {
		display: flex;
		justify-content: flex-end;

		@include for-phone-only {
			justify-content: flex-start;
		}
	}

	.badge {
		padding: 5px 12px;
		border-radius: 20px;
		font-weight: 600;
		font-size: 0.8rem;
		display: inline-block;
		text-align: center;

		&.badge-success {
			background: color-mix(in srgb, var(--color--callout-accent--success) 20%, transparent);
			color: var(--color--callout-accent--success);
		}

		&.badge-warning {
			background: color-mix(in srgb, var(--color--callout-accent--warning) 20%, transparent);
			color: var(--color--callout-accent--warning);
		}

		&.badge-error {
			background: color-mix(in srgb, var(--color--callout-accent--error) 20%, transparent);
			color: var(--color--callout-accent--error);
		}

		&.badge-primary {
			background: color-mix(in srgb, var(--color--primary) 20%, transparent);
			color: var(--color--primary);
		}

		&.badge-muted {
			background: color-mix(in srgb, var(--color--text) 15%, transparent);
			color: var(--color--text-shade);
		}
	}

	.project-dates {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.date-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.date-label {
		font-size: 0.75rem;
		color: var(--color--text-shade);
	}

	.date-value {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.project-objective {
		border-top: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		padding-top: 12px;
		margin-top: 5px;
	}

	.objective-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color--text-shade);
		margin-bottom: 5px;
	}

	.objective-text {
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.pagination {
		margin-top: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 15px;
		border-top: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
	}

	.pagination-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: color-mix(in srgb, var(--color--primary) 15%, transparent);
		color: var(--color--primary);
		border: none;
		border-radius: 6px;
		padding: 8px 12px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background: color-mix(in srgb, var(--color--primary) 25%, transparent);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.pagination-info {
		font-size: 0.9rem;
		color: var(--color--text-shade);
	}

	.no-results-message {
		text-align: center;

		svg {
			color: var(--color--text-shade);
			opacity: 0.7;
			margin-bottom: 15px;
		}

		h3 {
			margin: 0 0 10px 0;
			font-weight: 600;
			color: var(--color--text);
		}

		p {
			margin: 0;
			color: var(--color--text-shade);
		}
	}
</style>
