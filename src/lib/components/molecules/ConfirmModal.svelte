<script lang="ts">
	export let isOpen = false;
	export let title = 'Confirmar acción';
	export let icon: 'warning' | 'danger' | 'info' | 'success' = 'warning';
	export let confirmText = 'Confirmar';
	export let cancelText = 'Cancelar';
	export let onConfirm: () => void | Promise<void>;
	export let onCancel: (() => void) | undefined = undefined;
	export let variant: 'danger' | 'primary' | 'success' = 'primary';

	function handleOverlayClick() {
		if (onCancel) {
			onCancel();
		}
		isOpen = false;
	}

	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
		isOpen = false;
	}

	async function handleConfirm() {
		await onConfirm();
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}

	// Definir iconos SVG según el tipo
	const icons = {
		warning: `<path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line stroke-linecap="round" stroke-linejoin="round" x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>`,
		danger: `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
		info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
		success: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`
	};
</script>

{#if isOpen}
	<div
		class="modal-overlay"
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
	>
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="modal-header">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="modal-icon {icon}"
				>
					{@html icons[icon]}
				</svg>
				<h3>{title}</h3>
			</div>

			<div class="modal-body">
				<slot />
			</div>

			<div class="modal-actions">
				<button class="btn-cancel" on:click={handleCancel}>{cancelText}</button>
				<button class="btn-confirm {variant}" on:click={handleConfirm}>{confirmText}</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeInModal 0.3s ease;
		backdrop-filter: blur(4px);
	}

	@keyframes fadeInModal {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: var(--color--card-background, #ffffff);
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		width: 90%;
		animation: slideUp 0.3s ease;
		border: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.1);
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
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 2rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.08);
	}

	.modal-icon {
		color: var(--color--text, #1a1a1a);

		&.warning {
			color: #f59e0b;
		}

		&.danger {
			color: #ef4444;
		}

		&.info {
			color: #3b82f6;
		}

		&.success {
			color: #10b981;
		}
	}

	.modal-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text, #1a1a1a);
		margin: 0;
		text-align: center;
		font-family: var(--font--default);
	}

	.modal-body {
		padding: 1.5rem 2rem;
		color: var(--color--text-shade, #6b7280);
		font-size: 1rem;
		line-height: 1.6;
		font-family: var(--font--default);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		padding: 1.5rem 2rem 2rem;
		justify-content: flex-end;
	}

	.btn-cancel,
	.btn-confirm {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: var(--font--default);
		font-size: 0.95rem;
	}

	.btn-cancel {
		background: rgba(var(--color--text-rgb, 0, 0, 0), 0.06);
		color: var(--color--text, #1a1a1a);

		&:hover {
			background: rgba(var(--color--text-rgb, 0, 0, 0), 0.12);
		}
	}

	.btn-confirm {
		background: var(--color--primary, #6e29e7);
		color: white;

		&:hover {
			background: var(--color--primary-shade, #5a21bb);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
		}

		&.danger {
			background: #ef4444;

			&:hover {
				background: #dc2626;
				box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
			}
		}

		&.success {
			background: #10b981;

			&:hover {
				background: #059669;
				box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
			}
		}
	}
</style>
