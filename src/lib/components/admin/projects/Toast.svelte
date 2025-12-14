<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let message: string = '';
	export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
	export let duration: number = 5000;
	export let visible: boolean = false;

	let timeoutId: ReturnType<typeof setTimeout>;

	$: if (visible && duration > 0) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			visible = false;
		}, duration);
	}

	function handleClose() {
		visible = false;
		clearTimeout(timeoutId);
	}

	function getIcon(toastType: string): string {
		switch (toastType) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'warning':
				return '⚠️';
			case 'info':
				return 'ℹ️';
			default:
				return 'ℹ️';
		}
	}

	function getProgressColor(toastType: string): string {
		switch (toastType) {
			case 'success':
				return '#4CAF50';
			case 'error':
				return '#F44336';
			case 'warning':
				return '#FF9800';
			case 'info':
				return '#2196F3';
			default:
				return '#2196F3';
		}
	}
</script>

{#if visible}
	<div class="toast toast-{type}" transition:fly={{ y: -20, duration: 300, easing: quintOut }}>
		<div class="toast-content">
			<span class="toast-icon">{getIcon(type)}</span>
			<p class="toast-message">{message}</p>
			<button class="toast-close" on:click={handleClose}> ✕ </button>
		</div>
		{#if duration > 0}
			<div
				class="toast-progress"
				style="background: {getProgressColor(type)}; animation-duration: {duration}ms;"
			/>
		{/if}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 9999;
		min-width: 300px;
		max-width: 500px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		overflow: hidden;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
	}

	.toast-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		margin: 0;
		font-size: 0.95rem;
		color: var(--color--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: #666;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #000;
	}

	.toast-progress {
		height: 4px;
		width: 100%;
		animation: shrink linear forwards;
	}

	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	/* Type variants */
	.toast-success {
		border-left: 4px solid #4caf50;
	}

	.toast-error {
		border-left: 4px solid #f44336;
	}

	.toast-warning {
		border-left: 4px solid #ff9800;
	}

	.toast-info {
		border-left: 4px solid #2196f3;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.toast {
			top: 10px;
			right: 10px;
			left: 10px;
			min-width: unset;
			max-width: unset;
		}

		.toast-content {
			padding: 0.875rem 1rem;
		}

		.toast-message {
			font-size: 0.9rem;
		}

		.toast-icon {
			font-size: 1.3rem;
		}
	}
</style>
