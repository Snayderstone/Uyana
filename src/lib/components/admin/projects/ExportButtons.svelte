<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let selectedIds: number[] = [];
	export let disabled = false;

	const dispatch = createEventDispatcher();

	let isExporting = false;
	let exportingFormat: string | null = null;

	async function handleExport(format: 'json' | 'excel' | 'csv') {
		if (disabled || isExporting) return;

		isExporting = true;
		exportingFormat = format;

		try {
			const params = new URLSearchParams();
			if (selectedIds.length > 0) {
				params.append('ids', selectedIds.join(','));
			}
			params.append('format', format);

			const response = await fetch(`/api/admin/export?${params.toString()}`);

			if (!response.ok) {
				throw new Error('Error al exportar');
			}

			// Get filename from Content-Disposition header
			const contentDisposition = response.headers.get('Content-Disposition');
			let filename = `proyectos_${new Date().toISOString().split('T')[0]}`;

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?(.+)"?/);
				if (match) {
					filename = match[1];
				}
			}

			// Download file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			dispatch('exportSuccess', { format, count: selectedIds.length || 'todos' });
		} catch (error) {
			dispatch('exportError', { format, error: error.message });
		} finally {
			isExporting = false;
			exportingFormat = null;
		}
	}

	async function handleGenerateReport(
		type: 'individual' | 'consolidated',
		format: 'pdf' | 'docx' = 'pdf'
	) {
		if (disabled || isExporting) return;

		if (type === 'individual' && selectedIds.length !== 1) {
			dispatch('exportError', {
				format: 'report',
				error: 'Selecciona exactamente un proyecto para generar el informe individual'
			});
			return;
		}

		if (type === 'consolidated' && selectedIds.length === 0) {
			dispatch('exportError', {
				format: 'report',
				error: 'Selecciona al menos un proyecto para generar el informe consolidado'
			});
			return;
		}

		isExporting = true;
		exportingFormat = `report-${type}`;

		try {
			const params = new URLSearchParams();
			params.append('type', type);
			params.append('format', format);

			if (type === 'individual') {
				params.append('id', selectedIds[0].toString());
			} else {
				params.append('ids', selectedIds.join(','));
			}

			const response = await fetch(`/api/admin/reports?${params.toString()}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al generar informe');
			}

			// Get filename from Content-Disposition header
			const contentDisposition = response.headers.get('Content-Disposition');
			let filename = `informe_${type}_${new Date().toISOString().split('T')[0]}.${format}`;

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?(.+)"?/);
				if (match) {
					filename = match[1];
				}
			}

			// Download file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			dispatch('exportSuccess', { format: `report-${type}`, count: selectedIds.length });
		} catch (error) {
			dispatch('exportError', { format: 'report', error: error.message });
		} finally {
			isExporting = false;
			exportingFormat = null;
		}
	}
</script>

<div class="export-buttons">
	<div class="button-group">
		<span class="group-label">📊 Exportar Datos:</span>
		<button
			class="export-btn json"
			on:click={() => handleExport('json')}
			disabled={disabled || isExporting}
			title="Exportar a JSON"
		>
			{#if isExporting && exportingFormat === 'json'}
				⏳ Exportando...
			{:else}
				📄 JSON
			{/if}
		</button>
		<button
			class="export-btn excel"
			on:click={() => handleExport('excel')}
			disabled={disabled || isExporting}
			title="Exportar a Excel"
		>
			{#if isExporting && exportingFormat === 'excel'}
				⏳ Exportando...
			{:else}
				📊 Excel
			{/if}
		</button>
		<button
			class="export-btn csv"
			on:click={() => handleExport('csv')}
			disabled={disabled || isExporting}
			title="Exportar a CSV"
		>
			{#if isExporting && exportingFormat === 'csv'}
				⏳ Exportando...
			{:else}
				📋 CSV
			{/if}
		</button>
	</div>

	<div class="button-group">
		<span class="group-label">📝 Generar Informes:</span>
		<button
			class="export-btn report"
			on:click={() => handleGenerateReport('individual', 'pdf')}
			disabled={disabled || isExporting || selectedIds.length !== 1}
			title="Generar informe individual (PDF) - Selecciona 1 proyecto"
		>
			{#if isExporting && exportingFormat === 'report-individual'}
				⏳ Generando...
			{:else}
				📄 Individual (PDF)
			{/if}
		</button>
		<button
			class="export-btn report"
			on:click={() => handleGenerateReport('individual', 'docx')}
			disabled={disabled || isExporting || selectedIds.length !== 1}
			title="Generar informe individual (Word) - Selecciona 1 proyecto"
		>
			{#if isExporting && exportingFormat === 'report-individual'}
				⏳ Generando...
			{:else}
				📝 Individual (Word)
			{/if}
		</button>
		<button
			class="export-btn report"
			on:click={() => handleGenerateReport('consolidated', 'pdf')}
			disabled={disabled || isExporting || selectedIds.length === 0}
			title="Generar informe consolidado (PDF) - Selecciona proyectos"
		>
			{#if isExporting && exportingFormat === 'report-consolidated'}
				⏳ Generando...
			{:else}
				📑 Consolidado (PDF)
			{/if}
		</button>
	</div>

	{#if selectedIds.length > 0}
		<div class="selection-info">
			<span class="info-icon">ℹ️</span>
			<span class="info-text">
				{selectedIds.length} proyecto{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !==
				1
					? 's'
					: ''}
			</span>
		</div>
	{/if}
</div>

<style>
	.export-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 12px;
	}

	.button-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.group-label {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color--text-secondary, #666);
		white-space: nowrap;
	}

	.export-btn {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.export-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.export-btn.json {
		background: #673ab7;
		color: white;
	}

	.export-btn.json:hover:not(:disabled) {
		background: #5e35b1;
	}

	.export-btn.excel {
		background: #4caf50;
		color: white;
	}

	.export-btn.excel:hover:not(:disabled) {
		background: #43a047;
	}

	.export-btn.csv {
		background: #2196f3;
		color: white;
	}

	.export-btn.csv:hover:not(:disabled) {
		background: #1e88e5;
	}

	.export-btn.report {
		background: #ff9800;
		color: white;
	}

	.export-btn.report:hover:not(:disabled) {
		background: #fb8c00;
	}

	.selection-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #e3f2fd;
		border-radius: 8px;
		margin-left: auto;
	}

	.info-icon {
		font-size: 1.1rem;
	}

	.info-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: #1976d2;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.export-buttons {
			flex-direction: column;
			align-items: stretch;
		}

		.button-group {
			flex-direction: column;
			align-items: stretch;
		}

		.group-label {
			text-align: center;
		}

		.export-btn {
			width: 100%;
			justify-content: center;
		}

		.selection-info {
			margin-left: 0;
			justify-content: center;
		}
	}

	@media (max-width: 768px) {
		.export-buttons {
			padding: 0.75rem;
			gap: 1rem;
		}

		.button-group {
			gap: 0.5rem;
		}

		.export-btn {
			padding: 0.7rem 1rem;
			font-size: 0.85rem;
		}

		.group-label {
			font-size: 0.85rem;
		}
	}
</style>
