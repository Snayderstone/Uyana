<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { ProyectoResponseDTO } from '$lib/models/admin';

	let loading = true;
	let project: ProyectoResponseDTO | null = null;
	let error: string | null = null;

	const projectId = $page.params.id;

	const icons = {
		back: '←',
		edit: '✏️',
		delete: '🗑️',
		calendar: '📅',
		money: '💰',
		users: '👥',
		building: '🏛️',
		check: '✓',
		document: '📄',
		chart: '📊',
		tag: '🏷️',
		book: '📚',
		science: '🔬'
	};

	onMount(async () => {
		await loadProject();
	});

	async function loadProject() {
		loading = true;
		error = null;
		try {
			const response = await fetch(`/api/admin/projects/${projectId}`);
			const result = await response.json();

			if (result.success) {
				project = result.data;
			} else {
				error = result.message || 'Proyecto no encontrado';
			}
		} catch (err) {
			console.error('Error fetching proyecto:', err);
			error = 'Error al cargar el proyecto';
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/projects/${projectId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				alert('✅ Proyecto eliminado correctamente');
				setTimeout(() => goto('/admin/proyectos/tabla'), 1500);
			} else {
				alert('❌ Error al eliminar el proyecto');
			}
		} catch (error) {
			console.error('Error deleting project:', error);
			alert('❌ Error al eliminar el proyecto');
		}
	}

	function formatCurrency(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('es-EC', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}
</script>

<svelte:head>
	<title>{project?.titulo || 'Cargando...'} - Admin SIGPI</title>
</svelte:head>

<div class="proyecto-detalle-page">
	{#if loading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando proyecto...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<h2>Error</h2>
			<p>{error}</p>
			<button class="btn-primary" on:click={() => goto('/admin/proyectos/tabla')}>
				{icons.back} Volver a la lista
			</button>
		</div>
	{:else if project}
		<!-- Header -->
		<div class="proyecto-header">
			<div class="header-top">
				<button class="btn-back" on:click={() => goto('/admin/proyectos/tabla')}>
					<span>{icons.back}</span>
					Volver
				</button>
				<div class="header-actions">
					<a href="/admin/proyectos/{projectId}/editar" class="btn-secondary">
						<span>{icons.edit}</span>
						Editar
					</a>
					<button class="btn-danger" on:click={handleDelete}>
						<span>{icons.delete}</span>
						Eliminar
					</button>
				</div>
			</div>

			<div class="header-content">
				<div class="proyecto-code">{project.codigo}</div>
				<h1 class="proyecto-titulo">{project.titulo}</h1>
				<div class="proyecto-meta">
					<span
						class="badge badge-{project.estado.nombre.toLowerCase().includes('activo')
							? 'success'
							: 'info'}"
					>
						{project.estado.nombre}
					</span>
					{#if project.requiere_aval}
						<span class="badge badge-warning">Requiere Aval</span>
					{/if}
					{#if project.para_siies}
						<span class="badge badge-primary">SIIES</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">{icons.money}</div>
				<div class="stat-content">
					<div class="stat-label">Presupuesto Total</div>
					<div class="stat-value">{formatCurrency(project.monto_presupuesto_total)}</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">{icons.chart}</div>
				<div class="stat-content">
					<div class="stat-label">Avance del Proyecto</div>
					<div class="stat-value">{project.porcentaje_avance}%</div>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {project.porcentaje_avance}%" />
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">{icons.calendar}</div>
				<div class="stat-content">
					<div class="stat-label">Duración</div>
					<div class="stat-value-small">
						{formatDate(project.fecha_inicio_planeada)} - {formatDate(project.fecha_fin_planeada)}
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">{icons.users}</div>
				<div class="stat-content">
					<div class="stat-label">Participantes</div>
					<div class="stat-value">{project.participantes?.length || 0}</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="content-grid">
			<!-- Left Column -->
			<div class="content-main">
				<!-- Descripción -->
				<!-- Objetivo -->
				{#if project.objetivo}
					<div class="info-card">
						<h2 class="card-title">
							<span>{icons.check}</span>
							Objetivo
						</h2>
						<div class="card-content">
							<p class="text-content">{project.objetivo}</p>
						</div>
					</div>
				{/if}

				<!-- Participantes -->
				{#if project.participantes && project.participantes.length > 0}
					<div class="info-card">
						<h2 class="card-title">
							<span>{icons.users}</span>
							Equipo de Investigación ({project.participantes.length})
						</h2>
						<div class="card-content">
							<div class="participantes-list">
								{#each project.participantes as part}
									<div class="participante-item">
										<div class="participante-info">
											<div class="participante-nombre">{part.nombre}</div>
											<div class="participante-detalles">
												<span class="badge badge-outline">{part.cargo}</span>
												<span class="badge badge-outline">{part.regimen_dedicacion}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column -->
			<div class="content-sidebar">
				<!-- Clasificación -->
				<div class="info-card">
					<h2 class="card-title">
						<span>{icons.tag}</span>
						Clasificación
					</h2>
					<div class="card-content">
						<div class="info-list">
							{#if project.tipos && project.tipos.length > 0}
								<div class="info-item">
									<div class="info-label">Tipos</div>
									<div class="info-tags">
										{#each project.tipos as tipo}
											<span class="tag">{tipo.nombre}</span>
										{/each}
									</div>
								</div>
							{/if}
							{#if project.areas_conocimiento && project.areas_conocimiento.length > 0}
								<div class="info-item">
									<div class="info-label">Áreas de Conocimiento</div>
									<div class="info-tags">
										{#each project.areas_conocimiento as area}
											<span class="tag">{area.nombre}</span>
										{/each}
									</div>
								</div>
							{/if}
							{#if project.lineas_investigacion && project.lineas_investigacion.length > 0}
								<div class="info-item">
									<div class="info-label">Líneas de Investigación</div>
									<div class="info-tags">
										{#each project.lineas_investigacion as linea}
											<span class="tag">{linea.nombre}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Instituciones -->
				{#if project.instituciones && project.instituciones.length > 0}
					<div class="info-card">
						<h2 class="card-title">
							<span>{icons.building}</span>
							Instituciones ({project.instituciones.length})
						</h2>
						<div class="card-content">
							<div class="instituciones-list">
								{#each project.instituciones as inst}
									<div class="institucion-item">
										<div class="institucion-nombre">{inst.nombre}</div>
										{#if inst.sigla}
											<div class="institucion-rol">{inst.sigla}</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Financiamiento -->
				{#if project.fuentes_financiamiento && project.fuentes_financiamiento.length > 0}
					<div class="info-card">
						<h2 class="card-title">
							<span>{icons.money}</span>
							Financiamiento ({project.fuentes_financiamiento.length})
						</h2>
						<div class="card-content">
							<div class="fuentes-list">
								{#each project.fuentes_financiamiento as fuente}
									<div class="fuente-item">
										<div class="fuente-nombre">{fuente.nombre}</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Información Adicional -->
				<div class="info-card">
					<h2 class="card-title">Información Adicional</h2>
					<div class="card-content">
						<div class="info-list">
							{#if project.fecha_fin_real}
								<div class="info-item">
									<div class="info-label">Fecha Finalización Real</div>
									<div class="info-value">{formatDate(project.fecha_fin_real)}</div>
								</div>
							{/if}
							<div class="info-item">
								<div class="info-label">Fecha de Creación</div>
								<div class="info-value">{formatDate(project.creado_en)}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.proyecto-detalle-page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		min-height: 100vh;
	}

	// ==================== Loading & Error States ====================
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		gap: 1.5rem;

		p {
			color: var(--color--text-shade);
			font-size: 1rem;
			margin: 0;
		}
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(var(--color--text-rgb), 0.15);
		border-top: 4px solid var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	// ==================== Header ====================
	.proyecto-header {
		margin-bottom: 2rem;

		.header-top {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 1.5rem;
		}

		.btn-back {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.625rem 1rem;
			background: var(--color--card-background);
			border: 1px solid rgba(var(--color--text-rgb), 0.15);
			border-radius: 6px;
			color: var(--color--text-shade);
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.15s ease;

			&:hover {
				border-color: var(--color--primary);
				color: var(--color--primary);
			}
		}

		.header-actions {
			display: flex;
			gap: 0.75rem;
		}

		.header-content {
			.proyecto-code {
				display: inline-block;
				padding: 0.375rem 0.75rem;
				background: rgba(var(--color--text-rgb), 0.05);
				border: 1px solid rgba(var(--color--text-rgb), 0.15);
				border-radius: 6px;
				font-family: 'SF Mono', monospace;
				font-size: 0.875rem;
				color: var(--color--primary);
				margin-bottom: 1rem;
			}

			.proyecto-titulo {
				font-size: 2.25rem;
				font-weight: 700;
				color: var(--color--text);
				line-height: 1.2;
				margin: 0 0 1rem 0;
			}

			.proyecto-meta {
				display: flex;
				gap: 0.75rem;
				flex-wrap: wrap;
			}
		}
	}

	// ==================== Stats Grid ====================
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 10px;
		transition: all 0.2s ease;

		&:hover {
			border-color: var(--color--primary);
			transform: translateY(-2px);
			box-shadow: var(--card-shadow);
		}

		.stat-icon {
			font-size: 2rem;
			width: 56px;
			height: 56px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(var(--color--primary-rgb), 0.1);
			border-radius: 12px;
			flex-shrink: 0;
		}

		.stat-content {
			flex: 1;
			min-width: 0;
		}

		.stat-label {
			font-size: 0.8125rem;
			color: var(--color--text-shade);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-bottom: 0.5rem;
		}

		.stat-value {
			font-size: 1.875rem;
			font-weight: 700;
			color: var(--color--text);
			line-height: 1;
		}

		.stat-value-small {
			font-size: 0.9375rem;
			font-weight: 600;
			color: var(--color--text);
			line-height: 1.4;
		}

		.progress-bar {
			margin-top: 0.75rem;
			height: 6px;
			background: rgba(var(--color--text-rgb), 0.08);
			border-radius: 3px;
			overflow: hidden;

			.progress-fill {
				height: 100%;
				background: var(--color--primary);
				border-radius: 3px;
				transition: width 0.3s ease;
			}
		}
	}

	// ==================== Content Grid ====================
	.content-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 1.5rem;
	}

	.info-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 10px;
		margin-bottom: 1.5rem;
		overflow: hidden;

		&:last-child {
			margin-bottom: 0;
		}

		.card-title {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 1.25rem 1.5rem;
			background: rgba(var(--color--primary-rgb), 0.05);
			border-bottom: 1px solid rgba(var(--color--text-rgb), 0.15);
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0;
		}

		.card-content {
			padding: 1.5rem;
		}
	}

	.text-content {
		color: var(--color--text-shade);
		line-height: 1.7;
		font-size: 0.9375rem;
		margin: 0;
	}

	// ==================== Participantes ====================
	.participantes-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.participante-item {
		padding: 1rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		transition: all 0.15s ease;

		&:hover {
			border-color: var(--color--primary);
		}

		.participante-info {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.participante-nombre {
			font-weight: 600;
			color: var(--color--text);
			font-size: 0.9375rem;
		}

		.participante-detalles {
			display: flex;
			gap: 0.5rem;
			flex-wrap: wrap;
		}
	}

	// ==================== Info List ====================
	.info-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-item {
		.info-label {
			font-size: 0.8125rem;
			font-weight: 500;
			color: var(--color--text-shade);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-bottom: 0.5rem;
			display: flex;
			align-items: center;
			gap: 0.25rem;
		}

		.info-value {
			font-size: 0.9375rem;
			font-weight: 500;
			color: var(--color--text);
		}

		.info-tags {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}

	.tag {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		background: rgba(var(--color--primary-rgb), 0.1);
		border: 1px solid rgba(var(--color--primary-rgb), 0.3);
		border-radius: 6px;
		font-size: 0.8125rem;
		color: var(--color--primary);
	}

	// ==================== Instituciones ====================
	.instituciones-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.institucion-item {
		padding: 1rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;

		.institucion-nombre {
			font-weight: 600;
			color: var(--color--text);
			margin-bottom: 0.25rem;
			font-size: 0.9375rem;
		}

		.institucion-rol {
			font-size: 0.8125rem;
			color: var(--color--text-shade);
		}
	}

	// ==================== Fuentes ====================
	.fuentes-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.fuente-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;

		.fuente-nombre {
			font-weight: 500;
			color: var(--color--text);
			font-size: 0.9375rem;
		}
	}

	// ==================== Badges ====================
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border-radius: 6px;
		white-space: nowrap;

		&.badge-success {
			background: rgba(var(--color--primary-rgb), 0.15);
			color: var(--color--primary);
		}

		&.badge-info {
			background: rgba(59, 130, 246, 0.15);
			color: #3b82f6;
		}

		&.badge-warning {
			background: rgba(245, 158, 11, 0.15);
			color: #f59e0b;
		}

		&.badge-primary {
			background: rgba(139, 92, 246, 0.15);
			color: #8b5cf6;
		}

		&.badge-outline {
			background: transparent;
			border: 1px solid rgba(var(--color--text-rgb), 0.2);
			color: var(--color--text-shade);
			font-size: 0.75rem;
		}
	}

	// ==================== Buttons ====================
	.btn-primary,
	.btn-secondary,
	.btn-danger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
		border: none;
	}

	.btn-primary {
		background: var(--color--primary);
		color: #ffffff;

		&:hover {
			background: #059669;
			filter: brightness(0.95);
		}
	}

	.btn-secondary {
		background: rgba(var(--color--text-rgb), 0.08);
		color: var(--color--text);

		&:hover {
			background: rgba(var(--color--text-rgb), 0.12);
		}
	}

	.btn-danger {
		background: #ef4444;
		color: #ffffff;

		&:hover {
			background: #dc2626;
		}
	}

	// ==================== Responsive ====================
	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.content-sidebar {
			order: 2;
		}
	}

	@media (max-width: 768px) {
		.proyecto-detalle-page {
			padding: 1rem;
		}

		.proyecto-header {
			.header-top {
				flex-direction: column;
				align-items: stretch;
				gap: 1rem;
			}

			.header-actions {
				width: 100%;

				a,
				button {
					flex: 1;
					justify-content: center;
				}
			}

			.header-content {
				.proyecto-titulo {
					font-size: 1.75rem;
				}
			}
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
