<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	export let status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
	export let showTooltip = true;
	export let compact = false;

	const dispatch = createEventDispatcher<{
		retry: void;
	}>();

	$: statusConfig = {
		connected: {
			color: 'var(--color--callout-accent--success)',
			label: 'Conectado',
			icon: '✓',
			pulse: true
		},
		connecting: {
			color: 'var(--color--primary)',
			label: 'Conectando...',
			icon: '◌',
			pulse: true
		},
		disconnected: {
			color: 'var(--color--text-shade)',
			label: 'Desconectado',
			icon: '○',
			pulse: false
		},
		error: {
			color: 'var(--color--callout-accent--error)',
			label: 'Error de conexión',
			icon: '⚠',
			pulse: false
		}
	};

	$: config = statusConfig[status];
</script>

<div class="status-indicator" class:compact>
	<div
		class="status-dot"
		class:pulse={config.pulse}
		style="background-color: {config.color}"
		title={showTooltip ? config.label : ''}
	>
		{#if status === 'connecting'}
			<div class="spinner" transition:scale={{ duration: 200 }}>
				<svg width="12" height="12" viewBox="0 0 24 24">
					<circle
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="3"
						fill="none"
						stroke-dasharray="60"
						stroke-dashoffset="60"
					>
						<animate
							attributeName="stroke-dashoffset"
							values="60;0;60"
							dur="1.5s"
							repeatCount="indefinite"
						/>
					</circle>
				</svg>
			</div>
		{/if}
	</div>

	{#if !compact}
		<span class="status-label" style="color: {config.color}">
			{config.label}
		</span>
	{/if}

	{#if status === 'error'}
		<button
			class="retry-button"
			on:click={() => dispatch('retry')}
			transition:fade={{ duration: 200 }}
			title="Reintentar conexión"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
				<path
					d="M1 4V10H7M23 20V14H17"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M3.51 15A9 9 0 0 0 18.36 18.36L23 14"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	{/if}
</div>

<style lang="scss">
	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		user-select: none;

		&.compact {
			gap: 0;
		}
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.pulse {
			animation: pulse 2s infinite;
		}
	}

	.spinner {
		position: absolute;
		color: currentColor;
		opacity: 0.8;
	}

	.status-label {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.retry-button {
		background: none;
		border: none;
		color: var(--color--callout-accent--error);
		cursor: pointer;
		padding: 2px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		opacity: 0.7;

		&:hover {
			opacity: 1;
			background-color: rgba(var(--color--callout-accent--error), 0.1);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	@keyframes pulse {
		0% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.1);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
