<script lang="ts">
	import { StatCard } from '$lib/components/molecules';
	
	export let stats: {
		total_participantes: number;
		total_acreditados: number;
		total_masculino: number;
		total_femenino: number;
	};
	export let visible: boolean = true;
	export let isPublic: boolean = false;
	
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('es-ES').format(num);
	}
	
	function getPercentage(value: number, total: number): number {
		return total > 0 ? Math.round((value / total) * 100) : 0;
	}
</script>

<div class="chart-card stats-grid-card" class:collapsed={!visible}>
	<div class="chart-header">
		<h3>Estadísticas Generales</h3>
		<div class="chart-actions">
			<button
				class="action-icon-btn"
				class:public={isPublic}
				on:click
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
				on:click
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
		<div class="chart-body stats-grid-body">
			<div class="stats-grid" id="chart-container-participants-stats-grid">
				<StatCard
					icon="projects"
					value={formatNumber(stats.total_participantes)}
					label="Total Participantes"
					variant="default"
				/>

				<StatCard
					icon="completed"
					value={formatNumber(stats.total_acreditados)}
					label="Acreditados"
					percentage={`${getPercentage(
						stats.total_acreditados,
						stats.total_participantes
					)}% del total`}
					variant="default"
				/>

				<StatCard
					icon="progress"
					value={formatNumber(stats.total_masculino)}
					label="Masculino"
					percentage={`${getPercentage(
						stats.total_masculino,
						stats.total_participantes
					)}% del total`}
					variant="default"
				/>

				<StatCard
					icon="progress"
					value={formatNumber(stats.total_femenino)}
					label="Femenino"
					percentage={`${getPercentage(
						stats.total_femenino,
						stats.total_participantes
					)}% del total`}
					variant="default"
				/>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.chart-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s var(--ease-out-3);
		margin-bottom: 2rem;

		&:hover {
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		}

		&.collapsed {
			.chart-body {
				display: none;
			}
		}
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		h3 {
			font-size: 1.25rem;
			font-weight: 700;
			margin: 0;
		}
	}

	.chart-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-icon-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: rgba(var(--color--text-rgb), 0.05);
		border-radius: 6px;
		color: var(--color--text);
		cursor: pointer;
		transition: all 0.2s var(--ease-out-3);

		&:hover {
			background: rgba(var(--color--text-rgb), 0.1);
		}

		&.public {
			background: rgba(16, 185, 129, 0.1);
			color: #10b981;

			&:hover {
				background: rgba(16, 185, 129, 0.2);
			}
		}
	}

	.stats-grid-body {
		padding: 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
</style>
