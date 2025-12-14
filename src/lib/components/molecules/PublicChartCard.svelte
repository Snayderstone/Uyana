<!-- src/lib/components/molecules/PublicChartCard.svelte -->
<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import ChartRenderer from '$lib/components/admin/ChartRenderer.svelte';
	import type { ChartConfiguration } from 'chart.js';

	export let title: string;
	export let description: string | null = null;
	export let chartId: string;
	export let config: ChartConfiguration;
	export let height: number = 380;
	export let isWide: boolean = false;
</script>

<div class="chart-card-wrapper" class:wide={isWide}>
	<Card additionalClass="chart-card">
		<div slot="content" class="chart-content">
			<div class="chart-header">
				<h3>{title}</h3>
				{#if description}
					<p class="description">{description}</p>
				{/if}
			</div>
			<div class="chart-body">
				<ChartRenderer {chartId} {config} {height} />
			</div>
		</div>
	</Card>
</div>

<style lang="scss">
	.chart-card-wrapper {
		&.wide {
			grid-column: 1 / -1;
		}
	}

	:global(.chart-card) {
		height: 100%;
		transition: all 0.3s ease;

		&:hover {
			transform: translateY(-4px);
			box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
		}
	}

	.chart-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chart-header {
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color--border, #e5e7eb);
		margin-bottom: 1.5rem;

		h3 {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color--text, #1a1a1a);
			margin: 0 0 0.5rem 0;
		}

		.description {
			font-size: 0.875rem;
			color: var(--color--text-shade, #6b7280);
			margin: 0;
			line-height: 1.5;
		}
	}

	.chart-body {
		flex: 1;
		min-height: 300px;
	}
</style>
