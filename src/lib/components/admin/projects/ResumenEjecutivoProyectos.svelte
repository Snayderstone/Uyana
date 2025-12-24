<script lang="ts">
	import type { ResumenEjecutivo } from '$lib/models/admin/projects/dashboardProjects';

	export let resumen: ResumenEjecutivo;

	// Formatear números grandes
	function formatNumber(value: number): string {
		return new Intl.NumberFormat('es-ES').format(value);
	}

	// Formatear moneda
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	// Formatear fecha
	function formatDate(date: Date | string): string {
		try {
			const d = new Date(date);
			return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
		} catch (e) {
			return 'N/A';
		}
	}
</script>

<div class="resumen-grid">
	{#if resumen}
		<!-- Fila 1: Métricas principales de proyectos -->
		<div class="stat-card">
			<span class="stat-label">Total Proyectos</span>
			<span class="stat-value">{formatNumber(resumen.total_proyectos || 0)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Proyectos Finalizados</span>
			<span class="stat-value">{formatNumber(resumen.proyectos_finalizados || 0)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">En Ejecución</span>
			<span class="stat-value">{formatNumber(resumen.proyectos_en_ejecucion || 0)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">En Cierre</span>
			<span class="stat-value">{formatNumber(resumen.proyectos_en_cierre || 0)}</span>
		</div>

		<!-- Fila 2: Métricas de presupuesto -->
		<div class="stat-card highlight">
			<span class="stat-label">Presupuesto Total</span>
			<span class="stat-value">{formatCurrency(resumen.presupuesto_total || 0)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Presupuesto Promedio</span>
			<span class="stat-value">{formatCurrency(resumen.presupuesto_promedio || 0)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Presupuesto Máximo</span>
			<span class="stat-value">{formatCurrency(resumen.presupuesto_maximo || 0)}</span>
		</div>

		<!-- Fila 3: Métricas de avance y duración -->
		<div class="stat-card">
			<span class="stat-label">Avance Promedio Global</span>
			<span class="stat-value">{(resumen.avance_promedio_global || 0).toFixed(1)}%</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Duración Promedio</span>
			<span class="stat-value">{(resumen.duracion_promedio_meses || 0).toFixed(0)} meses</span>
		</div>

		<!-- Fila 4: Fechas y año actual -->
		<div class="stat-card">
			<span class="stat-label">Primer Proyecto</span>
			<span class="stat-value small">{formatDate(resumen.fecha_primer_proyecto)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Último Proyecto</span>
			<span class="stat-value small">{formatDate(resumen.fecha_ultimo_proyecto)}</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Proyectos en {resumen.anio_actual || new Date().getFullYear()}</span>
			<span class="stat-value">{formatNumber(resumen.proyectos_anio_actual || 0)}</span>
		</div>
	{:else}
		<div class="error-stats">No hay datos de resumen disponibles</div>
	{/if}
</div>

<style lang="scss">
	.resumen-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.25rem;
	}

	.stat-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: all 0.2s ease;

		&:hover {
			background: rgba(255, 255, 255, 0.08);
			border-color: rgba(59, 130, 246, 0.5);
			transform: translateY(-2px);
		}

		&.highlight {
			border-color: rgba(16, 185, 129, 0.5);
			background: rgba(16, 185, 129, 0.1);

			.stat-value {
				color: #10b981;
			}
		}

		.stat-label {
			font-size: 0.875rem;
			color: rgba(255, 255, 255, 0.7);
			font-weight: 500;
		}

		.stat-value {
			font-size: 1.5rem;
			font-weight: 700;
			color: #ffffff;

			&.small {
				font-size: 1.125rem;
			}
		}
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
