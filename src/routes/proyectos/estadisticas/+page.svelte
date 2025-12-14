<script lang="ts">
	import PublicStatsOverview from '$lib/components/organisms/PublicStatsOverview.svelte';
	import PublicChartsSection from '$lib/components/organisms/PublicChartsSection.svelte';
	import type { GraficoConfig } from '$lib/models/admin/chart.model';
	import { type DashboardData } from '$lib/utils/chartConfigs';
	import { chartGenerators } from '$lib/utils/optimizedChartConfigs';

	interface PageData {
		charts: GraficoConfig[];
		dashboardData: DashboardData;
		error?: string;
	}

	export let data: PageData;

	function getChartConfig(chartName: string) {
		// Use optimized chart generators with materialized views
		const generator = chartGenerators[chartName];
		if (generator) {
			return generator(data.dashboardData);
		}
		return null;
	}
</script>

<svelte:head>
	<title>Estadísticas de Proyectos de Investigación - Universidad</title>
	<meta
		name="description"
		content="Visualiza estadísticas y datos de los proyectos de investigación de la Universidad"
	/>
</svelte:head>

<div class="public-stats-container">
	<!-- Hero Section -->
	<div class="hero">
		<h1>Estadísticas de Proyectos de Investigación</h1>
		<p>Explora datos y métricas de nuestros proyectos de investigación en curso</p>
	</div>

	{#if data.error}
		<div class="error-message">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<span>{data.error}</span>
		</div>
	{:else if data.charts.length === 0}
		<div class="empty-state">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7 10 12 15 17 10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
			<h2>No hay estadísticas públicas disponibles</h2>
			<p>Los administradores aún no han publicado gráficos estadísticos</p>
		</div>
	{:else}
		<!-- Stats Overview Component -->
		<PublicStatsOverview
			totalProjects={data.dashboardData.stats.total_projects}
			totalBudget={data.dashboardData.stats.total_budget}
			completedCount={data.dashboardData.stats.completed_count}
			inProgressCount={data.dashboardData.stats.in_progress_count}
		/>

		<!-- Charts Section Component -->
		<PublicChartsSection charts={data.charts} {getChartConfig} />
	{/if}

	<!-- Footer Info -->
	<footer class="stats-footer">
		<p>
			Datos actualizados: {new Date().toLocaleDateString('es-ES', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</p>
		<p>Universidad - Dirección de Investigación</p>
	</footer>
</div>

<style lang="scss">
	.public-stats-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.hero {
		text-align: center;
		padding: 3rem 1rem;
		margin-bottom: 3rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16px;
		color: white;

		h1 {
			font-size: 2.5rem;
			font-weight: 700;
			margin: 0 0 1rem 0;
		}

		p {
			font-size: 1.125rem;
			opacity: 0.95;
			margin: 0;
		}
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 12px;
		color: #dc2626;
		margin-bottom: 2rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--color--text-shade, #6b7280);

		svg {
			margin-bottom: 1.5rem;
			color: #9ca3af;
		}

		h2 {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color--text, #374151);
			margin: 0 0 0.5rem 0;
		}

		p {
			font-size: 1rem;
			margin: 0;
		}
	}

	.stats-footer {
		text-align: center;
		padding: 2rem 1rem;
		margin-top: 4rem;
		border-top: 1px solid var(--color--border, #e5e7eb);
		color: var(--color--text-shade, #6b7280);

		p {
			margin: 0.5rem 0;
			font-size: 0.875rem;
		}
	}

	@media (max-width: 768px) {
		.public-stats-container {
			padding: 1rem;
		}

		.hero {
			padding: 2rem 1rem;
			margin-bottom: 2rem;

			h1 {
				font-size: 1.75rem;
			}
		}
	}
</style>
