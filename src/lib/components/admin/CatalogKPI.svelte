<script lang="ts">
	import type { CatalogStats } from '$lib/services/admin/catalog/catalog.service';

	export let stats: CatalogStats;
	export let label: string;
	export let icon: string = '📊';
	export let loading = false;

	$: completionRate = stats.total > 0 ? Math.round((stats.withDescription / stats.total) * 100) : 0;
</script>

<div class="kpi-card" class:loading>
	{#if loading}
		<div class="spinner" />
	{:else}
		<div class="kpi-header">
			<span class="kpi-icon">{icon}</span>
			<h3 class="kpi-label">{label}</h3>
		</div>

		<div class="kpi-metrics">
			<div class="metric-primary">
				<div class="metric-value">{stats.total}</div>
				<div class="metric-label">Total</div>
			</div>

			<div class="metrics-secondary">
				<div class="metric">
					<div class="metric-value small">{stats.withDescription}</div>
					<div class="metric-label">Con descripción</div>
				</div>
				<div class="metric">
					<div class="metric-value small">{stats.withoutDescription}</div>
					<div class="metric-label">Sin descripción</div>
				</div>
			</div>
		</div>

		<div class="kpi-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {completionRate}%" />
			</div>
			<div class="progress-label">{completionRate}% completo</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.kpi-card {
		background: var(--color--card-background);
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		transition: all 0.2s var(--ease-out-3);
		min-height: 220px;
		display: flex;
		flex-direction: column;

		&:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
			transform: translateY(-2px);
			border-color: rgba(var(--color--text-rgb), 0.12);
		}

		&.loading {
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.kpi-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.kpi-icon {
		font-size: 1.75rem;
		line-height: 1;
	}

	.kpi-label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color--text);
		font-family: var(--font--default);
		letter-spacing: -0.2px;
	}

	.kpi-metrics {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.metric-primary {
		text-align: center;
		padding: 0.5rem 0;

		.metric-value {
			font-size: 2.5rem;
			font-weight: 700;
			color: var(--color--primary);
			line-height: 1;
			margin-bottom: 0.5rem;
			font-family: var(--font--default);
		}

		.metric-label {
			font-size: 0.75rem;
			color: var(--color--text-shade);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			font-weight: 600;
			font-family: var(--font--default);
		}
	}

	.metrics-secondary {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.metric {
		text-align: center;

		.metric-value {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color--text);
			margin-bottom: 0.25rem;
			font-family: var(--font--default);

			&.small {
				font-size: 1.25rem;
			}
		}

		.metric-label {
			font-size: 0.6875rem;
			color: var(--color--text-shade);
			font-family: var(--font--default);
		}
	}

	.kpi-progress {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.progress-bar {
		height: 6px;
		background: rgba(var(--color--text-rgb), 0.06);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--color--primary);
		border-radius: 3px;
		transition: width 0.5s var(--ease-out-3);
	}

	.progress-label {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		text-align: center;
		font-family: var(--font--default);
		font-weight: 500;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.kpi-card {
			min-height: 180px;
			padding: 1.25rem;
		}

		.metric-primary .metric-value {
			font-size: 2rem;
		}
	}
</style>
