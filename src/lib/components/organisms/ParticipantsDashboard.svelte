<!-- src/lib/components/organisms/ParticipantsDashboard.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { participantsChartGenerators } from '$lib/utils/participantsOptimizedChartConfigs';
	import ResumenEjecutivo from '$lib/components/admin/participants/ResumenEjecutivo.svelte';
	import ParticipantsLeaderboard from '$lib/components/admin/participants/ParticipantsLeaderboard.svelte';

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

	Chart.register(...registerables);

	let chartInstances: { [key: string]: Chart } = {};

	// Cargar datos desde el API público de participantes
	async function cargarDatos() {
		try {
			loading = true;
			error = null;

			const response = await fetch('/api/public/participantes/charts');
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

		const generator = participantsChartGenerators[chartName];
		if (!generator) {
			console.warn(`No generator found for chart: ${chartName}`);
			return;
		}

		const config = generator(data);

		// Si retorna null, es un componente especial (ResumenEjecutivo o Leaderboard)
		if (config === null) {
			return;
		}

		const ctx = canvas.getContext('2d');
		if (ctx) {
			chartInstances[canvasId] = new Chart(ctx, config);
		}
	}

	function isSpecialComponent(chartName: string): boolean {
		return (
			chartName === 'participantes_resumen_ejecutivo' ||
			chartName === 'participantes_resumen' ||
			chartName === 'participantes_top_proyectos' ||
			chartName === 'participantes_leaderboard'
		);
	}

	function isResumenComponent(chartName: string): boolean {
		return chartName === 'participantes_resumen_ejecutivo' || chartName === 'participantes_resumen';
	}

	function isLeaderboardComponent(chartName: string): boolean {
		return chartName === 'participantes_top_proyectos' || chartName === 'participantes_leaderboard';
	}

	// Separar gráficos por sección
	$: leaderboardCharts = chartConfigs.filter((config) => isLeaderboardComponent(config.nombre));
	$: dashboardCharts = chartConfigs
		.filter((config) => !isLeaderboardComponent(config.nombre))
		.sort((a, b) => {
			// Priorizar resumen ejecutivo
			const isAResumen = isResumenComponent(a.nombre);
			const isBResumen = isResumenComponent(b.nombre);
			if (isAResumen && !isBResumen) return -1;
			if (!isAResumen && isBResumen) return 1;
			return 0;
		});

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

<div class="participants-dashboard">
	{#if loading}
		<div class="loading-container">
			<div class="loader" />
			<p>Cargando estadísticas de participantes...</p>
		</div>
	{:else if error}
		<div class="error-message">
			<h3>⚠️ Error al cargar datos</h3>
			<p>{error}</p>
			<button on:click={cargarDatos}>Intentar de nuevo</button>
		</div>
	{:else if publicCharts.length === 0}
		<div class="empty-message">
			<h3>📊 Sin estadísticas disponibles</h3>
			<p>No hay datos de participantes disponibles en este momento</p>
		</div>
	{:else}
		<!-- Dashboard de Participantes (sin leaderboard) -->
		{#if dashboardCharts.length > 0}
			<div class="charts-grid">
				{#each dashboardCharts as config}
					<div class="chart-card">
						<div class="chart-header">
							<h3>{config.titulo}</h3>
							{#if config.descripcion}
								<p class="chart-description">{config.descripcion}</p>
							{/if}
						</div>

						<div class="chart-content">
							{#if isResumenComponent(config.nombre)}
								{#if data.stats}
									<ResumenEjecutivo stats={data.stats} />
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
	{/if}
</div>

<style lang="scss">
	.participants-dashboard {
		width: 100%;
		padding: 0;
		min-height: 400px;
	}

	.dashboard-section {
		margin-bottom: 4rem;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.section-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color--text, #1a1a1a);
		margin-bottom: 0.5rem;
		background: linear-gradient(90deg, var(--color--primary) 0%, var(--color--secondary) 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-block;
	}

	.section-description {
		font-size: 1.125rem;
		color: var(--color--text-shade, #666);
		margin-top: 0.5rem;
	}

	.loading-container,
	.error-message,
	.empty-message {
		background: var(--color--card-background, rgba(255, 255, 255, 0.05));
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		border: 1px solid var(--color--border, rgba(255, 255, 255, 0.1));

		h3 {
			font-size: 1.5rem;
			margin-bottom: 1rem;
			color: var(--color--text, #1a1a1a);
		}

		p {
			color: var(--color--text-shade, #666);
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
		border: 4px solid var(--color--border, rgba(0, 0, 0, 0.1));
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
		border-color: var(--color--callout-accent--error, rgba(239, 68, 68, 0.3));
		background: color-mix(in srgb, var(--color--callout-accent--error, #ef4444) 10%, transparent);

		h3 {
			color: #ef4444;
		}

		button {
			padding: 0.75rem 1.5rem;
			background: var(--color--primary, #3b82f6);
			color: var(--color--button-text, white);
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
		background: var(--color--card-background, rgba(255, 255, 255, 0.05));
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--color--border, rgba(255, 255, 255, 0.1));
		backdrop-filter: blur(10px);

		&.leaderboard-card {
			background: linear-gradient(
				135deg,
				color-mix(in srgb, var(--color--primary) 5%, transparent),
				color-mix(in srgb, var(--color--secondary) 5%, transparent)
			);
			border: 2px solid color-mix(in srgb, var(--color--primary) 30%, transparent);
		}
	}

	.chart-header {
		margin-bottom: 1.5rem;

		h3 {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color--text, #1a1a1a);
			margin: 0 0 0.5rem 0;
		}

		.chart-description {
			font-size: 0.875rem;
			color: var(--color--text-shade, #666);
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
		color: var(--color--text-shade, #999);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.participants-dashboard {
			padding: 0;
		}

		.section-title {
			font-size: 1.5rem;
		}

		.section-description {
			font-size: 1rem;
		}

		.dashboard-section {
			margin-bottom: 3rem;
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
