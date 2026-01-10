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
	let refreshInterval: ReturnType<typeof setInterval> | null = null;
	let lastUpdate: Date | null = null;

	Chart.register(...registerables);

	let chartInstances: { [key: string]: Chart } = {};

	// Detectar tema actual
	let isDarkTheme = true;

	function detectTheme() {
		if (typeof window !== 'undefined') {
			isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
		}
	}

	// Configurar colores de Chart.js según el tema
	function getChartColors() {
		return {
			textColor: isDarkTheme ? '#e5e7eb' : '#1f2937',
			gridColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
			borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
		};
	}

	// Cargar datos desde el API público de participantes
	async function cargarDatos() {
		try {
			loading = true;
			error = null;

			// Añadir timestamp para evitar cache de Vercel CDN
			const cacheBuster = `t=${Date.now()}`;
			const response = await fetch(`/api/public/participantes/charts?${cacheBuster}`, {
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
			const result = await response.json();

			if (!result.success) {
				error = result.error || 'Error al cargar datos';
				return;
			}

			data = result.data;
			publicCharts = result.publicCharts || [];
			chartConfigs = result.chartConfigs || [];
			lastUpdate = new Date();
		} catch (err) {
			error = 'Error al conectar con el servidor';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	// Refrescar datos manualmente
	async function refrescarDatos() {
		await cargarDatos();
		// Re-renderizar todos los gráficos después de actualizar
		if (publicCharts && publicCharts.length > 0) {
			publicCharts.forEach((chartName: string) => {
				const canvasId = `chart-${chartName}`;
				if (document.getElementById(canvasId)) {
					renderChart(chartName, canvasId);
				}
			});
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

		// Aplicar colores según el tema
		const colors = getChartColors();

		// Configurar colores de escalas, leyendas y plugins
		if (config.options) {
			// Configurar plugins
			if (config.options.plugins) {
				if (config.options.plugins.legend) {
					config.options.plugins.legend.labels = {
						...config.options.plugins.legend.labels,
						color: colors.textColor
					};
				}
				if (config.options.plugins.tooltip) {
					config.options.plugins.tooltip = {
						...config.options.plugins.tooltip,
						backgroundColor: isDarkTheme ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
						titleColor: colors.textColor,
						bodyColor: colors.textColor,
						borderColor: colors.borderColor,
						borderWidth: 1
					};
				}
			}

			// Configurar escalas
			if (config.options.scales) {
				Object.keys(config.options.scales).forEach((scaleKey) => {
					const scale = config.options.scales[scaleKey];
					if (scale) {
						scale.ticks = {
							...scale.ticks,
							color: colors.textColor
						};
						scale.grid = {
							...scale.grid,
							color: colors.gridColor
						};
					}
				});
			}
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
		detectTheme();

		// Observar cambios de tema
		const observer = new MutationObserver(() => {
			const newTheme = document.documentElement.getAttribute('data-theme') === 'dark';
			if (newTheme !== isDarkTheme) {
				isDarkTheme = newTheme;
				// Re-renderizar gráficos con el nuevo tema
				if (publicCharts && publicCharts.length > 0) {
					publicCharts.forEach((chartName: string) => {
						const canvasId = `chart-${chartName}`;
						renderChart(chartName, canvasId);
					});
				}
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

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

		// Polling periódico cada 30 segundos para actualizaciones
		refreshInterval = setInterval(async () => {
			await refrescarDatos();
		}, 30000);

		// Cleanup on destroy
		return () => {
			observer.disconnect();
			Object.values(chartInstances).forEach((chart) => chart.destroy());
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
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
		<!-- Header con botón de refrescar -->
		<div class="dashboard-header">
			<div class="header-info">
				<h2>📈 Dashboard de Participantes</h2>
				{#if lastUpdate}
					<p class="last-update">
						Última actualización: {lastUpdate.toLocaleTimeString('es-ES', {
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				{/if}
			</div>
			<button class="refresh-button" on:click={refrescarDatos} disabled={loading}>
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
					<path d="M21 2v6h-6" />
					<path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
					<path d="M3 22v-6h6" />
					<path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
				</svg>
				Refrescar
			</button>
		</div>

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

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--color--card-background, rgba(255, 255, 255, 0.05));
		border-radius: 12px;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		flex-wrap: wrap;
		gap: 1rem;

		.header-info {
			flex: 1;
			min-width: 200px;

			h2 {
				margin: 0 0 0.5rem 0;
				font-size: 1.5rem;
				color: var(--color--text);
			}

			.last-update {
				margin: 0;
				font-size: 0.9rem;
				color: var(--color--text-shade);
				opacity: 0.8;
			}
		}
	}

	.refresh-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color--primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1rem;

		svg {
			transition: transform 0.3s ease;
		}

		&:hover:not(:disabled) {
			filter: brightness(1.1);
			transform: translateY(-2px);

			svg {
				transform: rotate(180deg);
			}
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.loading-container,
	.error-message,
	.empty-message {
		background: var(--color--card-background);
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);

		p {
			color: var(--color--text-shade);
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
		border: 4px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 50%;
		border-top: 4px solid var(--color--primary);
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
			background: var(--color--primary);
			color: var(--color--text-inverse);
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
		background: var(--color--card-background);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		box-shadow: var(--card-shadow);
	}

	.chart-header {
		margin-bottom: 1.5rem;

		h3 {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0 0 0.5rem 0;
		}

		.chart-description {
			font-size: 0.875rem;
			color: var(--color--text-shade);
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
		color: var(--color--text-shade);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.participants-dashboard {
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
