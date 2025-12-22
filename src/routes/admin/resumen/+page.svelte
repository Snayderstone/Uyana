<script lang="ts">
	import { onMount } from 'svelte';
	import { AdminProjectsService } from '$lib/services/admin/projects/projects.service';
	import { AdminParticipantsService } from '$lib/services/admin/participants/participants.service';
	import { AdminBlogService } from '$lib/services/admin/blog/blog.service';
	import { AnalyticsRepository } from '$lib/db/admin/projects/dashboardProjects.repository';
	import { ParticipantsDashboardRepository } from '$lib/db/admin/participants/dashboardParticipants.repository';
	import {
		AdminInstitucionesRepository,
		AdminCarrerasRepository
	} from '$lib/db/admin/catalogs/catalogs.repository';

	import SummaryStatCard from '$lib/components/admin/summary/SummaryStatCard.svelte';
	import SummarySection from '$lib/components/admin/summary/SummarySection.svelte';
	import QuickActionButton from '$lib/components/admin/summary/QuickActionButton.svelte';
	import ActivityList from '$lib/components/admin/summary/ActivityList.svelte';

	// Estado
	let loading = true;
	let error = '';

	// Stats
	let stats = {
		proyectos: { total: 0, activos: 0, completados: 0, presupuesto: 0 },
		participantes: { total: 0, acreditados: 0, directores: 0 },
		catalogos: { instituciones: 0, carreras: 0 },
		blog: { total: 0, publicados: 0, borradores: 0 }
	};

	let recentActivities: Array<{ label: string; time: string; href?: string }> = [];

	// Funciones de carga de datos
	async function loadProjectStats() {
		const [proyectos, estadisticasPresupuesto, distribucion] = await Promise.all([
			AdminProjectsService.listProjects(1, 1, {}),
			AnalyticsRepository.getEstadisticasPresupuesto(),
			AnalyticsRepository.getDistribucionEstado()
		]);

		stats.proyectos.total = proyectos.pagination.total;
		stats.proyectos.presupuesto = estadisticasPresupuesto?.presupuesto_total || 0;

		const completados = distribucion.find(
			(d) =>
				d.estado?.toLowerCase().includes('completado') ||
				d.estado?.toLowerCase().includes('finalizado')
		);
		const activos = distribucion.find(
			(d) =>
				d.estado?.toLowerCase().includes('ejecución') || d.estado?.toLowerCase().includes('activo')
		);

		stats.proyectos.completados = completados?.cantidad || 0;
		stats.proyectos.activos = activos?.cantidad || 0;
	}

	async function loadParticipantStats() {
		const [participantes, dashboardData] = await Promise.all([
			AdminParticipantsService.listParticipants(1, 1, {}),
			ParticipantsDashboardRepository.getDashboardDataComplete()
		]);

		stats.participantes.total = participantes.pagination.total;

		if (dashboardData) {
			stats.participantes.acreditados = dashboardData.stats.total_acreditados || 0;
			stats.participantes.directores = (dashboardData.topParticipantes || []).filter(
				(p) => p.proyectos_como_director > 0
			).length;
		}
	}

	async function loadCatalogStats() {
		const [instituciones, carreras] = await Promise.all([
			AdminInstitucionesRepository.getAll(),
			AdminCarrerasRepository.getAll()
		]);

		stats.catalogos.instituciones = instituciones.length;
		stats.catalogos.carreras = carreras.length;
	}

	async function loadBlogStats() {
		const posts = await AdminBlogService.listPosts(1, 1, {});
		stats.blog.total = posts.pagination.total;

		const [publicados, borradores] = await Promise.all([
			AdminBlogService.listPosts(1, 1, { publicado: true }),
			AdminBlogService.listPosts(1, 1, { publicado: false })
		]);

		stats.blog.publicados = publicados.pagination.total;
		stats.blog.borradores = borradores.pagination.total;
	}

	async function loadRecentActivity() {
		const [proyectos, participantes, posts] = await Promise.all([
			AdminProjectsService.listProjects(1, 3, {}),
			AdminParticipantsService.listParticipants(1, 3, {}),
			AdminBlogService.listPosts(1, 2, {})
		]);

		const activities: Array<{ label: string; time: string; href?: string }> = [];

		proyectos.data.forEach((p) => {
			activities.push({
				label: `Proyecto: ${p.titulo}`,
				time: 'Reciente',
				href: `/admin/proyectos/${p.id}`
			});
		});

		participantes.data.forEach((p) => {
			activities.push({
				label: `Participante: ${p.nombre}`,
				time: 'Reciente',
				href: `/admin/participantes/${p.id}`
			});
		});

		posts.data.forEach((p) => {
			activities.push({
				label: `Post: ${p.titulo}`,
				time: 'Reciente',
				href: `/admin/blog/${p.id}`
			});
		});

		recentActivities = activities.slice(0, 8);
	}

	async function loadData() {
		loading = true;
		error = '';

		try {
			await Promise.all([
				loadProjectStats(),
				loadParticipantStats(),
				loadCatalogStats(),
				loadBlogStats(),
				loadRecentActivity()
			]);
		} catch (err) {
			console.error('Error cargando datos:', err);
			error = 'Error al cargar los datos';
		} finally {
			loading = false;
		}
	}

	function formatMoney(value: number): string {
		if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
		if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
		return `$${value}`;
	}

	onMount(loadData);
</script>

<svelte:head>
	<title>Resumen - Administración</title>
</svelte:head>

<div class="summary-page">
	<header class="page-header">
		<h1 class="page-title">Resumen</h1>
		<p class="page-description">Vista general del sistema</p>
	</header>

	{#if loading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
			<button on:click={loadData} class="retry-button">Reintentar</button>
		</div>
	{:else}
		<!-- Proyectos -->
		<SummarySection title="Proyectos" description="Estadísticas de proyectos de investigación">
			<div class="stats-grid">
				<SummaryStatCard
					label="Total proyectos"
					value={stats.proyectos.total}
					href="/admin/proyectos"
				/>
				<SummaryStatCard
					label="Proyectos activos"
					value={stats.proyectos.activos}
					href="/admin/proyectos"
				/>
				<SummaryStatCard
					label="Completados"
					value={stats.proyectos.completados}
					href="/admin/proyectos"
				/>
				<SummaryStatCard
					label="Presupuesto total"
					value={formatMoney(stats.proyectos.presupuesto)}
					href="/admin/proyectos/dashboard"
				/>
			</div>
		</SummarySection>

		<!-- Participantes -->
		<SummarySection title="Participantes" description="Investigadores y colaboradores">
			<div class="stats-grid">
				<SummaryStatCard
					label="Total participantes"
					value={stats.participantes.total}
					href="/admin/participantes"
				/>
				<SummaryStatCard
					label="Acreditados"
					value={stats.participantes.acreditados}
					href="/admin/participantes"
				/>
				<SummaryStatCard
					label="Directores"
					value={stats.participantes.directores}
					href="/admin/participantes/dashboard"
				/>
			</div>
		</SummarySection>

		<!-- Catálogos -->
		<SummarySection title="Catálogos" description="Instituciones y programas académicos">
			<div class="stats-grid">
				<SummaryStatCard
					label="Instituciones"
					value={stats.catalogos.instituciones}
					href="/admin/catalogos"
				/>
				<SummaryStatCard
					label="Carreras"
					value={stats.catalogos.carreras}
					href="/admin/catalogos"
				/>
			</div>
		</SummarySection>

		<!-- Blog -->
		<SummarySection title="Blog" description="Contenido publicado">
			<div class="stats-grid">
				<SummaryStatCard label="Total posts" value={stats.blog.total} href="/admin/blog" />
				<SummaryStatCard label="Publicados" value={stats.blog.publicados} href="/admin/blog" />
				<SummaryStatCard label="Borradores" value={stats.blog.borradores} href="/admin/blog" />
			</div>
		</SummarySection>

		<!-- Acciones rápidas -->
		<SummarySection title="Acciones rápidas">
			<div class="actions-grid">
				<QuickActionButton href="/admin/proyectos/nuevo" label="Nuevo proyecto" />
				<QuickActionButton href="/admin/participantes/nuevo" label="Nuevo participante" />
				<QuickActionButton href="/admin/blog/gestionar" label="Nuevo post" />
				<QuickActionButton href="/admin/catalogos" label="Gestionar catálogos" />
				<QuickActionButton href="/admin/proyectos/dashboard" label="Dashboard proyectos" />
				<QuickActionButton href="/admin/participantes/dashboard" label="Dashboard participantes" />
			</div>
		</SummarySection>

		<!-- Actividad reciente -->
		<SummarySection title="Actividad reciente">
			<ActivityList activities={recentActivities} />
		</SummarySection>
	{/if}
</div>

<style>
	.summary-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.375rem 0;
		color: var(--color--text);
		font-family: var(--font--title);
	}

	.page-description {
		font-size: 0.875rem;
		color: var(--color--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.actions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color--text-secondary);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid rgba(var(--color--primary-rgb), 0.1);
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

	.retry-button {
		margin-top: 1rem;
		padding: 0.625rem 1.25rem;
		background: var(--color--primary);
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: var(--card-shadow);
	}

	.retry-button:hover {
		background: var(--color--primary-shade);
		box-shadow: 0 2px 8px rgba(var(--color--primary-rgb), 0.3);
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.summary-page {
			padding: 1.5rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.page-title {
			font-size: 1.25rem;
		}
	}
</style>
