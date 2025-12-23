<script lang="ts">
	import StatsCard from './StatsCard.svelte';
	import type { ParticipantsStats } from '$lib/models/admin/participants/dashboardParticipants.model';

	export let stats: ParticipantsStats;

	// Computed values
	$: tasaAcreditacion =
		stats && stats.total_participantes > 0
			? ((stats.total_acreditados / stats.total_participantes) * 100).toFixed(1)
			: '0';

	$: porcentajeMasculino =
		stats && stats.total_participantes > 0
			? ((stats.total_masculino / stats.total_participantes) * 100).toFixed(1)
			: '0';

	$: porcentajeFemenino =
		stats && stats.total_participantes > 0
			? ((stats.total_femenino / stats.total_participantes) * 100).toFixed(1)
			: '0';
</script>

<div class="resumen-grid">
	{#if stats}
		<!-- Row 1: Métricas principales -->
		<StatsCard
			label="Total Participantes"
			value={stats.total_participantes?.toLocaleString() || '0'}
			icon="participants"
		/>

		<StatsCard
			label="Acreditados"
			value={stats.total_acreditados?.toLocaleString() || '0'}
			icon="acredited"
		/>

		<StatsCard
			label="No Acreditados"
			value={stats.total_no_acreditados?.toLocaleString() || '0'}
			icon="participants"
		/>

		<StatsCard label="Tasa de Acreditación" value="{tasaAcreditacion}%" icon="acredited" />

		<!-- Row 2: Distribución por género -->
		<StatsCard
			label="Masculino"
			value={stats.total_masculino?.toLocaleString() || '0'}
			tooltip="{porcentajeMasculino}% del total"
			icon="male"
		/>

		<StatsCard
			label="Femenino"
			value={stats.total_femenino?.toLocaleString() || '0'}
			tooltip="{porcentajeFemenino}% del total"
			icon="female"
		/>

		<StatsCard
			label="Otro Género"
			value={stats.total_otro_genero?.toLocaleString() || '0'}
			icon="participants"
		/>

		<StatsCard
			label="Distribución de Género"
			value="{porcentajeMasculino}% / {porcentajeFemenino}%"
			tooltip="Masculino / Femenino"
			icon="participants"
		/>
	{:else}
		<div class="error-stats">No hay datos de estadísticas disponibles</div>
	{/if}
</div>

<style lang="scss">
	.resumen-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.25rem;
	}

	.error-stats {
		grid-column: 1 / -1;
		padding: 2rem;
		text-align: center;
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 8px;
	}

	@media (max-width: 1024px) {
		.resumen-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.resumen-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
