<script lang="ts">
	import type { CatalogStats } from '$lib/services/admin/catalog/catalog.service';
	import { onMount } from 'svelte';

	export let allStats: Map<string, CatalogStats>;
	export let loading = false;

	let totalItems = 0;
	let totalWithDescription = 0;
	let totalCatalogs = 0;
	let averageCompletion = 0;
	let catalogsData: { name: string; count: number }[] = [];

	$: if (allStats) {
		calculateGlobalStats();
	}

	function calculateGlobalStats() {
		totalItems = 0;
		totalWithDescription = 0;
		totalCatalogs = allStats.size;
		catalogsData = [];

		allStats.forEach((stats, catalogName) => {
			totalItems += stats.total;
			totalWithDescription += stats.withDescription;
			catalogsData.push({
				name: catalogName,
				count: stats.total
			});
		});

		averageCompletion = totalItems > 0 ? Math.round((totalWithDescription / totalItems) * 100) : 0;

		// Ordenar por cantidad
		catalogsData.sort((a, b) => b.count - a.count);
	}

	// Para el gráfico simple de barras
	let maxCount = 0;
	$: maxCount = Math.max(...catalogsData.map((d) => d.count), 1);
</script>

<div class="global-stats">
	<h2 class="section-title">Resumen General</h2>

	{#if loading}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando estadísticas...</p>
		</div>
	{:else}
		<!-- KPIs Globales -->
		<div class="global-kpis">
			<div class="global-kpi">
				<div class="kpi-value">{totalCatalogs}</div>
				<div class="kpi-label">Catálogos</div>
				<div class="kpi-icon">📚</div>
			</div>

			<div class="global-kpi">
				<div class="kpi-value">{totalItems}</div>
				<div class="kpi-label">Total Elementos</div>
				<div class="kpi-icon">📊</div>
			</div>

			<div class="global-kpi">
				<div class="kpi-value">{totalWithDescription}</div>
				<div class="kpi-label">Con Descripción</div>
				<div class="kpi-icon">📝</div>
			</div>

			<div class="global-kpi highlight">
				<div class="kpi-value">{averageCompletion}%</div>
				<div class="kpi-label">Completitud Promedio</div>
				<div class="kpi-icon">✅</div>
			</div>
		</div>

		<!-- Gráfico de barras simple -->
		<div class="chart-section">
			<h3 class="chart-title">Distribución de Elementos por Catálogo</h3>
			<div class="bar-chart">
				{#each catalogsData.slice(0, 10) as catalog}
					<div class="bar-item">
						<div class="bar-label">{catalog.name}</div>
						<div class="bar-wrapper">
							<div
								class="bar-fill"
								style="width: {(catalog.count / maxCount) * 100}%"
								title="{catalog.name}: {catalog.count} elementos"
							>
								<span class="bar-value">{catalog.count}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.global-stats {
		background: var(--color--card-background);
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.section-title {
		margin: 0 0 1.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
		font-family: var(--font--default);
		letter-spacing: -0.3px;
	}

	.global-kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.global-kpi {
		background: var(--color--page-background);
		border-radius: 8px;
		padding: 1.25rem;
		text-align: center;
		position: relative;
		overflow: hidden;
		transition: all 0.2s var(--ease-out-3);
		border: 1px solid rgba(var(--color--text-rgb), 0.06);

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
			border-color: rgba(var(--color--text-rgb), 0.12);
		}

		&.highlight {
			background: var(--color--primary);
			border-color: var(--color--primary);

			.kpi-value,
			.kpi-label {
				color: var(--color--text-inverse);
			}

			.kpi-icon {
				opacity: 0.2;
			}
		}
	}

	.kpi-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color--primary);
		margin-bottom: 0.375rem;
		line-height: 1;
		font-family: var(--font--default);
	}

	.kpi-label {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-family: var(--font--default);
	}

	.kpi-icon {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		font-size: 1.5rem;
		opacity: 0.15;
	}

	.chart-section {
		margin-top: 2rem;
	}

	.chart-title {
		margin: 0 0 1rem 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color--text);
		font-family: var(--font--default);
	}

	.bar-chart {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bar-item {
		display: grid;
		grid-template-columns: 140px 1fr;
		align-items: center;
		gap: 1rem;
	}

	.bar-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color--text);
		text-align: right;
		text-transform: capitalize;
		font-family: var(--font--default);
	}

	.bar-wrapper {
		background: rgba(var(--color--text-rgb), 0.06);
		border-radius: 4px;
		height: 28px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--color--primary);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0 0.625rem;
		transition: width 0.6s var(--ease-out-3);
		min-width: fit-content;
	}

	.bar-value {
		color: var(--color--text-inverse);
		font-weight: 600;
		font-size: 0.75rem;
		white-space: nowrap;
		font-family: var(--font--default);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: var(--color--text-shade);
		font-family: var(--font--default);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.global-stats {
			padding: 1.25rem;
		}

		.global-kpis {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}

		.global-kpi {
			padding: 1rem;
		}

		.kpi-value {
			font-size: 1.75rem;
		}

		.bar-item {
			grid-template-columns: 90px 1fr;
			gap: 0.5rem;
		}

		.bar-label {
			font-size: 0.75rem;
		}
	}
</style>
