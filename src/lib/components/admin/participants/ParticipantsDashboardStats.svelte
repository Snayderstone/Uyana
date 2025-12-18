<script lang="ts">
	export let stats: {
		total_participantes: number;
		total_investigadores: number;
		total_facultades: number;
		total_carreras: number;
		total_cargos: number;
		tasa_participacion: string;
	};

	export let statsGridVisible = true;
	export let statsGridPublic = false;
	export let onToggleVisible: () => void;
	export let onTogglePublic: () => void;
</script>

<div class="chart-card stats-grid-card" class:collapsed={!statsGridVisible}>
	<div class="chart-header">
		<h3>Estadísticas Generales de Participantes</h3>
		<div class="chart-actions">
			<button
				class="action-icon-btn"
				class:public={statsGridPublic}
				on:click={onTogglePublic}
				title={statsGridPublic ? 'Público' : 'Privado'}
			>
				{#if statsGridPublic}
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
				on:click={onToggleVisible}
				title={statsGridVisible ? 'Ocultar' : 'Mostrar'}
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
					{#if statsGridVisible}
						<polyline points="18 15 12 9 6 15" />
					{:else}
						<polyline points="6 9 12 15 18 9" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if statsGridVisible}
		<div class="chart-body stats-grid-body">
			<div class="stats-grid" id="chart-container-participants-stats-grid">
				<!-- Total Participantes -->
				<div class="stat-card">
					<div class="stat-icon participants">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="stat-label">Total Participantes</p>
						<p class="stat-value">{stats.total_participantes.toLocaleString()}</p>
					</div>
				</div>

				<!-- Investigadores Principales -->
				<div class="stat-card">
					<div class="stat-icon researchers">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<polyline points="16 11 18 13 22 9" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="stat-label">Investigadores Principales</p>
						<p class="stat-value">{stats.total_investigadores.toLocaleString()}</p>
					</div>
				</div>

				<!-- Facultades -->
				<div class="stat-card">
					<div class="stat-icon faculties">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
							<polyline points="9 22 9 12 15 12 15 22" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="stat-label">Facultades</p>
						<p class="stat-value">{stats.total_facultades.toLocaleString()}</p>
					</div>
				</div>

				<!-- Carreras -->
				<div class="stat-card">
					<div class="stat-icon careers">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
							<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="stat-label">Carreras</p>
						<p class="stat-value">{stats.total_carreras.toLocaleString()}</p>
					</div>
				</div>

				<!-- Cargos -->
				<div class="stat-card">
					<div class="stat-icon positions">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
							<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="stat-label">Cargos Únicos</p>
						<p class="stat-value">{stats.total_cargos.toLocaleString()}</p>
					</div>
				</div>

				<!-- Tasa de Participación -->
				<div class="stat-card">
					<div class="stat-icon participation">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
					</div>
					<div class="stat-content">
						<p class="stat-label">Tasa de Participación</p>
						<p class="stat-value">{stats.tasa_participacion}%</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s var(--ease-out-3);
		margin-bottom: 2rem;
	}

	.chart-card.collapsed {
		background: rgba(var(--color--text-rgb), 0.02);
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: var(--color--card-background);
	}

	.chart-card.collapsed .chart-header {
		border-bottom: none;
	}

	.chart-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
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
		padding: 0;
		background: rgba(var(--color--text-rgb), 0.05);
		border: none;
		border-radius: 6px;
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s var(--ease-out-3);
	}

	.action-icon-btn:hover {
		background: rgba(var(--color--text-rgb), 0.1);
		color: var(--color--text);
	}

	.action-icon-btn.public {
		background: #dcfce7;
		color: #059669;
	}

	.action-icon-btn.public:hover {
		background: #bbf7d0;
	}

	.chart-body {
		padding: 1.5rem;
		background: var(--color--card-background);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		transition: all 0.3s var(--ease-out-3);
	}

	.stat-card:hover {
		border-color: var(--color--primary);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.1);
		transform: translateY(-2px);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 12px;
		flex-shrink: 0;
	}

	.stat-icon.participants {
		background: #dbeafe;
		color: #3b82f6;
	}

	.stat-icon.researchers {
		background: #dcfce7;
		color: #16a34a;
	}

	.stat-icon.faculties {
		background: #fef3c7;
		color: #f59e0b;
	}

	.stat-icon.careers {
		background: #e0e7ff;
		color: #6366f1;
	}

	.stat-icon.positions {
		background: #fce7f3;
		color: #ec4899;
	}

	.stat-icon.participation {
		background: #d1fae5;
		color: #10b981;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0 0 0.25rem 0;
		font-family: var(--font--default);
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
		word-break: break-word;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: 1.5rem;
		}
	}
</style>
