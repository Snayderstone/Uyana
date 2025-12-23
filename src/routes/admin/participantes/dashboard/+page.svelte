<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardHeader from '$lib/components/admin/participants/DashboardHeader.svelte';
	import ResumenEjecutivo from '$lib/components/admin/participants/ResumenEjecutivo.svelte';
	import ChartCard from '$lib/components/admin/participants/ChartCard.svelte';
	import ExportPDFModal from '$lib/components/admin/ExportPDFModal.svelte';
	import VisibilityConfirmModal from '$lib/components/molecules/VisibilityConfirmModal.svelte';
	import { participantsDashboardStore } from '$lib/components/admin/participants/useDashboardData';
	import { participantsChartGenerators } from '$lib/utils/participants/optimizedChartConfigs';
	import type { GraficoConfig } from '$lib/models/admin';

	let showExportModal = false;
	let showConfirmModal = false;
	let chartToToggle: string | null = null;
	let chartRefs: Record<string, any> = {};

	$: ({ loading, error, lastUpdate, dashboardData, chartConfigs, visibleCharts } =
		$participantsDashboardStore);

	$: availableChartsForExport = chartConfigs.map((config) => ({
		id: config.nombre_grafico,
		name: config.nombre_grafico,
		title: config.titulo_display,
		category: 'participantes'
	}));

	function requestTogglePublic(chartName: string): void {
		chartToToggle = chartName;
		showConfirmModal = true;
	}

	async function confirmTogglePublic(): Promise<void> {
		if (!chartToToggle) return;
		try {
			await participantsDashboardStore.togglePublicChart(chartToToggle);
		} catch (err) {
			alert('Error al actualizar la visibilidad');
		} finally {
			showConfirmModal = false;
			chartToToggle = null;
		}
	}

	function getChartConfig(chartName: string) {
		const generator = participantsChartGenerators[chartName];
		if (!generator) return null;
		try {
			return generator(dashboardData);
		} catch (err) {
			console.error('Error:', err);
			return null;
		}
	}

	onMount(async () => {
		await participantsDashboardStore.initialize();
	});
</script>

<svelte:head>
	<title>Dashboard - Participantes</title>
</svelte:head>

<div class="dashboard-container">
	<DashboardHeader {lastUpdate} {loading} onExport={() => (showExportModal = true)} />

	{#if error && !loading}
		<div class="error-message">
			<span>{error}</span>
		</div>
	{/if}

	{#if loading && !dashboardData}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando dashboard de participantes...</p>
		</div>
	{:else if dashboardData}
		{#each chartConfigs as config (config.nombre_grafico)}
			{@const chartConfig = getChartConfig(config.nombre_grafico)}
			{@const isVisible = visibleCharts[config.nombre_grafico]}

			{#if config.nombre_grafico === 'participantes_resumen' && dashboardData.stats}
				<div class="dashboard-section">
					<div class="section-header">
						<h2>Resumen Ejecutivo</h2>
					</div>
					<ChartCard
						chartId={config.nombre_grafico}
						title={config.titulo_display}
						config={null}
						visible={isVisible}
						isPublic={config.es_publico}
						isWide={true}
						height={0}
						onToggleVisibility={() => participantsDashboardStore.toggleChart(config.nombre_grafico)}
						onTogglePublic={() => requestTogglePublic(config.nombre_grafico)}
						bind:this={chartRefs[config.nombre_grafico]}
					>
						<ResumenEjecutivo stats={dashboardData.stats} />
					</ChartCard>
				</div>
			{:else if chartConfig}
				<div class="dashboard-section">
					<ChartCard
						chartId={config.nombre_grafico}
						title={config.titulo_display}
						config={chartConfig}
						visible={isVisible}
						isPublic={config.es_publico}
						isWide={false}
						height={350}
						onToggleVisibility={() => participantsDashboardStore.toggleChart(config.nombre_grafico)}
						onTogglePublic={() => requestTogglePublic(config.nombre_grafico)}
						bind:this={chartRefs[config.nombre_grafico]}
					/>
				</div>
			{/if}
		{/each}
	{/if}
</div>

<ExportPDFModal bind:isOpen={showExportModal} availableCharts={availableChartsForExport} />

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
	.dashboard-container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-section {
		margin-bottom: 2rem;
	}

	.section-header {
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
	}

	.error-message {
		padding: 1rem;
		background: #fef2f2;
		border-radius: 8px;
		color: #dc2626;
		margin-bottom: 1.5rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(0, 0, 0, 0.1);
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 1rem;
		}
	}
</style>
