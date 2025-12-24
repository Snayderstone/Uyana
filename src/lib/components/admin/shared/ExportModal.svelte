<script lang="ts">
	import { icons } from './Icons';

	export let show = false;
	export let totalItems = 0;
	export let exportFormat: 'csv' | 'excel' = 'csv';
	export let exporting = false;
	export let onExport: () => void | Promise<void>;
	export let onClose: () => void;
	export let entityName = 'registros';

	function handleOverlayClick() {
		if (!exporting) {
			onClose();
		}
	}

	async function handleExport() {
		await onExport();
	}
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={handleOverlayClick}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Exportar {entityName}</h3>
				<button class="btn-close" on:click={onClose} disabled={exporting}>
					<span class="icon">{icons.close}</span>
				</button>
			</div>
			<div class="modal-body">
				<div class="form-group">
					<label for="export-format">Formato de exportación</label>
					<div class="radio-group" id="export-format" role="group">
						<label>
							<input type="radio" bind:group={exportFormat} value="csv" disabled={exporting} />
							CSV (Excel)
						</label>
						<label>
							<input type="radio" bind:group={exportFormat} value="excel" disabled={exporting} />
							Excel (.xlsx)
						</label>
					</div>
				</div>
				<p class="help-text">
					Se exportarán {totalItems}
					{totalItems === 1 ? entityName.slice(0, -1) : entityName} con los filtros aplicados.
				</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={onClose} disabled={exporting}>
					Cancelar
				</button>
				<button class="btn btn-primary" on:click={handleExport} disabled={exporting}>
					{exporting ? 'Exportando...' : 'Exportar'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;

		.modal {
			background: var(--color--card-background);
			border-radius: 12px;
			width: 100%;
			max-width: 500px;
			box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

			.modal-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 1.5rem;
				border-bottom: 1px solid var(--color--border);

				h3 {
					font-size: 1.25rem;
					font-weight: 600;
					color: var(--color--text);
					margin: 0;
				}
			}

			.modal-body {
				padding: 1.5rem;

				.form-group {
					margin-bottom: 1.5rem;

					label {
						display: block;
						font-size: 0.875rem;
						font-weight: 500;
						color: var(--color--text);
						margin-bottom: 0.75rem;
					}

					.radio-group {
						display: flex;
						flex-direction: column;
						gap: 0.75rem;

						label {
							display: flex;
							align-items: center;
							gap: 0.5rem;
							font-weight: normal;
							margin-bottom: 0;
							cursor: pointer;

							input[type='radio'] {
								cursor: pointer;

								&:disabled {
									cursor: not-allowed;
								}
							}
						}
					}
				}

				.help-text {
					font-size: 0.875rem;
					color: var(--color--text-shade);
					margin: 0;
				}
			}

			.modal-footer {
				display: flex;
				justify-content: flex-end;
				gap: 0.75rem;
				padding: 1.5rem;
				border-top: 1px solid var(--color--border);
			}
		}
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border: 1px solid transparent;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;

		&.btn-primary {
			background: linear-gradient(135deg, var(--color--primary), #5a1fb8);
			color: white;

			&:hover:not(:disabled) {
				transform: translateY(-2px);
				box-shadow: 0 8px 16px rgba(110, 41, 231, 0.3);
			}
		}

		&.btn-secondary {
			background: var(--color--background);
			border-color: var(--color--border);
			color: var(--color--text);

			&:hover:not(:disabled) {
				background: var(--color--hover);
			}
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btn-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--color--text);
		cursor: pointer;
		transition: all 0.15s ease;

		&:hover:not(:disabled) {
			background: var(--color--hover);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.icon {
			font-size: 1.25rem;
		}
	}
</style>
