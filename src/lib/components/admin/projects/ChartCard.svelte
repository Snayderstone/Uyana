<script lang="ts">
	import ChartRenderer from '$lib/components/admin/ChartRenderer.svelte';
	import type { ChartConfiguration } from 'chart.js';

	export let chartId: string;
	export let title: string;
	export let config: ChartConfiguration | null = null;
	export let visible: boolean = true;
	export let isPublic: boolean = false;
	export let isWide: boolean = false;
	export let height: number = 350;
	export let onToggleVisibility: () => void;
	export let onTogglePublic: () => void;

	let chartRef: any;

	// Expose chart ref for export functionality
	export function getChartRef() {
		return chartRef;
	}
</script>

<div
	class="chart-card"
	class:collapsed={!visible}
	class:wide={isWide}
	id="chart-container-{chartId}"
>
	<div class="chart-header">
		<h3>{title}</h3>
		<div class="chart-actions">
			<button
				class="action-icon-btn"
				class:public={isPublic}
				on:click={onTogglePublic}
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
				on:click={onToggleVisibility}
				title={visible ? 'Ocultar' : 'Mostrar'}
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
					{#if visible}
						<polyline points="18 15 12 9 6 15" />
					{:else}
						<polyline points="6 9 12 15 18 9" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if visible}
		<div class="chart-body">
			<slot>
				{#if config}
					<ChartRenderer chartId="chart-{chartId}" {config} {height} bind:this={chartRef} />
				{/if}
			</slot>
		</div>
	{/if}
</div>

<style lang="scss">
	.chart-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.chart-card:hover {
		box-shadow: var(--card-shadow);
	}

	.chart-card.wide {
		grid-column: span 2;
	}

	.chart-card.collapsed {
		opacity: 0.7;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		background: rgba(var(--color--text-rgb), 0.03);
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.chart-card.collapsed .chart-header {
		border-radius: 12px;
	}

	.chart-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
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
		background: rgba(var(--color--text-rgb), 0.08);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 6px;
		color: var(--color--text);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-icon-btn:hover {
		background: rgba(var(--color--text-rgb), 0.12);
		transform: scale(1.05);
	}

	.action-icon-btn.public {
		background: #10b981;
		color: white;
		border: 1px solid #10b981;
	}

	.action-icon-btn.public:hover {
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
	}

	.chart-body {
		padding: 1.5rem;
	}

	@media (max-width: 1024px) {
		.chart-card.wide {
			grid-column: span 1;
		}
	}

	@media (max-width: 768px) {
		.chart-header {
			padding: 1rem;
		}

		.chart-header h3 {
			font-size: 1rem;
		}

		.chart-body {
			padding: 1rem;
		}
	}
</style>
