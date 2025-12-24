<script lang="ts">
	import ConfirmModal from './ConfirmModal.svelte';

	export let isOpen = false;
	export let availableCharts: Array<{
		id: string;
		title: string;
		tab?: string;
	}>;
	export let onExport: (selectedIds: string[]) => Promise<void>;
	export let onCancel: (() => void) | undefined = undefined;
	export let title: string = 'Exportar Dashboard a PDF';

	let selectedCharts: Set<string> = new Set();
	let isExporting = false;
	let exportProgress = 0;

	function toggleChartSelection(chartId: string) {
		if (selectedCharts.has(chartId)) {
			selectedCharts.delete(chartId);
		} else {
			selectedCharts.add(chartId);
		}
		selectedCharts = selectedCharts;
	}

	function selectAllCharts() {
		selectedCharts = new Set(availableCharts.map((c) => c.id));
	}

	function deselectAllCharts() {
		selectedCharts = new Set();
	}

	async function handleExport() {
		if (selectedCharts.size === 0) {
			alert('Por favor selecciona al menos un gráfico para exportar');
			return;
		}

		isExporting = true;
		exportProgress = 0;

		try {
			await onExport(Array.from(selectedCharts));
			isOpen = false;
			selectedCharts = new Set();
		} catch (error) {
			console.error('Error exporting PDF:', error);
			alert('❌ Error al exportar el PDF');
		} finally {
			isExporting = false;
			exportProgress = 0;
		}
	}

	function handleCancel() {
		if (!isExporting) {
			if (onCancel) onCancel();
			isOpen = false;
			selectedCharts = new Set();
		}
	}

	// Función para actualizar progreso (puede ser llamada externamente)
	export function updateProgress(progress: number) {
		exportProgress = progress;
	}
</script>

<div
	class="modal-overlay"
	class:visible={isOpen}
	on:click={handleCancel}
	on:keydown={(e) => e.key === 'Escape' && handleCancel()}
	role="dialog"
	aria-modal="true"
>
	{#if isOpen}
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="modal-header">
				<h2>{title}</h2>
				<button class="close-btn" on:click={handleCancel} disabled={isExporting}>×</button>
			</div>

			<div class="modal-body">
				{#if isExporting}
					<div class="export-progress">
						<div class="progress-spinner" />
						<p class="progress-text">Generando PDF...</p>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {exportProgress}%" />
						</div>
						<p class="progress-percent">{exportProgress}%</p>
					</div>
				{:else}
					<div class="selection-controls">
						<button class="control-btn" on:click={selectAllCharts}>Seleccionar Todos</button>
						<button class="control-btn" on:click={deselectAllCharts}>Deseleccionar Todos</button>
						<span class="selection-count"
							>{selectedCharts.size} de {availableCharts.length} seleccionados</span
						>
					</div>

					<div class="charts-list">
						{#each availableCharts as chart}
							<label class="chart-item">
								<input
									type="checkbox"
									checked={selectedCharts.has(chart.id)}
									on:change={() => toggleChartSelection(chart.id)}
								/>
								<span class="chart-name">{chart.title}</span>
								{#if chart.tab}
									<span class="chart-tab">{chart.tab}</span>
								{/if}
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="cancel-btn" on:click={handleCancel} disabled={isExporting}>
					Cancelar
				</button>
				<button
					class="export-btn"
					on:click={handleExport}
					disabled={isExporting || selectedCharts.size === 0}
				>
					{#if isExporting}
						Exportando...
					{:else}
						Descargar PDF
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease;

		&.visible {
			opacity: 1;
			pointer-events: all;
		}
	}

	.modal-content {
		background: var(--color--card-background, white);
		border-radius: 16px;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease-out;
		border: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.08);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.08);
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text, #1a1a1a);
		margin: 0;
		font-family: var(--font--default);
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: none;
		background: rgba(var(--color--text-rgb, 0, 0, 0), 0.05);
		color: var(--color--text-shade, #6b7280);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb, 0, 0, 0), 0.1);
			color: var(--color--text, #1a1a1a);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.modal-body {
		padding: 1.5rem 2rem;
		overflow-y: auto;
		flex: 1;
	}

	.export-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
	}

	.progress-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(var(--color--primary-rgb, 110, 41, 231), 0.2);
		border-top-color: var(--color--primary, #6e29e7);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.progress-text {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text, #1a1a1a);
		font-family: var(--font--default);
		margin: 0;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgba(var(--color--text-rgb, 0, 0, 0), 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6e29e7, #8b5cf6);
		transition: width 0.3s ease;
		border-radius: 4px;
	}

	.progress-percent {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color--primary, #6e29e7);
		font-family: var(--font--default);
		margin: 0;
	}

	.selection-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.control-btn {
		padding: 0.5rem 1rem;
		background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.1);
		color: var(--color--primary, #6e29e7);
		border: 1px solid rgba(var(--color--primary-rgb, 110, 41, 231), 0.2);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: var(--font--default);

		&:hover {
			background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.15);
			border-color: rgba(var(--color--primary-rgb, 110, 41, 231), 0.3);
		}
	}

	.selection-count {
		margin-left: auto;
		font-size: 0.875rem;
		color: var(--color--text-shade, #6b7280);
		font-weight: 500;
		font-family: var(--font--default);
	}

	.charts-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.chart-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color--card-background, white);
		border: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: var(--font--default);

		&:hover {
			background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.05);
			border-color: rgba(var(--color--primary-rgb, 110, 41, 231), 0.2);
		}

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			cursor: pointer;
			accent-color: var(--color--primary, #6e29e7);
		}
	}

	.chart-name {
		flex: 1;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color--text, #1a1a1a);
	}

	.chart-tab {
		font-size: 0.75rem;
		padding: 0.25rem 0.625rem;
		background: rgba(var(--color--text-rgb, 0, 0, 0), 0.05);
		color: var(--color--text-shade, #6b7280);
		border-radius: 4px;
		text-transform: capitalize;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		padding: 1.5rem 2rem;
		border-top: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.08);
		justify-content: flex-end;
	}

	.cancel-btn,
	.export-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		font-family: var(--font--default);

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}
	}

	.cancel-btn {
		background: rgba(var(--color--text-rgb, 0, 0, 0), 0.06);
		color: var(--color--text, #1a1a1a);

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb, 0, 0, 0), 0.12);
		}
	}

	.export-btn {
		background: var(--color--primary, #6e29e7);
		color: white;

		&:hover:not(:disabled) {
			background: var(--color--primary-shade, #5a21bb);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
		}
	}
</style>
