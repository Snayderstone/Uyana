<script lang="ts">
	import type { GraficoConfig } from '$lib/models/admin';
	import ChartRenderer from '$lib/components/admin/ChartRenderer.svelte';

	export let title: string;
	export let description: string;
	export let chartConfigs: GraficoConfig[];
	export let dashboardData: any;
	export let visibleCharts: Record<string, boolean>;
	export let onToggleChart: (chartName: string) => void;
	export let onTogglePublic: (chartName: string) => void;
	export let getChartGenerator: (chartName: string) => any;

	let chartRefs: Record<string, any> = {};
</script>

<div class="section-header">
	<div class="section-header-content">
		<h2>{title}</h2>
		<p class="section-description">{description}</p>
	</div>
</div>

<div class="charts-grid">
	{#each chartConfigs as config (config.nombre_grafico)}
		{@const chartGenerator = getChartGenerator(config.nombre_grafico)}
		{@const isVisible = visibleCharts[config.nombre_grafico]}
		{@const isPublic = config.es_publico}

		{#if chartGenerator}
			<div
				class="chart-card"
				class:collapsed={!isVisible}
				id="chart-container-{config.nombre_grafico}"
			>
				<div class="chart-header">
					<h3>{config.titulo_display}</h3>
					<div class="chart-actions">
						<button
							class="action-icon-btn"
							class:public={isPublic}
							on:click={() => onTogglePublic(config.nombre_grafico)}
							title={isPublic ? 'Público' : 'Privado'}
						>
							{#if isPublic}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10" />
									<line x1="2" y1="12" x2="22" y2="12" />
									<path
										d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							{/if}
						</button>
						<button
							class="action-icon-btn"
							on:click={() => onToggleChart(config.nombre_grafico)}
							title={isVisible ? 'Ocultar' : 'Mostrar'}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								{#if isVisible}
									<polyline points="18 15 12 9 6 15" />
								{:else}
									<polyline points="6 9 12 15 18 9" />
								{/if}
							</svg>
						</button>
					</div>
				</div>

				{#if isVisible}
					<div class="chart-body">
						<ChartRenderer
							chartId="chart-{config.nombre_grafico}"
							config={chartGenerator(dashboardData)}
							height={350}
							bind:this={chartRefs[config.nombre_grafico]}
						/>
					</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>

<style>
	.section-header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.08);
	}

	.section-header-content {
		flex: 1;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.5rem 0;
		font-family: var(--font--default);
	}

	.section-description {
		color: var(--color--text-shade);
		font-size: 0.95rem;
		margin: 0;
		line-height: 1.5;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		gap: 2rem;
		min-height: 400px;
	}

	.chart-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s var(--ease-out-3);
	}

	.chart-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border-color: rgba(var(--color--text-rgb), 0.15);
	}

	.chart-card.collapsed {
		background: rgba(var(--color--text-rgb), 0.02);
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: var(--color--card-background);
	}

	.chart-card.collapsed .chart-header {
		border-bottom: none;
	}

	.chart-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
	}

	.chart-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: rgba(var(--color--text-rgb), 0.05);
		border: none;
		border-radius: 6px;
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s var(--ease-out-3);
	}

	.action-icon-btn:hover {
		background: rgba(var(--color--text-rgb), 0.1);
		color: var(--color--text);
	}

	.action-icon-btn.public {
		background: #dcfce7;
		color: #059669;
	}

	.action-icon-btn.public:hover {
		background: #bbf7d0;
	}

	.chart-body {
		padding: 1.5rem;
		background: var(--color--card-background);
	}

	@media (max-width: 1024px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
