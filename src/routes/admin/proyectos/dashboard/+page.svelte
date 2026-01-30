<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardHeader from '$lib/components/admin/projects/DashboardHeader.svelte';
	import StatsGrid from '$lib/components/admin/projects/StatsGrid.svelte';
	import ResumenEjecutivo from '$lib/components/admin/projects/ResumenEjecutivo.svelte';
	import ChartCard from '$lib/components/admin/projects/ChartCard.svelte';
	import ExportPDFModal from '$lib/components/admin/ExportPDFModal.svelte';
	import VisibilityConfirmModal from '$lib/components/molecules/VisibilityConfirmModal.svelte';
	import { dashboardStore } from '$lib/components/admin/projects/useDashboardData';
	import { chartGenerators } from '$lib/utils/projectsOptimizedChartConfigs';
	import type { GraficoConfig } from '$lib/models/admin';

	// ==========================================
	// STATE MANAGEMENT
	// ==========================================
	let showExportModal = false;
	let showConfirmModal = false;
	let chartToToggle: string | null = null;

	// Chart refs for export
	let chartRefs: Record<string, any> = {};

	// Subscribe to store
	$: ({
		loading,
		error,
		lastUpdate,
		dashboardData,
		chartConfigs,
		visibleCharts,
		statsGridVisible,
		statsGridPublic
	} = $dashboardStore);

	// ==========================================
	// CHARTS FOR EXPORT
	// ==========================================
	$: chartsBasicasForExport = chartConfigs.map((config) => {
		let exportCategory = 'basicas';

		// Categorización por prefijo del nombre_grafico
		if (config.tipo_grafico === 'cards') {
			exportCategory = 'indices';
		} else if (config.nombre_grafico.includes('presupuesto')) {
			exportCategory = 'presupuesto';
		} else if (config.nombre_grafico.startsWith('proyectos_')) {
			exportCategory = 'basicas';
		} else if (config.nombre_grafico.startsWith('participantes_')) {
			exportCategory = 'participantes';
		}

		// Obtener la configuración completa del gráfico con sus datos
		const chartConfig = getChartConfig(config.nombre_grafico);

		return {
			id: config.nombre_grafico,
			name: config.nombre_grafico,
			title: config.titulo_display,
			category: exportCategory,
			config: chartConfig // Incluir la configuración con los datos
		};
	});

	// Ordenar para que Índices Generales aparezca primero
	$: availableChartsForExport = chartsBasicasForExport.sort((a, b) => {
		const order = { indices: 0, basicas: 1, presupuesto: 2, participantes: 3 };
		return (
			(order[a.category as keyof typeof order] ?? 99) -
			(order[b.category as keyof typeof order] ?? 99)
		);
	});

	// ==========================================
	// CHART ACTIONS
	// ==========================================
	function requestTogglePublic(chartName: string): void {
		chartToToggle = chartName;
		showConfirmModal = true;
	}

	async function confirmTogglePublic(): Promise<void> {
		if (!chartToToggle) return;

		try {
			await dashboardStore.togglePublicChart(chartToToggle);
		} catch (err) {
			alert('Error al actualizar la visibilidad del gráfico');
		} finally {
			showConfirmModal = false;
			chartToToggle = null;
		}
	}

	// ==========================================
	// CHART CONFIG GENERATOR
	// ==========================================
	function getChartConfig(chartName: string) {
		const generator = chartGenerators[chartName];
		if (!generator) {
			console.warn(`No generator found for chart: ${chartName}`);
			return null;
		}

		try {
			const config = generator(dashboardData);
			if (!config) {
				console.warn(`Generator returned null for chart: ${chartName}`);
			}
			return config;
		} catch (err) {
			console.error(`Error generating chart config for ${chartName}:`, err);
			return null;
		}
	}

	// ==========================================
	// LIFECYCLE
	// ==========================================
	onMount(async () => {
		await dashboardStore.initialize();
	});
</script>

<svelte:head>
	<title>Dashboard - Proyectos de Investigación</title>
</svelte:head>

<div class="dashboard-container">
	<!-- Header -->
	<DashboardHeader {lastUpdate} {loading} onExport={() => (showExportModal = true)} />

	<!-- Error Message -->
	{#if error && !loading}
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
			<span>{error}</span>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading && dashboardData.stats.total_projects === 0}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando dashboard...</p>
		</div>
	{:else}
		<!-- Índices Generales Section (gráficos tipo cards) -->
		{@const cardsConfig = chartConfigs.find((c) => c.tipo_grafico === 'cards')}
		{#if cardsConfig}
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Índices Generales</h2>
				</div>

				<ChartCard
					chartId={cardsConfig.nombre_grafico}
					title={cardsConfig.titulo_display}
					config={null}
					visible={visibleCharts[cardsConfig.nombre_grafico]}
					isPublic={cardsConfig.es_publico}
					isWide={true}
					height={0}
					onToggleVisibility={() => dashboardStore.toggleChart(cardsConfig.nombre_grafico)}
					onTogglePublic={() => requestTogglePublic(cardsConfig.nombre_grafico)}
					bind:this={chartRefs[cardsConfig.nombre_grafico]}
				>
					<ResumenEjecutivo resumen={dashboardData.analytics.resumen} />
				</ChartCard>
			</div>
		{/if}

		<!-- Charts Section -->
		<div class="dashboard-section">
			<div class="section-header">
				<h2>Estadísticas Básicas de Proyectos</h2>
			</div>

			<div class="charts-grid">
				{#each chartConfigs.filter((c) => c.tipo_grafico !== 'cards') as config (config.nombre_grafico)}
					{@const chartConfig = getChartConfig(config.nombre_grafico)}
					{@const isVisible = visibleCharts[config.nombre_grafico]}
					{@const isWide = config.nombre_grafico === 'geoMap'}
					{@const height = config.nombre_grafico === 'geoMap' ? 400 : 350}

					{#if chartConfig}
						<ChartCard
							chartId={config.nombre_grafico}
							title={config.titulo_display}
							config={chartConfig}
							visible={isVisible}
							isPublic={config.es_publico}
							{isWide}
							{height}
							onToggleVisibility={() => dashboardStore.toggleChart(config.nombre_grafico)}
							onTogglePublic={() => requestTogglePublic(config.nombre_grafico)}
							bind:this={chartRefs[config.nombre_grafico]}
						/>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Export Modal -->
<ExportPDFModal bind:isOpen={showExportModal} availableCharts={availableChartsForExport} />

<!-- Visibility Confirmation Modal -->
<VisibilityConfirmModal
	bind:isOpen={showConfirmModal}
	chartConfig={chartConfigs.find((c) => c.nombre_grafico === chartToToggle)}
	onConfirm={confirmTogglePublic}
	onCancel={() => {
		showConfirmModal = false;
		chartToToggle = null;
	}}
/>

<style lang="scss">
	/* ========== DASHBOARD CONTAINER ========== */
	.dashboard-container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-section {
		margin-bottom: 2rem;
	}

	/* ========== SECTION HEADERS ========== */
	.section-header {
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
	}

	/* ========== ERROR & LOADING ========== */
	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: 8px;
		color: #dc2626;
		margin-bottom: 1.5rem;
		font-family: var(--font--default);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
		color: var(--color--text-shade);
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ========== CHARTS GRID ========== */
	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
		gap: 1.5rem;
	}

	/* ========== RESPONSIVE ========== */
	@media (max-width: 1024px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 1rem;
		}

		.charts-grid {
			gap: 1rem;
		}
	}
</style>
