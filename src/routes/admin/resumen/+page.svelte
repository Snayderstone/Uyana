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
	<!-- Header mejorado con saludo -->
	<header class="page-header">
		<div class="header-content">
			<div class="greeting">
				<div class="title-with-icon">
					<svg
						class="greeting-icon"
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
						<polyline points="9 22 9 12 15 12 15 22" />
					</svg>
					<h1 class="page-title">Bienvenido al Panel de Control</h1>
				</div>
				<p class="page-description">
					Aquí encontrarás un resumen de toda la información importante de tu sistema
				</p>
			</div>
			<button on:click={loadData} class="refresh-btn" disabled={loading} title="Actualizar datos">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
					/>
				</svg>
				<span>Actualizar</span>
			</button>
		</div>
	</header>

	{#if loading}
		<div class="loading-state">
			<div class="spinner-container">
				<div class="spinner" />
			</div>
			<p class="loading-text">Cargando información...</p>
			<p class="loading-subtext">Esto solo tomará un momento</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<h3 class="error-title">Algo salió mal</h3>
			<p class="error-message">{error}</p>
			<button on:click={loadData} class="retry-button">
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
					<path
						d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
					/>
				</svg>
				Intentar nuevamente
			</button>
		</div>
	{:else}
		<!-- Métricas principales destacadas -->
		<div class="main-metrics">
			<div class="metric-card primary">
				<div class="metric-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<line x1="3" y1="9" x2="21" y2="9" />
						<line x1="9" y1="21" x2="9" y2="9" />
					</svg>
				</div>
				<div class="metric-info">
					<div class="metric-value">{stats.proyectos.total}</div>
					<div class="metric-label">Proyectos Totales</div>
					<a href="/admin/proyectos" class="metric-link">Ver todos →</a>
				</div>
			</div>

			<div class="metric-card success">
				<div class="metric-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
						<polyline points="22 4 12 14.01 9 11.01" />
					</svg>
				</div>
				<div class="metric-info">
					<div class="metric-value">{stats.proyectos.activos}</div>
					<div class="metric-label">Proyectos Activos</div>
					<a href="/admin/proyectos" class="metric-link">Ver detalles →</a>
				</div>
			</div>

			<div class="metric-card info">
				<div class="metric-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				</div>
				<div class="metric-info">
					<div class="metric-value">{stats.participantes.total}</div>
					<div class="metric-label">Investigadores</div>
					<a href="/admin/participantes" class="metric-link">Ver todos →</a>
				</div>
			</div>

			<div class="metric-card warning">
				<div class="metric-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="12" y1="1" x2="12" y2="23" />
						<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
					</svg>
				</div>
				<div class="metric-info">
					<div class="metric-value">{formatMoney(stats.proyectos.presupuesto)}</div>
					<div class="metric-label">Presupuesto Total</div>
					<a href="/admin/proyectos/dashboard" class="metric-link">Ver análisis →</a>
				</div>
			</div>
		</div>

		<!-- Sección de acciones rápidas mejorada -->
		<div class="quick-actions-section">
			<div class="section-header-inline">
				<div class="section-title-with-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
					</svg>
					<h2 class="section-title">Acciones Rápidas</h2>
				</div>
				<p class="section-subtitle">Tareas comunes que puedes realizar</p>
			</div>
			<div class="actions-grid-modern">
				<a href="/admin/proyectos/nuevo" class="action-card">
					<div class="action-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</div>
					<div class="action-content">
						<div class="action-title">Crear Proyecto</div>
						<div class="action-description">Registra un nuevo proyecto de investigación</div>
					</div>
				</a>

				<a href="/admin/participantes/nuevo" class="action-card">
					<div class="action-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="8.5" cy="7" r="4" />
							<line x1="20" y1="8" x2="20" y2="14" />
							<line x1="23" y1="11" x2="17" y2="11" />
						</svg>
					</div>
					<div class="action-content">
						<div class="action-title">Añadir Investigador</div>
						<div class="action-description">Registra un nuevo participante</div>
					</div>
				</a>

				<a href="/admin/proyectos/dashboard" class="action-card">
					<div class="action-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="20" x2="18" y2="10" />
							<line x1="12" y1="20" x2="12" y2="4" />
							<line x1="6" y1="20" x2="6" y2="14" />
						</svg>
					</div>
					<div class="action-content">
						<div class="action-title">Ver Estadísticas</div>
						<div class="action-description">Analiza datos de proyectos</div>
					</div>
				</a>

				<a href="/admin/participantes/dashboard" class="action-card">
					<div class="action-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="8.5" cy="7" r="4" />
							<polyline points="17 11 19 13 23 9" />
						</svg>
					</div>
					<div class="action-content">
						<div class="action-title">Panel Investigadores</div>
						<div class="action-description">Estadísticas de participantes</div>
					</div>
				</a>

				<a href="/admin/blog/gestionar" class="action-card">
					<div class="action-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
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
					</div>
					<div class="action-content">
						<div class="action-title">Publicar Artículo</div>
						<div class="action-description">Crear contenido para el blog</div>
					</div>
				</a>

				<a href="/admin/catalogos" class="action-card">
					<div class="action-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
							<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
						</svg>
					</div>
					<div class="action-content">
						<div class="action-title">Gestionar Catálogos</div>
						<div class="action-description">Administra instituciones y carreras</div>
					</div>
				</a>
			</div>
		</div>

		<!-- Grid de 2 columnas para detalles -->
		<div class="details-grid">
			<!-- Columna izquierda: Detalles de proyectos -->
			<div class="detail-panel">
				<div class="panel-header">
					<div class="panel-title-with-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="8" y1="6" x2="21" y2="6" />
							<line x1="8" y1="12" x2="21" y2="12" />
							<line x1="8" y1="18" x2="21" y2="18" />
							<line x1="3" y1="6" x2="3.01" y2="6" />
							<line x1="3" y1="12" x2="3.01" y2="12" />
							<line x1="3" y1="18" x2="3.01" y2="18" />
						</svg>
						<h3 class="panel-title">Estado de Proyectos</h3>
					</div>
				</div>
				<div class="panel-content">
					<div class="stat-row">
						<span class="stat-label">Proyectos activos</span>
						<span class="stat-badge active">{stats.proyectos.activos}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Proyectos completados</span>
						<span class="stat-badge completed">{stats.proyectos.completados}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Total de proyectos</span>
						<span class="stat-badge total">{stats.proyectos.total}</span>
					</div>
					<div class="panel-footer">
						<a href="/admin/proyectos" class="panel-link">Ver todos los proyectos →</a>
					</div>
				</div>
			</div>

			<!-- Columna derecha: Detalles de participantes -->
			<div class="detail-panel">
				<div class="panel-header">
					<div class="panel-title-with-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
						<h3 class="panel-title">Investigadores</h3>
					</div>
				</div>
				<div class="panel-content">
					<div class="stat-row">
						<span class="stat-label">Total de investigadores</span>
						<span class="stat-badge info">{stats.participantes.total}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Investigadores acreditados</span>
						<span class="stat-badge success">{stats.participantes.acreditados}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Directores de proyecto</span>
						<span class="stat-badge warning">{stats.participantes.directores}</span>
					</div>
					<div class="panel-footer">
						<a href="/admin/participantes" class="panel-link">Ver todos los investigadores →</a>
					</div>
				</div>
			</div>

			<!-- Panel de catálogos -->
			<div class="detail-panel">
				<div class="panel-header">
					<div class="panel-title-with-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
							<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
						</svg>
						<h3 class="panel-title">Catálogos del Sistema</h3>
					</div>
				</div>
				<div class="panel-content">
					<div class="stat-row">
						<span class="stat-label">Instituciones registradas</span>
						<span class="stat-badge primary">{stats.catalogos.instituciones}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Carreras/Programas</span>
						<span class="stat-badge primary">{stats.catalogos.carreras}</span>
					</div>
					<div class="panel-footer">
						<a href="/admin/catalogos" class="panel-link">Gestionar catálogos →</a>
					</div>
				</div>
			</div>

			<!-- Panel de blog -->
			<div class="detail-panel">
				<div class="panel-header">
					<div class="panel-title-with-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
							<polyline points="10 9 9 9 8 9" />
						</svg>
						<h3 class="panel-title">Contenido del Blog</h3>
					</div>
				</div>
				<div class="panel-content">
					<div class="stat-row">
						<span class="stat-label">Artículos publicados</span>
						<span class="stat-badge success">{stats.blog.publicados}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Borradores pendientes</span>
						<span class="stat-badge draft">{stats.blog.borradores}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">Total de artículos</span>
						<span class="stat-badge total">{stats.blog.total}</span>
					</div>
					<div class="panel-footer">
						<a href="/admin/blog" class="panel-link">Gestionar blog →</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Actividad reciente mejorada -->
		{#if recentActivities.length > 0}
			<div class="recent-activity-section">
				<div class="section-header-inline">
					<div class="section-title-with-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						<h2 class="section-title">Actividad Reciente</h2>
					</div>
					<p class="section-subtitle">Últimas actualizaciones en el sistema</p>
				</div>
				<div class="activity-panel">
					<ActivityList activities={recentActivities} />
				</div>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	.summary-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		background: var(--color--page-background);
		min-height: 100vh;
	}

	// ============ HEADER MEJORADO ============
	.page-header {
		margin-bottom: 2.5rem;
		background: var(--color--card-background);
		padding: 2rem;
		border-radius: 16px;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		box-shadow: var(--card-shadow);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.greeting {
		flex: 1;
	}

	.title-with-icon {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.greeting-icon {
		color: var(--color--primary);
		flex-shrink: 0;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
		color: var(--color--text);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.2;
	}

	.page-description {
		font-size: 1rem;
		color: var(--color--text-shade);
		margin: 0;
		line-height: 1.6;
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.2);
		border-radius: 8px;
		color: var(--color--text);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

		&:hover:not(:disabled) {
			background: var(--color--primary-tint);
			border-color: var(--color--primary);
			color: var(--color--primary);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(var(--color--primary-rgb), 0.2);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		svg {
			transition: transform 0.3s ease;
		}

		&:hover:not(:disabled) svg {
			transform: rotate(180deg);
		}
	}

	// ============ MÉTRICAS PRINCIPALES ============
	.main-metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	.metric-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		padding: 1.75rem;
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
		transition: all 0.3s ease;
		box-shadow: var(--card-shadow);

		&:hover {
			transform: translateY(-4px);
			box-shadow: var(--card-shadow-hover);
		}

		&.primary {
			border-left: 4px solid var(--color--primary);
			&:hover {
				border-color: var(--color--primary);
				box-shadow: 0 8px 24px rgba(var(--color--primary-rgb), 0.3);
			}
		}

		&.success {
			border-left: 4px solid #10b981;
			&:hover {
				border-color: #10b981;
				box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
			}
		}

		&.info {
			border-left: 4px solid #3b82f6;
			&:hover {
				border-color: #3b82f6;
				box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
			}
		}

		&.warning {
			border-left: 4px solid #f59e0b;
			&:hover {
				border-color: #f59e0b;
				box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
			}
		}
	}

	.metric-icon {
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: rgba(var(--color--text-rgb), 0.05);
		transition: all 0.3s ease;

		svg {
			transition: all 0.3s ease;
		}
	}

	.metric-card:hover .metric-icon {
		transform: scale(1.1);
		background: rgba(var(--color--text-rgb), 0.1);
	}

	.metric-card.primary .metric-icon {
		color: var(--color--primary);
	}

	.metric-card.success .metric-icon {
		color: #10b981;
	}

	.metric-card.info .metric-icon {
		color: #60a5fa;
	}

	.metric-card.warning .metric-icon {
		color: #fbbf24;
	}

	.metric-info {
		flex: 1;
	}

	.metric-value {
		font-size: 2.25rem;
		font-weight: 700;
		color: var(--color--text);
		line-height: 1.1;
		margin-bottom: 0.5rem;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
	}

	.metric-label {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		font-weight: 500;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metric-link {
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color--primary);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;

		&:hover {
			color: var(--color--primary);
			opacity: 0.8;
			transform: translateX(4px);
		}
	}

	// ============ ACCIONES RÁPIDAS ============
	.quick-actions-section {
		margin-bottom: 2.5rem;
	}

	.section-header-inline {
		margin-bottom: 1.5rem;
	}

	.section-title-with-icon {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;

		svg {
			color: var(--color--primary);
			flex-shrink: 0;
		}
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.section-subtitle {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0;
	}

	.actions-grid-modern {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.25rem;
	}

	.action-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: var(--card-shadow);

		&:hover {
			border-color: var(--color--primary);
			transform: translateY(-2px);
			box-shadow: var(--card-shadow-hover);
			background: var(--color--card-background);
		}
	}

	.action-icon {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--color--text-rgb), 0.05);
		border-radius: 12px;
		transition: all 0.3s ease;
		color: var(--color--text-shade);

		svg {
			transition: all 0.3s ease;
		}
	}

	.action-card:hover .action-icon {
		background: var(--color--primary);
		color: var(--color--text-inverse);
		transform: scale(1.1) rotate(5deg);
	}

	.action-content {
		flex: 1;
	}

	.action-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text);
		margin-bottom: 0.25rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.action-description {
		font-size: 0.8125rem;
		color: var(--color--text-shade);
		line-height: 1.4;
	}

	// ============ PANELES DE DETALLES ============
	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	.detail-panel {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: var(--card-shadow);

		&:hover {
			transform: translateY(-2px);
			box-shadow: var(--card-shadow-hover);
			border-color: rgba(var(--color--text-rgb), 0.15);
		}
	}

	.panel-header {
		padding: 1.25rem 1.5rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.panel-title-with-icon {
		display: flex;
		align-items: center;
		gap: 0.625rem;

		svg {
			color: var(--color--primary);
			flex-shrink: 0;
		}
	}

	.panel-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.panel-content {
		padding: 1.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem 0;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

		&:last-child {
			border-bottom: none;
		}
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		font-weight: 500;
	}

	.stat-badge {
		padding: 0.375rem 0.875rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;

		&.primary {
			background: var(--color--primary-tint);
			color: var(--color--primary);
		}

		&.success {
			background: rgba(16, 185, 129, 0.15);
			color: #10b981;
		}

		&.info {
			background: rgba(59, 130, 246, 0.15);
			color: #3b82f6;
		}

		&.warning {
			background: rgba(245, 158, 11, 0.15);
			color: #f59e0b;
		}

		&.active {
			background: rgba(16, 185, 129, 0.15);
			color: #10b981;
		}

		&.completed {
			background: rgba(59, 130, 246, 0.15);
			color: #3b82f6;
		}

		&.total {
			background: rgba(var(--color--text-rgb), 0.1);
			color: var(--color--text);
		}

		&.draft {
			background: rgba(245, 158, 11, 0.15);
			color: #f59e0b;
		}
	}

	.panel-footer {
		padding: 1rem 1.5rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.panel-link {
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color--primary);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;

		&:hover {
			color: var(--color--primary);
			opacity: 0.8;
			transform: translateX(4px);
		}
	}

	// ============ ACTIVIDAD RECIENTE ============
	.recent-activity-section {
		margin-bottom: 2rem;
	}

	.activity-panel {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: var(--card-shadow);
	}

	// ============ ESTADOS DE CARGA Y ERROR ============
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 6rem 2rem;
		text-align: center;
	}

	.spinner-container {
		margin-bottom: 1.5rem;
	}

	.spinner {
		width: 56px;
		height: 56px;
		border: 4px solid rgba(var(--color--text-rgb), 0.2);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.5rem 0;
	}

	.loading-subtext {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 6rem 2rem;
		text-align: center;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		margin: 2rem 0;
	}

	.error-icon {
		width: 64px;
		height: 64px;
		margin-bottom: 1rem;
		color: #ef4444;

		svg {
			width: 100%;
			height: 100%;
		}
	}

	.error-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0 0 0.5rem 0;
	}

	.error-message {
		font-size: 1rem;
		color: var(--color--text-shade);
		margin: 0 0 1.5rem 0;
	}

	.retry-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background: var(--color--primary);
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color--text-inverse);
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

		&:hover {
			background: var(--color--primary);
			opacity: 0.9;
			transform: translateY(-2px);
			box-shadow: 0 8px 24px rgba(var(--color--primary-rgb), 0.3);
		}
	}

	// ============ RESPONSIVE ============
	@media (max-width: 1024px) {
		.main-metrics {
			grid-template-columns: repeat(2, 1fr);
		}

		.actions-grid-modern {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.summary-page {
			padding: 1rem;
		}

		.page-header {
			padding: 1.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.title-with-icon {
			flex-direction: row;
			align-items: center;

			.greeting-icon {
				width: 28px;
				height: 28px;
			}
		}

		.page-title {
			font-size: 1.5rem;
		}

		.refresh-btn {
			align-self: stretch;
			justify-content: center;
		}

		.main-metrics {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.actions-grid-modern {
			grid-template-columns: 1fr;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}

		.metric-card {
			padding: 1.25rem;
		}

		.metric-icon {
			width: 56px;
			height: 56px;

			svg {
				width: 36px;
				height: 36px;
			}
		}

		.metric-value {
			font-size: 1.75rem;
		}

		.action-icon {
			width: 48px;
			height: 48px;

			svg {
				width: 24px;
				height: 24px;
			}
		}
	}
</style>
