<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { chartGenerators } from '$lib/utils/projectsOptimizedChartConfigs';
	import ResumenEjecutivoProyectos from '$lib/components/admin/projects/ResumenEjecutivoProyectos.svelte';

	interface ChartConfig {
		nombre: string;
		titulo: string;
		descripcion: string;
		tipo: string;
	}

	interface PageData {
		success: boolean;
		data: any;
		publicCharts: string[];
		chartConfigs: ChartConfig[];
		error?: string;
		message?: string;
	}

	export let data: PageData;

	// Ordenar chartConfigs para que el resumen ejecutivo aparezca primero
	$: sortedChartConfigs = [...(data.chartConfigs || [])].sort((a, b) => {
		const isAResumen = a.nombre === 'proyectos_resumen_ejecutivo';
		const isBResumen = b.nombre === 'proyectos_resumen_ejecutivo';
		if (isAResumen && !isBResumen) return -1;
		if (!isAResumen && isBResumen) return 1;
		return 0;
	});

	Chart.register(...registerables);

	let chartInstances: { [key: string]: Chart } = {};

	function renderChart(chartName: string, canvasId: string) {
		// Cleanup existing chart
		if (chartInstances[canvasId]) {
			chartInstances[canvasId].destroy();
		}

		const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
		if (!canvas) return;

		const generator = chartGenerators[chartName];
		if (!generator) {
			console.warn(`No generator found for chart: ${chartName}`);
			return;
		}

		// Adaptar estructura de datos: los generadores esperan data.analytics pero API devuelve data directo
		const adaptedData = {
			analytics: data.data
		};

		const config = generator(adaptedData);

		// Si retorna null, es un componente especial (ResumenEjecutivo)
		if (config === null) {
			return;
		}

		const ctx = canvas.getContext('2d');
		if (ctx) {
			chartInstances[canvasId] = new Chart(ctx, config);
		}
	}

	onMount(() => {
		// Renderizar gráficos solo en el cliente
		if (data.publicCharts && data.publicCharts.length > 0) {
			setTimeout(() => {
				data.publicCharts.forEach((chartName: string) => {
					const canvasId = `chart-${chartName}`;
					renderChart(chartName, canvasId);
				});
			}, 100);
		}

		// Cleanup on destroy
		return () => {
			Object.values(chartInstances).forEach((chart) => chart.destroy());
		};
	});

	function isSpecialComponent(chartName: string): boolean {
		return chartName === 'proyectos_resumen_ejecutivo';
	}

	function isResumenComponent(chartName: string): boolean {
		return chartName === 'proyectos_resumen_ejecutivo';
	}
</script>

<svelte:head>
	<title>Estadísticas de Proyectos - Uyana</title>
	<meta name="description" content="Estadísticas públicas sobre proyectos de investigación" />
</svelte:head>

<div class="estadisticas-page">
	<header class="page-header">
		<h1>Estadísticas de Proyectos</h1>
		<p>Visualización pública de datos estadísticos</p>
	</header>

	{#if !data.success}
		<div class="error-message">
			<h3>⚠️ Error al cargar datos</h3>
			<p>{data.error || 'No se pudieron cargar las estadísticas'}</p>
		</div>
	{:else if data.publicCharts.length === 0}
		<div class="empty-message">
			<h3>📊 Sin gráficos públicos</h3>
			<p>{data.message || 'No hay estadísticas públicas disponibles en este momento'}</p>
		</div>
	{:else}
		<div class="charts-grid">
			{#each sortedChartConfigs as config}
				<div class="chart-card">
					<div class="chart-header">
						<h2>{config.titulo}</h2>
						{#if config.descripcion}
							<p class="chart-description">{config.descripcion}</p>
						{/if}
					</div>

					<div class="chart-content">
						{#if isResumenComponent(config.nombre)}
							{#if data.data.resumen}
								<ResumenEjecutivoProyectos resumen={data.data.resumen} />
							{:else}
								<p class="no-data">No hay datos de resumen disponibles</p>
							{/if}
						{:else}
							<div class="chart-wrapper">
								<canvas id="chart-{config.nombre}" />
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.estadisticas-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	.page-header {
		margin-bottom: 3rem;
		text-align: center;

		h1 {
			font-size: 2.5rem;
			font-weight: 700;
			color: var(--text-primary, #ffffff);
			margin-bottom: 0.5rem;
		}

		p {
			font-size: 1.125rem;
			color: var(--text-secondary, rgba(255, 255, 255, 0.7));
		}
	}

	.error-message,
	.empty-message {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		border: 1px solid rgba(255, 255, 255, 0.1);

		h3 {
			font-size: 1.5rem;
			margin-bottom: 1rem;
			color: var(--text-primary, #ffffff);
		}

		p {
			color: var(--text-secondary, rgba(255, 255, 255, 0.7));
			font-size: 1.125rem;
		}
	}

	.error-message {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.1);

		h3 {
			color: #ef4444;
		}
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.chart-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
	}

	.chart-header {
		margin-bottom: 1.5rem;

		h2 {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--text-primary, #ffffff);
			margin-bottom: 0.5rem;
		}

		.chart-description {
			font-size: 0.875rem;
			color: var(--text-secondary, rgba(255, 255, 255, 0.6));
		}
	}

	.chart-content {
		min-height: 300px;
	}

	.chart-wrapper {
		position: relative;
		height: 400px;
		width: 100%;

		canvas {
			max-height: 400px;
		}
	}

	.no-data {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary, rgba(255, 255, 255, 0.5));
		font-style: italic;
	}

	@media (max-width: 768px) {
		.estadisticas-page {
			padding: 1rem;
		}

		.page-header {
			margin-bottom: 2rem;

			h1 {
				font-size: 1.75rem;
			}

			p {
				font-size: 1rem;
			}
		}

		.chart-wrapper {
			height: 300px;

			canvas {
				max-height: 300px;
			}
		}
	}
</style>
