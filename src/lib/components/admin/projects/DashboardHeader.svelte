<script lang="ts">
	export let lastUpdate: string = '';
	export let loading: boolean = false;
	export let onExport: () => void;
</script>

<div class="dashboard-header">
	<div class="header-title">
		<h1>Dashboard de Proyectos</h1>
		{#if lastUpdate}
			<p class="last-update">Última actualización: {lastUpdate}</p>
		{/if}
	</div>
	<div class="header-actions">
		<button class="action-btn export-btn" on:click={onExport} disabled={loading}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7 10 12 15 17 10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
			Exportar Dashboard
		</button>
	</div>
</div>

<style lang="scss">
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--color--card-background);
		border-radius: 12px;
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.header-title h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--color--text);
	}

	.last-update {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(var(--color--text-rgb), 0.08);
		color: var(--color--text);
		border: 1px solid rgba(var(--color--text-rgb), 0.15);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.export-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border: none;
	}

	.export-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.dashboard-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-title h1 {
			font-size: 1.5rem;
		}

		.header-actions {
			width: 100%;
		}

		.action-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>
