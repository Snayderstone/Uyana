<script lang="ts">
	import StatsCard from './StatsCard.svelte';
	import type { ResumenEjecutivo } from '$lib/models/admin/projects/dashboardProjects';

	export let resumen: ResumenEjecutivo;

	// Computed values
	$: tasaFinalizacion =
		resumen.total_proyectos > 0
			? ((resumen.proyectos_finalizados / resumen.total_proyectos) * 100).toFixed(1)
			: '0';

	$: proyectosActivos = resumen.proyectos_en_ejecucion + resumen.proyectos_en_cierre;

	$: proyectosPendientes =
		resumen.total_proyectos - resumen.proyectos_finalizados - proyectosActivos;

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

	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
	}

	function formatDateRange(): string {
		const inicio = formatDate(resumen.fecha_primer_proyecto);
		const fin = formatDate(resumen.fecha_ultimo_proyecto);
		return `${inicio} → ${fin}`;
	}
</script>

<div class="resumen-grid" id="chart-container-resumenEjecutivo">
	<!-- Row 1: Métricas principales -->
	<StatsCard
		label="Total Proyectos"
		value={resumen.total_proyectos.toLocaleString()}
		icon="projects"
	/>

	<StatsCard
		label="Presupuesto Total"
		value={formatCompactNumber(resumen.presupuesto_total).short}
		tooltip={formatCompactNumber(resumen.presupuesto_total).full}
		icon="budget"
		isBudget={true}
	/>

	<StatsCard
		label="Promedio por Proyecto"
		value={formatCompactNumber(resumen.presupuesto_promedio).short}
		tooltip={formatCompactNumber(resumen.presupuesto_promedio).full}
		icon="average"
		isBudget={true}
	/>

	<StatsCard
		label="Presupuesto Máximo"
		value={formatCompactNumber(resumen.presupuesto_maximo).short}
		tooltip={formatCompactNumber(resumen.presupuesto_maximo).full}
		icon="budget"
		isBudget={true}
	/>

	<!-- Row 2: Estados -->
	<StatsCard
		label="Finalizados"
		value={resumen.proyectos_finalizados.toLocaleString()}
		icon="completed"
	/>

	<StatsCard
		label="En Ejecución"
		value={resumen.proyectos_en_ejecucion.toLocaleString()}
		icon="progress"
	/>

	<StatsCard
		label="En Cierre"
		value={resumen.proyectos_en_cierre.toLocaleString()}
		icon="pending"
	/>

	<StatsCard label="Tasa de Finalización" value="{tasaFinalizacion}%" icon="success-rate" />

	<!-- Row 3: Métricas adicionales -->
	<StatsCard
		label="Avance Promedio Global"
		value="{resumen.avance_promedio_global.toFixed(1)}%"
		icon="progress"
	/>

	<StatsCard
		label="Duración Promedio"
		value="{resumen.duracion_promedio_meses.toFixed(1)} meses"
		icon="active"
	/>

	<StatsCard
		label="Proyectos {resumen.anio_actual}"
		value={resumen.proyectos_anio_actual.toLocaleString()}
		icon="projects"
	/>

	<StatsCard label="Período de Actividad" value={formatDateRange()} icon="active" />
</div>

<style lang="scss">
	.resumen-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.25rem;
	}

	@media (max-width: 1024px) {
		.resumen-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.resumen-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
