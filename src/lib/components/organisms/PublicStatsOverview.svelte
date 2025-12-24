<!-- src/lib/components/organisms/PublicStatsOverview.svelte -->
<script lang="ts">
	import StatCard from '$lib/components/atoms/StatCard.svelte';

	export let totalProjects: number;
	export let totalBudget: number;
	export let completedCount: number;
	export let inProgressCount: number;

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	const projectsIcon = `
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
			<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
		</svg>
	`;

	const budgetIcon = `
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="12" y1="1" x2="12" y2="23"/>
			<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
		</svg>
	`;

	const completedIcon = `
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
			<polyline points="22 4 12 14.01 9 11.01"/>
		</svg>
	`;

	const progressIcon = `
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="10"/>
			<polyline points="12 6 12 12 16 14"/>
		</svg>
	`;
</script>

<div class="stats-grid">
	<StatCard
		title="Total de Proyectos"
		value={totalProjects.toLocaleString()}
		icon={projectsIcon}
		colorVarName="--color--primary"
	/>
	<StatCard
		title="Inversión Total"
		value={formatCurrency(totalBudget)}
		icon={budgetIcon}
		colorVarName="--color--success"
	/>
	<StatCard
		title="Proyectos Completados"
		value={completedCount}
		icon={completedIcon}
		colorVarName="--color--accent"
	/>
	<StatCard
		title="En Progreso"
		value={inProgressCount}
		icon={progressIcon}
		colorVarName="--color--warning"
	/>
</div>

<style lang="scss">
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
