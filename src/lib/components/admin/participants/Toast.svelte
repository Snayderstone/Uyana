<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let message: string = '';
	export let type: 'success' | 'error' | 'info' = 'info';
	export let duration: number = 3000;

	const dispatch = createEventDispatcher();

	let visible = true;

	onMount(() => {
		const timer = setTimeout(() => {
			visible = false;
			setTimeout(() => {
				dispatch('close');
			}, 300);
		}, duration);

		return () => clearTimeout(timer);
	});

	function close() {
		visible = false;
		setTimeout(() => {
			dispatch('close');
		}, 300);
	}

	function getIcon() {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'info':
			default:
				return 'ℹ';
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div class="toast toast-{type}" class:visible on:click={close} role="alert" tabindex="0">
	<div class="toast-icon">{getIcon()}</div>
	<div class="toast-message">{message}</div>
	<button class="toast-close" on:click={close} aria-label="Cerrar">×</button>
</div>

<style lang="scss">
	.toast {
		position: fixed;
		top: 20px;
		right: 20px;
		min-width: 300px;
		max-width: 500px;
		padding: 1rem 1.5rem;
		background: var(--color-background);
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 10000;
		cursor: pointer;
		transform: translateX(120%);
		transition: transform 0.3s ease;

		&.visible {
			transform: translateX(0);
		}

		&.toast-success {
			border-left: 4px solid #10b981;

			.toast-icon {
				background: rgba(16, 185, 129, 0.1);
				color: #10b981;
			}
		}

		&.toast-error {
			border-left: 4px solid #ef4444;

			.toast-icon {
				background: rgba(239, 68, 68, 0.1);
				color: #ef4444;
			}
		}

		&.toast-info {
			border-left: 4px solid #3b82f6;

			.toast-icon {
				background: rgba(59, 130, 246, 0.1);
				color: #3b82f6;
			}
		}

		.toast-icon {
			width: 32px;
			height: 32px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: bold;
			font-size: 1.125rem;
			flex-shrink: 0;
		}

		.toast-message {
			flex: 1;
			color: var(--color-text);
			font-size: 0.875rem;
			font-weight: 500;
		}

		.toast-close {
			width: 24px;
			height: 24px;
			border: none;
			background: transparent;
			color: var(--color-text-secondary);
			font-size: 1.5rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			transition: background 0.2s ease;
			flex-shrink: 0;

			&:hover {
				background: var(--color-background-hover);
			}
		}
	}

	@media (max-width: 768px) {
		.toast {
			top: 10px;
			right: 10px;
			left: 10px;
			min-width: auto;
		}
	}
</style>
