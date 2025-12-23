<script lang="ts">
	import StatsCard from './StatsCard.svelte';

	export let stats: {
		total_projects: number;
		total_budget: number;
		completed_count: number;
		in_progress_count: number;
	};

	// Computed values
	$: completionRate =
		stats.total_projects > 0
			? ((stats.completed_count / stats.total_projects) * 100).toFixed(1)
			: '0';

	$: averageBudget = stats.total_projects > 0 ? stats.total_budget / stats.total_projects : 0;

	$: activeProjects = stats.total_projects - stats.completed_count;

	$: pendingProjects = stats.total_projects - stats.completed_count - stats.in_progress_count;

	// Format functions
	function formatCompactNumber(value: number): { short: string; full: string } {
		const fullFormatted = formatCurrency(value);

		if (value >= 1000000) {
			const millions = (value / 1000000).toFixed(1);
			return {
				short: `${millions}M US$`,
				full: fullFormatted
			};
		} else if (value >= 1000) {
			const thousands = (value / 1000).toFixed(1);
			return {
				short: `${thousands}K US$`,
				full: fullFormatted
			};
		}

		return {
			short: fullFormatted,
			full: fullFormatted
		};
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="stats-grid" id="chart-container-stats-grid">
	<StatsCard
		label="Total Proyectos"
		value={stats.total_projects.toLocaleString()}
		icon="projects"
	/>

	<StatsCard
		label="Presupuesto Total"
		value={formatCompactNumber(stats.total_budget).short}
		tooltip={formatCompactNumber(stats.total_budget).full}
		icon="budget"
		isBudget={true}
	/>

	<StatsCard
		label="Promedio por Proyecto"
		value={formatCompactNumber(averageBudget).short}
		tooltip={formatCompactNumber(averageBudget).full}
		icon="average"
		isBudget={true}
	/>

	<StatsCard label="Proyectos Activos" value={activeProjects.toLocaleString()} icon="active" />

	<StatsCard label="Completados" value={stats.completed_count} icon="completed" />

	<StatsCard label="En Progreso" value={stats.in_progress_count} icon="progress" />

	<StatsCard label="Tasa de Finalización" value="{completionRate}%" icon="success-rate" />

	<StatsCard label="Pendientes" value={pendingProjects} icon="pending" />
</div>

<style lang="scss">
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.25rem;
	}

	@media (max-width: 1024px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
