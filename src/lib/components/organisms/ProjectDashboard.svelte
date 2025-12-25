<!-- src/lib/components/organisms/ProjectDashboard.svelte -->
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

	let loading = true;
	let error: string | null = null;
	let data: any = {};
	let publicCharts: string[] = [];
	let chartConfigs: ChartConfig[] = [];

	// Ordenar chartConfigs para que el resumen ejecutivo aparezca primero
	$: sortedChartConfigs = [...chartConfigs].sort((a, b) => {
		const isAResumen = a.nombre === 'proyectos_resumen_ejecutivo';
		const isBResumen = b.nombre === 'proyectos_resumen_ejecutivo';
		if (isAResumen && !isBResumen) return -1;
		if (!isAResumen && isBResumen) return 1;
		return 0;
	});

	Chart.register(...registerables);

	let chartInstances: { [key: string]: Chart } = {};

	// Cargar datos desde el API público
	async function cargarDatos() {
		try {
			loading = true;
			error = null;

			const response = await fetch('/api/public/proyectos/charts');
			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Error al cargar datos';
				return;
			}

			data = result.data;
			publicCharts = result.publicCharts || [];
			chartConfigs = result.chartConfigs || [];
		} catch (err) {
			error = 'Error al conectar con el servidor';
			console.error(err);
		} finally {
			loading = false;
		}
	}

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
			analytics: data
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

	function isResumenComponent(chartName: string): boolean {
		return chartName === 'proyectos_resumen_ejecutivo';
	}

	onMount(() => {
		cargarDatos().then(() => {
			// Renderizar gráficos solo después de cargar los datos
			if (publicCharts && publicCharts.length > 0) {
				setTimeout(() => {
					publicCharts.forEach((chartName: string) => {
						const canvasId = `chart-${chartName}`;
						renderChart(chartName, canvasId);
					});
				}, 100);
			}
		});

		// Cleanup on destroy
		return () => {
			Object.values(chartInstances).forEach((chart) => chart.destroy());
		};
	});
</script>

<div class="dashboard-page">
	{#if loading}
		<div class="loading-container">
			<div class="loader" />
			<p>Cargando estadísticas del dashboard...</p>
		</div>
	{:else if error}
		<div class="error-message">
			<h3>⚠️ Error al cargar datos</h3>
			<p>{error}</p>
			<button on:click={cargarDatos}>Intentar de nuevo</button>
		</div>
	{:else if publicCharts.length === 0}
		<div class="empty-message">
			<h3>📊 Sin gráficos disponibles</h3>
			<p>No hay estadísticas disponibles en este momento</p>
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
							{#if data.resumen}
								<ResumenEjecutivoProyectos resumen={data.resumen} />
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
	.dashboard-page {
		width: 100%;
		padding: 0;
		min-height: 400px;
	}

	.loading-container,
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
			margin-bottom: 1rem;
		}
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.loader {
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		border-top: 4px solid var(--color--primary, #3b82f6);
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-message {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.1);

		h3 {
			color: #ef4444;
		}

		button {
			padding: 0.75rem 1.5rem;
			background: var(--color--primary, #3b82f6);
			color: white;
			border: none;
			border-radius: 8px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			font-size: 1rem;

			&:hover {
				filter: brightness(1.1);
				transform: translateY(-2px);
			}
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
		.dashboard-page {
			padding: 0;
		}

		.chart-card {
			padding: 1rem;
		}

		.chart-wrapper {
			height: 300px;

			canvas {
				max-height: 300px;
			}
		}
	}
</style>
