<!-- src/lib/components/organisms/PublicChartsSection.svelte -->
<script lang="ts">
	import PublicChartCard from '$lib/components/molecules/PublicChartCard.svelte';
	import type { GraficoConfig } from '$lib/models/admin/chart.model';
	import type { ChartConfiguration } from 'chart.js';

	export let charts: GraficoConfig[];
	export let getChartConfig: (chartName: string) => ChartConfiguration | null;

	const categoryNames: Record<string, string> = {
		overview: 'Resumen General',
		analytics: 'Análisis Detallado',
		geographic: 'Distribución Geográfica'
	};

	// Group charts by category
	$: chartsByCategory = charts.reduce((acc, chart) => {
		if (!acc[chart.tab_categoria]) {
			acc[chart.tab_categoria] = [];
		}
		acc[chart.tab_categoria].push(chart);
		return acc;
	}, {} as Record<string, typeof charts>);
</script>

{#each Object.entries(chartsByCategory) as [category, categoryCharts]}
	<section class="category-section">
		<div class="category-header">
			<h2>{categoryNames[category] || category}</h2>
			<div class="category-divider" />
		</div>
		<div class="charts-grid">
			{#each categoryCharts as chart}
				{@const chartConfig = getChartConfig(chart.nombre_grafico)}
				{#if chartConfig}
					<PublicChartCard
						title={chart.titulo_display}
						description={chart.descripcion}
						chartId="public-chart-{chart.nombre_grafico}"
						config={chartConfig}
						height={chart.nombre_grafico === 'geoMap' ? 450 : 380}
						isWide={chart.nombre_grafico === 'geoMap'}
					/>
				{/if}
			{/each}
		</div>
	</section>
{/each}

<style lang="scss">
	.category-section {
		margin-bottom: 4rem;

		&:last-child {
			margin-bottom: 2rem;
		}
	}

	.category-header {
		margin-bottom: 2rem;

		h2 {
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--color--text, #1a1a1a);
			margin: 0 0 0.75rem 0;
		}

		.category-divider {
			height: 3px;
			width: 80px;
			background: linear-gradient(90deg, var(--color--primary, #3b82f6), transparent);
			border-radius: 2px;
		}
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		gap: 2rem;
	}

	@media (max-width: 1024px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.category-header {
			h2 {
				font-size: 1.5rem;
			}
		}

		.charts-grid {
			gap: 1.5rem;
		}
	}
</style>
