<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;
	export let title = '';
	export let size: 'small' | 'medium' | 'large' | 'fullscreen' = 'medium';
	export let onClose: (() => void) | undefined = undefined;

	function handleClose() {
		if (onClose) {
			onClose();
		} else {
			isOpen = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			handleClose();
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if isOpen}
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="button"
		tabindex="0"
		aria-label="Cerrar modal"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="modal-container {size}"
			transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
			on:click|stopPropagation
			on:keydown
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<header class="modal-header">
				<h2 id="modal-title">{title}</h2>
				<button class="modal-close" on:click={handleClose} aria-label="Cerrar" title="Cerrar (Esc)">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</header>

			<div class="modal-body">
				<slot />
			</div>

			{#if $$slots.footer}
				<footer class="modal-footer">
					<slot name="footer" />
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-backdrop {
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
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-container {
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		max-height: 90vh;
		width: 100%;
		position: relative;

		&.small {
			max-width: 400px;
		}

		&.medium {
			max-width: 600px;
		}

		&.large {
			max-width: 1200px;
		}

		&.fullscreen {
			max-width: 95vw;
			max-height: 95vh;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

		h2 {
			margin: 0;
			font-size: 1.5rem;
			font-family: var(--font--title);
			color: var(--color--text);
			font-weight: 600;
		}
	}

	.modal-close {
		background: transparent;
		border: none;
		color: var(--color--text-shade);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;

		&:hover {
			background: rgba(var(--color--text-rgb), 0.1);
			color: var(--color--text);
		}

		&:active {
			transform: scale(0.95);
		}

		svg {
			width: 20px;
			height: 20px;
		}
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
		color: var(--color--text);

		/* Estilos del scrollbar */
		&::-webkit-scrollbar {
			width: 8px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(var(--color--text-rgb), 0.05);
			border-radius: 4px;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--text-rgb), 0.2);
			border-radius: 4px;

			&:hover {
				background: rgba(var(--color--text-rgb), 0.3);
			}
		}
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		.modal-container {
			max-height: 95vh;
			border-radius: 12px 12px 0 0;

			&.large,
			&.fullscreen {
				max-width: 100%;
			}
		}

		.modal-backdrop {
			align-items: flex-end;
			padding: 0;
		}
	}
</style>
