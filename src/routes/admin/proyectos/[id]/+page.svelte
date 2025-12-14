<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { ProyectoResponseDTO } from '$lib/models/admin';
	import Toast from '$lib/components/admin/projects/Toast.svelte';

	let loading = true;
	let project: ProyectoResponseDTO | null = null;
	let showToast = false;
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

	const projectId = $page.params.id;

	onMount(async () => {
		await loadProject();
	});

	async function loadProject() {
		loading = true;
		try {
			const response = await fetch(`/api/admin/proyectos/${projectId}`);
			if (!response.ok) throw new Error('Error al cargar el proyecto');

			project = await response.json();
		} catch (error) {
			showToast = true;
			toastMessage = '❌ Error al cargar el proyecto';
			toastType = 'error';
			setTimeout(() => goto('/admin/proyectos'), 2000);
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/proyectos/${projectId}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Error al eliminar');

			showToast = true;
			toastMessage = '✅ Proyecto eliminado correctamente';
			toastType = 'success';

			setTimeout(() => goto('/admin/proyectos'), 1500);
		} catch (error) {
			showToast = true;
			toastMessage = '❌ Error al eliminar el proyecto';
			toastType = 'error';
		}
	}

	async function downloadReport(format: 'pdf' | 'docx') {
		try {
			const response = await fetch(
				`/api/admin/reports?type=individual&id=${projectId}&format=${format}`
			);
			if (!response.ok) throw new Error('Error al generar informe');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `proyecto_${project?.codigo}_${
				new Date().toISOString().split('T')[0]
			}.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			showToast = true;
			toastMessage = `✅ Informe ${format.toUpperCase()} generado correctamente`;
			toastType = 'success';
		} catch (error) {
			showToast = true;
			toastMessage = '❌ Error al generar el informe';
			toastType = 'error';
		}
	}

	function formatCurrency(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('es-EC', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Detalle del Proyecto - Admin</title>
</svelte:head>

<Toast bind:visible={showToast} message={toastMessage} type={toastType} />

<div class="page-container">
	<!-- Header -->
	<div class="page-header">
		<button class="back-btn" on:click={() => goto('/admin/proyectos')}>
			← Volver a Proyectos
		</button>

		{#if !loading && project}
			<div class="header-actions">
				<button class="btn-secondary" on:click={() => goto(`/admin/proyectos/${projectId}/edit`)}>
					✏️ Editar
				</button>
				<button class="btn-secondary" on:click={() => downloadReport('pdf')}>
					📄 Informe PDF
				</button>
				<button class="btn-secondary" on:click={() => downloadReport('docx')}>
					📝 Informe Word
				</button>
				<button class="btn-danger" on:click={handleDelete}> 🗑️ Eliminar </button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="loading-container">
			<div class="spinner" />
			<p>Cargando proyecto...</p>
		</div>
	{:else if project}
		<!-- Project Details -->
		<div class="content-wrapper">
			<!-- Basic Info -->
			<div class="info-card">
				<div class="card-header">
					<h1>{project.titulo}</h1>
					<div class="badges">
						<span class="badge estado">{project.estado.nombre}</span>
						{#if project.para_siies}
							<span class="badge siies">SIIES</span>
						{/if}
					</div>
				</div>

				<div class="info-grid">
					<div class="info-item">
						<span class="label">🔢 Código:</span>
						<span class="value code">{project.codigo}</span>
					</div>

					<div class="info-item">
						<span class="label">📊 Avance:</span>
						<div class="progress-container">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {project.porcentaje_avance}%" />
							</div>
							<span class="progress-text">{project.porcentaje_avance}%</span>
						</div>
					</div>

					<div class="info-item">
						<span class="label">💰 Presupuesto Total:</span>
						<span class="value currency">{formatCurrency(project.monto_presupuesto_total)}</span>
					</div>

					<div class="info-item">
						<span class="label">💵 Monto Presupuesto:</span>
						<span class="value currency">{formatCurrency(project.monto_presupuesto_total)}</span>
					</div>

					<div class="info-item full-width">
						<span class="label">📅 Fecha Inicio Planeada:</span>
						<span class="value">{formatDate(project.fecha_inicio_planeada)}</span>
					</div>

					<div class="info-item full-width">
						<span class="label">📅 Fecha Finalización Planeada:</span>
						<span class="value">{formatDate(project.fecha_fin_planeada)}</span>
					</div>

					{#if project.fecha_fin_real}
						<div class="info-item">
							<span class="label">✅ Fecha Finalización Real:</span>
							<span class="value">{formatDate(project.fecha_fin_real)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Objetivo -->
			{#if project.objetivo}
				<div class="info-card">
					<h2>📝 Objetivo</h2>
					<p class="description">{project.objetivo}</p>
				</div>
			{/if}

			<!-- Instituciones -->
			<div class="info-card">
				<h2>🏛️ Instituciones Participantes ({project.instituciones.length})</h2>
				<div class="items-grid">
					{#each project.instituciones as inst}
						<div class="item-badge">{inst.nombre}</div>
					{/each}
				</div>
			</div>

			<!-- Tipos -->
			<div class="info-card">
				<h2>🏷️ Tipos de Proyecto ({project.tipos.length})</h2>
				<div class="items-grid">
					{#each project.tipos as tipo}
						<div class="item-badge">{tipo.nombre}</div>
					{/each}
				</div>
			</div>

			<!-- Áreas de Conocimiento -->
			{#if project.areas_conocimiento.length > 0}
				<div class="info-card">
					<h2>📚 Áreas de Conocimiento ({project.areas_conocimiento.length})</h2>
					<div class="items-grid">
						{#each project.areas_conocimiento as area}
							<div class="item-badge">{area.nombre}</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Líneas de Investigación -->
			{#if project.lineas_investigacion.length > 0}
				<div class="info-card">
					<h2>🔬 Líneas de Investigación ({project.lineas_investigacion.length})</h2>
					<div class="items-grid">
						{#each project.lineas_investigacion as linea}
							<div class="item-badge">{linea.nombre}</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Participantes -->
			<div class="info-card">
				<h2>👥 Participantes ({project.participantes.length})</h2>
				<div class="participants-list">
					{#each project.participantes as participante}
						<div class="participant-card">
							<div class="participant-header">
								<h3>{participante.nombre}</h3>
								<span class="badge">{participante.cargo}</span>
							</div>
							<div class="participant-info">
								<span>📧 {participante.email}</span>
								<span>🕐 {participante.regimen_dedicacion}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Fuentes de Financiamiento -->
			{#if project.fuentes_financiamiento.length > 0}
				<div class="info-card">
					<h2>💵 Fuentes de Financiamiento ({project.fuentes_financiamiento.length})</h2>
					<div class="funding-list">
						{#each project.fuentes_financiamiento as fuente}
							<div class="funding-card">
								<h3>{fuente.nombre}</h3>
								<div class="funding-amount">Fuente de financiamiento</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="error-container">
			<div class="error-icon">❌</div>
			<h2>Proyecto no encontrado</h2>
			<p>El proyecto solicitado no existe o fue eliminado.</p>
			<button class="btn-primary" on:click={() => goto('/admin/proyectos')}>
				Volver a Proyectos
			</button>
		</div>
	{/if}
</div>

<style>
	.page-container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.back-btn {
		padding: 0.75rem 1.5rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.back-btn:hover {
		background: #f5f5f5;
		border-color: #6e29e7;
		color: #6e29e7;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-primary,
	.btn-secondary,
	.btn-danger {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-primary {
		background: #6e29e7;
		color: white;
	}

	.btn-primary:hover {
		background: #5a1fc7;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
	}

	.btn-secondary {
		background: white;
		color: #666;
		border: 1px solid #ddd;
	}

	.btn-secondary:hover {
		background: #f5f5f5;
		border-color: #999;
	}

	.btn-danger {
		background: #f44336;
		color: white;
	}

	.btn-danger:hover {
		background: #d32f2f;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #6e29e7;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.content-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.info-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		margin-bottom: 1.5rem;
	}

	.card-header h1 {
		margin: 0 0 1rem 0;
		color: var(--color--text-primary, #1a1a1a);
		font-size: 2rem;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-block;
		padding: 0.4rem 1rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge.estado {
		background: #e3f2fd;
		color: #1976d2;
	}

	.badge.siies {
		background: #4caf50;
		color: white;
	}

	.info-card h2 {
		margin: 0 0 1.5rem 0;
		color: var(--color--text-primary, #1a1a1a);
		font-size: 1.5rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item.full-width {
		grid-column: 1 / -1;
	}

	.label {
		font-weight: 600;
		color: var(--color--text-secondary, #666);
		font-size: 0.9rem;
	}

	.value {
		font-size: 1.1rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.value.code {
		font-family: monospace;
		font-weight: 600;
		color: #6e29e7;
	}

	.value.currency {
		font-weight: 700;
		color: #4caf50;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.progress-bar {
		flex: 1;
		height: 10px;
		background: #e0e0e0;
		border-radius: 5px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4caf50, #8bc34a);
		transition: width 0.3s;
	}

	.progress-text {
		font-weight: 700;
		min-width: 45px;
		text-align: right;
	}

	.description {
		line-height: 1.8;
		color: var(--color--text-secondary, #666);
		font-size: 1.05rem;
	}

	.items-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.item-badge {
		padding: 0.75rem 1.25rem;
		background: #f5f0ff;
		color: #6e29e7;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.participants-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.participant-card {
		padding: 1.25rem;
		background: #f8f9fa;
		border-radius: 8px;
		border-left: 4px solid #6e29e7;
	}

	.participant-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		gap: 0.5rem;
	}

	.participant-header h3 {
		margin: 0;
		font-size: 1.05rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.participant-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--color--text-secondary, #666);
	}

	.funding-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.funding-card {
		padding: 1.25rem;
		background: #f0f7ff;
		border-radius: 8px;
		border-left: 4px solid #2196f3;
	}

	.funding-card h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color--text-primary, #1a1a1a);
	}

	.funding-amount {
		font-size: 1.25rem;
		font-weight: 700;
		color: #4caf50;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			flex-direction: column;
		}

		.back-btn,
		.btn-primary,
		.btn-secondary,
		.btn-danger {
			width: 100%;
			text-align: center;
			justify-content: center;
		}

		.info-card {
			padding: 1.5rem;
		}

		.card-header h1 {
			font-size: 1.5rem;
		}

		.info-card h2 {
			font-size: 1.25rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.participants-list,
		.funding-list {
			grid-template-columns: 1fr;
		}
	}
</style>
